import http from "http";
import path from "path";
import fs from "fs";
import express from "express";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "changeme";

// ---- persistence (optional) ----
const dataDir = path.join(__dirname, "data");
const stateFile = path.join(dataDir, "state.json");
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

let state = { version: 0, markdown: "" };
try {
  const raw = fs.readFileSync(stateFile, "utf-8");
  const parsed = JSON.parse(raw);
  if (typeof parsed?.markdown === "string") state = { version: Number(parsed.version || 0), markdown: parsed.markdown };
} catch { /* ignore */ }

let persistTimer = null;
function persistSoon() {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    try { fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), "utf-8"); } catch {}
  }, 250);
}

// ---- static hosting ----
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir, { extensions: ["html"] }));

app.get("/health", (_, res) => res.json({ ok: true }));

// ---- WebSocket ----
const wss = new WebSocketServer({ server, path: "/ws" });

let admin = null;               // single admin connection
const viewers = new Set();      // anyone who views markdown
const liveViewers = new Set();  // only live.html connections (role=live)

function sendToAdmin(payload) {
  if (admin && admin.readyState === admin.OPEN) {
    admin.send(JSON.stringify(payload));
  }
}

function pushPresence() {
  sendToAdmin({
    type: "presence",
    liveCount: liveViewers.size,
    isLive: liveViewers.size > 0,
  });
}

function send(ws, obj) {
  if (ws?.readyState === ws.OPEN) ws.send(JSON.stringify(obj));
}
function broadcastViewers(obj) {
  const msg = JSON.stringify(obj);
  for (const ws of viewers) {
    if (ws.readyState === ws.OPEN) ws.send(msg);
  }
}

function parseQuery(reqUrl) {
  try {
    const u = new URL(reqUrl, "http://localhost");
    return Object.fromEntries(u.searchParams.entries());
  } catch {
    return {};
  }
}

console.log("chuj");

wss.on("connection", (ws, req) => {
  const q = parseQuery(req.url);
  const role = q.role || "viewer";

  console.log("Viewer connected:", role);
  // role: admin requires token
  if (role === "admin") {
    if ((q.token || "") !== ADMIN_TOKEN) {
      send(ws, { type: "error", message: "unauthorized" });
      ws.close(4001, "unauthorized");
      return;
    }
    // Replace previous admin
    try { admin?.close(4000, "replaced"); } catch {}
    admin = ws;
    send(ws, { type: "markdown:state", text: state.markdown, version: state.version });
    send(ws, { type: "presence", liveCount: liveViewers.size, isLive: liveViewers.size > 0 });
  } else {
    viewers.add(ws);
    if (role === "live") liveViewers.add(ws);
    send(ws, { type: "markdown:state", text: state.markdown, version: state.version });
    pushPresence();
  }

  ws.on("message", (data) => {
    let msg = null;
    try { msg = JSON.parse(String(data)); } catch { return; }
    console.log("Viewer received:", msg);

    // only admin is allowed to update
    if (msg?.type === "markdown:update") {
      if (ws !== admin) return;
      const text = typeof msg.text === "string" ? msg.text : "";
      state.markdown = text;
      state.version += 1;
      persistSoon();
      broadcastViewers({ type: "markdown:update", text: state.markdown, version: state.version });
      return;
    }

    // (reserved) WebRTC signaling relay (optional)
    if (msg?.type?.startsWith("webrtc:")) {
      if (ws === admin) {
        // send to all viewers (usually 1)
        broadcastViewers(msg);
      } else {
        // send to admin
        if (admin) send(admin, msg);
      }
      return;
    }
  });

  ws.on("close", () => {
    console.log("Viewer disconnected:", role);
    if (ws === admin) admin = null;
    viewers.delete(ws);
    liveViewers.delete(ws);
    pushPresence();
  });
});

server.listen(PORT, () => {
  console.log(`Valentine Live server running on http://localhost:${PORT}`);
  console.log(`ADMIN_TOKEN: ${ADMIN_TOKEN === "changeme" ? "changeme (set env ADMIN_TOKEN!)" : "(set)"} `);
});
