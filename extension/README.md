# Cru Instagram Review Helper

Lets the app move one dedicated Instagram window to the next handle. It only
navigates that tab; it never reads or changes Instagram page content.

Works with the live site (https://crumissionexpansion.vercel.app) and with
local development (http://localhost:3000).

## Install (each intern, once — Chrome or Edge)
1. Get this `extension` folder onto your computer: on GitHub, use
   **Code → Download ZIP**, unzip it, and keep the `extension` folder somewhere
   permanent (Chrome loads it from that location every time).
2. Open `chrome://extensions` and turn on **Developer mode** (top right).
3. Click **Load unpacked** and pick the `extension` folder.
4. Open the app's Instagram review tool and refresh. It should say
   "Helper extension connected".

## Update to a new version
Replace the files in your `extension` folder with the new ones, then on
`chrome://extensions` click the reload icon on **Cru Instagram Review Helper**
and refresh the app. Check the version number shown there matches
`manifest.json`.

## For developers
The extension ID is fixed (set by the `key` in manifest.json) and matches
`src/lib/cru-extension.ts`. Only pages listed under `externally_connectable`
in manifest.json can talk to it — add any new domain there (exact hosts only;
Chrome rejects wildcards like `*.vercel.app`, so preview deployments can't
connect) and bump `version`.
