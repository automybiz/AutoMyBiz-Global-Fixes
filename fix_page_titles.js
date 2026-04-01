// fix_page_titles.js
/**
 * Custom JS to dynamically update the GoHighLevel Page Title
 * Format: "[ BASE TITLE ] » [ SELECTED SUB ACCOUNT ] » [ SELECTED MENU ITEM ]"
 *
 * New feature:
 *   • BASE_TITLE_ENABLED – toggles the inclusion of the base title (and its
 *     preceding separator) in the final title string.
 */

(function () {
    // ------------------------------------------------------------------------
    // Configuration
    // ------------------------------------------------------------------------
    const BASE_TITLE = "AMB";                     // Override with a custom base title if desired
    const BASE_TITLE_ENABLED = true;              // Set to false to hide the base title completely
    const SEPARATOR = " » ";
    const SHOW_AGENCY_NAME = true;                // Hide agency base name if false
    const SHOW_SUB_ACCOUNT = true;                // Hide sub‑account name if false
    const SHOW_AGENCY_AS_SUB_ACCOUNT_WHEN_IN_AGENCY_VIEW = true;

    // ------------------------------------------------------------------------
    // State
    // ------------------------------------------------------------------------
    // Capture the original title on page load (fallback base)
    const ORIGINAL_TITLE = document.title.split(SEPARATOR)[0].trim();
    let isUpdatingTitle = false;                  // Prevent feedback loops
    let animationTimer = null;                    // For optional animated title (if used)

    // ------------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------------
    function getBaseTitle() {
        return BASE_TITLE && BASE_TITLE.trim().length > 0
            ? BASE_TITLE.trim()
            : ORIGINAL_TITLE;
    }

    /**
     * Returns the sub‑account name.
     *   • On normal pages it reads it from the DOM and stores it in localStorage.
     *   • On the Web EditorEditor page (URL contains "/page-builder/") it reads the
     *     stored value from localStorage. If nothing is stored (user opened the
     *     page directly) it falls back to parsing the original document title.
     */
    function getSubAccountName() {
        const PAGE_BUILDER_PATH = "/page-builder/";

        // --------------------------------------------------------------------
        // 1️⃣  Web Editor detection – try stored name first
        // --------------------------------------------------------------------
        if (window.location.pathname.includes(PAGE_BUILDER_PATH)) {
            const stored = localStorage.getItem("subAccountName");
            if (stored) return stored;

            // ----------------------------------------------------------------
            // 1b️⃣  No stored value – attempt to recover it from the original title
            // ----------------------------------------------------------------
            // Expected original format: "BASE » SUB_ACCOUNT » …"
            const parts = document.title.split(SEPARATOR).map(p => p.trim());
            if (parts.length >= 3) {
                const recovered = parts[1];
                if (recovered) {
                    localStorage.setItem("subAccountName", recovered);
                    return recovered;
                }
            }
            return null;
        }

        // --------------------------------------------------------------------
        // 2️⃣  Normal page – read from DOM
        // --------------------------------------------------------------------
        let name = null;

        // Primary element (most common)
        const primary = document.getElementById("tb_location-switcher-v2-company-title");
        if (primary) {
            name = primary.textContent.trim();
        } else {
            // Fallback element (older UI)
            const fallbackDiv = document.getElementById("location-switcher-sidbar-v2");
            if (fallbackDiv) {
                const span = fallbackDiv.querySelector(".truncate, .hl_text-overflow");
                if (span) name = span.textContent.trim();
            }
        }

        if (!name) return null;

        // --------------------------------------------------------------------
        // 3️⃣  Handle Agency‑view placeholder text
        // --------------------------------------------------------------------
        const lower = name.toLowerCase();
        if (lower.includes("click here to switch")) {
            const agencyLabel = SHOW_AGENCY_AS_SUB_ACCOUNT_WHEN_IN_AGENCY_VIEW ? "Agency" : null;
            if (agencyLabel) localStorage.setItem("subAccountName", agencyLabel);
            return agencyLabel;
        }

        // --------------------------------------------------------------------
        // 4️⃣  Store the retrieved name for later (Web Editor) use
        // --------------------------------------------------------------------
        localStorage.setItem("subAccountName", name);
        return name;
    }

    /**
     * Returns the currently active menu item text.
     * For the Web Editor page the normal menu is missing, so we fall back to a
     * hard‑coded label when the URL contains "/page-builder/".
     */
    function getActiveMenuText() {
        // --------------------------------------------------------------------
        // Web Editor fallback
        // --------------------------------------------------------------------
        if (window.location.pathname.includes("/page-builder/")) {
            return "Web Editor";
        }

        // Normal case – look for the active link in the sidebar / navigation
        const activeLink = document.querySelector(
            "aside a.exact-active, nav a.exact-active, .sidebar a.exact-active"
        );
        if (!activeLink) return null;

        const titleSpan = activeLink.querySelector("span.nav-title");
        if (titleSpan) return titleSpan.textContent.trim();

        return activeLink.textContent.trim();
    }

    /**
     * Builds and applies the new title.
     * Respects BASE_TITLE_ENABLED – when false the base title (and its
     * preceding separator) are omitted.
     */
    function updateTitle() {
        const menuText = getActiveMenuText();
        const subAccountText = getSubAccountName();
        const base = getBaseTitle();

        const parts = [];

        // Only include the base title if the flag is true AND the user wants it shown
        if (BASE_TITLE_ENABLED && SHOW_AGENCY_NAME && base) {
            parts.push(base);
        }

        // Append sub‑account if enabled, exists, and doesn't duplicate the base
        if (SHOW_SUB_ACCOUNT && subAccountText && subAccountText.length > 0 && subAccountText !== base) {
            parts.push(subAccountText);
        }

        if (menuText) parts.push(menuText);

        const newTitle = parts.join(SEPARATOR);

        if (document.title !== newTitle) {
            isUpdatingTitle = true;
            document.title = newTitle;
            // Reset flag after a short delay to allow other scripts to react
            setTimeout(() => (isUpdatingTitle = false), 50);
        }
    }

    /**
     * Triggers a series of delayed updates – useful for pages that load data
     * asynchronously (e.g., the Web Editor).
     */
    function triggerUpdates() {
        // Immediate (after a tiny pause)
        setTimeout(updateTitle, 100);
        setTimeout(updateTitle, 500);
        setTimeout(updateTitle, 1000);
        setTimeout(updateTitle, 2500); // Extra time for delayed data loads
    }

    // ------------------------------------------------------------------------
    // Initialisation – wait for the page to be fully loaded
    // ------------------------------------------------------------------------
    // 1️⃣  DOMContentLoaded (HTML parsed)
    document.addEventListener("DOMContentLoaded", triggerUpdates);

    // 2️⃣  Full load (all resources, including delayed API calls)
    window.addEventListener("load", triggerUpdates);

    // 3️⃣  In case the script is injected after those events have already fired
    if (document.readyState === "complete" || document.readyState === "interactive") {
        triggerUpdates();
    }

    // ------------------------------------------------------------------------
    // Observe external title changes (GoHighLevel router may reset it)
    // ------------------------------------------------------------------------
    const titleEl = document.querySelector("title");
    if (titleEl) {
        const observer = new MutationObserver(() => {
            if (isUpdatingTitle) return;
            updateTitle();

            // Queue a couple of follow‑up checks for any async UI tweaks
            setTimeout(updateTitle, 100);
            setTimeout(updateTitle, 500);
        });
        observer.observe(titleEl, { childList: true, characterData: true, subtree: true });
    }

    // ------------------------------------------------------------------------
    // Catch navigation events that change the SPA state
    // ------------------------------------------------------------------------
    // Clicks (e.g., sub‑account switcher)
    document.addEventListener("click", triggerUpdates);

    // History API overrides
    const originalPush = history.pushState;
    history.pushState = function () {
        originalPush.apply(this, arguments);
        triggerUpdates();
    };
    const originalReplace = history.replaceState;
    history.replaceState = function () {
        originalReplace.apply(this, arguments);
        triggerUpdates();
    };
    window.addEventListener("popstate", triggerUpdates);
})();