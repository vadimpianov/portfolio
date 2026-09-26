import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Перезагрузка страницы всегда открывает первый слайд: браузер не восстанавливает прокрутку.
// Раннее отключение восстановления — во встроенном скрипте в <head> (BaseLayout).
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
// Safari может восстановить позицию позже — после загрузки картинок. Возвращаем наверх
// и страницу, и Lenis (у него своя позиция).
window.addEventListener('load', () => {
  window.scrollTo(0, 0);
  lenis?.scrollTo(0, { immediate: true, force: true });
});

/**
 * Смена языка должна менять только текст: позиция прокрутки сохраняется, анимация
 * перехода пропускается. Переключатель языка вызывает это перед навигацией.
 */
let keptScroll: number | null = null;
export function keepViewOnNextSwap() {
  keptScroll = window.scrollY;
}

function restoreKeptScroll() {
  if (keptScroll === null) return;
  lenis?.scrollTo(keptScroll, { immediate: true, force: true });
  window.scrollTo(0, keptScroll);
}

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
  if (pageContext) pageContext.add(() => runSetup(setup, prefersReducedMotion()));
}

/** Функции очистки, которые вернули `setup` (WebGL, слушатели и т.п.). */
let cleanups: (() => void)[] = [];

function runSetup(setup: PageSetup, reducedMotion: boolean) {
  const cleanup = setup({ reducedMotion });
  if (cleanup) cleanups.push(cleanup);
}

document.addEventListener('astro:page-load', () => {
  initLenis();
  lenis?.resize();
  const reducedMotion = prefersReducedMotion();
  pageContext = gsap.context(() => {
    setups.forEach((setup) => runSetup(setup, reducedMotion));
  });
  ScrollTrigger.refresh();
  if (keptScroll !== null) {
    restoreKeptScroll();
    ScrollTrigger.update();
    keptScroll = null;
  }
});

document.addEventListener('astro:before-swap', (event) => {
  if (keptScroll !== null) event.viewTransition.skipTransition();
  cleanups.forEach((cleanup) => cleanup());
  cleanups = [];
  pageContext?.revert();
  pageContext = null;
});

document.addEventListener('astro:after-swap', () => {
  if (keptScroll !== null) restoreKeptScroll();
  else lenis?.scrollTo(0, { immediate: true });
});

export { gsap, ScrollTrigger };
