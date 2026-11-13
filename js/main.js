import { Game } from './game.js';

const canvas = document.getElementById('c');
const game = new Game(canvas);

const overlay = document.getElementById('overlay');
const gameover = document.getElementById('gameover');
const startBtn = document.getElementById('startBtn');
const retryBtn = document.getElementById('retryBtn');
const message = document.getElementById('message');

startBtn.addEventListener('click', () => {
  overlay.classList.add('hidden');
  message.style.opacity = '0.5';
  setTimeout(() => { message.style.opacity = '0'; }, 2500);
  game.start();
});

retryBtn.addEventListener('click', () => {
  gameover.classList.add('hidden');
  game.start();
});

// Prevent context menu on long press
canvas.addEventListener('contextmenu', e => e.preventDefault());
