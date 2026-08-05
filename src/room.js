import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { ROOM, SEG, MIRROR, TOPBAND, CWALL, DOOR, SIM, COLOR } from './spec.js';
import { box, boxFromTo, cyl, sphere, group, tube } from './helpers.js';
import { GADGET_COLORS } from './materials.js';

const T = 0.12; // wall thickness

// A framed mirror using a real planar Reflector inside a thin dark frame.
function mirror(w, h) {
  const g = new THREE.Group();
  const ref = new Reflector(new THREE.PlaneGeometry(w, h), {
    color: 0x9aa0a6, textureWidth: 1024, textureHeight: 1024, clipBias: 0.003,
  });
  g.add(ref);
  const fr = new THREE.MeshStandardMaterial({ color: 0x1a1c1f, roughness: 0.5, metalness: 0.6 });
  const t = 0.04, d = 0.03;
  g.add(box(w + 2*t, t, d, fr, 0,  h/2 + t/2, 0.01));
  g.add(box(w + 2*t, t, d, fr, 0, -h/2 - t/2, 0.01));
  g.add(box(t, h, d, fr, -w/2 - t/2, 0, 0.01));
  g.add(box(t, h, d, fr,  w/2 + t/2, 0, 0.01));
  return g;
}

// ---- C-WALL STORAGE (X=0, faces +X) ----------------------------------------
// One welded steel shelf level on the C wall: board + front guard pipe + brackets.
function cShelf(M, z0, z1, y) {
  const g = new THREE.Group();
  const len = z1 - z0, zc = (z0 + z1) / 2;
  g.add(box(0.40, 0.02, len, M.steel, 0.22, y, zc));                 // shelf board
  const rail = cyl(0.016, 0.016, len, M.steelLight, 12);             // front guard pipe
  rail.rotation.x = Math.PI / 2; rail.position.set(0.40, y + 0.07, zc); g.add(rail);
  for (const z of [z0 + 0.06, z1 - 0.06]) {                          // end brackets
    g.add(box(0.40, 0.025, 0.025, M.steel, 0.22, y, z));
    g.add(box(0.03, 0.20, 0.03, M.steel, 0.03, y + 0.07, z));
  }
  return g;
}

// A storable cube rest-bench (NOT welded) standing on the floor.
function cubeBench(M, color) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
  g.add(box(0.44, 0.40, 0.44, mat, 0, 0.20, 0));
  // padded-top reveal
  g.add(box(0.46, 0.06, 0.46, new THREE.MeshStandardMaterial({ color: 0x2b2e33, roughness: 0.7 }), 0, 0.40, 0));
  return g;
}

// A draped resistance band hanging over a wall rail (hairpin), local origin on rail.
function drapedBand(color, y, z, drop, ax = 0.06) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
  return tube([
    [ax, y - drop, z - 0.02], [ax, y + 0.02, z - 0.02],
    [ax + 0.05, y + 0.03, z], [ax + 0.05, y + 0.02, z + 0.02], [ax + 0.05, y - drop, z + 0.02],
  ], 0.012, mat, 28);
}

// A SINGLE row of cube rest-stools (调整休息凳子) snug against the C wall — one
// row per island (client: "one row on each side, not two rows"). Three padded
// cube stools flush to the wall (x=0.34), running along Z.
function cubeSofaCluster(g, M, zc) {
  const cols = [0xff6a13, 0x33363b, 0x2f817b];
  [-0.50, 0, 0.50].forEach((dz, i) => {
    const b = cubeBench(M, cols[i % cols.length]);
    b.position.set(0.34, 0, zc + dz);
    g.add(b);
  });
}

// Whole C-wall storage furniture set (welded racks + balls + bands + cabinet + benches).
function storageWall(M) {
  const g = new THREE.Group();
  const ball = (r, c, x, y, z, rough = 0.5) =>
    g.add(sphere(r, M.ballMat(c, rough), 20).translateX(x).translateY(y).translateZ(z));

  // (big-ball rack at the bottom-right/AC corner removed per client request)

  // --- ONE central medicine-ball rack (Z 3.45..4.75), two levels ---
  // (the bottom-right ball racks — big-ball corner + Z4.85..6.15 section —
  //  removed per client request; this central section is the only ball rack kept)
  for (const [z0, z1] of [[3.45, 4.75]]) {
    for (const y of CWALL.rackY) {
      g.add(cShelf(M, z0, z1, y));
      const cols = [0x202327, 0xe23b2e, 0x2f8fd0, 0x4fae4a, 0x202327, 0xf6d020];
      let k = 0;
      for (let z = z0 + 0.18; z < z1 - 0.05; z += 0.24) {
        const r = 0.10 + (k % 3) * 0.015;
        ball(r, cols[(k + (y > 1.8 ? 0 : 3)) % cols.length], 0.18, y + r + 0.02, z, 0.55);
        k++;
      }
    }
  }

  // --- misc rack (杂物) Z 2.35..3.35, foam blocks / bottles / folded mat ---
  for (const y of CWALL.rackY) g.add(cShelf(M, 2.35, 3.35, y));
  g.add(box(0.26, 0.18, 0.26, M.foam(0x2f8fd0), 0.20, CWALL.rackY[1] + 0.11, 2.55));
  g.add(box(0.26, 0.18, 0.26, M.foam(0xf6d020), 0.20, CWALL.rackY[1] + 0.11, 2.86));
  g.add(box(0.30, 0.20, 0.30, M.foam(0xe23b2e), 0.20, CWALL.rackY[1] + 0.12, 3.18));
  // rolled mats on lower level
  const mat1 = cyl(0.09, 0.09, 0.30, M.foam(0x7a8a9a), 14); mat1.rotation.x = Math.PI/2; mat1.position.set(0.22, CWALL.rackY[0] + 0.10, 2.55); g.add(mat1);
  const mat2 = cyl(0.09, 0.09, 0.30, M.foam(0x4fae4a), 14); mat2.rotation.x = Math.PI/2; mat2.position.set(0.22, CWALL.rackY[0] + 0.10, 2.90); g.add(mat2);
  const noodle = cyl(0.05, 0.05, 0.30, M.foam(0xff6a13), 12); noodle.rotation.x = Math.PI/2; noodle.position.set(0.20, CWALL.rackY[0] + 0.10, 3.20); g.add(noodle);

  // --- stretch-band rack (拉伸带挂构) Z 1.15..2.15, bands hanging over a high rail
  const railY = 2.25, z0 = 1.15, z1 = 2.15, zc = (z0+z1)/2, len = z1-z0;
  const rail = cyl(0.02, 0.02, len, M.oak, 14); rail.rotation.x = Math.PI/2; rail.position.set(0.16, railY, zc); g.add(rail);
  for (const z of [z0+0.05, z1-0.05]) { g.add(box(0.20, 0.04, 0.04, M.steel, 0.10, railY, z)); g.add(box(0.04, 0.45, 0.04, M.steel, 0.05, railY-0.22, z)); }
  const bandCols = [0xe23b2e, 0xf6d020, 0x4fae4a, 0x2f8fd0, 0x7a4fc0, 0xff6a13];
  let bi = 0;
  for (let z = z0 + 0.12; z < z1 - 0.05; z += 0.16) { g.add(drapedBand(bandCols[bi % bandCols.length], railY, z, 0.7 + (bi % 3) * 0.2, 0.10)); bi++; }
  // TRX-style straps at one end
  const strap = new THREE.MeshStandardMaterial({ color: 0x1c1f22, roughness: 0.7 });
  for (const dz of [-0.02, 0.06]) { g.add(tube([[0.12,railY,z0-0.02+dz],[0.16,1.65,z0-0.02+dz],[0.20,1.35,z0-0.02+dz]], 0.012, strap, 18)); g.add(box(0.05,0.10,0.04, M.black, 0.20, 1.28, z0-0.02+dz)); }

  // (bottom-left welded ball rack at the BC/entrance corner removed per client
  //  request — they did not want a ball rack added there.)

  // --- TWO islands of seated cube sofas (调整休息凳子) on the floor ----------
  // One SINGLE row per island (client: "one row on each side, not two rows"):
  // an UPPER rest island and a LOWER one, each three padded cube stools.
  cubeSofaCluster(g, M, 5.35);   // upper rest island  (Z ~4.85..5.85)
  cubeSofaCluster(g, M, 1.70);   // lower rest island  (Z ~1.20..2.20)

  return g;
}

// Soft-padding (teal) panel filling a simulator-side wall region.
function paddingWall(mat, x0, z0, x1, h, z1, which) {
  const g = new THREE.Group();
  const w = x1 - x0;
  const geo = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), mat);
  geo.position.set((x0 + x1)/2, h/2, which === 'A' ? z1 - 0.04 : z0 + 0.04);
  setRepeat(mat, w / 0.55, h / 0.55);
  geo.castShadow = geo.receiveShadow = true;
  g.add(geo);
  return g;
}

function setRepeat(mat, ru, rv) {
  if (mat.map) mat.map.repeat.set(ru, rv);
  if (mat.normalMap) mat.normalMap.repeat.set(ru, rv);
}

export function buildRoom(scene, M) {
  const root = new THREE.Group(); root.name = 'room';
  const W = ROOM.W, D = ROOM.D, H = ROOM.H;

  // ---- Floors ----
  const trainFloor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.MID, D), M.floorTraining);
  trainFloor.rotation.x = -Math.PI/2;
  trainFloor.position.set(ROOM.MID/2, 0.001, D/2);
  trainFloor.receiveShadow = true;
  M.floorTraining.map.center.set(0.5, 0.5);
  root.add(trainFloor);

  const turf = new THREE.Mesh(new THREE.PlaneGeometry(W - ROOM.MID, D), M.turf);
  turf.rotation.x = -Math.PI/2; turf.position.set((ROOM.MID + W)/2, 0.0, D/2);
  turf.receiveShadow = true; root.add(turf);

  root.add(box(W, 0.1, D, M.rubber, W/2, -0.05, D/2)); // base slab

  // ---- Ceiling ----
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(W, D), M.ceiling);
  ceil.rotation.x = Math.PI/2; ceil.position.set(W/2, H, D/2); ceil.receiveShadow = true;
  root.add(ceil);

  // ===================== WALL BACKINGS =====================
  root.add(boxFromTo(-T, 0, 0,  0, H, D, M.charcoal));    // C wall (X=0)
  root.add(boxFromTo(W, 0, 0,  W+T, H, D, M.charcoal));   // right wall (X=W)
  root.add(boxFromTo(0, 0, -T,  W, H, 0, M.charcoal));    // B wall (Z=0)
  root.add(boxFromTo(0, 0, D,  W, H, D+T, M.charcoal));   // A wall (Z=D)

  // helper: dark-grey top band on a training wall (front strip)
  const topBandA = (x0, x1, z, faceZ) => root.add(box(x1 - x0, TOPBAND.y1 - TOPBAND.y0, 0.02, M.bandGrey, (x0+x1)/2, (TOPBAND.y0+TOPBAND.y1)/2, z));

  // ---------- A WALL (Z = D), faces -Z ----------  training: 0..5 ; sim: 5..W
  root.add(boxFromTo(0, 0, D-0.02, SEG.x2, TOPBAND.y0, D, M.white));   // white field 0..5
  topBandA(0, SEG.x2, D - 0.03);                                       // dark-grey top band
  const mirA = mirror(MIRROR.w, MIRROR.h);
  mirA.position.set(MIRROR.x + MIRROR.w/2, MIRROR.sill + MIRROR.h/2, D - 0.05);
  mirA.rotation.y = Math.PI; root.add(mirA);
  root.add(paddingWall(M.paddingSim, ROOM.MID, D-0.06, W, H, D, 'A')); // teal sim padding

  // ---------- B WALL (Z = 0), faces +Z ----------  training: 0..5 ; sim: 5..W
  const door = autoDoor(M);
  door.position.set(DOOR.x + DOOR.w/2, 0, 0.06); root.add(door);
  root.add(boxFromTo(0, DOOR.h, 0, SEG.x1, TOPBAND.y0, 0.02, M.white));   // white above door 0..2
  root.add(boxFromTo(SEG.x1, 0, 0, SEG.x2, TOPBAND.y0, 0.02, M.white));   // white field 2..5 (NO mirror — blank)
  topBandA(0, SEG.x2, 0.03);                                              // dark-grey top band
  root.add(paddingWall(M.paddingSim, ROOM.MID, 0, W, H, 0.06, 'B'));      // teal sim padding

  // ---------- C WALL (X = 0), faces +X ----------  storage
  root.add(boxFromTo(0, 0, 0, 0.02, TOPBAND.y0, D, M.white));             // white field full depth
  root.add(box(0.02, TOPBAND.y1 - TOPBAND.y0, D, M.bandGrey, 0.02, (TOPBAND.y0+TOPBAND.y1)/2, D/2)); // top band
  root.add(storageWall(M));

  // (entrance VORTEX wordmark decal removed per client request — the B-wall
  //  above the door is now clean white)

  scene.add(root);
  return root;
}

// Clean commercial automatic sliding glass door on the B wall.
// Brushed-aluminium transom + jambs + floor track, two framed glass leaves that
// meet in the middle, a frosted manifestation band at eye height, and a motion
// sensor with a green status LED. No handles — it is an automatic sensor door.
function autoDoor(M) {
  const g = new THREE.Group();
  const w = DOOR.w, h = DOOR.h;
  const al = M.steelLight;            // brushed aluminium
  const leafW = w / 2;                // two leaves fill the opening
  const stile = 0.06;                 // aluminium frame width on each leaf
  const headerH = 0.22;               // operator transom height
  const frost = new THREE.MeshPhysicalMaterial({
    color: 0xeef3f5, roughness: 0.85, metalness: 0.0,
    transmission: 0.35, transparent: true, opacity: 0.55, thickness: 0.01,
  });

  g.add(box(w + 0.12, headerH, 0.16, al, 0, h - headerH/2, 0));               // transom / operator housing
  for (const sx of [-w/2 - 0.03, w/2 + 0.03]) g.add(box(0.06, h, 0.14, al, sx, h/2, 0)); // jambs
  g.add(box(w + 0.06, 0.03, 0.14, al, 0, 0.015, 0));                          // recessed floor track

  const glassH = h - headerH - 0.06;
  const yMid = 0.03 + glassH/2;
  for (const side of [-1, 1]) {
    const cx = side * leafW/2;
    g.add(box(leafW - stile, glassH - stile, 0.012, M.glass, cx, yMid, 0));   // glass pane
    g.add(box(leafW, stile, 0.05, al, cx, yMid + glassH/2 - stile/2, 0));     // top rail
    g.add(box(leafW, stile, 0.05, al, cx, yMid - glassH/2 + stile/2, 0));     // bottom rail
    g.add(box(stile, glassH, 0.05, al, cx + side*(leafW/2 - stile/2), yMid, 0)); // outer stile
    g.add(box(stile, glassH, 0.05, al, cx - side*(leafW/2 - stile/2), yMid, 0)); // meeting stile
    g.add(box(leafW - stile, 0.16, 0.014, frost, cx, 1.5, 0.004));           // frosted manifestation band
  }

  g.add(box(0.26, 0.07, 0.06, M.black, 0, h - headerH - 0.02, 0.08));
  g.add(sphere(0.012, new THREE.MeshStandardMaterial({ color: 0x35ff6a, emissive: 0x35ff6a, emissiveIntensity: 0.9 }), 10)
        .translateX(0.1).translateY(h - headerH - 0.02).translateZ(0.11));
  return g;
}
