import * as THREE from 'three';
import { COLOR } from './spec.js';

const hex = (c) => '#' + c.toString(16).padStart(6, '0');

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// rounded-rect path (works everywhere, no ctx.roundRect dependency)
function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// --- Training-area floor: medium-grey rubber, white markings + orange compass --
// Drawn for a 5.0m (X) x 8.0m (Z) area. Canvas px ~ 130 px/m.
// Markings are laid out in well-separated zones so NO line overlaps another
// (top zone = ladder + numbered grid; bottom zone = orange compass + lanes).
export function floorMarkingsTexture() {
  const ppm = 130;
  const W = Math.round(5.0 * ppm), H = Math.round(8.0 * ppm);
  const c = makeCanvas(W, H), g = c.getContext('2d');
  // base medium-grey rubber
  g.fillStyle = hex(COLOR.floor); g.fillRect(0, 0, W, H);
  // subtle rubber speckle
  for (let i = 0; i < 11000; i++) {
    const x = Math.random() * W, y = Math.random() * H;
    g.fillStyle = `rgba(${Math.random() > .5 ? '255,255,255' : '0,0,0'},0.035)`;
    g.fillRect(x, y, 2, 2);
  }
  const white = hex(COLOR.line), orange = hex(COLOR.orange);
  g.lineCap = 'butt';

  // Thin orange accent reveal along the simulator divider edge (X=5.0)
  g.fillStyle = orange;
  g.fillRect(W - 14, 0, 8, H);

  // ===== TOP ZONE (Z 0.5 .. 3.4) =====
  // ---- Agility ladder (far-left), running along Z ----
  (function ladder() {
    const x = 0.30 * ppm, w = 0.52 * ppm, z0 = 0.55 * ppm, rungs = 7, gap = 0.40 * ppm;
    g.strokeStyle = white; g.lineWidth = 7;
    g.strokeRect(x, z0, w, gap * rungs);
    for (let i = 1; i < rungs; i++) {
      const y = z0 + i * gap;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y); g.stroke();
    }
  })();

  // ---- 3x3 numbered target grid (top-right) ----
  (function grid() {
    const gx = 2.75 * ppm, gz = 1.25 * ppm, cell = 0.56 * ppm;
    g.strokeStyle = white; g.lineWidth = 7;
    for (let i = 0; i <= 3; i++) {
      g.beginPath(); g.moveTo(gx + i * cell, gz); g.lineTo(gx + i * cell, gz + 3 * cell); g.stroke();
      g.beginPath(); g.moveTo(gx, gz + i * cell); g.lineTo(gx + 3 * cell, gz + i * cell); g.stroke();
    }
    g.fillStyle = orange; g.font = `bold ${0.28 * ppm}px Arial`; g.textAlign = 'center'; g.textBaseline = 'middle';
    const nums = [[7,2,9],[6,1,4],[3,8,5]];
    for (let r = 0; r < 3; r++) for (let col = 0; col < 3; col++)
      g.fillText(nums[r][col], gx + (col + .5) * cell, gz + (r + .5) * cell);
  })();

  // ===== BOTTOM ZONE (Z 4.3 .. 7.5) =====
  // ---- Orange compass / sunburst (centre-bottom) — like the real space ----
  (function compass() {
    const ox = 2.55 * ppm, oz = 5.85 * ppm, R = 1.42 * ppm;
    g.strokeStyle = orange; g.lineWidth = 5;
    for (let a = 0; a < 360; a += 15) {
      const rad = a * Math.PI / 180;
      g.beginPath();
      g.moveTo(ox + 0.18 * ppm * Math.cos(rad), oz + 0.18 * ppm * Math.sin(rad));
      g.lineTo(ox + R * Math.cos(rad), oz + R * Math.sin(rad)); g.stroke();
    }
    g.lineWidth = 4;
    for (const rr of [0.5, 0.95, 1.42]) {
      g.beginPath(); g.arc(ox, oz, rr * ppm, 0, Math.PI * 2); g.stroke();
    }
    // small white centre cross
    g.strokeStyle = white; g.lineWidth = 4;
    g.beginPath(); g.moveTo(ox - 0.12*ppm, oz); g.lineTo(ox + 0.12*ppm, oz); g.stroke();
    g.beginPath(); g.moveTo(ox, oz - 0.12*ppm); g.lineTo(ox, oz + 0.12*ppm); g.stroke();
  })();

  // ---- Two straight alignment lanes (far-left, below the ladder) ----
  (function lanes() {
    g.strokeStyle = white; g.lineWidth = 7;
    for (const lx of [0.40, 0.88]) {
      g.beginPath(); g.moveTo(lx * ppm, 4.45 * ppm); g.lineTo(lx * ppm, 7.45 * ppm); g.stroke();
    }
    g.lineWidth = 5;
    for (let z = 4.6; z <= 7.3; z += 0.5) {
      g.beginPath(); g.moveTo(0.88 * ppm - 14, z * ppm); g.lineTo(0.88 * ppm + 14, z * ppm); g.stroke();
    }
  })();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// --- Quilted soft-padding: color + matching normal map -----------------------
export function quiltTextures(baseColor = COLOR.padding, cells = 6, px = 512) {
  const c = makeCanvas(px, px), g = c.getContext('2d');
  const n = makeCanvas(px, px), gn = n.getContext('2d');
  const cell = px / cells;
  const base = new THREE.Color(baseColor);
  // color: puffy panels, darker at the stitched seams
  for (let y = 0; y < cells; y++) for (let x = 0; x < cells; x++) {
    const cx = (x + .5) * cell, cy = (y + .5) * cell;
    const grad = g.createRadialGradient(cx, cy, cell * .1, cx, cy, cell * .72);
    const light = base.clone().multiplyScalar(1.5);
    grad.addColorStop(0, `rgb(${light.r*255|0},${light.g*255|0},${light.b*255|0})`);
    grad.addColorStop(1, `rgb(${base.r*255|0},${base.g*255|0},${base.b*255|0})`);
    g.fillStyle = grad; g.fillRect(x * cell, y * cell, cell, cell);
  }
  // seams
  g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = px * 0.012;
  for (let i = 0; i <= cells; i++) {
    g.beginPath(); g.moveTo(i * cell, 0); g.lineTo(i * cell, px); g.stroke();
    g.beginPath(); g.moveTo(0, i * cell); g.lineTo(px, i * cell); g.stroke();
  }
  // tufts (buttons) at seam crossings
  for (let i = 0; i <= cells; i++) for (let j = 0; j <= cells; j++) {
    g.fillStyle = 'rgba(0,0,0,0.6)';
    g.beginPath(); g.arc(i * cell, j * cell, px * 0.006, 0, 7); g.fill();
  }
  // normal map: flat blue base, then puffy bumps -> approximate with radial shading
  gn.fillStyle = 'rgb(128,128,255)'; gn.fillRect(0, 0, px, px);
  for (let y = 0; y < cells; y++) for (let x = 0; x < cells; x++) {
    const cx = (x + .5) * cell, cy = (y + .5) * cell;
    // four directional gradients to fake a dome normal
    const grad = gn.createRadialGradient(cx, cy, cell * .15, cx, cy, cell * .6);
    grad.addColorStop(0, 'rgba(128,128,255,1)');
    grad.addColorStop(1, 'rgba(128,128,255,0)');
    gn.fillStyle = grad; gn.fillRect(x * cell, y * cell, cell, cell);
  }
  // dark seam normals (push down) — draw subtle darker lines
  gn.strokeStyle = 'rgba(128,128,200,1)'; gn.lineWidth = px * 0.02;
  for (let i = 0; i <= cells; i++) {
    gn.beginPath(); gn.moveTo(i * cell, 0); gn.lineTo(i * cell, px); gn.stroke();
    gn.beginPath(); gn.moveTo(0, i * cell); gn.lineTo(px, i * cell); gn.stroke();
  }
  const color = new THREE.CanvasTexture(c); color.colorSpace = THREE.SRGBColorSpace;
  const normal = new THREE.CanvasTexture(n);
  for (const t of [color, normal]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  return { color, normal };
}

// --- Simulator turf with mowing stripes --------------------------------------
export function turfTexture(repeat = 6) {
  const px = 512, c = makeCanvas(px, px), g = c.getContext('2d');
  g.fillStyle = hex(COLOR.turf); g.fillRect(0, 0, px, px);
  const stripes = 8;
  for (let i = 0; i < stripes; i++) {
    g.fillStyle = i % 2 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
    g.fillRect(0, i * px / stripes, px, px / stripes);
  }
  for (let i = 0; i < 16000; i++) {
    g.fillStyle = `rgba(${Math.random()>.5?'255,255,255':'0,0,0'},0.05)`;
    g.fillRect(Math.random()*px, Math.random()*px, 1.5, 1.5);
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat, repeat);
  return t;
}

// --- Cooler, cinematic golf-course image for the impact screens --------------
// A premium-sim look: dawn sky with a soft sun, layered atmospheric tree-lines,
// a perspective fairway to a distant flag, a glowing shot-tracer arc, and a
// sleek minimal HUD. Reads far less cartoonish than the old flat course.
export function courseScreenTexture() {
  const W = 1280, H = 720, c = makeCanvas(W, H), g = c.getContext('2d');
  const horizon = H * 0.60;
  // --- dawn sky gradient ---
  const sky = g.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0.0, '#0e2740');
  sky.addColorStop(0.45, '#2c5f86');
  sky.addColorStop(0.78, '#e6a25c');
  sky.addColorStop(1.0, '#f7dcab');
  g.fillStyle = sky; g.fillRect(0, 0, W, horizon);
  // soft sun glow on the horizon
  const sun = g.createRadialGradient(W * 0.5, horizon, 8, W * 0.5, horizon, 380);
  sun.addColorStop(0, 'rgba(255,243,214,0.95)');
  sun.addColorStop(0.35, 'rgba(255,214,150,0.40)');
  sun.addColorStop(1, 'rgba(255,214,150,0)');
  g.fillStyle = sun; g.fillRect(0, 0, W, horizon + 30);
  // --- layered tree-lines fading into haze ---
  const bands = [['#39556e', 0.500, 26], ['#33566a', 0.545, 20], ['#2c5d52', 0.585, 16]];
  for (const [col, ty, amp] of bands) {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, H * ty);
    for (let x = 0; x <= W; x += 36)
      g.lineTo(x, H * ty - (Math.abs(Math.sin(x * 0.013 + ty * 33)) * amp) - 6);
    g.lineTo(W, horizon); g.lineTo(0, horizon); g.closePath(); g.fill();
  }
  // --- foreground grass ---
  const grass = g.createLinearGradient(0, horizon, 0, H);
  grass.addColorStop(0, '#2f6f34'); grass.addColorStop(1, '#1d4d22');
  g.fillStyle = grass; g.fillRect(0, horizon, W, H - horizon);
  // perspective fairway with mowing stripes
  for (let i = 0; i < 10; i++) {
    const t0 = i / 10, t1 = (i + 1) / 10;
    g.fillStyle = i % 2 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
    g.beginPath();
    g.moveTo(W * (0.5 - 0.46 * t0), horizon + (H - horizon) * t0);
    g.lineTo(W * (0.5 + 0.46 * t0), horizon + (H - horizon) * t0);
    g.lineTo(W * (0.5 + 0.46 * t1), horizon + (H - horizon) * t1);
    g.lineTo(W * (0.5 - 0.46 * t1), horizon + (H - horizon) * t1);
    g.closePath(); g.fill();
  }
  // distant green + flag
  g.fillStyle = '#69b34c'; g.beginPath(); g.ellipse(W * 0.5, horizon + 14, 44, 11, 0, 0, 7); g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(W * 0.5, horizon + 14); g.lineTo(W * 0.5, horizon - 44); g.stroke();
  g.fillStyle = '#ff5a3c'; g.beginPath();
  g.moveTo(W * 0.5, horizon - 44); g.lineTo(W * 0.5 + 20, horizon - 32); g.lineTo(W * 0.5, horizon - 20); g.fill();
  // --- glowing shot-tracer arc (signature cool element) ---
  g.strokeStyle = 'rgba(125,222,255,0.95)'; g.lineWidth = 4;
  g.shadowColor = 'rgba(125,222,255,0.9)'; g.shadowBlur = 18;
  g.beginPath(); g.moveTo(W * 0.5, H * 0.99);
  g.quadraticCurveTo(W * 0.40, H * 0.24, W * 0.5, horizon + 14); g.stroke();
  g.shadowBlur = 0;
  g.fillStyle = 'rgba(125,222,255,0.95)'; g.beginPath(); g.arc(W * 0.5, horizon + 14, 5, 0, 7); g.fill();
  // --- sleek minimal HUD (bottom-left) ---
  g.fillStyle = 'rgba(8,14,22,0.60)'; roundRect(g, 28, H - 150, 300, 122, 12); g.fill();
  g.fillStyle = '#7fe0ff'; g.font = 'bold 22px Arial'; g.textAlign = 'left'; g.fillText('DRIVER', 48, H - 116);
  g.strokeStyle = 'rgba(127,224,255,0.40)'; g.lineWidth = 1;
  g.beginPath(); g.moveTo(48, H - 104); g.lineTo(308, H - 104); g.stroke();
  g.fillStyle = '#ffffff'; g.font = 'bold 30px Arial'; g.fillText('243', 48, H - 66);
  g.fillStyle = '#acc6d6'; g.font = '15px Arial'; g.fillText('CARRY  yds', 116, H - 66);
  g.fillStyle = '#ffffff'; g.font = 'bold 30px Arial'; g.fillText('161', 48, H - 34);
  g.fillStyle = '#acc6d6'; g.font = '15px Arial'; g.fillText('BALL  mph', 116, H - 34);
  // --- subtle vignette ---
  const vig = g.createRadialGradient(W * 0.5, H * 0.5, H * 0.32, W * 0.5, H * 0.5, H * 0.82);
  vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,0.34)');
  g.fillStyle = vig; g.fillRect(0, 0, W, H);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// --- Simple VORTEX-style wordmark decal --------------------------------------
export function logoTexture() {
  const W = 1024, H = 256, c = makeCanvas(W, H), g = c.getContext('2d');
  g.clearRect(0, 0, W, H);
  g.fillStyle = hex(COLOR.orange);
  // swoosh
  g.beginPath(); g.moveTo(40, 180); g.quadraticCurveTo(160, 60, 300, 120);
  g.quadraticCurveTo(200, 130, 120, 200); g.closePath(); g.fill();
  g.font = 'bold 130px Arial'; g.textBaseline = 'middle';
  g.fillStyle = '#ffffff'; g.fillText('VORTEX', 330, 110);
  g.font = '40px Arial'; g.fillStyle = hex(COLOR.orange);
  g.fillText('GOLF  ·  PERFORMANCE', 332, 190);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
