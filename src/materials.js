import * as THREE from 'three';
import { COLOR } from './spec.js';
import { floorMarkingsTexture, quiltTextures, turfTexture, courseScreenTexture, logoTexture } from './textures.js';

export function buildMaterials() {
  // TEAL sea-green quilted padding for the simulator bays (matches real bays).
  const quiltSim = quiltTextures(COLOR.paddingSim, 5);

  const M = {
    // ---- walls / structure ----
    white:    new THREE.MeshStandardMaterial({ color: COLOR.white, roughness: 0.93, metalness: 0.0 }),
    bandGrey: new THREE.MeshStandardMaterial({ color: COLOR.bandGrey, roughness: 0.9, metalness: 0.0 }),
    charcoal: new THREE.MeshStandardMaterial({ color: COLOR.charcoal, roughness: 0.88, metalness: 0.0 }),
    ceiling:  new THREE.MeshStandardMaterial({ color: COLOR.ceiling, roughness: 0.96 }),

    floorTraining: new THREE.MeshStandardMaterial({
      map: floorMarkingsTexture(), roughness: 0.78, metalness: 0.0,
    }),

    // ---- simulator teal quilted padding ----
    paddingSim: new THREE.MeshStandardMaterial({
      color: 0xffffff, map: quiltSim.color, normalMap: quiltSim.normal,
      normalScale: new THREE.Vector2(1.1, 1.1), roughness: 0.9, metalness: 0.0,
    }),

    // ---- accents / metals ----
    orange: new THREE.MeshStandardMaterial({ color: COLOR.orange, roughness: 0.5, metalness: 0.0 }),
    yellow: new THREE.MeshStandardMaterial({ color: COLOR.yellow, roughness: 0.5, metalness: 0.1 }),
    steel:  new THREE.MeshStandardMaterial({ color: COLOR.steel, roughness: 0.45, metalness: 0.8 }),
    steelLight: new THREE.MeshStandardMaterial({ color: COLOR.steelLight, roughness: 0.35, metalness: 0.9 }),
    black:  new THREE.MeshStandardMaterial({ color: 0x141619, roughness: 0.6, metalness: 0.3 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x1a1c1f, roughness: 0.9 }),
    oak:    new THREE.MeshStandardMaterial({ color: COLOR.oak, roughness: 0.6 }),

    // ---- gadget surfaces ----
    plyo:    new THREE.MeshStandardMaterial({ color: 0x24262a, roughness: 0.85 }), // soft black foam jump box
    leather: new THREE.MeshStandardMaterial({ color: 0x202327, roughness: 0.7 }),  // slam/medicine ball
    foam:    (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }),   // foam roller

    // Fully MATTE turf — kill env-map reflections so it reads like flat grass.
    turf: (() => {
      const t = turfTexture(6);
      return new THREE.MeshStandardMaterial({ map: t, roughness: 1.0, metalness: 0.0, envMapIntensity: 0.0 });
    })(),
    turfTee: (() => {
      const t = turfTexture(2); t.repeat.set(2, 2);
      return new THREE.MeshStandardMaterial({ map: t, color: 0xbfe6a8, roughness: 1.0, metalness: 0.0, envMapIntensity: 0.0 });
    })(),

    couch: new THREE.MeshStandardMaterial({ color: COLOR.couch, roughness: 0.85 }),

    glass: new THREE.MeshPhysicalMaterial({
      color: 0xb9ccd4, roughness: 0.03, metalness: 0.0,
      transmission: 0.94, transparent: true, opacity: 0.34, thickness: 0.06,
      ior: 1.5, reflectivity: 0.35, clearcoat: 0.35, clearcoatRoughness: 0.08,
    }),

    screen: new THREE.MeshStandardMaterial({
      map: courseScreenTexture(), emissiveMap: courseScreenTexture(),
      emissive: 0xffffff, emissiveIntensity: 0.85, roughness: 0.6,
    }),

    logo: new THREE.MeshStandardMaterial({ map: logoTexture(), transparent: true, roughness: 0.6 }),

    // bright accent material set for gadgets (resistance bands, balls, etc.)
    band: (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55 }),
    ballMat: (c, rough = 0.5) => new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: 0.0 }),
  };
  return M;
}

// Vivid gadget palette (resistance bands, medicine balls, yoga balls, rings…)
export const GADGET_COLORS = [
  0xe23b2e, 0xf0a01e, 0xf6d020, 0x4fae4a, 0x2f8fd0, 0x7a4fc0, 0xff6a13, 0x18a0a0,
];
