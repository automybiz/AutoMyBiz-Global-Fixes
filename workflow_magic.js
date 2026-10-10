// AutoMyBiz - HighLevel Workflow Canvas Grid Remover
(function() {
    function deleteGridSvg() {
        var svg = document.querySelector('[data-test-id="canvas-background"]') || 
                  document.querySelector('.vue-flow__background') ||
                  document.querySelector('svg.vue-flow__container');
        if (svg) {
            svg.remove(); // Physically deletes the SVG from the DOM
        }
    }

    // Run immediately
    deleteGridSvg();

    // Catch dynamic canvas mounts when zooming, panning, or navigating tabs
    var observer = new MutationObserver(deleteGridSvg);
    observer.observe(document.documentElement, { childList: true, subtree: true });
})();