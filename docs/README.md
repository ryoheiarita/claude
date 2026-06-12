# Enamel Pin Badge Generator

A 3D enamel-pin badge generator that runs entirely in the browser. Built with [Three.js](https://threejs.org/) (loaded from a CDN — no build step, no local dependencies).

**Live site:** `docs/index.html` — open it directly, or via GitHub Pages.

## Features

- **Metallic enamel material** — PBR metal frame + glossy enamel with studio reflections, beveled edges, top-bright lighting.
- **Frame shapes** — circle, diamond, pentagon, hexagon, crest, emblem (shield).
- **Colors** — pick the frame (metal) and interior (enamel) color independently, plus metal roughness.
- **Enamel image** — upload an image to replace the enamel color; it is cropped to the enamel shape.
- **Center emblem (SVG)** — upload an SVG to place as a raised metal emblem that fuses with the frame.
- **Accent fills** — multi-region SVGs become individually colorable enamel cells with metal outlines.
- **SVG → texture mode** — convert any SVG into the enamel-pin look (fills → enamel, outlines → metal).
- **3D view** — drag to rotate; Front / Back views are locked (drag to peek, springs back); Free orbit.
- **Lighting** — neutral studio presets + adjustable key-light direction / height / intensity.
- **Presets** — save the full state to the browser (localStorage); the last session is auto-restored.
- **Export** — render to PNG.

## Local use

Just open `index.html` in a modern browser (Chrome/Safari/Firefox). It needs an internet connection to load Three.js from the CDN.

## Deploy (GitHub Pages)

This folder is the Pages root. In the repository **Settings → Pages**, set **Source: Deploy from a branch → `main` / `/docs`**.
