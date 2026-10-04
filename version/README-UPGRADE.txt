5G88 ADMIN + DUAL LIVECHAT V2

WHAT TO REPLACE / ADD
1. Replace your current base files with the files in this folder.
2. ADD livechat.html = Site Admin LiveChat.
3. ADD superadmin-livechat.html = Amoi / Super Admin operator LiveChat.

UPGRADES INCLUDED
- Both LiveChat pages are local files in the same admin project.
- Old iframe-only redirect guards were removed.
- Both LiveChat pages now point to Firebase project myproduction-v2.
- Theme key is aligned to adminGlobalTheme.
- admin.js keeps livechat.html as the normal LiveChat tab.
- admin.js registers superadmin-livechat as a future superadmin-only page, but no visible normal-admin nav button is added.
- Existing chat UI/features (typing, presence, unread/read logic, image upload/Cloudinary, preview/lightbox) are preserved as much as possible.

IMPORTANT BEFORE PRODUCTION
- This package migrates the CODE connection, not old Firebase DATA. Old blurphp chat/users data is not automatically copied to myproduction-v2.
- The legacy LiveChat database paths (users/, chats/, notifications/, adminPresence/) are intentionally preserved for compatibility in this step.
- Do NOT deploy restrictive RTDB rules yet until /admins, /sites, LiveChat, Notice and other feature paths are finalized.
- Super Admin permission enforcement is NOT activated yet. The route is prepared only, as requested.
- Some legacy parent/postMessage compatibility code remains inside the old LiveChat source. It is harmless for this transition but should be removed during the final feature refactor once all old embedded pages are migrated.

FILES
- firebase.js
- index.html
- admin.js
- admin.css
- new-ui.js
- new-ui.css
- login.html
- livechat.html
- superadmin-livechat.html
