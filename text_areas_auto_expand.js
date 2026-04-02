(function() {
    // 1. The core resizing function
    function autoResizeTextarea(textarea) {
        // Force overflow hidden so we don't see flash of scrollbars
        textarea.style.overflow = 'hidden';
        
        // Reset height to auto to accurately calculate the new scrollHeight
        textarea.style.height = 'auto';
        
        // Set the height exactly to the scrollable content height
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    // 2. Function to attach the event listener without duplicating it
    function setupTextarea(textarea) {
        // Prevent attaching multiple event listeners to the same element
        if (textarea.dataset.resizerAttached) return;
        textarea.dataset.resizerAttached = 'true';

        // Do an initial resize to fit existing text
        autoResizeTextarea(textarea);

        // Add a slight delay for the initial resize because GHL's Vue framework 
        // sometimes repaints the DOM a fraction of a second after rendering
        setTimeout(() => autoResizeTextarea(textarea), 150);

        // Listen for typing, pasting, or hitting "Enter"
        textarea.addEventListener('input', function() {
            autoResizeTextarea(textarea);
        });
    }

    // 3. The scanner function targeting your specific constraints
    function scanForTextareas() {
        const container = document.querySelector('#contact-details');
        if (!container) return; // Exit if we aren't on the contact details page

        // Find all text areas with the specific class inside the container
        const textareas = container.querySelectorAll('textarea.hl-text-area-input');
        textareas.forEach(setupTextarea);
    }

    // 4. Setup the MutationObserver to handle GHL's dynamic page loads
    const observer = new MutationObserver((mutations) => {
        // Only bother scanning if nodes were actually added
        for (let mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                scanForTextareas();
                break; // Only need to trigger the scan once per DOM batch update
            }
        }
    });

    // Start observing the entire body for changes
    observer.observe(document.body, { childList: true, subtree: true });

    // Run an initial scan just in case the DOM is already fully loaded
    scanForTextareas();
})();