(function() {
    // Configuration for copyable elements
    const LABEL_SELECTOR = '.hr-form-item-label__text';
    const NOTE_TITLE_SELECTOR = '.note-card-content .font-semibold, .note-card-accent .font-semibold, #notes-list-container-contact .font-semibold';
    const ALL_TRIGGERS = `${LABEL_SELECTOR}, ${NOTE_TITLE_SELECTOR}`;

    // 1. Inject custom styles for the label pointer and basic tooltip layout
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
            z-index: 999999;
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
    `;
    document.head.appendChild(style);

    // 2. Create and append the tooltip element
    const tooltip = document.createElement('div');
    tooltip.id = 'custom-copy-tooltip';
    document.body.appendChild(tooltip);

    let isCopied = false;
    let copiedTimeout = null;

    // Helper to extract styling from the page inputs to keep the tooltip style consistent
    function applyTooltipColors() {
        const sampleInput = document.querySelector('input, textarea, .hr-input-container');
        if (sampleInput) {
            const computed = window.getComputedStyle(sampleInput);
            const bgColor = computed.backgroundColor;
            
            tooltip.style.backgroundColor = (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') 
                ? bgColor 
                : '#111827';
                
            tooltip.style.borderColor = computed.borderColor && computed.borderColor !== 'transparent' 
                ? computed.borderColor 
                : 'var(--border-color-2, #14b8a6)';
                
            tooltip.style.borderStyle = 'solid';
            tooltip.style.borderWidth = '1px';
            tooltip.style.color = computed.color || 'var(--text-color-1, #f3f4f6)';
        } else {
            tooltip.style.backgroundColor = '#111827';
            tooltip.style.borderColor = 'var(--border-color-2, #14b8a6)';
            tooltip.style.borderStyle = 'solid';
            tooltip.style.borderWidth = '1px';
            tooltip.style.color = 'var(--text-color-1, #f3f4f6)';
        }
    }

    // Helper to position tooltip slightly offset to the right of the cursor
    function updateTooltipPosition(x, y) {
        tooltip.style.left = `${x + 15}px`;
        tooltip.style.top = `${y - 10}px`;
    }

    function showTooltip(text, x, y) {
        applyTooltipColors();
        tooltip.textContent = text;
        updateTooltipPosition(x, y);
        tooltip.style.opacity = '1';
        tooltip.style.visibility = 'visible';
    }

    function hideTooltip() {
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
    }

    // Fallback copy method if navigator.clipboard is restricted in the context
    function copyText(text) {
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
            return new Promise((resolve, reject) => {
                const successful = document.execCommand('copy');
                textArea.remove();
                successful ? resolve() : reject(new Error('Copy command failed'));
            });
        }
    }

    // Helper to identify if the cursor is hovering over an interactive/button element
    function isOverInteractiveElement(e) {
        return !!e.target.closest('button, svg, path, a, i, [role="button"], .tooltip, [data-tooltip]');
    }

    // 3. Handle Tooltip movement and Hover states
    document.addEventListener('mousemove', (e) => {
        const labelTrigger = e.target.closest(LABEL_SELECTOR);
        const noteTrigger = e.target.closest(NOTE_TITLE_SELECTOR);
        const target = labelTrigger || noteTrigger;
        
        // Only trigger tooltip if we are on a valid trigger AND not on any interactive icons/buttons
        if (target && !isOverInteractiveElement(e)) {
            // Additional check for notes: ensure we're not hovering over the body text itself
            if (noteTrigger) {
                const card = noteTrigger.closest('.note-card-accent, .note-card-content');
                const contentDiv = card ? (card.querySelector('.note-content-text') || card.querySelector('[class*="note-content"]')) : null;
                
                if (contentDiv && contentDiv.contains(e.target)) {
                    if (!isCopied) hideTooltip();
                    return;
                }
            }

            if (!isCopied) {
                const tooltipText = labelTrigger ? "Click To Copy Input Data" : "Click To Copy Note Data";
                showTooltip(tooltipText, e.pageX, e.pageY);
            } else {
                updateTooltipPosition(e.pageX, e.pageY);
            }
        } else {
            if (!isCopied) {
                hideTooltip();
            } else {
                // If recently copied, allow tooltip to follow the mouse briefly outside the element
                updateTooltipPosition(e.pageX, e.pageY);
            }
        }
    });

    // Hide tooltip when leaving the window
    document.addEventListener('mouseleave', () => {
        if (!isCopied) hideTooltip();
    });

    // 4. Handle Click Event
    document.addEventListener('click', (e) => {
        const labelTrigger = e.target.closest(LABEL_SELECTOR);
        const noteTrigger = e.target.closest(NOTE_TITLE_SELECTOR);
        const target = labelTrigger || noteTrigger;

        if (!target || isOverInteractiveElement(e)) return;

        let textToCopy = undefined;
        let originalTooltipText = '';

        if (labelTrigger) {
            originalTooltipText = "Click To Copy Input Data";
            const label = labelTrigger.closest('label');
            if (label) {
                let input = label.nextElementSibling ? label.nextElementSibling.querySelector('input, textarea') : null;
                if (!input && label.parentElement) {
                    input = label.parentElement.querySelector('input, textarea');
                }
                if (input) textToCopy = input.value;
            }
        } else if (noteTrigger) {
            originalTooltipText = "Click To Copy Note Data";
            const card = noteTrigger.closest('.note-card-accent, .note-card-content');
            if (card) {
                const contentDiv = card.querySelector('.note-content-text') || card.querySelector('[class*="note-content"]');
                if (contentDiv) {
                    textToCopy = (contentDiv.innerText || contentDiv.textContent || '').trim();
                }
            }
        }

        if (textToCopy !== undefined) {
            e.preventDefault();
            e.stopPropagation();

            copyText(textToCopy).then(() => {
                isCopied = true;
                showTooltip("Data Copied!", e.pageX, e.pageY);

                clearTimeout(copiedTimeout);
                copiedTimeout = setTimeout(() => {
                    isCopied = false;
                    
                    // Check if the user is still hovering over the trigger when the timeout ends
                    const currentHover = document.elementFromPoint(e.clientX, e.clientY);
                    if (currentHover && currentHover.closest(ALL_TRIGGERS) && !isOverInteractiveElement({ target: currentHover })) {
                        showTooltip(originalTooltipText, e.pageX, e.pageY);
                    } else {
                        hideTooltip();
                    }
                }, 1500);
            }).catch(err => {
                console.warn('Failed to copy text: ', err);
            });
        }
    });
})();