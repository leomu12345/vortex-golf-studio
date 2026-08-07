"""
VORTEX Golf Studio — portfolio front end.

A friend was mocking up a golf-simulator + fitness studio and needed real
visuals to brief her construction team. This procedural Three.js scene is
the single source for everything below: an interactive walkthrough, AI
photoreal renders, and an exportable CAD model.

The actual deliverable is a self-contained Three.js/WebXR app (index.html +
src/*.js, CDN-loaded Three.js, no build step, no backend) that also lives in
this repo and is hosted separately on GitHub Pages -- that's what gives a
real interactive orbit view *and* a working VR button, neither of which
Streamlit can render natively.

This page used to embed that viewer directly in an iframe. Dropped that:
Chrome (and other browsers, in some configurations) refuses to create a
WebGL context for third-party iframed content -- confirmed by reproducing
"Error creating WebGL context" even in a plain, unsandboxed cross-origin
iframe with no Streamlit involved at all. That's a browser security
restriction, not something fixable from either app's code. Instead, this
page shows a preview and launches the real viewer in a new tab -- a
top-level page load, which has none of that restriction and has been
reliable in every test.
"""

from __future__ import annotations

from pathlib import Path

import streamlit as st

_lang_default = st.session_state.get("lang_toggle", "EN")
st.set_page_config(
    page_title="VORTEX Golf Studio" if _lang_default == "EN" else "VORTEX 高尔夫训练馆",
    page_icon="⛳",
    layout="wide",
)

ROOT = Path(__file__).resolve().parent
PHOTOREAL_DIR = ROOT / "renders_photoreal"
DRAFT_DIR = ROOT / "renders"
GLB_PATH = ROOT / "vortex-golf-studio.glb"
LIVE_VIEWER_URL = "https://leomu12345.github.io/vortex-golf-studio/"

# ----------------------------------------------------------------------------
# Translations
# ----------------------------------------------------------------------------

TR = {
    "EN": {
        "title": "⛳ VORTEX Golf Studio",
        "hero": (
            "A friend was mocking up a golf-simulator and fitness studio and needed real "
            "visuals to brief her construction team. I built VORTEX: one procedural 3D scene "
            "that exports an interactive walkthrough, photoreal renders, and a CAD model — "
            "all from the same source, all generated, nothing photographed."
        ),
        "fact_client": "Client: VORTEX (飓风运动表现)",
        "fact_deliverable": "Paid client deliverable",
        "fact_stack": "Three.js scene, no build step",
        "tab_3d": "🕹️ Interactive 3D / VR",
        "tab_photos": "📷 Photoreal renders",
        "tab_cad": "📐 CAD model",
        "tab_draft": "🧱 Raw 3D views",
        "live_subheader": "Live — drag to orbit, scroll to zoom, VR button if your device supports it",
        "live_caption": (
            "This is the live scene running from GitHub Pages, not a screenshot or video. It "
            "opens in a new tab because browsers block WebGL inside third-party iframes — a "
            "browser restriction, not a limitation of this app."
        ),
        "launch_button": (
            '🕹️ Launch interactive<br/>3D / VR viewer<br/><span style="font-weight:400; '
            'font-size:0.85rem; opacity:0.9;">opens in a new tab ↗</span>'
        ),
        "launch_caption": "Drag to orbit · scroll to zoom · VR button if your device supports it.",
        "photos_subheader": "AI-photoreal renders",
        "photos_caption": (
            "Each frame starts as a raw render straight out of the Three.js scene, then goes "
            "through an image-to-image AI pass (Gemini / Nano Banana via Vertex AI) constrained "
            "to the same camera layout and materials, so all 7 views read as one consistent room."
        ),
        "cad_subheader": "CAD-interchange model",
        "cad_caption": (
            "Exported straight from the live scene via Three.js's GLTFExporter — same geometry, "
            "materials, and layout as the interactive viewer, importable into Blender, Unity, "
            "SketchUp, and most other 3D/CAD tools."
        ),
        "file_size": "File size",
        "download_button": "⬇️ Download vortex-golf-studio.glb",
        "glb_missing": "vortex-golf-studio.glb not found in this deployment.",
        "draft_subheader": "Raw 3D views (no AI)",
        "draft_caption": (
            "High-resolution renders straight out of the Three.js scene — precise CAD geometry, "
            "no image-generation pass, useful for checking exact layout and measurements."
        ),
        "footer": "Project made by Leo Mu",
        "photoreal_captions": [
            "Training corner + dual simulator bays — wide angle",
            "Training wall storage — medicine balls, resistance bands, foam rollers",
            "Simulator bay, down-the-line — live shot tracer + carry/ball-speed HUD",
            "Twin simulator screens — course view with stats overlay",
            "Mirror wall with VORTEX branding, entrance door reflected",
            "Training corner — punching bag, cube stools, kettlebells, resistance bands",
            "Wide overview — training zone + all three simulator bays",
        ],
        "draft_captions": [
            "Overhead bird's-eye of the whole studio",
            "Training-area wall storage + auto sliding entrance door",
            "B-wall — entrance door and club/ball storage, front-on",
            "A-wall — mirror and resistance-band handrail, front-on",
            "Two golf-simulator bays, front-on",
            "Overhead dollhouse view from the storage side",
        ],
    },
    "中文": {
        "title": "⛳ VORTEX 高尔夫训练馆",
        "hero": (
            "朋友在筹备一家高尔夫模拟器 + 健身训练馆，需要实景效果图去和施工团队沟通方案。我做了 "
            "VORTEX：同一个程序化生成的 3D 场景，直接导出可交互漫游演示、AI 照片级渲染图，以及一份 "
            "CAD 模型——全部生成，没有一张是实拍。"
        ),
        "fact_client": "客户：VORTEX（飓风运动表现）",
        "fact_deliverable": "付费客户项目",
        "fact_stack": "Three.js 场景，无需构建步骤",
        "tab_3d": "🕹️ 互动 3D / VR",
        "tab_photos": "📷 照片级渲染图",
        "tab_cad": "📐 CAD 模型",
        "tab_draft": "🧱 原始 3D 视图",
        "live_subheader": "实时场景——拖动旋转，滚轮缩放，设备支持时可用 VR 按钮",
        "live_caption": (
            "这是从 GitHub Pages 实时运行的场景，不是截图或视频。因为浏览器会阻止第三方 iframe "
            "里的 WebGL，所以在新标签页打开——这是浏览器的限制，不是本应用的问题。"
        ),
        "launch_button": (
            '🕹️ 启动互动<br/>3D / VR 查看器<br/><span style="font-weight:400; '
            'font-size:0.85rem; opacity:0.9;">在新标签页打开 ↗</span>'
        ),
        "launch_caption": "拖动旋转 · 滚轮缩放 · 设备支持时可用 VR 按钮。",
        "photos_subheader": "AI 照片级渲染图",
        "photos_caption": (
            "每张图先从 Three.js 场景直出原始渲染，再经过图生图 AI 处理（Gemini / Nano Banana，"
            "通过 Vertex AI），统一机位和材质设定，让全部 7 个视角看起来像同一个真实房间。"
        ),
        "cad_subheader": "可交换 CAD 模型",
        "cad_caption": (
            "直接用 Three.js 的 GLTFExporter 从实时场景导出——几何体、材质、布局和互动查看器完全"
            "一致，可导入 Blender、Unity、SketchUp 等大多数 3D/CAD 工具。"
        ),
        "file_size": "文件大小",
        "download_button": "⬇️ 下载 vortex-golf-studio.glb",
        "glb_missing": "本次部署未包含 vortex-golf-studio.glb 文件。",
        "draft_subheader": "原始 3D 视图（无 AI 处理）",
        "draft_caption": (
            "直接从 Three.js 场景导出的高分辨率渲染图——精确的 CAD 几何体，未经 AI 生成处理，"
            "适合核对具体布局和尺寸。"
        ),
        "footer": "项目制作：Leo Mu",
        "photoreal_captions": [
            "训练区 + 双模拟器机位——广角",
            "训练区墙面收纳——药球、阻力带、泡沫轴",
            "模拟器机位，沿击球线视角——实时弹道追踪 + 击球速度数据",
            "双模拟器屏幕——球场视角，叠加数据面板",
            "镜面墙与 VORTEX 品牌标识，映出入口门",
            "训练区——拳击沙包、方块凳、壶铃、阻力带",
            "整体俯瞰——训练区 + 三个模拟器机位",
        ],
        "draft_captions": [
            "整个训练馆的俯瞰视角",
            "训练区墙面收纳 + 自动感应推拉门",
            "B 墙——入口门与球杆/球具收纳，正面视角",
            "A 墙——镜面墙与阻力带扶手，正面视角",
            "两个高尔夫模拟器机位，正面视角",
            "从收纳区一侧俯瞰的娃娃屋视角",
        ],
    },
}

top_l, top_r = st.columns([5, 1])
with top_r:
    lang = st.segmented_control(
        "Language",
        ["EN", "中文"],
        default="EN",
        key="lang_toggle",
        label_visibility="collapsed",
    )
T = TR[lang]

st.title(T["title"])
st.markdown(T["hero"])
fact_cols = st.columns(3)
fact_cols[0].caption(f"🎯 {T['fact_client']}")
fact_cols[1].caption(f"💼 {T['fact_deliverable']}")
fact_cols[2].caption(f"⚙️ {T['fact_stack']}")

st.divider()

tab_3d, tab_photos, tab_cad, tab_draft = st.tabs(
    [T["tab_3d"], T["tab_photos"], T["tab_cad"], T["tab_draft"]]
)

with tab_3d:
    st.subheader(T["live_subheader"])
    st.caption(T["live_caption"])
    col_preview, col_launch = st.columns([2, 1])
    with col_preview:
        preview = PHOTOREAL_DIR / "view-01.jpg"
        if preview.is_file():
            st.image(str(preview), use_container_width=True)
    with col_launch:
        st.markdown(
            f'<a href="{LIVE_VIEWER_URL}" target="_blank" rel="noopener" style="'
            "display:flex; align-items:center; justify-content:center; text-align:center; "
            "height:100%; min-height:200px; background:#ff6a13; color:#fff; font-weight:700; "
            'font-size:1.1rem; border-radius:12px; text-decoration:none; padding:24px;">'
            f"{T['launch_button']}</a>",
            unsafe_allow_html=True,
        )
        st.caption(T["launch_caption"])

with tab_photos:
    st.subheader(T["photos_subheader"])
    st.caption(T["photos_caption"])
    files = sorted(PHOTOREAL_DIR.glob("view-*.jpg"))
    captions = T["photoreal_captions"]
    cols = st.columns(2)
    for i, f in enumerate(files):
        caption = captions[i] if i < len(captions) else f.stem
        with cols[i % 2]:
            st.image(str(f), caption=caption, use_container_width=True)

with tab_cad:
    st.subheader(T["cad_subheader"])
    st.caption(T["cad_caption"])
    if GLB_PATH.is_file():
        size_mb = GLB_PATH.stat().st_size / (1024 * 1024)
        st.metric(T["file_size"], f"{size_mb:.2f} MB")
        with open(GLB_PATH, "rb") as f:
            st.download_button(
                T["download_button"],
                f,
                file_name="vortex-golf-studio.glb",
                mime="model/gltf-binary",
                type="primary",
            )
    else:
        st.warning(T["glb_missing"])

with tab_draft:
    st.subheader(T["draft_subheader"])
    st.caption(T["draft_caption"])
    files = sorted(DRAFT_DIR.glob("view-*.jpg"))
    captions = T["draft_captions"]
    cols = st.columns(2)
    for i, f in enumerate(files):
        caption = captions[i] if i < len(captions) else f.stem
        with cols[i % 2]:
            st.image(str(f), caption=caption, use_container_width=True)

st.divider()
st.caption(T["footer"])
