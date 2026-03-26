/**
 * fix_page_titles.js
 *
 * 1️⃣  Reads the business name from a <meta name="ghl-business-name">
 *     element that the Whitelabel page injects.  If that element is missing
 *     it falls back to the legacy query‑string method (for backward compatibility).
 *
 * 2️⃣  Sanitises the name (strip HTML tags, escape special chars) so it
 *     can be safely concatenated into document.title.
 *
 * 3️⃣  On “page‑builder” URLs builds the special title:
 *        BASE_TITLE » <Business Name> » Web Editor
 *
 * 4️⃣  All other pages keep the original title‑building logic.
 */

(() => {
    // -----------------------------------------------------------------
    // 0️⃣  Configuration (change only if you need a different base title)
    // -----------------------------------------------------------------
    const BASE_TITLE = window.BASE_TITLE || 'AMB';   // default base title
    const SEPARATOR  = ' » ';
    const SHOW_AGENCY_NAME = true;
    const SHOW_SUB_ACCOUNT = true;
    const SHOW_AGENCY_AS_SUB_ACCOUNT_WHEN_IN_AGENCY_VIEW = true;

    // -----------------------------------------------------------------
    // 1️⃣  Sanitisation helper – safe for insertion into the title
    // -----------------------------------------------------------------
    function sanitizeForTitle(raw) {
        if (!raw) return '';

        // Decode URL‑encoding – useful when the old query‑string method is used
        let decoded;
        try {
            decoded = decodeURIComponent(raw);
        } catch (e) {
            decoded = raw;   // fallback – should never happen with proper encoding
        }

        // Strip any HTML tags (e.g. <script>, <img>, etc.)
        const withoutTags = decoded.replace(/<\/?[^>]+(>|$)/g, '');

        // Trim whitespace
        const trimmed = withoutTags.trim();

        // Escape characters that still have special meaning in HTML
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
        const nameSpan = document.getElementById('tb_location-switcher-v2-company-title');
        let name = null;

        if (nameSpan) {
            name = nameSpan.textContent.trim();
        } else {
            const switcherDiv = document.getElementById('location-switcher-sidbar-v2');
            if (switcherDiv) {
                const fallbackSpan = switcherDiv.querySelector('.truncate, .hl_text-overflow');
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
        const activeLink = document.querySelector('aside a.exact-active, nav a.exact-active, .sidebar a.exact-active');
        if (activeLink) {
            const titleSpan = activeLink.querySelector('span.nav-title');
            if (titleSpan) return titleSpan.textContent.trim();
            return activeLink.textContent.trim();
        }
        return null;
    }

    // -----------------------------------------------------------------
    // 3️⃣  Title‑building function – now includes the editor‑page exception
    // -----------------------------------------------------------------
    function updateTitle() {
        // -------------------------------------------------------------
        // 3A️⃣  EDITOR PAGE (page‑builder) – special handling
        // -------------------------------------------------------------
        if (window.location.href.includes('page-builder')) {
            // ---- 1️⃣  Try to read the name from the <meta> tag ----
            let rawName = '';
            const metaTag = document.querySelector('meta[name="ghl-business-name"]');
            if (metaTag && metaTag.content) {
                rawName = metaTag.content;
            } else {
                // ---- 2️⃣  Fallback to the old query‑string method (legacy) ----
                const params = new URLSearchParams(window.location.search);
                rawName = params.get('business_name') ?? '';
            }

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

        const parts = [];

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