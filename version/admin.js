// V6 flat-page architecture.
// PAGE_REGISTRY and fetch-based page loader were intentionally removed.
// Shared navigation/workspace is handled by new-ui.js using { file, name }.
window.AdminState = window.AdminState || { siteId: localStorage.getItem("admin.selectedSite") || "" };
window.addEventListener("storage", (e) => {
  if (e.key === "admin.selectedSite") {
    window.AdminState.siteId = e.newValue || "";
    window.dispatchEvent(new CustomEvent("sitechange", {detail:{siteId:window.AdminState.siteId}}));
  }
});
