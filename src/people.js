import * as THREE from 'three';
import { cyl, sphere, box, group } from './helpers.js';

// A simple stylised golfer mid-swing (low-poly, readable in renders).
// Built facing +X (toward a screen on the right wall), addressing a ball.
export function golfer() {
  const g = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xd9a07a, roughness: 0.6 });
  const shirt = new THREE.MeshStandardMaterial({ color: 0xf2f2f0, roughness: 0.7 });
  const pants = new THREE.MeshStandardMaterial({ color: 0x2a2d33, roughness: 0.7 });
  const shoe = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.6 });
  const club = new THREE.MeshStandardMaterial({ color: 0x9a9ea3, roughness: 0.3, metalness: 0.8 });

  const limb = (len, r, mat) => cyl(r, r*0.85, len, mat, 12);

  // legs (athletic stance, feet apart along Z)
  for (const dz of [-0.18, 0.18]) {
    const thigh = limb(0.45, 0.075, pants); thigh.position.set(0, 0.55, dz); thigh.rotation.x = dz>0?0.12:-0.12; g.add(thigh);
    const shin = limb(0.45, 0.06, pants); shin.position.set(0, 0.18, dz*1.15); g.add(shin);
    const foot = box(0.22,0.06,0.1, shoe, 0.06,0.03,dz*1.15); g.add(foot);
  }
  // hips + torso (rotated, leaning into the ball)
  g.add(box(0.26,0.18,0.34, pants, 0,0.82,0));
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.16,0.2,0.5,16), shirt);
  torso.position.set(0.05,1.12,0); torso.rotation.z = -0.25; torso.rotation.y = 0.5; torso.castShadow=true; g.add(torso);
  // head
  g.add(sphere(0.115, skin, 18).translateX(0.12).translateY(1.45).translateZ(0.02));
  g.add(box(0.16,0.06,0.18, new THREE.MeshStandardMaterial({color:0x222}), 0.12,1.52,0.02)); // cap

  // arms extended to grip (both hands forward+down, club angled back-up = top of backswing-ish)
  const shoulderL = new THREE.Vector3(0.05,1.32,-0.16);
  const shoulderR = new THREE.Vector3(0.05,1.32,0.16);
  const hands = new THREE.Vector3(0.42,1.05,0.0);
  for (const sh of [shoulderL, shoulderR]) {
    const dir = new THREE.Vector3().subVectors(hands, sh);
    const len = dir.length();
    const arm = limb(len, 0.05, shirt);
    arm.position.copy(sh.clone().add(hands).multiplyScalar(0.5));
    arm.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.clone().normalize());
    g.add(arm);
  }
  g.add(sphere(0.05, skin, 10).translateX(hands.x).translateY(hands.y).translateZ(hands.z)); // hands

  // club: from hands up-and-back over the shoulder
  const head = new THREE.Vector3(0.1,1.95,-0.35);
  const shaft = limb(head.distanceTo(hands), 0.012, club);
  shaft.position.copy(hands.clone().add(head).multiplyScalar(0.5));
  shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), new THREE.Vector3().subVectors(head,hands).normalize());
  g.add(shaft);
  g.add(box(0.1,0.04,0.05, club, head.x, head.y, head.z));

  g.traverse(o=>{ if(o.isMesh){o.castShadow=true;} });
  return g;
}
