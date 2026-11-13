import * as THREE from 'three';
import { Player } from './player.js';
import { World } from './world.js';

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.running = false;
    this.score = 0;
    this.coins = 0;
    this.clock = new THREE.Clock();

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setClearColor(0x0a0a12);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 120);
    this.camera.position.set(0, 4.5, 8);
    this.camera.lookAt(0, 1, -10);

    this.player = new Player(this.scene);
    this.world = new World(this.scene);

    this.bindInput();
    window.addEventListener('resize', () => this.onResize());
  }

  bindInput() {
    window.addEventListener('keydown', (e) => {
      if (!this.running) return;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.player.setLane(-1);
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.player.setLane(1);
      if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') {
        e.preventDefault();
        this.player.jump();
      }
    });

    let startX = 0, startY = 0;
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    }, { passive: true });

    this.canvas.addEventListener('touchend', (e) => {
      if (!this.running) return;
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        this.player.setLane(dx > 0 ? 1 : -1);
      } else if (dy < -40) {
        this.player.jump();
      }
    }, { passive: true });
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  start() {
    this.running = true;
    this.score = 0;
    this.coins = 0;
    this.player.reset();
    this.world.reset();
    this.clock.start();
    this.loop();
  }

  stop() {
    this.running = false;
  }

  loop = () => {
    if (!this.running) return;
    requestAnimationFrame(this.loop);

    const dt = Math.min(this.clock.getDelta(), 0.05);

    this.player.update(dt);
    const result = this.world.update(dt, this.player);

    if (result.coin) {
      this.coins += result.coin;
      this.score += result.coin * 50;
      document.getElementById('coins').textContent = `🪙 ${this.coins}`;
    }

    this.score += Math.floor(this.world.speed * dt * 2);
    document.getElementById('score').textContent = this.score;

    this.camera.position.x = THREE.MathUtils.lerp(this.camera.position.x, this.player.x * 0.4, 0.08);
    this.camera.position.y = 4.2 + this.player.y * 0.3;
    this.camera.lookAt(this.player.x * 0.3, 1.2 + this.player.y * 0.4, -8);

    if (result.hit) {
      this.player.die();
      this.running = false;
      document.getElementById('finalScore').textContent = `Score: ${this.score}  •  Coins: ${this.coins}`;
      document.getElementById('gameover').classList.remove('hidden');
    }

    this.renderer.render(this.scene, this.camera);
  };
}
