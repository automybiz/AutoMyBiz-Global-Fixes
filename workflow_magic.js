// Hide HighLevel Advanced Workflow Builder grid lines
(function() {
    // 1. Bulletproof CSS Injection (Targets data-test-id, direct parent SVG, and wildcards)
    var style = document.createElement('style');
    style.textContent = `
        [data-test-id="canvas-background"],
        div.vue-flow > svg,
        svg[class*="background"],
        [class*="vue-flow__background"],
        [class*="vue-flow_background"],
        .vue-flow__background,
        .react-flow__background {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            width: 0 !important;
            height: 0 !important;
            pointer-events: none !important;
        }
    `;
    document.head.appendChild(style);

    // 2. Direct Element Hiding (Does exactly what you did manually in DevTools)
    function killGrid() {
        var bg = document.querySelector('[data-test-id="canvas-background"]') || 
                 document.querySelector('.vue-flow__background') ||
                 document.querySelector('div.vue-flow > svg');
        if (bg && bg.style.display !== 'none') {
            bg.style.display = 'none';
        }
    }

    // Run on load and watch for workflow canvas view navigation
    killGrid();
    var observer = new MutationObserver(killGrid);
    observer.observe(document.documentElement, { childList: true, subtree: true });
})();