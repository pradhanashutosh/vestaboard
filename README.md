<div align="center">

# 📋 Vestaboard MVP

**A software-only, LAN-only split-flap message board. Type on your phone, watch it flip on the TV.**

[![Node](https://img.shields.io/badge/node-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-realtime-black?logo=socket.io)](https://socket.io/)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

[Quickstart](#-quickstart) · [How it works](#-how-it-works) · [Config](#-board-config) · [Troubleshooting](#-troubleshooting)

</div>

---

## 🧨 Why

Real Vestaboards are gorgeous and cost $2,000+. This is the software version: a
Node/Socket.IO server plus a React display, running entirely on your own Wi-Fi.
No cloud, no accounts, no subscription — type a message on your laptop or
phone, it flips onto whatever screen you point at a TV, in well under a
second.

| | Real Vestaboard | **This** |
|---|---|---|
| **Price** | $2,000+ | **$0** |
| **Requires** | Their hardware + subscription | **A laptop and a TV browser** |
| **Network** | Cloud | **Your LAN only** |
| **Source** | Closed | **MIT, read every line** |

## ✨ Features

- Realtime updates over Socket.IO — type, hit Send, TV updates in <100ms on LAN
- Per-character split-flap animation — only the tiles that changed flip
- Procedurally synthesized mechanical flap sound (Web Audio API — no mp3
  assets, no two flaps ever sound identical)
- Board size presets (22×6, 22×8, 16×8, 40×8, 40×24), alignment, word wrap,
  animation speed, sound/volume — all live from the Admin page
- TV Display page: fullscreen, cursor hidden, screen wake lock, auto-reconnect
  if Wi-Fi drops

**Not included** (cut to ship the MVP first): message history, QR pairing,
Docker packaging, clock/weather widgets. The board config schema is built so
these bolt on later without a redesign.

---

## 📋 Prerequisites

| Tool | Why | Check |
|------|-----|-------|
| **Node.js 18+** | Runtime for both server and client | `node --version` |
| **npm** | Workspace install/build | `npm --version` |
| A TV, phone, and laptop **on the same Wi-Fi** | This is LAN-only, no cloud fallback | — |

---

## 🚀 Quickstart

### Step 1 — Clone

```bash
git clone https://github.com/pradhanashutosh/vestaboard.git
cd vestaboard
```

### Step 2 — Install

```bash
npm install
```

### Step 3 — Run

```bash
npm run dev
```

This starts the API/WebSocket server (`:3001`) and the client dev server
(`:3000`, which proxies `/socket.io` and `/api` to the server).

Find your machine's LAN IP:

```bash
# macOS
ipconfig getifaddr en0
```

Then, on the same Wi-Fi:
- **Admin** (laptop/phone): `http://<your-ip>:3000`
- **TV**: open `http://<your-ip>:3000/display`, tap the screen once ("Tap to
  start" — unlocks audio + fullscreen, required by browser autoplay policy),
  then leave it open.

Type a message on Admin, hit **Send** — the TV updates in well under a second.

### Production (single port)

Builds the client into static files served directly by the Node server, so
only one port needs to be reachable from the TV:

```bash
npm run build
PORT=3001 npm start
```

Then open `http://<your-ip>:3001` (admin) and `http://<your-ip>:3001/display`
(TV) on that same port.

---

## 🔧 How it works

**Split-flap animation.** Each tile independently diffs its target character
against what it's currently showing, then flips through a capped sequence of
intermediate characters — sampled from the physical flap order in
[`shared/src/charset.ts`](shared/src/charset.ts) — using a front/back 3D card
rotation. A single-letter change animates only that tile; a full
alphabet-spanning jump still lands in well under a second.

**Sound.** No mp3 files. [`client/src/lib/sound.ts`](client/src/lib/sound.ts)
synthesizes each clack from a Web Audio noise buffer: a high "flutter" layer
(the plastic card flip) plus a low "thunk" layer (mechanical body), both
randomized in pitch/timing per play. A `DynamicsCompressorNode` gives headroom
so a full-board update (dozens of tiles flipping at once) doesn't clip.

**Realtime sync.** The server ([`server/src/index.ts`](server/src/index.ts))
holds one in-memory `BoardState` and broadcasts it over Socket.IO on every
change — no database, no per-client state to reconcile.

---

## 📐 Board config

Everything below is controlled live from the Admin page and broadcast to
every connected display:

| Setting | Options |
|---|---|
| Board size | 22×6, 22×8, 16×8, 40×8, 40×24 |
| Horizontal align | left, center, right |
| Vertical align | top, middle, bottom |
| Word wrap | on/off |
| Animation speed | 15–200ms per flap step |
| Sound | on/off + volume (applies to the TV, not the admin device) |

## Project structure

```
shared/   BoardState types, flap-sequence charset, text→grid layout logic
server/   Express + Socket.IO, in-memory board state (single board, LAN only)
client/   Vite + React + TypeScript + Tailwind + Framer Motion
  src/pages/Admin.tsx     admin controls
  src/pages/Display.tsx   TV fullscreen view
  src/components/         Board grid + FlapTile split-flap animation
  src/lib/sound.ts        Web Audio synthesized flap sound engine
  src/lib/flapQueue.ts    computes the intermediate chars a tile flips through
```

---

## 🩺 Troubleshooting

- **TV shows a dark/blank screen after tapping "Tap to start":** older TV
  browsers (e.g. LG webOS pre-2021) sometimes lack modern APIs the page
  depends on — board sizing is computed in JS rather than CSS `aspect-ratio`
  specifically to work around this, and the unlock handler tolerates a
  missing Web Audio or Fullscreen API. If it's still dark, check your TV's
  browser/OS version.
- **TV stuck on "Reconnecting…":** first confirm plain HTTP works — load
  `http://<your-ip>:3000/api/health` on the TV; if that hangs too, it's a
  network issue (guest network / AP client isolation), not the app. If health
  loads fine but the socket doesn't connect, the TV browser may be blocking a
  raw WebSocket handshake — the client already falls back to HTTP polling by
  default.
- **Admin can't reach the board:** confirm both devices are on the same
  Wi-Fi (not a guest network that isolates clients) and no firewall is
  blocking the port.
- **Silent flaps:** volume/mute is a TV-side setting controlled from Admin —
  check the Sound field there.

## License

MIT
