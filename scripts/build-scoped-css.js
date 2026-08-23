#!/usr/bin/env node
/**
 * Generate scoped copies of fwtoolkit's stylesheets for hosts that embed
 * fwtoolkit UI in a page instead of running it full-page or in an iframe.
 *
 * Output: css-scoped/*.css — same filenames as css/, with:
 *   - reset.css: fully scoped (elements: true), since it exists solely for
 *     the UI.
 *   - every other sheet: only the page-context body/html rules scoped, so
 *     that prefixed classes on body-level dialogs keep working.
 *
 * The container selector defaults to "#app-root" and can be changed with
 * --prefix. Hosts that need a different prefix should run this script (or
 * call scopeCss themselves) with their own value.
 *
 * Usage: node scripts/build-scoped-css.js [--out <dir>] [--prefix <selector>]
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import { scopeCss } from "../dist/index.js"

const arg = (flag, fallback) => {
    const index = process.argv.indexOf(flag)
    return index !== -1 && process.argv[index + 1]
        ? process.argv[index + 1]
        : fallback
}

const cssDir = new URL("../css", import.meta.url).pathname
const outDir = arg(
    "--out",
    join(new URL("..", import.meta.url).pathname, "css-scoped")
)
const prefix = arg("--prefix", "#app-root")

mkdirSync(outDir, { recursive: true })

for (const name of readdirSync(cssDir)) {
    if (!name.endsWith(".css")) {
        continue
    }
    const source = readFileSync(join(cssDir, name), "utf8")
    const scoped =
        name === "reset.css"
            ? scopeCss(source, { prefix, elements: true })
            : scopeCss(source, { prefix, elements: false })
    writeFileSync(join(outDir, name), scoped)
}

console.log(`Scoped CSS written to ${outDir} (prefix: ${prefix})`)
