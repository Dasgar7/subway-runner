import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { SkeletonUtils } from 'three/addons/utils/SkeletonUtils.js';
import { LANES, lerp } from './utils.js';

const CHAR_URL = 'https://gobkit.com/freebies/human001/FoodCourier.glb';

export class Player {
  constructor(scene) {
    this.scene = scene;
    this.mesh = null;
    this.mixer = null;
    this.actions = {};
    this.currentAction = null;

    this.lane = 1;
    this.targetX = LANES[1];
    this.x = 0;
    this.y = 0;
    this.vy = 0;
    this.isJumping = false;
    this.isSliding = false;
    this.slideTimer = 0;
    this.alive = true;
    this.ready = false;

    this.load();
  }

  async load() {
    const loader = new GLTFLoader();
    try {
      const gltf = await loader.loadAsync(CHAR_URL);
      this.mesh = gltf.scene;
      this.mesh.scale.setScalar(1.35);
      this.mesh.rotation.y = Math.PI;
      this.mesh.position.set(0, 0, 0);
      this.mesh.traverse(c => {
        if (c.isMesh) {
          c.castShadow = true;
          c.receiveShadow = true;
        }
      });

      this.mixer = new THREE.AnimationMixer(this.mesh);
      gltf.animations.forEach(clip => {
        const name = clip.name.toLowerCase();
        this.actions[name] = this.mixer.clipAction(clip);
      });

      if (this.actions['run']) {
        this.play('run');
      } else if (this.actions['walk']) {
        this.play('walk');
      } else {
        const first = Object.values(this.actions)[0];
        if (first) first.play();
      }

      this.scene.add(this.mesh);
      this.ready = true;
    } catch (err) {
      console.warn('Character load failed, using fallback', err);
      this.createFallback();
    }
  }

  createFallback() {
    const group = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.35, 0.9, 4, 8),
      new THREE.MeshStandardMaterial({ color: 0xff6b35 })
    );
    body.position.y = 0.8;
    body.castShadow = true;
    group.add(body);
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xffdbac })
    );
    head.position.y = 1.55;
    head.castShadow = true;
    group.add(head);
    this.mesh = group;
    this.scene.add(this.mesh);
    this.ready = true;
  }

  play(name) {
    const action = this.actions[name];
    if (!action || this.currentAction === action) return;
    if (this.currentAction) this.currentAction.fadeOut(0.2);
    action.reset().fadeIn(0.2).play();
    this.currentAction = action;
  }

  setLane(dir) {
    if (!this.alive) return;
    this.lane = Math.max(0, Math.min(2, this.lane + dir));
    this.targetX = LANES[this.lane];
  }

  jump() {
    if (!this.alive || this.isJumping) return;
    this.isJumping = true;
    this.vy = 9.5;
    this.play('jump' in this.actions ? 'jump' : 'run');
  }

  update(dt) {
    if (!this.mesh || !this.ready) return;

    this.x = lerp(this.x, this.targetX, 1 - Math.pow(0.001, dt));
    this.mesh.position.x = this.x;

    if (this.isJumping) {
      this.vy -= 28 * dt;
      this.y += this.vy * dt;
      if (this.y <= 0) {
        this.y = 0;
        this.vy = 0;
        this.isJumping = false;
        this.play('run');
      }
    }
    this.mesh.position.y = this.y;

    if (this.mixer) this.mixer.update(dt);
  }

  getHitbox() {
    return {
      x: this.x,
      y: this.y,
      z: 0,
      w: 0.7,
      h: this.isJumping ? 1.8 : 1.6
    };
  }

  die() {
    this.alive = false;
    this.play('death');
  }

  reset() {
    this.lane = 1;
    this.targetX = LANES[1];
    this.x = 0;
    this.y = 0;
    this.vy = 0;
    this.isJumping = false;
    this.alive = true;
    if (this.mesh) {
      this.mesh.position.set(0, 0, 0);
    }
    this.play('run');
  }
}
