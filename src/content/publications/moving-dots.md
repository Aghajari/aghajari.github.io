---
title: "Moving Dots: Animating Points in OpenGL ES"
subtitle: "From a single static point to motion — the next step in the OpenGL ES journey."
summary: "Once you can draw a point, the natural question is: how do you make it move? This article takes the single point from earlier in the OpenGL ES series and brings it to life — introducing time, uniforms and the loop that turns stillness into animation."
mediumUrl: "https://medium.com/@aghajari/moving-dots-a-beginners-guide-to-animated-points-from-stillness-to-motion-8f64af8cf02d"
date: 2023-12-27
readingTime: 11
theme: shader
series: "Mastering OpenGL ES 3"
keyIdeas:
  - "Animation in shaders is a function of a time uniform you feed each frame."
  - "Uniforms are the bridge between your app's clock and the GPU."
  - "Small changes to position over time create smooth, GPU-driven motion."
technologies:
  - "OpenGL ES"
  - "GLSL"
  - "Android"
  - "Animation"
featured: false
order: 7
---

A point that never moves is just a dot. This entry in the OpenGL ES series introduces time and uniforms to turn that static point into motion — the first real animation drawn entirely on the GPU.
