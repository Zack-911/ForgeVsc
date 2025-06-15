<h1 align="center">ForgeVSC</h1>

<p align="center">
  Powerful VS Code Extension for <strong>ForgeScript</strong> scripting — with rich IntelliSense, custom diagnostics, syntax highlighting, and more.
</p>

<p align="center">
  <a href="https://wakatime.com"><img src="https://wakatime.com/badge/github/Zack-911/ForgeVsc.png" alt="wakatime"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=Zack-911.forgescript-extension"><img src="https://img.shields.io/visual-studio-marketplace/v/Zack-911.forgescript-extension.png?label=VS%20Code%20Marketplace" alt="Marketplace Version"></a>
  <a href="https://github.com/zack-911/forgevsc/issues"><img src="https://img.shields.io/github/issues/zack-911/forgevsc?color=blue" alt="Issues"></a>
  <a href="https://github.com/zack-911/forgevsc/pulls"><img src="https://img.shields.io/github/issues-pr/zack-911/forgevsc?color=blueviolet" alt="Pull Requests"></a>
  <a href="https://github.com/zack-911/forgevsc/blob/main/LICENSE.md"><img src="https://img.shields.io/github/license/zack-911/forgevsc.png" alt="License"></a>
</p>

---

## 🚀 Features

### ✅ Dynamic Syntax Highlighting
- Customize token colors, operator styles, and dynamic syntax rules via JSON config.

### ⚡ Smart Autocompletion
- Suggests ForgeScript functions, events, and your custom functions.
- Modular and optimized completion providers.

### 🧠 Hover Information
- Hover any function to view its:
  - Description, aliases, bracket info, arguments, and return types.

### ✍️ Signature Help
- While typing inside function brackets, see:
  - Argument name, whether it's required, type hints, rest info, etc.

### 🛠 Type-Aware Diagnostics
- Detect missing or invalid arguments and type mismatches.
- Early support for type validation: `Boolean`, `Number`, `Time`, etc.

### 📐 Prettification
- Normalize function casing (e.g., `$getVar` → `$getvar`) for consistency.
- Based on your config and function metadata.

### ⚙️ Custom Config System
- Fully project-based configuration via `.vscode/forgevsc.config.json`.
- Controls autocompletion, syntax rules, themes, and more.

### 🧩 Custom Function Support
- Add your own ForgeScript-style functions with full IntelliSense:
  - Autocomplete, hover, signature help, and diagnostics.

### ✂️ Command Snippet Templates
Quick command snippets using prefix:
- `fsprefix` → prefix command
- `fsslash` → slash command
- `fsapi` → FAPI command
- `fscustom` → custom function command

---

## 🧪 Work In Progress

### 🔜 Coming Soon
- [ ] Auto-index custom functions from your `index.ts`
- [ ] Type checking support for argument types (`number`, `boolean`, `time`, etc.)

---

## ⚙️ Configuration

Add the following to your project root:

```

.vscode/forgevsc.config.json

````

Example config:

```json
{
  "prettier": true,
  "enabled": true,
  "diagnosticsEnabled": true,
  "syntax": {
    "colors": ["#a87ffb", "#b895fd", "#92A9FF", "#85CDF1"],
    "operators": ["!", "#", "@[]"]
  },
  "urls": {
    "forgescript": "tryforge/forgescript#dev",
    "forgedb": "tryforge/forgedb#dev",
    "forgeexpress": "zack-911/forgeexpress#dev",
    "forgecanvas": "tryforge/forgecanvas#dev"
  },
  "customFunctions": {
    "test": {
      "name": "test",
      "aliases": [],
      "description": "",
      "category": "",
      "brackets": false,
      "params": [
        {
          "name": "test",
          "required": true,
          "rest": false
        }
      ]
    }
  }
}
````

---

## 🧩 Custom Function Format

Custom functions support the following metadata:

* `name`: `string`
* `aliases`: `string[]`
* `description`: `string`
* `brackets`: `boolean`
* `params`: array of objects:

  * `name`: `string`
  * `type`: `string`
  * `required`: `boolean`
  * `rest`: `boolean`

---

## 💡 Why ForgeVSC?

ForgeVSC is built *for ForgeScript from the ground up* — not a generic language server.

* Fast, lightweight, and modular
* Made for ForgeScript creators and bot developers
* Designed to scale with the language’s evolution

---

## 📄 License

ForgeVSC Extension is licensed under a modified GPLv3.
© [Zack-911](https://github.com/zack-911)

See [`LICENSE.md`](https://github.com/zack-911/forgevsc/blob/main/LICENSE.md) for details.