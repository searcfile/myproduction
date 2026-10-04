NEW ADMIN UPGRADE PACKAGE
=========================

Files:
1. firebase.js          - ONLY Firebase initialization for myproduction-v2
2. admin.js             - clean admin shell, tabs, sidebar, site selector, auth, presence, theme, refresh
3. database.rules.json  - starter RTDB rules

IMPORTANT FIREBASE SETUP
------------------------
The config pasted by you did not include databaseURL, but the Firebase screenshot shows:
https://myproduction-v2-default-rtdb.asia-southeast1.firebasedatabase.app
This URL is included in firebase.js.

Before database.rules.json works, create an authenticated admin profile such as:

admins/
  FIREBASE_AUTH_UID/
    active: true
    name: "Admin"
    sites:
      5g88: true
      spm888: true
    tabs:
      dashboard: true
      918kiss: true
      mega888: true
      pussy888: true
      livechat: true
      notice: true

And site metadata such as:

sites/
  5g88/
    name: "5G88"
    active: true
  spm888/
    name: "SPM888"
    active: true

WHAT WAS REMOVED FROM OLD admin.js
----------------------------------
- notice-83ae5 Firebase project
- blurphp Firebase project
- logins-d615f Firebase project
- Firebase compat syntax
- anonymous auth workaround
- old external 5g88-main.vercel.app routing
- iframe/pageFrame loader
- iframe postMessage login/theme code
- old query-string user handoff
- duplicate floating FAB / old notification wiring
- old custom-tab visibility system
- old multi-Firebase tab sync/history

WHAT IS KEPT / REBUILT
----------------------
- Firebase Auth guard
- 24-hour session expiry
- username/email display
- light/dark theme
- sidebar + search
- Select Site
- open/close/activate tabs
- restore tabs per Firebase Auth UID
- refresh active tab
- responsive shell hooks
- change password
- online presence
- optional per-admin site/tab permissions

NO IFRAME
---------
admin.js fetches local feature HTML into #adminTabContent.
Existing old pages can be migrated one by one. Best final format for each feature is an HTML fragment plus optional JS module, rather than a second full admin shell.

RULES NOTE
----------
The supplied database.rules.json is intentionally restrictive. It only grants siteData access when the logged-in UID has active=true and that site=true under /admins/{uid}/sites.
Superadmin write rules are NOT added yet because you asked to postpone superadmin/backend. Admin profile/site creation should later be done from a trusted backend/Admin SDK, not by ordinary client-side code.
