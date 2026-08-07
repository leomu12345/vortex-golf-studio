"""
VORTEX Golf Studio — portfolio front end.

The actual deliverable is a self-contained Three.js/WebXR app (index.html +
src/*.js, CDN-loaded Three.js, no build step, no backend) that also lives in
this repo and is hosted separately on GitHub Pages -- that's what gives a
real interactive orbit view *and* a working VR button, neither of which
Streamlit can render natively. This page wraps that live viewer in an
iframe alongside the AI-photoreal render gallery, the raw high-res CAD
views, and a CAD (.glb) download, so the whole deliverable is reachable
from one link.
"""

from __future__ import annotations

from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

st.set_page_config(page_title="VORTEX Golf Studio", page_icon="⛳", layout="wide")

ROOT = Path(__file__).resolve().parent
PHOTOREAL_DIR = ROOT / "renders_photoreal"
DRAFT_DIR = ROOT / "renders"
GLB_PATH = ROOT / "vortex-golf-studio.glb"
LIVE_VIEWER_URL = "https://leomu12345.github.io/vortex-golf-studio/"

PHOTOREAL_CAPTIONS = [
    "Training corner + dual simulator bays — wide angle",
    "Training wall storage — medicine balls, resistance bands, foam rollers",
    "Simulator bay, down-the-line — live shot tracer + carry/ball-speed HUD",
    "Twin simulator screens — course view with stats overlay",
    "Mirror wall with VORTEX branding, entrance door reflected",
    "Training corner — punching bag, cube stools, kettlebells, resistance bands",
    "Wide overview — training zone + all three simulator bays",
]

DRAFT_CAPTIONS = [
    "Overhead bird's-eye of the whole studio",
    "Training-area wall storage + auto sliding entrance door",
    "B-wall — entrance door and club/ball storage, front-on",
    "A-wall — mirror and resistance-band handrail, front-on",
    "Two golf-simulator bays, front-on",
    "Overhead dollhouse view from the storage side",
]

st.title("⛳ VORTEX Golf Studio")
st.caption(
    "3D design mockup for VORTEX (飓风运动表现) — a golf-simulator + fitness training studio. "
    "Client deliverable: an interactive 3D/VR walkthrough, AI-photoreal renders, and an "
    "exportable CAD model, all generated from one procedural Three.js scene."
)
st.info(
    "**One Three.js scene, three outputs.** The room, simulator bays, and every prop are built "
    "procedurally in code (`src/*.js`) — that single scene is what you can orbit live below, what "
    "gets exported to a CAD-interchange `.glb`, and what an AI image pass turns into photoreal "
    "client-facing renders. Nothing here is hand-modeled per view."
)

tab_3d, tab_photos, tab_cad, tab_draft = st.tabs(
    ["🕹️ Interactive 3D / VR", "📷 Photoreal renders", "📐 CAD model", "🧱 Raw 3D views"]
)

with tab_3d:
    st.subheader("Live, interactive — drag to orbit, scroll to zoom, VR button if your device supports it")
    st.caption(
        f"This is the real app running live from GitHub Pages ([open full-screen]({LIVE_VIEWER_URL})) — "
        "not a screenshot or video."
    )
    components.html(
        f'<iframe src="{LIVE_VIEWER_URL}" '
        'style="width:100%;height:750px;border:0;border-radius:12px;" '
        'allow="xr-spatial-tracking; fullscreen" allowfullscreen></iframe>',
        height=770,
    )

with tab_photos:
    st.subheader("AI-photoreal renders")
    st.caption(
        "Each frame starts as a raw render straight out of the Three.js scene, then goes through an "
        "image-to-image AI pass (Gemini / Nano Banana via Vertex AI) constrained to the same camera "
        "layout and a shared materials spec, so all 7 views read as one consistent physical room."
    )
    files = sorted(PHOTOREAL_DIR.glob("view-*.png"))
    cols = st.columns(2)
    for i, f in enumerate(files):
        caption = PHOTOREAL_CAPTIONS[i] if i < len(PHOTOREAL_CAPTIONS) else f.stem
        with cols[i % 2]:
            st.image(str(f), caption=caption, use_container_width=True)

with tab_cad:
    st.subheader("CAD-interchange model")
    st.caption(
        "Exported straight from the live scene via Three.js's GLTFExporter — same geometry, "
        "materials, and layout as the interactive viewer, importable into Blender, Unity, "
        "SketchUp, and most other 3D/CAD tools."
    )
    if GLB_PATH.is_file():
        size_mb = GLB_PATH.stat().st_size / (1024 * 1024)
        st.metric("File size", f"{size_mb:.2f} MB")
        with open(GLB_PATH, "rb") as f:
            st.download_button(
                "⬇️ Download vortex-golf-studio.glb",
                f,
                file_name="vortex-golf-studio.glb",
                mime="model/gltf-binary",
                type="primary",
            )
    else:
        st.warning("vortex-golf-studio.glb not found in this deployment.")

with tab_draft:
    st.subheader("Raw 3D views (no AI)")
    st.caption(
        "High-resolution renders straight out of the Three.js scene — the precise CAD geometry "
        "with no image-generation pass, useful for verifying exact layout and measurements."
    )
    files = sorted(DRAFT_DIR.glob("view-*.png"))
    cols = st.columns(2)
    for i, f in enumerate(files):
        caption = DRAFT_CAPTIONS[i] if i < len(DRAFT_CAPTIONS) else f.stem
        with cols[i % 2]:
            st.image(str(f), caption=caption, use_container_width=True)
