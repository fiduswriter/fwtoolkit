import { execFileSync } from "node:child_process"
import { existsSync, mkdtempSync, readdirSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const root = process.cwd()
const script = join(root, "scripts", "build-scoped-css.js")

const cssFiles = () =>
    readdirSync(join(root, "css")).filter(name => name.endsWith(".css"))

describe("build-scoped-css script", () => {
    // The script imports the compiled scopeCss helper from dist/, which is
    // gitignored and therefore may not exist on a fresh checkout in CI.
    beforeAll(() => {
        if (!existsSync(join(root, "dist", "index.js"))) {
            execFileSync("npm", ["run", "build"], {
                cwd: root,
                stdio: "inherit"
            })
        }
    }, 180000)

    test("writes all scoped sheets into a fresh output directory", () => {
        const outDir = mkdtempSync(join(tmpdir(), "fwtoolkit-scoped-"))
        try {
            execFileSync("node", [script, "--out", outDir], {
                cwd: root,
                stdio: "pipe"
            })
            const written = readdirSync(outDir).filter(name =>
                name.endsWith(".css")
            )
            expect(written.sort()).toEqual(cssFiles().sort())
        } finally {
            rmSync(outDir, { recursive: true, force: true })
        }
    })

    test("reports a fresh output directory as stale in --check mode", () => {
        const outDir = mkdtempSync(join(tmpdir(), "fwtoolkit-scoped-check-"))
        try {
            expect(() =>
                execFileSync("node", [script, "--out", outDir, "--check"], {
                    cwd: root,
                    stdio: "pipe"
                })
            ).toThrow()
        } finally {
            rmSync(outDir, { recursive: true, force: true })
        }
    })
})
