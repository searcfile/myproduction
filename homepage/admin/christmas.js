(()=>{'use strict';if(window.__christmasV3||self!==top)return;window.__christmasV3=true;
const defaults={"enabled": true, "effectEnabled": true, "musicEnabled": true, "showEffectButton": true, "showMusicButton": true, "allowEffectToggle": true, "allowMusicToggle": true, "defaultEffectOn": true, "defaultMusicOn": true, "scheduleMode": "december", "startDate": "2026-12-01", "endDate": "2026-12-31", "desktopCount": 80, "mobileCount": 35, "rotation": 360, "direction": "random", "fallSeconds": 12, "spinSeconds": 4, "size": 20, "opacity": 80, "swing": 20, "symbols": "❄|❅|❆|☃️|🎁|🎄|⭐|🔔|🎅", "musicUrl": "./merrychristmas/MerryXmast.mp3", "volume": 30, "loop": true, "pauseWhenHidden": true, "side": "right", "bottom": 20, "offset": 20, "accessMode": "all"};
Object.assign(defaults, {

  showMiniPlayer: true,

  allowPlayPause: true,

  allowTrackSkip: true,

  allowMusicSeek: true,

  allowVolumeControl: true,

  rememberPlayback: true,

  autoSkipMusicError: true

});
const limits={"desktopCount": [0, 120], "mobileCount": [0, 60], "rotation": [0, 1080], "fallSeconds": [3, 60], "spinSeconds": [1, 30], "size": [8, 40], "opacity": [10, 100], "swing": [0, 60], "volume": [0, 100], "bottom": [0, 150], "offset": [0, 100]};
const choices={"scheduleMode": ["december", "always", "custom"], "direction": ["random", "right", "left"], "side": ["right", "left"], "accessMode": ["all", "superadmin", "siteadmin"]};
function normalize(raw={}){const d={...defaults};for(const k of Object.keys(d)){const v=raw[k];if(typeof d[k]==='boolean'){if(typeof v==='boolean')d[k]=v;}else if(limits[k]){if(typeof v==='number'&&Number.isFinite(v))d[k]=Math.max(limits[k][0],Math.min(limits[k][1],v));}else if(choices[k]){if(choices[k].includes(v))d[k]=v;}else if(typeof v==='string'&&v.length<=1000)d[k]=v;}return d;}
let config=null,uid='',role='',ref=null,epoch=0,layer,audio,lastEffect='',lastMusic='',timer;
let musicRef = null;
let musicData = {};
      let musicReady = false;
let currentTrackId = null;
let playlistFinished = false;
let playlistSignature = '';
let miniPlayer = null;

let manualPaused = false;

let musicAvailable = false;

let musicFailed = false;

let currentMusicTitle = '';

let restoredPlayback = false;

let failedTracks = new Set();

let pendingSeek = null;

let lastPlaybackSave = 0;
const playbackModes = [
  'play_one',
  'repeat_one',
  'play_all',
  'repeat_all',
  'shuffle'
];
const key=k=>'5g88.christmas.'+uid+'.'+k;
let floating, drag, closeTimer, suppressClick=false;
const positionKey=()=> '5g88.christmas.floating.position.v1:'+uid;
function closeFloat(){clearTimeout(closeTimer);floating?.classList.remove('is-open');floating?.querySelector('button').setAttribute('aria-expanded','false');}
function fitPanel(){const panel=floating.querySelector('.christmas-floating-panel');const y=floating.getBoundingClientRect().top;panel.style.top=-Math.max(0,Math.min(y-8,panel.offsetHeight-(innerHeight-y-8)))+'px';}
function openFloat(){if(!floating||floating.hidden||drag?.moved)return;clearTimeout(closeTimer);floating.classList.add('is-open');floating.querySelector('button').setAttribute('aria-expanded','true');fitPanel();}
function clampY(y) {
  const min = 8;

  const max = Math.max(
    min,
    innerHeight - (floating.offsetHeight || 58) - 8
  );

  return Math.max(min, Math.min(max, y));
}
function positionFloat(d){floating.dataset.side=d.side;floating.style.left=d.side==='left'?d.offset+'px':'auto';floating.style.right=d.side==='right'?d.offset+'px':'auto';floating.style.bottom='auto';if(drag)return;let y=innerHeight-floating.offsetHeight-d.bottom;try{const raw=localStorage.getItem(positionKey());if(raw!==null&&Number.isFinite(Number(raw)))y=Number(raw);}catch{}floating.style.top=clampY(y)+'px';fitPanel();}
/* ==========================================
   CHRISTMAS MINI MUSIC PLAYER
   ========================================== */

function readPlayerStorage(name, fallback = null) {

  if (!uid) return fallback;

  try {

    const raw = localStorage.getItem(
      key('player.' + name)
    );

    return raw === null
      ? fallback
      : JSON.parse(raw);

  } catch {

    return fallback;

  }

}

function writePlayerStorage(name, value) {

  if (!uid) return;

  try {

    localStorage.setItem(
      key('player.' + name),
      JSON.stringify(value)
    );

  } catch {}

}

function getPlayerVolume(d) {

  const value = d.allowVolumeControl
    ? readPlayerStorage('volume', d.volume)
    : d.volume;

  return typeof value === 'number' &&
    Number.isFinite(value)
      ? Math.max(0, Math.min(100, value))
      : d.volume;

}

function formatMusicTime(seconds) {

  if (!Number.isFinite(seconds) || seconds < 0) {
    return '0:00';
  }

  const minutes = Math.floor(seconds / 60);

  const secs = Math.floor(seconds % 60);

  return minutes + ':' +
    String(secs).padStart(2, '0');

}

function playerIcon(name) {

  const paths = {

    play: '<path d="m8 5 12 7-12 7z" fill="currentColor" stroke="none"/>',

    pause: '<path d="M9 5v14M15 5v14" stroke-width="3"/>',

    previous: '<path d="M6 5v14m13-14L9 12l10 7z"/>',

    next: '<path d="M18 5v14M5 5l10 7-10 7z"/>',

    volume: '<path d="M11 5 6 9H3v6h3l5 4zM15 9a4 4 0 0 1 0 6m3-9a8 8 0 0 1 0 12"/>',

    mute: '<path d="M11 5 6 9H3v6h3l5 4zM16 9l6 6m0-6-6 6"/>',

    music: '<path d="M9 18V5l11-2v13M9 18a3 3 0 1 1-3-3h3m11 1a3 3 0 1 1-3-3h3"/>'

  };

  return `<svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round">

    ${paths[name] || ''}

  </svg>`;

}

function createMiniPlayer(root) {

  const panel = root.querySelector(
    '.christmas-floating-panel'
  );

  miniPlayer = document.createElement('div');

  miniPlayer.className = 'christmas-mini-player';

  miniPlayer.hidden = true;

  miniPlayer.innerHTML = `

    <div class="christmas-player-heading">

      <div class="christmas-player-art">
        ${playerIcon('music')}
      </div>

      <div class="christmas-player-info">

        <span class="christmas-player-caption">
          NOW PLAYING
        </span>

        <strong data-player="title">
          No Music
        </strong>

        <span data-player="mode"></span>

      </div>

    </div>

    <div class="christmas-player-progress">

      <input
        type="range"
        data-player="seek"
        aria-label="Music progress"
        min="0"
        max="1"
        step="0.1"
        value="0">

      <div class="christmas-player-time">

        <span data-player="current">0:00</span>

        <span data-player="duration">0:00</span>

      </div>

    </div>

    <div class="christmas-player-controls">

      <button
        type="button"
        data-player="previous"
        aria-label="Previous music"
        title="Previous music">

        ${playerIcon('previous')}

      </button>

      <button
        type="button"
        class="christmas-player-play"
        data-player="play"
        aria-label="Play music"
        title="Play music">

        ${playerIcon('play')}

      </button>

      <button
        type="button"
        data-player="next"
        aria-label="Next music"
        title="Next music">

        ${playerIcon('next')}

      </button>

    </div>

    <div class="christmas-player-volume">

      <button
        type="button"
        data-player="mute"
        aria-label="Mute music"
        title="Mute music">

        ${playerIcon('volume')}

      </button>

      <input
        type="range"
        data-player="volume"
        aria-label="Music volume"
        min="0"
        max="100"
        step="1"
        value="30">

      <span data-player="volumeText">30%</span>

    </div>

    <div
      class="christmas-player-status"
      data-player="status"
      aria-live="polite">
    </div>

  `;

  panel.append(miniPlayer);

  const get = name => miniPlayer.querySelector(
    '[data-player="' + name + '"]'
  );

  get('play').addEventListener('click', () => {

    if (
      !config?.allowPlayPause ||
      !musicAvailable ||
      !audio
    ) return;

    if (musicFailed || playlistFinished || audio.paused) {

      manualPaused = false;

      if (musicFailed) {

        failedTracks.clear();

        musicFailed = false;

        audio.load();

      }

      if (playlistFinished) {

        playlistFinished = false;

        audio.currentTime = 0;

      }

      play();

    } else {

      manualPaused = true;

      audio.pause();

    }

    savePlaybackPosition(true);

    syncMiniPlayer();

  });

  get('previous').addEventListener(
    'click',
    () => changePlayerTrack(-1)
  );

  get('next').addEventListener(
    'click',
    () => changePlayerTrack(1)
  );

  get('seek').addEventListener('input', event => {

    if (
      !config?.allowMusicSeek ||
      !musicAvailable ||
      !audio ||
      !Number.isFinite(audio.duration)
    ) return;

    audio.currentTime = Math.max(
      0,
      Math.min(
        audio.duration,
        Number(event.target.value)
      )
    );

    savePlaybackPosition(true);

    syncMiniPlayer();

  });

  get('volume').addEventListener('input', event => {

    if (!config?.allowVolumeControl) return;

    const volume = Number(event.target.value);

    writePlayerStorage('volume', volume);

    if (audio) audio.volume = volume / 100;

    syncMiniPlayer();

  });

  get('mute').addEventListener('click', () => {

    if (!config?.allowVolumeControl) return;

    const volume = getPlayerVolume(config);

    if (volume > 0) {

      writePlayerStorage('lastVolume', volume);

      writePlayerStorage('volume', 0);

    } else {

      const previous = readPlayerStorage(
        'lastVolume',
        config.volume || 30
      );

      writePlayerStorage(
        'volume',
        Math.max(1, Math.min(100, Number(previous) || 30))
      );

    }

    if (audio) {

      audio.volume =
        getPlayerVolume(config) / 100;

    }

    syncMiniPlayer();

  });

}

function syncMiniPlayer() {

  if (!miniPlayer || !config) return;

  const d = config;

  miniPlayer.hidden =
    !d.showMiniPlayer || !musicAvailable;

  if (miniPlayer.hidden) return;

  const get = name => miniPlayer.querySelector(
    '[data-player="' + name + '"]'
  );

  const tracks = getMusicTracks();

  const mode = getPlaybackMode();

  const singleMode = [
    'play_one',
    'repeat_one'
  ].includes(mode);

  const labels = {

    play_one: 'Play One',

    repeat_one: 'Repeat One',

    play_all: 'Play All',

    repeat_all: 'Repeat All',

    shuffle: 'Shuffle'

  };

  get('title').textContent =
    currentMusicTitle || 'Loading music...';

  get('mode').textContent =
    labels[mode] || mode;

  const paused = !audio || audio.paused;

  const playButton = get('play');

  const icon = paused ? 'play' : 'pause';

  if (playButton.dataset.icon !== icon) {

    playButton.dataset.icon = icon;

    playButton.innerHTML = playerIcon(icon);

  }

  playButton.setAttribute(
    'aria-label',
    paused ? 'Play music' : 'Pause music'
  );

  playButton.title =
    paused ? 'Play music' : 'Pause music';

  playButton.disabled =
    !d.allowPlayPause || !audio || !lastMusic;

  get('previous').disabled =
    !d.allowTrackSkip ||
    singleMode ||
    tracks.length < 2;

  get('next').disabled =
    !d.allowTrackSkip ||
    singleMode ||
    tracks.length < 2;

  const duration =
    Number.isFinite(audio?.duration)
      ? audio.duration
      : 0;

  const current =
    Number.isFinite(audio?.currentTime)
      ? audio.currentTime
      : 0;

  const seek = get('seek');

  seek.disabled =
    !d.allowMusicSeek || !duration;

  seek.max = duration || 1;

  seek.value = Math.min(
    current,
    duration || 1
  );

  get('current').textContent =
    formatMusicTime(current);

  get('duration').textContent =
    formatMusicTime(duration);

  const volume = getPlayerVolume(d);

  get('volume').disabled =
    !d.allowVolumeControl;

  get('volume').value = volume;

  get('volumeText').textContent =
    volume + '%';

  const mute = get('mute');

  mute.disabled = !d.allowVolumeControl;

  const volumeIcon = volume ? 'volume' : 'mute';

  if (mute.dataset.icon !== volumeIcon) {

    mute.dataset.icon = volumeIcon;

    mute.innerHTML = playerIcon(volumeIcon);

  }

  mute.title = volume ? 'Mute music' : 'Unmute music';

  mute.setAttribute('aria-label', mute.title);

  get('status').textContent = musicFailed
    ? 'Music unavailable'
    : playlistFinished
      ? 'Playback completed'
      : '';

}

function changePlayerTrack(direction) {

  if (
    !config?.allowTrackSkip ||
    !musicAvailable
  ) return;

  const mode = getPlaybackMode();

  if (
    mode === 'play_one' ||
    mode === 'repeat_one'
  ) return;

  const tracks = getMusicTracks();

  if (tracks.length < 2) return;

  let index = tracks.findIndex(
    track => track.id === currentTrackId
  );

  if (index < 0) index = 0;

  index = (
    index + direction + tracks.length
  ) % tracks.length;

  currentTrackId = tracks[index].id;

  playlistFinished = false;

  manualPaused = false;

  musicFailed = false;

  failedTracks.clear();

  pendingSeek = null;

  if (audio) {

    audio.pause();

    audio.currentTime = 0;

  }

  lastMusic = '';

  render();

  savePlaybackPosition(true);

}

function savePlaybackPosition(force = false) {

  if (
    !uid ||
    !musicReady ||
    !restoredPlayback ||
    !config?.rememberPlayback ||
    !musicAvailable ||
    !audio ||
    !lastMusic ||
    pendingSeek !== null ||
    audio.readyState < 1 ||
    audio.seeking ||
    audio.src !== lastMusic ||
    !Number.isFinite(audio.currentTime)
  ) return;

  if (
    !force &&
    Date.now() - lastPlaybackSave < 1000
  ) return;

  lastPlaybackSave = Date.now();

  writePlayerStorage('playback', {

    trackId: currentTrackId,

    url: lastMusic,

    time: audio.currentTime,

    paused: manualPaused,

    finished: playlistFinished,

    mode: getPlaybackMode(),

    signature: playlistSignature

  });

}
function applyPendingSeek() {

  if (
    !pendingSeek ||
    !audio ||
    audio.src !== pendingSeek.url ||
    audio.readyState < 1 ||
    !Number.isFinite(audio.duration)
  ) return;

  try {

    const target = Math.max(
      0,
      Math.min(
        pendingSeek.time,
        Math.max(0, audio.duration - 0.2)
      )
    );

    audio.currentTime = target;

    pendingSeek = null;

    console.log(
      '[Christmas Player] Playback restored',
      {
        time: target,
        paused: manualPaused
      }
    );

  } catch (error) {

    console.warn(
      '[Christmas Player] Restore seek failed',
      error.message
    );

  }

}

function handleMusicError() {

  if (!musicAvailable || !audio || !config) return;

  if (currentTrackId) {

    failedTracks.add(currentTrackId);

  }

  const mode = getPlaybackMode();

  const tracks = getMusicTracks();

  const singleMode = [
    'play_one',
    'repeat_one'
  ].includes(mode);

  if (
    config.autoSkipMusicError &&
    !singleMode &&
    tracks.length > 1
  ) {

    const index = tracks.findIndex(
      item => item.id === currentTrackId
    );

    const remaining = mode === 'play_all'
      ? tracks.slice(index + 1)
      : [
          ...tracks.slice(index + 1),
          ...tracks.slice(0, index + 1)
        ];

    const next = remaining.find(
      item => !failedTracks.has(item.id)
    );

    if (next) {

      currentTrackId = next.id;

      pendingSeek = null;

      playlistFinished = false;

      lastMusic = '';

      render();

      return;

    }

  }

  musicFailed = true;

  audio.pause();

  syncMiniPlayer();

}
function createFloat(){if(floating)return;const root=document.createElement('div');floating=root;root.id='christmasFloating';root.className='christmas-floating';root.hidden=true;
root.innerHTML=`<button type="button" class="christmas-floating-handle" aria-label="Christmas settings" aria-expanded="false" aria-controls="christmasFloatingPanel"><svg class="christmas-floating-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 6-6 6 6 6"/></svg></button><div class="christmas-floating-panel" id="christmasFloatingPanel"><div class="christmas-floating-title">Status Assignment</div>${['effect','music'].map(k=>`<div class="christmas-floating-row" data-christmas-row="${k}"><span>${k==='effect'?'Effect':'Music'}</span><label class="shared-active-switch"><input type="checkbox" aria-label="${k}" data-christmas-control="${k}" data-active-label="ON" data-inactive-label="OFF"><span class="shared-active-track"><span class="shared-active-text"></span><span class="shared-active-knob"></span></span></label></div>`).join('')}</div>`;
document.body.append(root);const handle=root.querySelector('button');
createMiniPlayer(root);
root.querySelectorAll(
  'input[data-christmas-control]'
)
  .forEach(input=>input.addEventListener('change',()=>{const k=input.dataset.christmasControl,cap=k==='effect'?'Effect':'Music';if(config?.['allow'+cap+'Toggle']&&config[k+'Enabled'])save(k,input.checked);render();play();}));
root.addEventListener('pointerenter', e => {
  if (e.pointerType === 'mouse') {
    clearTimeout(closeTimer);
  }
});
root.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse'&&!drag){clearTimeout(closeTimer);closeTimer=setTimeout(closeFloat,180);}});
handle.addEventListener('click', e => {
  e.stopPropagation();

  if (suppressClick) {
    suppressClick = false;
    return;
  }

  if (root.classList.contains('is-open')) {
    closeFloat();
  } else {
    openFloat();
  }
});
document.addEventListener('pointerdown',e=>{if(!root.contains(e.target))closeFloat();},true);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeFloat();});window.addEventListener('blur',closeFloat);
handle.addEventListener('pointerdown',e=>{if(e.button!==0||drag)return;suppressClick=false;drag={id:e.pointerId,y:e.clientY,top:root.getBoundingClientRect().top,moved:false};handle.setPointerCapture(e.pointerId);});
handle.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const delta=e.clientY-drag.y;if(!drag.moved&&Math.abs(delta)<6)return;drag.moved=true;root.classList.add('is-dragging');closeFloat();root.style.top=clampY(drag.top+delta)+'px';});
function finish(e){if(!drag||drag.id!==e.pointerId)return;const moved=drag.moved;drag=null;root.classList.remove('is-dragging');if(moved){suppressClick=true;try{if(uid)localStorage.setItem(positionKey(),String(root.getBoundingClientRect().top));}catch{}closeFloat();}if(handle.hasPointerCapture(e.pointerId))handle.releasePointerCapture(e.pointerId);}
['pointerup','pointercancel','lostpointercapture'].forEach(name=>handle.addEventListener(name,finish));window.SharedActiveSwitch?.init?.(root);
}
function syncChristmasFloat(d, e, m) {

  createFloat();

  musicAvailable = m;

  const showE =
    d.effectEnabled && d.showEffectButton;

  const showM =
    d.musicEnabled && d.showMusicButton;

  const showPlayer =
    d.showMiniPlayer && m;

  floating.classList.toggle(
    'has-mini-player',
    showPlayer
  );

  floating.hidden =
    !showE && !showM && !showPlayer;

  if (floating.hidden) {

    closeFloat();

    return;

  }

  for (const [k, on, show, allow] of [

    ['effect', e, showE, d.allowEffectToggle],

    ['music', m, showM, d.allowMusicToggle]

  ]) {

    const row = floating.querySelector(
      '[data-christmas-row="' + k + '"]'
    );

    const input = row.querySelector('input');

    row.hidden = !show;

    input.checked = on;

    input.disabled = !allow;

    window.SharedActiveSwitch?.sync?.(input);

  }

  syncMiniPlayer();

  positionFloat(d);

}

function pref(k,def,allow){if(!allow)return def;try{const v=localStorage.getItem(key(k));return v===null?def:v==='on';}catch{return def;}}
function save(k,v){try{localStorage.setItem(key(k),v?'on':'off')}catch{}}
function scheduled(d){const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kuala_Lumpur',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const get=k=>parts.find(p=>p.type===k).value;const date=get('year')+'-'+get('month')+'-'+get('day');return d.scheduleMode==='always'||(d.scheduleMode==='december'?get('month')==='12':date>=d.startDate&&date<=d.endDate);}
/* ==========================================
   CHRISTMAS PLAYLIST ENGINE
   ========================================== */

function getMusicTracks() {

  return Object.entries(
    musicData.tracks || {}
  )

    .filter(([id, track]) =>
      track?.active === true &&
      typeof track.url === 'string'
    )

    .map(([id, track]) => ({
      ...track,
      id
    }))

    .sort((a, b) => {

      const orderA =
        Number.isFinite(a.order)
          ? a.order
          : Number.MAX_SAFE_INTEGER;

      const orderB =
        Number.isFinite(b.order)
          ? b.order
          : Number.MAX_SAFE_INTEGER;

      return (
        orderA - orderB ||
        (a.createdAt || 0) -
        (b.createdAt || 0) ||
        a.id.localeCompare(b.id)
      );

    });

}

function getPlaybackMode() {
  return playbackModes.includes(musicData.mode)
    ? musicData.mode
    : 'repeat_all';
}

function resetPlaylist() {
  currentTrackId = null;
  playlistFinished = false;
  lastMusic = '';
}

function nextChristmasTrack() {
  const tracks = getMusicTracks();
  const mode = getPlaybackMode();

  if (!tracks.length) {
    playlistFinished = true;
    return;
  }

  const index = tracks.findIndex(
    track => track.id === currentTrackId
  );

  if (mode === 'play_one') {
    playlistFinished = true;
    return;
  }

  if (mode === 'repeat_one') {
    audio.currentTime = 0;
    play();
    return;
  }

  if (mode === 'shuffle') {
    const others = tracks.filter(
      track => track.id !== currentTrackId
    );

    const pool = others.length ? others : tracks;

    currentTrackId =
      pool[Math.floor(Math.random() * pool.length)].id;

  } else if (index + 1 < tracks.length) {

    currentTrackId = tracks[index + 1].id;

  } else if (mode === 'repeat_all') {

    currentTrackId = tracks[0].id;

  } else {

    playlistFinished = true;
    return;

  }

  audio.currentTime = 0;
  lastMusic = '';
  render();
}

function renderChristmasMusic(d, enabled) {
if (!musicReady) {

  audio?.pause();

  return;

}
if (!enabled) {

  musicAvailable = false;

  audio?.pause();

  manualPaused = false;

  musicFailed = false;

  pendingSeek = null;

  failedTracks.clear();

  restoredPlayback = true;

  resetPlaylist();

  syncMiniPlayer();

  return;

}

musicAvailable = true;

if (!d.allowPlayPause) {

  manualPaused = false;

}

if (!d.rememberPlayback) {

  pendingSeek = null;

}

  const tracks = getMusicTracks();
  const mode = getPlaybackMode();

const singleMode = [
  'play_one',
  'repeat_one'
].includes(mode);

const selectedId =
  musicData.selectedTrackId || '';

const preferredTrack = singleMode
  ? tracks.find(t => t.id === selectedId)
    || tracks[0]
  : null;

const signature = JSON.stringify([
  mode,
  singleMode ? preferredTrack?.id || '' : '',
  tracks.map(t => [t.id, t.url])
]);

if (signature !== playlistSignature) {

  playlistSignature = signature;
  playlistFinished = false;
musicFailed = false;

failedTracks.clear();

pendingSeek = null;
  if (singleMode) {

    currentTrackId =
      preferredTrack?.id || null;

    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

  }

}

restorePlaybackPosition(
  d,
  tracks,
  singleMode,
  preferredTrack
);

if (playlistFinished) {

  syncMiniPlayer();

  return;

}

let track = singleMode
  ? preferredTrack
  : tracks.find(
      t => t.id === currentTrackId
    );

if (!track && tracks.length) {

  track = tracks[0];

}

currentTrackId = track?.id || null;
currentMusicTitle =
  track?.title || 'Christmas Music';
  let url;

  try {
    url = new URL(
      track?.url || d.musicUrl,
      location.href
    );

    if (
      url.protocol !== 'https:' &&
      url.origin !== location.origin
    ) throw new Error('Invalid music URL');

  } catch {
    audio?.pause();
    lastMusic = '';
    return;
  }

  if (!audio) {
    audio = document.getElementById('christmasMusic')
      || document.createElement('audio');

    audio.id = 'christmasMusic';
audio.preload = 'auto';
    if (!audio.isConnected) {
      document.body.append(audio);
    }

audio.addEventListener(
  'loadedmetadata',
  () => {

    applyPendingSeek();

    syncMiniPlayer();

    play();

  }
);

audio.addEventListener(
  'canplay',
  () => {

    applyPendingSeek();

    syncMiniPlayer();

    play();

  }
);

audio.addEventListener(
  'seeked',
  () => {

    savePlaybackPosition(true);

    syncMiniPlayer();

    play();

  }
);

audio.addEventListener(
  'timeupdate',
  () => {

    savePlaybackPosition();

    syncMiniPlayer();

  }
);

audio.addEventListener(
  'play',
  syncMiniPlayer
);

audio.addEventListener(
  'pause',
  syncMiniPlayer
);

audio.addEventListener(
  'ended',
  () => {

    savePlaybackPosition(true);

    syncMiniPlayer();

  }
);

audio.addEventListener(
  'error',
  handleMusicError
);
  }

  if (audio.src !== url.href) {
    audio.src = url.href;
  }

audio.volume = getPlayerVolume(d) / 100;

  audio.loop = tracks.length
    ? mode === 'repeat_one'
    : d.loop;

lastMusic = url.href;

applyPendingSeek();

play();

syncMiniPlayer();
}
function stop() {
  musicAvailable = false;

pendingSeek = null;
  layer?.replaceChildren();
  audio?.pause();
  closeFloat();

  if (floating) floating.hidden = true;

  lastEffect = '';
  resetPlaylist();
}

function play() {

  if (

    config &&

    audio &&

    lastMusic &&

    musicAvailable &&
musicAvailable &&

musicReady &&

pendingSeek === null &&

!audio.seeking &&

!manualPaused &&
    !manualPaused &&

    !musicFailed &&

    !playlistFinished &&

    (
      !config.pauseWhenHidden ||
      !document.hidden
    ) &&

    audio.paused

  ) {

    audio.play().catch(error => {

      if (
        error.name !== 'NotAllowedError' &&
        error.name !== 'AbortError'
      ) {

        console.warn(
          '[Christmas Player]',
          error.message
        );

      }

    });

  }

}

function render(){if(!document.body)return;const d=config;if(!d||!d.enabled||!scheduled(d)||(d.accessMode!=='all'&&d.accessMode!==role)){stop();return;}
const e=d.effectEnabled&&pref('effect',d.defaultEffectOn,d.allowEffectToggle),m=d.musicEnabled&&pref('music',d.defaultMusicOn,d.allowMusicToggle);
syncChristmasFloat(d,e,m);
const count=innerWidth<=815?d.mobileCount:d.desktopCount;const signature=e?JSON.stringify([count,d.symbols,d.rotation,d.direction,d.fallSeconds,d.spinSeconds,d.size,d.opacity,d.swing]):'';
if(signature!==lastEffect){lastEffect=signature;if(!layer){layer=document.createElement('div');layer.className='snow-layer';layer.setAttribute('aria-hidden','true');document.body.append(layer);}layer.replaceChildren();if(e){const icons=d.symbols.split('|').map(s=>s.trim()).filter(Boolean).slice(0,40);for(let i=0;i<count&&icons.length;i++){const p=document.createElement('span'),dr=document.createElement('span'),s=document.createElement('span');p.className='snowflake';dr.className='christmas-drift';const snow=icons.filter(x=>/^[❄❅❆✻]/u.test(x));s.textContent=snow.length&&Math.random()<.75?snow[Math.floor(Math.random()*snow.length)]:icons[Math.floor(Math.random()*icons.length)];s.className='christmas-symbol '+(/^[❄❅❆✻]/u.test(s.textContent)?'christmas-spin':'christmas-ornament');p.style.left=Math.random()*100+'%';p.style.opacity=d.opacity/100;p.style.animationDuration=d.fallSeconds*(.7+Math.random()*.6)+'s';p.style.animationDelay=-Math.random()*d.fallSeconds+'s';dr.style.setProperty('--christmas-drift',d.swing+'px');s.style.fontSize=Math.max(8,d.size*(.5+Math.random()*.5))+'px';s.style.animationDuration=d.spinSeconds+'s';s.style.setProperty('--christmas-rotation',d.rotation+'deg');s.style.setProperty('--christmas-rock',Math.min(d.rotation,45)+'deg');s.style.animationDirection=d.direction==='left'||(d.direction==='random'&&Math.random()<.5)?'reverse':'normal';dr.append(s);p.append(dr);layer.append(p);}}}
renderChristmasMusic(d, m);
}
function init(){if(!window.firebase?.auth||!firebase.apps.length){setTimeout(init,300);return;}firebase.auth().onIdTokenChanged(async u=>{const n=++epoch;ref?.off();
musicRef?.off();
ref = null;
musicRef = null;
savePlaybackPosition(true);

musicReady = false;

musicData = {};

config = null;

stop();

manualPaused = false;

musicFailed = false;

musicAvailable = false;

currentMusicTitle = '';

restoredPlayback = false;

playlistSignature = '';

pendingSeek = null;

lastPlaybackSave = 0;

failedTracks.clear();

uid = '';

role = '';

if (audio) {

  audio.removeAttribute('src');

  audio.load();

}
                                                                                                                                          
if(!u||sessionStorage.getItem('5g88.adminSession')!==u.uid)return;try{const t=await u.getIdTokenResult();const p=(await firebase.database().ref('adminUsers/'+u.uid).once('value')).val();if(n!==epoch||!p?.active||!p.secondPasswordEnabled||t.claims.secondVerified!==true||t.claims.pinVersion!==p.pinVersion||!['superadmin','siteadmin'].includes(p.role))return;uid=u.uid;role=p.role;
musicRef = firebase.database().ref(
  'adminConfig/christmasMusic'
);

musicRef.on('value', snapshot => {

  if (n !== epoch) return;

  musicData = snapshot.val() || {};

  musicReady = true;

  render();

}, error => {

  if (n !== epoch) return;

  console.error('[Christmas Music]', error);

  musicReady = false;

  musicData = {};

  stop();

});
ref=firebase.database().ref('adminConfig/christmas');ref.on('value',s=>{if(n!==epoch)return;config=normalize(s.val()||{});render();},()=>{config=null;stop();});}catch{stop();}});timer=setInterval(render,1000);document.addEventListener('click',play);document.addEventListener('keydown',play);document.addEventListener('visibilitychange',()=>{if(document.hidden&&config?.pauseWhenHidden)audio?.pause();else play();});window.addEventListener('resize',render);window.addEventListener('storage',render);
window.addEventListener('beforeunload', () => {

  savePlaybackPosition(true);

});

document.addEventListener('visibilitychange', () => {

  if (document.hidden) {

    savePlaybackPosition(true);

  }

});

window.addEventListener('pagehide', () => {

  savePlaybackPosition(true);

  audio?.pause();

});
}
init();
}
)();
