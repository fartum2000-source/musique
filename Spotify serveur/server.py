# -*- coding: utf-8 -*-
"""
Serveur Pulse
- Site web local
- Lecture audio YouTube via yt-dlp
- Cache audio
- Téléchargement MP3
- Spotify public
- Support HTTP Range pour le lecteur audio
- Compatible Cloudflare Tunnel
"""

from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from pathlib import Path
import mimetypes
import os
import re
import shutil
import tempfile
import urllib.parse
import urllib.request
import json
import html as html_lib

try:
    import yt_dlp
except ImportError:
    yt_dlp = None

try:
    import imageio_ffmpeg
except ImportError:
    imageio_ffmpeg = None


# ============================================================
# CONFIGURATION
# ============================================================

HOST = "127.0.0.1"
PORT = 8000

ROOT = Path(__file__).resolve().parent

CACHE = ROOT / ".audio_cache"
CACHE.mkdir(exist_ok=True)

VIDEO_ID_RE = re.compile(r"^[A-Za-z0-9_-]{11}$")


# ============================================================
# UTILITAIRES
# ============================================================

def safe_name(value):
    value = re.sub(
        r'[<>:"/\\|?*\x00-\x1f]',
        "_",
        str(value or "Musique")
    )

    value = re.sub(r"\s+", " ", value).strip()

    return value[:100] or "Musique"


def ffmpeg_exe():
    """
    Retourne FFmpeg même s'il n'est pas installé
    directement dans le PATH Windows.
    """

    if imageio_ffmpeg:
        try:
            path = imageio_ffmpeg.get_ffmpeg_exe()

            if path and Path(path).exists():
                return path

        except Exception:
            pass

    return (
        shutil.which("ffmpeg")
        or shutil.which("ffmpeg.exe")
    )


def ydl_base():
    return {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "retries": 3,
        "fragment_retries": 3,
        "concurrent_fragment_downloads": 4,
    }


def find_cached(video_id):
    """
    Cherche un fichier audio déjà téléchargé.
    """

    for p in CACHE.glob(f"{video_id}.*"):

        if p.is_file() and p.stat().st_size > 0:
            return p

    return None


# ============================================================
# SERVEUR
# ============================================================

class Handler(SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        super().__init__(
            *args,
            directory=str(ROOT),
            **kwargs
        )

    # --------------------------------------------------------
    # HEAD
    # --------------------------------------------------------

    def do_HEAD(self):
        parsed = urlparse(self.path)

        if parsed.path == "/stream":
            params = parse_qs(parsed.query)

            try:
                video_id = params.get(
                    "videoId",
                    [""]
                )[0]

                path = self.prepare_audio(video_id)

                self.send_audio_headers(
                    path,
                    start=0,
                    end=path.stat().st_size - 1,
                    partial=False
                )

            except Exception as exc:
                self.send_text_error(
                    500,
                    f"Lecture impossible : {exc}"
                )

            return

        super().do_HEAD()

    # --------------------------------------------------------
    # GET
    # --------------------------------------------------------

    def do_GET(self):

        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)

        # ---------------- STREAM AUDIO ----------------

        if parsed.path == "/stream":

            video_id = params.get(
                "videoId",
                [""]
            )[0]

            self.stream_audio(video_id)

            return

        # ---------------- DOWNLOAD MP3 ----------------

        if parsed.path == "/download":

            video_id = params.get(
                "videoId",
                [""]
            )[0]

            title = params.get(
                "title",
                [""]
            )[0]

            artist = params.get(
                "artist",
                [""]
            )[0]

            self.download_mp3(
                video_id,
                title,
                artist
            )

            return

        # ---------------- SPOTIFY ----------------

        if parsed.path == "/spotify":

            playlist_id = params.get(
                "playlistId",
                [""]
            )[0]

            self.spotify_playlist(
                playlist_id
            )

            return

        # ---------------- HEALTH ----------------

        if parsed.path == "/health":

            self.send_text(
                200,
                "OK"
            )

            return

        # ---------------- FICHIERS DU SITE ----------------

        super().do_GET()

    # ========================================================
    # REPONSES
    # ========================================================

    def send_text(self, code, message):

        body = message.encode(
            "utf-8",
            "replace"
        )

        self.send_response(code)

        self.send_header(
            "Content-Type",
            "text/plain; charset=utf-8"
        )

        self.send_header(
            "Content-Length",
            str(len(body))
        )

        self.send_header(
            "Access-Control-Allow-Origin",
            "*"
        )

        self.send_header(
            "Cache-Control",
            "no-store"
        )

        self.end_headers()

        self.wfile.write(body)

    def send_text_error(self, code, message):
        self.send_text(code, message)

    # ========================================================
    # SPOTIFY
    # ========================================================

    def spotify_playlist(self, playlist_id):

        if not re.fullmatch(
            r"[A-Za-z0-9]+",
            playlist_id or ""
        ):
            self.send_text_error(
                400,
                "Identifiant de playlist Spotify invalide."
            )

            return

        url = (
            "https://open.spotify.com/embed/playlist/"
            + playlist_id
        )

        try:

            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent":
                        "Mozilla/5.0 "
                        "(Windows NT 10.0; Win64; x64) "
                        "AppleWebKit/537.36 "
                        "Chrome/151 Safari/537.36",

                    "Accept-Language":
                        "fr-FR,fr;q=0.9,en;q=0.8"
                }
            )

            with urllib.request.urlopen(
                req,
                timeout=15
            ) as response:

                page = response.read().decode(
                    "utf-8",
                    "replace"
                )

            m = re.search(
                r'<script[^>]+id=["\']__NEXT_DATA__["\'][^>]*>'
                r"(.*?)"
                r"</script>",
                page,
                flags=re.S | re.I
            )

            if not m:
                raise RuntimeError(
                    "Spotify ne fournit pas les données "
                    "de cette playlist."
                )

            data = json.loads(
                html_lib.unescape(
                    m.group(1)
                )
            )

            entity = (
                data
                .get("props", {})
                .get("pageProps", {})
                .get("state", {})
                .get("data", {})
                .get("entity", {})
            )

            track_list = entity.get(
                "trackList"
            )

            if not isinstance(
                track_list,
                list
            ):
                raise RuntimeError(
                    "Playlist introuvable, privée "
                    "ou non accessible."
                )

            tracks = []

            for item in track_list:

                if not isinstance(
                    item,
                    dict
                ):
                    continue

                title = str(
                    item.get("title") or ""
                ).strip()

                artist = str(
                    item.get("subtitle") or ""
                ).strip()

                if title:

                    tracks.append({
                        "title": title,
                        "artist": artist
                    })

            body = json.dumps(
                {
                    "name":
                        entity.get("name")
                        or f"Playlist Spotify {playlist_id[:6]}",

                    "tracks": tracks
                },
                ensure_ascii=False
            ).encode("utf-8")

            self.send_response(200)

            self.send_header(
                "Content-Type",
                "application/json; charset=utf-8"
            )

            self.send_header(
                "Content-Length",
                str(len(body))
            )

            self.send_header(
                "Cache-Control",
                "no-store"
            )

            self.send_header(
                "Access-Control-Allow-Origin",
                "*"
            )

            self.end_headers()

            self.wfile.write(body)

        except Exception as exc:

            self.send_text_error(
                502,
                f"Impossible de lire Spotify : {exc}"
            )

    # ========================================================
    # PREPARATION AUDIO
    # ========================================================

    def prepare_audio(self, video_id):

        if not VIDEO_ID_RE.fullmatch(
            video_id or ""
        ):
            raise ValueError(
                "Identifiant YouTube invalide."
            )

        if yt_dlp is None:
            raise RuntimeError(
                "yt-dlp n'est pas installé. "
                "Lance LANCER.bat."
            )

        # ---------------- CACHE ----------------

        cached = find_cached(
            video_id
        )

        if cached:
            return cached

        # ---------------- TELECHARGEMENT ----------------

        tmp_dir = Path(
            tempfile.mkdtemp(
                prefix="pulse_audio_"
            )
        )

        try:

            outtmpl = str(
                tmp_dir /
                f"{video_id}.%(ext)s"
            )

            opts = ydl_base()

            opts.update({
                "format":
                    "bestaudio[ext=m4a]"
                    "/bestaudio[ext=webm]"
                    "/bestaudio",

                "outtmpl":
                    outtmpl,
            })

            url = (
                "https://www.youtube.com/watch?v="
                + video_id
            )

            with yt_dlp.YoutubeDL(opts) as ydl:

                ydl.extract_info(
                    url,
                    download=True
                )

            files = [
                p
                for p in tmp_dir.glob(
                    f"{video_id}.*"
                )
                if p.is_file()
            ]

            if not files:

                raise RuntimeError(
                    "YouTube n'a fourni "
                    "aucun flux audio."
                )

            source = files[0]

            destination = (
                CACHE /
                source.name
            )

            shutil.move(
                str(source),
                str(destination)
            )

            return destination

        finally:

            shutil.rmtree(
                tmp_dir,
                ignore_errors=True
            )

    # ========================================================
    # HEADERS AUDIO
    # ========================================================

    def send_audio_headers(
        self,
        path,
        start,
        end,
        partial
    ):

        mime = (
            mimetypes.guess_type(
                path.name
            )[0]
            or "audio/mp4"
        )

        total_size = path.stat().st_size

        content_length = (
            end - start + 1
        )

        if partial:

            self.send_response(
                206
            )

        else:

            self.send_response(
                200
            )

        self.send_header(
            "Content-Type",
            mime
        )

        self.send_header(
            "Accept-Ranges",
            "bytes"
        )

        self.send_header(
            "Content-Length",
            str(content_length)
        )

        self.send_header(
            "Cache-Control",
            "no-store"
        )

        self.send_header(
            "Access-Control-Allow-Origin",
            "*"
        )

        self.send_header(
            "Access-Control-Expose-Headers",
            "Content-Length, Content-Range, Accept-Ranges"
        )

        if partial:

            self.send_header(
                "Content-Range",
                f"bytes {start}-{end}/{total_size}"
            )

        self.end_headers()

    # ========================================================
    # STREAM AUDIO AVEC RANGE
    # ========================================================

    def stream_audio(self, video_id):

        try:

            path = self.prepare_audio(
                video_id
            )

            total_size = path.stat().st_size

            range_header = self.headers.get(
                "Range"
            )

            # ------------------------------------------------
            # PAS DE RANGE
            # ------------------------------------------------

            if not range_header:

                self.send_audio_headers(
                    path,
                    0,
                    total_size - 1,
                    False
                )

                with path.open(
                    "rb"
                ) as f:

                    shutil.copyfileobj(
                        f,
                        self.wfile,
                        length=1024 * 1024
                    )

                return

            # ------------------------------------------------
            # RANGE
            # ------------------------------------------------

            match = re.match(
                r"bytes=(\d*)-(\d*)",
                range_header
            )

            if not match:

                self.send_text_error(
                    416,
                    "Range invalide."
                )

                return

            start_str = match.group(1)
            end_str = match.group(2)

            if start_str:

                start = int(
                    start_str
                )

            else:

                # bytes=-500000
                suffix = int(
                    end_str
                )

                start = max(
                    total_size - suffix,
                    0
                )

            if end_str:

                end = int(
                    end_str
                )

            else:

                end = total_size - 1

            end = min(
                end,
                total_size - 1
            )

            if (
                start < 0
                or start >= total_size
                or end < start
            ):

                self.send_response(
                    416
                )

                self.send_header(
                    "Content-Range",
                    f"bytes */{total_size}"
                )

                self.end_headers()

                return

            self.send_audio_headers(
                path,
                start,
                end,
                True
            )

            with path.open(
                "rb"
            ) as f:

                f.seek(start)

                remaining = (
                    end - start + 1
                )

                while remaining > 0:

                    chunk = f.read(
                        min(
                            1024 * 1024,
                            remaining
                        )
                    )

                    if not chunk:
                        break

                    self.wfile.write(
                        chunk
                    )

                    remaining -= len(
                        chunk
                    )

        except Exception as exc:

            self.send_text_error(
                500,
                f"Lecture impossible : {exc}"
            )

    # ========================================================
    # TELECHARGEMENT MP3
    # ========================================================

    def download_mp3(
        self,
        video_id,
        requested_title="",
        requested_artist=""
    ):

        if not VIDEO_ID_RE.fullmatch(
            video_id or ""
        ):

            self.send_text_error(
                400,
                "Identifiant YouTube invalide."
            )

            return

        if yt_dlp is None:

            self.send_text_error(
                500,
                "yt-dlp n'est pas installé. "
                "Lance LANCER.bat."
            )

            return

        ff = ffmpeg_exe()

        if not ff:

            self.send_text_error(
                500,
                "FFmpeg est introuvable. "
                "Lance LANCER.bat pour installer "
                "imageio-ffmpeg."
            )

            return

        tmp_dir = Path(
            tempfile.mkdtemp(
                prefix="pulse_mp3_"
            )
        )

        try:

            outtmpl = str(
                tmp_dir /
                "%(title).100s.%(ext)s"
            )

            opts = ydl_base()

            opts.update({

                "format":
                    "bestaudio/best",

                "outtmpl":
                    outtmpl,

                "ffmpeg_location":
                    ff,

                "postprocessors": [{
                    "key":
                        "FFmpegExtractAudio",

                    "preferredcodec":
                        "mp3",

                    "preferredquality":
                        "192",
                }],
            })

            url = (
                "https://www.youtube.com/watch?v="
                + video_id
            )

            with yt_dlp.YoutubeDL(opts) as ydl:

                info = ydl.extract_info(
                    url,
                    download=True
                )

                fallback_title = safe_name(
                    info.get(
                        "title",
                        "Musique"
                    )
                )

                fallback_artist = safe_name(
                    info.get("artist")
                    or info.get("uploader")
                    or "YouTube"
                )

            files = list(
                tmp_dir.glob(
                    "*.mp3"
                )
            )

            if not files:

                raise RuntimeError(
                    "Aucun MP3 n'a été généré "
                    "par FFmpeg."
                )

            mp3 = files[0]

            size = mp3.stat().st_size

            final_title = safe_name(
                requested_title
                or fallback_title
            )

            final_artist = safe_name(
                requested_artist
                or fallback_artist
            )

            filename = urllib.parse.quote(
                f"{final_title} - "
                f"{final_artist}.mp3"
            )

            self.send_response(
                200
            )

            self.send_header(
                "Content-Type",
                "audio/mpeg"
            )

            self.send_header(
                "Content-Length",
                str(size)
            )

            self.send_header(
                "Content-Disposition",
                "attachment; "
                f"filename*=UTF-8''{filename}"
            )

            self.send_header(
                "Cache-Control",
                "no-store"
            )

            self.send_header(
                "Access-Control-Allow-Origin",
                "*"
            )

            self.end_headers()

            with mp3.open(
                "rb"
            ) as f:

                shutil.copyfileobj(
                    f,
                    self.wfile,
                    length=1024 * 1024
                )

        except Exception as exc:

            self.send_text_error(
                500,
                f"Téléchargement impossible : {exc}"
            )

        finally:

            shutil.rmtree(
                tmp_dir,
                ignore_errors=True
            )


# ============================================================
# LANCEMENT
# ============================================================

if __name__ == "__main__":

    print()
    print("=" * 60)
    print(" PULSE - SERVEUR")
    print("=" * 60)
    print()
    print(
        f"Site local : http://127.0.0.1:{PORT}"
    )
    print(
        f"Audio      : http://127.0.0.1:{PORT}/stream"
    )
    print(
        f"Health     : http://127.0.0.1:{PORT}/health"
    )
    print()
    print(
        "Lecture YouTube + MP3 + Range HTTP activés."
    )
    print()
    print(
        "Ferme cette fenêtre pour arrêter le serveur."
    )
    print("=" * 60)
    print()

    server = ThreadingHTTPServer(
        (HOST, PORT),
        Handler
    )

    server.serve_forever()