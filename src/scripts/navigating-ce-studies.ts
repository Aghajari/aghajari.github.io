/* ============================================================
   Navigating CE Studies — editorial keynote recap
   No canvases or demos here by design: just a YouTube facade
   and a sticky section-rail highlighter. Lifecycle-managed for
   Astro View Transitions.
   ============================================================ */

type Cleanup = () => void;
const ROOT_SELECTOR = "[data-kn-root]";

function destroyKN() {
  const root = document.querySelector(ROOT_SELECTOR) as (HTMLElement & { __knCleanups?: Cleanup[] }) | null;
  if (root?.__knCleanups) {
    root.__knCleanups.forEach((fn) => { try { fn(); } catch { /* noop */ } });
    root.__knCleanups = [];
  }
}

function initKN() {
  destroyKN();
  const root = document.querySelector(ROOT_SELECTOR) as (HTMLElement & { __knCleanups?: Cleanup[] }) | null;
  if (!root) return;
  const cleanups: Cleanup[] = [];
  root.__knCleanups = cleanups;

  /* YouTube facade — swap the thumbnail for the embed on click */
  root.querySelectorAll<HTMLElement>('[data-demo="youtube"]').forEach((el) => {
    const btn = el.querySelector<HTMLButtonElement>("[data-yt-play]");
    const id = el.dataset.videoId;
    if (!btn || !id) return;
    const onClick = () => {
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      iframe.title = "Insights on Computer Engineering — full talk";
      iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      iframe.allowFullscreen = true;
      el.innerHTML = "";
      el.appendChild(iframe);
    };
    btn.addEventListener("click", onClick);
    cleanups.push(() => btn.removeEventListener("click", onClick));
  });

  /* Sticky rail — highlight the section currently in view */
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-rail-link]"));
  if (links.length) {
    const ratios = new Map<string, number>();
    const sections = links
      .map((l) => document.getElementById(l.dataset.railLink ?? ""))
      .filter((s): s is HTMLElement => !!s);

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => ratios.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
      let bestId = ""; let best = 0;
      ratios.forEach((r, id) => { if (r > best) { best = r; bestId = id; } });
      links.forEach((l) => l.classList.toggle("is-active", l.dataset.railLink === bestId && best > 0));
    }, { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.15, 0.4, 0.75] });

    sections.forEach((s) => io.observe(s));
    cleanups.push(() => io.disconnect());
  }
}

document.addEventListener("astro:page-load", initKN);
document.addEventListener("astro:before-swap", destroyKN);

if (document.readyState !== "loading") initKN();
else document.addEventListener("DOMContentLoaded", initKN);
