import * as THREE from 'three';

export const LANES = [-2.2, 0, 2.2];
export const LANE_COUNT = 3;

export function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function randomLane() {
  return Math.floor(Math.random() * LANE_COUNT);
}

export function createBox(w, h, d, color, y = 0) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.1 });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = y + h / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

// Simple gold coin (procedural so it always works)
export function createCoin() {
  const geo = new THREE.CylinderGeometry(0.35, 0.35, 0.08, 16);
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    emissive: 0xaa7700,
    emissiveIntensity: 0.4,
    metalness: 0.9,
    roughness: 0.25
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.rotation.x = Math.PI / 2;
  mesh.castShadow = true;
  return mesh;
}

export function createTrain(length = 6) {
  const group = new THREE.Group();

  // Body
  const body = createBox(1.8, 2.2, length, 0x2a6fdb, 0);
  group.add(body);

  // Roof
  const roof = createBox(1.9, 0.25, length + 0.1, 0x1a4a9c, 2.2);
  group.add(roof);

  // Windows
  const winMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6 });
  for (let i = 0; i < 3; i++) {
    const win = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.7, 1.2), winMat);
    win.position.set(0.95, 1.4, -length / 2 + 1.5 + i * 1.6);
    group.add(win);
    const win2 = win.clone();
    win2.position.x = -0.95;
    group.add(win2);
  }

  // Front
  const front = createBox(1.7, 1.8, 0.3, 0x1e5bb8, 0.2);
  front.position.z = length / 2 + 0.1;
  group.add(front);

  group.userData.isObstacle = true;
  group.userData.height = 2.4;
  return group;
}

export function createBarrier() {
  const group = new THREE.Group();
  const bar = createBox(1.6, 1.1, 0.4, 0xe63946, 0);
  group.add(bar);
  // Stripes
  const stripe = createBox(1.65, 0.25, 0.42, 0xffffff, 0.4);
  group.add(stripe);
  group.userData.isObstacle = true;
  group.userData.height = 1.2;
  return group;
}
