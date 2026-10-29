# GB Imports / Cinematic Glass Ribbon Intro V26

## Visual
- The reference is the filmed **Interference Ribbons** visual direction: fine glowing filaments twist into an organic S-fold, gold and ivory highlights, cinematic bloom.
- **Full-bleed glass** covers 100% of the viewport during the intro. No inset, no rounded card frame. Layering is dark charcoal, specular surface reflection, restrained grain, vignette and dynamic ribbons.
- The **original logo is not redrawn**: use `assets/brand/gb-monograma-amarelo-preto.svg`, identical to the approved pre-V25 opening.
- The mask boundary is gently curved and animates with the ribbon timeline. A slim luminous scan and bloom emerge when the official logo is revealed.
- The same canvas is reparented into the existing hero after the cinematic intro. There is **one renderer**, in an infinite loop while the hero is visible, reacting to both mouse and touch. All hero content, CTAs, products and Look Studio V2.0 remain untouched.

## Engineering
- Static HTML, CSS and Canvas2D; no React Bits Pro licensed code has been copied. Installing the exact commercial component requires authorization and an appropriate React/shadcn build system.
- Pixel ratio capped at 1.5 desktop and 1.2 mobile. 84 lines on desktop, 38 mobile, 56/34 samples respectively.
- Draw paused on hidden tab and outside hero viewport. `prefers-reduced-motion` provides static minimal glass. Pointer events captured only while fullscreen intro, then disabled for the hero decoration.
- Time and paint-cost profiling: `window.GBGlassRibbons.paintMs`. Avoid promising 60 FPS on physical devices without profiling.

## QA
Run `node scripts/build.mjs` and `node tests/intro-v26.mjs` from a server with `dist` at `http://127.0.0.1:8080/`. Both desktop 1440×900 and mobile 390×844 must pass: full-bleed glass, original logo asset path, cinematic reveal, infinite animation after intro, touch/mouse tracking, intact hero and fitting studio, zero horizontal overflow and zero JS errors.

## Deployment
Only preview. Production must remain on the stable 2D commit until explicit approval.
