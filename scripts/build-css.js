import {readdirSync, readFileSync, writeFileSync} from "node:fs"
import {join} from "node:path"

const cssDir = new URL("../css", import.meta.url).pathname
const outputFile = join(cssDir, "fwtoolkit.css")

// Files that should appear first because they define variables or base styles.
const firstFiles = ["colors.css", "common.css"]

const files = readdirSync(cssDir)
    .filter(name => name.endsWith(".css") && name !== "fwtoolkit.css")
    .sort((a, b) => {
        const indexA = firstFiles.indexOf(a)
        const indexB = firstFiles.indexOf(b)
        if (indexA !== -1 && indexB !== -1) {
            return indexA - indexB
        }
        if (indexA !== -1) {
            return -1
        }
        if (indexB !== -1) {
            return 1
        }
        return a.localeCompare(b)
    })

const output = files
    .map(file => {
        const content = readFileSync(join(cssDir, file), "utf8")
        return `/* === ${file} === */\n${content.trim()}\n`
    })
    .join("\n")

writeFileSync(outputFile, output)
console.log(`Built css/fwtoolkit.css from ${files.length} files.`)
