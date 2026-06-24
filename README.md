# fwtoolkit

Fidus Writer Toolkit — small, reusable utilities originally written for
Fidus Writer but usable in any browser or Node-based project.

## Usage

```javascript
import {escapeText, addAlert} from "fwtoolkit"
import {convertDataURIToBlob} from "fwtoolkit/blob.js"
```

## Contents

- `text.js` — text escaping helpers (`escapeText`, `unescapeText`, `noSpaceTmp`)
- `blob.js` — `convertDataURIToBlob`
- `file.js` — file title/path helpers
- `network.js` — small fetch-based HTTP helpers (`get`, `post`, `postJson`)
- `index.js` — aggregated exports plus generic UI stubs (`addAlert`, `deactivateWait`)
