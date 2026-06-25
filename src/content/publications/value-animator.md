---
title: "How ValueAnimator Makes Android's UI Dance"
subtitle: "Choreographer, the main Looper, and what really happens under an Android animation."
summary: "Every Android animation rides on the same hidden machinery. This article follows a single ValueAnimator from start() to the screen — through the Choreographer's frame callbacks and the main Looper — and then rebuilds a tiny animator by hand so the magic stops being magic."
mediumUrl: "https://medium.com/@aghajari/how-valueanimator-makes-androids-ui-dance-01c325d79e42"
date: 2024-08-24
readingTime: 10
theme: motion
keyIdeas:
  - "Animations are driven by the Choreographer's per-frame callbacks, synced to the display."
  - "The main Looper is the heartbeat that schedules every UI update."
  - "Interpolators and evaluators separate timing from the values being animated."
  - "You can build a working custom animator with surprisingly little code."
technologies:
  - "Android"
  - "ValueAnimator"
  - "Choreographer"
  - "Animation"
featured: true
order: 6
---

What actually moves a view? This article traces an animation from `start()` to pixels — the Choreographer, the Looper, interpolators — then rebuilds a minimal animator from scratch to prove there's no magic, only good design.
