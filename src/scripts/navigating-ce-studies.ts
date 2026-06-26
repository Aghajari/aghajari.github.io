import { layoutForViewport, renderComputer } from "./ce-computer-visual";

type Cleanup = () => void;
type RenderFn = (
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
) => void;
type MountHandle = { cleanup: Cleanup; resume: () => void };

const ROOT_SELECTOR = "[data-kn-root]";

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.trim().replace("#", "");
  const full =
    m.length === 3
      ? m
          .split("")
          .map((c) => c + c)
          .join("")
      : m;
  const n = parseInt(full || "888888", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function destroyKN() {
  const root = document.querySelector(ROOT_SELECTOR) as
    | (HTMLElement & { __knCleanups?: Cleanup[] })
    | null;
  if (root?.__knCleanups) {
    root.__knCleanups.forEach((fn) => {
      try {
        fn();
      } catch {
        /* noop */
      }
    });
    root.__knCleanups = [];
  }
}

function initKN() {
  destroyKN();
  const root = document.querySelector(ROOT_SELECTOR) as
    | (HTMLElement & { __knCleanups?: Cleanup[] })
    | null;
  if (!root) return;
  const cleanups: Cleanup[] = [];
  root.__knCleanups = cleanups;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const cs = getComputedStyle(root);
  const accents = {
    a1: hexToRgb(cs.getPropertyValue("--kn-1")),
    a2: hexToRgb(cs.getPropertyValue("--kn-2")),
    a3: hexToRgb(cs.getPropertyValue("--kn-3")),
  };

  function fit(canvas: HTMLCanvasElement) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));
    const bw = Math.round(w * dpr);
    const bh = Math.round(h * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
    }
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  function mount(
    canvas: HTMLCanvasElement,
    render: RenderFn,
    animate = false,
    isActive: () => boolean = () => true,
  ): MountHandle {
    let geom = fit(canvas);
    let raf = 0;
    let visible = false;
    const start = performance.now();

    const frame = (now: number) => {
      raf = 0;
      if (!isActive()) return;
      render(geom.ctx, geom.w, geom.h, (now - start) / 1000);
      if (animate && visible && isActive() && !reduce)
        raf = requestAnimationFrame(frame);
    };
    const request = () => {
      if (!raf && isActive()) raf = requestAnimationFrame(frame);
    };
    const resume = () => {
      geom = fit(canvas);
      frame(performance.now());
      request();
    };

    const ro = new ResizeObserver(() => {
      if (!isActive()) return;
      geom = fit(canvas);
      frame(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(
      (es) => {
        visible = es[0].isIntersecting;
        if (visible) request();
      },
      { rootMargin: "120px" },
    );
    io.observe(canvas);
    if (isActive()) frame(performance.now());

    return {
      cleanup: () => {
        if (raf) cancelAnimationFrame(raf);
        ro.disconnect();
        io.disconnect();
      },
      resume,
    };
  }

  const heroCanvas =
    root.querySelector<HTMLCanvasElement>('[data-demo="hero"]');
  const heroArtMq = window.matchMedia("(min-width: 721px)");
  let heroArtEnabled = heroArtMq.matches;
  let heroMount: MountHandle | null = null;

  if (heroCanvas) {
    heroMount = mount(
      heroCanvas,
      (ctx, w, h, t) => {
        const layout = layoutForViewport(w, h, "hero");
        renderComputer(ctx, w, h, t, accents, {
          reduce,
          hero: true,
          ...layout,
        });
      },
      true,
      () => heroArtEnabled,
    );
  }

  const syncHeroArt = () => {
    heroArtEnabled = heroArtMq.matches;
    if (heroArtEnabled) heroMount?.resume();
  };

  const onHeroArtMq = () => syncHeroArt();
  heroArtMq.addEventListener("change", onHeroArtMq);
  cleanups.push(() => {
    heroArtMq.removeEventListener("change", onHeroArtMq);
    heroMount?.cleanup();
    heroMount = null;
  });

  /* YouTube facade — swap the thumbnail for the embed on click */
  root.querySelectorAll<HTMLElement>('[data-demo="youtube"]').forEach((el) => {
    const btn = el.querySelector<HTMLButtonElement>("[data-yt-play]");
    const id = el.dataset.videoId;
    if (!btn || !id) return;
    const onClick = () => {
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      iframe.title = "Insights on Computer Engineering — full talk";
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      el.innerHTML = "";
      el.appendChild(iframe);
    };
    btn.addEventListener("click", onClick);
    cleanups.push(() => btn.removeEventListener("click", onClick));
  });

  /* Sticky rail — highlight the section currently in view */
  const links = Array.from(
    document.querySelectorAll<HTMLAnchorElement>("[data-rail-link]"),
  );
  if (links.length) {
    const ratios = new Map<string, number>();
    const sections = links
      .map((l) => document.getElementById(l.dataset.railLink ?? ""))
      .filter((s): s is HTMLElement => !!s);

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) =>
          ratios.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0),
        );
        let bestId = "";
        let best = 0;
        ratios.forEach((r, id) => {
          if (r > best) {
            best = r;
            bestId = id;
          }
        });
        links.forEach((l) =>
          l.classList.toggle(
            "is-active",
            l.dataset.railLink === bestId && best > 0,
          ),
        );
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.15, 0.4, 0.75] },
    );

    sections.forEach((s) => io.observe(s));
    cleanups.push(() => io.disconnect());
  }
}

document.addEventListener("astro:page-load", initKN);
document.addEventListener("astro:before-swap", destroyKN);

if (document.readyState !== "loading") initKN();
else document.addEventListener("DOMContentLoaded", initKN);
