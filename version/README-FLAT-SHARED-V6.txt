5G88 ADMIN - FLAT SHARED WORKSPACE V6

Architecture requested:
- NO PAGE_REGISTRY
- NO fetch-based page mounting
- NO iframe
- Direct flat pages in /version/*.html
- Shared workspace navigation lives in new-ui.js
- Menu/tab objects use { file: "918kiss.html", name: "918Kiss" }
- index.html redirects to dashboard.html

Important:
- Existing migrated Notice / LiveChat / Detail Login / Tab Settings / User History files are retained.
- Extra game/tool pages that were not available as real source files are placeholders. Replace each placeholder with your real HTML using the same filename.
- Firebase rules are NOT included/deployed.
- Superadmin security/permissions still need proper Firebase enforcement later.
