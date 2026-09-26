/**
 * Живой градиент для hero: WebGL-шейдер без библиотек.
 * Цветные ленты хаотично перетекают, как густая жидкость; на курсор не реагирует.
 * Цвета берутся из CSS-переменных
 * `--hero-colors` (стопы «#hex N%», до 24) элемента, чтобы палитра жила рядом со стилями.
 */

const VERTEX = /* glsl */ `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const FRAGMENT = /* glsl */ `
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
#define MAX_COLORS 24
uniform vec3 uColors[MAX_COLORS];
uniform float uStops[MAX_COLORS]; // позиции цветов в кольце палитры, 0..1
uniform float uCount;
uniform float uHueSpeed; // скорость смены оттенков (1 = пресет soft)
uniform float uEdge;     // ширина перехода между цветами: 1 = мягко, меньше — резче
uniform float uAnchor;   // позиция в кольце палитры, которая всегда в центре экрана (жёлтый)
uniform vec2 uAnchorArea; // x — доля кольца под жёлтым, y — желаемая доля экрана под ним
#define MAX_SOFT 4
uniform float uSoft[MAX_SOFT]; // позиции в кольце, вокруг которых палитра растушёвывается (крем)
uniform float uSoftCount;

// Simplex noise 3D — Ashima Arts / Stefan Gustavson (MIT).
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// Палитра-кольцо: uCount цветов на позициях uStops (0..1), последний = первому.
// x берётся по модулю 1.
vec3 palette(float x) {
  x = fract(x);
  vec3 c = uColors[0];
  for (int i = 1; i < MAX_COLORS; i++) {
    if (float(i) >= uCount) break;
    float mid = (uStops[i - 1] + uStops[i]) * 0.5;
    float width = (uStops[i] - uStops[i - 1]) * uEdge;
    c = mix(c, uColors[i], smoothstep(mid - width * 0.5, mid + width * 0.5, x));
  }
  return c;
}

// Палитра хранится и смешивается в OKLab: переходы между цветами идут так, как их
// видит глаз, без выцветания и «пыльной» середины. На выходе — обратно в sRGB.
vec3 oklabToSrgb(vec3 c) {
  float l_ = c.x + 0.3963377774 * c.y + 0.2158037573 * c.z;
  float m_ = c.x - 0.1055613458 * c.y - 0.0638541728 * c.z;
  float s_ = c.x - 0.0894841775 * c.y - 1.2914855480 * c.z;
  float l = l_ * l_ * l_, m = m_ * m_ * m_, s = s_ * s_ * s_;
  vec3 lin = vec3(
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s);
  lin = clamp(lin, 0.0, 1.0);
  vec3 lo = lin * 12.92;
  vec3 hi = 1.055 * pow(lin, vec3(1.0 / 2.4)) - 0.055;
  return mix(lo, hi, step(vec3(0.0031308), lin));
}

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

// Сдвиг лент поперёк себя в точке (along, across) — изгиб «гнущегося листа».
// Параметры порыва и дрейфа общие для всего кадра.
// Завихрения: два плавающих центра подкручивают ленты вокруг себя до ±90° — лента
// загибается крюком или S-петлёй, по или против часовой (знак меняется со временем).
// Поворот зависит только от расстояния до центра — это обратимое преобразование
// с сохранением площади: ни дырок, ни пиков, толщина лент сохраняется.
// Центры плывут через экран только в одну сторону и уходят за край.
vec2 swirl(vec2 q, float aspect, float th) {
  for (int k = 0; k < 2; k++) {
    float fk = float(k);
    float span = aspect + 1.6;
    vec2 c = vec2(mod(th * 0.018 + fk * span * 0.5, span) - 0.8,
                  0.5 + 0.3 * snoise(vec3(th * 0.015, fk * 4.3, 1.7)));
    float angle = 1.6 * snoise(vec3(th * 0.025, fk * 6.1, 8.8));
    vec2 d = q - c;
    float a = angle * exp(-dot(d, d) / 0.09);
    float ca = cos(a), sa = sin(a);
    q = c + vec2(ca * d.x - sa * d.y, sa * d.x + ca * d.y);
  }
  return q;
}

float bendAt(float along, float across, float th, float t, float gust, vec3 travel) {
  // Только крупные размашистые изгибы: мелкие слои и короткие волны убраны.
  float b = gust * (0.48 * snoise(vec3(along * 0.45 - travel.x, across * 0.25, t * 0.21))
                  + 0.2 * snoise(vec3(along * 0.8 - travel.y, across * 0.25 + 4.0, t * 0.27 + 2.0)));
  // Одна длинная пологая бегущая волна.
  b += 0.07 * sin(along * 1.6 - th * 0.12);
  return b;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = uTime;

  // «Густой поток»: цветные ленты текут и изгибаются, как густая жидкость.
  // Цвет = проекция на направление потока в деформированных координатах w.
  // Деформация ограничена (|∇ деформации| < 1), поэтому у поля нет вершин и впадин:
  // ленты никогда не замыкаются в кольца, «дырок» и мишеней не бывает.
  float th = t * uHueSpeed;
  // Направление потока. Ленты цвета лежат поперёк него, поэтому поток почти
  // вертикальный (~70°) → ленты близки к горизонтали (~20°). Покачивается мягко, ±20°.
  float dirAngle = 1.22 + 0.5 * snoise(vec3(th * 0.045, 3.3, 1.1));
  vec2 dir = vec2(cos(dirAngle), sin(dirAngle));

  // Плотность лент подстраивается под направление: поперёк экрана ~0.92 круга (меньше одного) — каждый цвет
  // виден одним куском, без повторов.
  float extent = aspect * abs(dir.x) + abs(dir.y);
  float density = 0.92 / extent;
  // Площадь жёлтой ленты почти не зависит от наклона: лента через центр длиной L
  // (от края до края вдоль лент) и толщиной share/density занимает share·L/(density·S)
  // экрана. Подбираем density под нужную долю, но на экране остаётся 0.7…0.92 круга (шире — цвета повторяются) —
  // цвета не повторяются и все видны.
  if (uAnchorArea.y > 0.0) {
    vec2 tg = vec2(-dir.y, dir.x);
    float lineLen = min(aspect / max(abs(tg.x), 0.001), 1.0 / max(abs(tg.y), 0.001));
    float want = uAnchorArea.x * lineLen / (uAnchorArea.y * aspect);
    density = clamp(want, 0.7 / extent, 0.92 / extent);
  }
  // «Вдохи»: время от времени лента жёлтого (и всё вокруг центра) плавно растягивается
  // по высоте до ×1.5 — в пиковые моменты жёлтый занимает больше экрана, соседи уходят к краям.
  float stretch = 1.0 + 0.5 * smoothstep(0.1, 0.8, snoise(vec3(th * 0.03, 5.5, 3.3)));
  density /= stretch;

  // Изгибы «гнущегося листа»: ленты сдвигаются поперёк себя (вдоль dir), и сдвиг
  // зависит в основном от координаты ВДОЛЬ лент. Поэтому все края ленты гнутся
  // вместе: выступ на одном краю = вмятина напротив, на другом краю, толщина лент
  // сохраняется (цвета не раздуваются и не сжимают соседей). Слабая зависимость от
  // глубины (across) даёт соседним лентам гнуться чуть по-разному: толщина ±15%.
  // Производная сдвига поперёк лент < 1 → поток не складывается: ни дырок, ни пиков.
  vec2 tangent = vec2(-dir.y, dir.x);
  vec2 ps = swirl(p, aspect, th);
  float along = dot(ps, tangent);
  float across = dot(ps, dir);
  // Хаос: «порывы» — сила изгибов то нарастает, то стихает (0.2…1.4); изгибы плывут
  // вдоль лент ТОЛЬКО В ОДНУ СТОРОНУ: скорость дрейфа плавает, но всегда > 0
  // (амплитуда блуждания · частота · max|∇шума| < базовой скорости), оба слоя — в одну сторону.
  // Даже на пике порыва производная поперёк лент ≈ 0.55 < 1 — правило «листа» держится.
  float gust = max(0.2, 0.75 + 0.675 * snoise(vec3(th * 0.04, 7.7, 2.2)));
  vec3 travel = vec3(
    th * 0.03 + 0.4 * snoise(vec3(th * 0.02, 1.1, 0.0)),
    th * 0.025 + 0.25 * snoise(vec3(th * 0.025, 2.3, 0.0)),
    0.0);
  float bend = bendAt(along, across, th, t, gust, travel);

  // Жёлтый всегда посередине: палитра не прокручивается, а цвет в центре экрана
  // привязан к uAnchor. Изгибы в центре вычитаются, поэтому жёлтая лента всегда
  // проходит через центр, а остальные цвета лежат по обе стороны от неё.
  vec2 c = swirl(vec2(aspect * 0.5, 0.5), aspect, th);
  float alongC = dot(c, tangent);
  float acrossC = dot(c, dir);
  float bendC = bendAt(alongC, acrossC, th, t, gust, travel);

  float v = uAnchor + ((across - acrossC) + (bend - bendC)) * density;

  // Растушёвка вокруг «мягких» точек палитры (крем): рядом с ними цвет усредняется по
  // широкому окну, и светлая полоска превращается в плавное свечение. Остальные
  // границы не трогаем — их жёсткость задаёт uEdge.
  float soft = 0.0;
  for (int k = 0; k < MAX_SOFT; k++) {
    if (float(k) >= uSoftCount) break;
    float dist = abs(fract(v - uSoft[k] + 0.5) - 0.5);
    soft = max(soft, 1.0 - smoothstep(0.0, 0.09, dist));
  }
  vec3 color;
  if (soft > 0.001) {
    // Окно не шире ±4.5% кольца: иначе у голубого оно захватывает и жёлтый, а их
    // смесь даёт грязно-зелёный.
    float spread = 0.045 * soft;
    color = vec3(0.0);
    for (int k = -4; k <= 4; k++) {
      color += palette(v + float(k) * spread / 4.0);
    }
    color /= 9.0;
  } else {
    color = palette(v);
  }
  // Лёгкий дизеринг против полос на плавных переходах.
  color = oklabToSrgb(color);
  color += (hash(gl_FragCoord.xy) - 0.5) / 128.0;
  gl_FragColor = vec4(color, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

/** #hex → OKLab (для чистого смешивания цветов в шейдере). */
function hexToOklab(value: string): [number, number, number] {
  const hex = value.trim().replace('#', '');
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
  const n = parseInt(full, 16);
  const toLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => toLinear(c / 255)) as [
    number,
    number,
    number,
  ];
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/**
 * Пресеты характера градиента. Переключаются атрибутом `data-preset` у hero.
 * - `soft` — основной: медленная смена оттенков, мягкие границы, всё движение ×1.05.
 * - `vivid` — быстрее смена оттенков, границы пятен резче.
 * `timeScale` — общая скорость движения (1 — исходная).
 * `startTime` — с какого момента анимации начинать при каждой загрузке.
 */
export const HERO_PRESETS = {
  // startTime 102 — стартовый кадр по скриншоту пользователя (розовый сверху, персик,
  // жёлтый в центре, кремовая полоса, голубой внизу); найден сравнением кадров.
  soft: { hueSpeed: 1, edge: 0.8, timeScale: 0.53, startTime: 102 },
  vivid: { hueSpeed: 2.5, edge: 0.35, timeScale: 1, startTime: 0 },
} as const;
export type HeroPreset = keyof typeof HERO_PRESETS;

interface Options {
  /** Статичная картинка без анимации. */
  reducedMotion: boolean;
  preset?: HeroPreset;
  /** Подписка на кадры (например, gsap.ticker); возвращает отписку. */
  onFrame: (callback: (timeSeconds: number) => void) => () => void;
}

/** Запускает градиент на `canvas` внутри `root`. Возвращает функцию очистки. */
export function mountHeroGradient(
  root: HTMLElement,
  canvas: HTMLCanvasElement,
  { reducedMotion, onFrame, preset = 'soft' }: Options,
) {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    powerPreference: 'low-power',
  });
  // Нет WebGL — остаётся CSS-градиент фоном у root.
  if (!gl) return () => {};

  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  const program = gl.createProgram();
  if (!vs || !fs || !program) return () => {};
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    return () => {};
  }
  gl.useProgram(program);

  // Один треугольник на весь экран.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPosition = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

  const uResolution = gl.getUniformLocation(program, 'uResolution');
  const uTime = gl.getUniformLocation(program, 'uTime');
  const uColors = gl.getUniformLocation(program, 'uColors');
  const uCount = gl.getUniformLocation(program, 'uCount');

  const styles = getComputedStyle(root);
  // Формат как у стопов CSS-градиента: «#hex N%, #hex N%, …».
  const stops = [
    ...styles.getPropertyValue('--hero-colors').matchAll(/(#[0-9a-f]{3,6})\s+([\d.]+)%/gi),
  ].slice(0, 24);
  const colors = stops.flatMap(([, hex]) => hexToOklab(hex!));
  gl.uniform1fv(
    gl.getUniformLocation(program, 'uStops'),
    stops.map(([, , pos]) => Number(pos) / 100),
  );
  gl.uniform1f(uCount, stops.length);
  // Позиция в кольце, которая всегда в центре экрана («--hero-anchor: N%»).
  const anchor = parseFloat(styles.getPropertyValue('--hero-anchor')) || 0;
  gl.uniform1f(gl.getUniformLocation(program, 'uAnchor'), anchor / 100);
  // «--hero-anchor-area: <доля кольца>% <доля экрана>%» — держит площадь жёлтого.
  const area = [...styles.getPropertyValue('--hero-anchor-area').matchAll(/([\d.]+)%/g)].map(
    ([, n]) => Number(n) / 100,
  );
  gl.uniform2f(gl.getUniformLocation(program, 'uAnchorArea'), area[0] ?? 0, area[1] ?? 0);
  // Точки растушёвки («--hero-soft: N% N%»).
  const soft = [...styles.getPropertyValue('--hero-soft').matchAll(/([\d.]+)%/g)]
    .slice(0, 4)
    .map(([, n]) => Number(n) / 100);
  gl.uniform1f(gl.getUniformLocation(program, 'uSoftCount'), soft.length);
  if (soft.length) gl.uniform1fv(gl.getUniformLocation(program, 'uSoft'), soft);
  const { hueSpeed, edge, timeScale, startTime } = HERO_PRESETS[preset];
  gl.uniform1f(gl.getUniformLocation(program, 'uHueSpeed'), hueSpeed);
  gl.uniform1f(gl.getUniformLocation(program, 'uEdge'), edge);
  gl.uniform3fv(uColors, colors);

  // Градиент мягкий — рендерим в половинном разрешении, браузер растянет.
  const resize = () => {
    const scale = Math.min(window.devicePixelRatio || 1, 2) * 0.5;
    const width = Math.max(1, Math.round(canvas.clientWidth * scale));
    const height = Math.max(1, Math.round(canvas.clientHeight * scale));
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
    gl.uniform2f(uResolution, width, height);
  };

  // Градиент детерминирован: одно время — одна картинка, поэтому старт всегда одинаковый.
  let time: number = startTime;
  let lastFrame: number | null = null;
  let visible = true;
  let lost = false;

  const draw = () => {
    if (lost) return;
    gl.uniform1f(uTime, time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    canvas.dataset.ready = '';
  };

  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    delete canvas.dataset.ready;
  };
  canvas.addEventListener('webglcontextlost', onLost);

  const resizeObserver = new ResizeObserver(() => {
    resize();
    if (reducedMotion) draw();
  });
  resizeObserver.observe(canvas);
  resize();

  if (reducedMotion) {
    draw();
    return () => {
      resizeObserver.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }

  // Вне экрана не рисуем.
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
  });
  intersectionObserver.observe(root);

  const unsubscribe = onFrame((now) => {
    const dt = lastFrame === null ? 0 : Math.min(now - lastFrame, 0.1);
    lastFrame = now;
    if (!visible || document.hidden) return;
    // timeScale замедляет всё движение градиента целиком (поток, изгибы, оттенки).
    time += dt * timeScale;
    draw();
  });

  return () => {
    unsubscribe();
    intersectionObserver.disconnect();
    resizeObserver.disconnect();
    canvas.removeEventListener('webglcontextlost', onLost);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}
