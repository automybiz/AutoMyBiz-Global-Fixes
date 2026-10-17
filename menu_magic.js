/**
 * AutoMyBiz - Restore "Open in New Tab" on Custom Menu Links
 * Replaces href="javascript:void(0)" with the real internal GHL router URL
 */
(function() {
  function fixCustomMenuLinkHrefs() {
    const locMatch = window.location.pathname.match(/\/location\/([a-zA-Z0-9]+)/);
    if (!locMatch) return;
    const locationId = locMatch[1];

    // Find all custom menu link anchors currently using javascript:void(0)
    const customLinks = document.querySelectorAll('nav a[href="javascript:void(0)"]');
    
    customLinks.forEach(link => {
      const menuId = link.getAttribute('meta') || link.id;
      if (menuId && menuId.includes('-')) {
        // Assign the real internal route
        const realUrl = `/v2/location/${locationId}/custom-menu-link/${menuId}`;
        link.setAttribute('href', realUrl);
      }
    });
  }

  // Run on page load and watch for sidebar route changes
  window.addEventListener('DOMContentLoaded', fixCustomMenuLinkHrefs);
  const observer = new MutationObserver(fixCustomMenuLinkHrefs);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();