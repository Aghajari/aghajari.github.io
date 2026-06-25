---
title: "Implementing Kernel Threads in xv6"
subtitle: "Go beyond processes — a practical guide to adding real kernel threads to a teaching OS."
summary: "xv6 gives you processes, but not threads. This article goes into the kernel and adds them: shared address spaces, new system calls, and a scheduler that understands threads. It blends the theory of concurrency with the very concrete work of editing an operating system and watching it run."
mediumUrl: "https://medium.com/@aghajari/implementing-kernel-threads-in-xv6-4e533fc17291"
date: 2025-05-01
readingTime: 22
theme: systems
keyIdeas:
  - "A thread is a process that shares its address space with siblings."
  - "New syscalls (clone/join) are needed to create and reap threads."
  - "The scheduler and trap frames must be adapted to schedule threads, not just processes."
  - "Synchronization becomes essential the moment memory is shared."
technologies:
  - "C"
  - "xv6"
  - "Operating Systems"
  - "Concurrency"
  - "Scheduling"
featured: false
order: 4
---

Processes are isolated; threads share. This guide takes the xv6 teaching kernel and gives it true kernel threads — shared memory, new system calls, and a scheduler that knows the difference — bridging OS theory and hands-on kernel hacking.
