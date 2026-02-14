// Minimal WS client with auto-reconnect (viewer/admin)
export function connectWS({ role, token, onOpen, onClose, onMessage, onError }) {
  const params = new URLSearchParams({ role });
  if (token) params.set("token", token);

  const proto = location.protocol === "https:" ? "wss" : "ws";
  const url = `${proto}://${location.host}/ws?${params.toString()}`;

  let ws = null;
  let closedByUser = false;
  let attempt = 0;

  function backoffMs(n) {
    const base = Math.min(1000 * 2 ** n, 10_000);
    const jitter = Math.floor(Math.random() * 250);
    return base + jitter;
  }

  function open() {
    ws = new WebSocket(url);

    ws.addEventListener("open", () => {
      attempt = 0;
      onOpen?.(ws);
    });

    ws.addEventListener("message", (ev) => {
      let msg = null;
      try { msg = JSON.parse(ev.data); } catch { return; }
      onMessage?.(msg, ws);
    });

    ws.addEventListener("close", (ev) => {
      onClose?.(ev);
      if (!closedByUser) setTimeout(open, backoffMs(attempt++));
    });

    ws.addEventListener("error", (err) => onError?.(err));
  }

  open();

  return {
    send(obj) {
      if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
    },
    close() {
      closedByUser = true;
      try { ws?.close(); } catch {}
    },
    get socket() { return ws; }
  };
}
