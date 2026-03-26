/**
 * fix_page_titles.js
 *
 * –1️⃣  Reads the `business_name` query‑string parameter.
 * 2️⃣  Sanitises it (strip HTML tags, decode URL‑encoding, escape HTML).
 * 3️⃣  If we are on a “page‑builder” URL, builds a special title:
 *        BASE_TITLE » <Business Name> » Web Editor
 * 4️⃣  Otherwise falls back to the original title‑building logic that
 *      already runs on every other page.
 *
 * --------------------------------------------------------------
 *  NOTE: The script is loaded on **all** pages, but the special
 *        editor handling only fires when the URL contains
 *        “page-builder”.  All other pages keep their existing title
 *        behaviour unchanged.
 * --------------------------------------------------------------
 */

(() => {
    // -----------------------------------------------------------------
    // 0️⃣  Configuration (you can keep these values or move them elsewhere)
    // -----------------------------------------------------------------
    const BASE_TITLE = window.BASE_TITLE || 'AMB';   // default base title
    const SEPARATOR  = ' » ';
    const SHOW_AGENCY_NAME = true;
    const SHOW_SUB_ACCOUNT = true;
    const SHOW_AGENCY_AS_SUB_ACCOUNT_WHEN_IN_AGENCY_VIEW = true;

    // -----------------------------------------------------------------
    // 1️⃣  Helper – sanitise a string for safe insertion into the title
    // -----------------------------------------------------------------
    function sanitizeForTitle(raw) {
        if (!raw) return '';

        // a) Decode URL‑encoding (e.g. %20 → space, %3C → <)
        let decoded;
        try {
            decoded = decodeURIComponent(raw);
        } catch (e) {
            decoded = raw;   // fallback – should never happen with proper encoding
        }

        // b) Remove any HTML tags (strip <script>, <img>, <a>, etc.)
        const withoutTags = decoded.replace(/<\/?[^>]+(>|$)/g, '');

        // c) Trim whitespace
        const trimmed = withoutTags.trim();

        // d) Escape characters that still have special meaning in HTML
        //    (the browser does this automatically when you set textContent)
        const div = document.createElement('div');
        div.textContent = trimmed;
        return div.innerHTML;   // safe for insertion into document.title
    }

    // -----------------------------------------------------------------
    // 2️⃣  Existing helpers (unchanged – they are used for the normal pages)
    // -----------------------------------------------------------------
    const ORIGINAL_TITLE = document.title.split(SEPARATOR)[0].trim();
    let isUpdatingTitle = false;

    function getBaseTitle() {
        return BASE_TITLE && BASE_TITLE.trim().length > 0 ? BASE_TITLE.trim() : ORIGINAL_TITLE;
    }

    function getSubAccountName() {
        let nameSpan = document.getElementById('tb_location-switcher-v2-company-title');
        let name = null;

        if (nameSpan) {
            name = nameSpan.textContent.trim();
        } else {
            let switcherDiv = document.getElementById('location-switcher-sidbar-v2');
            if (switcherDiv) {
                let fallbackSpan = switcherDiv.querySelector('.truncate, .hl_text-overflow');
                if (fallbackSpan) name = fallbackSpan.textContent.trim();
            }
        }

        if (name) {
            if (name.toLowerCase().includes('click here to switch')) {
                return SHOW_AGENCY_AS_SUB_ACCOUNT_WHEN_IN_AGENCY_VIEW ? 'Agency' : null;
            }
            return name;
        }
        return null;
    }

    function getActiveMenuText() {
        let activeLink = document.querySelector('aside a.exact-active, nav a.exact-active, .sidebar a.exact-active');
        if (activeLink) {
            let titleSpan = activeLink.querySelector('span.nav-title');
            if (titleSpan) return titleSpan.textContent.trim();
            return activeLink.textContent.trim();
        }
        return null;
    }

    // -----------------------------------------------------------------
    // 3️⃣  The **new** title‑building function – now includes the editor case
    // -----------------------------------------------------------------
    function updateTitle() {
        // -------------------------------------------------------------
        // 3A️⃣  EDITOR PAGE (page‑builder) – special handling
        // -------------------------------------------------------------
        if (window.location.href.includes('page-builder')) {
            const params = new URLSearchParams(window.location.search);
            const rawName = params.get('business_name') ?? '';

            // Use the sanitiser we defined above
            const safeName = rawName ? sanitizeForTitle(rawName) : 'Unknown';

            const newTitle = `${BASE_TITLE} » ${safeName} » Web Editor`;

            if (document.title !== newTitle) {
                isUpdatingTitle = true;
                document.title = newTitle;
                setTimeout(() => { isUpdatingTitle = false; }, 50);
            }
            // Skip the normal logic – we are done for the editor page
            return;
        }

        // -------------------------------------------------------------
        // 3B️⃣  ALL OTHER PAGES – keep the original behaviour
        // -------------------------------------------------------------
        const menuText = getActiveMenuText();
        const subAccountText = getSubAccountName();
        const currentBaseTitle = getBaseTitle();

        let parts = [];

        if (SHOW_AGENCY_NAME && currentBaseTitle && currentBaseTitle.length > 0) {
            parts.push(currentBaseTitle);
        }

        if (SHOW_SUB_ACCOUNT && subAccountText && subAccountText.length > 0 && subAccountText !== currentBaseTitle) {
            parts.push(subAccountText);
        }

        if (menuText && menuText.length > 0) {
            parts.push(menuText);
        }

        const newTitle = parts.join(SEPARATOR);

        if (document.title !== newTitle) {
            isUpdatingTitle = true;
            document.title = newTitle;
            setTimeout(() => { isUpdatingTitle = false; }, 50);
        }
    }

    // -----------------------------------------------------------------
    // 4️⃣  Helper that runs the title update a few times (covers async loads)
    // -----------------------------------------------------------------
    function triggerUpdates() {
        setTimeout(updateTitle, 100);
        setTimeout(updateTitle, 500);
        setTimeout(updateTitle, 1000);
        setTimeout(updateTitle, 2500);   // extra time for sub‑account data load
    }

    // -----------------------------------------------------------------
    // 5️⃣  Initialise – run once, then watch for SPA navigation / clicks
    // -----------------------------------------------------------------
    triggerUpdates();

    // Observe changes to the <title> element (GoHighLevel sometimes rewrites it)
    const titleElement = document.querySelector('title');
    if (titleElement) {
        const titleObserver = new MutationObserver(() => {
            if (isUpdatingTitle) return;   // ignore our own changes
            updateTitle();
            setTimeout(updateTitle, 100);
            setTimeout(updateTitle, 500);
        });
        titleObserver.observe(titleElement, { childList: true, characterData: true, subtree: true });
    }

    // Clicks anywhere (sub‑account switching, menu clicks, etc.)
    document.addEventListener('click', triggerUpdates);

    // SPA History API hooks (pushState / replaceState)
    const originalPushState = history.pushState;
    history.pushState = function () {
        originalPushState.apply(this, arguments);
        triggerUpdates();
    };
    const originalReplaceState = history.replaceState;
    history.replaceState = function () {
        originalReplaceState.apply(this, arguments);
        triggerUpdates();
    };
    window.addEventListener('popstate', triggerUpdates);
})();