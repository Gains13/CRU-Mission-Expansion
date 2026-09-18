# Cru Instagram Review Helper

Lets the app move one dedicated Instagram window to the next handle. It only
navigates that tab; it never reads or changes Instagram page content.

## Install (each intern, once)
1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and pick this `extension` folder.
3. Refresh the app. The Instagram review tool should say "Helper extension connected".

The extension ID is fixed (set by the `key` in manifest.json) and matches
`src/lib/cru-extension.ts`. Only pages listed under `externally_connectable`
in manifest.json can talk to it — add your production URL there when you deploy.
