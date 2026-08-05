// ---------------------------------------------------------------------------
// LOCKED SPEC (v2) for the VORTEX golf-simulator + training studio.
// Derived from the client blueprint (高尔夫球训练馆图纸.pdf) and the real-space
// reference photos (Current space / Note / Gadgets folders).
// All distances in METERS. Plan -> world mapping:
//   plan X (0..9.8, along A/B walls)  -> world X
//   plan Z (0..8.0, B-wall=0 .. A-wall=8.0, depth) -> world Z
//   height (0..3.0 floor->ceiling)   -> world Y
//
// Walls (user's naming):
//   C wall  = X=0   (8.0m long)  -> storage: welded ball/misc/band racks + cube seats
//   right   = X=9.8 (8.0m long)  -> simulator impact screens
//   A wall  = Z=8.0 (9.8m long)  -> training: mirror + yellow handrail (left half)
//   B wall  = Z=0   (9.8m long)  -> training: auto glass door + pool-cue club rack + handrail
// ---------------------------------------------------------------------------

export const ROOM = {
  W: 9.8,   // width  (X)  = 2000+3000+1800+3000 mm
  D: 8.0,   // depth  (Z)  = 8000 mm
  H: 3.0,   // height (Y)
  MID: 5.0, // divider: training (X<MID, 5000mm) | simulator (X>MID, 4800mm)
};

// Wall-segment breakpoints along X (A & B walls)
export const SEG = {
  x0: 0.0,
  x1: 2.0,   // door (B) / white (A)         -> 2000mm
  x2: 5.0,   // mirror end / training divider -> +3000mm = MID
  x3: 6.8,   // simulator: padded 1800mm
  x4: 9.8,   // simulator: padded +3000mm
};

// Full-body mirror (A wall + originally B wall): 1800 tall, sill 1000 off floor.
export const MIRROR = { w: 3.0, h: 1.8, sill: 1.0, x: 2.0 }; // spans x..x+w

// Top paint band on the training walls (黑灰色乳胶漆) — dark-grey above white.
export const TOPBAND = { y0: 2.55, y1: 3.0 };

// C-wall storage: white wall, dark-grey top band, welded pipe racks + cube seats.
export const CWALL = {
  bandY0: 2.55,            // dark-grey band start height
  rackY: [1.45, 2.05],     // two welded pipe-rack rail heights
  benchH: 0.42,            // cube rest-bench height
};

// Automatic glass door on B wall, left corner (training entrance)
export const DOOR = { x: 0.0, w: 2.0, h: 2.3 };

// Two simulator bays in the right half. Players hit toward +X (right wall = screens).
export const SIM = {
  xBack: 5.0,    // open side (toward training)
  xScreen: 9.8,  // right wall = impact screens
  zSplit: 4.0,   // teal padded divider between the two bays
  bay1: { z0: 4.0, z1: 8.0 }, // near A wall
  bay2: { z0: 0.0, z1: 4.0 }, // near B wall
};

// Two stretch bands hung straight down from the ceiling, one centred in EACH of
// the two training "squares". The training half (X 0..5) splits front/back at
// Z=4, giving squares centred at (2.5, 2.0) and (2.5, 6.0). Both share X=2.5 so
// they stay aligned as a deliberate pair (replaces the old swing-ball).
export const HANGBANDS = {
  y: 3.0,                  // ceiling anchor height
  drop: 1.15,              // band hangs down to this Y (handle height)
  points: [
    { x: 2.5, z: 2.0 },    // centre of the front training square (Z 0..4)
    { x: 2.5, z: 6.0 },    // centre of the back training square  (Z 4..8)
  ],
};

// A single YELLOW stretch handrail (ballet-barre style), WALL-MOUNTED on the
// A-wall in front of the mirror via horizontal brackets (no floor base plates).
// wallZ = the wall plane the brackets attach to.
export const HANDRAILS = [
  { x0: 2.4, x1: 4.6, z: 7.72, h: 1.0, wallZ: 8.0 }, // wall-mounted, A-wall mirror
];

export const COLOR = {
  // walls / structure
  white:      0xeae6dd, // 白色乳胶漆 — warm white
  bandGrey:   0x44474d, // 黑灰色乳胶漆 — dark-grey top band
  charcoal:   0x3a3d42, // backing / structure
  ceiling:    0xeceae4, // warm off-white ceiling
  // floor
  floor:      0x55585e, // medium grey rubber sports floor (grey-ish)
  line:       0xeceee9, // white floor markings
  // accents
  orange:     0xff6a13, // VORTEX brand accent + floor compass fan
  yellow:     0xf2c20c, // handrails / hitting bag
  // simulator
  paddingSim: 0x2f817b, // TEAL/sea-green quilted bay padding (matches real bays)
  turf:       0x4a9a3f, // simulator turf
  turfTee:    0x5fb04e, // tee mat
  screenFrm:  0x14171a,
  // materials
  steel:      0x33363b, // dark powder-coated steel (racks)
  steelLight: 0x8b9298, // brushed aluminium (door)
  oak:        0xb07d4e, // warm wood accents
  couch:      0x24262b,
  glass:      0x9fb8c4,
};
