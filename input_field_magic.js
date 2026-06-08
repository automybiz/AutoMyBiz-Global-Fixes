(function() {
    // === CONFIGURATION ===
    const LABEL_SELECTOR = '.hr-form-item-label__text';
    const NOTE_TITLE_SELECTOR = '.note-card-content .font-semibold, .note-card-accent .font-semibold, #notes-list-container-contact .font-semibold';
    const ALL_TRIGGERS = `${LABEL_SELECTOR}, ${NOTE_TITLE_SELECTOR}`;
    
    const GHL_BG = '#111827';
    const GHL_BORDER = '#374151';
    const GHL_TEXT = '#f9fafb';
    const GHL_LABEL = '#9ca3af';

    // === STYLES ===
    const style = document.createElement('style');
    style.textContent = `
        ${ALL_TRIGGERS} {
            cursor: pointer !important;
        }
        ${ALL_TRIGGERS}:hover {
            text-decoration: underline;
        }
        #custom-copy-tooltip {
            position: absolute;
            z-index: 9999999;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-family: sans-serif;
            pointer-events: none;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.15s ease-in-out;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
            white-space: nowrap;
        }
        #custom-copy-tooltip .char-count {
            color: var(--tooltip-accent);
            font-weight: bold;
        }
        .textarea-fullscreen-btn {
            display: inline-flex;
            align-items: center;
            margin-left: 10px;
            cursor: pointer;
            opacity: 0.5;
            transition: all 0.2s ease;
            flex-shrink: 0;
            vertical-align: middle;
        }
        .textarea-fullscreen-btn:hover {
            opacity: 1;
            transform: scale(1.1);
        }
        #textarea-fullscreen-overlay {
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
        }
    `;
    document.head.appendChild(style);

    // === TOOLTIP LOGIC ===
    const tooltip = document.createElement('div');
    tooltip.id = 'custom-copy-tooltip';
    document.body.appendChild(tooltip);

    let isCopied = false;
    let copiedTimeout = null;

    function applyTooltipColors() {
        const sampleInput = document.querySelector('input, textarea, .hr-input-container');
        if (sampleInput) {
            const computed = window.getComputedStyle(sampleInput);
            const bgColor = computed.backgroundColor;
            tooltip.style.backgroundColor = (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') ? bgColor : '#011';
            const borderColor = computed.borderColor && computed.borderColor !== 'transparent' ? computed.borderColor : '#0FF';
            tooltip.style.borderColor = borderColor;
            tooltip.style.setProperty('--tooltip-accent', borderColor);
            tooltip.style.borderStyle = 'solid';
            tooltip.style.borderWidth = '1px';
            tooltip.style.color = computed.color || '#FFF';
        } else {
            tooltip.style.backgroundColor = '#011';
            tooltip.style.borderColor = '#0FF';
            tooltip.style.setProperty('--tooltip-accent', '#0FF');
            tooltip.style.color = '#FFF';
        }
    }

    function updateTooltipPosition(x, y) {
        tooltip.style.left = `${x + 15}px`;
        tooltip.style.top = `${y - 10}px`;
    }

    function showTooltip(text, x, y) {
        applyTooltipColors();
        tooltip.innerHTML = text;
        updateTooltipPosition(x, y);
        tooltip.style.opacity = '1';
        tooltip.style.visibility = 'visible';
    }

    function hideTooltip() {
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
    }

    // === COPY LOGIC ===
    async function copyText(text) {
        if (navigator.clipboard && window.isSecureContext) {
            return navigator.clipboard.writeText(text);
        } else {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            textArea.remove();
            if (!successful) throw new Error('Copy failed');
        }
    }

    function isOverInteractiveElement(e) {
        return !!e.target.closest('button, svg, path, a, i, [role="button"], .tooltip, [data-tooltip]');
    }

    // === RESIZE LOGIC ===
    function autoResizeTextarea(textarea) {
        if (!textarea) return;
        const isInOverlay = textarea.dataset.isInOverlay === 'true';
        textarea.style.overflow = isInOverlay ? 'auto' : 'hidden';
        textarea.style.height = 'auto';
        let newHeight = textarea.scrollHeight;
        if (isInOverlay && newHeight > 500) newHeight = 500;
        textarea.style.height = newHeight + 'px';
    }

    function setupTextarea(textarea) {
        if (!textarea || textarea.dataset.resizerAttached) return;
        textarea.dataset.resizerAttached = 'true';
        autoResizeTextarea(textarea);
        setTimeout(() => autoResizeTextarea(textarea), 150);
        textarea.addEventListener('input', () => autoResizeTextarea(textarea));
    }

    // === OVERLAY LOGIC ===
    function createOverlay() {
        let overlay = document.getElementById('textarea-fullscreen-overlay');
        if (overlay) return overlay;
        overlay = document.createElement('div');
        overlay.id = 'textarea-fullscreen-overlay';
        overlay.onclick = (e) => { if (e.target === overlay) closeOverlay(); };
        document.body.appendChild(overlay);
        return overlay;
    }

    function closeOverlay() {
        const overlay = document.getElementById('textarea-fullscreen-overlay');
        if (overlay) {
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        }
    }

    // Handle ESC key to close overlay
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeOverlay();
    });

    function openOverlay(mode = 'fields') {
        const overlay = createOverlay();
        overlay.innerHTML = '';
        
        const contentBox = document.createElement('div');
        contentBox.style.cssText = `
            width: 100%;
            max-width: 600px;
            display: flex;
            flex-direction: column;
            gap: 30px;
            padding: 40px;
            background-color: #0b0f19;
            border: 1px solid ${GHL_BORDER};
            border-radius: 12px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.6);
            margin-bottom: 50px;
        `;

        if (mode === 'fields') {
            const container = document.querySelector('#contact-details') || document.body;
            const targetTextareas = Array.from(container.querySelectorAll('textarea')).filter(t => {
                return !t.closest('#notes-list-container-contact') && !t.closest('.note-card') && !t.closest('.message-composer') && !t.dataset.isInOverlay;
            });

            targetTextareas.forEach(orig => {
                const formItem = orig.closest('.hr-form-item') || orig.parentElement;
                const origLabel = formItem ? formItem.querySelector('.hr-form-item-label__text, label') : null;
                renderOverlayItem(origLabel, orig, contentBox);
            });
        } else {
            // Notes mode
            const noteCards = document.querySelectorAll('.note-card-accent, .note-card-content');
            noteCards.forEach(card => {
                const titleEl = card.querySelector('.font-semibold');
                const contentEl = card.querySelector('.note-content-text') || card.querySelector('[class*="note-content"]');
                if (titleEl && contentEl) {
                    renderOverlayItem(titleEl, contentEl, contentBox, true);
                }
            });
        }

        overlay.appendChild(contentBox);
        overlay.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    function renderOverlayItem(origLabel, origDataEl, container, isNote = false) {
        let labelText = 'Text Area';
        if (origLabel) {
            const clone = origLabel.cloneNode(true);
            clone.querySelectorAll('.textarea-fullscreen-btn, svg, button').forEach(el => el.remove());
            labelText = clone.innerText.trim();
        }

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'display: flex; flex-direction: column; gap: 10px; width: 100%;';
        
        const label = document.createElement('label');
        label.className = LABEL_SELECTOR.replace('.', ''); // Ensure click-to-copy picks it up
        label.innerText = labelText;
        label.style.cssText = `color: ${GHL_LABEL}; font-size: 13px; font-weight: 500; margin-bottom: 4px; display: block;`;

        const textarea = document.createElement('textarea');
        textarea.dataset.isInOverlay = 'true';
        textarea.value = isNote ? (origDataEl.innerText || origDataEl.textContent) : origDataEl.value;
        textarea.style.cssText = `width: 100%; background-color: ${GHL_BG}; color: ${GHL_TEXT}; border: 1px solid ${GHL_BORDER}; border-radius: 8px; padding: 12px; font-size: 14px; line-height: 1.5; outline: none; min-height: 40px; transition: border-color 0.2s;`;
        
        textarea.onfocus = () => { textarea.style.borderColor = '#1fb2a6'; };
        textarea.onblur = () => { textarea.style.borderColor = GHL_BORDER; };
        
        textarea.oninput = () => {
            if (isNote) {
                origDataEl.innerText = textarea.value;
            } else {
                origDataEl.value = textarea.value;
                origDataEl.dispatchEvent(new Event('input', { bubbles: true }));
                autoResizeTextarea(origDataEl);
            }
            autoResizeTextarea(textarea);
        };

        wrapper.appendChild(label);
        wrapper.appendChild(textarea);
        container.appendChild(wrapper);
        setTimeout(() => autoResizeTextarea(textarea), 10);
    }

    function injectFullscreenIcon(trigger, mode) {
        const container = mode === 'fields' ? trigger : trigger.parentElement;
        if (!container || container.querySelector('.textarea-fullscreen-btn')) return;
        
        const btn = document.createElement('span');
        btn.className = 'textarea-fullscreen-btn';
        btn.title = `Fullscreen ${mode === 'fields' ? 'All Fields' : 'All Notes'}`;
        btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`;
        
        btn.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            openOverlay(mode);
        };
        
        container.style.display = mode === 'fields' ? 'inline-flex' : 'flex';
        container.style.alignItems = 'center';
        container.appendChild(btn);
    }

    // === EVENT LISTENERS ===
    document.addEventListener('mousemove', (e) => {
        const trigger = e.target.closest(ALL_TRIGGERS);
        if (trigger && !isOverInteractiveElement(e)) {
            if (isCopied) {
                updateTooltipPosition(e.pageX, e.pageY);
                return;
            }
            const isNote = trigger.closest('.note-card-accent, .note-card-content');
            showTooltip(isNote ? "Click To Copy Note Data" : "Click To Copy Input Data", e.pageX, e.pageY);
        } else if (!isCopied) {
            hideTooltip();
        } else {
            updateTooltipPosition(e.pageX, e.pageY);
        }
    });

    document.addEventListener('mouseleave', () => { if (!isCopied) hideTooltip(); });

    document.addEventListener('click', async (e) => {
        const trigger = e.target.closest(ALL_TRIGGERS);
        if (!trigger || isOverInteractiveElement(e)) return;

        let textToCopy = '';
        const isNote = trigger.closest('.note-card-accent, .note-card-content');
        
        if (!isNote) {
            const label = trigger.closest('label');
            const container = trigger.closest('div'); // In overlay, it's a div
            let input = label ? (label.nextElementSibling?.querySelector('textarea, input') || label.parentElement?.querySelector('textarea, input')) : null;
            if (!input && container) input = container.querySelector('textarea, input');
            if (input) textToCopy = input.value;
        } else {
            const card = isNote;
            const contentDiv = card.querySelector('.note-content-text') || card.querySelector('[class*="note-content"]');
            textToCopy = contentDiv ? (contentDiv.innerText || contentDiv.textContent) : '';
        }

        if (textToCopy) {
            e.preventDefault();
            const charCount = textToCopy.trim().length;
            await copyText(textToCopy.trim());
            isCopied = true;
            showTooltip(`Copied <span class="char-count">${charCount}</span> Chars!`, e.pageX, e.pageY);
            clearTimeout(copiedTimeout);
            copiedTimeout = setTimeout(() => {
                isCopied = false;
                const hover = document.elementFromPoint(e.clientX, e.clientY);
                if (hover?.closest(ALL_TRIGGERS)) {
                    showTooltip(isNote ? "Click To Copy Note Data" : "Click To Copy Input Data", e.pageX, e.pageY);
                } else {
                    hideTooltip();
                }
            }, 1500);
        }
    });

    let scanTimeout;
    function scan() {
        const container = document.querySelector('#contact-details') || document.body;
        // Fields
        container.querySelectorAll('textarea').forEach(t => {
            if (t.dataset.isInOverlay) return;
            setupTextarea(t);
            const label = t.closest('.hr-form-item')?.querySelector(LABEL_SELECTOR);
            if (label) injectFullscreenIcon(label, 'fields');
        });
        // Notes
        document.querySelectorAll(NOTE_TITLE_SELECTOR).forEach(title => {
            injectFullscreenIcon(title, 'notes');
        });
    }

    function debouncedScan() {
        clearTimeout(scanTimeout);
        scanTimeout = setTimeout(scan, 200);
    }

    const observer = new MutationObserver((mutations) => {
        // Optimization: only scan if nodes were added
        const nodesAdded = mutations.some(m => m.addedNodes.length > 0);
        if (nodesAdded) debouncedScan();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    scan();
    setTimeout(scan, 1000);
    setTimeout(scan, 3000);
})();
