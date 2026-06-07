(function() {
    // 1. The core resizing function
    function autoResizeTextarea(textarea) {
        // Force overflow hidden if not in overlay, or handle max-height in overlay
        const isInOverlay = textarea.dataset.isInOverlay === 'true';
        
        textarea.style.overflow = isInOverlay ? 'auto' : 'hidden';
        
        // Reset height to auto to accurately calculate the new scrollHeight
        textarea.style.height = 'auto';
        
        let newHeight = textarea.scrollHeight;
        if (isInOverlay && newHeight > 500) {
            newHeight = 500;
        }
        
        // Set the height exactly to the scrollable content height
        textarea.style.height = newHeight + 'px';
    }

    // 2. Function to attach the event listener without duplicating it
    function setupTextarea(textarea) {
        if (textarea.dataset.resizerAttached) return;
        textarea.dataset.resizerAttached = 'true';

        autoResizeTextarea(textarea);
        setTimeout(() => autoResizeTextarea(textarea), 150);

        textarea.addEventListener('input', function() {
            autoResizeTextarea(textarea);
        });
    }

    // 3. Fullscreen Overlay Logic
    function createOverlay() {
        let overlay = document.getElementById('textarea-fullscreen-overlay');
        if (overlay) return overlay;

        overlay = document.createElement('div');
        overlay.id = 'textarea-fullscreen-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000000;
            display: none;
            justify-content: center;
            align-items: flex-start;
            padding: 60px 20px;
            overflow-y: auto;
            backdrop-filter: blur(4px);
            -webkit-backdrop-filter: blur(4px);
        `;
        
        overlay.onclick = (e) => {
            if (e.target === overlay) closeOverlay();
        };
        
        document.body.appendChild(overlay);
        return overlay;
    }

    function openOverlay() {
        const overlay = createOverlay();
        overlay.innerHTML = '';
        
        const contentBox = document.createElement('div');
        contentBox.style.cssText = `
            width: 100%;
            max-width: 540px;
            display: flex;
            flex-direction: column;
            gap: 25px;
            margin-bottom: 50px;
        `;

        const container = document.querySelector('#contact-details');
        if (!container) return;
        
        const textareas = container.querySelectorAll('textarea.hl-text-area-input');
        
        textareas.forEach(origTextarea => {
            const formItem = origTextarea.closest('.hr-form-item') || origTextarea.parentElement.closest('.flex');
            const origLabel = formItem ? formItem.querySelector('.hr-form-item-label__text, label') : null;
            const labelText = origLabel ? origLabel.innerText.replace('Fullscreen', '').trim() : 'Text Area';
            
            const itemWrapper = document.createElement('div');
            itemWrapper.style.cssText = 'display: flex; flex-direction: column; gap: 8px; width: 100%;';
            
            const label = document.createElement('label');
            label.innerText = labelText;
            
            if (origLabel) {
                const computed = window.getComputedStyle(origLabel);
                label.style.color = computed.color;
                label.style.fontSize = computed.fontSize;
                label.style.fontWeight = computed.fontWeight;
                label.style.fontFamily = computed.fontFamily;
            } else {
                label.style.color = '#FFF';
            }
            
            const clone = document.createElement('textarea');
            clone.value = origTextarea.value;
            clone.className = origTextarea.className;
            clone.dataset.isInOverlay = 'true';
            
            // Forced styles per requirements
            clone.style.width = '500px';
            clone.style.maxWidth = '100%';
            clone.style.alignSelf = 'center';
            
            // Inherit colors and borders
            const comp = window.getComputedStyle(origTextarea);
            clone.style.backgroundColor = comp.backgroundColor;
            clone.style.color = comp.color;
            clone.style.borderColor = comp.borderColor;
            clone.style.borderStyle = comp.borderStyle;
            clone.style.borderWidth = comp.borderWidth;
            clone.style.borderRadius = comp.borderRadius;
            clone.style.padding = comp.padding;
            clone.style.fontSize = comp.fontSize;
            clone.style.fontFamily = comp.fontFamily;
            clone.style.lineHeight = comp.lineHeight;
            
            clone.oninput = () => {
                origTextarea.value = clone.value;
                autoResizeTextarea(clone);
                autoResizeTextarea(origTextarea);
                origTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            };
            
            itemWrapper.appendChild(label);
            itemWrapper.appendChild(clone);
            contentBox.appendChild(itemWrapper);
            
            // Initial resize after it's in DOM
            setTimeout(() => autoResizeTextarea(clone), 10);
        });
        
        overlay.appendChild(contentBox);
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function closeOverlay() {
        const overlay = document.getElementById('textarea-fullscreen-overlay');
        if (overlay) {
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    function injectFullscreenIcon(textarea) {
        if (textarea.dataset.fullscreenAttached) return;

        // More robust label detection for GHL's dynamic structure
        let label = null;
        
        // 1. Try finding via closest .hr-form-item (Standard GHL structure)
        const formItem = textarea.closest('.hr-form-item');
        if (formItem) {
            label = formItem.querySelector('.hr-form-item-label__text, label');
        }
        
        // 2. Fallback: Search siblings and parents for any label-like element
        if (!label) {
            let current = textarea.parentElement;
            let depth = 0;
            while (current && depth < 4) {
                // Check if current has a label
                label = current.querySelector('label, .hr-form-item-label__text, .hr-form-item-label');
                if (label) break;
                
                // Check previous siblings (labels are often before the input container)
                let sibling = current.previousElementSibling;
                while (sibling) {
                    label = sibling.querySelector('.hr-form-item-label__text, label') || 
                            (sibling.matches('label, .hr-form-item-label__text') ? sibling : null);
                    if (label) break;
                    sibling = sibling.previousElementSibling;
                }
                if (label) break;
                
                current = current.parentElement;
                depth++;
                if (current && current.id === 'contact-details') break;
            }
        }

        // If we found a label (or a container for it), append the button
        if (label) {
            // Ensure we target the actual text span if it's a container
            const target = label.querySelector('.hr-form-item-label__text') || label;
            
            if (!target.querySelector('.textarea-fullscreen-btn')) {
                textarea.dataset.fullscreenAttached = 'true';
                
                const btn = document.createElement('span');
                btn.className = 'textarea-fullscreen-btn';
                btn.title = 'Fullscreen All Text Areas';
                btn.style.cssText = `
                    display: inline-flex;
                    align-items: center;
                    margin-left: 8px;
                    cursor: pointer;
                    vertical-align: middle;
                    opacity: 0.7;
                    transition: all 0.2s ease;
                    background: transparent;
                    padding: 2px;
                `;
                
                // SVG Icon
                btn.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display: block;">
                        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                    </svg>
                `;
                
                btn.onmouseover = () => {
                    btn.style.opacity = '1';
                    btn.style.transform = 'scale(1.1)';
                };
                btn.onmouseout = () => {
                    btn.style.opacity = '0.7';
                    btn.style.transform = 'scale(1)';
                };
                
                btn.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    openOverlay();
                };
                
                target.appendChild(btn);
            }
        }
    }

    // 4. The scanner function
    function scanForTextareas() {
        const container = document.querySelector('#contact-details');
        if (!container) return;

        const textareas = container.querySelectorAll('textarea.hl-text-area-input');
        textareas.forEach(textarea => {
            setupTextarea(textarea);
            injectFullscreenIcon(textarea);
        });
    }

    // 5. Setup the MutationObserver
    const observer = new MutationObserver((mutations) => {
        for (let mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                scanForTextareas();
                break;
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
    scanForTextareas();
})();
