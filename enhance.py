#!/usr/bin/env python3
"""Photoreal enhancement of the 3D draft renders via Gemini (Nano Banana Pro).
Each draft render is used as a structural/composition guide; the model upgrades
materials, lighting and realism while preserving geometry and camera framing."""
import base64, json, os, sys, time, subprocess, urllib.request, urllib.error

HERE = os.path.dirname(os.path.abspath(__file__))
ENV  = "/Users/leomu/Desktop/CheapUbers marketing/.env"

# Backend: "aistudio" (generativelanguage API key) or "vertex" (Cloud project).
# Vertex routes billing to the GCP project's billing account ($1800 credits live there),
# bypassing the depleted AI Studio prepay balance. Auth uses the Agent-Platform-bound
# API key (GOOGLE_AGENT_API_KEY), which authenticates as the vertex-ai@ service account.
BACKEND  = os.environ.get("BACKEND", "vertex")
PROJECT  = os.environ.get("GCP_PROJECT", "iconic-treat-434923-a2")
# Nano Banana 2 (gemini-3.1-flash-image) is served from the GLOBAL region only.
LOCATION = os.environ.get("GCP_LOCATION", "global")
# SIMPLE=1 swaps the long detailed prompt for a short "just make it a real photo"
# instruction — less likely to distort the draft (per client: keep prompt simple sometimes).
SIMPLE   = os.environ.get("SIMPLE", "") not in ("", "0", "false", "False")

def load_key(name):
    for line in open(ENV):
        if line.startswith(name + "="):
            return line.split("=",1)[1].strip().strip('"')
    raise SystemExit("no " + name)

if BACKEND == "vertex":
    KEY = load_key("GOOGLE_AGENT_API_KEY")
    # Nano Banana 2 (gemini-3.1-flash-image) — confirmed live on the GLOBAL Vertex
    # endpoint for this project (it 404s on us-central1). Far more photoreal than
    # 2.5-flash-image; we use ONLY this model (no 2.5 fallback, per client).
    MODELS = ["gemini-3.1-flash-image"]
else:
    KEY = load_key("GEMINI_API_KEY")
    MODELS = ["gemini-3.1-flash-image", "gemini-2.5-flash-image"]

STYLE = (
    "RAW photo, ultra-realistic interior photograph of a REAL brick-and-mortar "
    "golf-simulator and sports-performance training studio (brand 'VORTEX' / 飓风运动表现), "
    "shot on a full-frame DSLR with a 24mm lens, natural realistic lighting, true-to-life. "
    "This is a real physical training gym photographed with a camera — NOT a 3D render, "
    "NOT CGI, NOT a video game, NOT a cartoon, NOT an illustration. The golf simulators "
    "are real physical hitting bays: a real projector/impact screen showing actual "
    "golf-course footage, a real overhead launch monitor, a real green turf hitting mat. "
    "Use the attached draft render ONLY as a layout/composition guide. CRITICAL: keep the "
    "EXACT same camera angle, composition, perspective, proportions, wall layout and "
    "placement of every object as in the draft. Do not add, remove or move walls or "
    "equipment. DO NOT add any people. DO NOT add sofas or couches. Rebuild every surface "
    "with photoreal real-world materials, textures, lighting, soft contact shadows and "
    "subtle realistic reflections. "
    "STYLE & MOOD: this is a REAL, working, hands-on sports-training workshop — functional, "
    "lived-in and densely packed with lots of colourful equipment, pleasantly "
    "'organised-busy'. It is NOT a glossy high-end designer gym, NOT a minimalist luxury "
    "showroom — it is a practical, goal-focused training studio. Warm, inviting colour grade. "
    "LIGHTING IS CRITICAL: the studio is BRIGHT, airy, clean and welcoming — high-key, "
    "abundant even WARM-white LED ceiling light filling the whole room; NO gloom, NO heavy "
    "dark shadows, NO underexposure, NO moody dim lighting. Light, fresh and inviting like a "
    "real popular studio photographed for a Google Maps or Dianping listing. "
    "Sharp, high-resolution, professional architectural real-estate photography, "
    "photorealistic, no text watermarks, no fisheye distortion, no CGI or render look."
)

# Identical surface spec appended to EVERY prompt so the same room reads the same
# in every shot (fixes wall/padding/floor drifting between close-ups and wides).
MATERIALS_BIBLE = (
    "MATERIALS BIBLE — every photo in this set is the SAME physical studio, so these "
    "surfaces must look IDENTICAL in every shot: "
    "(1) Training walls: warm matte WHITE painted plaster, with a dark charcoal-grey "
    "painted band along the very TOP of the wall — flat, even, no pattern. The wall above "
    "the glass entrance door is clean WHITE with NO brand sign, logo or lettering. "
    "(2) Training floor: MEDIUM-GREY rubber sports flooring with crisp painted WHITE "
    "markings — a numbered target grid, an agility ladder and straight alignment lanes — "
    "plus one bright ORANGE radial compass/sunburst marking; the painted lines never overlap. "
    "(3) Simulator area: ONE open simulator room with TWO adjacent hitting bays side by "
    "side — there is NO wall, screen or divider separating the two bays; they share the "
    "same open floor. Walls lined with TEAL / sea-green quilted acoustic padding "
    "(diamond-stitched) with thin vivid orange (#ff6a13) vertical accent stripes; the "
    "hitting mats and floor are MATTE flat artificial green turf — completely non-reflective, "
    "no gloss, no shine, no mirror-like highlights. Each bay has a large matte "
    "impact/projection screen showing a cinematic golf course at DAWN with a glowing blue "
    "shot-tracer arc and a small modern data HUD; a black ceiling projector and a small white "
    "overhead launch monitor on a single slim ceiling beam (NO extra glowing light bars); and "
    "a black simulator console/PC box on the turf. NO sofas, NO people in the bays. "
    "(4) Left storage wall: welded black steel HORIZONTAL pipe racks holding rows of "
    "colourful medicine balls, slam balls and big exercise balls, a misc rack, a rack of "
    "hanging rainbow resistance bands, and a low welded ball rack in the bottom corner by the "
    "entrance. Along the floor in front of this wall sit TWO separate little islands of padded "
    "CUBE rest-stools — small upholstered cube seats (orange, charcoal and teal) packed "
    "together into an upper block and a lower block. "
    "(5) Equipment everywhere (workshop-busy): colourful resistance bands, kettlebells, black "
    "foam plyo jump-boxes, foam rollers, red balance discs, a YELLOW heavy bag, a black gym "
    "bench, and alignment sticks / weighted clubs in a wall rack. "
    "(6) ONE single YELLOW stretch handrail (ballet-barre style) WALL-MOUNTED on steel "
    "brackets to the mirrored training wall — it is fixed to the wall, NOT freestanding, "
    "with NO floor posts and NO floor base plates. There is only ONE handrail in the whole "
    "studio. "
    "(7) Metal: brushed aluminium (the automatic glass door) and dark powder-coated steel "
    "(racks). Warm natural-wood accents. "
    "(8) Lighting: warm-white, even, recessed LED ceiling panels; bright, clean, airy. "
    "Keep wall colour, grey floor, white markings, orange compass, TEAL bay padding, turf, "
    "racks, gadget colours and lighting EXACTLY consistent across all images."
)

ANCHOR_VIEW = 1  # the finished view used as the style/material reference for the rest

VIEWS = {
 1: "Wide establishing shot from just inside the automatic glass entrance door, looking "
    "DIAGONALLY across the whole studio. RIGHT: the open golf-simulator bays — TEAL quilted "
    "padding, matte green turf, a big screen showing a dawn golf course with a glowing blue "
    "shot-tracer, a black console box; no people, no sofas. LEFT: the busy training area — "
    "medium-grey rubber floor with white grid markings and an orange compass, the left "
    "storage wall with welded ball racks and TWO little cube-stool seating islands, colourful "
    "resistance bands, a big exercise ball, jump boxes and a black gym bench. The white wall "
    "above the door is clean with NO sign.",
 2: "Looking along the long LEFT STORAGE WALL: welded black-steel horizontal pipe racks "
    "neatly packed with rows of colourful medicine balls, slam balls and big exercise balls, "
    "a misc rack with foam blocks and rolled mats, a rack of hanging rainbow resistance bands, "
    "and a low welded ball rack in the far corner. Along the floor sit TWO separate little "
    "islands of padded CUBE rest-stools (an upper block and a lower block), small upholstered "
    "cubes packed together. Warm white wall with a dark-grey top band; medium-grey rubber floor.",
 3: "Standing at the mouth of the open simulator room, looking straight DOWN-THE-LINE into a "
    "hitting bay toward the big impact screen: MATTE flat green turf with a hitting mat and a "
    "teed ball in the foreground, TEAL quilted padding with thin orange stripes on the walls, "
    "the screen showing a cinematic DAWN golf course with a glowing blue shot-tracer and a "
    "small data HUD, a black projector and white launch monitor on a slim ceiling beam. The "
    "second bay is open alongside with NO divider. No people, no sofas.",
 4: "Looking across BOTH open simulator bays side by side — one continuous simulator room "
    "with NO wall or divider between them. Two big screens showing the dawn golf course with "
    "shot-tracers, two matte non-reflective green turf hitting mats, TEAL quilted padded walls "
    "with orange accent stripes, two black console boxes, overhead launch monitors and "
    "projectors. Bright and clean, no people, no sofas.",
 5: "Training area looking toward the wall-mounted full-body MIRROR that realistically "
    "reflects the busy studio; a single YELLOW ballet-barre handrail is mounted ON the "
    "mirrored wall on steel brackets (fixed to the wall, not freestanding, no floor base "
    "plates); medium-grey rubber floor with white alignment lanes and the orange compass; two "
    "stretch bands hang straight down from the ceiling forming a neat aligned pair; bright, "
    "clean and busy.",
 6: "Close view of one of the padded CUBE rest-stool seating islands on the floor against the "
    "left storage wall — a tidy cluster of small upholstered cube seats in orange, charcoal "
    "and teal packed together — with welded ball racks and hanging rainbow resistance bands on "
    "the wall above, and red balance discs and kettlebells nearby on the grey rubber floor. "
    "Warm, lived-in boutique-studio feel.",
 7: "Elevated dollhouse-style wide overview of the whole studio: the open TEAL golf-simulator "
    "bays with screens and green turf on the right, the busy training area on the left with "
    "grey floor markings and the orange compass, the left storage wall with welded ball racks "
    "and the TWO cube-stool seating islands, and lots of colourful equipment; warm, lively and "
    "professional.",
}

def call(model, prompt, images):
    parts = [{"text": prompt}]
    for b64 in images:
        parts.append({"inline_data": {"mime_type": "image/png", "data": b64}})
    body = {
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
    }
    if BACKEND == "vertex":
        host = "aiplatform.googleapis.com" if LOCATION == "global" else f"{LOCATION}-aiplatform.googleapis.com"
        url = (f"https://{host}/v1/projects/{PROJECT}/locations/{LOCATION}"
               f"/publishers/google/models/{model}:generateContent")
        headers = {"Content-Type": "application/json", "x-goog-api-key": KEY}
    else:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={KEY}"
        headers = {"Content-Type": "application/json"}
    req = urllib.request.Request(url, data=json.dumps(body).encode(), headers=headers)
    with urllib.request.urlopen(req, timeout=240) as r:
        return json.load(r)

def extract_image(resp):
    # Nano Banana 2 interleaves reasoning text and can emit an intermediate image
    # before the final one — always take the LAST image part (the finished result).
    last = None
    for c in resp.get("candidates", []):
        for p in c.get("content", {}).get("parts", []):
            d = p.get("inlineData") or p.get("inline_data")
            if d and d.get("data"):
                last = d["data"]
    return last

def enhance(idx):
    src = os.path.join(HERE, "renders", f"view-{idx:02d}.png")
    if not os.path.exists(src):
        print("missing", src); return False
    draft_b64 = base64.b64encode(open(src, "rb").read()).decode()
    outdir = os.path.join(HERE, "renders_photoreal"); os.makedirs(outdir, exist_ok=True)

    if SIMPLE:
        prompt = (
            "Turn this draft 3D render into a realistic, professional real-estate-style "
            "PHOTOGRAPH of a real golf-simulator and fitness training studio. Keep the EXACT "
            "same layout, camera angle, composition, proportions and the position of every "
            "object — only upgrade the materials, textures and lighting so it looks like a real "
            "photo taken with a camera. Bright, clean, warm and true-to-life. No people, no "
            "extra furniture. Not a render, not CGI, not a video game."
        )
    else:
        prompt = STYLE + "\n\n" + MATERIALS_BIBLE + "\n\nScene: " + VIEWS[idx]
    images = [draft_b64]

    # Consistency: condition every non-anchor view on the FINISHED anchor photo so
    # all shots read as the same physical room (matching walls, padding, floor, turf).
    anchor_path = os.path.join(outdir, f"view-{ANCHOR_VIEW:02d}.png")
    if idx != ANCHOR_VIEW and os.path.exists(anchor_path):
        ref_b64 = base64.b64encode(open(anchor_path, "rb").read()).decode()
        if SIMPLE:
            prompt += (
                "\n\nThe FIRST attached image is a finished real photo of THIS SAME studio — "
                "match its materials, colours and lighting. The SECOND image is the draft layout "
                "for THIS shot — keep its camera angle, composition and the position of every object."
            )
        else:
            prompt += (
                "\n\nThe FIRST attached image is a finished photoreal reference photo of THIS "
                "SAME studio. Match its exact wall colours, white sections, TEAL/sea-green quilted "
                "padding with orange stripes, floor, matte green turf, metal finishes and lighting so "
                "this looks like the identical physical room shot from another angle. The SECOND "
                "attached image is the draft layout guide for THIS shot — follow its camera "
                "angle, composition, perspective and the placement of every object, but rebuild "
                "all materials photoreal to match the reference photo."
            )
        images = [ref_b64, draft_b64]

    for model in MODELS:
        for attempt in range(5):
            try:
                resp = call(model, prompt, images)
                if "error" in resp:
                    print(f"view {idx} {model}: API error {resp['error'].get('status')} {resp['error'].get('message','')[:120]}")
                    break
                b64 = extract_image(resp)
                if b64:
                    out = os.path.join(outdir, f"view-{idx:02d}.png")
                    open(out, "wb").write(base64.b64decode(b64))
                    print(f"view {idx}: saved via {model} ({os.path.getsize(out)//1024} KB)")
                    return True
                else:
                    txt = json.dumps(resp)[:160]
                    print(f"view {idx} {model}: no image part. {txt}")
            except urllib.error.HTTPError as e:
                print(f"view {idx} {model}: HTTP {e.code} {e.read()[:120]}");
                if e.code in (429, 500, 503): time.sleep(22); continue
                break
            except Exception as e:
                print(f"view {idx} {model}: {e}"); time.sleep(3)
    return False

if __name__ == "__main__":
    args = sys.argv[1:]
    idxs = [int(a) for a in args] if args else list(VIEWS.keys())
    ok = 0
    for i in idxs:
        if enhance(i): ok += 1
        time.sleep(1)
    print(f"\n{ok}/{len(idxs)} enhanced")
