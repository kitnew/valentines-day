import { } from "./ws.js"; // reserved (not used on this screen)

const noBtn = document.getElementById("no-btn");
const yesBtn = document.getElementById("yes-btn");
const overlay = document.getElementById("success-overlay");
const heartsContainer = document.getElementById("hearts-container");
const continueBtn = document.getElementById("continue-btn");

function moveNoButton() {
  if (!noBtn) return;
  const maxX = window.innerWidth - noBtn.offsetWidth - 50;
  const maxY = window.innerHeight - noBtn.offsetHeight - 50;

  const randomX = Math.random() * maxX;
  const randomY = Math.random() * maxY;

  noBtn.style.position = "fixed";
  noBtn.style.left = Math.max(20, randomX) + "px";
  noBtn.style.top = Math.max(20, randomY) + "px";

  const rotation = (Math.random() - 0.5) * 20;
  noBtn.style.transform = `rotate(${rotation}deg)`;
}

function createHearts() {
  if (!heartsContainer) return;
  heartsContainer.innerHTML = "";
  const emojis = ["❤️","💖","💘","💝","💓","💗","💕"];

  for (let i = 0; i < 50; i++) {
    const heart = document.createElement("div");
    heart.innerText = emojis[Math.floor(Math.random() * emojis.length)];
    heart.classList.add("heart-emoji");

    const left = Math.random() * 100;
    const animDuration = 3 + Math.random() * 4;
    const delay = Math.random() * 2;
    const fontSize = 20 + Math.random() * 40;

    heart.style.left = `${left}%`;
    heart.style.animationDuration = `${animDuration}s`;
    heart.style.animationDelay = `${delay}s`;
    heart.style.fontSize = `${fontSize}px`;

    heartsContainer.appendChild(heart);
  }
}

function showOverlay() {
  overlay?.classList.add("visible");
  createHearts();
}

noBtn?.addEventListener("mouseover", moveNoButton);
noBtn?.addEventListener("touchstart", (e) => { e.preventDefault(); moveNoButton(); });
noBtn?.addEventListener("click", (e) => { e.preventDefault(); moveNoButton(); });

yesBtn?.addEventListener("click", () => {
  showOverlay();
});

continueBtn?.addEventListener("click", () => {
  location.href = "/live.html";
});
