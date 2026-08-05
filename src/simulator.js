import * as THREE from 'three';
import { ROOM, SIM, COLOR } from './spec.js';
import { box, boxFromTo, cyl, sphere, group } from './helpers.js';

// Large matte impact / projection screen on the right wall (X=W), one per bay,
// framed by teal quilted padding to match the real bays.
function impactScreen(M, z0, z1) {
  const g = new THREE.Group();
  const margin = 0.28, yBot = 0.22, yTop = 2.6;
  const w = (z1 - z0) - margin*2, h = yTop - yBot;
  // teal padded surround on the screen wall
  g.add(boxFromTo(ROOM.W-0.16, 0, z0+0.02, ROOM.W-0.02, ROOM.H, z1-0.02, M.paddingSim));
  // screen (emissive course image), facing -X
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(w, h), M.screen);
  screen.rotation.y = -Math.PI/2;
  screen.position.set(ROOM.W-0.17, (yBot+yTop)/2, (z0+z1)/2);
  g.add(screen);
  // thin dark bezel
  const bz = new THREE.MeshStandardMaterial({ color:0x0a0b0d, roughness:0.5 });
  const t=0.04;
  g.add(box(0.02, h+2*t, t, bz, ROOM.W-0.165, (yBot+yTop)/2, (z0+z1)/2 - w/2 - t/2));
  g.add(box(0.02, h+2*t, t, bz, ROOM.W-0.165, (yBot+yTop)/2, (z0+z1)/2 + w/2 + t/2));
  g.add(box(0.02, t, w, bz, ROOM.W-0.165, yTop+t/2, (z0+z1)/2));
  g.add(box(0.02, t, w, bz, ROOM.W-0.165, yBot-t/2, (z0+z1)/2));
  return g;
}

// Green hitting mat with a tee + ball on the turf. Fully MATTE — no env-map
// reflections (the turf must read like flat artificial grass, not wet plastic).
function teeMat(M, xc, zc) {
  const g = new THREE.Group();
  // Each flat layer gets its OWN Y band (no two coplanar same-facing surfaces) so
  // the renderer never z-fights on the hitting ground.
  const turfMat = new THREE.MeshStandardMaterial({color:0x2f6128, roughness:1.0, metalness:0.0, envMapIntensity:0.0});
  g.add(box(2.0, 0.030, 1.6, turfMat,   xc,     0.021, zc));   // landing turf      (0.006 .. 0.036)
  g.add(box(0.9, 0.026, 0.9, M.turfTee, xc-0.2, 0.049, zc));   // tee mat ON turf   (0.036 .. 0.062)
  g.add(box(0.46,0.004,0.03, new THREE.MeshStandardMaterial({color:0xffffff}), xc-0.2, 0.064, zc)); // alignment stripe (0.062 .. 0.066)
  g.add(cyl(0.008,0.008,0.05, new THREE.MeshStandardMaterial({color:0xffffff}), 8).translateX(xc-0.2).translateY(0.087).translateZ(zc+0.18)); // tee peg
  g.add(sphere(0.021, new THREE.MeshStandardMaterial({color:0xffffff, roughness:0.4}), 16).translateX(xc-0.2).translateY(0.100).translateZ(zc+0.18)); // ball on tee
  return g;
}

// Black simulator console box (PC tower) standing on the turf.
function pcTower(M, x, z) {
  const g = new THREE.Group();
  g.add(box(0.30, 0.62, 0.50, new THREE.MeshStandardMaterial({color:0x141518, roughness:0.5, metalness:0.3}), x, 0.31, z));
  g.add(box(0.02, 0.42, 0.02, new THREE.MeshStandardMaterial({color:COLOR.orange, emissive:COLOR.orange, emissiveIntensity:0.5}), x-0.16, 0.34, z)); // accent strip
  g.add(sphere(0.012, new THREE.MeshStandardMaterial({color:0x35ff6a, emissive:0x35ff6a, emissiveIntensity:0.8}),8).translateX(x-0.151).translateY(0.56).translateZ(z+0.18));
  return g;
}

// Ceiling-mounted projector + overhead launch monitor over a bay.
function overhead(M, z0, z1) {
  const g = new THREE.Group();
  const zc=(z0+z1)/2, y=2.84;
  g.add(box(0.12,0.1,(z1-z0)-0.6, M.steel, 7.4, y, zc));                  // cross beam
  for (const z of [zc-0.6, zc+0.6]) g.add(box(0.05,0.16,0.05, M.steel, 7.4, y-0.13, z)); // hangers
  // projector aimed at screen
  g.add(box(0.34,0.16,0.22, new THREE.MeshStandardMaterial({color:0x101113,roughness:0.5}), 7.6, y-0.16, zc-0.7));
  g.add(cyl(0.05,0.06,0.04, new THREE.MeshStandardMaterial({color:0x9fd8ff,emissive:0x9fd8ff,emissiveIntensity:0.5}),16).translateX(7.78).translateY(y-0.16).translateZ(zc-0.7).rotateZ(Math.PI/2));
  // overhead launch monitor (white tracking unit) on a small arm
  g.add(box(0.30,0.10,0.46, new THREE.MeshStandardMaterial({color:0xe8eaec,roughness:0.4}), 6.3, y-0.12, zc));
  g.add(box(0.06,0.06,0.06, M.steel, 6.3, y-0.04, zc));
  // (removed the bright emissive light bar that sat on top of the beam — client
  //  asked to delete the two lights above the row of lights over the simulators)
  return g;
}

// Thin orange vertical accent stripes on the teal padding (like the real bays).
function orangeStripes(root, M) {
  const make = (x, y, z, w, h, d) => root.add(box(w, h, d, M.orange, x, y, z));
  // (no divider between the bays — the real space is one open simulator room)
  // on the sim side walls (A side Z=D, B side Z=0)
  for (const x of [6.0, 7.6, 9.1]) { make(x, 1.35, ROOM.D-0.095, 0.04, 2.45, 0.015); make(x, 1.35, 0.095, 0.04, 2.45, 0.015); }
  // vertical accent at the screen-wall corners
  for (const z of [SIM.bay1.z0+0.12, SIM.bay1.z1-0.12, SIM.bay2.z0+0.12]) make(ROOM.W-0.17, 1.4, z, 0.015, 2.4, 0.04);
}

export function buildSimulator(scene, M) {
  const root = new THREE.Group(); root.name = 'simulator';

  // NOTE: no wall between the two bays — the real space is one open simulator
  // room with two adjacent hitting stations (per client reference photos).
  orangeStripes(root, M);

  for (const bay of [SIM.bay1, SIM.bay2]) {
    root.add(impactScreen(M, bay.z0, bay.z1));
    root.add(overhead(M, bay.z0, bay.z1));
  }
  // bay 1 (near A wall) — turf, mat, console box. No sofas, no person.
  root.add(teeMat(M, 6.2, 6.0));
  root.add(pcTower(M, 7.0, 7.4));
  // bay 2 (near B wall)
  root.add(teeMat(M, 6.2, 2.0));
  root.add(pcTower(M, 7.0, 0.6));

  scene.add(root);
  return root;
}
