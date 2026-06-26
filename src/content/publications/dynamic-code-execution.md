---
title: "Dynamic Code Execution in Java & Android"
subtitle: "Reflection, proxies and class loaders — how programs run code they didn't know about at compile time."
summary: "Java and Android can do something that feels impossible: run code that didn't exist when the app was built. This article walks through the three mechanisms that make it work — reflection, dynamic proxies and custom class loaders — and where each one earns its place in real systems like plugins, mocking and hot-loading."
mediumUrl: "https://medium.com/@aghajari/dynamic-code-execution-proxies-and-class-loading-in-java-and-android-97134d10be0c"
date: 2025-06-02
readingTime: 30
theme: systems
keyIdeas:
  - "Reflection lets you inspect and invoke members the compiler never linked."
  - "Dynamic proxies synthesize interface implementations at runtime — the backbone of many frameworks."
  - "Custom class loaders can load and isolate code that ships separately from the app."
  - "Together they enable plugins, mocking and runtime extension — with real trade-offs in safety and speed."
technologies:
  - "Java"
  - "Android"
  - "Reflection"
  - "ClassLoader"
  - "Dynamic Proxy"
featured: true
order: 3
---

How can an app execute code it has never seen? This piece demystifies the runtime machinery — reflection, proxies and class loaders — that powers plugin systems, dependency injection and dynamic frameworks.
