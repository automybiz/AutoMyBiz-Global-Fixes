// AutoMyBiz - Workflow Iframe Grid Remover
(function() {
    function injectIntoWorkflowIframe() {
        // 1. Select the iframe by its name or title
        var iframe = document.querySelector('iframe[name="workflow-builder"]') || 
                     document.querySelector('iframe[title="Workflow Builder"]');
        
        if (!iframe) return;

        try {
            // 2. Attempt to access the internal iframe document
            var frameDoc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
            
            if (frameDoc) {
                // 3. Inject the CSS into the iframe's <head>
                var style = frameDoc.createElement('style');
                style.textContent = `
                    [data-test-id="canvas-background"],
                    .vue-flow__background,
                    pattern[id*="canvas-background"] {
                        display: none !important;
                    }
                `;
                frameDoc.head.appendChild(style);
                console.log("⚡ [Workflow Magic] Successfully injected into workflow-builder iframe!");
            }
        } catch (err) {
            // Log the browser security boundary
            console.warn("🔒 [Workflow Magic] Browser blocked access to cross-origin iframe:", err.message);
        }
    }

    // Run on load and observe when the iframe is mounted
    injectIntoWorkflowIframe();
    var observer = new MutationObserver(injectIntoWorkflowIframe);
    observer.observe(document.documentElement, { childList: true, subtree: true });
})();