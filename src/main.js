import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

import { ROOM } from './spec.js';
import { buildMaterials } from './materials.js';
import { buildRoom } from './room.js';
import { buildTraining } from './training.js';
import { buildSimulator } from './simulator.js';
import { box } from './helpers.js';

const canvas = document.getElementById('view');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.16;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.xr.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xe8e3da); // warm light grey

// PBR environment for soft reflections (mirrors, metal, glass). Some
// embedding contexts (a nested cross-origin iframe with a degraded/
// software WebGL context) can fail this GPU render-to-texture pass --
// that's not worth losing the whole scene over, so fall back to no
// environment map rather than letting it throw and abort everything
// below (which previously left the page stuck on "loading…" with no
// visible cause).
try {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
} catch (e) {
  console.warn('PMREM environment setup failed, continuing without it:', e);
}

// ---------------- Lights (bright + warm workshop feel) ----------------
scene.add(new THREE.HemisphereLight(0xfff6ea, 0x9a9690, 0.6));
scene.add(new THREE.AmbientLight(0xfff3e8, 0.2));
const key = new THREE.DirectionalLight(0xfff3e2, 1.5);
key.position.set(2.5, 6.5, 1.5);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.camera.left = -8; key.shadow.camera.right = 8;
key.shadow.camera.top = 8; key.shadow.camera.bottom = -8;
key.shadow.camera.near = 0.5; key.shadow.camera.far = 25;
key.shadow.bias = -0.0004;
scene.add(key);
const fill = new THREE.DirectionalLight(0xffeede, 0.5);
fill.position.set(8, 4, 7); scene.add(fill);

// recessed ceiling light panels (warm emissive look + point fill)
const panelMat = new THREE.MeshStandardMaterial({ color: 0xfff6ec, emissive: 0xfff2e0, emissiveIntensity: 0.85 });
const ceilLights = []; // emissive panel meshes — hidden for clean overhead shots (point lights stay on)
for (let ix = 0; ix < 3; ix++) for (let iz = 0; iz < 3; iz++) {
  const x = 1.6 + ix * 3.3, z = 1.3 + iz * 2.7;
  const p = box(1.1, 0.04, 0.22, panelMat, x, ROOM.H - 0.03, z); scene.add(p); ceilLights.push(p);
  const pl = new THREE.PointLight(0xfff1e0, 13, 8, 2); pl.position.set(x, ROOM.H - 0.2, z); scene.add(pl);
}
function setCeilLights(on) { ceilLights.forEach((p) => { p.visible = on; }); }

// ---------------- Build the studio ----------------
const M = buildMaterials();
buildRoom(scene, M);
buildTraining(scene, M);
buildSimulator(scene, M);
// NOTE: no person in the simulator area (matches the real empty bays).

// ---------------- Camera + controls ----------------
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.05, 100);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.08;
controls.target.set(5.0, 1.2, 4.0);
controls.minDistance = 0.5; controls.maxDistance = 30;

// Client-requested camera set (v5): overhead, front-on elevations, sim bays.
const VIEWS = [
  { name: 'Overhead — entire shop (bird’s-eye)',                 pos: [4.9,9.5,2.0],  tgt: [4.9,0.2,4.5], fov: 82, hideLights: true },
  { name: 'Training area — front-on from the simulator side',         pos: [7.0,1.62,4.0], tgt: [0.3,1.0,4.0],  fov: 82 },
  { name: 'B-wall (entrance door + club rack) — front-on',            pos: [4.9,1.55,5.0], tgt: [4.9,1.25,0.0], fov: 80 },
  { name: 'A-wall (mirror + yellow handrail) — front-on',             pos: [4.9,1.55,3.0], tgt: [4.9,1.25,8.0], fov: 80 },
  { name: 'Two simulator bays — front-on',                            pos: [5.0,1.6,4.0],  tgt: [9.7,1.0,4.0],  fov: 85 },
  { name: 'Overhead — dollhouse from storage wall (no ceiling lights)', pos: [-1.0,7.5,4.0], tgt: [5.5,0.3,4.0], fov: 82, hideLights: true },
];

function applyView(i) {
  const v = VIEWS[((i % VIEWS.length) + VIEWS.length) % VIEWS.length];
  camera.position.set(...v.pos);
  camera.fov = v.fov; camera.updateProjectionMatrix();
  controls.target.set(...v.tgt);
  controls.update();
  setCeilLights(!v.hideLights);
  const label = document.getElementById('label');
  if (label) label.textContent = `${((i%VIEWS.length)+VIEWS.length)%VIEWS.length + 1}/${VIEWS.length}  ·  ${v.name}`;
}
applyView(0);

// ---------------- UI ----------------
function makeUI() {
  const bar = document.getElementById('bar');
  if (!bar) return;
  VIEWS.forEach((v, i) => {
    const b = document.createElement('button');
    b.textContent = `${i + 1}`; b.title = v.name;
    b.onclick = () => applyView(i);
    bar.appendChild(b);
  });
  const exp = document.createElement('button');
  exp.textContent = 'Export .glb'; exp.className = 'wide';
  exp.onclick = () => exportGLB().then((b64) => {
    const a = document.createElement('a');
    a.href = 'data:model/gltf-binary;base64,' + b64;
    a.download = 'vortex-golf-studio.glb'; a.click();
  });
  bar.appendChild(exp);
  // WebXR (navigator.xr) access is unreliable inside a nested cross-origin
  // iframe -- it can throw synchronously in some embedding contexts. VR is
  // a bonus, not the core deliverable, so don't let it take the whole page
  // down if it fails.
  try {
    document.body.appendChild(VRButton.createButton(renderer));
  } catch (e) {
    console.warn('VRButton unavailable, continuing without it:', e);
  }
}
makeUI();

// ---------------- Export ----------------
function exportGLB() {
  return new Promise((resolve, reject) => {
    new GLTFExporter().parse(scene, (res) => {
      const bytes = new Uint8Array(res);
      let bin = ''; for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
      resolve(btoa(bin));
    }, reject, { binary: true, onlyVisible: true });
  });
}

// ---------------- Resize + loop ----------------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });

// ---------------- Headless hooks (for puppeteer capture) --------------
window.__studio = {
  views: VIEWS.map((v) => v.name),
  setView: (i) => applyView(i),
  setSize: (w, h) => {
    renderer.setPixelRatio(1);
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  },
  renderNow: () => renderer.render(scene, camera),
  exportGLB,
};
window.__ready = true;
