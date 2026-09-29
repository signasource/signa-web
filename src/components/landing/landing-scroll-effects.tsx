"use client";

import { useEffect } from "react";
import { elementProgress } from "@/lib/landing-scroll";

/**
 * Drives every scroll-linked effect on the landing (see the header of landing.css): reveal-on-
 * scroll, the page progress bar, the nav's "scrolled" state, and `--p` for `[data-progress]`
 * elements. Renders nothing. Replaces CSS `animation-timeline`, which Firefox doesn't support.
 */
export function LandingScrollEffects() {
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-landing-js", "");

    const reveal = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-in", "");
          reveal.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => reveal.observe(el));

    const nav = document.querySelector("[data-landing-nav]");
    const tracked = Array.from(document.querySelectorAll<HTMLElement>("[data-progress]"));

    let frame = 0;
    const update = () => {
      frame = 0;
      const max = root.scrollHeight - window.innerHeight;
      root.style.setProperty("--landing-scroll", (max > 0 ? window.scrollY / max : 0).toFixed(4));
      nav?.toggleAttribute("data-scrolled", window.scrollY > 8);
      for (const el of tracked) {
        const p = elementProgress(el.getBoundingClientRect().top, window.innerHeight);
        el.style.setProperty("--p", p.toFixed(3));
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      reveal.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      root.removeAttribute("data-landing-js");
      root.style.removeProperty("--landing-scroll");
    };
  }, []);

  return null;
}
