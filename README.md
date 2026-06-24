# fwtoolkit

Fidus Writer Toolkit — small, reusable utilities, UI helpers and styles
originally written for Fidus Writer but usable in any browser project.

## JavaScript usage

```javascript
import {escapeText, addAlert} from "fwtoolkit"
import {convertDataURIToBlob} from "fwtoolkit/blob.js"
```

## CSS usage

The package ships the styles for its UI components under `fwtoolkit/css/`.
Load at least `colors.css` and the component styles you need:

```html
<link rel="stylesheet" href="node_modules/fwtoolkit/css/colors.css">
<link rel="stylesheet" href="node_modules/fwtoolkit/css/dialog.css">
<link rel="stylesheet" href="node_modules/fwtoolkit/css/buttons.css">
```

In Fidus Writer the CSS is copied automatically to the static files directory
by the `copy_fwtoolkit_css` postinstall step.

## Contents

- `src/text.js` — text escaping helpers (`escapeText`, `unescapeText`, `noSpaceTmp`)
- `src/blob.js` — `convertDataURIToBlob`
- `src/file/` — file title/path helpers and file dialogs
- `src/network.js` — fetch-based HTTP helpers and `ensureCSS`
- `src/dialog.js`, `src/content_menu.js`, `src/overview_menu.js`, ... — UI components
- `src/index.js` — aggregated exports
- `css/` — component styles and a minimal `colors.css`
