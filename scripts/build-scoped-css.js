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
 * The output is formatted with Prettier using the repository's .prettierrc
 * so that the tracked css-scoped/ files are byte-identical to what the
 * generator produces. Without this, the pre-commit hook (lint-staged runs
 * Prettier on staged .css files) would reformat every commit that includes
 * regenerated files, and the next `npm run build` would flag all of them as
 * modified again.
 *
 * Usage:
 *   node scripts/build-scoped-css.js [--out <dir>] [--prefix <selector>]
 *   node scripts/build-scoped-css.js --check   exit 1 when files are stale
 */
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs"
import { join } from "node:path"
import * as prettier from "prettier"
import { scopeCss } from "../dist/index.js"

const arg = (flag, fallback) => {
    const index = process.argv.indexOf(flag)
    return index !== -1 && process.argv[index + 1]
        ? process.argv[index + 1]
        : fallback
}

const hasFlag = flag => process.argv.includes(flag)

const cssDir = new URL("../css", import.meta.url).pathname
const outDir = arg(
    "--out",
    join(new URL("..", import.meta.url).pathname, "css-scoped")
)
const prefix = arg("--prefix", "#app-root")
const check = hasFlag("--check")

async function format(filepath, source) {
    const config = (await prettier.resolveConfig(filepath)) ?? {}
    return prettier.format(source, { ...config, filepath })
}

mkdirSync(outDir, { recursive: true })

let stale = []

for (const name of readdirSync(cssDir)) {
    if (!name.endsWith(".css")) {
        continue
    }
    const source = readFileSync(join(cssDir, name), "utf8")
    const scoped =
        name === "reset.css"
            ? scopeCss(source, { prefix, elements: true })
            : scopeCss(source, { prefix, elements: false })
    const output = await format(join(outDir, name), scoped)

    const existing = readFileSync(join(outDir, name), "utf8")
    if (existing === output) {
        continue
    }
    if (check) {
        stale.push(name)
    } else {
        writeFileSync(join(outDir, name), output)
    }
}

if (check) {
    if (stale.length) {
        console.error(
            `css-scoped/ is out of date (${stale.join(", ")}). Run "npm run build" and commit the result.`
        )
        process.exit(1)
    }
    console.log("css-scoped/ is up to date.")
} else {
    console.log(`Scoped CSS written to ${outDir} (prefix: ${prefix})`)
}
