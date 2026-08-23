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
    prefix: string
    /** Also scope bare element selectors (a, input, table, ...). */
    elements?: boolean
}

export function scopeCss(css: string, options: CssScopeOptions): string {
    const prefix = options.prefix
    const scopeElements = options.elements ?? false
    let out = ""
    let seg = ""
    let inComment = false
    let inString: string | null = null
    /** Block stack: "declarations" | "rules" | "ignore". */
    const blocks: string[] = []
    const n = css.length
    let i = 0

    const currentKind = (): string =>
        blocks.length ? blocks[blocks.length - 1] : "top"

    /** Route a character to the selector buffer or the output stream. */
    const emit = (ch: string): void => {
        const kind = currentKind()
        if (kind === "declarations" || kind === "ignore") {
            out += ch
        } else {
            seg += ch
        }
    }

    const flushSelectors = (): string => {
        const text = seg
        seg = ""
        const trimmed = text.trim()
        if (!trimmed) {
            blocks.push("declarations")
            return text
        }
        if (currentKind() === "ignore") {
            blocks.push("declarations")
            return text
        }
        if (trimmed.startsWith("@")) {
            // At-rule opening a block.
            if (
                /^@media\b|^@supports\b|^@container\b|^@layer\b/.test(trimmed)
            ) {
                blocks.push("rules")
            } else {
                blocks.push("ignore")
            }
            return text
        }
        blocks.push("declarations")
        return scopeSelectors(text, prefix, scopeElements)
    }

    while (i < n) {
        const ch = css[i]
        if (inComment) {
            if (ch === "*" && css[i + 1] === "/") {
                emit("*/")
                inComment = false
                i += 2
                continue
            }
            emit(ch)
            i++
            continue
        }
        if (inString) {
            if (ch === "\\") {
                emit(ch)
                emit(css[i + 1] ?? "")
                i += 2
                continue
            }
            if (ch === inString) {
                inString = null
            }
            emit(ch)
            i++
            continue
        }
        if (ch === "/" && css[i + 1] === "*") {
            emit("/*")
            inComment = true
            i += 2
            continue
        }
        if (ch === '"' || ch === "'") {
            inString = ch
            emit(ch)
            i++
            continue
        }
        const kind = currentKind()
        if (ch === "{") {
            if (kind === "declarations") {
                // Nested block inside declarations (shouldn't occur); pass through.
                out += "{"
            } else {
                out += flushSelectors() + "{"
            }
            i++
            continue
        }
        if (ch === "}") {
            out += "}"
            blocks.pop()
            i++
            continue
        }
        if (kind === "declarations" || kind === "ignore") {
            // Declaration or at-rule body text: pass through verbatim.
            out += ch
        } else {
            // Pre-block text (selectors / at-rule) or top-level junk.
            seg += ch
        }
        i++
    }
    out += seg
    return out
}

function scopeSelectors(
    text: string,
    prefix: string,
    scopeElements: boolean
): string {
    return splitTopLevel(text, ",")
        .map(sel => scopeSelector(sel, prefix, scopeElements))
        .join(",")
}

function scopeSelector(
    selector: string,
    prefix: string,
    scopeElements: boolean
): string {
    const s = selector.trim()
    if (!s) {
        return selector
    }
    // Page-context html rules (paper sizing / high contrast) — drop entirely.
    if (s === "html" || /^html(\[[^\]]*\])?[\s>+~,.:#[/(]/.test(s)) {
        return ""
    }
    // body -> the host container.
    if (s === "body") {
        return prefix
    }
    if (/^body[\s]*[.#:([]/.test(s)) {
        return prefix + s.slice("body".length)
    }
    if (/\bbody\b/.test(s)) {
        // body in a descendant/combinator position, e.g. "p body" or "body p".
        const withPrefix = s.replace(/\bbody\b/g, prefix)
        return withPrefix.replace(
            new RegExp(`^${escapeRegex(prefix)}\\s+`),
            prefix
        )
    }
    // Bare element selector at the start (a, input, table, code, ...).
    if (
        scopeElements &&
        /^[a-zA-Z]/.test(s) &&
        !/^[a-zA-Z][a-zA-Z0-9]*:/.test(s)
    ) {
        return `${prefix} ${s}`
    }
    return s
}

function splitTopLevel(text: string, sep: string): string[] {
    const parts: string[] = []
    let cur = ""
    let paren = 0
    let bracket = 0
    let inStr: string | null = null
    for (let i = 0; i < text.length; i++) {
        const ch = text[i]
        if (inStr) {
            cur += ch
            if (ch === "\\") {
                cur += text[++i] ?? ""
            } else if (ch === inStr) {
                inStr = null
            }
            continue
        }
        if (ch === '"' || ch === "'") {
            inStr = ch
            cur += ch
            continue
        }
        if (ch === "(") paren++
        if (ch === ")") paren--
        if (ch === "[") bracket++
        if (ch === "]") bracket--
        if (ch === sep && paren === 0 && bracket === 0) {
            parts.push(cur)
            cur = ""
            continue
        }
        cur += ch
    }
    parts.push(cur)
    return parts
}

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
