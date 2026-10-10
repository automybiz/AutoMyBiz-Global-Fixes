// AutoMyBiz - HighLevel Workflow Canvas Grid Remover (Deep Diagnostic Edition)
(function() {
    var VERSION = "1.5.0";
    console.log("%c⚡ [Workflow Magic v" + VERSION + "] Loaded at: " + new Date().toLocaleTimeString(), "color: #0FF; font-weight: bold; font-size: 13px;");

    var TARGET_SELECTORS = 'pattern[id*="canvas-background"], [data-test-id="canvas-background"], svg.vue-flow__background, .vue-flow__background';

    function eradicateGrid(triggerSource) {
        var totalRemoved = 0;

        // 1. Probe the Main Document
        try {
            var mainElements = document.querySelectorAll(TARGET_SELECTORS);
            if (mainElements.length > 0) {
                console.log("%c🎯 [Workflow Magic] (" + triggerSource + ") Found " + mainElements.length + " element(s) in Main Document:", "color: #0F8; font-weight: bold;");
                mainElements.forEach(function(el, i) {
                    console.log("   [" + i + "] Tag: <" + el.tagName.toLowerCase() + "> ID: '" + el.id + "' Class: '" + el.className + "'", el);
                    el.remove();
                    totalRemoved++;
                });
            } else if (triggerSource.indexOf("Polling #1") === 0) {
                console.log("🔍 [Workflow Magic] (" + triggerSource + ") 0 elements found in Main Document so far.");
            }
        } catch (errMain) {
            console.error("❌ [Workflow Magic] Error querying main document:", errMain);
        }

        // 2. Probe any <iframe> elements (GHL Microfrontend Canvas detection)
        try {
            var iframes = document.querySelectorAll('iframe');
            if (iframes.length > 0 && triggerSource.indexOf("Polling #1") === 0) {
                console.log("🔎 [Workflow Magic] Found " + iframes.length + " iframe(s) on the page. Probing inside frames...");
            }

            iframes.forEach(function(iframe, idx) {
                try {
                    var frameDoc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
                    if (frameDoc) {
                        var frameElements = frameDoc.querySelectorAll(TARGET_SELECTORS);
                        if (frameElements.length > 0) {
                            console.log("%c🎯 [Workflow Magic] (" + triggerSource + ") Found " + frameElements.length + " element(s) in Iframe #" + idx + ":", "color: #0F8; font-weight: bold;");
                            frameElements.forEach(function(el, i) {
                                console.log("   Iframe[" + idx + "][" + i + "] Tag: <" + el.tagName.toLowerCase() + ">", el);
                                el.remove();
                                totalRemoved++;
                            });
                        }
                    }
                } catch (errFrame) {
                    // Cross-origin iframes cannot be read directly via contentDocument
                    if (triggerSource.indexOf("Polling #1") === 0) {
                        console.warn("⚠️ [Workflow Magic] Iframe #" + idx + " is Cross-Origin or restricted:", errFrame.message);
                    }
                }
            });
        } catch (errIframes) {
            console.error("❌ [Workflow Magic] Error probing iframes:", errIframes);
        }

        if (totalRemoved > 0) {
            console.log("%c💥 [Workflow Magic] Total elements successfully removed: " + totalRemoved, "color: #0F8; font-weight: bold; font-size: 12px;");
        }
    }

    // A. Run immediately on script load
    eradicateGrid("Initial Run");

    // B. Poll every 250ms for 4 seconds while Vue Flow finishes mounting
    var checkCount = 0;
    var timer = setInterval(function() {
        checkCount++;
        eradicateGrid("Polling #" + checkCount);
        if (checkCount >= 16) {
            clearInterval(timer);
            console.log("⏱️ [Workflow Magic] Polling complete (16 checks executed).");
        }
    }, 250);

    // C. Observer for tab switches (Builder <-> Execution logs) and zoom/pan
    var observer = new MutationObserver(function() {
        eradicateGrid("DOM Mutation");
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });
})();