/**
 * Portal-based tooltip handling.
 *
 * The CSS tooltips (`.fw-info-tooltip` / `.fw-wtooltip`) are positioned
 * `absolute` inside the dialog content. Once the dialog content scrolls
 * (`overflow: hidden auto`), any tooltip that extends past the content box
 * would be clipped. Browsers also cannot combine "vertical scroll" with
 * "horizontal overflow visible" on a single box (`visible` + `auto` is coerced
 * to `auto`), so the scrollable dialog content always clips its children.
 *
 * This module avoids that by moving the tooltip element to `document.body`
 * and positioning it with `position: fixed` relative to the trigger's viewport
 * rectangle, using the same escape-hatch pattern as `ContentMenu` /
 * `dropdownSelect`. The tooltip is therefore never a descendant of the
 * scroll container and can never be clipped by it.
 *
 * `initTooltips()` registers one set of document-level (delegated) listeners,
 * so tooltips that are added to the DOM later (for example when a dialog is
 * opened) work without any further setup. Calling it again is a no-op. The
 * `fwtoolkit` barrel (`src/index.ts`) calls `initTooltips()` automatically
 * when the library is loaded, and `Dialog.open()` calls it as well, so in
 * practice tooltips work everywhere — inside dialogs or not. Consumers that
 * import a single module (e.g. `./tooltip.js`) directly instead of the barrel
 * can call `initTooltips()` themselves.
 *
 * When `initTooltips()` has not been called, the CSS `:hover` / `:focus-within`
 * rules still show the tooltips in place (progressive enhancement), but they
 * may be clipped inside scrollable containers.
 */
const INFO_TOOLTIP_SELECTOR = ".fw-info-tooltip";
const ROW_TOOLTIP_SELECTOR = ".fw-wtooltip";
const TRIGGER_SELECTOR = `${INFO_TOOLTIP_SELECTOR}, ${ROW_TOOLTIP_SELECTOR}`;
const VIEWPORT_MARGIN = 8;
const ARROW_GAP = 6;
const ROW_TOOLTIP_GAP = 2;
const ROW_TOOLTIP_OFFSET = 13; // matches the CSS `left: calc(100% - 13px)`
const HIDE_DELAY = 150;
let initialized = false;
let activeTrigger = null;
let activeTooltip = null;
let tooltipOrigin = null;
let hideTimer = null;
let lastPointer = { x: -1, y: -1 };
const getTrigger = (target) => {
    if (!(target instanceof Element)) {
        return null;
    }
    return target.closest(TRIGGER_SELECTOR);
};
const getTooltipText = (trigger) => {
    const selector = trigger.matches(INFO_TOOLTIP_SELECTOR)
        ? ".fw-info-tooltip-text"
        : ".fw-tooltip";
    return trigger.querySelector(selector);
};
const isTopPlacement = (trigger) => trigger.matches(INFO_TOOLTIP_SELECTOR);
const getZIndex = () => {
    let zIndex = 1000;
    document.querySelectorAll(".fw-dialog").forEach(dialogEl => {
        const dialogZ = parseInt(window.getComputedStyle(dialogEl).zIndex, 10);
        if (!Number.isNaN(dialogZ)) {
            zIndex = Math.max(zIndex, dialogZ);
        }
    });
    // Stay above every dialog and overlay.
    return zIndex + 100;
};
const positionTooltip = (tooltip, trigger) => {
    const triggerRect = trigger.getBoundingClientRect();
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    let top;
    let left;
    if (isTopPlacement(trigger)) {
        // Info tooltip: centered above the trigger, arrow pointing down.
        left = triggerRect.left + triggerRect.width / 2 - tooltipWidth / 2;
        top = triggerRect.top - tooltipHeight - ARROW_GAP;
        if (top < VIEWPORT_MARGIN) {
            // Not enough room above: flip below the trigger and point the
            // arrow up instead.
            top = triggerRect.bottom + ARROW_GAP;
            tooltip.classList.add("fw-tooltip-flipped");
        }
        else {
            tooltip.classList.remove("fw-tooltip-flipped");
        }
    }
    else {
        // Table-row tooltip: below the title, aligned with its right edge.
        left = triggerRect.right - ROW_TOOLTIP_OFFSET;
        top = triggerRect.bottom + ROW_TOOLTIP_GAP;
        if (top + tooltipHeight > viewportHeight - VIEWPORT_MARGIN) {
            top = triggerRect.top - tooltipHeight - ROW_TOOLTIP_GAP;
        }
        tooltip.classList.remove("fw-tooltip-flipped");
    }
    left = Math.max(VIEWPORT_MARGIN, Math.min(left, viewportWidth - tooltipWidth - VIEWPORT_MARGIN));
    top = Math.max(VIEWPORT_MARGIN, Math.min(top, viewportHeight - tooltipHeight - VIEWPORT_MARGIN));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
};
const hideTooltip = () => {
    if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
    }
    if (!activeTooltip || !activeTrigger) {
        activeTooltip = null;
        activeTrigger = null;
        tooltipOrigin = null;
        return;
    }
    const tooltip = activeTooltip;
    const trigger = activeTrigger;
    tooltip.style.visibility = "hidden";
    tooltip.style.opacity = "0";
    tooltip.classList.remove("fw-tooltip-flipped");
    tooltip.style.position = "";
    tooltip.style.top = "";
    tooltip.style.left = "";
    tooltip.style.zIndex = "";
    if (trigger.isConnected && tooltipOrigin) {
        // Put the tooltip back where it came from so it is removed together
        // with its container (for example when a dialog closes).
        if (tooltipOrigin.nextSibling) {
            tooltipOrigin.parent.insertBefore(tooltip, tooltipOrigin.nextSibling);
        }
        else {
            tooltipOrigin.parent.appendChild(tooltip);
        }
    }
    else if (tooltip.isConnected) {
        // The trigger is gone (dialog was closed): drop the orphaned tooltip.
        tooltip.remove();
    }
    trigger.classList.remove("fw-tooltip-active");
    tooltipOrigin = null;
    activeTooltip = null;
    activeTrigger = null;
};
const shouldStayVisible = () => {
    if (!activeTrigger) {
        return false;
    }
    const activeEl = document.activeElement;
    if (activeEl && activeTrigger.contains(activeEl)) {
        return true;
    }
    const pointerEl = typeof document.elementFromPoint === "function"
        ? document.elementFromPoint(lastPointer.x, lastPointer.y)
        : null;
    return (!!pointerEl &&
        (activeTrigger.contains(pointerEl) ||
            (activeTooltip ? activeTooltip.contains(pointerEl) : false)));
};
const scheduleHide = () => {
    if (hideTimer) {
        return;
    }
    hideTimer = setTimeout(() => {
        hideTimer = null;
        if (shouldStayVisible()) {
            return;
        }
        hideTooltip();
    }, HIDE_DELAY);
};
const showTooltip = (trigger) => {
    if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
    }
    if (activeTrigger === trigger && activeTooltip) {
        // Already shown; reposition in case the page/container scrolled.
        positionTooltip(activeTooltip, trigger);
        return;
    }
    hideTooltip();
    const tooltip = getTooltipText(trigger);
    if (!tooltip) {
        return;
    }
    const parent = tooltip.parentElement;
    if (!parent) {
        return;
    }
    activeTrigger = trigger;
    activeTooltip = tooltip;
    tooltipOrigin = { parent, nextSibling: tooltip.nextSibling };
    document.body.appendChild(tooltip);
    tooltip.style.position = "fixed";
    tooltip.style.zIndex = String(getZIndex());
    positionTooltip(tooltip, trigger);
    trigger.classList.add("fw-tooltip-active");
    tooltip.style.visibility = "visible";
    tooltip.style.opacity = "1";
};
const onMouseOver = (event) => {
    const trigger = getTrigger(event.target);
    if (trigger) {
        showTooltip(trigger);
    }
};
const onMouseOut = (event) => {
    const target = event.target;
    const related = event.relatedTarget;
    if (!activeTrigger) {
        return;
    }
    if (target && activeTrigger.contains(target)) {
        if (related &&
            (activeTrigger.contains(related) ||
                (activeTooltip ? activeTooltip.contains(related) : false))) {
            // The pointer is moving within the trigger/tooltip subtree.
            return;
        }
    }
    scheduleHide();
};
const onFocusIn = (event) => {
    const trigger = getTrigger(event.target);
    if (trigger) {
        showTooltip(trigger);
    }
};
const onFocusOut = (event) => {
    const related = event.relatedTarget;
    if (!activeTrigger) {
        return;
    }
    if (related &&
        (activeTrigger.contains(related) ||
            (activeTooltip ? activeTooltip.contains(related) : false))) {
        return;
    }
    scheduleHide();
};
const onPointerMove = (event) => {
    lastPointer = { x: event.clientX, y: event.clientY };
    if (activeTrigger && !activeTrigger.isConnected) {
        // The trigger was removed from the DOM while its tooltip was open.
        hideTooltip();
    }
};
const repositionActiveTooltip = () => {
    if (activeTooltip && activeTrigger) {
        positionTooltip(activeTooltip, activeTrigger);
    }
};
/**
 * Register the delegated document-level listeners that manage portal
 * tooltips. Idempotent: only the first call installs the listeners.
 */
export const initTooltips = () => {
    if (initialized) {
        return;
    }
    initialized = true;
    document.addEventListener("mouseover", onMouseOver);
    document.addEventListener("mouseout", onMouseOut);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    document.addEventListener("pointermove", onPointerMove);
    // Scroll events do not bubble, so use the capture phase to reposition
    // tooltips while their triggers scroll inside dialog contents.
    document.addEventListener("scroll", repositionActiveTooltip, true);
    window.addEventListener("resize", repositionActiveTooltip);
};
//# sourceMappingURL=tooltip.js.map