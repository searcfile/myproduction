<!DOCTYPE html>
<html lang="en">
<head>
    
<script>
(function () {
  const isFloating =
    new URLSearchParams(window.location.search)
      .get('floating') === '1';

  if (isFloating) {
    document.documentElement.classList.add(
      'asf-embed-mode'
    );
  }
})();
</script>

    <style>
  html.fiveg88-hard-reload,
  html.fiveg88-hard-reload body {
    background: #ffffff !important;
  }

  html.fiveg88-hard-reload body {
    visibility: hidden !important;
  }

  html.fiveg88-hard-reload::after {
    content: "";
    position: fixed;
    inset: 0;
    background: #ffffff;
    z-index: 2147483647;
    pointer-events: auto;
  }
</style>
<script>
(function () {
  const KEY = "5g88.hardReloadIntent";
  // Detect Ctrl + Shift + R atau Ctrl + F5
  window.addEventListener("keydown", function (event) {
    const hardReload =
      (event.ctrlKey &&
       event.shiftKey &&
       event.key.toLowerCase() === "r") ||
      (event.ctrlKey && event.key === "F5");

    if (hardReload) {
      sessionStorage.setItem(KEY, String(Date.now()));
    }
  }, true);

  // Semak sama ada reload datang daripada shortcut tadi
  const saved = Number(sessionStorage.getItem(KEY));
  sessionStorage.removeItem(KEY);

  const navigation =
    performance.getEntriesByType("navigation")[0];

  const recentHardReload =
    navigation?.type === "reload" &&
    Number.isFinite(saved) &&
    saved > 0 &&
    Date.now() - saved < 10000;

  if (recentHardReload) {
    document.documentElement.classList.add(
      "fiveg88-hard-reload"
    );
  }
})();
</script>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="./logo.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LiveChat · User</title>
  <link rel="stylesheet" href="./shared-ui.css">
  <link rel="stylesheet" href="./admin.css">
  <link rel="stylesheet" href="./new-ui.css">
  <style>
    :root{
    --page-bg: #000;
    --page-text: rgba(255,255,255,0.85);
    --page-input: #141414;
    --border-input:#424242;
    --page-bg2:#1f1f1f;
    --name:#1668dc;
    --blur:rgba(255,255,255,0.25);

    --blue: #1668dc;
    --blue-hover: #3c89e8;
    --blue-active: #1554ad;

  --bg-color: #111111;
  --text-color: #ffffff;
  --primary-color: #facc15;
  }

  body.light-theme{
    --page-bg: #ffffff;
    --page-text: rgba(0,0,0,0.88);
    --page-input: #ffffff;
    --border-input:#d9d9d9;
    --page-bg2:#ffffff;
    --name:#1668dc;
    --blur:#00000063;

    --blue: #1668dc;
    --blue-hover: #3c89e8;
    --blue-active: #1554ad;
  }
body {
  background: var(--page-bg);
  color: var(--page-text);
  font-family: 'Segoe UI', sans-serif;
  margin: 0;
  padding: 0;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
html, body { -ms-overflow-style: none; scrollbar-width: none; }
html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }
  h1 {
    color: white;
    margin: 0;
    font-size: 30px;
  }

  .chat-container {
    max-width: 700px;
    margin: 2rem auto;
    border: 2px solid gold;
    border-radius: 6px;
    overflow: hidden;
    background-color: #000;
    display: flex;
    flex-direction: column;
    height: 85vh;
    box-shadow: 0 0 12px rgba(255, 215, 0, 0.2);
  }
.chat-header {
  background: linear-gradient(to right,#1668dc, #c5ff4a);
  padding: 12px 18px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  border: 1px solid #424242;
  border-radius: 0;
  font-size: 1rem;
  color: white;
  font-weight: 500;
  justify-content: space-between;
  border-top-left-radius: 6px !important;
  border-top-right-radius: 6px !important;
}

.profile {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chat-header .profile img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid white;
  background:#000;
}

.chat-header .profile span {
  font-weight: bold;
  font-size: 14px;
  color: #ffffff;
}
@media (max-width: 600px){
  .search-wrapper{
    width: 100%;
  }

  .search-input-wrap{
    width: 100%;
    max-width: 100%;
  }

  #searchChat{
    width: 100%;
  }
}
  .chat-box {
  flex-grow: 1;
  overflow-y: auto;
  padding: 15px 4px;
  background: var(--page-bg);
  height: 60vh;
  border-radius: 0;
  border: 1px solid var(--border-input);
  -webkit-overflow-scrolling: touch;
  scroll-behavior: auto;
  overscroll-behavior: contain;
}
.user-scroll-box, .chat-box {
    scrollbar-width: thin;
    scrollbar-color: var(--blur) transparent;
}
.chat-box::-webkit-scrollbar {
  width: 6px;
}

.chat-box::-webkit-scrollbar-thumb {
  background: #1668dc;
  border-radius: 6px;
}

.chat-box::-webkit-scrollbar-track {
  background: transparent;
}
.message {
  width: 100%;
  margin: 8px 0;
  box-sizing: border-box;
}

.msg-time {
  position: static;
  align-self: flex-end;
  display: block;
  margin-top: 2px;
  font-size: 10px;
  line-height: 1;
  white-space: nowrap;
  opacity: 0.75;
  color: rgb(255, 255, 255, 85);
}

.mine .msg-bubble-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
width: auto;
max-width: min(75%, 356px);
min-width: 60px;
align-items: flex-start;
  padding: 10px 12px;
  background: #15523E;
  color: #000;
  border-top-right-radius: 0;
  border-top-left-radius: 12px;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  line-height: 1.4;
  box-sizing: border-box;
  word-break: break-word;
  white-space: normal;
  box-shadow: 0 2px 8px rgba(0,0,0,0.18);
}

.theirs .msg-bubble-wrap {
  position: relative;
  display: flex;
  flex-direction: column;
width: auto;
max-width: min(75%, 356px);
min-width: 60px;
align-items: flex-start;
  padding: 10px 12px;
  background: #15523E;
  color: #000;
  border-top-left-radius: 0;
  border-top-right-radius: 12px;
  border-bottom-left-radius: 12px;
  border-bottom-right-radius: 12px;
  line-height: 1.4;
  box-sizing: border-box;
  word-break: break-word;
  white-space: normal;
  box-shadow: 0 2px 8px rgba(0,0,0,0.18);
}
.mine .msg-bubble-wrap::after {
  content: "";
  position: absolute;
  right: -6px;
  top: 0;
  width: 12px;
  height: 12px;
  background: inherit;
  clip-path: polygon(0 0, 100% 0, 0 100%);
}

.theirs .msg-bubble-wrap::after {
  content: "";
  position: absolute;
  left: -6px;
  top: 0;
  width: 12px;
  height: 12px;
  background: inherit;
  clip-path: polygon(100% 0, 100% 100%, 0 0);
}
.mine .msg-time {
  align-self: flex-end;
  text-align: right;
}

.theirs .msg-time {
  align-self: flex-end;
  text-align: right;
}
.send-box {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-input);
  border-radius: 0;
  background: var(--page-bg);
  box-sizing: border-box;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
  color: var(--page-text);
  flex-wrap: wrap;
  border-bottom-left-radius: 12px !important;
  border-bottom-right-radius: 12px !important;
}

.send-box:focus-within {
  border-color: var(--blue);
  box-shadow: 0 0 0 2px rgba(22, 104, 220, 0.15);
}

#msg {
  flex: 1;
  min-height: 24px;
  max-height: 120px;
  padding: 10px 0;
  font-size: 14px;
  line-height: 1.45;
  border: none;
  outline: none;
  resize: none;
  background: transparent;
  color: var(--page-text);
  font-family: 'Segoe UI', sans-serif;
  overflow-y: auto;
}

#msg::placeholder {
  color: var(--blur);
}

#msg:focus {
  border: none;
  outline: none;
  box-shadow: none;
}

.send-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.send-tool-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  color: var(--page-text);
  cursor: pointer;
  border: none;
  transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;
}

.send-tool-btn svg {
  width: 17px;
  height: 17px;
}

.send-tool-btn:hover {
  color: #fff;
}

.send-tool-btn:active {
 color:#b5b5b5;
}

.send-main-btn {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--blue);
  color: #fff;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.2s ease, transform 0.2s ease, opacity 0.2s ease;
}

.send-main-btn svg {
  width: 18px;
  height: 18px;
}

.send-main-btn:hover {
  background: var(--blue-hover);
}

.send-main-btn:active {
  transform: scale(0.96);
}

.send-main-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.msg-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
}

.mine-row {
  justify-content: flex-end;
}

.their-row {
  justify-content: flex-start;
}
.msg-info {
  font-size: 14px;
  font-weight: 600;
  color: rgb(255, 255, 255, 85);
}
  .msg-header small {
    font-size: 0.75rem;
    color: #0b6906;
  }

.msg-text {
  margin: 0;
  padding: 0;
  font-weight: 500;
  font-size: 13px;
  color: rgb(255, 255, 255, 65);
  white-space: pre-wrap;
  word-break: break-word;
}

  .date-label {
    text-align: center;
    margin: 0 0 20px;
  }

  .date-label-inner {
    display: inline-block;
    background-color: #1668dc;
    padding: 2px 30px;
    border-radius: 20px;
    font-size: 14px;
    color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .date-label-inner .day-label {
    font-weight: bold;
  }

  .date-label-inner .full-date-label {
    font-size: 12px;
    color: white;
  }
@media (max-width: 600px) {
  .chat-header {
    flex-direction: column;
    align-items: flex-start;
  }

  #searchChat {
    width: 100%;
  }
}
@media (max-width: 600px){
  .chat-header{
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrapper{
    width: 100%;
    margin-top: 8px;
  }
}
.chat-wrapper {
  background: white;
  max-width: 640px;
  margin: 1rem auto 0 auto;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  height: 93vh;
  overflow: hidden;
  box-shadow: 0 0 10px #1668dc;
  border: 1px solid #1668dc;
  padding: 15px;
  position: relative;
}

.search-wrapper {
  flex-grow: 1;
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

.search-input-wrap {
  position: relative;
  width: 100%;
  max-width: 100%; /* 🔥 penting */
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  width: 15px;
  height: 15px;
  transform: translateY(-50%);
  color: #8c8c8c;
  pointer-events: none;
}

#searchChat {
  width: 100%;
  padding: 8px 12px 8px 36px;
  font-size: 14px;
  border-radius: 6px;
  border: 1px solid #424242;
  box-sizing: border-box;
  outline:none;
}
#searchChat:hover{border:1px solid var(--blue-hover);}
#searchChat:focus{border:1px solid var(--blue);}   
.msg-avatar-outside {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid white;
  background-color: black;
  flex-shrink: 0;
}
.msg-bubble-wrap {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
#startMessage {
  transition: opacity 0.5s ease;
  font-size: 16px;
}
.chat-box { min-height: 0; }

/* jaga composer selalu terlihat nempel di bawah */
.send-box {
  position: sticky;
  bottom: 0;
  z-index: 5;
}

/* iPhone safe-area (opsional) */
@supports (padding: env(safe-area-inset-bottom)) {
  .send-box { padding-bottom: calc(1rem + env(safe-area-inset-bottom)); }
}

@media (max-width: 600px) {
  .send-box {
    flex-direction: row !important;
    align-items: flex-end;
    gap: 8px;
    flex-wrap: wrap;
    padding: 8px 10px;
  }

  #msg {
    flex: 1 1 140px;
    min-width: 0;
    min-height: 22px;
    max-height: 100px;
    font-size: 14px;
  }

  .send-tool-btn {
    width: 26px;
    height: 26px;
  }

  .send-main-btn {
    width: 34px;
    height: 34px;
  }
}

@media (max-width: 400px) {
  #msg { font-size: 14px; }

  .send-tool-btn {
    width: 24px;
    height: 24px;
  }

  .send-main-btn {
    width: 32px;
    height: 32px;
  }
}
/* === SEARCH highlight === */
mark.__hit{ background:#ffe58a; padding:0 2px; border-radius:3px; }

/* === Tombol scroll ke bawah (gaya bulat dengan ring) === */
#toBottomBtn{
  position: absolute;
  right: 25px;
  bottom: calc(var(--composer-h, 64px) + 23px); /* 12px di atas composer */
  z-index: 20; /* di atas send-box */
  width:40px; height:40px; border-radius:50%;
  background:#1668dc;
  border:1px solid transparent;
  box-shadow:0 4px 14px rgba(0,0,0,.55), inset 0 0 0 1px rgba(255,255,255,.06);
  display:none; align-items:center; justify-content:center;
  cursor:pointer; outline:none;
  -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px);
  transition: transform .1s ease, background .15s ease, border-color .15s ease;transition: all 0.2s;
  padding:2px 4px;
}
#toBottomBtn svg{ width:18px; height:18px; stroke:#fff; stroke-width:2; fill:none; display:block; }
#toBottomBtn:hover{ background:var(--blue-hover); }
#toBottomBtn:active{ transform: translateY(1px);background:var(--blue-active); }
#toBottomBtn.show{ display:flex; }
@media (max-width:520px){
  #toBottomBtn{width:35px; height:35px; right:10px;bottom: calc(var(--composer-h, 64px) + 10px);z-index: 20;}
  #toBottomBtn svg{ width:18px; height:18px; }
}
.emoji-picker-wrap{
  position: absolute;
  right: 16px;
  bottom: 78px;
  z-index: 999;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 14px 30px rgba(0,0,0,.35);
  max-width: calc(100vw - 24px);
  transition: all 0.2s ease;
}

emoji-picker{
  --border-size: 0;
  --border-radius: 6px;
  --background: #141414;
  --input-border-color: #424242;
  --input-border-radius: 6px;
  --category-icon-size: 20px;
  --emoji-size: 1.45rem;
  --category-button-color: #ffffff;
  --category-button-active-color: #1668dc;
  --indicator-color: #1668dc;
  --outline-color: #1668dc;
  --num-columns: 8;
  height: 420px;
  width: 350px;
}
emoji-picker::part(search-input) {
  border: 1px solid #424242;
  border-radius: 10px;
  padding: 6px 10px;
  outline: none;
  background: #0b0b0b !important;
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
  caret-color: #ffffff !important;
  opacity: 1 !important;
  transition: all 0.2s ease;
}
emoji-picker {
  color-scheme: dark;
}

emoji-picker::part(search-input)::placeholder {
  color: rgba(255,255,255,0.55) !important;
  -webkit-text-fill-color: rgba(255,255,255,0.55) !important;
}
input.search:focus{border:1px solid black;}


emoji-picker::part(search-input):focus {
  border: 1px solid #1668dc;
  background: #1f1f1f;
  transition: all 0.2s ease;
}
.picker {
    contain: content;
    display: flex;
    flex-direction: column;
    background: black !important;
    border: var(--border-size) solid var(--border-color);
    border-radius: var(--border-radius);
    width: 100%;
    height: 100%;
    overflow: hidden;
    transition: all 0.2s ease;
    padding: 10px 0;
    --total-emoji-size: calc(var(--emoji-size) + (2 * var(--emoji-padding)));
    --total-category-emoji-size: calc(var(--category-emoji-size) + (2 * var(--category-emoji-padding)));
}
emoji-picker::part(search-container),
emoji-picker::part(category-navigation),
emoji-picker::part(emoji-list),
emoji-picker::part(content),
emoji-picker::part(container) {
  background: #000 !important;
}
@media (max-width: 600px){
  emoji-picker::part(search-input) {
    color: #ffffff !important;
    -webkit-text-fill-color: #ffffff !important;
    caret-color: #ffffff !important;
  }
}
@media (max-width: 600px){
  .emoji-picker-wrap{
    right: 8px;
    left: 8px;
    bottom: 72px;
    width: auto;
    max-width: none;
  }

  emoji-picker{
    width: 100% !important;
    height: 320px;
    --emoji-size: 1.3rem;
    --num-columns: 7;
  }
}

.image-preview-wrap{
  position: relative;
  width: 100%;
  flex: 0 0 100%;
  max-width: 100%;
  margin: 0 0 8px 0;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex-wrap: wrap;
  overflow: visible;
  border: none;
  background: transparent;
  box-shadow: none;
}

.image-preview-wrap[hidden]{
  display: none !important;
}

.image-preview-list{
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex-wrap: wrap;
}

.image-preview-card{
  position: relative;
  width: 78px;
  height: 78px;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--border-input);
  background: var(--page-bg2);
  flex: 0 0 78px;
}

.image-preview{
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: var(--page-bg2);
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.image-preview:hover{
  transform: scale(1.04);
  opacity: 0.92;
}
.image-add-card{
  width: 78px;
  height: 78px;
  border-radius: 10px;
  border: 1px dashed var(--border-input);
  background: var(--page-bg);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex: 0 0 78px;
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.image-add-card:hover{
  border-color: var(--blue);
  background: var(--page-bg2);
}

.image-add-plus{
  font-size: 36px;
  line-height: 1;
  color: var(--page-text);
  transform: translateY(-1px);
}

.image-add-card:hover .image-add-plus{
  color: var(--blue-hover);
}
.image-add-card:active .image-add-plus{
  color: var(--blue-active);
}
.remove-image-btn{
  position: absolute;
  top: 4px;
  right: 4px;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 50%;
  background: rgba(0,0,0,0.72);
  color: #fff;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.remove-image-btn:hover{
  background: rgba(255,0,0,0.85);
}

.global-upload-status{
  width: 100%;
  min-height: 36px;
  border-radius: 6px;
  background: rgba(0,0,0,0.35);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  color: var(--page-text);
  font-size: 12px;
  padding: 8px 10px;
  box-sizing: border-box;
}

.image-upload-status[hidden]{
  display: none !important;
}

.chat-image-group{
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 170px));
  gap: 8px;
  margin-top: 6px;
  width: max-content;
  max-width: 100%;
}

.chat-image-group:has(.chat-image-wrap:only-child){
  grid-template-columns: 170px;
}

.upload-spinner{
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.25);
  border-top-color: #ffffff;
  animation: spinUpload 0.8s linear infinite;
}

@keyframes spinUpload{
  to { transform: rotate(360deg); }
}
.chat-image-wrap{
  position: relative;
  display: block;
  width: 170px;
  max-width: 100%;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  background: #0f0f0f;
  border: 1px solid rgba(255,255,255,0.08);
}

.chat-image-thumb{
  display: block;
  width: 100%;
  height: 130px;
  object-fit: contain;
  object-position: center;
  background: #0f0f0f;
}

.chat-image-overlay{
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 8px 10px;
  background: linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0));
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.chat-image-wrap:hover .chat-image-overlay{
  opacity: 1;
}
@media (max-width: 600px){
  .chat-image-group{
    grid-template-columns: repeat(2, minmax(0, 120px));
    width: max-content;
    max-width: 100%;
  }

  .chat-image-group:has(.chat-image-wrap:only-child){
    grid-template-columns: 120px;
  }

  .chat-image-wrap{
    width: 120px;
  }

  .chat-image-thumb{
    height: 96px;
  }

  .mine .msg-bubble-wrap,
  .theirs .msg-bubble-wrap{
    max-width: min(85%, 252px);
  }
}
.image-lightbox{
  position: fixed;
  inset: 0;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-lightbox[hidden]{
  display: none !important;
}

.message{
  overflow: visible;
}

.message .chat-image-wrap{
  max-width: 100%;
}
.image-lightbox-backdrop{
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.88);
}

.image-lightbox-content{
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.image-lightbox-img{
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  transform-origin: center center;
  transition: transform 0.08s linear;
  cursor: zoom-in;
  user-select: none;
  -webkit-user-drag: none;
}
.lightbox-close-btn{
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 5;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 50%;
  background: rgba(0,0,0,0.72);
  color: #fff;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, transform 0.2s ease;
}

.lightbox-close-btn:hover{
  background: rgba(255,0,0,0.9);
}

.lightbox-close-btn:active{
  transform: scale(0.95);
}

.image-lightbox-content{
  cursor: default;
  overflow: hidden;
}

.image-lightbox-img.is-zoomed{
  cursor: grab;
}

.image-lightbox-img.is-dragging{
  cursor: grabbing;
  transition: none;
}
  /* ================= SCROLLBAR GLOBAL ================= */

/* Chrome, Edge, Safari */
::-webkit-scrollbar {
  width: 6px; /* nipis */
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 10px;
  transition: all 0.25s ease;
}

::-webkit-scrollbar-thumb:hover {
  background: #777;
}

/* Firefox */
html {
  scrollbar-width: thin;
  scrollbar-color: #555 transparent;
}


/* === LIVECHAT MODERN UI — EMBEDDED === */
/* 5G88 LiveChat — Modern UI skin. Load AFTER existing inline styles. */
:root{--lc-bg:#080f1d;--lc-surface:#101b2c;--lc-surface2:#17253b;--lc-border:#293c59;--lc-muted:#91a8c8;--lc-text:#eaf2ff;--lc-accent:#2478ee;--lc-glow:rgba(36,120,238,.18)}
*{box-sizing:border-box}
html,body{min-height:100%;background:var(--tx-bg) !important;color:var(--lc-text)!important}
body{font-family:Inter,'Segoe UI',system-ui,sans-serif!important}
      
.chat-wrapper{width:min(100%,1060px)!important;max-width:1060px!important;height:min(880px,calc(100dvh - 40px))!important;min-height:400px;margin:0 auto!important;padding:0!important;background:var(--lc-bg)!important;border:1px solid var(--tx-border)!important;border-radius:20px!important;box-shadow:0 24px 80px #0008,0 0 0 1px #ffffff05!important;isolation:isolate}
.chat-header{background:var(--tx-surface-soft)!important;border:0!important;border-bottom:1px solid var(--tx-border)!important;border-radius:0!important;padding:14px 14px!important;gap:10px !important;min-height:78px;flex-wrap:nowrap!important}
.chat-header .profile{min-width:0;gap:13px}
.chat-header .profile img{width:48px!important;height:48px!important;object-fit:cover;border:2px solid #4b91fb!important;box-shadow:0 0 0 4px #2676ef24;background:#0e1c32!important}
.chat-header .profile span{display:block;font-size:16px!important;letter-spacing:.1px;color:var(--tx-ink) !important;white-space:nowrap}
.support-agent-name{color:#a5b9d4;font-size:11px;line-height:1.5;margin-top:2px}
#typingStatus{display:inline-flex;color:#5be0b4!important;font-size:11px!important;align-items:center;gap:5px}
#typingStatus:before{content:'';width:6px;height:6px;border-radius:50%;background:currentColor;display:inline-block}
.search-wrapper{width:min(330px,42%)!important;flex:0 1 330px!important;min-width:120px;justify-content:flex-end}
.search-input-wrap{max-width:330px!important}
#searchChat{height:40px;background:var(--tx-surface) !important;border:1px solid var(--tx-border) !important;border-radius:10px!important;color:#eaf2ff!important;padding-left:38px!important}
#searchChat::placeholder{color:#8da1bd}
#searchChat:focus{border-color:#438efa!important;box-shadow:0 0 0 3px #2377f222!important}
.search-icon{color:#9ab2d2!important}
.chat-box{flex:1!important;height:auto!important;min-height:0!important;padding:22px clamp(12px,3vw,32px)!important;background:var(--tx-surface)!important;border:0!important;border-radius:0!important;scrollbar-color:#385374 transparent!important}
.message{margin:14px 0!important}
.msg-row{gap:10px!important;align-items:flex-end!important}
.msg-avatar-outside{width:30px!important;height:30px!important;border:1px solid #395274!important;background:#15263d!important}
.mine .msg-bubble-wrap,.theirs .msg-bubble-wrap{min-width:70px;max-width:min(76%,550px)!important;padding:12px 15px!important;border:1px solid transparent!important;border-radius:16px!important;box-shadow:0 5px 18px #0002!important}
.mine .msg-bubble-wrap{background:linear-gradient(135deg,#2168d4,#1754ad)!important;border-bottom-right-radius:5px!important;color:white!important}
.theirs .msg-bubble-wrap{background:#1a2a41!important;border:1px solid #2a4160!important;border-bottom-left-radius:5px!important;color:#eaf2ff!important}
.mine .msg-bubble-wrap::after,.theirs .msg-bubble-wrap::after{display:none!important}
.msg-info{font-size:11px!important;color:#fff!important;margin-bottom:4px;font-weight:700;}
.msg-text{font-size:13px!important;line-height:1.6!important;color:#f1f6ff!important;font-weight:400!important}
.msg-time{color:#bed0e9!important;font-size:10px!important;margin-top:6px!important}
.date-label{margin:14px 0 22px!important}
.date-label-inner{background:#1b304d!important;border:1px solid #324b70!important;border-radius:999px!important;padding:5px 18px!important;box-shadow:none!important;color:#dce9fc!important}
.send-box{background:var(--tx-surface-soft)!important;border:0!important;border-top:1px solid var(--tx-border)!important;border-radius:0!important;padding:15px 20px!important;gap:12px!important;align-items:center!important;flex-wrap:nowrap!important;box-shadow:none!important}
.send-box:focus-within{box-shadow:none!important;border-top-color:#345984!important}
#msg{min-width:0!important;min-height:38px!important;padding:10px 4px!important;color:#f3f7ff!important;line-height:1.5!important;font-size:14px!important;background:transparent!important}
#msg::placeholder{color:#8196b5!important}
.send-actions{gap:8px!important}
.send-tool-btn{width:35px!important;height:35px!important;border-radius:9px!important;color:#a9c0df!important;transition:background .15s,color .15s!important;flex:0 0 auto}
.send-tool-btn:hover{background:#233b5d!important;color:white!important}
.send-main-btn{width:42px!important;height:42px!important;background:#2478ee!important;border-radius:12px!important;box-shadow:0 4px 14px #145fd444!important}
.send-main-btn:hover{background:#3d8afa!important}
#toBottomBtn{background:#2478ee!important;border-radius:12px!important;right:22px!important;box-shadow:0 6px 20px #0006!important}
#startMessage{color:#9fb3d0!important;font-size:14px!important;padding:35px 12px!important}
#noResults{background:#19283f!important;border:1px solid #3b5273!important;color:#dbeaff!important}
.image-preview-wrap{background:transparent!important}
.image-preview-card,.image-add-card{border-radius:12px!important;border-color:#3b5373!important;background:#182a42!important}
.chat-image-wrap{border-radius:12px!important;background:#0d1a2b!important}
.emoji-picker-wrap{border:1px solid #334967;border-radius:14px!important;box-shadow:0 20px 60px #0009!important}
.image-lightbox-backdrop{background:#030814ee!important}
@media(max-width:700px){.chat-wrapper{height:100dvh!important;min-height:0!important;width:100%!important;}.chat-header{padding:14px 14px!important;min-height:78px;gap:10px!important;flex-direction:row!important;align-items:center!important}.chat-header .profile img{width:42px!important;height:42px!important}.chat-header .profile span{font-size:14px!important}.search-wrapper{width:min(180px,42%)!important;flex:0 1 180px!important;margin:0!important}.search-input-wrap{width:100%!important}#searchChat{height:36px;font-size:12px!important}.chat-box{padding:15px 12px!important}.mine .msg-bubble-wrap,.theirs .msg-bubble-wrap{max-width:min(85%,420px)!important}.send-box{padding:10px 12px calc(10px + env(safe-area-inset-bottom))!important;gap:6px!important;flex-wrap:wrap!important}.send-tool-btn{width:32px!important;height:32px!important}.send-main-btn{width:38px!important;height:38px!important}#toBottomBtn{right:12px!important}}
@media(max-width:390px){.chat-header{flex-wrap:wrap!important}.chat-header .profile{width:100%}.search-wrapper{width:100%!important;flex:1 1 100%!important}.search-input-wrap{max-width:none!important}.chat-header{padding:10px 12px!important}.send-actions{gap:3px!important}.send-box{gap:4px!important}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important}}

/* ==========================================
   5G88 LIVECHAT — RESPONSIVE LAYOUT FIX
   ========================================== */

/* Halaman ikut tinggi skrin */
html,
body {
  width: 100% !important;
  height: 100% !important;
  overflow: hidden !important;
}

main {
  width: 100% !important;
  height: 100dvh !important;
  min-height: 0 !important;
  padding: 0 12px 12px !important;
  display: flex !important;
  align-items: stretch !important;
  justify-content: center !important;
  overflow: hidden !important;
}

/* Chat tidak terlalu lebar atau tinggi */
.chat-wrapper {
  width: 100% !important;
  max-width: 850px !important;
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
  margin: 0 auto !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;
  border-radius: 12px !important;
}

/* Header kekal di atas */
.chat-header {
  flex: 0 0 auto !important;
}

/* Hanya bahagian mesej yang scroll */
.chat-box {
  flex: 1 1 auto !important;
  height: auto !important;
  min-height: 0 !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
}

/* Composer sentiasa di bawah */
.send-box {
  position: relative !important;
  bottom: auto !important;
  flex: 0 0 auto !important;
  width: 100% !important;
  min-width: 0 !important;

  display: flex !important;
  flex-direction: row !important;
  flex-wrap: wrap !important;
  align-items: center !important;
  gap: 10px !important;

  padding: 12px 16px !important;
  box-sizing: border-box !important;
}

/* Preview gambar di baris sendiri */
.send-box .image-preview-wrap:not([hidden]) {
  display: flex !important;
  flex: 0 0 100% !important;
  width: 100% !important;
  min-width: 0 !important;
  max-width: 100% !important;
  margin: 0 !important;
  padding: 0 0 8px !important;
  max-height: 180px !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
}

/* Attachment icon */
.send-box .attach-btn {
  flex: 0 0 35px !important;
  width: 35px !important;
  height: 35px !important;
}

/* Textarea ambil ruang tengah */
.send-box #msg {
  flex: 1 1 100px !important;
  width: auto !important;
  min-width: 0 !important;
  max-height: 100px !important;
}

/* Emoji, gift dan Send kekal di kanan */
.send-box .send-actions {
  display: flex !important;
  flex: 0 0 auto !important;
  align-items: center !important;
  gap: 6px !important;
  margin-left: auto !important;
}

/* Send tidak mengecil atau hilang */
.send-box #sendBtn {
  display: inline-flex !important;
  flex: 0 0 42px !important;
  width: 42px !important;
  height: 42px !important;
  visibility: visible !important;
}

/* Mobile */
@media (max-width: 700px) {

  .chat-wrapper {
    max-width: 100% !important;
  }

  .send-box {
    padding: 10px 8px
      calc(10px + env(safe-area-inset-bottom)) !important;
    gap: 6px !important;
  }

  .send-box .attach-btn {
    flex-basis: 30px !important;
    width: 30px !important;
  }

  .send-box .send-actions {
    gap: 3px !important;
  }

  .send-box .send-tool-btn {
    width: 30px !important;
    height: 30px !important;
  }

  .send-box #sendBtn {
    flex-basis: 38px !important;
    width: 38px !important;
    height: 38px !important;
  }
}
/* LiveChat dalam panel kecil / iframe */
@media (max-width: 520px) {
  .chat-container {
    width: 100% !important;
    max-width: none !important;
    height: 100dvh !important;
    min-height: 0 !important;
    margin: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }

  .chat-box {
    flex: 1 1 auto !important;
    min-height: 0 !important;
    height: auto !important;
  }
}
      

/* ==========================================
   LIVECHAT FLOATING - FULL PANEL
   ========================================== */

html.asf-embed-mode,
html.asf-embed-mode body {
  width: 100% !important;
  height: 100% !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
}

html.asf-embed-mode body > main {
  display: flex !important;
  flex-direction: column !important;
  width: 100% !important;
  height: 100dvh !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
}

html.asf-embed-mode .chat-wrapper {
  flex: 1 1 auto !important;
  display: flex !important;
  flex-direction: column !important;
  width: 100% !important;
  max-width: none !important;
  height: 100% !important;
  max-height: none !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  overflow: hidden !important;
}

html.asf-embed-mode .chat-box {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  height: auto !important;
  overflow-y: auto !important;
}

html.asf-embed-mode .send-box {
  flex-shrink: 0 !important;
}


/* ==========================================
   5G88 LIVECHAT - FLOATING ONLY
   ========================================== */

/* Sembunyikan dashboard header dan tabbar */
html.asf-embed-mode #homepageSharedShell,
html.asf-embed-mode #homepageSharedShell *,
html.asf-embed-mode #g88HeaderPicker {
  display: none !important;
}

/* Buang ruang dashboard */
html.asf-embed-mode,
html.asf-embed-mode body {
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
}

/* LiveChat memenuhi iframe */
html.asf-embed-mode body > main {
  position: fixed !important;
  inset: 0 !important;
  z-index: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  width: 100% !important;
  height: 100dvh !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
}

html.asf-embed-mode body > main > .chat-wrapper {
  flex: 1 1 auto !important;
  width: 100% !important;
  max-width: none !important;
  height: 100% !important;
  max-height: none !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  overflow: hidden !important;
}


/* =========================================================
   5G88 LIVECHAT · SITE ADMIN — MODERN SUPPORT UI 2026
   UI-only enhancement; Firebase/chat/presence logic untouched.
   Matches Agent Support bubble language and NewUI image preview.
   ========================================================= */
:root {
  --lc-bg:#090f1b;
  --lc-panel:#111c2e;
  --lc-elevated:#16243a;
  --lc-border:#273850;
  --lc-ink:#eef4ff;
  --lc-muted:#96a9c3;
  --lc-blue:#4c94ff;
  --lc-blue-soft:#1b3455;
  --lc-hover:#1a2b43;
}
body.light-theme, html[data-admin-theme="light"] body {
  --lc-bg:#f3f6fb;
  --lc-panel:#ffffff;
  --lc-elevated:#f8faff;
  --lc-border:#e3e9f3;
  --lc-ink:#17243b;
  --lc-muted:#75849a;
  --lc-blue:#246be8;
  --lc-blue-soft:#eaf2ff;
  --lc-hover:#f0f5fc;
}
html,body{height:100%;width:100%;overflow:hidden;}
body{background:var(--lc-bg)!important;color:var(--lc-ink)!important;font-family:Inter,system-ui,-apple-system,'Segoe UI',sans-serif!important;}
body>main{height:100dvh;min-height:0;display:flex;flex-direction:column;box-sizing:border-box;padding:clamp(8px,2vw,20px)!important;}
.chat-wrapper,.chat-container{
  display:flex!important;flex-direction:column!important;
  width:100%!important;max-width:1080px!important;
  height:100%!important;min-height:0!important;
  margin:0 auto!important;overflow:hidden!important;
  border:1px solid var(--lc-border)!important;
  border-radius:16px!important;
  background:var(--lc-panel)!important;
  box-shadow:0 14px 44px rgba(0,0,0,.15)!important;
}
.chat-header{
  display:flex!important;align-items:center!important;justify-content:space-between!important;
  flex:0 0 auto!important;gap:14px!important;flex-wrap:wrap!important;
  padding:15px 20px!important;min-height:76px!important;
  background:var(--lc-panel)!important;color:var(--lc-ink)!important;
  border:0!important;border-bottom:1px solid var(--lc-border)!important;
  border-radius:0!important;box-shadow:none!important;
}
.chat-header .profile{display:flex;align-items:center;gap:12px;min-width:0;flex:1 1 200px;}
.chat-header .profile img{width:42px!important;height:42px!important;object-fit:cover;border:2px solid var(--lc-border)!important;box-shadow:0 0 0 3px var(--lc-blue-soft);}
.chat-header .profile span,#headerUserName{font-size:15px!important;font-weight:750!important;color:var(--lc-ink)!important;}
#supportAgentName{font-size:11px!important;color:var(--lc-muted)!important;}
#typingStatus{color:var(--lc-muted)!important;font-size:11px!important;}
.search-wrapper{flex:0 1 270px;min-width:150px;max-width:100%;}
.search-input-wrap{width:100%!important;max-width:100%!important;position:relative;}
#searchChat{
  width:100%!important;min-width:0!important;height:38px!important;
  border:1px solid var(--lc-border)!important;border-radius:10px!important;
  background:var(--lc-elevated)!important;color:var(--lc-ink)!important;
  font-size:12px!important;outline:none!important;
}
#searchChat:focus{border-color:var(--lc-blue)!important;box-shadow:0 0 0 3px rgba(76,148,255,.12)!important;}
#searchChat::placeholder,#msg::placeholder{color:var(--lc-muted)!important;opacity:1;}
.chat-box{
  flex:1 1 auto!important;min-height:0!important;height:auto!important;
  overflow-y:auto!important;overflow-x:hidden!important;
  padding:22px!important;background:var(--lc-elevated)!important;
  border:0!important;border-radius:0!important;color:var(--lc-ink)!important;
  scrollbar-width:thin;scrollbar-color:var(--lc-border) transparent;
}
.chat-box::-webkit-scrollbar{width:7px;}
.chat-box::-webkit-scrollbar-thumb{background:var(--lc-border);border-radius:99px;}
.message{width:100%!important;margin:7px 0!important;}
.msg-row{display:flex!important;align-items:flex-start!important;gap:9px!important;width:100%!important;min-width:0;}
.msg-row.mine-row{justify-content:flex-end!important;}
.msg-row.their-row{justify-content:flex-start!important;}
.msg-avatar-outside{width:30px!important;height:30px!important;flex:0 0 30px!important;border:1px solid var(--lc-border)!important;border-radius:50%!important;object-fit:cover;}
.msg-bubble-wrap{display:flex!important;flex-direction:column!important;min-width:0!important;width:fit-content!important;max-width:min(480px,78%)!important;padding:10px 12px!important;line-height:1.55!important;box-sizing:border-box!important;word-break:break-word!important;}
.mine .msg-bubble-wrap{
  background:#2268d9!important;color:#fff!important;
  border:0!important;border-radius:14px 14px 5px 14px!important;
  box-shadow:0 3px 10px rgba(30,94,201,.12)!important;
}
.theirs .msg-bubble-wrap{
  background:var(--lc-panel)!important;color:var(--lc-ink)!important;
  border:1px solid var(--lc-border)!important;
  border-radius:14px 14px 14px 5px!important;
  box-shadow:0 2px 7px rgba(0,0,0,.035)!important;
}
.mine .msg-bubble-wrap::after,.theirs .msg-bubble-wrap::after{display:none!important;}
.mine .msg-text,.mine .msg-info,.mine .msg-time{color:#fff!important;}
.theirs .msg-text,.theirs .msg-info{color:var(--lc-ink)!important;}
.theirs .msg-time{color:var(--lc-muted)!important;}
.msg-text{font-size:13px!important;font-weight:450!important;line-height:1.55!important;white-space:pre-wrap;overflow-wrap:anywhere;}
.msg-info{font-size:11px!important;font-weight:700!important;}
.msg-time{font-size:10px!important;opacity:.8!important;align-self:flex-end!important;margin-top:5px!important;}
.date-label-inner{background:var(--lc-blue-soft)!important;color:var(--lc-blue)!important;border-radius:20px!important;box-shadow:none!important;padding:5px 15px!important;}
.date-label-inner *{color:var(--lc-blue)!important;}
.chat-image-group{max-width:100%!important;}
.chat-image-wrap{border:1px solid var(--lc-border)!important;border-radius:10px!important;overflow:hidden!important;}
.chat-image-thumb{background:var(--lc-elevated)!important;}
.send-box{
  display:grid!important;grid-template-columns:36px minmax(0,1fr) auto!important;
  grid-template-rows:auto!important;align-items:center!important;
  gap:8px 10px!important;flex:0 0 auto!important;
  width:100%!important;min-width:0!important;max-height:min(38dvh,300px)!important;
  overflow-y:auto!important;overflow-x:hidden!important;
  padding:12px 17px!important;margin:0!important;
  border:0!important;border-top:1px solid var(--lc-border)!important;
  border-radius:0!important;background:var(--lc-panel)!important;
  box-shadow:none!important;
}
.send-box .image-preview-wrap:not([hidden]){
  grid-column:1/-1!important;grid-row:auto!important;display:flex!important;
  width:100%!important;max-width:100%!important;min-width:0!important;
  margin:0!important;padding:4px 0 8px!important;max-height:180px!important;
  overflow:auto!important;flex:initial!important;
}
.image-preview-wrap[hidden],.image-upload-status[hidden]{display:none!important;}
.send-box .attach-btn{
  grid-column:1!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;
  width:36px!important;height:36px!important;min-width:0!important;flex:none!important;
  border-radius:10px!important;background:var(--lc-elevated)!important;color:var(--lc-muted)!important;
  cursor:pointer!important;
}
.send-box #msg{
  grid-column:2!important;align-self:center!important;min-width:0!important;width:100%!important;
  min-height:38px!important;max-height:100px!important;padding:10px 4px!important;
  background:transparent!important;color:var(--lc-ink)!important;border:0!important;
  box-shadow:none!important;font-size:13px!important;resize:none!important;
}
.send-box .send-actions{grid-column:3!important;display:flex!important;align-items:center!important;gap:6px!important;flex:0 0 auto!important;margin:0!important;min-width:max-content!important;}
.send-tool-btn{width:34px!important;height:34px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;color:var(--lc-muted)!important;border-radius:9px!important;}
.send-tool-btn:hover,.attach-btn:hover{background:var(--lc-hover)!important;color:var(--lc-blue)!important;}
.send-main-btn,#sendBtn{width:39px!important;height:39px!important;min-width:39px!important;flex:0 0 39px!important;border-radius:11px!important;background:#2268d9!important;color:#fff!important;}
.send-main-btn:hover:not(:disabled),#sendBtn:hover:not(:disabled){background:#3c89e8!important;}
.send-main-btn:disabled,#sendBtn:disabled{opacity:.48!important;}
.image-preview-card,.image-add-card{border-color:var(--lc-border)!important;background:var(--lc-elevated)!important;}
#toBottomBtn{z-index:12!important;}
html.asf-embed-mode body>main{padding:0!important;}
html.asf-embed-mode .chat-wrapper{border:0!important;border-radius:0!important;max-width:none!important;box-shadow:none!important;}
@media(max-width:700px){
  body>main{padding:0!important;}
  .chat-wrapper,.chat-container{max-width:none!important;border:0!important;border-radius:0!important;box-shadow:none!important;}
  .chat-header{padding:12px!important;gap:10px!important;min-height:68px!important;}
  .chat-header .profile{flex:1 1 100%;}
  .search-wrapper{flex:1 1 100%;max-width:none!important;}
  .chat-box{padding:13px 10px!important;}
  .msg-bubble-wrap{max-width:min(440px,82%)!important;}
  .msg-avatar-outside{width:26px!important;height:26px!important;flex-basis:26px!important;}
  .send-box{grid-template-columns:32px minmax(0,1fr) auto!important;gap:6px!important;padding:10px 8px calc(10px + env(safe-area-inset-bottom,0px))!important;}
  .send-box .attach-btn{width:32px!important;height:34px!important;}
  .send-tool-btn{width:30px!important;height:32px!important;}
  .send-box .send-actions{gap:2px!important;}
  #sendBtn{width:36px!important;height:36px!important;min-width:36px!important;flex-basis:36px!important;}
}
@media(max-width:380px){
  .msg-bubble-wrap{max-width:84%!important;}
  .chat-box{padding:10px 7px!important;}
  .send-box{gap:4px!important;padding-inline:6px!important;}
  .send-tool-btn{width:28px!important;}
}

</style>
</head>
<body>
  <main>
  <div class="chat-wrapper">
    <!-- CHAT HEADER -->
    <div class="chat-header">
      <div class="profile">
       <img id="headerUserPhoto" src="https://i.imgur.com/qiZFOs9.png" alt="Support" />
        <div>
          <span id="headerUserName">Admin Support</span><div id="supportAgentName" class="support-agent-name">Support team</div>
          <small id="typingStatus" style="font-size: 12px; font-weight: normal; color: white;">Offline</small>
        </div>
      </div>
<div class="search-wrapper">
  <div class="search-input-wrap">
    <svg class="search-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M15.97 17.031c-1.479 1.238-3.384 1.985-5.461 1.985-4.697 0-8.509-3.812-8.509-8.508S5.812 2 10.509 2c4.695 0 8.508 3.812 8.508 8.508 0 2.078-.747 3.984-1.985 5.461l4.749 4.75c.146.146.219.338.219.531 0 .587-.537.75-.75.75-.192 0-.384-.073-.531-.22zm-5.461-13.53c-3.868 0-7.007 3.14-7.007 7.007s3.139 7.007 7.007 7.007c3.866 0 7.007-3.14 7.007-7.007s-3.141-7.007-7.007-7.007z" fill="currentColor"/>
    </svg>
    <input type="text" id="searchChat" placeholder="Search messages..." />
  </div>
</div>
    </div>

<div class="chat-box" id="chatBox">
  <div id="startMessage" style="text-align:center; color:white; opacity:0.6; margin-top:10px; font-size:14px;">
    Welcome to Live Support. Send us a message to get started.
  </div>
</div>
<button id="toBottomBtn" aria-label="Scroll to latest" title="Go to latest">
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M6 10l6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
</button>
<div id="noResults" style="display:none;position:absolute;top:62px;right:16px;background:#222;color:#fff;border:1px solid #444;border-radius:8px;padding:6px 10px;font-size:12px;">
  No data
</div>
    
<div class="send-box">
<div id="imagePreviewWrap" class="image-preview-wrap" hidden>
  <div id="imagePreviewList" class="image-preview-list"></div>

  <label for="fileInput" id="addMoreImageBtn" class="image-add-card" title="Add image">
    <span class="image-add-plus">+</span>
  </label>

  <div id="imageUploadStatus" class="image-upload-status global-upload-status" hidden>
    <span class="upload-spinner"></span>
    <span id="imageUploadText">Uploading image...</span>
  </div>
</div>

<label for="fileInput" class="send-tool-btn attach-btn" title="Upload Image">
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M16.5 6.5l-7.79 7.79a3 3 0 104.24 4.24l8.14-8.14a5 5 0 10-7.07-7.07L5.32 12.02a7 7 0 109.9 9.9l7.07-7.07"
      fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  <input type="file" id="fileInput" accept="image/*" multiple hidden>
</label>

  <textarea id="msg" placeholder="Type your message..." rows="1"></textarea>

<div class="send-actions">
  <button type="button" class="send-tool-btn" title="Gift">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-7M12 4v16M3 8h18v4H3V8zm4.5 0h0A2.5 2.5 0 1 1 10 5.5V8H7.5zm9 0H14V5.5A2.5 2.5 0 1 1 16.5 8z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>

  <button type="button" class="send-tool-btn" id="emojiBtn" title="Emoji">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/>
      <path d="M9 10h.01M15 10h.01" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    </svg>
  </button>

  <button type="button" id="sendBtn" class="send-main-btn" disabled title="Send">
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 20l17-8L4 4l3 8-3 8zm3-8h14"
        fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  </button>
</div>
</div>
<div id="emojiPickerWrap" class="emoji-picker-wrap" hidden>
  <emoji-picker id="emojiPicker"></emoji-picker>
</div>
  </div>
</main>
<audio id="notifSound" src="./audio.wav" preload="auto"></audio>
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/9.22.2/firebase-database-compat.js"></script>
<script src="./firebase.js"></script>
<script src="./new-ui.js"></script>
<script src="./shared-ui.js"></script>
<script type="module" src="https://cdn.jsdelivr.net/npm/emoji-picker-element@^1/index.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@fingerprintjs/fingerprintjs@3/dist/fp.min.js"></script>
<script src="./admin.js"></script>
<script type="module">
function escapeHTML(s){
  return String(s).replace(/[&<>"']/g, m => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));
}
let chatInitialized = false;
let currentUserEmail = null;
let currentActiveId  = null;
let currentIsGuest   = false;
let currentAdminUsername = "";
let presenceBoundFor = null;
let forceOpenBottom = true;
let hideBottomBtnTimer = null;

let pendingImages = [];
let isUploadingImage = false;
let currentImageUploadToken = 0;

let msgInputEl = null;
let sendBtnEl = null;
let fileInputEl = null;
let imagePreviewWrapEl = null;
let imagePreviewListEl = null;
let imageUploadStatusEl = null;
let imageUploadTextEl = null;
let FP_PROMISE = null;

function initFingerprint(){
  if (FP_PROMISE) return FP_PROMISE;

  FP_PROMISE = (async () => {
    try{
      if (!window.FingerprintJS) {
        console.warn("FingerprintJS not loaded");
        return null;
      }

      const fp = await FingerprintJS.load();
      const res = await fp.get();

      return res?.visitorId || null;
    }catch(e){
      console.warn("Fingerprint init failed:", e);
      return null;
    }
  })();

  return FP_PROMISE;
}

async function getVisitorId(){
  const savedId = localStorage.getItem("deviceId");
  if (savedId && !/^fb_/i.test(savedId)) {
    return savedId;
  }

  const fpId = await initFingerprint();
  if (fpId) {
    localStorage.setItem("deviceId", fpId);
    return fpId;
  }

  const fallbackId = getFallbackDeviceId();
  localStorage.setItem("deviceId", fallbackId);
  return fallbackId;
}
function sanitizeEmail(email){
  return String(email || "")
    .trim()
    .toLowerCase()
    .replace(/\./g, "_")
    .replace(/[#$\[\]/]/g,"_");
}
function getChatPath(){ return currentActiveId ? 'chats/' + currentActiveId : null; }
function getUserPath(){ return currentActiveId ? 'users/' + currentActiveId : null; }
function getNotifPath(){ return currentActiveId ? 'notifications/' + currentActiveId : null; }
function getUserTypingPath(){
  return currentActiveId ? 'users/' + currentActiveId + '/typing' : null;
}

let userTypingTimer = null;
let userPresenceHeartbeat = null;
let userConnectedRef = null;
let userRefForPresence = null;

function stopUserPresence(forceOffline = true){
  try {
    clearInterval(userPresenceHeartbeat);
    userPresenceHeartbeat = null;
  } catch {}

  try {
    clearTimeout(userTypingTimer);
    userTypingTimer = null;
  } catch {}

  try {
    if (userConnectedRef) {
      userConnectedRef.off();
      userConnectedRef = null;
    }
  } catch {}

  try {
    if (userRefForPresence) {
      userRefForPresence.onDisconnect().cancel();
      userRefForPresence = null;
    }
  } catch {}

  const userPath = getUserPath();
  const typingPath = getUserTypingPath();

  if (typingPath) {
    db.ref(typingPath).set(false).catch(()=>{});
  }

  if (forceOffline && userPath) {
    db.ref(userPath).update({
      online: false,
      typing: false,
      lastLoginTime: Date.now()
    }).catch(()=>{});
  }

  presenceBoundFor = null;
}
function touchUserPresence(extra = {}) {
  const userPath = getUserPath();
  if (!userPath) return;

  db.ref(userPath).update({
    online: true,
    typing: false,
    lastLoginTime: Date.now(),
    ...extra
  }).catch(()=>{});
}
function bindUserTyping(){
  const msgInput = document.getElementById("msg");
  const typingPath = getUserTypingPath();
  if (!msgInput || !typingPath) return;

  const typingRef = db.ref(typingPath);

  msgInput.addEventListener("input", () => {
    const hasText = !!msgInput.value.trim();

    typingRef.set(hasText).catch(()=>{});
    touchUserPresence({ typing: hasText });

    clearTimeout(userTypingTimer);

    if (!hasText) {
      typingRef.set(false).catch(()=>{});
      touchUserPresence({ typing: false });
      return;
    }

    userTypingTimer = setTimeout(() => {
      typingRef.set(false).catch(()=>{});
      touchUserPresence({ typing: false });
    }, 1500);
  });

  msgInput.addEventListener("blur", () => {
    typingRef.set(false).catch(()=>{});
    touchUserPresence({ typing: false });
  });

  window.addEventListener("beforeunload", () => {
    typingRef.set(false).catch(()=>{});
  });
}

const CLOUDINARY_CLOUD_NAME = "dqctvbenv";
const CLOUDINARY_UPLOAD_PRESET = "chat_upload";
const ADMIN_PRESENCE_PATH = "adminPresence/main";
let adminPresenceBound = false;

function getOrCreateLocalGuestId(){
  let id = localStorage.getItem('guest.uid');
  if (!id){
    id = 'g_' + Array.from(crypto.getRandomValues(new Uint32Array(4))).join('');
    localStorage.setItem('guest.uid', id);
  }
  return id;
}
function getFallbackDeviceId(){
  let id = localStorage.getItem("fallbackDeviceId");
  if (!id){
    id = "fb_" + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));
    localStorage.setItem("fallbackDeviceId", id);
  }
  return id;
}

function getBrowserName(){
  const ua = navigator.userAgent || "";
  if (/Edg\//i.test(ua)) return "Edge";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Chrome\//i.test(ua)) return "Chrome";
  if (/Safari\//i.test(ua)) return "Safari";
  return "Unknown";
}

function getDeviceType(){
  const ua = navigator.userAgent || "";

  if (/Android/i.test(ua)) return "Android";
  if (/iPhone/i.test(ua)) return "iPhone";
  if (/iPad/i.test(ua)) return "iPad";
  if (/iPod/i.test(ua)) return "iPod";
  if (/Windows NT/i.test(ua)) return "Windows";
  if (/Macintosh|Mac OS X/i.test(ua) && !/iPhone|iPad|iPod/i.test(ua)) return "Mac";
  if (/Linux/i.test(ua) && !/Android/i.test(ua)) return "Linux";

  return "Unknown";
}
function getOrCreateLocalGuestName(id){
  let name = (localStorage.getItem('guest.name') || '').trim();
  if (!name) {
    name = makeGuestDisplayNameFromId(id);
    localStorage.setItem('guest.name', name);
  }
  return name;
}
function makeGuestDisplayNameFromId(id) {
  const raw = String(id || "").trim();
  if (!raw) return "Guest-User";

  const clean = raw.replace(/^g_/i, "").replace(/[^a-zA-Z0-9]/g, "");
  const shortCode = (clean.slice(-5) || "USER").toUpperCase();

  return "Guest-" + shortCode;
}

function ensureGuestDisplayName() {
  if (!currentIsGuest) return localStorage.getItem("username") || "User";

  const guestId = currentActiveId || getOrCreateLocalGuestId();
  let guestName = (localStorage.getItem("guest.name") || "").trim();

  if (!guestName || !/^Guest-/i.test(guestName)) {
    guestName = makeGuestDisplayNameFromId(guestId);
    localStorage.setItem("guest.name", guestName);
  }

  localStorage.setItem("username", guestName);

  if (!localStorage.getItem("userphoto")) {
    localStorage.setItem("userphoto", "");
  }

  return guestName;
}

/* ==========================================
   LIVECHAT USER - MARK SUPPORT MESSAGES READ
========================================== */

let isMarkingUserRead = false;




function isLivechatVisible() {
  // Jangan mark read jika browser tab tersembunyi.
  if (document.visibilityState !== "visible") {
    return false;
  }

  // Floating LiveChat dianggap aktif apabila iframe kelihatan.
  const isFloating =
    new URLSearchParams(window.location.search)
      .get("floating") === "1";

  if (isFloating) {
    return true;
  }

  const currentFile = window.location.pathname
    .split("/")
    .pop()
    .toLowerCase();

  // LiveChat dibuka secara langsung.
  if (window.parent === window) {
    return currentFile === "livechat.html";
  }

  // LiveChat dibuka dalam tab dashboard.
  try {
    if (
      typeof window.parent.isLivechatTabActive === "function"
    ) {
      return window.parent.isLivechatTabActive();
    }
  } catch (error) {
    console.warn("LiveChat tab check failed:", error);
  }

  return false;
}




async function markAdminSeenInDB() {
  if (!currentActiveId) return;
    console.log("[LiveChat Read Check]", {
  chatId: currentActiveId,
  visible: isLivechatVisible(),
  parentActive: window.parent !== window
    ? window.parent.isLivechatTabActive?.()
    : true
});
  if (!isLivechatVisible()) return;
  if (isMarkingUserRead) return;

  const chatPath = getChatPath();
  if (!chatPath) return;

  isMarkingUserRead = true;

  try {
    const chatRef = db.ref(chatPath);
    const snapshot = await chatRef.once("value");

    if (!isLivechatVisible()) return;

    const updates = {};
    const now = Date.now();

    snapshot.forEach(child => {
      const message = child.val();

      if (
        message?.from === "admin" &&
        message.readByUser !== true
      ) {
        updates[`${child.key}/readByUser`] = true;
        updates[`${child.key}/seenByUser`] = true;
        updates[`${child.key}/readAt`] = now;
      }
    });

    if (Object.keys(updates).length) {
      await chatRef.update(updates);
    }
console.log("[LiveChat Read Saved]", {
  chatPath,
  updatedFields: Object.keys(updates).length
});
  } catch (error) {
    console.error(
      "LiveChat mark read failed:",
      error
    );
  } finally {
    isMarkingUserRead = false;
  }
}

/* ==========================================
   LIVECHAT - ADMIN IDENTITY FROM FIREBASE
   ========================================== */

function waitForLivechatAuth() {
  return new Promise((resolve, reject) => {
    const unsubscribe = auth.onAuthStateChanged(
      user => {
        unsubscribe();
        resolve(user);
      },
      reject
    );
  });
}

async function restoreAdminLivechatIdentity() {
  const user = await waitForLivechatAuth();

  if (!user || user.isAnonymous) return false;

  const token = await user.getIdTokenResult();

  if (
    token.claims.secondVerified !== true ||
    !Number.isSafeInteger(token.claims.pinVersion)
  ) {
    return false;
  }

  const snapshot = await db
    .ref("adminUsers/" + user.uid)
    .once("value");

  const profile = snapshot.val();

  if (
    !profile ||
    profile.active !== true ||
    profile.secondPasswordEnabled !== true ||
    !["superadmin", "siteadmin"].includes(profile.role) ||
    token.claims.pinVersion !== profile.pinVersion
  ) {
    return false;
  }

  const username = String(profile.username || "").trim();

  if (!username) {
    console.warn("Admin profile has no username.");
    return false;
  }

  currentActiveId = "admin_" + user.uid;
  currentAdminUsername = username;
  currentUserEmail = user.email || null;
  currentIsGuest = false;

  localStorage.setItem("username", username);
  localStorage.setItem("adminName", username);
  localStorage.setItem("livechat.adminRole", profile.role);

  await writeUserProfile();
  bindPresenceAndNotif();
  initChatWithUserData();
  notifyRead();
  // Pastikan identiti chat sudah tersedia sebelum mark read.
  markAdminSeenInDB().catch(error => {
    console.error("[LiveChat] Read after login failed:", error);
  });
  console.log("LiveChat admin identity restored:", {
    uid: user.uid,
    username,
    role: profile.role
  });

  return true;
}

async function ensureGuestLocalIdentity(){
  const localGuestId = getOrCreateLocalGuestId();
  const localGuestName = getOrCreateLocalGuestName(localGuestId);

  try{
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

    if (!auth.currentUser) {
      await auth.signInAnonymously();
    }

    // ✅ Walaupun auth anonymous berjaya, tetap guna guest lokal
    currentIsGuest = true;
    currentUserEmail = null;
    currentActiveId = localGuestId;

    localStorage.setItem("guest.uid", localGuestId);
    localStorage.setItem("guest.name", localGuestName);
    localStorage.setItem("username", localGuestName);

  }catch(e){
    if (e?.code === 'auth/admin-restricted-operation' || e?.code === 'auth/operation-not-allowed'){
      console.warn('Anonymous disabled — using local guest id');
      currentIsGuest   = true;
      currentUserEmail = null;
      currentActiveId  = localGuestId;

      localStorage.setItem("guest.uid", localGuestId);
      localStorage.setItem("guest.name", localGuestName);
      localStorage.setItem("username", localGuestName);
    } else {
      throw e;
    }
  }

  ensureGuestDisplayName();
  await writeUserProfile();
  bindPresenceAndNotif();
  initChatWithUserData();
  notifyRead();
}
  
function bindPresenceAndNotif(){
  if (!currentActiveId) return;
  if (presenceBoundFor === currentActiveId) return;

  const userPath  = getUserPath();
  const notifPath = getNotifPath();
  if (!userPath) return;

  // stop listener/heartbeat lama dulu
  stopUserPresence(false);

  presenceBoundFor = currentActiveId;

  userConnectedRef = db.ref(".info/connected");
  userRefForPresence = db.ref(userPath);

  userConnectedRef.on("value", (snap) => {
    if (snap.val() === true) {
      touchUserPresence({ typing: false });

      userRefForPresence.onDisconnect().update({
        online: false,
        typing: false,
        lastLoginTime: Date.now()
      });

      clearInterval(userPresenceHeartbeat);
      userPresenceHeartbeat = setInterval(() => {
        touchUserPresence();
      }, 10000);
    }
  });

  // notifikasi admin -> user
  if (notifPath){
    const nr = db.ref(notifPath);
    nr.off();
    nr.on("value", (snapshot) => {
      const notif = snapshot.val();
      if (notif && notif.unread) {
if (shouldPlayNotificationSound()) {
  playNotificationSound();
}
        notifyUnread();
        setTimeout(() => { nr.child("unread").set(false); }, 2000);
      } else {
        notifyRead();
      }
    });
  }
}
async function writeUserProfile(){
  const upath = getUserPath();
  if (!upath) return;

const finalName = currentIsGuest
  ? ensureGuestDisplayName()
  : currentAdminUsername;

if (!currentIsGuest && !currentAdminUsername) return;

  const now = Date.now();
  const browser = getBrowserName();
  const deviceType = getDeviceType();
  const deviceId = await getVisitorId();

  const data = {
    name: finalName,
    displayName: finalName,
    email: currentUserEmail || null,
    photoURL: localStorage.getItem("userphoto") || null,
    isGuest: !!currentIsGuest,
    online: true,

    browser,
    deviceType,
    deviceId,
    ua: navigator.userAgent || "",
    tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "",

    lastLoginTime: now,
    pageLoginTime: now,
    lastLoginAt: now
  };

  db.ref(upath).update(data).catch((err) => {
    console.warn("writeUserProfile failed:", err?.message || err);
  });
}


let userHasInteracted = false;

function shouldPlayNotificationSound() {
  return document.visibilityState === "visible";
}
function cleanDuplicateName(name) {
  const parts = name.trim().split(/\s+/);
  const half = parts.length / 2;
  if (parts.length % 2 === 0) {
    const firstHalf = parts.slice(0, half).join(' ');
    const secondHalf = parts.slice(half).join(' ');
    if (firstHalf === secondHalf) return firstHalf;
  }
  return name;
}
function nameOnly(s){
  if (!s) return 'User';
  s = String(s).trim();
  const at = s.indexOf('@');
  if (at > -1) s = s.slice(0, at);
  return s.replace(/\./g, ' ');
}
function updateUserHeader() {
  let userName = localStorage.getItem("username") || "User";  // GANTI const → let
  const userPhoto = localStorage.getItem("userphoto") || "https://i.pravatar.cc/40";
  const nameEl = document.getElementById("headerUserName");
  const photoEl = document.getElementById("headerUserPhoto");

  userName = cleanDuplicateName(userName);  // ✅ Tidak error lagi
  if (nameEl) nameEl.textContent = userName;
  if (photoEl) photoEl.src = userPhoto;
}
function updateAdminHeader(name, photo) {
  const nameEl = document.getElementById("headerUserName");
  const photoEl = document.getElementById("headerUserPhoto");

  const finalName = "Admin Support";
  const finalPhoto = "https://i.imgur.com/qiZFOs9.png";

  if (nameEl) nameEl.textContent = finalName;
  if (photoEl) photoEl.src = finalPhoto;
}
function formatLastSeenText(ts) {
  if (!ts) return "Offline";

  const d = new Date(ts);
  if (isNaN(d.getTime())) return "Offline";

  const now = new Date();

  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const msgDay = new Date(d);
  msgDay.setHours(0, 0, 0, 0);

  const timeText = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  if (msgDay.getTime() === today.getTime()) {
    return `Last seen today at ${timeText}`;
  }

  if (msgDay.getTime() === yesterday.getTime()) {
    return `Last seen yesterday at ${timeText}`;
  }

  const sameYear = d.getFullYear() === now.getFullYear();

  const dateText = d.toLocaleDateString('en-GB', sameYear
    ? { day: 'numeric', month: 'short' }
    : { day: 'numeric', month: 'short', year: 'numeric' }
  );

  return `Last seen ${dateText} at ${timeText}`;
}
function bindAdminHeaderPresence(){
  if (adminPresenceBound) return;
  adminPresenceBound = true;

  const ref = db.ref(ADMIN_PRESENCE_PATH);
  const typingEl = document.getElementById("typingStatus");

  ref.on("value", snap => {
    const data = snap.val() || {};

    updateAdminHeader(
      "Admin Support",
      data.photoURL || "./logo.svg"
    );
    // Nama operator hanya daripada rekod presence admin, bukan identiti pelanggan.
    const agentEl = document.getElementById("supportAgentName");
    if (agentEl) {
      const agent = typeof data.username === "string" ? data.username.trim() : "";
      agentEl.textContent = agent || "Support team";
    }

    if (!typingEl) return;

    if (data.typing === true) {
      typingEl.textContent = "Typing...";
    } else if (data.online === true) {
      typingEl.textContent = "Online";
    } else if (data.lastSeen) {
      typingEl.textContent = formatLastSeenText(data.lastSeen);
    } else {
      typingEl.textContent = "Offline";
    }
  });
}
function forceEmojiSearchInputWhite() {
  const picker = document.getElementById("emojiPicker");
  if (!picker) return;

  const applyStyles = () => {
    const root = picker.shadowRoot;
    if (!root) return;

    const searchInput = root.querySelector('input.search');
    if (!searchInput) return;

    searchInput.style.color = "#ffffff";
    searchInput.style.webkitTextFillColor = "#ffffff";
    searchInput.style.caretColor = "#ffffff";
    searchInput.style.background = "#0b0b0b";
    searchInput.style.opacity = "1";
    searchInput.style.textShadow = "0 0 0 #ffffff";
  };

  // cuba terus
  applyStyles();

  // kalau component belum siap render, tunggu sekejap
  setTimeout(applyStyles, 100);
  setTimeout(applyStyles, 300);
  setTimeout(applyStyles, 700);

  // bila picker dibuka lagi, paksa lagi
  picker.addEventListener("click", applyStyles);
  picker.addEventListener("emoji-click", applyStyles);
}
// PATCH START: initChatWithUserData universal
function initChatWithUserData() {
  if (chatInitialized) return;

  // wajib ada activeId (uid guest atau email_sanitized)
  if (!currentActiveId) return;

  msgInputEl = document.getElementById('msg');
function autoResizeMsgBox() {
  if (!msgInputEl) return;
  msgInputEl.style.height = "24px";
  msgInputEl.style.height = Math.min(msgInputEl.scrollHeight, 120) + "px";
}
sendBtnEl = document.getElementById('sendBtn');
fileInputEl = document.getElementById('fileInput');
imagePreviewWrapEl = document.getElementById('imagePreviewWrap');
imagePreviewListEl = document.getElementById('imagePreviewList');
imageUploadStatusEl = document.getElementById('imageUploadStatus');
imageUploadTextEl = document.getElementById('imageUploadText');
  
  const emojiBtn = document.getElementById("emojiBtn");
  const emojiPickerWrap = document.getElementById("emojiPickerWrap");
  const emojiPicker = document.getElementById("emojiPicker");
  const searchInput = document.getElementById('searchChat');
  const chatBox     = document.getElementById('chatBox');
  const typingEl    = document.getElementById('typingStatus');

 if (!msgInputEl || !sendBtnEl || !fileInputEl || !searchInput || !chatBox) return;
  const toBottomBtn = document.getElementById("toBottomBtn");

chatBox.addEventListener("scroll", () => {
  handleChatScrollAutoButton(chatBox);
});

if (toBottomBtn) {
  toBottomBtn.addEventListener("click", () => {
    chatBox.scrollTo({
      top: chatBox.scrollHeight,
      behavior: "smooth"
    });

    toBottomBtn.classList.remove("show");
    clearTimeout(hideBottomBtnTimer);
  });
}

chatInitialized = true;
updateAdminHeader("Admin Support", "./logo.svg");
if (typingEl) typingEl.textContent = "Offline";
bindAdminHeaderPresence();
bindUserTyping();
  
refreshSend();
if (emojiBtn && emojiPickerWrap && emojiPicker && msgInputEl) {
emojiBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  emojiPickerWrap.hidden = !emojiPickerWrap.hidden;

  if (!emojiPickerWrap.hidden) {
    forceEmojiSearchInputWhite();
  }
  forceEmojiSearchInputWhite();
});

  emojiPicker.addEventListener("emoji-click", (event) => {
    const emoji = event.detail?.unicode || "";
    if (!emoji) return;

    const start = msgInputEl.selectionStart ?? msgInputEl.value.length;
const end = msgInputEl.selectionEnd ?? msgInputEl.value.length;
const value = msgInputEl.value;

msgInputEl.value = value.slice(0, start) + emoji + value.slice(end);
msgInputEl.focus();

const pos = start + emoji.length;
msgInputEl.setSelectionRange(pos, pos);

    emojiPickerWrap.hidden = true;
    refreshSend();
    autoResizeMsgBox();
  });

  document.addEventListener("click", (e) => {
    if (!emojiPickerWrap.contains(e.target) && e.target !== emojiBtn) {
      emojiPickerWrap.hidden = true;
    }
  });
}
msgInputEl.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;

  if (e.ctrlKey) {
    e.preventDefault();

    const start = msgInputEl.selectionStart;
    const end = msgInputEl.selectionEnd;
    const value = msgInputEl.value;

    msgInputEl.value =
      value.slice(0, start) + "\n" + value.slice(end);

    msgInputEl.setSelectionRange(start + 1, start + 1);
    autoResizeMsgBox();
    return;
  }

  if (e.shiftKey) return;

  e.preventDefault();

  const hasReadyImages = pendingImages.some(item => !!item.uploadedUrl);

  if (isUploadingImage) return;
  if (!msgInputEl.value.trim() && !hasReadyImages) return;

  sendMessage();
});

msgInputEl.addEventListener("input", () => {
  autoResizeMsgBox();
  refreshSend();
});
msgInputEl.addEventListener("paste", async (e) => {
  const items = (e.clipboardData || e.originalEvent.clipboardData).items;
  if (!items) return;

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.indexOf("image") !== -1) {
      const file = items[i].getAsFile();
      if (!file) return;

      if (file.size > 25 * 1024 * 1024) {
      alert("❌ Image too large (max 25MB)");
      e.preventDefault();
      return;
     }
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInputEl.files = dt.files;

      e.preventDefault();

      await handleSelectedImageFile(file);
      break;
    }
  }
});
autoResizeMsgBox();

fileInputEl.addEventListener("change", async (e) => {
  const files = Array.from(e.target.files || []);
  if (!files.length) return;

  for (const file of files) {
    await handleSelectedImageFile(file);
  }

  fileInputEl.value = "";
});

sendBtnEl.addEventListener('click', () => sendMessage());
sendBtnEl.disabled = true;
forceOpenBottom = true;
listenToChat();
}
function showBottomBtnWhileScrolling(chatBox){
  const toBottomBtn = document.getElementById("toBottomBtn");
  if (!chatBox || !toBottomBtn) return;

  if (isAtBottom(chatBox)) {
    toBottomBtn.classList.remove("show");
    clearTimeout(hideBottomBtnTimer);
    return;
  }

  toBottomBtn.classList.add("show");

  clearTimeout(hideBottomBtnTimer);
  hideBottomBtnTimer = setTimeout(() => {
    if (!isAtBottom(chatBox)) {
      toBottomBtn.classList.remove("show");
    }
  }, 1200);
}

function handleChatScrollAutoButton(chatBox){
  const toBottomBtn = document.getElementById("toBottomBtn");
  if (!chatBox || !toBottomBtn) return;

  if (isAtBottom(chatBox)) {
    toBottomBtn.classList.remove("show");
    clearTimeout(hideBottomBtnTimer);
    return;
  }

  showBottomBtnWhileScrolling(chatBox);
}
function refreshSend(){
  const text = (msgInputEl?.value || "").trim();
  const hasUploadingImage = pendingImages.some(item => item.uploading);
  const hasReadyImages = pendingImages.some(item => !!item.uploadedUrl);
  const hasAnything = !!text || hasReadyImages || pendingImages.length > 0;

  if (!sendBtnEl) return;
  sendBtnEl.disabled = !hasAnything || hasUploadingImage;
}

function setImageUploadLoading(isLoading, text = "Uploading image..."){
  isUploadingImage = !!isLoading;

  if (imageUploadStatusEl) {
    imageUploadStatusEl.hidden = !isLoading;
    imageUploadStatusEl.style.display = isLoading ? "flex" : "none";
  }

  if (imageUploadTextEl) {
    imageUploadTextEl.textContent = text;
  }

  refreshSend();
}
function renderSelectedImages(){
  if (!imagePreviewWrapEl || !imagePreviewListEl) return;

  imagePreviewListEl.innerHTML = "";

  if (!pendingImages.length){
    imagePreviewWrapEl.hidden = true;
    refreshSend();
    return;
  }

  imagePreviewWrapEl.hidden = false;

  pendingImages.forEach(item => {
    const card = document.createElement("div");
    card.className = "image-preview-card";

    card.innerHTML = `
      <img src="${item.preview}" class="image-preview" alt="Preview" title="Click to preview">
      <button type="button" class="remove-image-btn" title="Remove image">×</button>
    `;

    const previewImg = card.querySelector(".image-preview");
    const removeBtn = card.querySelector(".remove-image-btn");

    // ✅ klik thumbnail di input untuk preview besar
    previewImg.addEventListener("click", () => {
      openImageLightbox(item.preview || item.uploadedUrl || "");
    });

    // ✅ buang gambar
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeSelectedImage(item.id);
    });

    imagePreviewListEl.appendChild(card);
  });

  refreshSend();
}

function removeSelectedImage(id){
  pendingImages = pendingImages.filter(item => item.id !== id);

  if (fileInputEl && !pendingImages.length) {
    fileInputEl.value = "";
  }

  renderSelectedImages();
}
function clearSelectedImage(resetInput = true){
  currentImageUploadToken++;

  pendingImages = [];
  isUploadingImage = false;

  if (resetInput && fileInputEl) fileInputEl.value = "";

  if (imagePreviewListEl) imagePreviewListEl.innerHTML = "";
  if (imagePreviewWrapEl) imagePreviewWrapEl.hidden = true;

  if (imageUploadStatusEl) {
    imageUploadStatusEl.hidden = true;
    imageUploadStatusEl.style.display = "none";
  }

  if (imageUploadTextEl) {
    imageUploadTextEl.textContent = "Uploading image...";
  }

  refreshSend();
}

async function uploadImageToCloudinary(file, uploadToken){
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: "POST",
    body: formData
  });

  const data = await res.json();

  if (!res.ok || !data.secure_url) {
    throw new Error(data?.error?.message || "Upload failed");
  }

  return data.secure_url;
}

async function handleSelectedImageFile(file){
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("❌ Only image allowed");
    return;
  }

  if (file.size > 25 * 1024 * 1024) {
    alert("❌ Image too large (max 25MB)");
    return;
  }

  const localId = "img_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
  const uploadToken = currentImageUploadToken;

  const preview = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error("Preview failed"));
    reader.readAsDataURL(file);
  });

  const item = {
    id: localId,
    file,
    preview,
    uploadedUrl: "",
    uploading: true
  };

  pendingImages.push(item);
  renderSelectedImages();

  if (msgInputEl) {
    msgInputEl.focus({ preventScroll: true });
  }

  let compressedFile = file;
  try {
    compressedFile = await compressImage(file, 1280, 0.72);
  } catch (err) {
    console.warn("Compress failed, fallback original file:", err);
  }

  isUploadingImage = true;
  setImageUploadLoading(true, "Uploading image...");
  refreshSend();

  try {
    const secureUrl = await uploadImageToCloudinary(compressedFile, uploadToken);

    const target = pendingImages.find(x => x.id === localId);
    if (!target) return;

    target.file = compressedFile;
    target.uploadedUrl = secureUrl || "";
    target.uploading = false;
  } catch (err) {
    console.error("Image pre-upload failed:", err);
    pendingImages = pendingImages.filter(x => x.id !== localId);
    alert("❌ Upload image gagal. Sila cuba lagi.");
  } finally {
    isUploadingImage = pendingImages.some(x => x.uploading);

    if (!isUploadingImage) {
      setImageUploadLoading(false);
    }

    renderSelectedImages();

    if (msgInputEl) {
      msgInputEl.focus({ preventScroll: true });
    }
  }
}
async function compressImage(file, maxWidth = 1280, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const img = new Image();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error("Failed to read image"));

    img.onload = () => {
      let { width, height } = img;

      if (width > maxWidth) {
        height = Math.round(height * (maxWidth / width));
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Compression failed"));
            return;
          }

          const compressedFile = new File(
            [blob],
            (file.name || "image").replace(/\.\w+$/, "") + ".jpg",
            { type: "image/jpeg" }
          );

          resolve(compressedFile);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => reject(new Error("Invalid image file"));
    reader.readAsDataURL(file);
  });
}
async function sendMessage() {
  if (!currentActiveId) return;

  const msg = (msgInputEl?.value || '').trim();

  const stillUploading = pendingImages.some(item => item.uploading);
  if (stillUploading) {
    alert("⏳ Please wait, image still uploading...");
    return;
  }

  const readyImages = pendingImages
    .map(item => item.uploadedUrl)
    .filter(Boolean);

  if (!msg && !readyImages.length) return;

 const userName = currentIsGuest
  ? (localStorage.getItem("guest.name") || "Guest")
  : currentAdminUsername;

if (!currentIsGuest) {
  const activeAuthUser = auth.currentUser;

  if (
    !activeAuthUser ||
    currentActiveId !== "admin_" + activeAuthUser.uid ||
    !currentAdminUsername
  ) {
    console.warn("LiveChat identity changed. Please reload.");
    alert("Login session changed. Please reload LiveChat.");
    return;
  }
}
  const userPhoto = localStorage.getItem("userphoto") || "";
  const time = Date.now();

  const chatPath = getChatPath();
  if (!chatPath) return;
  const chatRef = db.ref(chatPath);

  try {
    await chatRef.push({
      from: 'user',
      name: userName,
      email: currentUserEmail || null,
      photoURL: userPhoto || null,
      text: msg || null,
      image: readyImages[0] || null,
      images: readyImages,
      time,
      readByAdmin: false
    });

    // ==========================================
    // LIVECHAT - REALTIME UNREAD FOR ADMIN
    // ==========================================
    try {
      const sid = currentActiveId;

      if (sid) {
        const userRef = db.ref(`users/${sid}`);
        const unreadRef = userRef.child('unreadCountForAdmin');

        await unreadRef.transaction(current => {
          const count = Number(current) || 0;
          return Math.max(0, count) + 1;
        });

        await userRef.update({
          unreadForAdmin: true,
          lastChatTime: time
        });
      }
    } catch (unreadError) {
      console.error(
        '[LiveChat] Unread update failed:',
        unreadError
      );
    }

    setTimeout(() => onNewMessageRendered({ forceToBottom: true, instant: false }), 0);

    if (msgInputEl) {
      msgInputEl.value = '';
      msgInputEl.style.height = "24px";
    }

    clearSelectedImage(true);

    const typingPath = getUserTypingPath();
    if (typingPath) db.ref(typingPath).set(false).catch(()=>{});
    touchUserPresence({ typing: false });

    refreshSend();
  } catch (error) {
    console.error("Error sending message:", error);
    refreshSend();
    alert("❌ Gagal mengirim pesan.");
  }
}
// Simpan listener milik halaman LiveChat sahaja.
let userChatListenerRef = null;
let userChatListenerHandler = null;
// PATCH START: listenToChat universal
function listenToChat() {
  if (!currentActiveId) return;

  const chatBox = document.getElementById('chatBox');
  const chatPath = getChatPath();
  if (!chatBox || !chatPath) return;

// Hentikan hanya listener LiveChat lama milik halaman ini.
if (userChatListenerRef && userChatListenerHandler) {
  userChatListenerRef.off("value", userChatListenerHandler);
}

const chatRef = db.ref(chatPath);
userChatListenerRef = chatRef;

  const startMsg = document.getElementById("startMessage");

  userChatListenerHandler = snapshot => {
    const firstPaint = forceOpenBottom;
    const wasAtBottom = firstPaint ? true : isAtBottom(chatBox);
    const chats = snapshot.val();

    if (firstPaint) {
      chatBox.style.visibility = "hidden";
    }

    const oldMessages = chatBox.querySelectorAll(".message, .date-label");
    oldMessages.forEach(el => el.remove());

    if (!chats || Object.keys(chats).length === 0) {
      if (startMsg) startMsg.style.display = "block";
      notifyRead();

      if (firstPaint) {
        requestAnimationFrame(() => {
          chatBox.style.visibility = "visible";
          forceOpenBottom = false;
        });
      }
      return;
    }

    if (startMsg) startMsg.style.display = "none";

    let hasUnreadSupportMessage = false;

    const chatArray = Object.values(chats).sort((a, b) => (a.time || 0) - (b.time || 0));

    const today = new Date();
    today.setHours(0,0,0,0);

    const pastChats = [];
    const todayChats = [];

    chatArray.forEach(c => {
      const t = Number(c.time) || 0;
      const msgDateOnly = new Date(t);
      msgDateOnly.setHours(0,0,0,0);

      (msgDateOnly.getTime() === today.getTime() ? todayChats : pastChats).push(c);

if (
  c.from === "admin" &&
  c.readByUser !== true
) {
  hasUnreadSupportMessage = true;
}
    });


if (hasUnreadSupportMessage) {
  notifyUnread();
} else {
  notifyRead();
}


    renderChats(pastChats, today);
    renderChats(todayChats, today);
    markAdminSeenInDB();

    const lastMsg = chatArray[chatArray.length - 1] || {};
    const mustForce = firstPaint || wasAtBottom || lastMsg.from === 'user';

    requestAnimationFrame(() => {
      onNewMessageRendered({
        forceToBottom: mustForce,
        instant: firstPaint
      });

      if (!mustForce && !isAtBottom(chatBox)) {
      showBottomBtnWhileScrolling(chatBox);
     }
      if (firstPaint) {
        requestAnimationFrame(() => {
          chatBox.style.visibility = "visible";
          forceOpenBottom = false;
        });
      }
    });
  };

  chatRef.on("value", userChatListenerHandler);
}
// ====== SEARCH ======
const chatBody   = document.getElementById('chatBox');
const searchBox  = document.getElementById('searchChat');
let lastQuery    = '';
let searchHits   = [];
let hitIndex     = 0;

function clearSearchMarks(){
  chatBody.querySelectorAll('mark.__hit').forEach(m=>{
    const p = m.parentNode; m.replaceWith(document.createTextNode(m.textContent)); p.normalize();
  });
}
function doSearch(q){
  q = (q||'').trim();
  const noResults = document.getElementById('noResults');
  if (noResults) noResults.style.display = 'none';

  // reset highlight dulu
  clearSearchMarks();
  searchHits = []; hitIndex = 0;

  // jika kosong → tampilkan semua bubble
  if (!q){
    chatBody.querySelectorAll('.message').forEach(b => b.style.display = '');
    return;
  }

  lastQuery = q.toLowerCase();
  let matches = 0;

  chatBody.querySelectorAll('.message').forEach(bubble=>{
    const nameEl = bubble.querySelector('.msg-info');
    const textEl = bubble.querySelector('.msg-text');
    const nameTxt = (nameEl?.textContent || '');
    const msgTxt  = (textEl?.textContent || '');
    const isMatch = (nameTxt + ' ' + msgTxt).toLowerCase().includes(lastQuery);

    // filter tampilan
    bubble.style.display = isMatch ? '' : 'none';
    if (!isMatch) return;
    matches++;

    // highlight di elemen nama & teks
    [nameEl, textEl].forEach(el=>{
      if (!el) return;
      const raw = el.textContent;
      const low = raw.toLowerCase();
      const frag = document.createDocumentFragment();
      let i=0, m;
      while ((m = low.indexOf(lastQuery, i)) !== -1){
        if (m>i) frag.appendChild(document.createTextNode(raw.slice(i,m)));
        const mark = document.createElement('mark');
        mark.className='__hit';
        mark.textContent = raw.slice(m, m+q.length);
        frag.appendChild(mark); searchHits.push(mark);
        i = m + q.length;
      }
      if (i < raw.length) frag.appendChild(document.createTextNode(raw.slice(i)));
      el.replaceChildren(frag);
    });
  });

  if (matches){
    (searchHits[0] || chatBody.firstElementChild)?.scrollIntoView({behavior:'smooth', block:'center'});
  }else{
    if (noResults) noResults.style.display = 'block';
  }
}
let searchTimer;
searchBox.addEventListener('input', e=>{
  clearTimeout(searchTimer);
  searchTimer = setTimeout(()=> doSearch(e.target.value), 120);
});
searchBox.addEventListener('keydown', e=>{
  if (e.key === 'Enter' && searchHits.length){
    e.preventDefault();
    hitIndex = (hitIndex + 1) % searchHits.length;
    searchHits[hitIndex].scrollIntoView({behavior:'smooth', block:'center'});
  }
});
function formatDateTime(ts){
  const d = new Date(ts);
  const pad = n => String(n).padStart(2,'0');

  return `${pad(d.getDate())}-${pad(d.getMonth()+1)}-${d.getFullYear()} ` +
         `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}
// refresh highlight bila DOM pesan berubah
function renderChats(chatGroup, today) {
  const chatBox = document.getElementById('chatBox');
  if (!chatBox) return;

  let lastDateKey = '';
  const list = Array.isArray(chatGroup) ? chatGroup : [];

  list.forEach((c) => {
    if (!c || !c.time || isNaN(new Date(c.time).getTime())) return;

    const msgDate = new Date(c.time);
    const timeFormatted = formatDateTime(c.time);
    const dateKey = msgDate.toDateString();

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const dayLabel = (dateKey === today.toDateString())
      ? 'Today'
      : (dateKey === yesterday.toDateString())
        ? 'Yesterday'
        : msgDate.toLocaleDateString('en-GB', { weekday: 'long' });

    const fullDateLabel = msgDate.toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    });

    // ——— header tanggal (jika ganti hari) ———
    if (dateKey !== lastDateKey) {
      const dateLabelDiv = document.createElement('div');
      dateLabelDiv.className = 'date-label';
      dateLabelDiv.innerHTML = `
        <div class="date-label-inner">
          <div class="day-label">${escapeHTML(dayLabel)}</div>
          <div class="full-date-label">${escapeHTML(fullDateLabel)}</div>
        </div>
      `;
      chatBox.appendChild(dateLabelDiv);
      lastDateKey = dateKey;
    }

    // ——— bubble pesan ———
    const div = document.createElement('div');
    div.className = 'message ' + (c.from === 'user' ? 'mine' : 'theirs');

    const rawName = (c.from === 'user') ? (c.name || 'You') : 'Admin';

     const senderLabel = (c.from === 'user')
     ? nameOnly(cleanDuplicateName(rawName))
     : 'Admin Support';

const senderPhoto = (c.from === 'user')
  ? 'https://i.imgur.com/MyKVioD.png'
  : 'https://i.imgur.com/qiZFOs9.png';

    // header bubble tanpa src (src diset via property biar aman)
let bubbleHtml = `
  <div class="msg-info">${escapeHTML(senderLabel)}</div>
`;

if (typeof c.text === 'string' && c.text.trim() !== '') {
  bubbleHtml += `
    <p class="msg-text">${escapeHTML(c.text).replace(/\n/g, '<br>')}</p>
  `;
}

const imageList = Array.isArray(c.images) && c.images.length
  ? c.images
  : (c.image ? [c.image] : []);

if (imageList.length) {
  bubbleHtml += `<div class="chat-image-group">`;

  imageList.forEach(imgUrl => {
    bubbleHtml += `
      <div class="chat-image-wrap" data-image="${escapeHTML(imgUrl)}" title="Preview">
        <img src="${escapeHTML(imgUrl)}" class="chat-image-thumb" alt="Preview">
        <div class="chat-image-overlay">◉ Preview</div>
      </div>
    `;
  });

  bubbleHtml += `</div>`;
}

bubbleHtml += `
  <div class="msg-time">${timeFormatted}</div>
`;

div.innerHTML = `
  <div class="msg-row ${c.from === 'user' ? 'mine-row' : 'their-row'}">
    ${c.from !== 'user' ? `<img class="msg-avatar-outside" alt="user" src="${escapeHTML(senderPhoto)}">` : ''}
    
    <div class="msg-bubble-wrap">
      ${bubbleHtml}
    </div>

    ${c.from === 'user' ? `<img class="msg-avatar-outside" alt="user" src="${escapeHTML(senderPhoto)}">` : ''}
  </div>
`;

div.querySelectorAll(".chat-image-wrap").forEach(thumb => {
  thumb.addEventListener("click", () => {
    openImageLightbox(thumb.dataset.image);
  });
});

    chatBox.appendChild(div);
  });
}
['click','keydown','scroll','touchstart'].forEach(event =>
  document.addEventListener(event, () => userHasInteracted = true, { once: true })
);
const toBottomBtn = document.getElementById('toBottomBtn'); // chatBody sudah ada dari bagian SEARCH

function isAtBottom(el, pad = 10){
  return el && (el.scrollTop + el.clientHeight >= el.scrollHeight - pad);
}

function scrollToBottom(smooth = true){
  if (!chatBody) return;
  chatBody.scrollTo({
    top: chatBody.scrollHeight,
    behavior: smooth ? "smooth" : "auto"
  });
}

function updateFab(){
  if (!toBottomBtn || !chatBody) return;
  toBottomBtn.classList.toggle('show', !isAtBottom(chatBody, 80));
}

if (toBottomBtn){
  toBottomBtn.addEventListener('click', ()=>{
    scrollToBottom(true);
    toBottomBtn.classList.remove('show');
  });
}

if (chatBody){
  chatBody.addEventListener('scroll', updateFab);
  updateFab();
}

// dipanggil tiap selesai render
function onNewMessageRendered({ forceToBottom = false, instant = false } = {}){
  if (forceToBottom || isAtBottom(chatBody, 80)) {
    scrollToBottom(!instant);
  }
  updateFab();
  if (lastQuery) doSearch(lastQuery);
}

/* ==========================================
   LIVECHAT - READ ON RETURN
========================================== */

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    markAdminSeenInDB();
  }
});

window.addEventListener("focus", () => {
  markAdminSeenInDB();
});

window.addEventListener("pageshow", () => {
  markAdminSeenInDB();
});

window.addEventListener("message", event => {
  if (event.origin !== window.location.origin) return;
  if (event.source !== window.parent) return;

  if (event.data?.type === "5G88_LIVECHAT_TAB_ACTIVE") {
    markAdminSeenInDB();
  }
});
function notifyUnread(){
  localStorage.setItem("livechatUnread", "1");
}
function notifyRead(){
  localStorage.removeItem("livechatUnread");
}
function playNotificationSound() {
  const audio = document.getElementById("notifSound");
  if (audio && userHasInteracted) {
    audio.currentTime = 0;
    audio.play().catch(e => console.warn("🔇 Audio autoplay blocked:", e));
  }
}
window.addEventListener("beforeunload", () => {
  stopUserPresence(true);
});
window.addEventListener("DOMContentLoaded", async () => {
  initFingerprint();

  const sendBoxEl = document.querySelector(".send-box");

  function setFabOffset() {
    if (!sendBoxEl) return;

    document.documentElement.style.setProperty(
      "--composer-h",
      sendBoxEl.offsetHeight + "px"
    );
  }

  setFabOffset();

  if (window.ResizeObserver && sendBoxEl) {
    new ResizeObserver(() => {
      setFabOffset();
    }).observe(sendBoxEl);
  } else {
    window.addEventListener("resize", setFabOffset);
  }


let adminRestored = false;

try {
  adminRestored = await restoreAdminLivechatIdentity();
} catch (error) {
  console.error("LiveChat admin identity error:", error);
}

if (!adminRestored) {
  const currentAuthUser = await waitForLivechatAuth();

  // Jangan jatuhkan admin yang sudah login kepada Guest
  // jika profile gagal dibaca atau token belum sah.
  if (currentAuthUser && !currentAuthUser.isAnonymous) {
    console.warn(
      "Authenticated user identity could not be verified."
    );
    return;
  }

  const email = localStorage.getItem("useremail");

  if (!currentActiveId && email) {
    currentIsGuest = false;
    currentUserEmail = email;
    currentActiveId = sanitizeEmail(email);
  }

  if (!currentActiveId) {
    await ensureGuestLocalIdentity();
  } else {
    await writeUserProfile();
    bindPresenceAndNotif();
    initChatWithUserData();
    notifyRead();
  }
}

});
/* Custom image preview uses existing NewUI component. */
function openImageLightbox(src) {
  if (!src) return;
  if (typeof window.NewUI?.imagePreview !== 'function') {
    console.error('[LiveChat] Custom NewUI image preview unavailable.');
    return;
  }
  window.NewUI.imagePreview({
    src,
    title: 'Image Preview',
    alt: 'LiveChat Image'
  });
}

window.HISTORY_TAB_NAME = "LIVE CHAT";

function sendUserAction(actionName, extra = {}) {
  if (!actionName) return;

  window.dispatchEvent(
    new CustomEvent("user-tab-action", {
      detail: {
        tab: window.HISTORY_TAB_NAME,
        action: actionName,
        extra,
        time: Date.now()
      }
    })
  );
}
/* =========================
   AUTO TRACK CLICK - COUNT SEMUA CLICK
========================= */
document.addEventListener("click", function(e) {
  const el = e.target.closest("button, [onclick], a, .btn, [data-action]");
  if (!el) return;

  if (el.disabled || el.getAttribute("aria-disabled") === "true") return;

  let name =
    el.getAttribute("data-action") ||
    el.getAttribute("title") ||
    el.getAttribute("aria-label") ||
    el.innerText ||
    el.textContent ||
    el.id ||
    "";

  name = String(name)
    .replace(/\s+/g, " ")
    .trim();

  if (!name || name.length < 2) return;

  name = name.slice(0, 40);

  sendUserAction(name);
}, true);
/* =========================
   AUTO TRACK CTRL + C / COPY IMAGE
========================= */
document.addEventListener("keydown", function(e) {
  const key = String(e.key || "").toLowerCase();

  if ((e.ctrlKey || e.metaKey) && key === "c") {
    sendUserAction("COPY IMAGE", {
      method: "keyboard",
      shortcut: "Ctrl+C"
    });
  }
}, true);
/* =========================
   AUTO TRACK BROWSER COPY EVENT
========================= */
document.addEventListener("copy", function() {
  sendUserAction("COPY IMAGE", {
    method: "copy-event"
  });
}, true);
/* =========================
   AUTO TRACK ENTER SEND MESSAGE
========================= */
document.addEventListener("keydown", function(e) {
  const key = String(e.key || "").toLowerCase();

  if (key !== "enter") return;
  if (e.shiftKey) return; // Shift+Enter untuk new line, jangan kira

  const el = e.target;
  if (!el) return;

  const isMessageInput =
    el.matches("textarea, input[type='text'], [contenteditable='true']") ||
    el.closest("[contenteditable='true']");

  if (!isMessageInput) return;

  const value = (el.value || el.innerText || el.textContent || "").trim();
  if (!value) return;

  sendUserAction("Send Message", {
    method: "enter-key"
  });
}, true);
</script>
</body>
</html>
