import * as THREE from 'three';

// Axis-aligned box centred by (cx,cy,cz) with size (sx,sy,sz)
export function box(sx, sy, sz, mat, cx = 0, cy = 0, cz = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
  m.position.set(cx, cy, cz);
  m.castShadow = m.receiveShadow = true;
  return m;
}

// Box defined by min/max extents (handy for wall segments)
export function boxFromTo(x0, y0, z0, x1, y1, z1, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), mat);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  m.castShadow = m.receiveShadow = true;
  return m;
}

export function cyl(rTop, rBot, h, mat, radial = 16) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, radial), mat);
  m.castShadow = m.receiveShadow = true;
  return m;
}

export function sphere(r, mat, seg = 24) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, seg), mat);
  m.castShadow = m.receiveShadow = true;
  return m;
}

export function group(...children) {
  const g = new THREE.Group();
  children.forEach((c) => c && g.add(c));
  return g;
}

// A smooth tube following points (for ropes / bands)
export function tube(points, radius, mat, segments = 40) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const m = new THREE.Mesh(new THREE.TubeGeometry(curve, segments, radius, 8, false), mat);
  m.castShadow = true;
  return m;
}

// Catenary-ish hanging strand between a and b with sag
export function strand(a, b, sag, radius, mat) {
  const mid = [(a[0]+b[0])/2, Math.min(a[1], b[1]) - sag, (a[2]+b[2])/2];
  return tube([a, mid, b], radius, mat, 30);
}
