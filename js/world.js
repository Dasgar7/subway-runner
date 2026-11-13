import * as THREE from 'three';
import { LANES, randomLane, createCoin, createTrain, createBarrier } from './utils.js';

export class World {
  constructor(scene) {
    this.scene = scene;
    this.speed = 18;
    this.distance = 0;
    this.obstacles = [];
    this.coins = [];
    this.trackPieces = [];
    this.spawnZ = -40;
    this.lastSpawn = 0;

    this.buildEnvironment();
  }

  buildEnvironment() {
    const groundGeo = new THREE.PlaneGeometry(14, 200);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a1a22, roughness: 0.9 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.z = -80;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const railMat = new THREE.MeshStandardMaterial({ color: 0x555566, metalness: 0.7, roughness: 0.3 });
    for (const x of [-2.2, 0, 2.2]) {
      for (const side of [-0.35, 0.35]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 200), railMat);
        rail.position.set(x + side, 0.04, -80);
        this.scene.add(rail);
      }
      for (let z = 0; z > -180; z -= 2.5) {
        const sleeper = new THREE.Mesh(
          new THREE.BoxGeometry(1.1, 0.08, 0.3),
          new THREE.MeshStandardMaterial({ color: 0x3a2a1a })
        );
        sleeper.position.set(x, 0.02, z);
        this.scene.add(sleeper);
      }
    }

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x2a2a38, roughness: 0.8 });
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 200), wallMat);
    leftWall.position.set(-6, 4, -80);
    this.scene.add(leftWall);
    const rightWall = leftWall.clone();
    rightWall.position.x = 6;
    this.scene.add(rightWall);

    this.scene.fog = new THREE.Fog(0x0a0a12, 25, 90);

    const ambient = new THREE.AmbientLight(0x404060, 0.6);
    this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xfff0dd, 1.2);
    dir.position.set(5, 12, 5);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.near = 1;
    dir.shadow.camera.far = 40;
    dir.shadow.camera.left = -10;
    dir.shadow.camera.right = 10;
    dir.shadow.camera.top = 10;
    dir.shadow.camera.bottom = -10;
    this.scene.add(dir);

    const fill = new THREE.DirectionalLight(0x6688cc, 0.4);
    fill.position.set(-4, 6, -2);
    this.scene.add(fill);
  }

  spawnObstacle() {
    const lane = randomLane();
    const type = Math.random() < 0.55 ? 'train' : 'barrier';
    let obj;
    if (type === 'train') {
      obj = createTrain(5 + Math.random() * 3);
    } else {
      obj = createBarrier();
    }
    obj.position.set(LANES[lane], 0, this.spawnZ);
    obj.userData.lane = lane;
    this.scene.add(obj);
    this.obstacles.push(obj);
  }

  spawnCoin() {
    const lane = randomLane();
    const coin = createCoin();
    coin.position.set(LANES[lane], 1.1, this.spawnZ - 5 - Math.random() * 8);
    this.scene.add(coin);
    this.coins.push(coin);
  }

  update(dt, player) {
    this.distance += this.speed * dt;
    this.speed = Math.min(36, 18 + this.distance * 0.012);

    const move = this.speed * dt;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const o = this.obstacles[i];
      o.position.z += move;
      if (o.position.z > 12) {
        this.scene.remove(o);
        this.obstacles.splice(i, 1);
      }
    }

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      c.position.z += move;
      c.rotation.z += dt * 4;
      if (c.position.z > 10) {
        this.scene.remove(c);
        this.coins.splice(i, 1);
      }
    }

    this.lastSpawn += move;
    if (this.lastSpawn > 12 + Math.random() * 6) {
      this.spawnObstacle();
      if (Math.random() < 0.7) this.spawnCoin();
      this.lastSpawn = 0;
    }

    if (!player.alive) return { hit: false, coin: 0 };

    const hb = player.getHitbox();
    let coinCollected = 0;

    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      const dx = Math.abs(c.position.x - hb.x);
      const dz = Math.abs(c.position.z - hb.z);
      const dy = Math.abs(c.position.y - (hb.y + 0.8));
      if (dx < 0.7 && dz < 0.8 && dy < 1.2) {
        this.scene.remove(c);
        this.coins.splice(i, 1);
        coinCollected++;
      }
    }

    for (const o of this.obstacles) {
      const dx = Math.abs(o.position.x - hb.x);
      const dz = Math.abs(o.position.z - hb.z);
      if (dx < 1.0 && dz < 2.8) {
        if (o.userData.height && o.userData.height < 1.5 && hb.y > 1.0) {
          continue;
        }
        return { hit: true, coin: coinCollected };
      }
    }

    return { hit: false, coin: coinCollected };
  }

  reset() {
    for (const o of this.obstacles) this.scene.remove(o);
    for (const c of this.coins) this.scene.remove(c);
    this.obstacles = [];
    this.coins = [];
    this.speed = 18;
    this.distance = 0;
    this.lastSpawn = 0;
    this.spawnZ = -40;
  }
}
