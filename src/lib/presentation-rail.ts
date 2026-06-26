function getRailScroller(link: HTMLElement): HTMLElement | null {
  return link.closest<HTMLElement>("[class*='-rail__inner']");
}

function scrollRailLinkIntoView(link: HTMLElement, scroller: HTMLElement) {
  if (scroller.scrollWidth <= scroller.clientWidth + 2) return;

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const scrollerRect = scroller.getBoundingClientRect();
  const linkRect = link.getBoundingClientRect();
  const linkCenter =
    linkRect.left - scrollerRect.left + scroller.scrollLeft + linkRect.width / 2;
  const target = linkCenter - scroller.clientWidth / 2;
  const maxScroll = scroller.scrollWidth - scroller.clientWidth;

  scroller.scrollTo({
    left: Math.max(0, Math.min(target, maxScroll)),
    behavior: reduce ? "auto" : "smooth",
  });
}

/** Highlight the section in view and scroll the sticky rail to the active link. */
export function initPresentationRail(
  root: ParentNode = document,
  onCleanup?: (fn: () => void) => void,
) {
  const links = Array.from(
    root.querySelectorAll<HTMLAnchorElement>("[data-rail-link]"),
  );
  if (!links.length) return;

  const ratios = new Map<string, number>();
  const sections = links
    .map((l) => document.getElementById(l.dataset.railLink ?? ""))
    .filter((s): s is HTMLElement => !!s);

  let activeId = "";

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

      if (!bestId || best <= 0 || bestId === activeId) return;

      activeId = bestId;
      const link = links.find((l) => l.dataset.railLink === bestId);
      if (!link) return;
      const scroller = getRailScroller(link);
      if (scroller) scrollRailLinkIntoView(link, scroller);
    },
    { rootMargin: "-20% 0px -55% 0px", threshold: [0, 0.15, 0.4, 0.75] },
  );

  sections.forEach((s) => io.observe(s));
  onCleanup?.(() => io.disconnect());
}
