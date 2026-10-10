// AutoMyBiz - HighLevel Workflow Canvas Grid Remover
(function() {
    console.log("⚡ AutoMyBiz Workflow Magic Grid Remover Active!");

    function eradicateGrid() {
        // Target the pattern (from your Screenshot 3) and the background SVG (from Screenshot 1)
        var elements = document.querySelectorAll('pattern[id*="canvas-background"], [data-test-id="canvas-background"], svg.vue-flow__background');
        console.log(elements);
        if (elements.length > 0) {
            elements.forEach(function(el) {
                console.log(el);
                el.remove();
            });
        }
    }

    // 1. Run immediately on load
    eradicateGrid();

    // 2. Poll every 250ms for the first 4 seconds while Vue Flow mounts the canvas
    var checkCount = 0;
    var timer = setInterval(function() {
        eradicateGrid();
        checkCount++;
        if (checkCount > 16) clearInterval(timer);
    }, 250);

    // 3. Keep watching for tab navigation (Builder <-> Execution logs) and zoom/pan
    var observer = new MutationObserver(eradicateGrid);
    observer.observe(document.documentElement, { childList: true, subtree: true });
})();