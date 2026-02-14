import { connectWS } from "./ws.js";
import { renderMarkdownSafe } from "./markdown.js";

const liveEl = document.getElementById("live-md");
const liveTextEl = document.getElementById("live-text");

function adjustFontSize() {
  if (!liveEl || !liveTextEl) return;
  
  // Сбрасываем к базовому размеру и убираем ограничения
  liveEl.style.fontSize = '';
  liveEl.style.lineHeight = '';
  const originalOverflow = liveTextEl.style.overflow;
  liveTextEl.style.overflow = 'visible';
  
  // Ждём перерисовки
  setTimeout(() => {
    // Получаем реальную высоту контента без ограничений
    const contentHeight = liveEl.scrollHeight;
    const availableHeight = liveTextEl.clientHeight;
    
    console.log('Content height:', contentHeight, 'Available height:', availableHeight);
    
    // Восстанавливаем overflow
    liveTextEl.style.overflow = originalOverflow;
    
    if (contentHeight > 1024) {
      const scale = availableHeight / (1440*2);
      const baseFontSize = 2; // rem (текущий размер)
      console.log(scale);
      const newFontSize = Math.max(0.7, baseFontSize * scale); // 0.9 для отступов
      console.log(newFontSize);
      liveEl.style.fontSize = `${newFontSize}rem`;  
      liveEl.style.lineHeight = '1.3';
    }
  }, 0);
}

function render(md) {
  if (!liveEl) return;
  const html = renderMarkdownSafe(md || "");
  liveEl.innerHTML = html || "";
  adjustFontSize();
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

// Добавляем listener для изменения размера окна
window.addEventListener('resize', adjustFontSize);
