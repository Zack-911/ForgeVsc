<h1 align="center">ForgeVSC</h1>

<p align="center">
  Powerful VS Code Extension for <strong>ForgeScript</strong> scripting with rich intellisense, hover info, signature help, and custom diagnostics.
</p>

<p align="center">
  <a href="https://wakatime.com"><img src="https://wakatime.com/badge/github/Zack-911/ForgeVsc.svg" alt="wakatime"></a>
  <a href="https://marketplace.visualstudio.com/items?itemName=Zack-911.forgescript-extension"><img src="https://img.shields.io/visual-studio-marketplace/v/Zack-911.forgescript-extension.svg?label=VS%20Code%20Marketplace" alt="Marketplace Version"></a>
  <a href="https://github.com/zack-911/forgevsc/blob/main/LICENSE"><img src="https://img.shields.io/github/license/zack-911/forgevsc.svg" alt="license"></a>
</p>

---

## 🚀 Features

### ✅ Dynamic Syntax Highlighting
- Define custom token operators, function names, and even add themed styling with full JSON control.

### ⚡ Autocomplete
- Get real-time suggestions for ForgeScript and your custom functions as you type.

### 🧠 Hover Info
- Hover over a function to see its description, argument details, aliases, bracket behavior, and examples.

### ✍️ Signature Info
- While your cursor is inside a function's brackets, you'll get:
  - All required and optional arguments.
  - Highlight of the current argument you're on.
  - Argument types, default values, and tips.

### ⚙️ Advanced Config System
- Customize highlighting, function aliases, operator tokens, function types, categories, and more using:
`.vscode/forgevsc.config.json`

### 🧩 Custom Function Support

* Define your own ForgeScript-like functions with metadata, and get full:

  * Autocompletion
  * Hover info
  * Signature info

---

## 🧪 Work In Progress

### 🔜 Upcoming Features

* [ ] Auto index `index.js` or `index.ts` for custom function definitions.
* [ ] Type checking for arguments and their types (e.g. numbers, booleans, time, etc).
* [ ] Smart IntelliSense for nested functions and conditionals.

---

## 🛠 Configuration

Place your config in:

```
.vscode/forgevsc.config.json
```

Example:

```json
{
  "enabled": true,
  "diagnosticsEnabled": true,
  "syntax": {
    "colors": [
      "#a87ffb",
      "#b895fd",
      "#92A9FF",
      "#85CDF1",
      "#708fff",
      "#77D5A3",
      "#FFD395",
      "#f7768e",
      "#fc8f8e",
      "#ffa23e",
      "#ffc26e",
      "#BD9CFE",
      "#c8aaff",
      "#9AC1F6",
      "#5A8CFF"
    ],
    "operators": ["!", "#", "@[]"]
  },
  "urls": {
    "forgescript": "tryforge/forgescript#dev",
    "forgedb": "tryforge/forgedb#dev",
    "forgeexpress": "zack-911/forgeexpress#dev",
    "forgecanvas": "tryforge/forgecanvas#dev"
  },
  "customFunctions": {
    "Example1": {
      "name": "customFunc1",
      "aliases": ["altFunc1", "altFunc2"],
      "description": "Does custom logic 1",
      "category": "customCategory",
      "brackets": true,
      "args": [
        {
          "name": "param1",
          "required": true,
          "rest": false
        },
        {
          "name": "param2",
          "required": false,
          "rest": false
        }
      ]
    },
    "Example2": {
      "name": "mySpecialFunc",
      "aliases": ["myAlias"],
      "description": "This one is special",
      "category": "specialCategory",
      "brackets": false,
      "args": [
        {
          "name": "input",
          "required": true,
          "rest": false
        }
      ]
    }
  }
}
```

---

## 🧩 Custom Function Metadata Format

Each custom function can include:

* `name`, `aliases`, `description`, `brackets`
* `args[]` array with `name`, `type`, `required`, and `rest`
* Automatically picked up by autocompletion and type checker

---

## 🧠 Why ForgeVSC?

ForgeScript is growing fast. ForgeVSC is designed to keep up with it — built from scratch for:

* Performance
* Customizability
* Real-time static analysis
* Developer happiness

---

## 📄 License

ForgeVsc Ext License (Modified GPL V3) © [Zack-911](https://github.com/zack-911)