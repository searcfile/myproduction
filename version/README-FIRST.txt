5G88 ADMIN MASTER V3
====================

This is the COMPLETE recovery/migration folder for version/.

UPLOAD ALL FILES IN THIS FOLDER INTO YOUR GitHub version/ FOLDER.

FILES INCLUDED
--------------
Core:
- index.html
- login.html
- firebase.js
- admin.js
- admin.css
- new-ui.js
- new-ui.css

Current features:
- dashboard.html
- notice.html                 (latest upgraded Notice using shared firebase.js)
- livechat.html               (Site Admin LiveChat)
- superadmin-livechat.html    (Amoi / Super Admin LiveChat)
- detail-login.html
- tab-settings.html
- user-history.html
- 918kiss.html
- mega888.html
- pussy888.html

Reference only:
- legacy-control-main.html

IMPORTANT
---------
1. Do NOT upload database.rules.json yet.
2. Super Admin permission/security is NOT finished yet. Hidden buttons are not security.
3. Notice is already migrated to the shared myproduction-v2 Firebase client.
4. LiveChat V2 is prepared for myproduction-v2, but old chat data from blurphp is NOT automatically copied.
5. detail-login.html, tab-settings.html and user-history.html are recovered legacy feature pages and still need their old Firebase/data-path code migrated before production.
6. dashboard.html, 918kiss.html, mega888.html and pussy888.html are recovery placeholders from the previous combined package. If you have your real feature pages elsewhere, replace these placeholders with the real pages.
7. Keep firebase.js in the same version/ folder because upgraded pages import ./firebase.js.
8. After upload, test login -> Select Site -> Notice -> Site Admin LiveChat before changing Firebase Rules.

NEXT MIGRATION ORDER
--------------------
1. Test Notice + Site Admin LiveChat.
2. Migrate Detail Login.
3. Migrate User History.
4. Migrate Tab Settings.
5. Finish Super Admin role/tab permissions.
6. Build final RTDB rules.
