PULSE / SPOTIFY - VERSION V4

1. Lance LANCER.bat.
2. Attends le message "Dependances OK".
3. La page http://127.0.0.1:8000 s'ouvre.
4. Recherche une musique puis clique sur "Ecouter".

CORRECTIONS V4
- La musique YouTube ne passe plus par le lecteur IFrame pour l'audio.
- Le serveur prepare un flux audio avec yt-dlp puis le lecteur HTML <audio> le lit.
- La barre de progression, pause/reprise, volume et suivant fonctionnent avec cet audio.
- Le lecteur IFrame est conserve uniquement pour afficher le clip.
- Le téléchargement MP3 utilise FFmpeg fourni automatiquement par imageio-ffmpeg.
- Les fichiers audio deja recuperes sont mis en cache dans .audio_cache.

IMPORTANT
- Ne lance pas index.html directement : utilise LANCER.bat.
- Le premier lancement peut prendre un peu de temps pour installer yt-dlp et imageio-ffmpeg.
- La lecture YouTube et le telechargement dependent toujours de l'accessibilite du contenu et des conditions de YouTube.

IMPORTATION SPOTIFY
-------------------
Bouton "Importer Spotify" dans la barre laterale.
Colle le lien d'une playlist Spotify PUBLIQUE. Aucune API Spotify ni compte Premium
n'est necessaire. Les titres sont recuperes depuis l'embed Spotify puis recherches
sur YouTube avec le systeme YouTube deja present dans l'application.
La playlist est ensuite ajoutee automatiquement aux playlists locales.


VERSION 7 — Optimisation
- Logo/icône playlist à la place du logo Spotify.
- Boutons retour/suivant fonctionnels.
- Accès aux titres likés depuis le signet.
- Boutons secondaires rendus fonctionnels.
- Cache des recherches YouTube (5 minutes, 30 recherches max en mémoire) pour réduire les appels et accélérer l'interface.
- Micro-animations plus fluides.
