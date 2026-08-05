import * as THREE from 'three';
import { ROOM, HANGBANDS, HANDRAILS, SEG, COLOR } from './spec.js';
import { box, cyl, sphere, group, tube } from './helpers.js';

// ---- Two stretch bands hung straight down from the ceiling, aligned as a pair --
function hangingBands(M) {
  const g = new THREE.Group();
  const cols = [0xe23b2e, 0x2f8fd0];
  HANGBANDS.points.forEach((p, i) => {
    // ceiling anchor plate
    const plate = cyl(0.07, 0.07, 0.02, M.steelLight, 20); plate.rotation.x = Math.PI/2;
    plate.position.set(p.x, HANGBANDS.y - 0.01, p.z); g.add(plate);
    // band: a doubled loop hanging straight down to handle height
    const mat = new THREE.MeshStandardMaterial({ color: cols[i], roughness: 0.5 });
    const yTop = HANGBANDS.y - 0.03, yBot = HANGBANDS.drop;
    g.add(tube([[p.x-0.03,yTop,p.z],[p.x-0.03,yBot+0.06,p.z]], 0.012, mat, 12));
    g.add(tube([[p.x+0.03,yTop,p.z],[p.x+0.03,yBot+0.06,p.z]], 0.012, mat, 12));
    // black D-handle at the bottom
    const loop = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 10, 20), M.black);
    loop.position.set(p.x, yBot, p.z); g.add(loop);
  });
  return g;
}

// ---- WALL-MOUNTED single YELLOW stretch handrail (ballet-barre style) ---------
// Mounts to the A-wall (s.wallZ) on steel brackets — no floor posts/base plates.
function handrail(M, s) {
  const g = new THREE.Group();
  const yel = M.yellow;
  const len = s.x1 - s.x0;
  const wallZ = s.wallZ ?? (s.z + 0.28);
  const armLen = wallZ - s.z;                 // bracket reach from wall to barre
  // single horizontal yellow barre, parallel to and just off the wall
  const bar = cyl(0.028, 0.028, len, yel, 16); bar.rotation.z = Math.PI/2;
  bar.position.set((s.x0 + s.x1) / 2, s.h, s.z); g.add(bar);
  // steel wall brackets at both ends + the middle
  for (const x of [s.x0, (s.x0 + s.x1) / 2, s.x1]) {
    g.add(box(0.07, 0.14, 0.02, M.steel, x, s.h, wallZ - 0.011));          // wall mounting plate
    g.add(box(0.035, 0.035, armLen, M.steel, x, s.h, (s.z + wallZ) / 2));  // horizontal arm to the barre
    g.add(box(0.03, 0.10, 0.035, M.steel, x, s.h - 0.06, s.z + 0.015));    // small drop bracket holding the barre
  }
  return g;
}

// ---- B-wall pool-cue-style welded rack holding club gadgets vertically --------
function poolCueRack(M, xc) {
  const g = new THREE.Group();          // local origin at wall (Z=0), +Z into room
  const wood = new THREE.MeshStandardMaterial({ color: 0x6f4a2c, roughness: 0.7 });
  const span = 2.3;
  g.add(box(span, 1.45, 0.04, wood, xc, 0.92, 0.05));                                   // backboard
  g.add(box(span, 0.07, 0.18, M.steel, xc, 0.34, 0.13));                                // bottom cup shelf
  g.add(box(span, 0.05, 0.10, M.steel, xc, 1.55, 0.13));                                // top retaining rail
  // clubs / alignment sticks / weighted bats standing vertically
  const clubs = [0xf2c20c, 0x7a4fc0, 0x9aa0a6, 0xff6a13, 0x4fae4a, 0x8a1f1f, 0x141414, 0x2f8fd0];
  clubs.forEach((c, i) => {
    const x = xc - span/2 + 0.22 + i * (span - 0.44) / (clubs.length - 1);
    const len = 1.15 + (i % 3) * 0.06, r = i % 4 === 0 ? 0.03 : 0.016;  // some fat swing-bats
    const club = cyl(r, r*0.8, len, new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, metalness: c === 0x9aa0a6 ? 0.7 : 0.1 }), 10);
    club.position.set(x, 0.34 + len/2, 0.15); club.rotation.z = (i%2?1:-1)*0.02; g.add(club);
  });
  return g;
}

// ---- Floor gadgets ----------------------------------------------------------
function yogaBall(M, c, r, x, z) {
  return sphere(r, M.ballMat(c, 0.45), 26).translateX(x).translateY(r).translateZ(z);
}

function jumpBoxes(M, x, z) {
  const g = new THREE.Group();
  // soft black plyo boxes, decreasing, slightly tumbled (messy-but-not)
  g.add(box(0.62, 0.62, 0.62, M.plyo, x, 0.31, z));
  g.add(box(0.52, 0.52, 0.52, M.plyo, x + 0.06, 0.62 + 0.26, z - 0.05));
  // orange size labels
  g.add(box(0.22, 0.13, 0.005, M.orange, x, 0.34, z + 0.311));
  g.add(box(0.18, 0.11, 0.005, M.orange, x + 0.06, 0.88, z - 0.05 + 0.261));
  return g;
}

function gymBench(M, x, z) {
  const g = new THREE.Group();
  const pad = new THREE.MeshStandardMaterial({ color: 0x1c1f24, roughness: 0.6 });
  g.add(box(1.15, 0.10, 0.34, pad, x, 0.46, z));                  // bench pad
  g.add(box(0.30, 0.10, 0.34, pad, x - 0.62, 0.50, z));           // raised head pad
  for (const dx of [-0.45, 0.45]) { g.add(box(0.06, 0.40, 0.06, M.steel, x + dx, 0.2, z)); g.add(box(0.08, 0.05, 0.46, M.steel, x + dx, 0.02, z)); }
  return g;
}

function kettlebell(M, c, x, z) {
  const g = group(
    sphere(0.10, M.ballMat(c, 0.5), 16).translateY(0.10),
    new THREE.Mesh(new THREE.TorusGeometry(0.055, 0.018, 8, 16, Math.PI), M.ballMat(c, 0.5))
  );
  g.children[1].position.set(0, 0.19, 0); g.children[1].rotation.x = Math.PI;
  g.position.set(x, 0, z); return g;
}

function slamBalls(M, x, z) {
  const g = new THREE.Group();
  const cols = [0x202327, 0xe23b2e, 0x4fae4a, 0x202327];
  cols.forEach((c, i) => g.add(sphere(0.13 - (i%2)*0.02, M.leather, 18).translateX(x + (i%2)*0.30).translateY(0.12).translateZ(z + Math.floor(i/2)*0.30)));
  return g;
}

function foamRollers(M, x, z) {
  const g = new THREE.Group();
  const cols = [0x4fae4a, 0x2f8fd0, 0x7a4fc0];
  cols.forEach((c, i) => { const r = cyl(0.07, 0.07, 0.44, M.foam(c), 16); r.rotation.z = Math.PI/2; r.position.set(x, 0.07 + i*0.15, z); g.add(r); });
  return g;
}

function balanceDiscs(M, x, z) {
  const g = new THREE.Group();
  for (let k = 0; k < 3; k++) g.add(cyl(0.18, 0.18, 0.055, new THREE.MeshStandardMaterial({ color: 0xc62a22, roughness: 0.6 }), 24).translateX(x).translateY(0.03 + k*0.065).translateZ(z));
  // a BOSU dome nearby
  const dome = new THREE.Mesh(new THREE.SphereGeometry(0.18, 20, 12, 0, Math.PI*2, 0, Math.PI/2), M.ballMat(0x2f8fd0, 0.5));
  dome.position.set(x + 0.5, 0.04, z); g.add(box(0.38, 0.06, 0.38, M.black, x + 0.5, 0.03, z), dome);
  return g;
}

function battleRope(M, x, z) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: 0x111317, roughness: 0.85 });
  for (let k = 0; k < 3; k++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.18 - k*0.05, 0.025, 10, 28), mat);
    r.rotation.x = Math.PI/2; r.position.set(x, 0.026, z); g.add(r);
  }
  return g;
}

function agilityRings(M, ringsAt) {
  const g = new THREE.Group();
  const cols = [0xe23b2e, 0xf6d020, 0x2f8fd0, 0x4fae4a];
  ringsAt.forEach(([x, z], i) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.022, 8, 24), new THREE.MeshStandardMaterial({ color: cols[i % cols.length], roughness: 0.6 }));
    ring.rotation.x = Math.PI/2; ring.position.set(x, 0.022, z); g.add(ring);
  });
  return g;
}

export function buildTraining(scene, M) {
  const root = new THREE.Group(); root.name = 'training';

  // two aligned hanging bands from the ceiling
  root.add(hangingBands(M));

  // single wall-mounted yellow handrail on the A-wall in front of the mirror
  HANDRAILS.forEach((s) => root.add(handrail(M, s)));

  // B-wall pool-cue club rack in the blank space (X 2..5)
  root.add(poolCueRack(M, (SEG.x1 + SEG.x2) / 2));

  // ---- Floor gadgets: lots, arranged but workshop-busy ----
  // big yoga balls — kept clear of other props (no overlap with the jump boxes)
  root.add(yogaBall(M, 0x2f8fd0, 0.32, 3.5, 6.6));
  root.add(yogaBall(M, 0x4fae4a, 0.30, 4.4, 1.05));

  // jump boxes (AC corner) + a big yellow hitting bag lying along the divider edge
  root.add(jumpBoxes(M, 1.15, 7.1));
  const bag = cyl(0.20, 0.20, 1.25, M.yellow, 20); bag.rotation.x = Math.PI/2; bag.position.set(4.45, 0.20, 3.1);
  root.add(bag);
  root.add(cyl(0.205, 0.205, 0.06, M.black, 20).rotateX(Math.PI/2).translateX(4.45).translateY(0.20).translateZ(3.72)); // bag end cap
  root.add(cyl(0.205, 0.205, 0.06, M.black, 20).rotateX(Math.PI/2).translateX(4.45).translateY(0.20).translateZ(2.48));

  // gym bench (neatly placed, centre-right)
  root.add(gymBench(M, 3.7, 4.6));

  // a cluster along the C-wall walkway: kettlebells, slam balls, foam rollers, discs, battle rope
  root.add(kettlebell(M, 0xf6d020, 1.35, 3.95));
  root.add(kettlebell(M, 0x2f8fd0, 1.60, 4.10));
  root.add(kettlebell(M, 0xe23b2e, 1.45, 4.30));
  root.add(slamBalls(M, 1.30, 3.10));
  root.add(foamRollers(M, 1.35, 2.25));
  root.add(balanceDiscs(M, 1.75, 5.30));
  root.add(battleRope(M, 1.15, 1.05));

  // a few coloured agility rings scattered near the ladder
  root.add(agilityRings(M, [[0.55, 3.9], [0.55, 4.3], [0.9, 4.1], [0.7, 4.6]]));

  // a low aerobic step platform near the bench
  root.add(box(0.78, 0.16, 0.34, new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.6 }), 3.05, 0.08, 5.45));
  root.add(box(0.82, 0.04, 0.38, M.black, 3.05, 0.18, 5.45));

  scene.add(root);
  return root;
}
