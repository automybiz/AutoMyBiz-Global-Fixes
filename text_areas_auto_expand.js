(function() {
    // 1. The core resizing function
    function autoResizeTextarea(textarea) {
        if (!textarea) return;
        const isInOverlay = textarea.dataset.isInOverlay === 'true';
        textarea.style.overflow = isInOverlay ? 'auto' : 'hidden';
        textarea.style.height = 'auto';
        let newHeight = textarea.scrollHeight;
        if (isInOverlay && newHeight > 500) {
            newHeight = 500;
        }
        textarea.style.height = newHeight + 'px';
    }

    // 2. Function to attach the event listener without duplicating it
    function setupTextarea(textarea) {
        if (!textarea || textarea.dataset.resizerAttached) return;
        textarea.dataset.resizerAttached = 'true';
        autoResizeTextarea(textarea);
        setTimeout(() => autoResizeTextarea(textarea), 150);
        textarea.addEventListener('input', () => autoResizeTextarea(textarea));
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

        // Find the contact details container
        const container = document.querySelector('#contact-details') || document.body;
        // Find all textareas that are not in the notes section (right side)
        const allTextareas = container.querySelectorAll('textarea');
        const targetTextareas = Array.from(allTextareas).filter(t => {
            // Exclude textareas in notes list or message composers
            return !t.closest('#notes-list-container-contact') && 
                   !t.closest('.note-card') && 
                   !t.closest('.message-composer');
        });

        targetTextareas.forEach(origTextarea => {
            // Find label
            const formItem = origTextarea.closest('.hr-form-item') || origTextarea.parentElement;
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
            } else {
                label.style.color = '#FFF';
            }

            const clone = document.createElement('textarea');
            clone.value = origTextarea.value;
            clone.className = origTextarea.className;
            clone.dataset.isInOverlay = 'true';
            clone.style.width = '500px';
            clone.style.maxWidth = '100%';
            clone.style.alignSelf = 'center';

            const comp = window.getComputedStyle(origTextarea);
            clone.style.backgroundColor = comp.backgroundColor;
            clone.style.color = comp.color;
            clone.style.borderColor = comp.borderColor;
            clone.style.borderStyle = comp.borderStyle;
            clone.style.borderWidth = comp.borderWidth;
            clone.style.borderRadius = comp.borderRadius;
            clone.style.padding = comp.padding;
            clone.style.fontSize = comp.fontSize;

            clone.oninput = () => {
                origTextarea.value = clone.value;
                autoResizeTextarea(clone);
                autoResizeTextarea(origTextarea);
                origTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            };

            itemWrapper.appendChild(label);
            itemWrapper.appendChild(clone);
            contentBox.appendChild(itemWrapper);
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
        if (!textarea || textarea.dataset.fullscreenAttached) return;

        // Try to find the label span directly using GHL's common structure
        const formItem = textarea.closest('.hr-form-item') || textarea.parentElement.closest('.flex');
        let labelContainer = null;
        if (formItem) {
            labelContainer = formItem.querySelector('.hr-form-item-label__text');
        }

        // Fallback: search parents for any label or label-text class
        if (!labelContainer) {
            let p = textarea.parentElement;
            for (let i = 0; i < 4 && p; i++) {
                labelContainer = p.querySelector('.hr-form-item-label__text, label');
                if (labelContainer) break;
                p = p.parentElement;
            }
        }

        if (labelContainer && !labelContainer.querySelector('.textarea-fullscreen-btn')) {
            textarea.dataset.fullscreenAttached = 'true';
            
            // Ensure container allows horizontal layout
            labelContainer.style.display = 'inline-flex';
            labelContainer.style.alignItems = 'center';
            labelContainer.style.width = '100%';
            labelContainer.style.justifyContent = 'flex-start';

            const btn = document.createElement('span');
            btn.className = 'textarea-fullscreen-btn';
            btn.title = 'Fullscreen All Text Areas';
            btn.style.cssText = `
                display: inline-flex;
                align-items: center;
                margin-left: 10px;
                cursor: pointer;
                opacity: 0.8;
                transition: all 0.2s ease;
                flex-shrink: 0;
            `;
            btn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
            `;
            btn.onmouseover = () => { btn.style.opacity = '1'; btn.style.transform = 'scale(1.1)'; };
            btn.onmouseout = () => { btn.style.opacity = '0.8'; btn.style.transform = 'scale(1)'; };
            btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); openOverlay(); };
            labelContainer.appendChild(btn);
        }
    }

    function scan() {
        const container = document.querySelector('#contact-details') || document.body;
        const textareas = container.querySelectorAll('textarea');
        textareas.forEach(t => {
            // Process textareas that are likely data fields (exclude notes/chat)
            if (!t.closest('#notes-list-container-contact') && !t.closest('.note-card')) {
                setupTextarea(t);
                injectFullscreenIcon(t);
            }
        });
    }

    // Setup Observer
    const observer = new MutationObserver((mutations) => {
        let shouldScan = false;
        for (let m of mutations) {
            if (m.addedNodes.length > 0) {
                shouldScan = true;
                break;
            }
        }
        if (shouldScan) scan();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    
    // Initial and delayed scans to catch GHL's late rendering
    scan();
    setTimeout(scan, 1000);
    setTimeout(scan, 3000);
})();
