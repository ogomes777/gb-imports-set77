/* GB IMPORTS / PUFF V45 — mounts the user's original PlushTile inside the intro.
 * Props are the original Originkit preset (furColor, scale 115, radius 49, puff 10, response, breeze 10 and the
 * component's own artwork/fur/advanced defaults); only the picture is the local GB monogram. The entrance runs in
 * CSS on the host (the poster and the live tile share it), so the tile draws fully grown from its first frame —
 * there is never a frame of short stubble or a bare cushion.
 * Bundled by scripts/build.mjs (esbuild, React 19). The intro controller (gb-puff-intro.js) owns the timing.
 */
import React from 'react'
import { createRoot } from 'react-dom/client'
import PlushTile from './PlushTile.tsx'

let current = null

/** `breeze` is only overridden by the offline poster capture (0: the tile settles and stops drawing). */
function mount(node, { strandCap, allowSoftware = false, breeze } = {}) {
  if (current || !node || !node.isConnected) return false
  const root = createRoot(node)
  root.render(
    React.createElement(PlushTile, {
      image: { src: './assets/brand/gb-monograma-amarelo-preto.svg', alt: 'GB' },
      entrance: { animate: false },
      strandCap,
      allowSoftware,
      ...(breeze === undefined ? null : { breeze }),
    })
  )
  current = { root, node }
  return true
}

/** Unmounting runs the component's own cleanup: rAF, observers, listeners, textures, buffers, programs. */
function unmount() {
  if (!current) return
  const { root, node } = current
  current = null
  const canvas = node.querySelector('canvas')
  root.unmount()
  // Hand the GPU memory back now instead of whenever the context is collected.
  try { canvas?.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext() } catch {}
  if (canvas) { canvas.width = 0; canvas.height = 0 }
  node.textContent = ''
}

window.GBPlush = Object.freeze({ mount, unmount, get mounted() { return !!current } })
document.dispatchEvent(new Event('gb:plush-bundle'))
