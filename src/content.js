/**
 * Content script entry point.
 * Detects <input type="month"> and <input type="week"> elements,
 * attaches calendar icons, and mounts picker UIs inside Shadow DOM.
 */
import { mount, unmount } from 'svelte';
import { pickerRegistry } from './lib/registry.js';
import { updateDisplayOverlay } from './lib/utils.js';
import PickerHost from './lib/PickerHost.svelte';
import pickerStyles from './picker.css?inline';

const HANDLED_ATTR = 'data-nsi-handled';
const ICON_CLASS = 'nsi-icon-trigger';

// Track the active picker instance
let activePicker = null;
let activeHost = null;

/** Calendar SVG icon injected beside each target input */
const CALENDAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`;

/**
 * Checks if the browser provides a native picker for this input type.
 * We test by creating a temporary input and checking if its type is preserved.
 */
function hasNativePicker(type) {
    const test = document.createElement('input');
    test.setAttribute('type', type);
    // If browser doesn't support the type, it falls back to "text"
    return test.type === type && type !== test.type;
}

/** Attach icon and event handlers to a target input. */
function handleInput(input) {
    if (input.hasAttribute(HANDLED_ATTR)) return;
    const type = input.getAttribute('type');
    if (!type || !(type in pickerRegistry)) return;

    // Mark as handled
    input.setAttribute(HANDLED_ATTR, '');

    // Wrap in a container for icon positioning
    const wrapper = document.createElement('span');
    wrapper.style.cssText = 'position: relative; display: inline-flex; align-items: center;';
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    // Sync wrapper visibility with input (respects d-none, display:none, etc.)
    const syncVisibility = () => {
        const hidden = getComputedStyle(input).display === 'none';
        wrapper.style.display = hidden ? 'none' : 'inline-flex';
    };
    syncVisibility();

    // Watch for class/style changes on the input to keep wrapper in sync
    new MutationObserver(syncVisibility).observe(input, {
        attributes: true,
        attributeFilter: ['class', 'style'],
    });

    // Make original input text invisible (overlay shows formatted text)
    input.style.color = 'transparent';
    input.style.caretColor = 'transparent';

    // Inject ::selection rule once to hide selection highlight on handled inputs
    if (!document.getElementById('nsi-selection-style')) {
        const style = document.createElement('style');
        style.id = 'nsi-selection-style';
        style.textContent = `input[${HANDLED_ATTR}]::selection { background: transparent; color: transparent; }`;
        document.head.appendChild(style);
    }

    // Add calendar icon trigger
    const iconBtn = document.createElement('button');
    iconBtn.className = ICON_CLASS;
    iconBtn.setAttribute('type', 'button');
    iconBtn.setAttribute('aria-label', `Open ${type} picker`);
    iconBtn.setAttribute('tabindex', '-1');
    iconBtn.innerHTML = CALENDAR_SVG;
    iconBtn.style.cssText = `
    position: absolute;
    right: 6px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    padding: 2px;
    color: GrayText;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: color 0.15s;
  `;
    iconBtn.addEventListener('mouseenter', () => { iconBtn.style.color = 'CanvasText'; });
    iconBtn.addEventListener('mouseleave', () => { iconBtn.style.color = 'GrayText'; });
    wrapper.appendChild(iconBtn);

    // Ensure padding-right so text doesn't overlap icon
    const computedPR = parseFloat(getComputedStyle(input).paddingRight) || 0;
    if (computedPR < 30) {
        input.style.paddingRight = '32px';
    }

    // Initialize display overlay (shows formatted value or placeholder)
    updateDisplayOverlay(input);

    // Listen for value changes to keep overlay in sync
    input.addEventListener('change', () => updateDisplayOverlay(input));

    // Open picker on focus or icon click
    const openPicker = () => requestAnimationFrame(() => showPicker(input, type));
    input.addEventListener('focus', openPicker);
    iconBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openPicker();
    });
}

/** Create Shadow DOM host and mount the picker. */
function showPicker(inputElement, inputType) {
    // Respect disabled and readonly attributes
    if (inputElement.disabled || inputElement.readOnly) return;

    // Don't re-open if already showing for this input
    if (activePicker && activeHost?._nsiInput === inputElement) return;

    // Close any existing picker
    closePicker();

    const PickerComponent = pickerRegistry[inputType];
    if (!PickerComponent) return;

    // Create Shadow DOM host
    const host = document.createElement('div');
    host.id = 'nsi-picker-host';
    host.style.cssText = 'position: fixed; top: 0; left: 0; z-index: 2147483647; pointer-events: none;';
    host._nsiInput = inputElement;
    document.body.appendChild(host);

    const shadow = host.attachShadow({ mode: 'open' });

    // Inject Tailwind + picker styles into Shadow DOM
    const styleEl = document.createElement('style');
    styleEl.textContent = pickerStyles;
    shadow.appendChild(styleEl);

    // Create mount target
    const mountTarget = document.createElement('div');
    mountTarget.style.pointerEvents = 'auto';
    shadow.appendChild(mountTarget);

    // Mount Svelte component
    const component = mount(PickerHost, {
        target: mountTarget,
        props: {
            inputElement,
            pickerComponent: PickerComponent,
            onclose: closePicker,
        },
    });

    activePicker = component;
    activeHost = host;
}

/** Unmount picker and remove Shadow DOM host. */
function closePicker() {
    if (activePicker) {
        try {
            unmount(activePicker);
        } catch {
            // Component may already be destroyed
        }
        activePicker = null;
    }
    if (activeHost) {
        activeHost.remove();
        activeHost = null;
    }
}

/** Scan document for target inputs. */
function scanInputs() {
    const supportedTypes = Object.keys(pickerRegistry);
    const selector = supportedTypes.map((t) => `input[type="${t}"]`).join(', ');
    document.querySelectorAll(selector).forEach(handleInput);
}

/** Watch for dynamically added inputs. */
function observeDOM() {
    const observer = new MutationObserver((mutations) => {
        let shouldScan = false;
        for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType !== Node.ELEMENT_NODE) continue;
                if (node.tagName === 'INPUT' && node.getAttribute('type') in pickerRegistry) {
                    handleInput(node);
                } else if (node.querySelectorAll) {
                    shouldScan = true;
                }
            }
        }
        if (shouldScan) scanInputs();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}

// Initialize
scanInputs();
observeDOM();
