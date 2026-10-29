# GB UNIT V24 — No Regression / One Canonical Actor

## User acceptance contract
1. The GB UNIT designed in `assets/characters/gb-unit-ref.webp`, whose accepted split elements are mapped in `skin-catalog.js`, remains the **only approved character**.
2. At **0°**, #gbFitFigure must present exactly the established V19 composition, using the same images, crop anchors and fit semantics for top, bottom, shoe, cap, and hood. No manually recreated garments may replace that front.
3. At **±90° and 180°**, actual WebGL geometry with depth must rotate, not a mirrored image. The actor must return to 0° with the unchanged selected IDs and original fit.
4. The `GBFitting.state` contract remains the single source of outfit truth, also exposed through `GBActor.state`. There is no second independently selected robot.
5. Preserved interactions: arrow/cycle, selecting pieces, shuffle, save/restore, A/B comparison, emotes, keyboard, cursor and touch. Do not regress these.
6. No product provenance claims about undocumented rear/side views. Preview labels must say simulated back.

## Technical implementation
The canonical actor uses a **reference-front surface** (the established V19 SVG/photo fit compositor) over the same WebGL actor's volume. The projection smoothly fades when orbiting and returns to full alpha at zero yaw. It is a temporary fidelity bridge, not a fully photographed 360-degree garment. Users are not offered two separate character choices.

A side/back helmet UV is reconstructed at runtime from the approved black/gold head reference, with simulated armor detailing and no duplicated eyes on the back. The garment volume uses photos for frontal texture projection plus category-aware geometry and material sampling. Shoe side projection is corrected along length and height, rather than a flattened sphere.

The render clock targets 60fps during user input, rotation, gesture and dance, and uses a lower idle budget on mobile. WebGL stops when out of view; the front projection also synchronizes at angle settlement even if GPU rendering is paused.

## Independent regression
`tests/actor-v24.mjs`:
- Validate official head and both hands still exist and original front is visible.
- Switch top, bottom, shoe, cap; ensure all product IDs match both DOM and shared state.
- Orbit 90, 180, 0; the side and rear use WebGL while the original front and fit return intact.
- Validate 1440×900, 390×844 and no page JavaScript errors/overflow.
- CI: `.github/workflows/gb-actor-3d.yml` plus legacy full site E2E in `gb-crt-integrity.yml`.

## Remaining hard requirements before claiming completion
- Exact same 3D shell silhouette and armor engravings at all angles needs authored/approved rear/side GB UNIT references or a textured humanoid GLB with verified likeness and bone weights.
- Exact genuine product-side/back 360 needs photo turnarounds or scanned product GLB/UV per SKU; current 3D sides and rears are **editorial estimations**.
- The reference Jamal arm mechanics require shoulder/elbow/wrist retarget, foot locking and human mocap-grade evaluation.
- iOS Safari/physical mobile FPS, context loss and memory QA remain outstanding.
- Do not merge to `main` or deploy production without visual sign-off on all garments. Production is intentionally untouched.
