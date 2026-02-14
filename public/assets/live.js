import { connectWS } from "./ws.js";
import { renderMarkdownSafe } from "./markdown.js";

const liveEl = document.getElementById("live-md");

function render(md) {
  if (!liveEl) return;
  const html = renderMarkdownSafe(md || "");
  liveEl.innerHTML = html || "";
}

connectWS({
  role: "live",
  onOpen() { setStatus("connected"); },
  onClose() { setStatus("reconnecting…"); },
  onMessage(msg) {
    if (msg.type === "markdown:state" || msg.type === "markdown:update") {
      render(msg.text);
    }
  }
});

// ws.js ожидает, что эта функция существует
window.setStatus = function setStatus(state) {
  // state может быть строкой/объектом — делаем максимально терпимо
  console.log("[live] status:", state);
};
