---
title: "Shading the Canvas: Vertex & Fragment Shaders"
subtitle: "The two tiny programs that decide where things go and what color they are."
summary: "Every pixel on the GPU passes through two small programs: a vertex shader that decides position, and a fragment shader that decides color. This article introduces both in OpenGL ES 3, explaining how they cooperate to turn geometry into the images you see — the conceptual core of the whole series."
mediumUrl: "https://medium.com/@aghajari/shading-the-canvas-a-beginners-guide-to-vertex-and-fragment-shaders-f2a0b446294f"
date: 2023-12-17
readingTime: 5
theme: shader
series: "Mastering OpenGL ES 3"
keyIdeas:
  - "The vertex shader runs per vertex and computes positions."
  - "The fragment shader runs per pixel and computes color."
  - "Varyings pass interpolated data from vertices to fragments."
  - "Understanding this pair unlocks nearly all real-time graphics."
technologies:
  - "OpenGL ES"
  - "GLSL"
  - "Shaders"
  - "Graphics"
featured: false
order: 10
---

Two small programs do all the heavy lifting in real-time graphics. This article introduces the vertex and fragment shaders in OpenGL ES 3 — how they split the work of position and color, and why understanding them unlocks everything else.
