/**
 * Custom JS to dynamically update the GoHighLevel Page Title
 * Format: "[ BASE TITLE ] » [ SELECTED SUB ACCOUNT ] » [ SELECTED MENU ITEM ]"
 */
(function() {
    // Leave this blank "" to use your existing base title (Agency Name) by default
    const BASE_TITLE = "AMB"; // Override this with a custom base title if desired, otherwise it will use the original page title as the base
    const SEPARATOR = " » ";
    const SHOW_AGENCY_NAME = true; // Set to false to hide the agency base name from the title entirely (only show sub-account and menu item)
    const SHOW_SUB_ACCOUNT = true; // Set to false to hide the sub-account name from the title entirely (only show agency name and menu item)
    const SHOW_AGENCY_AS_SUB_ACCOUNT_WHEN_IN_AGENCY_VIEW = true; // When in Agency view, show the word "Agency" as the "sub-account" to provide context on which account you're in (since the menu item alone can be ambiguous in this view)
    
    // Capture the original title on page load to use as the default base
    // If the title already has separators, we only take the first part
    const ORIGINAL_TITLE = document.title.split(SEPARATOR)[0].trim();
    
    let isUpdatingTitle = false;

    function getBaseTitle() {
        return BASE_TITLE && BASE_TITLE.trim().length > 0 ? BASE_TITLE.trim() : ORIGINAL_TITLE;
    }

    function getSubAccountName() {
        // New: Detect Web Editor (page‑builder) URLs and pull the name from localStorage
        const PAGE_BUILDER_PATH = '/page-builder/';
        if (window.location.pathname.includes(PAGE_BUILDER_PATH)) {
            // Return the stored sub‑account name if we have one
            const storedName = localStorage.getItem('subAccountName');
            return storedName ? storedName : null;
        }

        let nameSpan = document.getElementById('tb_location-switcher-v2-company-title');
        let name = null;
        
        if (nameSpan) {
            name = nameSpan.textContent.trim();
        } else {
            // Fallback if ID is missing but structure remains
            let switcherDiv = document.getElementById('location-switcher-sidbar-v2');
            if (switcherDiv) {
                let fallbackSpan = switcherDiv.querySelector('.truncate, .hl_text-overflow');
                if (fallbackSpan) name = fallbackSpan.textContent.trim();
            }
        }

        if (name) {
            // Check for placeholder text when in Agency view
            if (name.toLowerCase().includes('click here to switch')) {
                const agencyLabel = SHOW_AGENCY_AS_SUB_ACCOUNT_WHEN_IN_AGENCY_VIEW ? "Agency" : null;
                // Store the agency label (or null) for later use
                if (agencyLabel) localStorage.setItem('subAccountName', agencyLabel);
                return agencyLabel;
            }
            // Store the retrieved sub‑account name for later (Web Editor) use
            localStorage.setItem('subAccountName', name);
            return name;
        }
        return null;
    }

    function getActiveMenuText() {
        // Find the active menu link inside the sidebar or navigation area
        let activeLink = document.querySelector('aside a.exact-active, nav a.exact-active, .sidebar a.exact-active');
        
        if (activeLink) {
            // GHL usually wraps the menu text in a span with the class 'nav-title'
            let titleSpan = activeLink.querySelector('span.nav-title');
            if (titleSpan) {
                return titleSpan.textContent.trim();
            }
            
            // Fallback if 'nav-title' span isn't found
            return activeLink.textContent.trim();
        }
        return null;
    }

    function updateTitle() {
        const menuText = getActiveMenuText();
        const subAccountText = getSubAccountName();
        const currentBaseTitle = getBaseTitle();
        
        let parts = [];
        
        if (SHOW_AGENCY_NAME && currentBaseTitle && currentBaseTitle.length > 0) {
            parts.push(currentBaseTitle);
        }
        
        // Append sub-account if enabled, exists, and doesn't match the base title
        if (SHOW_SUB_ACCOUNT && subAccountText && subAccountText.length > 0 && subAccountText !== currentBaseTitle) {
            parts.push(subAccountText);
        }
        
        if (menuText && menuText.length > 0) {
            parts.push(menuText);
        }
        
        let newTitle = parts.join(SEPARATOR);

        // Only update if it's different to prevent browser lag
        if (document.title !== newTitle) {
            isUpdatingTitle = true;
            document.title = newTitle;
            
            // Allow a tiny window for the DOM to process the title change 
            // before we accept external changes again
            setTimeout(function() {
                isUpdatingTitle = false;
            }, 50);
        }
    }

    function triggerUpdates() {
        setTimeout(updateTitle, 100);
        setTimeout(updateTitle, 500);
        setTimeout(updateTitle, 1000);
        setTimeout(updateTitle, 2500); // Extra time for sub-account data load
    }

    // 1. Run initially on page load
    triggerUpdates();

    // 2. Observe changes to the <title> element
    // This catches GoHighLevel's router trying to reset the title during navigation
    const titleElement = document.querySelector('title');
    if (titleElement) {
        const titleObserver = new MutationObserver(function() {
            // Ignore mutations caused by our own script
            if (isUpdatingTitle) return;
            
            updateTitle();
            
            // The DOM active classes sometimes update a few milliseconds after the title changes,
            // so we queue a few follow-up checks.
            setTimeout(updateTitle, 100);
            setTimeout(updateTitle, 500);
        });
        
        // Start observing text changes inside the <title> tag
        titleObserver.observe(titleElement, { childList: true, characterData: true, subtree: true });
    }

    // 3. Listen for ALL clicks on the document to catch sub-account switching
    document.addEventListener('click', triggerUpdates);

    // 4. Hook into SPA History API to catch routing transitions
    const originalPushState = history.pushState;
    history.pushState = function() {
        originalPushState.apply(this, arguments);
        triggerUpdates();
    };
    
    const originalReplaceState = history.replaceState;
    history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        triggerUpdates();
    };
    
    window.addEventListener('popstate', triggerUpdates);

})();