// AutoMyBiz - HighLevel Workflow Canvas Grid Remover
(function() {
    var STYLE_ID = 'automybiz-workflow-grid-killer';

    // 1. Inject the exact CSS rule that uBlock Origin uses
    function injectGridKillerCSS() {
        if (document.getElementById(STYLE_ID)) return;
        
        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            [data-test-id="canvas-background"],
            svg.vue-flow__background,
            .vue-flow__background,
            pattern[id*="canvas-background"] {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
            }
        `;

        var target = document.head || document.documentElement;
        if (target) {
            target.appendChild(style);
        }
    }

    // 2. Run immediately on script load
    injectGridKillerCSS();

    // 3. Ensure it runs across Vue SPA route changes (when switching between sub-accounts & workflows)
    window.addEventListener('DOMContentLoaded', injectGridKillerCSS);
    window.addEventListener('load', injectGridKillerCSS);

    // 4. Safety observer in case HighLevel dynamically wipes <head> styles
    var observer = new MutationObserver(function() {
        if (!document.getElementById(STYLE_ID)) {
            injectGridKillerCSS();
        }
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
})();