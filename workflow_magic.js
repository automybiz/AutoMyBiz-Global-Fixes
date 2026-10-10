// Hide HighLevel Advanced Workflow Builder grid lines
(function() {
    // 1. Inject CSS for immediate coverage
    var style = document.createElement('style');
    style.textContent = `
        svg[data-test-id="canvas-background"],
        .vue-flow__background {
            display: none !important;
        }
    `;
    document.head.appendChild(style);

    // 2. Direct Element Hiding (Does exactly what you did manually in DevTools)
    function killGrid() {
        var el = document.querySelector('svg[data-test-id="canvas-background"]') || 
                 document.querySelector('svg.vue-flow__background') ||
                 document.querySelector('.vue-flow__background');
        if (el) {
            el.style.setProperty('display', 'none', 'important');
        }
    }

    // Run immediately and observe when canvas loads/re-renders
    killGrid();
    var observer = new MutationObserver(killGrid);
    observer.observe(document.documentElement, { childList: true, subtree: true });
})();