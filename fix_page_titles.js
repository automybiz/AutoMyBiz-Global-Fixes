/* fix_page_titles.js
 *
 * This script reads the `business_name` query‑string parameter that you
 * inject from the GoHighLevel Agency Whitelabel page, sanitises it,
 * and then builds a title of the form:
 *
 *     BASE_TITLE » <Business Name> » Web Editor
 *
 * It only runs on pages whose URL contains “page-builder”, so it won’t
 * affect any other part of the site.
 */

(() => {
    // -----------------------------------------------------------------
    // 1️⃣  Bail out early if we are not on the editor page.
    // -----------------------------------------------------------------
    if (!window.location.href.includes('page-builder')) {
        return;   // nothing to do on non‑editor pages
    }

    // -----------------------------------------------------------------
    // 2️⃣  Grab the base title (you can set this elsewhere if you prefer)
    // -----------------------------------------------------------------
    // If the page already defines a global `BASE_TITLE`, use it;
    // otherwise default to 'AMB'.
    const BASE_TITLE = window.BASE_TITLE || 'AMB';

    // -----------------------------------------------------------------
    // 3️⃣  Parse the query‑string and fetch the business name.
    // -----------------------------------------------------------------
    const params = new URLSearchParams(window.location.search);
    const rawName = params.get('business_name')?.trim() ?? '';

    // -----------------------------------------------------------------
    // 4️⃣  Simple sanitisation – escape any HTML characters.
    // -----------------------------------------------------------------
    function htmlEscape(str) {
        const div = document.createElement('div');
        div.textContent = str;   // forces HTML‑escaping
        return div.innerHTML;
    }
    const safeName = rawName ? htmlEscape(rawName) : 'Unknown';

    // -----------------------------------------------------------------
    // 5️⃣  Build and apply the new title.
    // -----------------------------------------------------------------
    const newTitle = `${BASE_TITLE} » ${safeName} » Web Editor`;
            document.title = newTitle;
            
    // -----------------------------------------------------------------
    // 6️⃣  (Optional) expose the name globally for other scripts.
    // -----------------------------------------------------------------
    window.AutoMyBiz = window.AutoMyBiz || {};
    window.AutoMyBiz.businessName = safeName;
})();