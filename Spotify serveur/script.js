
/* =========================================================
   MESSAGE MODE ORDINATEUR
   ========================================================= */
(function initSleepModeNotice(){
  const STORAGE_KEY = 'pulseSleepModeNoticeDismissed';

  function closeSleepModeNotice(){
    const notice = document.getElementById('sleepModeNotice');
    if (!notice) return;
    notice.classList.add('hidden');
    notice.setAttribute('aria-hidden','true');
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch (_) {}
  }

  function setup(){
    const notice = document.getElementById('sleepModeNotice');
    const ok = document.getElementById('sleepModeNoticeOk');
    const close = document.getElementById('sleepModeNoticeClose');

    let dismissed = false;
    try { dismissed = localStorage.getItem(STORAGE_KEY) === '1'; } catch (_) {}

    if (dismissed && notice) {
      notice.classList.add('hidden');
      notice.setAttribute('aria-hidden','true');
    }

    if (ok) ok.addEventListener('click', closeSleepModeNotice);
    if (close) close.addEventListener('click', closeSleepModeNotice);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setup, {once:true});
  } else {
    setup();
  }
})();

/* =========================================================
   PULSE — lecteur local + YouTube
   Version propre : pas de Spotify, playlists natives, file d'attente,
   lecture suivante automatique et rotation de clés API en cas de quota.
========================================================= */
const $ = (s) => document.querySelector(s);

const audio = $("#audio");
const searchInput = $("#searchInput");
const searchBtn = $("#searchBtn");
const clearBtn = $("#clearBtn");
const historyBackBtn = $("#historyBackBtn");
const historyForwardBtn = $("#historyForwardBtn");
const homeFilterBtn = $("#homeFilterBtn");
const showRecommendationsBtn = $("#showRecommendationsBtn");
const detailsMenuBtn = $("#detailsMenuBtn");
const bookmarkBtn = $(".bookmark-icon");
const expandedDevice = $("#expandedDevice");
const results = $("#results");
const resultCount = $("#resultCount");
const message = $("#message");
const fileInput = $("#fileInput");
const libraryFileInput = $("#libraryFileInput");
const library = $("#library");
const libraryCount = $("#libraryCount");
const playBtn = $("#playBtn");
const prevBtn = $("#prevBtn");
const nextBtn = $("#nextBtn");
const shuffleBtn = $("#shuffleBtn");
const repeatBtn = $("#repeatBtn");
const progress = $("#progress");
const currentTimeEl = $("#currentTime");
const durationEl = $("#duration");
const volume = $("#volume");
const muteBtn = $("#muteBtn");
const trackTitle = $("#trackTitle");
const trackArtist = $("#trackArtist");
const cover = $("#cover");
const detailCover = $("#detailCover");
const detailTitle = $("#detailTitle");
const detailArtist = $("#detailArtist");
const detailPlay = $("#detailPlay");
const detailLike = $("#detailLike");
const playerLike = $("#playerLike");
const similarVideos = $("#similarVideos");
const artistAbout = $("#artistAbout");
const refreshSimilar = $("#refreshSimilar");
const recommendations = $("#recommendations");
const recentlyPlayed = $("#recentlyPlayed");
const clearRecentBtn = $("#clearRecentBtn");
const playlistQuickGrid = $("#playlistQuickGrid");
const playlistsEl = $("#playlists");
const playlistModal = $("#playlistModal");
const playlistNameInput = $("#playlistNameInput");
const newPlaylistBtn = $("#newPlaylistBtn");
const createPlaylistBtn = $("#createPlaylistBtn");
const cancelPlaylistBtn = $("#cancelPlaylistBtn");
const closePlaylistModal = $("#closePlaylistModal");
const addPlaylistModal = $("#addPlaylistModal");
const playlistChoices = $("#playlistChoices");
const closeAddPlaylistModal = $("#closeAddPlaylistModal");
const newPlaylistFromAddBtn = $("#newPlaylistFromAddBtn");
const youtubeModal = $("#youtubeModal");
const closeModal = $("#closeModal");
const youtubePlayerElement = $("#youtubePlayer");
const ytTitle = $("#ytTitle");
const ytArtist = $("#ytArtist");
const ytCurrentTime = $("#ytCurrentTime");
const ytDuration = $("#ytDuration");
const queueBtn = $("#queueBtn");
const queueModal = $("#queueModal");

// Lecteur agrandi / fiche du morceau
const expandedPlayer = $("#expandedPlayer");
const expandedClose = $("#expandedClose");
const expandedBackdrop = $("#expandedPlayerBackdrop");
const expandedOpen = $("#expandedOpen");
const expandedTitle = $("#expandedTitle");
const expandedArtist = $("#expandedArtist");
const expandedCover = $("#expandedCover");
const expandedPlay = $("#expandedPlay");
const expandedPrev = $("#expandedPrev");
const expandedNext = $("#expandedNext");
const expandedShuffle = $("#expandedShuffle");
const expandedRepeat = $("#expandedRepeat");
const expandedProgress = $("#expandedProgress");
const expandedCurrent = $("#expandedCurrent");
const expandedDuration = $("#expandedDuration");
const expandedLike = $("#expandedLike");
const expandedQueue = $("#expandedQueue");
const expandedShare = $("#expandedShare");
const expandedShowClip = $("#expandedShowClip");
const expandedMediaTrack = $("#expandedMediaTrack");
const expandedNoVideo = $("#expandedNoVideo");
const expandedMore = $("#expandedMore");
const downloadBtn = $("#downloadBtn");
const closeQueue = $("#closeQueue");
const clearQueue = $("#clearQueue");
const queueList = $("#queueList");
const spotifyImportModal = $("#spotifyImportModal");
const openSpotifyImportBtn = $("#openSpotifyImportBtn");
const closeSpotifyImportBtn = $("#closeSpotifyImportBtn");
const spotifyImportBackdrop = $("#spotifyImportBackdrop");
const spotifyPlaylistUrl = $("#spotifyPlaylistUrl");
const importSpotifyBtn = $("#importSpotifyBtn");
const spotifyImportStatus = $("#spotifyImportStatus");
const spotifyImportProgress = $("#spotifyImportProgress");
const spotifyImportProgressBar = spotifyImportProgress?.querySelector("span");

let tracks = [];
let currentIndex = -1;
let currentSource = null;
let youtubeResults = [];
let youtubeIndex = -1;
let currentYoutubeVideoId = "";
let ytPlayer = null;
let youtubeAPIReady = false;
let pendingVideoId = null;
let pendingYoutubeAutoplay = false;
let youtubeTimer = null;
let currentTrackDuration = 0;
let shuffle = false;
let repeat = false;
let currentPlaylist = null;
let currentPlaylistIndex = -1;
let playQueue = loadJSON("pulsePlayQueue", []);
let recentPlayed = loadJSON("pulseRecentlyPlayed", []);
let playlistsData = loadJSON("pulsePlaylists", []);

// Les anciennes clés présentes dans les versions précédentes sont conservées
// comme clés de secours. Tu peux en ajouter d'autres depuis le message d'erreur.
const DEFAULT_API_KEYS = [
  "AIzaSyCDdLzWaxtTKrZjcwBs6SCg_gW_KA3Su3A",
  "AIzaSyB5X99OviCwLy1N6gLrQ4L4mTF5QFreDoI"
];
let apiKeys = loadApiKeys();
let apiKeyIndex = Number(localStorage.getItem("pulseYoutubeApiIndex") || 0);

function loadJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function saveJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }
function loadApiKeys() {
  const saved = loadJSON("pulseYoutubeApiKeys", []);
  const all = [...saved, ...DEFAULT_API_KEYS].filter(Boolean);
  return [...new Set(all)];
}
function saveApiKeys(keys) {
  apiKeys = [...new Set(keys.map(x => x.trim()).filter(Boolean))];
  saveJSON("pulseYoutubeApiKeys", apiKeys);
  apiKeyIndex = 0;
  localStorage.setItem("pulseYoutubeApiIndex", "0");
}
function currentApiKey() { return apiKeys[apiKeyIndex % Math.max(apiKeys.length, 1)] || ""; }
function rotateApiKey() {
  if (apiKeys.length < 2) return false;
  apiKeyIndex = (apiKeyIndex + 1) % apiKeys.length;
  localStorage.setItem("pulseYoutubeApiIndex", String(apiKeyIndex));
  return true;
}

function decodeHtmlEntities(v) { const value=String(v ?? ""); if(!value.includes("&")) return value; try{const el=document.createElement("textarea"); el.innerHTML=value; return el.value;}catch(_){return value;} }
function escapeHtml(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));
}
function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2,"0")}`;
}
function youtubeThumb(id, fallback="") {
  return id ? `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg` : fallback;
}
function thumbImg(id, cls="thumb", alt="") {
  const src = youtubeThumb(id);
  return `<img class="${cls}" src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" loading="lazy" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${encodeURIComponent(id)}/mqdefault.jpg'">`;
}
function youtubeItem(v) {
  return {
    type:"youtube",
    videoId:v?.id?.videoId || v?.videoId || "",
    title:decodeHtmlEntities(v?.snippet?.title || v?.title || "Vidéo YouTube"),
    channelTitle:decodeHtmlEntities(v?.snippet?.channelTitle || v?.channelTitle || "YouTube"),
    thumbnail:v?.thumbnail || youtubeThumb(v?.id?.videoId || v?.videoId || ""),
    duration:v?.duration || ""
  };
}
function playableKey(item) { return item?.type === "local" ? `local:${item.id}` : `yt:${item?.videoId || ""}`; }

// Playlists initiales. Les morceaux sont des vidéos YouTube précises, pas des mixes imposés.
const SEED_PLAYLISTS = [
  {id:"hits-2026",name:"Hits du moment",videos:[
    {type:"youtube",videoId:"W9Qjcx8nhnU",title:"VIVE LA MONNAIE",channelTitle:"GIMS ft. Mauvais Djo"},
    {type:"youtube",videoId:"bXDm6KGF32w",title:"LIFE / HELENA / POUR TOI",channelTitle:"RnBoi",duration:"5:49"},
    {type:"youtube",videoId:"jodJzaVZfj8",title:"Pilé",channelTitle:"Mauvais Djo"},
    {type:"youtube",videoId:"7CGKeID7nRc",title:"PARISIENNE",channelTitle:"GIMS & La Mano 1.9"},
    {type:"youtube",videoId:"VaX0AR2akzQ",title:"BLOQUÉ",channelTitle:"GIMS x L2B"},
    {type:"youtube",videoId:"A0-JQ7r9l8E",title:"SENTIMENTAL",channelTitle:"GIMS"},
    {type:"youtube",videoId:"QAJGWSM6Z-w",title:"SOLEIL",channelTitle:"GIMS",duration:"2:11"},
    {type:"youtube",videoId:"FGzVaea4G4c",title:"QUE DES FAITS",channelTitle:"Gazo",duration:"2:44"},
    {type:"youtube",videoId:"7Kouia1rYzg",title:"Pocahontas",channelTitle:"PLK",duration:"2:48"},
    {type:"youtube",videoId:"4bPGxLxogvw",title:"Sapés comme jamais",channelTitle:"GIMS ft. Niska"}
  ]},
  {id:"rap-fr",name:"Rap français 2026",videos:[
    {type:"youtube",videoId:"QzZflH4liuU",title:"CARTIER",channelTitle:"Gazo x Tiakola"},
    {type:"youtube",videoId:"7hr1qEdcvL0",title:"Temps en temps",channelTitle:"Zola x Koba LaD"},
    {type:"youtube",videoId:"zKhodD0qNog",title:"Loyauté",channelTitle:"Rohff"},
    {type:"youtube",videoId:"f5p1nFvPdko",title:"Je suis love de toi",channelTitle:"JuL feat. Naza & Salima Chica"},
    {type:"youtube",videoId:"OdtbJ1q2r7g",title:"Pépita",channelTitle:"Emkal"},
    {type:"youtube",videoId:"0T9qP_b9pS8",title:"Ça mène à rien",channelTitle:"PLK feat. Gazo"},
    {type:"youtube",videoId:"Cp1yDrSv0XA",title:"Chemin d'or",channelTitle:"Werenoi"},
    {type:"youtube",videoId:"Fg90lD4QHr4",title:"Tout en Gucci",channelTitle:"Ninho"},
    {type:"youtube",videoId:"NyhmzH8yrF8",title:"Love de toi",channelTitle:"JuL"},
    {type:"youtube",videoId:"Uiuy92Sj5QU",title:"Chemin de diamant",channelTitle:"Werenoi"}
  ]},
  {id:"rap",name:"Rap & bangers",videos:[
    {type:"youtube",videoId:"hBeNj5mX3To",title:"Pineapple",channelTitle:"Leto"},
    {type:"youtube",videoId:"QzZflH4liuU",title:"CARTIER",channelTitle:"Gazo x Tiakola"},
    {type:"youtube",videoId:"0T9qP_b9pS8",title:"Ça mène à rien",channelTitle:"PLK feat. Gazo"},
    {type:"youtube",videoId:"7Kouia1rYzg",title:"Pocahontas",channelTitle:"PLK"},
    {type:"youtube",videoId:"FGzVaea4G4c",title:"QUE DES FAITS",channelTitle:"Gazo"},
    {type:"youtube",videoId:"7hr1qEdcvL0",title:"Temps en temps",channelTitle:"Zola x Koba LaD"},
    {type:"youtube",videoId:"W9Qjcx8nhnU",title:"VIVE LA MONNAIE",channelTitle:"GIMS ft. Mauvais Djo"},
    {type:"youtube",videoId:"jodJzaVZfj8",title:"Pilé",channelTitle:"Mauvais Djo"},
    {type:"youtube",videoId:"4bPGxLxogvw",title:"Sapés comme jamais",channelTitle:"GIMS ft. Niska"},
    {type:"youtube",videoId:"VaX0AR2akzQ",title:"BLOQUÉ",channelTitle:"GIMS x L2B"}
  ]},
  {id:"chill",name:"Chill",videos:[
    {type:"youtube",videoId:"UsR08cY8k0A",title:"golden hour",channelTitle:"JVKE"},
    {type:"youtube",videoId:"Ip6cw8gfHHI",title:"Here With Me",channelTitle:"d4vd"},
    {type:"youtube",videoId:"2Vv-BfVoq4g",title:"Perfect",channelTitle:"Ed Sheeran"},
    {type:"youtube",videoId:"zABLecsR5UE",title:"Someone You Loved",channelTitle:"Lewis Capaldi"},
    {type:"youtube",videoId:"gVAy3IZiL0s",title:"Atlantis",channelTitle:"Seafret"},
    {type:"youtube",videoId:"GxldQ9eX2wo",title:"Until I Found You",channelTitle:"Stephen Sanchez"},
    {type:"youtube",videoId:"wGF7PswOENQ",title:"The Night We Met",channelTitle:"Lord Huron"},
    {type:"youtube",videoId:"V1Pl8CzNzCw",title:"lovely",channelTitle:"Billie Eilish & Khalid"},
    {type:"youtube",videoId:"GCdwKhTtNNw",title:"Sweater Weather",channelTitle:"The Neighbourhood"},
    {type:"youtube",videoId:"fM3C9sW5mTQ",title:"Space Song",channelTitle:"Beach House"}
  ]}
];
const SEED_PLAYLISTS_VERSION = 5;

function ensureLikedPlaylist() {
  if (!Array.isArray(playlistsData)) playlistsData = [];
  let p = playlistsData.find(x => x.id === "liked-tracks");
  if (!p) {
    p = { id: "liked-tracks", name: "Titres likés", videos: [] };
    playlistsData.push(p);
  }
  const liked = loadJSON("pulseLiked", []);
  const likedKeys = new Set(liked.map(playableKey));
  p.videos = liked.filter(x => x && playableKey(x));
  return p;
}

function syncLikedPlaylist() {
  ensureLikedPlaylist();
  saveJSON("pulsePlaylists", playlistsData);
}

function seedPlaylists() {
  if (!Array.isArray(playlistsData)) playlistsData = [];
  const version = Number(localStorage.getItem("pulseSeedPlaylistsVersion") || 0);
  let changed = false;

  // Remplace les 4 playlists intégrées quand leur version change, sans toucher
  // aux playlists créées manuellement par l'utilisateur ni aux titres likés.
  if (version < SEED_PLAYLISTS_VERSION) {
    for (const seed of SEED_PLAYLISTS) {
      const copy = {...seed, videos: seed.videos.map(v => ({...v}))};
      const idx = playlistsData.findIndex(p => p?.id === seed.id || p?.name === seed.name);
      if (idx >= 0) playlistsData[idx] = copy;
      else playlistsData.push(copy);
      changed = true;
    }
    localStorage.setItem("pulseSeedPlaylistsVersion", String(SEED_PLAYLISTS_VERSION));
  } else {
    // Sécurité : une playlist intégrée doit toujours contenir exactement 10 titres distincts.
    for (const seed of SEED_PLAYLISTS) {
      const existing = playlistsData.find(p => p?.id === seed.id);
      if (!existing) {
        playlistsData.push({...seed, videos:seed.videos.map(v=>({...v}))});
        changed = true;
      }
    }
  }

  const old = loadJSON("spotifyPlaylists", []);
  if (Array.isArray(old) && old.length && !localStorage.getItem("pulsePlaylistsMigrated")) {
    const usable = old.filter(p => p?.videos?.length).map(p => ({id:p.id || `old-${Date.now()}-${Math.random()}`,name:p.name,videos:p.videos}));
    if (usable.length) { playlistsData.push(...usable); changed = true; }
    localStorage.setItem("pulsePlaylistsMigrated", "1");
  }
  if (changed) saveJSON("pulsePlaylists", playlistsData);
}
seedPlaylists();
ensureLikedPlaylist();
syncLikedPlaylist();

function setMessage(text, html=false) {
  if (!message) return;
  if (html) message.innerHTML = text; else message.textContent = text;
}
function showApiHelp() {
  setMessage(`Quota/clé YouTube atteint. <button class="primary-btn" id="addApiKeyBtn" type="button">Ajouter une clé API</button>`, true);
  $("#addApiKeyBtn")?.addEventListener("click", () => {
    const value = prompt("Colle une ou plusieurs clés API YouTube séparées par des virgules :");
    if (value) { saveApiKeys(value.split(",")); setMessage("Clés enregistrées. Relance la recherche."); }
  });
}


/* ---------- Lecture universelle PC + mobile ---------- */
function updateTime(current, durationOverride=null){
  const t=Number(current), d=durationOverride==null?Number(audio?.duration):Number(durationOverride);
  const safeT=Number.isFinite(t)&&t>=0?t:0, safeD=Number.isFinite(d)&&d>0?d:0;
  if(currentTimeEl) currentTimeEl.textContent=formatTime(safeT);
  if(durationEl) durationEl.textContent=formatTime(safeD);
  if(progress){progress.min="0";progress.max=String(safeD||1);progress.value=String(Math.min(safeT,safeD||safeT||0));}
}
function updateYoutubeProgressUniversal(){
  if(currentSource !== "youtube") return;
  try{
    const t=Number(audio?.currentTime||0);
    const d=Number.isFinite(audio?.duration)&&audio.duration>0 ? Number(audio.duration) : Number(currentTrackDuration||0);
    if(d>0) currentTrackDuration=d;
    updateTime(t,currentTrackDuration||d);
    if(expandedCurrent) expandedCurrent.textContent=formatTime(t);
    if(expandedDuration) expandedDuration.textContent=formatTime(currentTrackDuration||d);
    if(expandedProgress){
      expandedProgress.min="0";
      expandedProgress.max=String((currentTrackDuration||d)||1);
      expandedProgress.value=String(Math.min(t,(currentTrackDuration||d)||t||0));
    }
  }catch(_){}
}
function startYoutubeTimerUniversal(){
  if(youtubeTimer) clearInterval(youtubeTimer);
  youtubeTimer=setInterval(updateYoutubeProgressUniversal,250);
  updateYoutubeProgressUniversal();
}
function stopYoutubeTimerUniversal(){
  if(youtubeTimer){clearInterval(youtubeTimer);youtubeTimer=null;}
}

/* ---------- YouTube IFrame ---------- */
const isMobileDevice = /Android|iPhone|iPad|iPod|Windows Phone|Mobile/i.test(navigator.userAgent);
// Le lecteur YouTube est réservé au clip visuel. La musique est toujours
// lue par l'élément <audio> natif via /stream, sur PC comme sur mobile.
function getYoutubePlayerHost() {
  return youtubePlayerElement;
}

window.onYouTubeIframeAPIReady = () => { youtubeAPIReady = true; createYoutubePlayer(); };
function createYoutubePlayer() {
  const host = getYoutubePlayerHost();
  if (!youtubeAPIReady || ytPlayer || !host || !window.YT) return;
  ytPlayer = new YT.Player(host, {
    width:"100%", height:"100%", videoId:"",
    playerVars:{autoplay:0,controls:0,rel:0,playsinline:1,enablejsapi:1,origin:location.origin,iv_load_policy:3,modestbranding:1},
    events:{onReady:onYoutubeReady,onStateChange:handleYoutubeStateChange,onError:handleYoutubeError}
  });
}
function onYoutubeReady() {
  if (volume && ytPlayer) ytPlayer.setVolume(Number(volume.value) * 100);
  if (pendingVideoId) {
    const id=pendingVideoId;
    const shouldPlay=pendingYoutubeAutoplay;
    const startTime=Number(pendingYoutubeStartTime||0);
    pendingVideoId=null;
    pendingYoutubeAutoplay=false;
    pendingYoutubeStartTime=0;
    loadYoutubeVideo(id, shouldPlay, startTime);
  }
}
function handleYoutubeStateChange(e){
  // Le lecteur YouTube sert uniquement à afficher le clip optionnel.
  // La musique principale est toujours le flux HTMLAudio /stream.
  if(!window.YT) return;
  if(e.data===YT.PlayerState.PAUSED || e.data===YT.PlayerState.ENDED){
    if(expandedClipVisible) syncClipToAudio(true);
  }
}
const embeddableClipCache = new Map();
const playlistClipCandidates = new Map();
const playlistClipCandidateIndex = new Map();
let clipRecoveryBusy = false;

function clipCacheKey(item) {
  const title = String(item?.title || trackTitle?.textContent || "").trim().toLowerCase();
  const artist = String(item?.artist || item?.channelTitle || trackArtist?.textContent || "").trim().toLowerCase();
  return `clip:${artist}\n${title}`;
}

function rankClipCandidate(v, title, artist) {
  const text = `${v?.snippet?.title || ""} ${v?.snippet?.channelTitle || ""}`.toLowerCase();
  const wanted = `${artist} ${title}`.toLowerCase();
  let score = 0;
  if (text.includes(String(title).toLowerCase())) score += 6;
  if (artist && text.includes(String(artist).toLowerCase())) score += 4;
  for (const word of wanted.split(/\s+/).filter(w => w.length > 2).slice(0, 12)) {
    if (text.includes(word)) score += 0.25;
  }
  if (/official|clip|music video|vevo/i.test(v?.snippet?.title || "")) score += 1;
  return score;
}

async function findPlaylistClipCandidates(item, force=false) {
  if (!item) return [];
  const key = clipCacheKey(item);
  if (!force && playlistClipCandidates.has(key)) return playlistClipCandidates.get(key);
  const title = String(item.title || trackTitle?.textContent || "").trim();
  const artist = String(item.artist || item.channelTitle || trackArtist?.textContent || "").trim();
  if (!title && !artist) return [];

  const queries = [
    `${artist} - ${title} official video`,
    `${artist} - ${title} clip`,
    `${artist} - ${title}`
  ];
  const found = new Map();
  for (const q of queries) {
    const data = await youtubeRequest({
      part:"snippet", q, type:"video", maxResults:"8",
      videoEmbeddable:"true"
    });
    for (const v of (data.items || [])) {
      const id = v?.id?.videoId;
      if (!id || found.has(id)) continue;
      found.set(id, v);
    }
    if (found.size >= 8) break;
  }
  const ranked = [...found.values()]
    .sort((a,b)=>rankClipCandidate(b,title,artist)-rankClipCandidate(a,title,artist))
    .map(v=>v.id.videoId);
  playlistClipCandidates.set(key, ranked);
  playlistClipCandidateIndex.set(key, 0);
  return ranked;
}

async function ensurePlaylistClipEmbeddable(item, forceSearch=false) {
  if (!item?.videoId || currentSource !== "youtube") return item?.videoId || "";
  const key = clipCacheKey(item);
  const cached = embeddableClipCache.get(key);
  if (!forceSearch && cached) {
    item.videoId = cached;
    currentYoutubeVideoId = cached;
    return cached;
  }

  try {
    const candidates = await findPlaylistClipCandidates(item, forceSearch);
    const original = item.videoId;
    const usable = candidates.filter(id => id !== original);
    const nextId = usable[0] || original;
    if (nextId) {
      embeddableClipCache.set(key, nextId);
      item.videoId = nextId;
      item.thumbnail = youtubeThumb(nextId);
      currentYoutubeVideoId = nextId;
      if (currentPlaylist?.videos?.[currentPlaylistIndex] === item) saveJSON("pulsePlaylists", playlistsData);
      return nextId;
    }
  } catch (e) {
    if (e?.quota) throw e;
    console.warn("Résolution du clip de playlist impossible", e);
  }
  return item.videoId;
}

async function recoverPlaylistClip() {
  if (clipRecoveryBusy || currentSource !== "youtube" || !currentPlaylist || currentPlaylistIndex < 0) return false;
  const item = currentPlaylist.videos?.[currentPlaylistIndex];
  if (!item) return false;
  clipRecoveryBusy = true;
  try {
    const key = clipCacheKey(item);
    let candidates = await findPlaylistClipCandidates(item, false);
    if (!candidates.length) candidates = await findPlaylistClipCandidates(item, true);
    let index = Number(playlistClipCandidateIndex.get(key) || 0);
    const currentId = getCurrentYoutubeId();
    while (index < candidates.length) {
      const nextId = candidates[index++];
      playlistClipCandidateIndex.set(key, index);
      if (!nextId || nextId === currentId) continue;
      item.videoId = nextId;
      item.thumbnail = youtubeThumb(nextId);
      currentYoutubeVideoId = nextId;
      embeddableClipCache.set(key, nextId);
      saveJSON("pulsePlaylists", playlistsData);
      loadYoutubeVideo(nextId, !audio.paused, Number(audio.currentTime||0));
      setMessage("Clip compatible chargé.");
      return true;
    }
  } catch (e) {
    console.warn("Aucun clip de playlist compatible trouvé", e);
  } finally {
    clipRecoveryBusy = false;
  }
  return false;
}

function handleYoutubeError(e) {
  const messages = {2:"ID YouTube invalide.",5:"Le lecteur YouTube ne peut pas être chargé.",100:"Cette vidéo n’existe plus ou est privée.",101:"Cette vidéo interdit la lecture intégrée.",150:"Cette vidéo interdit la lecture intégrée."};
  const msg = messages[e.data] || `Erreur YouTube ${e.data}.`;
  console.error("YouTube Player error", e.data, msg);
  if (currentPlaylist && currentPlaylistIndex >= 0 && [2,5,100,101,150].includes(e.data)) {
    setMessage("Recherche d’un autre clip compatible…");
    recoverPlaylistClip().then(ok=>{ if(!ok) setMessage("Aucun clip compatible trouvé pour ce morceau."); });
    return;
  }
  if ([101,150,100].includes(e.data)) {
    setMessage("Cette vidéo bloque l’intégration. Recherche d’un clip compatible…");
    recoverEmbeddableClip().then(ok=>{ if(!ok) setMessage("Ce clip bloque l’intégration YouTube. Essaie un autre résultat."); });
    return;
  }
  setMessage(msg);
}
function startYoutubeTimer(){ startYoutubeTimerUniversal(); }
function stopYoutubeTimer(){ stopYoutubeTimerUniversal(); }
function loadYoutubeVideo(id, autoplay=true, startTime=0) {
  if (!id) return;
  const safeStart=Math.max(0, Number(startTime)||0);
  if (!ytPlayer) { pendingVideoId=id; pendingYoutubeAutoplay=autoplay; pendingYoutubeStartTime=safeStart; return; }
  try {
    ytPlayer.loadVideoById({videoId:id,startSeconds:safeStart});
    if (autoplay) {
      ytPlayer.unMute?.();
      ytPlayer.setVolume?.(Number(volume?.value ?? 1)*100);
      ytPlayer.playVideo?.();
    }
  } catch(e) { console.warn("Clip YouTube indisponible:",e); }
}

function syncClipToAudio(force=false) {
  if (!expandedClipVisible || !ytPlayer || currentSource !== "youtube" || !getCurrentYoutubeId()) return;
  const audioTime=Number(audio?.currentTime||0);
  const clipTime=Number(ytPlayer.getCurrentTime?.()||0);
  if (force || Math.abs(clipTime-audioTime)>1.25) {
    try { ytPlayer.seekTo(audioTime, true); } catch(e) {}
  }
}

function startClipPlayback() {
  if (!ytPlayer || !expandedClipVisible) return;
  try {
    ytPlayer.mute?.();
    syncClipToAudio(true);
    ytPlayer.playVideo?.();
  } catch(e) {}
}

function pauseClipPlayback() {
  try { ytPlayer?.pauseVideo?.(); } catch(e) {}
}

function parseYouTubeDuration(iso){const m=String(iso||"").match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);if(!m)return 0;return Number(m[1]||0)*3600+Number(m[2]||0)*60+Number(m[3]||0);}
async function fetchYoutubeDuration(videoId){if(!videoId||!apiKeys.length)return 0;try{const key=currentApiKey(),url=new URL("https://www.googleapis.com/youtube/v3/videos");url.search=new URLSearchParams({part:"contentDetails",id:videoId,key}).toString();const response=await fetchWithTimeout(url,7000),data=await response.json().catch(()=>({}));if(!response.ok){const reason=data?.error?.errors?.[0]?.reason||"";if((reason.includes("quota")||reason.includes("dailyLimit")||response.status===403)&&rotateApiKey())return fetchYoutubeDuration(videoId);return 0;}return parseYouTubeDuration(data?.items?.[0]?.contentDetails?.duration);}catch(_){return 0;}}
async function playYoutubeAudio(item) {
  if (!item?.videoId) return;
  const id=item.videoId;
  currentTrackDuration=parseYouTubeDuration(item.duration)||0;
  if(currentTrackDuration) updateTime(0,currentTrackDuration);

  // Récupération de la durée en arrière-plan : elle ne doit jamais bloquer le démarrage.
  fetchYoutubeDuration(id).then(d=>{
    if(d && currentSource==="youtube" && getCurrentYoutubeId()===id){
      currentTrackDuration=d;
      item.duration=formatTime(d);
      updateTime(Number(audio?.currentTime||0),d);
      if(expandedDuration) expandedDuration.textContent=formatTime(d);
    }
  }).catch(()=>{});

  // Moteur audio unique PC + iPhone : le flux /stream est lu par l'élément audio natif.
  // Le clip YouTube est totalement indépendant et peut être fermé sans arrêter la musique.
  stopYoutubeTimer();
  try {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    audio.src=`/stream?videoId=${encodeURIComponent(id)}`;
    audio.preload="auto";
    audio.volume=Number(volume?.value ?? 1);
    updateTime(0,currentTrackDuration||0);
    const p=audio.play();
    if(p && typeof p.then==="function") await p;
    playBtn && (playBtn.textContent="Ⅱ");
    setMessage("");
    startYoutubeTimer();
  } catch(err) {
    console.error("Lecture audio YouTube impossible",err);
    playBtn && (playBtn.textContent="▶");
    setMessage("La musique ne peut pas être lue. Vérifie que le serveur /stream est disponible.");
  }
}

function playYoutube(index) {
  const v=youtubeResults[index]; if(!v) return;
  currentSource="youtube"; youtubeIndex=index; currentPlaylist=null; currentPlaylistIndex=-1;
  currentYoutubeVideoId = v?.id?.videoId || "";
  const item=youtubeItem(v); setNowPlaying(item); recordRecent(item);
  playYoutubeAudio(item);
}
function playYoutubeObject(item, playlist=null, playlistIndex=-1) {
  if (!item?.videoId) return;
  const normalized = youtubeItem(item);
  currentSource="youtube";
  youtubeIndex=youtubeResults.findIndex(v=>v?.id?.videoId===normalized.videoId);
  currentYoutubeVideoId = normalized.videoId || "";
  currentPlaylist=playlist || null;
  currentPlaylistIndex=Number.isInteger(playlistIndex) ? playlistIndex : -1;
  setNowPlaying(normalized);
  recordRecent(normalized);
  playYoutubeAudio(normalized);

  // Un morceau ouvert depuis une playlist doit conserver son contexte playlist
  // et son clip YouTube. On prépare le lecteur vidéo dès que le panneau est ouvert.
  if (playlist && playlistIndex >= 0) {
    setTimeout(() => {
      if (currentSource !== "youtube" || currentPlaylist !== playlist || currentPlaylistIndex !== playlistIndex) return;
      const id = getCurrentYoutubeId();
      if (id && expandedPlayer && expandedPlayer.classList.contains("hidden") === false) {
        showExpandedClip();
      }
    }, 120);
  }
}
function setNowPlaying(item) {
  trackTitle && (trackTitle.textContent=item.title||"Aucun titre");
  trackArtist && (trackArtist.textContent=item.channelTitle||item.artist||"YouTube");
  detailTitle && (detailTitle.textContent=item.title||"Aucun titre");
  detailArtist && (detailArtist.textContent=item.channelTitle||item.artist||"YouTube");
  artistAbout && (artistAbout.textContent=item.channelTitle||item.artist||"YouTube");
  if (cover) cover.innerHTML=item.thumbnail?`<img src="${escapeHtml(item.thumbnail)}" alt="">`:`♫`;
  if (detailCover) detailCover.innerHTML=item.thumbnail?`<img src="${escapeHtml(item.thumbnail)}" alt="">`:`<span>♫</span>`;
  if (ytTitle) ytTitle.textContent=item.title||"Lecture YouTube";
  if (ytArtist) ytArtist.textContent=item.channelTitle||"YouTube";
  if (expandedTitle) expandedTitle.textContent=item.title||"Aucun titre";
  if (expandedArtist) expandedArtist.textContent=item.channelTitle||item.artist||"YouTube";
  if (expandedCover) expandedCover.innerHTML=item.thumbnail?`<img src="${escapeHtml(item.thumbnail)}" alt="Pochette de ${escapeHtml(item.title||"la musique")}" loading="eager">`:`<span>♫</span>`;
  currentTrackDuration=parseYouTubeDuration(item.duration)||0;
  if (expandedCurrent) expandedCurrent.textContent="0:00";
  if (expandedDuration) expandedDuration.textContent=currentTrackDuration?formatTime(currentTrackDuration):"0:00";
  if (expandedProgress) {expandedProgress.min="0";expandedProgress.max=String(currentTrackDuration||1);expandedProgress.value=0;}
  if (currentTimeEl) currentTimeEl.textContent="0:00";
  if (durationEl) durationEl.textContent=currentTrackDuration?formatTime(currentTrackDuration):"0:00";
  if (progress) {progress.min="0";progress.max=String(currentTrackDuration||1);progress.value=0;}
  playBtn && (playBtn.textContent="Ⅱ");
  updateLikeState();
  renderSimilarVideos();
}

/* ---------- recherche ---------- */
async function fetchWithTimeout(url, ms=9000) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),ms);
  try { return await fetch(url,{signal:controller.signal}); }
  finally { clearTimeout(timer); }
}
async function youtubeRequest(params, retry=true) {
  if (!apiKeys.length) throw new Error("Aucune clé API YouTube configurée.");
  const key=currentApiKey();
  const url=new URL("https://www.googleapis.com/youtube/v3/search");
  url.search=new URLSearchParams({...params,key}).toString();
  const response=await fetchWithTimeout(url);
  let data={}; try { data=await response.json(); } catch {}
  if (!response.ok) {
    const reason=data?.error?.errors?.[0]?.reason||"";
    const quota=reason.includes("quota") || reason.includes("dailyLimit") || response.status===403;
    if (quota && retry && rotateApiKey()) return youtubeRequest(params,true);
    const err=new Error(data?.error?.message||`Erreur YouTube (${response.status})`);
    err.quota=quota; throw err;
  }
  return data;
}
// Vérifie un ID YouTube précis sans lancer une recherche.
async function youtubeVideoStatus(videoId, retry=true) {
  if (!apiKeys.length || !videoId) return null;
  const key=currentApiKey();
  const url=new URL("https://www.googleapis.com/youtube/v3/videos");
  url.search=new URLSearchParams({part:"status",id:videoId,key}).toString();
  const response=await fetchWithTimeout(url,7000);
  let data={}; try { data=await response.json(); } catch {}
  if (!response.ok) {
    const reason=data?.error?.errors?.[0]?.reason||"";
    const quota=reason.includes("quota") || reason.includes("dailyLimit") || response.status===403;
    if (quota && retry && rotateApiKey()) return youtubeVideoStatus(videoId,true);
    return null;
  }
  const item=data?.items?.[0];
  if (!item) return {exists:false,embeddable:false};
  return {exists:true,embeddable:item?.status?.embeddable !== false};
}

async function ensurePlaylistClipEmbeddable(item) {
  if (!item?.videoId || currentSource !== "youtube") return item?.videoId || "";
  const originalId=item.videoId;
  try {
    const status=await youtubeVideoStatus(originalId);
    if (!status || (status.exists && status.embeddable)) return originalId;
  } catch(e) { console.warn("Vérification du clip impossible",e); }

  const title=String(item.title||trackTitle?.textContent||"").trim();
  const artist=String(item.artist||item.channelTitle||trackArtist?.textContent||"").trim();
  if (!title && !artist) return originalId;
  const cacheKey=`playlist-clip:${artist}\n${title}`.toLowerCase();
  const cached=embeddableClipCache.get(cacheKey);
  if (cached) { item.videoId=cached; currentYoutubeVideoId=cached; return cached; }

  for (const q of [`${artist} - ${title} official video`,`${artist} - ${title} clip`,`${artist} - ${title}`]) {
    try {
      const data=await youtubeRequest({part:"snippet",q,type:"video",videoCategoryId:"10",maxResults:"10",videoEmbeddable:"true",videoSyndicated:"true"});
      const candidate=(data.items||[]).find(v=>v?.id?.videoId && v.id.videoId!==originalId);
      if (!candidate?.id?.videoId) continue;
      const newId=candidate.id.videoId;
      embeddableClipCache.set(cacheKey,newId);
      item.videoId=newId; item.thumbnail=youtubeThumb(newId); currentYoutubeVideoId=newId;
      if (currentPlaylist?.videos?.[currentPlaylistIndex] === item) saveJSON("pulsePlaylists",playlistsData);
      return newId;
    } catch(e) { if(e?.quota) throw e; }
  }
  return originalId;
}

const searchCache=new Map();
let searchRequestId=0;
async function searchYouTube(query) {
  query=query.trim();if(!query)return;const requestId=++searchRequestId;showView("search");setMessage("Recherche YouTube…");if(results)results.innerHTML='<div class="empty">Recherche YouTube…</div>';
  const key=query.toLowerCase();const cached=searchCache.get(key);
  if(cached&&Date.now()-cached.time<300000){youtubeResults=cached.items;youtubeIndex=-1;currentPlaylist=null;currentPlaylistIndex=-1;resultCount&&(resultCount.textContent=`${youtubeResults.length} résultat${youtubeResults.length>1?"s":""}`);setMessage("");renderSearchResults();renderSimilarVideos();return;}
  try {const data=await youtubeRequest({part:"snippet",q:query,type:"video",videoCategoryId:"10",maxResults:"20",videoEmbeddable:"true",videoSyndicated:"true"});if(requestId!==searchRequestId)return;youtubeResults=data.items||[];searchCache.set(key,{time:Date.now(),items:youtubeResults});if(searchCache.size>30)searchCache.delete(searchCache.keys().next().value);youtubeIndex=-1;currentPlaylist=null;currentPlaylistIndex=-1;resultCount&&(resultCount.textContent=`${youtubeResults.length} résultat${youtubeResults.length>1?"s":""}`);setMessage("");renderSearchResults();renderSimilarVideos();}
  catch(e){if(requestId!==searchRequestId)return;console.error(e);if(e.name==="AbortError")setMessage("YouTube met trop de temps à répondre. Réessaie.");else if(e.quota)showApiHelp();else setMessage(`Recherche impossible : ${escapeHtml(e.message)}`);if(results)results.innerHTML='<div class="empty">Aucun résultat disponible.</div>';}
}
function renderSearchResults() {
  if(!results)return;
  if(!youtubeResults.length){results.innerHTML='<div class="empty">Aucun résultat trouvé.</div>';return;}
  results.innerHTML=youtubeResults.map((v,i)=>{
    const id=v.id?.videoId, title=escapeHtml(v.snippet?.title), channel=escapeHtml(v.snippet?.channelTitle);
    return `<article class="card" data-result="${i}">${thumbImg(id,"thumb",title)}<div class="card-body"><h3 class="result-title-open" title="${title}" data-open-result="${i}">${title}</h3><div class="meta">${channel}</div><div class="card-actions"><button class="listen" data-play="${i}" type="button">▶ Écouter</button><button class="playlist-add" data-add="${i}" type="button" title="Ajouter à une playlist">＋</button><button class="playlist-add" data-queue="${i}" type="button" title="Ajouter à la file">☷</button></div></div></article>`;
  }).join("");
  results.querySelectorAll("[data-play]").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();playYoutube(+b.dataset.play);}));
  results.querySelectorAll("[data-add]").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();openAddPlaylist(+b.dataset.add);}));
  results.querySelectorAll("[data-queue]").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();queueAdd(youtubeItem(youtubeResults[+b.dataset.queue]));}));
  results.querySelectorAll("[data-result]").forEach(card=>card.addEventListener("click",()=>playYoutube(+card.dataset.result)));
  results.querySelectorAll("[data-open-result]").forEach(title=>title.addEventListener("click",e=>{e.stopPropagation();playYoutube(+title.dataset.openResult);setTimeout(openExpandedPlayer,100);}));
}

/* ---------- navigation ---------- */
const viewHistory=[];
let viewHistoryIndex=-1;
function showView(view, options={}) {
  if(!["home","search","library","playlists"].includes(view)) view="home";
  ["home","search","library","playlists"].forEach(v=>document.getElementById(v+"View")?.classList.toggle("hidden",v!==view));
  document.querySelectorAll(".nav-btn[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  if(!options.fromHistory && viewHistory[viewHistoryIndex]!==view){viewHistory.splice(viewHistoryIndex+1);viewHistory.push(view);viewHistoryIndex=viewHistory.length-1;}
}
historyBackBtn?.addEventListener("click",()=>{if(viewHistoryIndex>0){viewHistoryIndex--;showView(viewHistory[viewHistoryIndex],{fromHistory:true});}});
historyForwardBtn?.addEventListener("click",()=>{if(viewHistoryIndex<viewHistory.length-1){viewHistoryIndex++;showView(viewHistory[viewHistoryIndex],{fromHistory:true});}});
document.querySelectorAll(".nav-btn[data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
document.querySelector(".logo-mark[data-view]")?.addEventListener("click",()=>showView("home"));
bookmarkBtn?.addEventListener("click",()=>{const idx=playlistsData.findIndex(p=>p.id==="liked-tracks");if(idx>=0)openPlaylist(idx);else showView("playlists");});

/* ---------- local audio ---------- */
function addLocalFiles(files) {
  [...files].filter(f=>f.type.startsWith("audio/")).forEach(file=>tracks.push({id:`${file.name}-${file.size}-${file.lastModified}`,title:file.name.replace(/\.[^.]+$/,""),artist:"Fichier local",url:URL.createObjectURL(file),file}));
  renderLibrary();
  if(currentIndex<0 && tracks.length) playTrack(0);
}
function playTrack(i) {
  if(!tracks[i])return;
  currentSource="local"; currentIndex=i; currentPlaylist=null; currentPlaylistIndex=-1;
  audio.src=tracks[i].url; audio.currentTime=0; audio.play().catch(()=>{});
  setNowPlaying({type:"local",id:tracks[i].id,title:tracks[i].title,artist:tracks[i].artist});
}
function renderLibrary() {
  if(libraryCount) libraryCount.textContent=`${tracks.length} titre${tracks.length!==1?"s":""}`;
  if(!library)return;
  library.innerHTML=tracks.length?tracks.map((t,i)=>`<article class="library-item"><div class="library-index">${i+1}</div><div class="library-info"><strong>${escapeHtml(t.title)}</strong><span>${escapeHtml(t.artist)}</span></div><button class="mini-play" data-local="${i}" type="button">▶</button></article>`).join(""):'<div class="empty">Aucun fichier MP3 ajouté.</div>';
  library.querySelectorAll("[data-local]").forEach(b=>b.addEventListener("click",()=>playTrack(+b.dataset.local)));
}
fileInput?.addEventListener("change",e=>addLocalFiles(e.target.files));
libraryFileInput?.addEventListener("change",e=>addLocalFiles(e.target.files));
audio.addEventListener("loadedmetadata",()=>{durationEl&&(durationEl.textContent=formatTime(audio.duration));progress&&(progress.value=0);updateTime(0,audio.duration);syncExpandedControls();});
audio.addEventListener("timeupdate",()=>{
  if(currentSource==="local") updateTime(audio.currentTime,audio.duration);
  else if(currentSource==="youtube") updateYoutubeProgressUniversal();
  if(currentSource==="local"||currentSource==="youtube") syncExpandedControls();
});
audio.addEventListener("seeked",()=>{ if(currentSource==="youtube") seekVisibleClipToAudio(audio.currentTime); });
audio.addEventListener("play",()=>{
  playBtn&&(playBtn.textContent="Ⅱ");
  if(currentSource==="youtube") startClipPlayback();
  syncExpandedControls();
});
audio.addEventListener("pause",()=>{
  playBtn&&(playBtn.textContent="▶");
  if(currentSource==="youtube") pauseClipPlayback();
  syncExpandedControls();
});
audio.addEventListener("error",()=>{
  if(currentSource==="youtube") setMessage("Impossible de lire cette musique. Vérifie que le serveur LANCER.bat est ouvert et que yt-dlp fonctionne.");
});
audio.addEventListener("ended",()=>{if(currentSource==="youtube")advanceAfterYoutube();else advanceAfterLocal();});

/* ---------- commandes ---------- */
function advanceAfterLocal(){
  if(repeat){audio.currentTime=0;audio.play().catch(()=>{});return;}
  if(playQueue.length){playNextFromQueue();return;}
  if(!tracks.length)return;
  let next=shuffle?Math.floor(Math.random()*tracks.length):currentIndex+1;
  if(next>=tracks.length)next=0; playTrack(next);
}
function advanceAfterYoutube(){
  if(repeat){
    const id=getCurrentYoutubeId();
    if(id) playYoutubeAudio(youtubeItem({videoId:id,title:trackTitle?.textContent,channelTitle:trackArtist?.textContent,thumbnail:cover?.querySelector("img")?.src}));
    return;
  }
  if(playQueue.length){playNextFromQueue();return;}
  if(currentPlaylist?.videos?.length){
    let next=shuffle?Math.floor(Math.random()*currentPlaylist.videos.length):currentPlaylistIndex+1;
    if(next>=currentPlaylist.videos.length) next=0;
    playYoutubeObject(currentPlaylist.videos[next],currentPlaylist,next); return;
  }
  if(youtubeResults.length){
    let next=shuffle?Math.floor(Math.random()*youtubeResults.length):youtubeIndex+1;
    if(next>=youtubeResults.length) next=0;
    playYoutube(next); return;
  }
}
function getCurrentYoutubeId(){return currentYoutubeVideoId || currentPlaylist?.videos?.[currentPlaylistIndex]?.videoId || youtubeResults[youtubeIndex]?.id?.videoId || "";}
function playNext(){if(currentSource==="local")advanceAfterLocal();else advanceAfterYoutube();}
function playPrev(){
  if(currentSource==="local"){playTrack((currentIndex-1+tracks.length)%tracks.length);return;}
  if(currentPlaylist?.videos?.length){let i=(currentPlaylistIndex-1+currentPlaylist.videos.length)%currentPlaylist.videos.length;playYoutubeObject(currentPlaylist.videos[i],currentPlaylist,i);return;}
  if(youtubeResults.length){playYoutube((youtubeIndex-1+youtubeResults.length)%youtubeResults.length);}
}
playBtn?.addEventListener("click",()=>togglePlayback());
nextBtn?.addEventListener("click",playNext); prevBtn?.addEventListener("click",playPrev);
shuffleBtn?.addEventListener("click",()=>{shuffle=!shuffle;shuffleBtn.classList.toggle("active",shuffle);shuffleBtn.setAttribute("aria-pressed",String(shuffle));});
repeatBtn?.addEventListener("click",()=>{repeat=!repeat;repeatBtn.classList.toggle("active",repeat);repeatBtn.setAttribute("aria-pressed",String(repeat));});
progress?.addEventListener("input",()=>{
  const value=Number(progress.value||0);
  if(currentSource==="local"||currentSource==="youtube") {
    const d=Number(audio.duration);
    if(Number.isFinite(d)&&d>0) {
      const t=Math.min(value,d);
      audio.currentTime=t;
      if(currentSource==="youtube") seekVisibleClipToAudio(t);
    }
  }
});
volume?.addEventListener("input",()=>{
  const v=Number(volume.value);
  audio.volume=v;
  if(ytPlayer && expandedClipVisible){ try{ytPlayer.setVolume?.(v*100);}catch(_){} }
});
muteBtn?.addEventListener("click",()=>{
  const muted=audio.volume>0;
  const next=muted?0:Number(volume?.value||1);
  audio.volume=next;
  if(ytPlayer && expandedClipVisible){
    if(next===0) ytPlayer.mute?.();
    else { ytPlayer.unMute?.(); ytPlayer.setVolume?.(next*100); }
  }
  muteBtn.classList.toggle("muted",muted);
});

/* ---------- lecteur agrandi / fiche du morceau ---------- */
function openExpandedPlayer() {
  if (!expandedPlayer) return;
  expandedPlayer.classList.remove("hidden");
  expandedPlayer.setAttribute("aria-hidden", "false");
  document.body.classList.add("expanded-player-open");
  if (expandedMediaTrack) expandedMediaTrack.style.transform = "translateX(0)";
  syncExpandedControls();
}
function closeExpandedPlayer() {
  if (!expandedPlayer) return;
  expandedPlayer.classList.add("hidden");
  expandedPlayer.setAttribute("aria-hidden", "true");
  expandedClipVisible = false;
  if (youtubePlayerElement) youtubePlayerElement.innerHTML = "";
  document.body.classList.remove("expanded-player-open");
}
function syncExpandedControls() {
  const playing = currentSource === "youtube" ? !audio.paused : (currentSource === "local" ? !audio.paused : false);
  if (expandedPlay) expandedPlay.textContent = playing ? "Ⅱ" : "▶";
  if (expandedShuffle) expandedShuffle.classList.toggle("active", shuffle);
  if (expandedRepeat) expandedRepeat.classList.toggle("active", repeat);
  updateLikeState();
}
function togglePlayback() {
  if(currentSource==="youtube" || currentSource==="local") {
    if(audio.paused) {
      audio.play().then(()=>{playBtn&&(playBtn.textContent="Ⅱ");}).catch(e=>console.warn("Lecture impossible",e));
    } else {
      audio.pause();
    }
  }
  setTimeout(syncExpandedControls,50);
}

function seekVisibleClipToAudio(time) {
  if (!expandedClipVisible || !youtubePlayerElement) return;
  const iframe = youtubePlayerElement.querySelector("iframe");
  if (!iframe || !iframe.contentWindow) return;
  const t = Math.max(0, Number(time) || 0);
  try {
    iframe.contentWindow.postMessage(JSON.stringify({
      event: "command",
      func: "seekTo",
      args: [t, true]
    }), "*");
  } catch (_) {}
}

function showExpandedClip() {
  if (!expandedMediaTrack) return;
  let id = getCurrentYoutubeId();
  const isYoutubeTrack = currentSource === "youtube" && !!id;

  expandedMediaTrack.style.transform = "translateX(-50%)";
  expandedClipVisible = isYoutubeTrack;

  if (!isYoutubeTrack) {
    if (expandedNoVideo) expandedNoVideo.style.display = "block";
    return;
  }

  if (expandedNoVideo) expandedNoVideo.style.display = "none";

  const openClip = async () => {
    // Si le morceau vient d'une playlist, on garde la recherche de clips
    // compatibles existante. Rien ne change côté lecteur audio.
    if (currentPlaylist && currentPlaylistIndex >= 0) {
      try {
        const item = currentPlaylist.videos?.[currentPlaylistIndex];
        id = await ensurePlaylistClipEmbeddable(item, false);
        currentYoutubeVideoId = id || currentYoutubeVideoId;
      } catch (e) {
        console.warn("Vérification du clip de playlist impossible", e);
      }
    }

    if (!expandedClipVisible || currentSource !== "youtube" || !id || !youtubePlayerElement) return;

    // Le clip est affiché dans une iframe YouTube indépendante.
    // Le son reste exclusivement géré par le lecteur audio /stream.
    // Cela évite l'écran noir du YT.Player partagé avec le lecteur audio.
    const start = Math.max(0, Math.floor(Number(audio?.currentTime || 0)));
    const autoplay = audio && !audio.paused ? 1 : 0;
    const src =
      `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` +
      `?autoplay=${autoplay}&mute=1&playsinline=1&rel=0&controls=1&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(location.origin)}` +
      `&start=${start}`;

    youtubePlayerElement.innerHTML =
      `<iframe title="Clip YouTube" src="${src}" ` +
      `allow="autoplay; encrypted-media; picture-in-picture; fullscreen" ` +
      `allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  };

  openClip();
}

function showExpandedCover() {
  if (expandedMediaTrack) expandedMediaTrack.style.transform = "translateX(0)";
  expandedClipVisible = false;
  if (youtubePlayerElement) youtubePlayerElement.innerHTML = "";
}
expandedOpen?.addEventListener("click", openExpandedPlayer);
trackTitle?.addEventListener("click", openExpandedPlayer);
cover?.addEventListener("click", openExpandedPlayer);
expandedClose?.addEventListener("click", closeExpandedPlayer);
expandedBackdrop?.addEventListener("click", closeExpandedPlayer);
expandedPlay?.addEventListener("click", togglePlayback);
expandedPrev?.addEventListener("click", playPrev);
expandedNext?.addEventListener("click", playNext);
expandedShuffle?.addEventListener("click", ()=>{shuffle=!shuffle;shuffleBtn?.classList.toggle("active",shuffle);expandedShuffle.classList.toggle("active",shuffle);});
expandedRepeat?.addEventListener("click", ()=>{repeat=!repeat;repeatBtn?.classList.toggle("active",repeat);expandedRepeat.classList.toggle("active",repeat);});
expandedProgress?.addEventListener("input",()=>{
  const value=Number(expandedProgress.value||0);
  if((currentSource==="local"||currentSource==="youtube")&&Number.isFinite(audio.duration)&&audio.duration>0) {
    const t=Math.min(value,audio.duration);
    audio.currentTime=t;
    if(currentSource==="youtube") seekVisibleClipToAudio(t);
  }
});
expandedLike?.addEventListener("click",toggleLike);
expandedQueue?.addEventListener("click",()=>{renderQueue();queueModal?.classList.remove("hidden");});
expandedShowClip?.addEventListener("click",showExpandedClip);
expandedMore?.addEventListener("click",()=>{
  const title=expandedTitle?.textContent||"Ce morceau";
  alert(`${title}\n\nUtilise les commandes du lecteur pour lire, mettre en pause, passer au morceau suivant ou ajouter le titre à tes favoris.`);
});
expandedDevice?.addEventListener("click",()=>downloadCurrentTrack());
expandedShare?.addEventListener("click",async()=>{
  const id=getCurrentYoutubeId();
  const url=id?`https://www.youtube.com/watch?v=${id}`:location.href;
  try { if(navigator.share) await navigator.share({title:expandedTitle?.textContent||"Pulse",url}); else await navigator.clipboard.writeText(url); setMessage("Lien copié."); }
  catch(e){}
});
detailPlay?.addEventListener("click",()=>{openExpandedPlayer();if(currentSource==="youtube")setTimeout(showExpandedClip,80);});

document.addEventListener("keydown",e=>{if(e.key==="Escape" && expandedPlayer && !expandedPlayer.classList.contains("hidden")) closeExpandedPlayer();});

/* Synchroniser les commandes du lecteur agrandi avec les boutons principaux. */
playBtn?.addEventListener("click",()=>setTimeout(syncExpandedControls,50));
nextBtn?.addEventListener("click",()=>setTimeout(syncExpandedControls,50));
prevBtn?.addEventListener("click",()=>setTimeout(syncExpandedControls,50));

/* ---------- actions secondaires : chaque bouton a une fonction ---------- */
homeFilterBtn?.addEventListener("click",()=>{const active=homeFilterBtn.classList.toggle("active");homeFilterBtn.textContent=active?"Tout":"Playlists";if(!active)showView("playlists");});
showRecommendationsBtn?.addEventListener("click",()=>showView("playlists"));
detailsMenuBtn?.addEventListener("click",()=>{const item=currentSource==="youtube"?youtubeItem({videoId:getCurrentYoutubeId(),title:trackTitle?.textContent,channelTitle:trackArtist?.textContent,thumbnail:cover?.querySelector("img")?.src}):null;if(!item?.videoId){setMessage("Sélectionne d'abord une musique YouTube.");return;}queueAdd(item);setMessage("✓ Morceau ajouté à la file d'attente.");});
expandedDevice?.addEventListener("click",()=>setMessage("Lecture sur cet appareil : le lecteur utilise l'audio de cette application."));

/* ---------- import Spotify ---------- */
function parseSpotifyPlaylistId(url) {
  const match = String(url || "").trim().match(/spotify\.com\/(?:embed\/)?playlist\/([a-zA-Z0-9]+)/i);
  return match ? match[1] : null;
}
function openSpotifyImport() {
  spotifyImportModal?.classList.remove("hidden");
  spotifyImportModal?.setAttribute("aria-hidden","false");
  if (spotifyImportStatus) spotifyImportStatus.textContent="";
  spotifyImportProgress?.classList.add("hidden");
  if (spotifyImportProgressBar) spotifyImportProgressBar.style.width="0%";
  setTimeout(()=>spotifyPlaylistUrl?.focus(),50);
}
function closeSpotifyImport() {
  spotifyImportModal?.classList.add("hidden");
  spotifyImportModal?.setAttribute("aria-hidden","true");
}
async function fetchSpotifyTracksNoApi(playlistId) {
  try {
    const response = await fetch(`/spotify?playlistId=${encodeURIComponent(playlistId)}`, {cache:"no-store"});
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.tracks) && data.tracks.length) return data;
    }
  } catch (e) {
    console.warn("Proxy Spotify local indisponible, fallback AllOrigins.", e);
  }
  const embedUrl = `https://open.spotify.com/embed/playlist/${playlistId}`;
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(embedUrl)}`;
  const response = await fetchWithTimeout(proxyUrl, 15000);
  const data = await response.json();
  if (!data.contents) throw new Error("Accès à la playlist Spotify impossible.");
  const parser = new DOMParser();
  const doc = parser.parseFromString(data.contents, "text/html");
  const scriptTag = doc.querySelector('script[id="__NEXT_DATA__"]');
  if (!scriptTag) throw new Error("Lecture des éléments Spotify impossible.");
  const jsonData = JSON.parse(scriptTag.textContent);
  const entity = jsonData?.props?.pageProps?.state?.data?.entity;
  const trackList = entity?.trackList;
  if (!trackList) throw new Error("Playlist introuvable, privée ou non accessible.");
  return {
    name: entity?.name || `Playlist Spotify ${playlistId.slice(0,6)}`,
    tracks: trackList.map(item => ({title:item.title, artist:item.subtitle})).filter(x=>x.title)
  };
}
async function importSpotifyPlaylist() {
  const playlistId = parseSpotifyPlaylistId(spotifyPlaylistUrl?.value);
  if (!playlistId) {
    if (spotifyImportStatus) spotifyImportStatus.textContent="Lien Spotify invalide. Colle un lien de playlist publique.";
    return;
  }
  importSpotifyBtn.disabled=true;
  spotifyImportProgress?.classList.remove("hidden");
  if (spotifyImportProgressBar) spotifyImportProgressBar.style.width="0%";
  try {
    if (spotifyImportStatus) spotifyImportStatus.textContent="Récupération de la playlist Spotify…";
    const data = await fetchSpotifyTracksNoApi(playlistId);
    const spotifyTracks = Array.isArray(data.tracks) ? data.tracks : [];
    if (!spotifyTracks.length) throw new Error("Aucun morceau trouvé dans cette playlist.");
    const tracksToImport = spotifyTracks.slice(0,100);
    const resultPlaylist = [];
    const existingKeys = new Set();
    for (let i=0;i<tracksToImport.length;i++) {
      const track=tracksToImport[i];
      if (spotifyImportProgressBar) spotifyImportProgressBar.style.width=`${Math.round(i/tracksToImport.length*100)}%`;
      if (spotifyImportStatus) spotifyImportStatus.textContent=`Recherche YouTube (${i+1}/${tracksToImport.length}) : ${track.artist} — ${track.title}`;
      try {
        const yt=await youtubeRequest({part:"snippet",q:`${track.artist} - ${track.title} official video`,type:"video",videoCategoryId:"10",maxResults:"5",videoEmbeddable:"true",videoSyndicated:"true"});
        const item=yt?.items?.[0];
        const videoId=item?.id?.videoId;
        if (!videoId || existingKeys.has(videoId)) continue;
        existingKeys.add(videoId);
        resultPlaylist.push({
          type:"youtube", videoId, title:track.title, artist:track.artist,
          channelTitle:item?.snippet?.channelTitle || track.artist,
          thumbnail:item?.snippet?.thumbnails?.high?.url || item?.snippet?.thumbnails?.medium?.url || youtubeThumb(videoId),
          duration:"", source:"spotify-import"
        });
      } catch(e) {
        console.warn("Morceau Spotify ignoré:",track,e);
        if (e?.quota) throw e;
      }
    }
    if (!resultPlaylist.length) throw new Error("Aucun morceau n'a pu être retrouvé sur YouTube.");
    const baseName=String(data.name || "Playlist Spotify").trim();
    const uniqueName=playlistsData.some(p=>p.name===baseName)?`${baseName} (Spotify)`:baseName;
    const imported={id:`spotify-${playlistId}-${Date.now()}`,name:uniqueName,videos:resultPlaylist,source:"spotify",spotifyPlaylistId:playlistId,importedAt:Date.now()};
    playlistsData.push(imported);
    saveJSON("pulsePlaylists",playlistsData);
    renderPlaylists();
    renderPlaylistQuickGrid();
    if (spotifyImportProgressBar) spotifyImportProgressBar.style.width="100%";
    if (spotifyImportStatus) {
      const skipped=spotifyTracks.length-resultPlaylist.length;
      spotifyImportStatus.textContent=`✓ "${uniqueName}" importée avec ${resultPlaylist.length} titre${resultPlaylist.length>1?"s":""}${skipped>0?` (${skipped} non retrouvé${skipped>1?"s":""})`:""}.`;
    }
    spotifyPlaylistUrl.value="";
    setTimeout(()=>{closeSpotifyImport();showView("playlists");},900);
  } catch(e) {
    console.error("Import Spotify:",e);
    if (spotifyImportStatus) spotifyImportStatus.textContent=e?.quota
      ?"Quota YouTube atteint pendant l'import. Ajoute une autre clé YouTube dans l'application puis réessaie."
      :`Erreur : ${e.message || "importation impossible"}`;
  } finally { importSpotifyBtn.disabled=false; }
}
openSpotifyImportBtn?.addEventListener("click",openSpotifyImport);
closeSpotifyImportBtn?.addEventListener("click",closeSpotifyImport);
spotifyImportBackdrop?.addEventListener("click",closeSpotifyImport);
importSpotifyBtn?.addEventListener("click",importSpotifyPlaylist);
spotifyPlaylistUrl?.addEventListener("keydown",e=>{if(e.key==="Enter")importSpotifyPlaylist();});

/* ---------- playlists ---------- */
function savePlaylists(){saveJSON("pulsePlaylists",playlistsData);renderPlaylists();renderPlaylistQuickGrid();}
function renderPlaylistQuickGrid(){
  if(!playlistQuickGrid)return;
  playlistQuickGrid.innerHTML=playlistsData.slice(0,8).map((p,i)=>{const first=p.videos?.[0];const cover=first?.videoId?`<img src="${escapeHtml(youtubeThumb(first.videoId))}" alt="" loading="lazy">`:`♫`;return `<button class="quick-card playlist-quick-card" data-quick-playlist="${i}" type="button"><span class="quick-cover cover-purple">${cover}</span><span><strong>${escapeHtml(p.name)}</strong><span class="playlist-count">${p.videos.length} titre${p.videos.length!==1?"s":""}</span></span></button>`;}).join("");
  playlistQuickGrid.querySelectorAll("[data-quick-playlist]").forEach(b=>b.addEventListener("click",()=>openPlaylist(+b.dataset.quickPlaylist)));
}
function renderPlaylists(){
  if(!playlistsEl)return;
  ensureLikedPlaylist();
  playlistsEl.innerHTML=playlistsData.map((p,i)=>{
    const first=p.videos?.[0];
    const cover=first?.videoId ? thumbImg(first.videoId,"playlist-cover-img",p.name) : '<span>♫</span>';
    const isLiked=p.id==="liked-tracks";
    return `<article class="playlist-card ${isLiked?'liked-playlist-card':''}">
      <div class="playlist-cover">${cover}</div>
      <div class="playlist-card-body"><h3>${escapeHtml(p.name)}</h3><span>${p.videos.length} titre${p.videos.length!==1?'s':''}</span>
      <button class="primary-btn open-playlist" data-playlist="${i}" type="button">Ouvrir</button>
      ${isLiked?'':'<button class="delete-playlist" data-delete-playlist="'+i+'" type="button">×</button>'}</div></article>`;
  }).join("");
  playlistsEl.querySelectorAll("[data-playlist]").forEach(b=>b.addEventListener("click",()=>openPlaylist(+b.dataset.playlist)));
  playlistsEl.querySelectorAll("[data-delete-playlist]").forEach(b=>b.addEventListener("click",e=>{e.stopPropagation();playlistsData.splice(+b.dataset.deletePlaylist,1);savePlaylists();}));
}
function openPlaylist(i){
  const p=playlistsData[i];if(!p)return;showView("playlists");currentPlaylist=p;
  const first=p.videos?.[0];
  const bigCover=first?.videoId ? thumbImg(first.videoId,"big-playlist-cover-img",p.name) : '<span>♫</span>';
  playlistsEl.innerHTML=`<div class="playlist-detail">
    <button class="back-btn" id="backPlaylists" type="button">← Toutes les playlists</button>
    <div class="playlist-detail-head"><div class="big-playlist-cover">${bigCover}</div><div><p class="eyebrow">PLAYLIST</p><h2>${escapeHtml(p.name)}</h2><span>${p.videos.length} titres</span></div></div>
    <div class="playlist-items">${p.videos.map((v,j)=>{
      const img=v.videoId?`<img src="${escapeHtml(youtubeThumb(v.videoId))}" alt="" loading="lazy" onerror="this.onerror=null;this.src='https://i.ytimg.com/vi/${encodeURIComponent(v.videoId)}/mqdefault.jpg'">`:'♫';
      return `<div class="playlist-item">
        <button class="playlist-item-cover" data-pl-open="${j}" type="button">${img}</button>
        <div class="playlist-item-info"><strong class="playlist-title-open" data-pl-open="${j}">${escapeHtml(v.title)}</strong><span>${escapeHtml(v.channelTitle||"YouTube")} ${v.duration?`· ${v.duration}`:""}</span></div>
        <button class="mini-play" data-pl-play="${j}" type="button">▶</button><button class="remove-video" data-pl-remove="${j}" type="button">×</button>
      </div>`;
    }).join("")}</div></div>`;
  $("#backPlaylists")?.addEventListener("click",renderPlaylists);
  playlistsEl.querySelectorAll("[data-pl-play]").forEach(b=>b.addEventListener("click",()=>playYoutubeObject(p.videos[+b.dataset.plPlay],p,+b.dataset.plPlay)));
  playlistsEl.querySelectorAll("[data-pl-open]").forEach(b=>b.addEventListener("click",e=>{
    e.stopPropagation();
    const j=+b.dataset.plOpen;
    playYoutubeObject(p.videos[j],p,j);
    openExpandedPlayer();
    setTimeout(showExpandedClip,140);
  }));
  playlistsEl.querySelectorAll("[data-pl-remove]").forEach(b=>b.addEventListener("click",()=>{p.videos.splice(+b.dataset.plRemove,1);savePlaylists();openPlaylist(i);}));
}
function openAddPlaylist(resultIndex){
  const item=youtubeItem(youtubeResults[resultIndex]);
  playlistChoices.innerHTML=playlistsData.map((p,i)=>`<button class="playlist-choice" data-choice="${i}" type="button">♫ ${escapeHtml(p.name)}</button>`).join("");
  playlistChoices.querySelectorAll("[data-choice]").forEach(b=>b.addEventListener("click",()=>{const p=playlistsData[+b.dataset.choice];if(!p)return;if(!p.videos.some(v=>playableKey(v)===playableKey(item)))p.videos.push(item);savePlaylists();addPlaylistModal.classList.add("hidden");}));
  addPlaylistModal?.classList.remove("hidden");
}
newPlaylistBtn?.addEventListener("click",()=>{playlistNameInput.value="";playlistModal.classList.remove("hidden");setTimeout(()=>playlistNameInput.focus(),50);});
createPlaylistBtn?.addEventListener("click",()=>{const n=playlistNameInput.value.trim();if(!n)return;playlistsData.push({id:`pl-${Date.now()}`,name:n,videos:[]});savePlaylists();playlistModal.classList.add("hidden");});
cancelPlaylistBtn?.addEventListener("click",()=>playlistModal.classList.add("hidden"));closePlaylistModal?.addEventListener("click",()=>playlistModal.classList.add("hidden"));closeAddPlaylistModal?.addEventListener("click",()=>addPlaylistModal.classList.add("hidden"));newPlaylistFromAddBtn?.addEventListener("click",()=>{addPlaylistModal.classList.add("hidden");newPlaylistBtn?.click();});

/* ---------- queue / récents ---------- */
function queueAdd(item){if(!item||!playableKey(item)||playQueue.some(x=>playableKey(x)===playableKey(item)))return;playQueue.push(item);saveJSON("pulsePlayQueue",playQueue);renderQueue();}
function playNextFromQueue(){const item=playQueue.shift();saveJSON("pulsePlayQueue",playQueue);renderQueue();if(!item)return;if(item.type==="local"){const i=tracks.findIndex(t=>t.id===item.id);if(i>=0)playTrack(i);}else playYoutubeObject(item);}
function renderQueue(){if(!queueList)return;queueList.innerHTML=playQueue.length?playQueue.map((x,i)=>`<div class="queue-item" data-queue-index="${i}"><span>${escapeHtml(x.title)}</span><button data-qplay="${i}" type="button">▶</button><button data-qremove="${i}" type="button">×</button></div>`).join(""):'<div class="empty">La file est vide.</div>';queueList.querySelectorAll("[data-qplay]").forEach(b=>b.addEventListener("click",()=>{const x=playQueue.splice(+b.dataset.qplay,1)[0];saveJSON("pulsePlayQueue",playQueue);renderQueue();x.type==="local"?playTrack(tracks.findIndex(t=>t.id===x.id)):playYoutubeObject(x);}));queueList.querySelectorAll("[data-qremove]").forEach(b=>b.addEventListener("click",()=>{playQueue.splice(+b.dataset.qremove,1);saveJSON("pulsePlayQueue",playQueue);renderQueue();}));}
function recordRecent(item){if(!item)return;recentPlayed=[{...item,playedAt:Date.now()},...recentPlayed.filter(x=>playableKey(x)!==playableKey(item))].slice(0,12);saveJSON("pulseRecentlyPlayed",recentPlayed);renderRecent();}
function renderRecent(){if(!recentlyPlayed)return;recentlyPlayed.innerHTML=recentPlayed.length?recentPlayed.slice(0,8).map((x,i)=>`<button class="recommend-card recent-card" data-recent="${i}" type="button"><div class="recommend-art">${x.thumbnail?`<img src="${escapeHtml(x.thumbnail)}" alt="">`:`♫`}</div><h3>${escapeHtml(x.title)}</h3><p>${escapeHtml(x.channelTitle||x.artist||"YouTube")}</p></button>`).join(""):'<article class="recommend-card recent-empty-card"><div class="recommend-art">◷</div><h3>Rien pour l’instant</h3><p>Les morceaux que tu écoutes apparaîtront ici.</p></article>';recentlyPlayed.querySelectorAll("[data-recent]").forEach(b=>b.addEventListener("click",()=>playYoutubeObject(recentPlayed[+b.dataset.recent])));}
queueBtn?.addEventListener("click",()=>{renderQueue();queueModal?.classList.remove("hidden")});closeQueue?.addEventListener("click",()=>queueModal?.classList.add("hidden"));queueModal?.addEventListener("click",e=>{if(e.target===queueModal)queueModal.classList.add("hidden")});clearQueue?.addEventListener("click",()=>{playQueue=[];saveJSON("pulsePlayQueue",playQueue);renderQueue()});clearRecentBtn?.addEventListener("click",()=>{recentPlayed=[];saveJSON("pulseRecentlyPlayed",recentPlayed);renderRecent()});

/* ---------- détails / recommandations ---------- */
function renderRecommendations(){
  if(!recommendations)return;
  const list=(playlistsData.find(p=>p.id==="hits-2026")?.videos||[]).slice(0,6);
  recommendations.innerHTML=list.length?list.map((v,i)=>`<button class="recommend-card" data-rec="${i}" type="button"><div class="recommend-art">${v.videoId?thumbImg(v.videoId,"recommend-img",v.title):"♫"}</div><h3>${escapeHtml(v.title)}</h3><p>${escapeHtml(v.channelTitle||"YouTube")}</p></button>`).join(""):'<article class="recommend-card"><div class="recommend-art">♫</div><h3>Tes recommandations</h3><p>Les nouveautés apparaîtront ici.</p></article>';
  recommendations.querySelectorAll("[data-rec]").forEach(b=>b.addEventListener("click",()=>playYoutubeObject(list[+b.dataset.rec])));
}
function renderSimilarVideos(){
  if(!similarVideos)return;
  const currentId = getCurrentYoutubeId?.() || "";
  let candidates=[];
  if(currentPlaylist?.videos?.length){
    candidates=currentPlaylist.videos.filter(v=>v.videoId && v.videoId!==currentId);
  }
  if(!candidates.length){
    candidates=youtubeResults.filter(v=>(v.id?.videoId||"")!==currentId).map(youtubeItem);
  }
  if(!candidates.length){
    const base=(playlistsData.find(p=>p.id==="hits-2026")?.videos||[]);
    candidates=base.filter(v=>v.videoId!==currentId);
  }
  candidates=candidates.slice(0,6);
  similarVideos.innerHTML=candidates.length?candidates.map((v,index)=>{
    const id=v.videoId||v.id?.videoId||"";
    const title=escapeHtml(v.title||v.snippet?.title||"Vidéo YouTube");
    const channel=escapeHtml(v.channelTitle||v.snippet?.channelTitle||"YouTube");
    return `<div class="similar-item"><img class="similar-thumb" src="${escapeHtml(v.thumbnail||youtubeThumb(id))}" alt="" loading="lazy"><div class="similar-info"><strong title="${title}">${title}</strong><span>${channel}</span></div><button class="similar-play" data-similar-id="${escapeHtml(id)}" type="button">▶ Écouter</button></div>`;
  }).join(""):'<div class="similar-empty">Aucun titre similaire disponible pour le moment.</div>';
  similarVideos.querySelectorAll("[data-similar-id]").forEach(b=>b.addEventListener("click",()=>{
    const id=b.dataset.similarId;
    const item=[...candidates].find(v=>(v.videoId||v.id?.videoId)===id);
    if(item) playYoutubeObject(item);
  }));
}
refreshSimilar?.addEventListener("click",()=>renderSimilarVideos());

function updateLikeState(){const item=currentSource==="youtube"?youtubeItem({videoId:getCurrentYoutubeId(),title:trackTitle?.textContent,channelTitle:trackArtist?.textContent,thumbnail:cover?.querySelector("img")?.src}):null;const liked=loadJSON("pulseLiked",[]);const on=item&&liked.some(x=>playableKey(x)===playableKey(item));[playerLike,detailLike].forEach(b=>{if(b)b.textContent=on?"♥":"♡";});}
function toggleLike(){
  if(currentSource!=="youtube")return;
  const item=youtubeItem({videoId:getCurrentYoutubeId(),title:trackTitle?.textContent,channelTitle:trackArtist?.textContent,thumbnail:cover?.querySelector("img")?.src});
  let liked=loadJSON("pulseLiked",[]);
  const k=playableKey(item);
  liked=liked.some(x=>playableKey(x)===k)?liked.filter(x=>playableKey(x)!==k):[...liked,item];
  saveJSON("pulseLiked",liked);
  const p=ensureLikedPlaylist();
  p.videos=liked.slice();
  saveJSON("pulsePlaylists",playlistsData);
  renderPlaylists();
  renderPlaylistQuickGrid();
  updateLikeState();
}
playerLike?.addEventListener("click",toggleLike);detailLike?.addEventListener("click",toggleLike);


/* ---------- téléchargement MP3 ---------- */
function cleanDownloadName(value){
  return String(value||"Musique").replace(/[<>:"/\\|?*\x00-\x1F]/g,"_").replace(/\s+/g," ").trim().slice(0,120) || "Musique";
}
function currentTrackForDownload(){
  if(currentSource==="local" && tracks[currentIndex]){
    return {title:tracks[currentIndex].title, artist:tracks[currentIndex].artist, url:tracks[currentIndex].url, local:true};
  }
  if(currentSource==="youtube"){
    const id=getCurrentYoutubeId();
    if(!id) return null;
    return {title:trackTitle?.textContent||"Musique YouTube", artist:trackArtist?.textContent||"YouTube", videoId:id, local:false};
  }
  return null;
}
async function downloadCurrentTrack(){
  const item=currentTrackForDownload();
  if(!item){ setMessage("Sélectionne d'abord une musique."); return; }

  // Pour un MP3 déjà présent sur le PC, on réutilise directement son Blob URL.
  if(item.local && item.url){
    const a=document.createElement("a");
    a.href=item.url;
    a.download=`${cleanDownloadName(item.title)}_${cleanDownloadName(item.artist)}.mp3`;
    document.body.appendChild(a); a.click(); a.remove();
    return;
  }

  if(!item.videoId){
    setMessage("Aucun morceau téléchargeable sélectionné.");
    return;
  }

  const base = (location.protocol === "http:" || location.protocol === "https:") ? "" : "http://127.0.0.1:8000";
  const title = item.title || "Musique";
  const artist = item.artist || "YouTube";
  const url = `${base}/download?videoId=${encodeURIComponent(item.videoId)}&title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`;
  setMessage(`Téléchargement de « ${escapeHtml(title)} » — ${escapeHtml(artist)}…`, true);
  window.location.href = url;
}
downloadBtn?.addEventListener("click",downloadCurrentTrack);

/* ---------- recherche / fenêtres ---------- */
searchBtn?.addEventListener("click",()=>searchYouTube(searchInput.value));
searchInput?.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();searchYouTube(searchInput.value);}});
clearBtn?.addEventListener("click",()=>{searchInput.value="";youtubeResults=[];youtubeIndex=-1;resultCount&&(resultCount.textContent="");setMessage("");if(results)results.innerHTML='<div class="empty">Lance une recherche pour trouver des vidéos musicales.</div>';});
closeModal?.addEventListener("click",()=>youtubeModal?.classList.add("hidden"));
youtubeModal?.addEventListener("click",e=>{if(e.target===youtubeModal)youtubeModal.classList.add("hidden")});

/* ---------- démarrage ---------- */
if(volume){audio.volume=Number(volume.value||1);}else audio.volume=1;
renderLibrary();renderPlaylists();renderPlaylistQuickGrid();renderRecent();renderQueue();renderRecommendations();
viewHistory.push("home");viewHistoryIndex=0;showView("home",{fromHistory:true});
