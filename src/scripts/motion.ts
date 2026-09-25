import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Lenis создаётся один раз и живёт между переходами View Transitions
 * (скрипт-модуль исполняется однократно, `<html>` не пересоздаётся).
 */
let lenis: Lenis | null = null;

function initLenis() {
  if (lenis || prefersReducedMotion()) return;
  lenis = new Lenis({ autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

export function getLenis() {
  return lenis;
}

type PageSetup = (ctx: { reducedMotion: boolean }) => void | (() => void);
const setups = new Set<PageSetup>();
let pageContext: gsap.Context | null = null;

/**
 * Регистрирует анимации страницы. `setup` вызывается на каждый `astro:page-load`
 * внутри `gsap.context`, поэтому все твины и ScrollTrigger'ы убиваются
 * автоматически перед сменой страницы.
 */
export function onPage(setup: PageSetup) {
  setups.add(setup);
  // Если страница уже загружена (скрипт подключился позже) — запускаем сразу.
  if (pageContext) pageContext.add(() => setup({ reducedMotion: prefersReducedMotion() }));
}

document.addEventListener('astro:page-load', () => {
  initLenis();
  lenis?.resize();
  const reducedMotion = prefersReducedMotion();
  pageContext = gsap.context(() => {
    setups.forEach((setup) => setup({ reducedMotion }));
  });
  ScrollTrigger.refresh();
});

document.addEventListener('astro:before-swap', () => {
  pageContext?.revert();
  pageContext = null;
});

document.addEventListener('astro:after-swap', () => {
  lenis?.scrollTo(0, { immediate: true });
});

export { gsap, ScrollTrigger };
