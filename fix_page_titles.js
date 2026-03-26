/* fix_page_titles.js – version that only uses the URL ID */
(() => {
    const BASE_TITLE = window.BASE_TITLE || 'AMB';
    const SEPARATOR  = ' » ';
    const SHOW_AGENCY_NAME = true;
    const SHOW_SUB_ACCOUNT = true;
    const SHOW_AGENCY_AS_SUB_ACCOUNT_WHEN_IN_AGENCY_VIEW = true;

    // -----------------------------------------------------------------
    // Helper: safe HTML‑escape a string
    // -----------------------------------------------------------------
    function sanitizeForTitle(raw) {
        if (!raw) return '';
        const div = document.createElement('div');
        div.textContent = raw;          // forces HTML‑escaping
        return div.innerHTML;
    }

    // -----------------------------------------------------------------
    // Existing helpers (unchanged – they are used for the normal pages)
    // -----------------------------------------------------------------
    const ORIGINAL_TITLE = document.title.split(SEPARATOR)[0].trim();
    let isUpdatingTitle = false;

    function getBaseTitle() {
        return BASE_TITLE && BASE_TITLE.trim().length > 0 ? BASE_TITLE.trim() : ORIGINAL_TITLE;
    }

    function getSubAccountName() {
        const nameSpan = document.getElementById('tb_location-switcher-v2-company-title');
        let name = null;
        if (nameSpan) name = nameSpan.textContent.trim();
        else {
            const switcherDiv = document.getElementById('location-switcher-sidbar-v2');
            if (switcherDiv) {
                const fallback = switcherDiv.querySelector('.truncate, .hl_text-overflow');
                if (fallback) name = fallback.textContent.trim();
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
        const link = document.querySelector('aside a.exact-active, nav a.exact-active, .sidebar a.exact-active');
        if (!link) return null;
        const span = link.querySelector('span.nav-title');
        return span ? span.textContent.trim() : link.textContent.trim();
    }

    // -----------------------------------------------------------------
    // Title‑building function
    // -----------------------------------------------------------------
    function updateTitle() {
        // -------------------------------------------------------------
        // EDITOR PAGE (page‑builder) – special handling
        // -------------------------------------------------------------
        if (window.location.href.includes('page-builder')) {
            // ---- 1️⃣  Extract the location‑ID from the URL ----
            // URL pattern: …/location/<ID>/…
            const parts = window.location.pathname.split('/');
            const locIdx = parts.indexOf('location');
            let rawName = '';
            if (locIdx !== -1 && parts[locIdx + 1]) {
                // Use the ID as a fallback name; you can replace this with a fetch call later
                rawName = parts[locIdx + 1];
            }

            // ---- 2️⃣  OPTIONAL: fetch a friendly name from a tiny endpoint ----
            // Uncomment the block below and replace `https://example.com/api/name?id=` with your own service.
            /*
            fetch(`https://example.com/api/name?id=${encodeURIComponent(rawName)}`)
                .then(r => r.json())
                .then(data => {
                    const friendly = data && data.name ? data.name : rawName;
                    applyTitle(friendly);
                })
                .catch(() => applyTitle(rawName));
            return; // exit; the async fetch will call applyTitle later
            */

            // ---- 3️⃣  If you don’t have an API, just use the ID (or you can hard‑code a map) ----
            applyTitle(rawName);
            return; // stop the normal flow for the editor page
        }

        // -------------------------------------------------------------
        // NON‑EDITOR PAGES – keep the original behaviour
        // -------------------------------------------------------------
        const menuText = getActiveMenuText();
        const subAccountText = getSubAccountName();
        const base = getBaseTitle();

        const parts = [];
        if (SHOW_AGENCY_NAME && base) parts.push(base);
        if (SHOW_SUB_ACCOUNT && subAccountText && subAccountText !== base) parts.push(subAccountText);
        if (menuText) parts.push(menuText);

        const newTitle = parts.join(SEPARATOR);
        if (document.title !== newTitle) {
            isUpdatingTitle = true;
            document.title = newTitle;
            setTimeout(() => { isUpdatingTitle = false; }, 50);
        }
    }

    // Helper that actually writes the title (used for both sync and async paths)
    function applyTitle(name) {
        const safe = name ? sanitizeForTitle(name) : 'Unknown';
        const newTitle = `${BASE_TITLE} » ${safe} » Web Editor`;
        if (document.title !== newTitle) {
            isUpdatingTitle = true;
            document.title = newTitle;
            setTimeout(() => { isUpdatingTitle = false; }, 50);
        }
    }

    // -----------------------------------------------------------------
    // Run the update a few times (covers async loads) and set up observers
    // -----------------------------------------------------------------
    function triggerUpdates() {
        setTimeout(updateTitle, 100);
        setTimeout(updateTitle, 500);
        setTimeout(updateTitle, 1000);
        setTimeout(updateTitle, 2500);
    }

    triggerUpdates();

    const titleEl = document.querySelector('title');
    if (titleEl) {
        const obs = new MutationObserver(() => {
            if (isUpdatingTitle) return;
            updateTitle();
            setTimeout(updateTitle, 100);
            setTimeout(updateTitle, 500);
        });
        obs.observe(titleEl, { childList: true, characterData: true, subtree: true });
    }

    document.addEventListener('click', triggerUpdates);
    const push = history.pushState;
    history.pushState = function () {
        push.apply(this, arguments);
        triggerUpdates();
    };
    const replace = history.replaceState;
    history.replaceState = function () {
        replace.apply(this, arguments);
        triggerUpdates();
    };
    window.addEventListener('popstate', triggerUpdates);
})();