# Modding Guide - pshsayhi's Mod Loader v1.1.6

This guide covers everything you need to know to write, package, and import a mod for pshsayhi's Mod Loader (Interstellar).

---

## Table of Contents

1. [How the Loader Works](#how-the-loader-works)
2. [Mod Structure](#mod-structure)
3. [metadata.js Reference](#metadatajs-reference)
4. [interstellar.json Reference](#interstellarjson-reference)
5. [Writing the Mod Class](#writing-the-mod-class)
6. [Sections & Mod Types](#sections--mod-types)
7. [Config System](#config-system)
8. [Available APIs](#available-apis)
9. [Packaging Your Mod (ZIP)](#packaging-your-mod-zip)
10. [Modpacks](#modpacks)
11. [Import Restrictions](#import-restrictions)

---

## How the Loader Works

At startup the loader:

1. Reads **built-in mods** from `mods/registry.js` and instantiates each class.
2. Reads **imported mods** from IndexedDB (mods you dragged-and-dropped as `.zip` files) and instantiates them the same way.
3. Builds the UI, grouping all mods into their declared sections.
4. Calls `start()` / `stop()` on a mod's class instance whenever the user toggles it or switches outfits.

Every mod is just a JavaScript class with a `start()` and `stop()` method. The loader is responsible for lifecycle; the mod just has to do its thing when running.

---

## Mod Structure

A mod is a `.zip` file (for imports) or a folder (for built-ins) with at least two files:

```
my-mod/
├── metadata.js         ← OR interstellar.json - required, describes the mod
├── index.js            ← required, the mod's entry point (can be named anything)
└── LICENSE             ← recommended
```

The metadata file must be at the **root** of the zip. You can use either `metadata.js` or `interstellar.json` - if both are present, `metadata.js` takes priority.

Additional assets (images, CSS, audio, etc.) can be included in the zip and accessed at runtime if needed.

---

## metadata.js Reference

`metadata.js` must export a single object as `exports.default`:

```js
exports.default = {
  // --- Required ---
  id:          "my-mod",          // unique string, no spaces
  entryPoint:  "index.js",        // path to the main class file (relative to zip root)

  // --- Strongly recommended ---
  label:       "My Mod",          // display name shown in the UI
  description: "Does cool stuff.",
  author:      "yourname",
  version:     "1.0.0",           // semver
  homeUrl:     "https://github.com/...",

  // --- UI ---
  icon:        "fa-star",         // Font Awesome icon class (fa-*)
  // iconPath: "icon.png",        // alternative: path to an image in the zip

  // --- Behaviour ---
  type:        "toggle",          // "toggle" or "exclusive" - see below
  section:     "extras",          // "outfit" or "extras" - see below

  // --- License ---
  licenseName: "MIT",
  licensePath: "LICENSE",

  // --- Optional config sliders (see Config System) ---
  config: []
};
```

## interstellar.json Reference

As an alternative to `metadata.js`, you can use `interstellar.json`. The fields are the same except for these three which use different names:

| `interstellar.json` | `metadata.js` equivalent | Description |
|---|---|---|
| `name` | `label` | Display name shown in the UI |
| `creator` | `author` | Mod author |
| `entrypoint` | `entryPoint` | Path to the entry point JS file |

```json
{
  "id":          "my-mod",
  "name":        "My Mod",
  "description": "Does cool stuff.",
  "creator":     "yourname",
  "version":     "1.0.0",
  "entrypoint":  "index.js",
  "scripting":   "commonjs"
}
```

All other fields (`type`, `section`, `icon`, `config`, etc.) are written the same as in `metadata.js`.
```

### Required fields

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique identifier. Used as the key in `modsMap`. Must be stable across versions. |
| `entryPoint` | string | Path (relative to zip root) of the JS file that exports the mod class. |

### All other fields are optional but strongly recommended for the UI to look right.

---

## Writing the Mod Class

The entry point file must export a **class** (or constructor function) as `exports.default` or `module.exports`.

The class must implement:

```js
class MyMod {
  constructor() {
    // Set up state. Do NOT start anything here.
  }

  start() {
    // Called when the user enables the mod.
    // Begin intervals, event listeners, DOM manipulation, etc.
  }

  stop() {
    // Called when the user disables the mod.
    // Clean up EVERYTHING: clear intervals, remove listeners, remove DOM nodes.
  }
}

exports.default = MyMod;
```

### Lifecycle rules

- `start()` may be called multiple times (the loader calls `stop()` before re-starting for exclusive mods, but be defensive anyway).
- `stop()` must be idempotent - calling it when already stopped should not throw.
- Never run anything outside `start()` / `stop()` at module eval time; the class is instantiated at loader startup before the game is necessarily ready.

### Checking game state

For mods that interact with the game, guard against running outside a match:

```js
start() {
  this.interval = setInterval(() => {
    if (typeof Interstellar === 'undefined' || !Interstellar.ingame) return;
    this.tick();
  }, this.speed);
}
```

---

## Sections & Mod Types

### Sections

| Section key | Label | Behaviour |
|---|---|---|
| `outfit` | Outfit | Only one mod in this section can be active at a time (radio-select). |
| `extras` | Extras | Each mod has its own independent toggle. |
| `modpack` | Modpacks | Auto-assigned to any mod imported via a modpack zip. Cannot be declared manually. |

Use `"outfit"` for mods that change the player's appearance, `"extras"` for anything else (cursor effects, overlays, etc.). The `modpack` section is managed automatically - you don't set it in your metadata.

### Types

| Type | Meaning |
|---|---|
| `"exclusive"` | Used in `outfit` sections. Activating one stops all others in the same section. |
| `"toggle"` | Used in `extras` sections. Independent on/off per mod. |

---

## Config System

Mods can expose user settings using the config array in metadata.js.

Supported input types:
- `"range"` → slider
- `"checkbox"` → toggle switch
- Any valid HTML `<input type="...">` → fallback input

```js
config: [
  {
    key:     "speed",      // the property name set on the instance: instance.speed = value
    label:   "Speed (ms)",
    type:    "range",
    min:     10,
    max:     200,
    step:    5,
    unit:    "ms",
    default: 85,
  }
]
```

When the user moves the slider the loader does:

```js
instance.speed = newValue;
if (instance.interval || instance.rafId) instance.start();
```

So if your mod uses a config key named `speed`, it will be hot-reloaded automatically. For other keys you'd need to handle the update yourself (currently the loader only special-cases `speed`).

Your constructor should initialise the property to the `default` value so it works before the user touches anything:

```js
constructor() {
  this.speed = 85; // match metadata.js default
}
```

Groups:
- Configs are grouped using:

```js
group: "Smooth"
```
- If no group is provided, it falls back to General

---

## Available APIs

### `@interstellar/StellarAPI`

The only external module you're allowed to `require` inside an imported mod.

```js
const api = require("@interstellar/StellarAPI");

// Send a game packet
api.default.sendPacket({ ... });
```

### DOM / Web APIs

All standard browser APIs are available - `document`, `window`, `fetch`, `requestAnimationFrame`, `setInterval`, etc.

---

## Packaging Your Mod (ZIP)

1. Create a folder for your mod.
2. Add `metadata.js` (with `exports.default = { ... }`) at the **root** of the folder - not inside a subfolder.
3. Add your entry point JS file (e.g. `index.js`) also at the root.
4. Optionally add a `LICENSE` file and any other assets.
5. Zip the contents directly (not the folder itself):

```
# Correct - metadata.js is at the zip root
my-mod.zip
├── metadata.js
├── index.js
└── LICENSE

# Wrong - metadata.js is inside a subfolder
my-mod.zip
└── my-mod/
    ├── metadata.js
    └── index.js
```

The importer will reject a zip where `metadata.js` is not at the root.

### Import validation

The importer checks:
- The zip contains `metadata.js` or `interstellar.json` at the root (`metadata.js` takes priority if both are present).
- The metadata exports an object with at least `id` and `entryPoint` (or `entrypoint` in `interstellar.json`).
- The file named by `entryPoint` exists in the zip.
- There is enough IndexedDB quota remaining.

If a mod with the same `id` is already installed, a duplicate-overwrite prompt is shown.

---

## Modpacks

A modpack is a single `.zip` that bundles multiple mods together. Modpacks are imported from the **Modpacks** tab in the UI - you can't import a modpack from any other tab, and you can't import a single mod from the modpack tab.

### Structure

```
my-modpack.zip
├── modpack.json           ← required, identifies this zip as a modpack
├── sparkle/               ← one subfolder per mod
│   ├── metadata.js        ← or interstellar.json
│   └── index.js
└── rainbow/
    ├── metadata.js
    └── index.js
```

File paths inside each subfolder are relative to that subfolder's root, identical to how a standalone mod zip is structured. The subfolder name itself doesn't matter - only the contents are used.

### modpack.json

```json
{
  "id":          "my-modpack",
  "name":        "My Modpack",
  "description": "A collection of mods.",
  "version":     "1.0.0",
  "author":      "yourname"
}
```

| Field | Required | Description |
|---|---|---|
| `id` | ✓ | Unique identifier for the pack |
| `name` | ✓ | Display name shown in the success toast |
| `description` | - | Optional description |
| `version` | - | Pack version |
| `author` | - | Pack author |

### How modpack mods work at runtime

Each mod in the pack is stored as a separate record in IndexedDB with `source: "modpack"`. They behave identically to individually imported mods - same `start()` / `stop()` lifecycle, same `require()` restrictions. The only difference is they appear in the Modpacks tab instead of Extras or Outfit.

Subfolders without a valid `metadata.js` or `interstellar.json` are silently skipped; the rest of the pack still imports. A duplicate `id` within the same pack is automatically skipped after the first occurrence.

---

## Import Restrictions

Imported mods run in a sandboxed `new Function(...)` environment. `require` supports two things:

- **`@interstellar/StellarAPI`** - the game API.
- **Relative paths to other files in the same zip** - e.g. `require("./utils")`.

Anything else (Node built-ins, npm packages, absolute module names) will throw:

```
Error: require not supported in imported mods: some-module
```

### Requiring files within your zip

Use standard relative paths. Extensions are optional - `.js` and `/index.js` are tried automatically:

```js
// All of these work if the file exists in the zip:
const utils = require("./utils");         // tries utils.js, utils/index.js
const helpers = require("./lib/helpers"); // tries lib/helpers.js
```

Each file is evaluated once and cached; circular requires are safe (the requiring file gets the partially-built exports object).

Files must be text (`.js`, `.mjs`, `.cjs`) and present in the zip. Binary files and non-JS text files cannot be required.

Built-in mods (registered in `mods/registry.js` and shipped with the loader itself) do not have this restriction - they run in the full Interstellar scripting runtime.

---