import { connectWS } from "./ws.js";
import { renderMarkdownSafe } from "./markdown.js";

const input = document.getElementById("markdownInput");

// Presence indicator in header (exists in admin.html)
const statusRing = document.getElementById("statusRing");
const statusDot  = document.getElementById("statusDot");
const statusText = document.getElementById("statusText");

function getToken() {
  const url = new URL(location.href);
  const q = url.searchParams.get("token");
  if (q) {
    localStorage.setItem("val_admin_token", q);
    return q;
  }
  const saved = localStorage.getItem("val_admin_token");
  if (saved) return saved;

  const t = prompt("Admin token:");
  if (t) localStorage.setItem("val_admin_token", t);
  return t || "";
}

function setPresence(isLive, liveCount) {
  if (!statusText || !statusRing || !statusDot) return;

  if (isLive) {
    statusRing.classList.remove("hidden");
    statusDot.classList.remove("bg-slate-500");
    statusDot.classList.add("bg-primary");

    statusText.classList.remove("text-slate-400");
    statusText.classList.add("text-primary");
    statusText.textContent = `Live: online (${liveCount})`;
  } else {
    statusRing.classList.add("hidden");
    statusDot.classList.remove("bg-primary");
    statusDot.classList.add("bg-slate-500");

    statusText.classList.remove("text-primary");
    statusText.classList.add("text-slate-400");
    statusText.textContent = "Live: offline";
  }
}

function setSyncStatus(s) {
  if (!statusText) return;
  statusText.textContent = s;
}

const token = getToken();
setPresence(false, 0);

const ws = connectWS({
  role: "admin",
  token,
  onOpen() { setSyncStatus("Live Sync Active"); },
  onClose() { setSyncStatus("Reconnecting…"); },
  onMessage(msg) {
    console.log("Admin received:", msg);
    if (msg.type === "presence") {
      setPresence(!!msg.isLive, Number(msg.liveCount || 0));
      return;
    }

    if (msg.type === "error") {
      setPresence(false, 0);
      return;
    }

    if (msg.type === "markdown:state") {
      if (input && typeof msg.text === "string" && input.value !== msg.text) input.value = msg.text;
    }
  },
  onError() { setSyncStatus("Connection error"); }
});

let t = null;
function sendUpdateNow() {
  if (!input) return;
  ws.send({ type: "markdown:update", text: input.value });
}

input?.addEventListener("input", () => {
  // throttle to avoid spamming
  clearTimeout(t);
  t = setTimeout(sendUpdateNow, 60);
});

// Send initial content once loaded
setTimeout(sendUpdateNow, 200);