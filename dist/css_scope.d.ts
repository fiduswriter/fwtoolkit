/**
 * CSS scoping for embedding a full-page stylesheet inside a host page.
 *
 * A page-level stylesheet normally styles `document.body` (`body { ... }`,
 * `body.state { ... }`, `html[hc=...] { ... }`) and sometimes resets *all*
 * elements. When the same UI is mounted into a container element on a host
 * page (a CMS, a plugin, an embed), those rules leak into the host.
 *
 * `scopeCss` rewrites such rules so they only apply inside a host container
 * selector (`prefix`), letting you load the same stylesheets without an
 * iframe:
 *
 *   - `body`        → `prefix`        (the container element)
 *   - `body.foo`    → `prefix.foo`    (state classes stay on the container)
 *   - `body .x`     → `prefix .x`
 *   - `html[hc=...] ...` rules are page-context (paper sizing / high
 *     contrast) and are dropped.
 *   - When `elements` is true, bare element selectors (`a`, `input`, `table`,
 *     ...) are prefixed with the container as well.
 *   - `@media`/`@supports`/`@container`/`@layer` blocks are preserved and
 *     their inner selectors scoped; `@keyframes`/`@font-face` blocks are
 *     passed through untouched.
 *
 * Example — embed the Fidus Writer editor (its mounted container carries the
 * `editor` class):
 *
 *   scopeCss(editorCss, {prefix: "#my-editor .editor"})
 *
 * Note on `elements`: overlays and dialogs are often appended to
 * `document.body` (outside the container) and rely on the unscoped base
 * styles for `a`, `input`, etc. Scoping bare element selectors is therefore
 * only safe for stylesheets that exist solely for the UI itself (resets,
 * content styles). Other sheets should keep `elements: false` so class-based
 * rules on body-level overlays keep working.
 */
export interface CssScopeOptions {
    /**
     * CSS selector for the host container. Required: the utility cannot
     * assume a particular host element.
     */
    prefix: string;
    /** Also scope bare element selectors (a, input, table, ...). */
    elements?: boolean;
}
export declare function scopeCss(css: string, options: CssScopeOptions): string;
//# sourceMappingURL=css_scope.d.ts.map