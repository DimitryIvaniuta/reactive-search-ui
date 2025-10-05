# Reactive Search — Frontend (React + TypeScript + Vite)

A minimal, production‑ready **WebSocket search UI** that connects to the Reactive Search backend
(`ws://localhost:8080/ws/search?userId=u1` by default), sends keystrokes, and renders debounced search results in a sticky‑header, flex‑grid layout.

---

## ✨ Features

* **React + TypeScript + Vite**
* **WebSocket** client with auto‑reconnect and client‑side micro‑debounce
* **Sticky** search bar & grid header; scrollable results body (pure CSS flex)
* Clickable **compile error links** in the terminal via `dev-with-links.mjs` (OSC‑8)
* Environment‑based configuration (`VITE_WS_URL`)

---

## 📦 Project Structure

```
reactive-search-ui/
├─ README.md
├─ package.json
├─ tsconfig.json
├─ tsconfig.node.json
├─ vite.config.ts
├─ .gitignore
├─ .env.example
├─ index.html
└─ src/
   ├─ main.tsx
   ├─ App.tsx
   ├─ app.css
   ├─ types.ts
   ├─ useWebSocket.ts
   └─ vite-env.d.ts
```

---

## 🔧 Prerequisites

* **Node.js 18+** (Node 20 recommended)
* A running backend on the URL configured by `VITE_WS_URL` (default: `ws://localhost:8080/ws/search?userId=u1`)

---

## 🚀 Getting Started

### 1) Clone & install

```bash
# HTTPS
git clone https://github.com/your-org/reactive-search-ui.git
cd reactive-search-ui

# Install deps (choose one)
npm ci    # or: npm i
# pnpm i  # or yarn
```

### 2) Configure environment

Create `.env` from the example and adjust if needed:

```bash
cp .env.example .env
```

`.env`:

```
VITE_WS_URL=ws://localhost:8080/ws/search?userId=u1
```

> Vite only exposes env vars prefixed with `VITE_`.

### 3) Dev server

```bash
npm run dev
# open the printed URL (default http://localhost:5173)
```

### 4) Production build & preview

```bash
npm run build   # outputs ./dist
npm run preview # serves ./dist on http://localhost:5174
```

---

## 🧠 How it Works

* **`useWebSocket.ts`** establishes a WS connection, auto‑reconnects with backoff, and exposes:

    * `sendTerm(term)`: micro‑debounced send of the current input
    * `results`: latest array of search items from the server
    * `state`: connection state (`connecting | open | closing | closed`)
    * `beginNewSearch()`: clears results immediately when typing starts
* **`App.tsx`** wires an `<input/>` (pinned) to `sendTerm` and renders results in a sticky header flex grid.
* The backend debounces again (server‑side) and broadcasts JSON arrays of `{ id, title, score, description? }`.

---

## 🖼️ UI/UX Details

* **Pinned elements**: search bar (`position: sticky; top: 0`) and grid header (`position: sticky; top: var(--search-h)`) remain fixed while the results scroll.
* **Flex grid**: `.grid-header` + `.grid-row` with `.cell` columns (`ID`, `Title`, `Description`, `Score`). Description wraps to avoid horizontal scrolling.
* **Immediate feedback**: results list is cleared as soon as the user starts typing or clears the field; new data arrives once the backend debounce window elapses.

---

## ⚙️ Scripts

```json
{
  "scripts": {
    "dev": "vite",
    "dev:links": "node ./dev-with-links.mjs",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port 5174"
  }
}
```

### Optional: clickable error links in console

Add `dev-with-links.mjs` in project root and run `npm run dev:links` for OSC‑8 hyperlinks to files/lines in supported terminals.

`dev-with-links.mjs` (snippet):

```js
#!/usr/bin/env node
import { spawn } from "child_process";
import path from "path";
import readline from "readline";

const vite = spawn("pnpm", ["exec", "vite", "--clearScreen=false"], {
  cwd: process.cwd(), shell: true, stdio: ["inherit", "pipe", "pipe"],
});
const fileRegex = /FILE\s+(([A-Za-z]:[\\/][^\s:]+|\.[\\/][^\s:]+|\/[^^\s:]+)):(\d+)(?::(\d+))?/g;
const stripAnsi = s => s.replace(/\x1B\[[0-9;]*[A-Za-z]/g, "");
function linkify(raw){
  const line = stripAnsi(raw);
  return line.replace(fileRegex, (m, file, _w, ln, col) => {
    const abs = path.resolve(file).replace(/\\/g, "/");
    const uri = `file:///${abs}:${ln}${col?`:${col}`:""}`;
    const OSC="\u001b]8;;", ST="\u001b\\", BLUE="\u001b[34m", RESET="\u001b[39m";
    const display = `FILE ${file}:${ln}${col?`:${col}`:""}`;
    return OSC+uri+ST+BLUE+display+RESET+OSC+ST;
  });
}
readline.createInterface({input: vite.stdout}).on("line", l=>console.log(linkify(l)));
readline.createInterface({input: vite.stderr}).on("line", l=>console.error(linkify(l)));
vite.on("close", code => process.exit(code));
```

> Works best in VS Code Terminal, Windows Terminal, iTerm2. If unsupported, you still see plain text.

---

## 🧩 Key Files

### `src/types.ts`

```ts
export type SearchResult = {
  id: number;
  title: string;
  score: number;
  description?: string;
};
```

### `src/vite-env.d.ts`

```ts
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WS_URL: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

### `src/useWebSocket.ts` (behavior summary)

* Opens WS to `import.meta.env.VITE_WS_URL`
* Auto‑reconnect with exponential backoff
* `sendTerm` debounces on the client (~120 ms)
* `beginNewSearch` clears current results instantly

### `src/App.tsx` (behavior summary)

* Shows WS URL and connection state
* Pinned Search input -> calls `beginNewSearch()` then `sendTerm()` on change
* Renders flex grid with sticky header and scrollable body

---

## 🧪 Manual Testing

1. Start backend on `:8080` and databases.
2. Ensure WS URL in `.env` is reachable: `VITE_WS_URL=ws://localhost:8080/ws/search?userId=u1`.
3. `npm run dev` and open the app.
4. Type: `iph`, then pause -> see iPhone results; type `sam` -> see Samsung results.

> Backend is responsible for debouncing and the actual search (FTS + prefix + ILIKE fallback). Frontend only sends current term and renders latest results.

---

## 🛠 Troubleshooting

* **`Cannot find @vitejs/plugin-react`** -> `npm i -D @vitejs/plugin-react` and verify `vite.config.ts` uses it.
* **`import.meta.env` type error** -> ensure `src/vite-env.d.ts` contains `/// <reference types="vite/client" />`.
* **No results arriving** -> check backend logs; WS must accept **text frames** with the raw term and return JSON arrays.
* **Pinned header moves horizontally** -> ensure CSS sets `overflow-x: hidden` on the scroll container and `min-width: 0` on flex rows/cells (included).
* **CORS/WS blocked in browser** -> use `ws://` for local, match ports, and confirm no proxy intercepts WS.

---

## 🔐 Production Notes

* Serve the built **`dist/`** behind your preferred static file server or reverse proxy.
* If backend URL differs between environments, set `VITE_WS_URL` at build time.
* Consider a lightweight error toast for WS disconnects / retries.

---

## 📜 License

MIT

## Contact

**Dimitry Ivaniuta** — [dzmitry.ivaniuta.services@gmail.com](mailto:dzmitry.ivaniuta.services@gmail.com) — [GitHub](https://github.com/DimitryIvaniuta)

