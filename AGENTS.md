# AGENTS.md — fwtoolkit

This file contains information for AI coding agents working on the `fwtoolkit`
repository. Read this first if you are unfamiliar with the project.

## Project overview

`fwtoolkit` (Fidus Writer Toolkit) is a browser-focused TypeScript library of
reusable UI helpers, utilities and styles. It was originally written for
[Fidus Writer](https://fiduswriter.org) but is published as a standalone npm
package and can be used in any browser project.

- Package name: `fwtoolkit`
- License: `LGPL-3.0-or-later`
- Repository: `https://codeberg.org/fiduswriter/fwtoolkit.git`
- Author: Johannes Wilm

The package exports TypeScript source, compiled JavaScript and declaration files
in `dist/`, and component CSS in `css/`.

## Technology stack

- **Language:** TypeScript 5.8+ with strict mode enabled.
- **Module system:** ESM (`"type": "module"`). TypeScript compiles to
  `NodeNext` modules with `NodeNext` resolution.
- **Runtime target:** ES2020, DOM and DOM.Iterable libs.
- **Build tool:** `tsc` only; no bundler is used.
- **Test runner:** Jest 29 with `ts-jest`, `jest-environment-jsdom`, and
  `--experimental-vm-modules`.
- **Peer dependencies:** ProseMirror packages (`prosemirror-commands`,
  `prosemirror-history`, `prosemirror-keymap`, `prosemirror-model`,
  `prosemirror-state`, `prosemirror-view`).
- **Runtime dependencies:** `diff-dom`, `simple-datatables`, `w3c-keyname`.
- **Demo assets:** Font Awesome 7 (Free) for icons.

## Directory layout

```
.
├── src/              # TypeScript source files
│   ├── index.ts      # Public package exports
│   ├── datatable/    # Data table wrappers (overview, selection)
│   ├── file/         # File selector / file dialog components
│   └── *.ts          # Individual UI helpers and components
├── dist/             # Compiled JS, `.d.ts` and source maps (generated)
├── css/              # Component stylesheets
│   ├── colors.css    # CSS custom properties (always load first)
│   ├── common.css    # Base / global styles
│   └── fwtoolkit.css # Concatenated bundle (generated)
├── test/             # Jest tests and `setup.ts`
├── demo/             # Codeberg Pages demo site
├── scripts/          # Build / deploy helpers
│   ├── build-css.js  # Concatenates css/ into css/fwtoolkit.css
│   └── deploy-pages.sh # Deploys demo/ to Codeberg Pages
├── package.json      # Scripts, dependencies and package exports
├── tsconfig.json     # TypeScript compiler options
└── jest.config.js    # Jest configuration
```

## Build and test commands

```bash
# Install dependencies
npm install

# Compile TypeScript to dist/ and build CSS bundle
npm run build

# Build only the CSS bundle
npm run build:css

# Run the Jest test suite
npm test

# Prepublish hook: build + test
npm run prepublishOnly
```

`npm run build` runs `tsc && npm run build:css`. The TypeScript output goes to
`dist/` with declaration files and source maps. The CSS script reads every
`.css` file in `css/` except `fwtoolkit.css`, places `colors.css` and
`common.css` first, and writes a concatenated `css/fwtoolkit.css`.

## Code style guidelines

- Use **ES modules** and ES2020 syntax.
- Import local files with the **`.js` extension** even when the source file is
  `.ts`, e.g. `import {Dialog} from "./dialog.js"`. This is required by the
  `NodeNext` module resolution.
- Keep TypeScript **strict** (`strict: true`). Avoid `any` unless necessary.
- Component classes are exported from `src/index.ts`. Re-export related types
  alongside the implementation.
- Pure utility functions live in `src/basic.ts`, `src/blob.ts`, `src/events.ts`,
  `src/focus.ts`, `src/network.ts`, etc.
- HTML strings returned by helpers are expected to be inserted with
  `insertAdjacentHTML` or assigned to `innerHTML`. Untrusted text must pass
  through `escapeText()` before being inserted.
- Application-wide settings must be initialized once with
  `initSettings(settings)` from `src/settings.ts`. Subsequent code uses
  `getSettings()`. Settings are frozen to prevent accidental mutation.
- The settings object may include the host-page/localization helpers
  `gettext(msgid: string)`, `interpolate(fmt: string, args: unknown[],
  named?: boolean)` and `staticUrl(path: string)`. Library code should import
  these helpers from `src/settings.js` (re-exported from `src/index.js`) rather
  than relying on globals. If settings have not been initialized or the
  corresponding function is not present in settings, each helper uses a safe
  default: `gettext` and `staticUrl` return their input unchanged, and
  `interpolate` performs simple `%s` positional replacement.
- Legacy host-page globals are still declared in `src/global.d.ts` for
  backwards compatibility: `gettext`, `interpolate`, `staticUrl`,
  `settings`, `window.settings` and `window.csrfToken`.

## Testing instructions

Tests are located in `test/*.test.ts` and run with Jest in a `jsdom`
environment.

- Use `npm test` to run the full suite.
- `test/setup.ts` is loaded before each test file and initializes
  `initSettings()` with mock values for `apiUrl`, `getCsrfToken`, `gettext`,
  `staticUrl` and `interpolate`. The legacy host-page globals are also kept
  defined so both the settings path and the fallback path are available.
- Tests typically reset `document.body.innerHTML` in `beforeEach` to keep DOM
  state isolated.
- Coverage is collected from `src/**/*.ts`.

Example test pattern:

```typescript
import {addAlert} from "../src/basic.js"

describe("basic UI helpers", () => {
    beforeEach(() => {
        document.body.innerHTML = ""
    })

    test("addAlert appends an alert element", () => {
        addAlert("info", "Hello from fwtoolkit")
        const alerts = document.querySelectorAll("#fw-alerts-wrapper li")
        expect(alerts.length).toBe(1)
    })
})
```

## CSS conventions

- Styles are split into one file per component/concern (`dialog.css`,
  `buttons.css`, `alerts.css`, etc.).
- `colors.css` defines CSS custom properties used across the library. Load it
  before any component CSS.
- `common.css` contains base rules for `body`, tables, avatars, inputs and
  ProseMirror placeholder styles.
- Do not edit `css/fwtoolkit.css` directly; it is generated by
  `scripts/build-css.js` from the individual files.
- New component styles should be added as a new file in `css/` and will be
  included automatically in the bundle.

## Deployment

The demo site in `demo/` is published to Codeberg Pages at
`https://fiduswriter.codeberg.page/fwtoolkit/`.

To deploy manually:

```bash
npm run build
./scripts/deploy-pages.sh
```

The deploy script:

1. Builds the project.
2. Creates `.pages-build/` with `demo/`, `dist/` and `css/`.
3. Copies Font Awesome assets locally so the demo has no external CDN
   dependencies.
4. Initializes a git repo, commits everything on a `pages` branch and force
   pushes to `origin`.

The production Codeberg Pages setup also uses a Forgejo webhook targeting
`https://fiduswriter.codeberg.page/fwtoolkit` with a branch filter of `pages`.

## Security considerations

- `src/basic.ts` provides `escapeText()` and `unescapeText()`. Always use
  `escapeText()` when rendering user-controlled or otherwise untrusted text in
  HTML generated by helpers such as `showSystemMessage()` or `infoTooltip()`.
- Network helpers in `src/network.ts` automatically include the CSRF token in
  `X-CSRFToken` and send `credentials: "include"`. They rely on
  `settings.apiUrl()` and `settings.getCsrfToken()` being initialized.
- The library assumes a trusted host page provides `gettext`, `staticUrl` and
  `settings`. Do not run fwtoolkit components in an untrusted origin where these
  globals could be tampered with.
- `infoTooltip()` accepts raw HTML and must only be called with trusted markup.

## Release checklist

- Ensure `npm run build` succeeds and `dist/` is up to date.
- Ensure `npm test` passes.
- Update `package.json` version if needed.
- `npm publish` triggers `prepublishOnly`, which builds and tests.

## Useful references

- `package.json` — scripts, exports and dependency versions.
- `tsconfig.json` — compiler options and included paths.
- `jest.config.js` — test environment and ESM transform configuration.
- `src/index.ts` — canonical list of public exports.
- `src/global.d.ts` — host-page globals expected at runtime.
- `README.md` — user-facing usage examples.
