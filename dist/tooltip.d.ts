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
/**
 * Register the delegated document-level listeners that manage portal
 * tooltips. Idempotent: only the first call installs the listeners.
 */
export declare const initTooltips: () => void;
//# sourceMappingURL=tooltip.d.ts.map