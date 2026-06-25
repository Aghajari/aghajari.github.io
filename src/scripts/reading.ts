/* ============================================================
   Reading — the personal library.
   1) Subtle cursor tilt on every 3D book (shelf + hero).
   2) Sort control on the listing.
   Lifecycle-managed for Astro View Transitions.
   ============================================================ */

type Cleanup = () => void;
type SortMode = "reading" | "title" | "author" | "rating" | "published";
let cleanups: Cleanup[] = [];

const SORT_MODES: SortMode[] = ["reading", "title", "author", "rating", "published"];

const REST_RY = 27;
const REST_RX = 6;

function destroy() {
  cleanups.forEach((fn) => {
    try {
      fn();
    } catch {
      /* noop */
    }
  });
  cleanups = [];
}

function bindTilt() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  const books = Array.from(
    document.querySelectorAll<HTMLElement>("[data-book3d]")
  );

  books.forEach((el) => {
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1; // -1..1
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--ry", `${REST_RY + nx * 13}deg`);
        el.style.setProperty("--rx", `${REST_RX - ny * 9}deg`);
        el.style.setProperty("--lift", "-8px");
      });
    };

    const onEnter = () => el.style.setProperty("--lift", "-8px");

    const reset = () => {
      if (raf) cancelAnimationFrame(raf);
      el.style.setProperty("--ry", `${REST_RY}deg`);
      el.style.setProperty("--rx", `${REST_RX}deg`);
      el.style.setProperty("--lift", "0px");
    };

    el.addEventListener("pointerenter", onEnter);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", reset);

    cleanups.push(() => {
      el.removeEventListener("pointerenter", onEnter);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", reset);
      if (raf) cancelAnimationFrame(raf);
    });
  });
}

function bindSort() {
  const root = document.querySelector<HTMLElement>("[data-reading-root]");
  if (!root) return;

  const select = root.querySelector<HTMLSelectElement>("[data-sort-select]");
  const shelf = root.querySelector<HTMLElement>(".lib-shelf");
  if (!select || !shelf) return;

  const compare = (a: HTMLElement, b: HTMLElement, mode: SortMode) => {
    const titleA = a.dataset.sortTitle ?? "";
    const titleB = b.dataset.sortTitle ?? "";
    if (mode === "title") return titleA.localeCompare(titleB);
    if (mode === "author") {
      const authorA = a.dataset.sortAuthor ?? "";
      const authorB = b.dataset.sortAuthor ?? "";
      return authorA.localeCompare(authorB) || titleA.localeCompare(titleB);
    }

    const key =
      mode === "rating"
        ? "sortRating"
        : mode === "published"
          ? "sortPublished"
          : "sortReading";
    const diff = Number(b.dataset[key] ?? 0) - Number(a.dataset[key] ?? 0);
    return diff || titleA.localeCompare(titleB);
  };

  const apply = (mode: SortMode) => {
    const cards = Array.from(shelf.querySelectorAll<HTMLElement>("[data-book-card]"));
    cards.sort((a, b) => compare(a, b, mode));
    cards.forEach((card) => shelf.appendChild(card));
  };

  const onChange = () => {
    const mode = select.value as SortMode;
    if (SORT_MODES.includes(mode)) apply(mode);
  };

  select.addEventListener("change", onChange);
  cleanups.push(() => select.removeEventListener("change", onChange));

  const param = new URLSearchParams(window.location.search).get("sort");
  if (param && SORT_MODES.includes(param as SortMode)) {
    select.value = param;
    apply(param as SortMode);
  }
}

function init() {
  destroy();
  bindTilt();
  bindSort();
}

document.addEventListener("astro:page-load", init);
document.addEventListener("astro:before-swap", destroy);

if (document.readyState !== "loading") init();
else document.addEventListener("DOMContentLoaded", init);
