type Cleanup = () => void;
const cleanups: Cleanup[] = [];

function addCleanup(fn: Cleanup) {
  cleanups.push(fn);
}

function runCleanups() {
  while (cleanups.length) cleanups.pop()?.();
}

function getScrollY() {
  return window.scrollY || document.documentElement.scrollTop || 0;
}

function homeAnchorOffset() {
  const header =
    document.getElementById("site-header")?.getBoundingClientRect().height ??
    68;
  const root = document.documentElement;
  const space7 = getComputedStyle(root).getPropertyValue("--space-7").trim();
  const rootPx = parseFloat(getComputedStyle(root).fontSize) || 16;
  const gap = space7.endsWith("rem")
    ? parseFloat(space7) * rootPx
    : parseFloat(space7) || 48;
  return header + gap;
}

function scrollToHomeAnchor(
  hash: string,
  behavior: ScrollBehavior = "smooth",
) {
  const target = document.querySelector<HTMLElement>(hash);
  if (!target?.classList.contains("home-anchor")) return false;
  const top =
    target.getBoundingClientRect().top + getScrollY() - homeAnchorOffset();
  window.scrollTo({ top: Math.max(0, top), behavior });
  return true;
}

function bindHomeAnchors() {
  const isHome = (location.pathname.replace(/\/$/, "") || "/") === "/";
  if (!isHome) return;

  const syncHash = (behavior: ScrollBehavior = "auto") => {
    if (location.hash) scrollToHomeAnchor(location.hash, behavior);
  };

  requestAnimationFrame(() => requestAnimationFrame(() => syncHash("auto")));

  const onClick = (e: MouseEvent) => {
    const link = (e.target as Element).closest<HTMLAnchorElement>(
      'a[href^="#"]',
    );
    if (!link?.hash) return;
    if (
      !document.querySelector(link.hash)?.classList.contains("home-anchor")
    ) {
      return;
    }
    e.preventDefault();
    history.pushState(null, "", link.hash);
    scrollToHomeAnchor(link.hash, "smooth");
  };

  document.addEventListener("click", onClick);
  addCleanup(() => document.removeEventListener("click", onClick));
}

function updateHeaderScroll() {
  const header = document.getElementById("site-header");
  if (!header) return;
  header.classList.toggle("scrolled", getScrollY() > 4);
}

function bindHeaderScroll() {
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateHeaderScroll();
      ticking = false;
    });
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  updateHeaderScroll();
  addCleanup(() => window.removeEventListener("scroll", onScroll));
}

function updateActiveNav() {
  const path = location.pathname.replace(/\/$/, "") || "/";
  document
    .querySelectorAll<HTMLAnchorElement>(".nav-link, .mobile-link")
    .forEach((link) => {
      const href = link.getAttribute("href");
      if (!href) return;
      const active =
        href === "/"
          ? path === "/"
          : path === href || path.startsWith(href + "/");
      link.classList.toggle("active", active);
      if (active) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
}

function bindMobileMenu() {
  const header = document.getElementById("site-header");
  const menuBtn = document.getElementById("menu-btn");
  const mobileNav = document.getElementById("mobile-nav");
  const backdrop = document.getElementById("mobile-nav-backdrop");
  if (!header || !menuBtn || !mobileNav) return;

  const mq = window.matchMedia("(max-width: 980px)");

  const setOpen = (open: boolean) => {
    mobileNav.classList.toggle("open", open);
    header.classList.toggle("menu-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileNav.setAttribute("aria-hidden", String(!open));
    document.body.classList.toggle("nav-open", open);
  };

  const onToggle = () => setOpen(!mobileNav.classList.contains("open"));
  const onClose = () => setOpen(false);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && mobileNav.classList.contains("open")) {
      e.preventDefault();
      onClose();
      menuBtn.focus();
    }
  };

  const onMqChange = () => {
    if (!mq.matches) onClose();
  };

  menuBtn.addEventListener("click", onToggle);
  backdrop?.addEventListener("click", onClose);
  document.addEventListener("keydown", onKeyDown);
  mq.addEventListener("change", onMqChange);
  mobileNav
    .querySelectorAll("a")
    .forEach((a) => a.addEventListener("click", onClose));

  addCleanup(() => {
    menuBtn.removeEventListener("click", onToggle);
    backdrop?.removeEventListener("click", onClose);
    document.removeEventListener("keydown", onKeyDown);
    mq.removeEventListener("change", onMqChange);
    mobileNav
      .querySelectorAll("a")
      .forEach((a) => a.removeEventListener("click", onClose));
    document.body.classList.remove("nav-open");
    header.classList.remove("menu-open");
  });
}

function applyTheme(next: string) {
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem("theme", next);
  } catch (e) {}
}

/** Strip Astro morph names so book covers don't enter the VT overlay during theme swap. */
function suspendViewTransitionNames() {
  const patched: HTMLElement[] = [];
  document
    .querySelectorAll<HTMLElement>("[data-astro-transition-scope]")
    .forEach((el) => {
      patched.push(el);
      el.style.setProperty("view-transition-name", "none", "important");
    });
  return () => {
    patched.forEach((el) => el.style.removeProperty("view-transition-name"));
  };
}

function bindTheme() {
  const btn = document.getElementById("theme-toggle");
  if (!btn) return;

  const onToggle = () => {
    const root = document.documentElement;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";

    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const startViewTransition = (document as any).startViewTransition?.bind(
      document,
    );

    // No View Transitions support (or reduced motion) — swap instantly.
    if (!startViewTransition || reduce) {
      applyTheme(next);
      return;
    }

    // Circle grows from the center of the toggle button to the far corner.
    const rect = btn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    root.classList.add("theme-transition");
    const restoreNames = suspendViewTransitionNames();
    const transition = startViewTransition(() => {
      applyTheme(next);
      document.getElementById("site-header")?.style.setProperty(
        "transform",
        "translate3d(0,0,0)",
      );
    });

    transition.ready
      .then(() => {
        root.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 500,
            easing: "cubic-bezier(0.4, 0, 0.2, 1)",
            pseudoElement: "::view-transition-new(root)",
          },
        );
      })
      .catch(() => {});

    transition.finished.finally(() => {
      restoreNames();
      root.classList.remove("theme-transition");
      updateHeaderScroll();
      document.getElementById("site-header")?.style.setProperty(
        "transform",
        "translate3d(0,0,0)",
      );
    });
  };

  btn.addEventListener("click", onToggle);
  addCleanup(() => btn.removeEventListener("click", onToggle));
}

function bindReveal() {
  const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
  if (!("IntersectionObserver" in window) || els.length === 0) {
    els.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
  );
  els.forEach((el) => io.observe(el));
  addCleanup(() => io.disconnect());
}

/** Pause decorative CSS animations when off-screen */
function bindAnimationPause() {
  const targets = document.querySelectorAll<HTMLElement>(
    ".tv, .hero-glow, .hero-move, .pub-cover--hero",
  );
  if (!("IntersectionObserver" in window) || targets.length === 0) return;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle("is-animating", entry.isIntersecting);
      });
    },
    { rootMargin: "120px 0px" },
  );
  targets.forEach((el) => {
    el.classList.add("is-animating");
    io.observe(el);
  });
  addCleanup(() => io.disconnect());
}

/** Single delegated listener — rAF-throttled sheen on hover */
function bindCoarsePointer() {
  const mq = window.matchMedia("(hover: none), (pointer: coarse)");
  const apply = () => {
    document.documentElement.classList.toggle("is-coarse", mq.matches);
  };
  apply();
  mq.addEventListener("change", apply);
  addCleanup(() => mq.removeEventListener("change", apply));
}

function bindSheen() {
  if (window.matchMedia("(hover: none), (pointer: coarse)").matches) return;
  let frame = 0;
  let active: HTMLElement | null = null;

  const onMove = (e: PointerEvent) => {
    if (!active) return;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!active) return;
      const r = active.getBoundingClientRect();
      active.style.setProperty("--mx", `${e.clientX - r.left}px`);
      active.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  };

  const onOver = (e: PointerEvent) => {
    const t = (e.target as Element).closest<HTMLElement>(".sheen");
    if (t) active = t;
  };

  const onOut = (e: PointerEvent) => {
    const t = (e.target as Element).closest<HTMLElement>(".sheen");
    if (t && t === active) active = null;
  };

  document.addEventListener("pointerover", onOver, { passive: true });
  document.addEventListener("pointerout", onOut, { passive: true });
  document.addEventListener("pointermove", onMove, { passive: true });
  addCleanup(() => {
    document.removeEventListener("pointerover", onOver);
    document.removeEventListener("pointerout", onOut);
    document.removeEventListener("pointermove", onMove);
    if (frame) cancelAnimationFrame(frame);
  });
}

function bindHeaderLayer() {
  const header = document.getElementById("site-header");
  if (!header) return;

  const pin = () => {
    header.style.setProperty("transform", "translate3d(0,0,0)");
    header.style.setProperty("z-index", "9999");
  };

  const onVisibility = () => {
    if (document.visibilityState === "visible") pin();
  };

  pin();
  document.addEventListener("visibilitychange", onVisibility);
  addCleanup(() =>
    document.removeEventListener("visibilitychange", onVisibility),
  );
}

function init() {
  runCleanups();
  bindCoarsePointer();
  bindHeaderScroll();
  bindHeaderLayer();
  bindMobileMenu();
  bindTheme();
  bindReveal();
  bindAnimationPause();
  bindSheen();
  bindHomeAnchors();
}

init();

document.addEventListener("astro:after-swap", () => {
  try {
    const t = localStorage.getItem("theme");
    if (t) document.documentElement.setAttribute("data-theme", t);
  } catch (e) {}
  init();
  updateHeaderScroll();
  updateActiveNav();
});

document.addEventListener("astro:page-load", () => {
  updateHeaderScroll();
  updateActiveNav();
  if (location.hash) {
    requestAnimationFrame(() =>
      scrollToHomeAnchor(location.hash, "auto"),
    );
  }
});
