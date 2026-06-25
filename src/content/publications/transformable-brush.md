---
title: "TransformableBrush: Efficient Brush Animations in Compose"
subtitle: "Smooth shimmer and gradient effects in Jetpack Compose — without the allocation tax."
summary: "Brush animations in Compose are easy to write and easy to make slow: recreating a brush every frame quietly allocates on the hot path. This article builds a shimmer from scratch, finds the allocation problem, then fixes it with a transformable brush backed by LocalMatrix — keeping the effect smooth and cheap."
mediumUrl: "https://medium.com/@aghajari/transformablebrush-for-efficient-brush-animations-in-jetpack-compose-eb566278ac5d"
date: 2024-11-07
readingTime: 8
theme: compose
keyIdeas:
  - "A naive shimmer recreates its Brush every frame — allocations on the draw path."
  - "Brushes can be transformed instead of rebuilt, reusing the same shader."
  - "LocalMatrix lets you translate/scale the brush per frame for free."
  - "The result: identical visuals, far less garbage and smoother frames."
technologies:
  - "Jetpack Compose"
  - "Kotlin"
  - "Brush / Shader"
  - "Performance"
featured: true
order: 5
---

The fastest way to jank a Compose animation is to allocate inside `draw`. This article builds a shimmer, diagnoses exactly that mistake, and replaces it with a transformable brush — same effect, a fraction of the cost.
