(()=>{'use strict';
const defaults={"enabled": true, "effectEnabled": true, "musicEnabled": true, "showEffectButton": true, "showMusicButton": true, "allowEffectToggle": true, "allowMusicToggle": true, "defaultEffectOn": true, "defaultMusicOn": true, "scheduleMode": "december", "startDate": "2026-12-01", "endDate": "2026-12-31", "desktopCount": 80, "mobileCount": 35, "rotation": 360, "direction": "random", "fallSeconds": 12, "spinSeconds": 4, "size": 20, "opacity": 80, "swing": 20, "symbols": "❄|❅|❆|☃️|🎁|🎄|⭐|🔔|🎅", "musicUrl": "./merrychristmas/MerryXmast.mp3", "volume": 30, "loop": true, "pauseWhenHidden": true, "side": "right", "bottom": 20, "offset": 20, "accessMode": "all"};
const limits={"desktopCount": [0, 120], "mobileCount": [0, 60], "rotation": [0, 1080], "fallSeconds": [3, 60], "spinSeconds": [1, 30], "size": [8, 40], "opacity": [10, 100], "swing": [0, 60], "volume": [0, 100], "bottom": [0, 150], "offset": [0, 100]};
const choices={"scheduleMode": ["december", "always", "custom"], "direction": ["random", "right", "left"], "side": ["right", "left"], "accessMode": ["all", "superadmin", "siteadmin"]};
function normalize(raw={}){const d={...defaults};for(const k of Object.keys(d)){const v=raw[k];if(typeof d[k]==='boolean'){if(typeof v==='boolean')d[k]=v;}else if(limits[k]){if(typeof v==='number'&&Number.isFinite(v))d[k]=Math.max(limits[k][0],Math.min(limits[k][1],v));}else if(choices[k]){if(choices[k].includes(v))d[k]=v;}else if(typeof v==='string'&&v.length<=1000)d[k]=v;}return d;}
const form=document.getElementById('christmasForm'),fs=document.getElementById('christmasFields'),save=document.getElementById('christmasSave');if(!form)return;document.getElementById('christmasSettings').innerHTML="<div class=\"cfg-field\"><span>Christmas system status</span><div class=\"cfg-toggle-row\"><label class=\"shared-active-switch\"><input type=\"checkbox\" data-christmas=\"enabled\" data-active-label=\"Active\" data-inactive-label=\"Inactive\"><span class=\"shared-active-track\"><span class=\"shared-active-text\"></span><span class=\"shared-active-knob\"></span></span></label></div></div>\n<div class=\"cfg-field\"><span>Effect enabled</span><div class=\"cfg-toggle-row\"><label class=\"shared-active-switch\"><input type=\"checkbox\" data-christmas=\"effectEnabled\" data-active-label=\"Active\" data-inactive-label=\"Inactive\"><span class=\"shared-active-track\"><span class=\"shared-active-text\"></span><span class=\"shared-active-knob\"></span></span></label></div></div>\n<div class=\"cfg-field\"><span>Music enabled</span><div class=\"cfg-toggle-row\"><label class=\"shared-active-switch\"><input type=\"checkbox\" data-christmas=\"musicEnabled\" data-active-label=\"Active\" data-inactive-label=\"Inactive\"><span class=\"shared-active-track\"><span class=\"shared-active-text\"></span><span class=\"shared-active-knob\"></span></span></label></div></div>\n<div class=\"cfg-field\"><span>Show effect switch</span><div class=\"cfg-toggle-row\"><label class=\"shared-active-switch\"><input type=\"checkbox\" data-christmas=\"showEffectButton\" data-active-label=\"Active\" data-inactive-label=\"Inactive\"><span class=\"shared-active-track\"><span class=\"shared-active-text\"></span><span class=\"shared-active-knob\"></span></span></label></div></div>\n<div class=\"cfg-field\"><span>Show music switch</span><div class=\"cfg-toggle-row\"><label class=\"shared-active-switch\"><input type=\"checkbox\" data-christmas=\"showMusicButton\" data-active-label=\"Active\" data-inactive-label=\"Inactive\"><span class=\"shared-active-track\"><span class=\"shared-active-text\"></span><span class=\"shared-active-knob\"></span></span></label></div></div>\n<div class=\"cfg-field\"><span>Allow effect toggle</span><div class=\"cfg-toggle-row\"><label class=\"shared-active-switch\"><input type=\"checkbox\" data-christmas=\"allowEffectToggle\" data-active-label=\"Active\" data-inactive-label=\"Inactive\"><span class=\"shared-active-track\"><span class=\"shared-active-text\"></span><span class=\"shared-active-knob\"></span></span></label></div></div>\n<div class=\"cfg-field\"><span>Allow music toggle</span><div class=\"cfg-toggle-row\"><label class=\"shared-active-switch\"><input type=\"checkbox\" data-christmas=\"allowMusicToggle\" data-active-label=\"Active\" data-inactive-label=\"Inactive\"><span class=\"shared-active-track\"><span class=\"shared-active-text\"></span><span class=\"shared-active-knob\"></span></span></label></div></div>\n<div class=\"cfg-field\"><span>Default effect on</span><div class=\"cfg-toggle-row\"><label class=\"shared-active-switch\"><input type=\"checkbox\" data-christmas=\"defaultEffectOn\" data-active-label=\"Active\" data-inactive-label=\"Inactive\"><span class=\"shared-active-track\"><span class=\"shared-active-text\"></span><span class=\"shared-active-knob\"></span></span></label></div></div>\n<div class=\"cfg-field\"><span>Default music on</span><div class=\"cfg-toggle-row\"><label class=\"shared-active-switch\"><input type=\"checkbox\" data-christmas=\"defaultMusicOn\" data-active-label=\"Active\" data-inactive-label=\"Inactive\"><span class=\"shared-active-track\"><span class=\"shared-active-text\"></span><span class=\"shared-active-knob\"></span></span></label></div></div>\n<div class=\"cfg-field\"><span>Schedule mode</span><select data-christmas=\"scheduleMode\" data-shared-dropdown><option value=\"december\">December</option><option value=\"always\">Always</option><option value=\"custom\">Custom</option></select></div>\n<div class=\"cfg-field\" id=\"christmasDateField\" style=\"grid-column:1/-1\" hidden><span>Schedule date range</span><div id=\"christmasDateRange\"></div></div>\n<div class=\"cfg-field\"><span>Desktop count</span><input data-christmas=\"desktopCount\" type=\"number\" min=\"0\" max=\"120\"></div>\n<div class=\"cfg-field\"><span>Mobile count</span><input data-christmas=\"mobileCount\" type=\"number\" min=\"0\" max=\"60\"></div>\n<div class=\"cfg-field\"><span>Rotation degrees</span><select data-christmas=\"rotation\" data-shared-dropdown data-placeholder=\"Select rotation\"><option value=\"0\">0°</option><option value=\"30\">30°</option><option value=\"45\">45°</option><option value=\"60\">60°</option><option value=\"90\">90°</option><option value=\"120\">120°</option><option value=\"150\">150°</option><option value=\"180\">180°</option><option value=\"210\">210°</option><option value=\"240\">240°</option><option value=\"270\">270°</option><option value=\"300\">300°</option><option value=\"330\">330°</option><option value=\"360\">360°</option><option value=\"540\">540°</option><option value=\"720\">720°</option><option value=\"1080\">1080°</option></select></div>\n<div class=\"cfg-field\"><span>Direction</span><select data-christmas=\"direction\" data-shared-dropdown><option value=\"random\">random</option><option value=\"right\">right</option><option value=\"left\">left</option></select></div>\n<div class=\"cfg-field\"><span>Fall seconds</span><input data-christmas=\"fallSeconds\" type=\"number\" min=\"3\" max=\"60\"></div>\n<div class=\"cfg-field\"><span>Spin seconds</span><input data-christmas=\"spinSeconds\" type=\"number\" min=\"1\" max=\"30\"></div>\n<div class=\"cfg-field\"><span>Size</span><input data-christmas=\"size\" type=\"number\" min=\"8\" max=\"40\"></div>\n<div class=\"cfg-field\"><span>Opacity</span><input data-christmas=\"opacity\" type=\"number\" min=\"10\" max=\"100\"></div>\n<div class=\"cfg-field\"><span>Swing</span><input data-christmas=\"swing\" type=\"number\" min=\"0\" max=\"60\"></div>\n<div class=\"cfg-field\"><span>Emoji list (separate with |)</span><input data-christmas=\"symbols\" type=\"text\"></div>\n<div class=\"cfg-field\"><span>Fallback Music URL</span><input data-christmas=\"musicUrl\" type=\"text\"></div>\n<div class=\"cfg-field\"><span>Volume</span><input data-christmas=\"volume\" type=\"number\" min=\"0\" max=\"100\"></div>\n<div class=\"cfg-field\"><span>Fallback Music Loop</span><div class=\"cfg-toggle-row\"><label class=\"shared-active-switch\"><input type=\"checkbox\" data-christmas=\"loop\" data-active-label=\"Active\" data-inactive-label=\"Inactive\"><span class=\"shared-active-track\"><span class=\"shared-active-text\"></span><span class=\"shared-active-knob\"></span></span></label></div></div>\n<div class=\"cfg-field\"><span>Pause when hidden</span><div class=\"cfg-toggle-row\"><label class=\"shared-active-switch\"><input type=\"checkbox\" data-christmas=\"pauseWhenHidden\" data-active-label=\"Active\" data-inactive-label=\"Inactive\"><span class=\"shared-active-track\"><span class=\"shared-active-text\"></span><span class=\"shared-active-knob\"></span></span></label></div></div>\n<div class=\"cfg-field\"><span>Floating position</span><select data-christmas=\"side\" data-shared-dropdown><option value=\"right\">right</option><option value=\"left\">left</option></select></div>\n<div class=\"cfg-field\"><span>Floating default bottom (px)</span><input data-christmas=\"bottom\" type=\"number\" min=\"0\" max=\"150\"></div>\n<div class=\"cfg-field\"><span>Floating edge offset (px)</span><input data-christmas=\"offset\" type=\"number\" min=\"0\" max=\"100\"></div>\n<div class=\"cfg-field\"><span>Access mode</span><select data-christmas=\"accessMode\" data-shared-dropdown><option value=\"all\">all</option><option value=\"superadmin\">superadmin</option><option value=\"siteadmin\">siteadmin</option></select></div>\n";
// ==========================================
// CHRISTMAS CUSTOM DATE RANGE
// ==========================================

const scheduleSelect = form.querySelector(
  '[data-christmas="scheduleMode"]'
);

const dateField = document.getElementById(
  "christmasDateField"
);

const dateRange = NewUI.dateRange(
  "#christmasDateRange",
  {
    start: defaults.startDate,
    end: defaults.endDate
  }
);

function syncChristmasSchedule() {
  const isCustom =
    scheduleSelect.value === "custom";

  dateField.hidden = !isCustom;

  if (!isCustom) {
    dateRange.close();
  }
}

scheduleSelect.addEventListener(
  "change",
  syncChristmasSchedule
);

syncChristmasSchedule();
let user=null,busy=false,epoch=0;
const resetFloatButton=document.createElement('button');resetFloatButton.type='button';resetFloatButton.className='btn-cancel-new';resetFloatButton.textContent='Reset Floating Position';document.getElementById('christmasReset').before(resetFloatButton);resetFloatButton.addEventListener('click',()=>{if(!user||busy)return;try{localStorage.removeItem('5g88.christmas.floating.position.v1:'+user.uid);toast('Floating position reset');}catch{toast('Unable to reset floating position',false);}});
const ref=firebase.database().ref('adminConfig/christmas');const toast=(m,ok=true)=>NewUI.showToast(m,ok?'success':'error',3000);
/* ==========================================
   CHRISTMAS MUSIC MANAGER
   ========================================== */

const MUSIC_API =
  'https://fiveg88-admin-backend-v2.onrender.com/api/christmas/music';

const playlistRef = firebase.database().ref(
  'adminConfig/christmasMusic'
);

const musicModule = document.getElementById(
  'christmasAddMusicModule'
);

const addMusicBtn = document.getElementById(
  'christmasAddMusic'
);

const saveMusicBtn = document.getElementById(
  'christmasSaveMusic'
);

const musicSource = document.getElementById(
  'christmasMusicSource'
);

const musicTitle = document.getElementById(
  'christmasMusicTitle'
);

const musicFile = document.getElementById(
  'christmasMusicFile'
);

const musicUrl = document.getElementById(
  'christmasTrackUrl'
);

const musicList = document.getElementById(
  'christmasMusicList'
);

const playbackMode = document.getElementById(
  'christmasPlaybackMode'
);

let musicBusy = false;
let musicTracks = {};
let savedPlaybackMode = 'repeat_all';
let previewAudio = null;

function syncMusicSource() {

  const upload = musicSource.value === 'upload';

  document.getElementById(
    'christmasUploadField'
  ).hidden = !upload;

  document.getElementById(
    'christmasUrlField'
  ).hidden = upload;

}

function closeMusicModule() {

  if (musicBusy) return;

  musicModule.close();

}

function openChristmasAddMusic() {

  if (!user || musicBusy) return;

  musicTitle.value = '';
  musicFile.value = '';
  musicUrl.value = '';

  musicSource.value = 'upload';

  syncMusicSource();

  musicModule.showModal();

  musicTitle.focus();

}

addMusicBtn.addEventListener(
  'click',
  openChristmasAddMusic
);

musicSource.addEventListener(
  'change',
  syncMusicSource
);

document.getElementById(
  'christmasCloseMusic'
).onclick = closeMusicModule;

document.getElementById(
  'christmasCancelMusic'
).onclick = closeMusicModule;

musicModule.addEventListener('cancel', e => {

  if (musicBusy) e.preventDefault();

});

musicFile.addEventListener('change', () => {

  const file = musicFile.files[0];

  if (file && !musicTitle.value.trim()) {

    musicTitle.value = file.name
      .replace(/\.mp3$/i, '')
      .slice(0, 120);

  }

});

async function musicRequest(
  path = '',
  method = 'POST',
  body,
  contentType = 'application/json'
) {

  if (!user) {
    throw new Error('Access denied');
  }

  const token = await user.getIdToken();

  const response = await fetch(
    MUSIC_API + path,
    {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType
      },
      ...(body !== undefined ? { body } : {})
    }
  );

  const result = await response.json()
    .catch(() => ({}));

  if (!response.ok || !result.ok) {

    throw new Error(
      result.message ||
      result.error ||
      `Request failed (${response.status})`
    );

  }

  return result;

}

saveMusicBtn.addEventListener('click', async () => {

  if (!user || musicBusy) return;

  const title = musicTitle.value.trim();
  const isUpload = musicSource.value === 'upload';

  const file = musicFile.files[0];
  const url = musicUrl.value.trim();

  if (!title || title.length > 120) {

    toast('Please enter music title', false);
    return;

  }

  if (isUpload) {

    if (!file) {

      toast('Please select MP3 file', false);
      return;

    }

    if (!/\.mp3$/i.test(file.name)) {

      toast('Only MP3 files allowed', false);
      return;

    }

    if (
      !file.size ||
      file.size > 10 * 1024 * 1024
    ) {

      toast('Maximum file size is 10 MB', false);
      return;

    }

  } else {

    try {

      const parsed = new URL(url);

      if (
        parsed.protocol !== 'https:' ||
        parsed.username ||
        parsed.password ||
        url.length > 1000
      ) {
        throw new Error();
      }

    } catch {

      toast('Invalid HTTPS music URL', false);
      return;

    }

  }

  musicBusy = true;

  try {

    await NewUI.setButtonLoading(
      saveMusicBtn,
      true,
      {
        text: isUpload
          ? 'Uploading...'
          : 'Saving...'
      }
    );

    if (isUpload) {

      await musicRequest(
        '/upload?title=' +
          encodeURIComponent(title),
        'POST',
        file,
        'audio/mpeg'
      );

    } else {

      await musicRequest(
        '',
        'POST',
        JSON.stringify({
          title,
          url
        })
      );

    }

    musicModule.close();

    toast('Music added successfully');

  } catch (error) {

    toast(error.message, false);

  } finally {

    musicBusy = false;

    await NewUI.setButtonLoading(
      saveMusicBtn,
      false
    );

  }

});

/* ==========================================
   RENDER MUSIC PLAYLIST
   ========================================== */

function stopMusicPreview() {

  if (!previewAudio) return;

  previewAudio.pause();
  previewAudio = null;

}

function renderMusicList() {

  musicList.replaceChildren();

  const tracks = Object.entries(musicTracks)
    .sort((a, b) =>
      (a[1].createdAt || 0) -
      (b[1].createdAt || 0)
    );

  if (!tracks.length) {

    const empty = document.createElement('div');

    empty.className = 'christmas-music-empty';
    empty.textContent = 'No Data';

    musicList.append(empty);

    return;

  }

  tracks.forEach(([id, track]) => {

    const row = document.createElement('div');
    row.className = 'christmas-music-item';

    const info = document.createElement('div');
    info.className = 'christmas-music-info';

    const name = document.createElement('div');
    name.className = 'christmas-music-name';
    name.textContent = track.title || 'Untitled';

    const meta = document.createElement('div');
    meta.className = 'christmas-music-meta';

    meta.textContent =
      (track.source === 'github'
        ? 'MP3 Upload'
        : 'Music URL') +
      ' · ' +
      (track.active ? 'Active' : 'Inactive');

    info.append(name, meta);

    const actions = document.createElement('div');
    actions.className = 'christmas-music-actions';

    const preview = document.createElement('button');

    preview.type = 'button';
    preview.className = 'btn-cancel-new';
    preview.textContent = 'Preview';

    preview.onclick = async () => {

      if (previewAudio?.dataset.trackId === id) {

        stopMusicPreview();
        renderMusicList();
        return;

      }

      stopMusicPreview();

      try {

        const url = new URL(track.url);

        if (url.protocol !== 'https:') {
          throw new Error('Invalid music URL');
        }

        const player = new Audio(url.href);

        previewAudio = player;
        player.dataset.trackId = id;

        player.volume = 0.5;

        player.onended = () => {

          if (previewAudio !== player) return;

          stopMusicPreview();
          renderMusicList();

        };

        await player.play();

        renderMusicList();

      } catch {

        stopMusicPreview();
        renderMusicList();

        toast('Unable to preview music', false);

      }

    };

    if (previewAudio?.dataset.trackId === id) {

      preview.textContent = 'Stop';

    }

    actions.append(preview);

    row.append(info, actions);

    musicList.append(row);

  });

}
/* ==========================================
   PLAYBACK MODE
   ========================================== */

playbackMode.addEventListener(
  'change',
  async () => {

    if (!user || musicBusy) return;

    const mode = playbackMode.value;

    playbackMode.disabled = true;

    try {

      await musicRequest(
        '/settings',
        'POST',
        JSON.stringify({ mode })
      );

      savedPlaybackMode = mode;

      toast('Playback mode saved');

    } catch (error) {

      playbackMode.value = savedPlaybackMode;

      toast(error.message, false);

    } finally {

      playbackMode.disabled = !user;

      playbackMode._sharedDropdown
        ?.refresh?.();

    }

  }
);

function syncMusicPlaylist(snapshot) {

  const data = snapshot.val() || {};

  musicTracks = data.tracks || {};

  savedPlaybackMode =
    data.mode || 'repeat_all';

  playbackMode.value = savedPlaybackMode;

  playbackMode._sharedDropdown
    ?.refresh?.();

  renderMusicList();

}

function startMusicManager() {

  playlistRef.off(
    'value',
    syncMusicPlaylist
  );

  playlistRef.on(
    'value',
    syncMusicPlaylist,
    error => toast(error.message, false)
  );

}

function stopMusicManager() {

  playlistRef.off(
    'value',
    syncMusicPlaylist
  );

  stopMusicPreview();

  musicTracks = {};

  renderMusicList();

}

window.addEventListener(
  'pagehide',
  stopMusicManager
);

/* ==========================================
   END CHRISTMAS MUSIC MANAGER
   ========================================== */
function fill(d) {

  for (
    const el of form.querySelectorAll(
      "[data-christmas]"
    )
  ) {

    const k = el.dataset.christmas;
    const v = d[k];

    if (el.type === "checkbox") {

      el.checked = v;

    } else {

      // Preserve previously saved rotation values.
      if (
        k === "rotation" &&
        !Array.from(el.options).some(
          option => option.value === String(v)
        )
      ) {
        el.add(
          new Option(v + "°", String(v))
        );
      }

      el.value = v;

    }

  }

  dateRange.setValue(
    {
      start: d.startDate,
      end: d.endDate
    },
    false
  );

  NewUI.init?.(form);

  window.SharedActiveSwitch?.init?.(form);

  form.querySelectorAll("select").forEach(
    el => el._sharedDropdown?.refresh?.()
  );

  syncChristmasSchedule();

}
firebase.auth().onIdTokenChanged(async u=>{
const n = ++epoch;
user = null;
fs.disabled = true;
stopMusicManager();
if(!u||sessionStorage.getItem('5g88.adminSession')!==u.uid)return;try{const t=await u.getIdTokenResult();const p=(await firebase.database().ref('adminUsers/'+u.uid).once('value')).val();if(!p?.active||!p.secondPasswordEnabled||p.role!=='superadmin'||t.claims.secondVerified!==true||t.claims.pinVersion!==p.pinVersion)return;const s=await ref.once('value');if(n!==epoch)return;fill(normalize(s.val()||{}));user = u;
fs.disabled = false;
startMusicManager();
}catch(e){toast(e.message,false);}});document.getElementById('christmasReset').onclick=()=>{if(user&&!busy)fill(defaults);};form.onsubmit=async e=>{e.preventDefault();if(!user||busy||!form.reportValidity())return
const d = {};

for (
  const el of form.querySelectorAll(
    "[data-christmas]"
  )
) {

  const k = el.dataset.christmas;

  if (el.type === "checkbox") {

    d[k] = el.checked;

  } else if (
    el.type === "number" ||
    k === "rotation"
  ) {

    if (el.value.trim() === "") {
      toast("Please select " + k, false);
      return;
    }

    d[k] = Number(el.value);

  } else {

    d[k] = el.value.trim();

  }

}

// Get dates from original custom date picker.

dateRange.close();

const selectedDates = dateRange.getValue();

if (
  d.scheduleMode === "custom" &&
  (
    !selectedDates.start ||
    !selectedDates.end
  )
) {

  toast(
    "Please select start and end date",
    false
  );

  return;

}

d.startDate =
  selectedDates.start || defaults.startDate;

d.endDate =
  selectedDates.end || defaults.endDate;
if(d.startDate>d.endDate||!d.symbols||d.symbols.length>1000||!(d.musicUrl===defaults.musicUrl||/^https:\/\//.test(d.musicUrl))||d.musicUrl.length>1000){toast('Check dates, emoji and HTTPS music URL',false);return;}busy=true;try{await NewUI.setButtonLoading(save,true,{text:'Saving...'});await ref.set({...normalize(d),updatedBy:user.uid,updatedAt:firebase.database.ServerValue.TIMESTAMP});toast('Christmas settings saved');}catch(e){toast(e.message,false);}finally{await NewUI.setButtonLoading(save,false);busy=false;}};})();
