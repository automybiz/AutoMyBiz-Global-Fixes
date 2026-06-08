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
            background: rgba(0, 0, 0, 0.7);
            z-index: 1000000;
            display: none;
            justify-content: center;
            align-items: flex-start;
            padding: 60px 20px;
            overflow-y: auto;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
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
        
        // GHL Dark Theme Constants
        const OVERLAY_INPUT_BG = '#022';
        const OVERLAY_INPUT_BORDER = '#0FF';
        const OVERLAY_INPUT_TEXT = '#FFF';
        const OVERLAY_INPUT_LABEL = '#FFF';

        const contentBox = document.createElement('div');
        contentBox.style.cssText = `
            width: 100%;
            max-width: 900px;
            display: flex;
            flex-direction: column;
            gap: 30px;
            padding: 40px;
            background-color: #0b0f19;
            border: 1px solid ${OVERLAY_INPUT_BORDER};
            border-radius: 12px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.6);
            margin-bottom: 50px;
        `;

        const container = document.querySelector('#contact-details') || document.body;
        const allTextareas = container.querySelectorAll('textarea');
        const targetTextareas = Array.from(allTextareas).filter(t => {
            return !t.closest('#notes-list-container-contact') && 
                   !t.closest('.note-card') && 
                   !t.closest('.message-composer') &&
                   t.id !== 'textarea-fullscreen-overlay';
        });

        targetTextareas.forEach(origTextarea => {
            const formItem = origTextarea.closest('.hr-form-item') || origTextarea.parentElement;
            const origLabel = formItem ? formItem.querySelector('.hr-form-item-label__text, label') : null;
            
            // Clean label text: Extract only the text node to avoid icons
            let labelText = 'Text Area';
            if (origLabel) {
                // Clone to safely manipulate
                const cloneLabel = origLabel.cloneNode(true);
                // Remove the button specifically
                const btn = cloneLabel.querySelector('.textarea-fullscreen-btn');
                if (btn) btn.remove();
                // Also remove any SVGs just in case
                cloneLabel.querySelectorAll('svg').forEach(s => s.remove());
                labelText = cloneLabel.innerText.trim();
            }

            const itemWrapper = document.createElement('div');
            itemWrapper.style.cssText = 'display: flex; flex-direction: column; gap: 10px; width: 100%;';
            
            const label = document.createElement('label');
            label.innerText = labelText;
            label.style.cssText = `
                color: ${OVERLAY_INPUT_LABEL};
                font-size: 13px;
                font-weight: 500;
                margin-bottom: 4px;
                display: block;
            `;

            const clone = document.createElement('textarea');
            clone.value = origTextarea.value;
            clone.dataset.isInOverlay = 'true';
            
            const origStyle = window.getComputedStyle(origTextarea);
            clone.style.cssText = `
                width: 100%;
                background-color: ${OVERLAY_INPUT_BG};
                color: ${OVERLAY_INPUT_TEXT};
                border: 1px solid ${OVERLAY_INPUT_BORDER};
                border-radius: 8px;
                padding: 12px;
                font-size: 14px;
                line-height: 1.5;
                outline: none;
                min-height: 40px;
                transition: border-color 0.2s;
            `;

            clone.onfocus = () => { clone.style.borderColor = '#1fb2a6'; };
            clone.onblur = () => { clone.style.borderColor = OVERLAY_INPUT_BORDER; };

            clone.oninput = () => {
                origTextarea.value = clone.value;
                autoResizeTextarea(clone);
                autoResizeTextarea(origTextarea);
                origTextarea.dispatchEvent(new Event('input', { bubbles: true }));
            };

            itemWrapper.appendChild(label);
            itemWrapper.appendChild(clone);
            contentBox.appendChild(itemWrapper);
            // Initial resize
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
        if (textarea.dataset.isInOverlay === 'true') return;

        const formItem = textarea.closest('.hr-form-item') || textarea.parentElement.closest('.flex');
        let labelContainer = null;
        if (formItem) {
            labelContainer = formItem.querySelector('.hr-form-item-label__text');
        }

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
                opacity: 0.5;
                transition: all 0.2s ease;
                flex-shrink: 0;
            `;
            btn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
                </svg>
            `;
            btn.onmouseover = () => { btn.style.opacity = '1'; btn.style.transform = 'scale(1.1)'; };
            btn.onmouseout = () => { btn.style.opacity = '0.5'; btn.style.transform = 'scale(1)'; };
            btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); openOverlay(); };
            labelContainer.appendChild(btn);
        }
    }

    function scan() {
        const container = document.querySelector('#contact-details') || document.body;
        const textareas = container.querySelectorAll('textarea');
        textareas.forEach(t => {
            if (!t.closest('#notes-list-container-contact') && !t.closest('.note-card') && t.dataset.isInOverlay !== 'true') {
                setupTextarea(t);
                injectFullscreenIcon(t);
            }
        });
    }

    const observer = new MutationObserver((mutations) => {
        let shouldScan = false;
        mutations.forEach(m => {
            if (m.addedNodes.length > 0) shouldScan = true;
        });
        if (shouldScan) scan();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    
    scan();
    setTimeout(scan, 1000);
    setTimeout(scan, 3000);
})();
