<h1 align="center">ForgeVSC</h1>

<p align="center">
  Powerful VS Code Extension for <strong>ForgeScript</strong> scripting — with rich intellisense, custom diagnostics, syntax highlighting, and more.
</p>

<p align="center">
  <a href="https://wakatime.com"><img src="https://wakatime.com/badge/github/Zack-911/ForgeVsc.png" alt="wakatime"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=Zack-911.forgescript-extension"><img src="https://img.shields.io/visual-studio-marketplace/v/Zack-911.forgescript-extension.png?label=VS%20Code%20Marketplace" alt="Marketplace Version"></a>
  <a href="https://github.com/zack-911/forgevsc/blob/main/LICENSE.md"><img src="https://img.shields.io/github/license/zack-911/forgevsc.png" alt="license"></a>
</p>

---

## 🚀 Features

### ✅ Dynamic Syntax Highlighting
- Customize token colors, operator styles, and dynamic syntax rules using full JSON config.

### ⚡ Intelligent Autocompletion
- Suggests ForgeScript functions, events, and your custom functions as you type.
- Function and event completion providers are modular and optimized for performance.

### 🧠 Hover Information
- Hover over a function to see its description, aliases, brackets, arguments, and return types.

### ✍️ Signature Help
- Inside function brackets, see current argument details:
  - Name, required/optional, type hints, rest status, and tips.

### 🛠 Type-Aware Diagnostics
- Detect missing/invalid arguments or types live as you code.
- Upcoming full type validation support (booleans, numbers, time formats, etc.)

### 📐 Prettification Support
- Normalize inconsistent function casing in diagnostics/autocomplete.
- Ensures your function names match metadata and config.

### ⚙️ Custom Config System
- One config powers it all: autocompletion, diagnostics, theme rules, aliases, and function metadata.
- Fully supports per-project configuration with `.vscode/forgevsc.config.json`.

### 🧩 Custom Function Support
- Define your own ForgeScript-like functions with full intellisense:
  - Autocompletion
  - Hover info
  - Signature help
  - Type checking (soon)

---

## 📦 Work In Progress

### 🔜 Upcoming
- [ ] Auto-index custom function definitions from your `index.ts`
- [ ] Type checking for argument types (`number`, `boolean`, `time`, etc.)

---

## ⚙️ Configuration

Place this in your project root:

```plaintext
.vscode/forgevsc.config.json
```

Example:

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
```

---

## 📘 Custom Function Format

Each custom function supports:

* `name`: string
* `aliases`: string\[]
* `description`: string
* `brackets`: boolean
* `params`: array of:

  * `name`: string
  * `type`: string
  * `required`: boolean
  * `rest`: boolean

---

## 💡 Why ForgeVSC?

Built for ForgeScript from the ground up — no generic language servers. It’s:

* Fast, lightweight, and modular
* Built for creators and bot developers
* Designed to scale with ForgeScript’s future

---

## 📄 License

ForgeVSC Extension License (Modified GPLv3) © [Zack-911](https://github.com/zack-911)

Read full terms in [`LICENSE.md`](https://github.com/zack-911/forgevsc/blob/main/LICENSE.md)