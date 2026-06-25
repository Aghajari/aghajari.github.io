---
title: "Liquid Glass: The iOS Effect, Explained"
subtitle: "Recreating Apple's Liquid Glass with shaders — the math behind distortion and chromatic aberration."
summary: "Apple's Liquid Glass looks like magic, but it's really a small stack of well-chosen math: a refraction-style distortion field, edge-aware highlights, and a touch of chromatic aberration. This preview breaks down how the effect is composed and how to recreate it in a fragment shader."
mediumUrl: "https://medium.com/@aghajari/liquid-glass-ios-effect-explanation-dabadd6414ae"
date: 2025-11-24
readingTime: 20
theme: shader
keyIdeas:
  - "Liquid Glass is a layered effect — distortion, highlight and dispersion — not a single filter."
  - "A distortion field bends the background sample coordinates to fake refraction through glass."
  - "Chromatic aberration splits the RGB channels by slightly different offsets near the edges."
  - "Edge falloff and specular highlights are what sell the 'liquid' feel."
technologies:
  - "GLSL / Shaders"
  - "Fragment Shader"
  - "Distortion"
  - "Chromatic Aberration"
featured: true
order: 1
---

Apple's *Liquid Glass* feels alive — light bends through it, colors fringe at the edges, and highlights slide as the surface moves. This article pulls the effect apart into its mathematical ingredients and rebuilds it, one shader pass at a time.
