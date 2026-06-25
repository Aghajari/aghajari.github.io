/* ============================================================
   Experience — interactive "where was I?" year timeline.
   Click (or arrow-key) a year to reveal that year's stop.
   Lifecycle-managed for Astro View Transitions.
   ============================================================ */

type Cleanup = () => void;
const ROOT_SELECTOR = "[data-yeartimeline]";
let cleanups: Cleanup[] = [];

function destroy() {
  cleanups.forEach((fn) => {
    try { fn(); } catch { /* noop */ }
  });
  cleanups = [];
}

function init() {
  destroy();
  const root = document.querySelector<HTMLElement>(ROOT_SELECTOR);
  if (!root) return;

  const years = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-year-index]"));
  const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-year-card]"));
  if (!years.length) return;

  const select = (idx: number, focus = false) => {
    years.forEach((y) => {
      const on = Number(y.dataset.yearIndex) === idx;
      y.classList.toggle("is-active", on);
      y.setAttribute("aria-selected", on ? "true" : "false");
      y.tabIndex = on ? 0 : -1;
      if (on) {
        y.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
        if (focus) y.focus();
      }
    });
    cards.forEach((c) => {
      c.classList.toggle("is-active", Number(c.dataset.yearCard) === idx);
    });
  };

  years.forEach((y) => {
    const idx = Number(y.dataset.yearIndex);

    const onClick = () => select(idx);
    y.addEventListener("click", onClick);
    cleanups.push(() => y.removeEventListener("click", onClick));

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const next =
        e.key === "ArrowRight"
          ? Math.min(years.length - 1, idx + 1)
          : Math.max(0, idx - 1);
      select(next, true);
    };
    y.addEventListener("keydown", onKey);
    cleanups.push(() => y.removeEventListener("keydown", onKey));
  });
}

document.addEventListener("astro:page-load", init);
document.addEventListener("astro:before-swap", destroy);

if (document.readyState !== "loading") init();
else document.addEventListener("DOMContentLoaded", init);
