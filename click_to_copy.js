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
        #custom-copy-tooltip .char-count {
            color: var(--tooltip-accent);
            font-weight: normal;
        }
    `;
    document.head.appendChild(style);

    // 2. Create and append the tooltip element
    const tooltip = document.createElement('div');
    tooltip.id = 'custom-copy-tooltip';
    document.body.appendChild(tooltip);

    let isCopied = false;
    let copiedTimeout = null;

    function debugLog(message, data) {
        console.log(`%c[ClickToCopy Debug] ${message}`, 'color: #14b8a6; font-weight: bold;', data);
    }

    // Helper to extract styling from the page inputs to keep the tooltip style consistent
    function applyTooltipColors() {
        const sampleInput = document.querySelector('input, textarea, .hr-input-container');
        if (sampleInput) {
            const computed = window.getComputedStyle(sampleInput);
            const bgColor = computed.backgroundColor;
            
            tooltip.style.backgroundColor = (bgColor && bgColor !== 'transparent' && bgColor !== 'rgba(0, 0, 0, 0)') 
                ? bgColor 
                : '#011';
                
            const borderColor = computed.borderColor && computed.borderColor !== 'transparent' 
                ? computed.borderColor 
                : '#0FF';
                
            tooltip.style.borderColor = borderColor;
            tooltip.style.setProperty('--tooltip-accent', borderColor);
                
            tooltip.style.borderStyle = 'solid';
            tooltip.style.borderWidth = '1px';
            tooltip.style.color = computed.color || '#FFF';
        } else {
            tooltip.style.backgroundColor = '#011';
            tooltip.style.borderColor = '#0FF';
            tooltip.style.setProperty('--tooltip-accent', '#0FF');
            tooltip.style.borderStyle = 'solid';
            tooltip.style.borderWidth = '1px';
            tooltip.style.color = '#FFF';
        }
    }

    // Helper to position tooltip slightly offset to the right of the cursor
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
            debugLog("Note Trigger Clicked", { 
                element: noteTrigger, 
                classes: noteTrigger.className, 
                text: noteTrigger.innerText 
            });

            const card = noteTrigger.closest('.note-card-accent, .note-card-content');
            if (card) {
                debugLog("Note Card Found", { 
                    element: card, 
                    id: card.id, 
                    classes: card.className 
                });

                // Strategy 1: Look for specific content div classes
                let contentDiv = card.querySelector('.note-content-text') || card.querySelector('[class*="note-content"]');
                if (contentDiv) {
                    debugLog("Content Div Found via Selector", { 
                        element: contentDiv, 
                        classes: contentDiv.className 
                    });
                    textToCopy = (contentDiv.innerText || contentDiv.textContent || '');
                }

                // Strategy 2: If Strategy 1 yielded nothing or we want to be sure, check for P tags
                if (!textToCopy || textToCopy.trim().length === 0) {
                    const pTags = Array.from(card.querySelectorAll('p:not(.font-semibold)'));
                    if (pTags.length > 0) {
                        debugLog("Falling back to P tags inside card", pTags);
                        textToCopy = pTags.map(p => p.innerText || p.textContent).join('\n');
                    }
                }

                // Strategy 3: Look for siblings of the title's container
                if (!textToCopy || textToCopy.trim().length === 0) {
                    const titleContainer = noteTrigger.closest('.relative');
                    if (titleContainer && titleContainer.nextElementSibling) {
                        debugLog("Falling back to sibling of title container", titleContainer.nextElementSibling);
                        textToCopy = titleContainer.nextElementSibling.innerText || titleContainer.nextElementSibling.textContent;
                    }
                }

                if (textToCopy) {
                    textToCopy = textToCopy.trim();
                    debugLog("Final extracted text", `"${textToCopy}"`);
                } else {
                    debugLog("FAILED to extract any text from note card", { card });
                }
            } else {
                debugLog("FAILED to find note card from trigger", { noteTrigger });
            }
        }

        if (textToCopy !== undefined) {
            e.preventDefault();
            e.stopPropagation();

            const charCount = textToCopy.length;
            copyText(textToCopy).then(() => {
                isCopied = true;
                showTooltip(`Copied <span class="char-count">${charCount}</span> Chars!`, e.pageX, e.pageY);

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