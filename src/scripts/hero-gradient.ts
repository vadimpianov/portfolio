/**
 * Живой фон для hero: WebGL-шейдер без библиотек (см. HERO_PRESETS).
 * Пятна цвета медленно перетекают (шум с деформацией), курсор сдвигает палитру
 * вокруг себя и слегка — во всём блоке. Цвета берутся из CSS-переменных
 * `--hero-colors` (список hex, до 10) элемента, чтобы палитра жила рядом со стилями.
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
uniform vec2 uMouse;   // 0..1, y вверх, сглаженный
uniform float uHover;  // 0..1, насколько курсор «внутри» блока
#define MAX_COLORS 10
uniform vec3 uColors[MAX_COLORS];
uniform float uCount;
uniform float uMode;     // 0 — перетекающий градиент, 1 — павлинье перо
uniform float uHueSpeed; // скорость смены оттенков (1 = пресет soft)
uniform float uEdge;     // ширина перехода между цветами: 1 = мягко, меньше — резче

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

// Палитра из uCount (до MAX_COLORS) опорных цветов, равномерно по t в 0..1.
vec3 palette(float t) {
  float x = clamp(t, 0.0, 1.0) * (uCount - 1.0);
  vec3 c = uColors[0];
  for (int i = 1; i < MAX_COLORS; i++) {
    if (float(i) >= uCount) break;
    float center = float(i) - 0.5;
    c = mix(c, uColors[i], smoothstep(center - uEdge * 0.5, center + uEdge * 0.5, x));
  }
  return c;
}

// «Пинг-понг»: сдвиг за край палитры отражается обратно, без резких швов.
float pingpong(float x) { return abs(mod(x + 1.0, 2.0) - 1.0); }

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

// Перетекающий градиент (пресеты soft, vivid).
vec3 flow(vec2 uv, vec2 p, vec2 m, float t, float influence) {
  // Деформированный шум — перетекающие пятна; курсор слегка «тянет» поле.
  vec2 q = vec2(snoise(vec3(p * 0.8, t * 0.06)), snoise(vec3(p * 0.8 + 7.3, t * 0.06)));
  float f = snoise(vec3(p * 0.7 + q * 1.0 - (p - m) * influence * 0.6, t * 0.08));
  // Второй, крупный слой — медленно «гуляет» по всей палитре.
  float th = t * uHueSpeed;
  float drift = snoise(vec3(p * 0.3 + 3.1, th * 0.035));

  // База: тёплые цвета слева → холодные справа, поверх — шум.
  float v = uv.x * 0.7 + (1.0 - uv.y) * 0.15;
  v = v * 0.75 + f * 0.4 + drift * 0.25;
  // Со временем вся палитра плавно смещается — оттенки постоянно сменяются.
  v += sin(th * 0.09) * 0.2 + sin(th * 0.037 + 1.7) * 0.12;

  // Курсор меняет цвет: локально вокруг себя и немного во всём блоке.
  v += influence * 0.5;
  v += (uMouse.x - 0.5) * 0.25 * uHover;

  return palette(pingpong(v));
}

// --- Павлинье перо (пресет peacock) ---
// Цвета uColors по ролям: 0 центр глазка, 1 кобальт, 2 бирюза, 3 медь,
// 4 розовая бронза, 5 зелёный, 6 тёмная олива, 7 золото, 8 светлое золото.

// Центры «глазков» в долях блока (x, y снизу) и их размер.
vec3 eye(int i) {
  if (i == 0) return vec3(0.13, 0.76, 1.0);
  if (i == 1) return vec3(0.54, 0.82, 0.85);
  if (i == 2) return vec3(0.90, 0.50, 1.05);
  if (i == 3) return vec3(0.46, 0.26, 1.15);
  return vec3(0.08, 0.10, 0.9);
}

// Кольца глазка по «эллиптическому радиусу» e (1 ≈ зелёное кольцо).
vec3 rings(float e) {
  vec3 c = uColors[0];
  c = mix(c, uColors[1], smoothstep(0.15, 0.42, e));
  c = mix(c, uColors[2], smoothstep(0.48, 0.54, e));
  c = mix(c, uColors[3], smoothstep(0.64, 0.7, e));
  c = mix(c, uColors[4], smoothstep(0.76, 0.9, e));
  c = mix(c, uColors[5], smoothstep(0.97, 1.02, e));
  c = mix(c, uColors[6], smoothstep(1.1, 1.35, e));
  return c;
}

// Поворот оттенка вокруг серой оси — радужный перелив пера.
vec3 hueShift(vec3 c, float a) {
  const vec3 k = vec3(0.57735);
  float ca = cos(a);
  return c * ca + cross(k, c) * sin(a) + k * dot(k, c) * (1.0 - ca);
}

vec3 peacock(vec2 p, vec2 m, float aspect, float t, float influence) {
  float n1 = snoise(vec3(p * 0.8, t * 0.03));
  float n2 = snoise(vec3(p * 3.0 + 11.0, t * 0.05));

  // Ближайший глазок: эллипс, наклон, «сердечко» и лёгкая деформация шумом.
  float e = 10.0;
  float ang = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    vec3 eyeData = eye(i);
    vec2 c = vec2(eyeData.x * aspect, eyeData.y);
    c += 0.025 * vec2(sin(t * 0.15 + fi * 1.9), cos(t * 0.12 + fi * 2.7));
    vec2 d = p - c + vec2(n1, n2 * 0.3) * 0.025;
    float rot = -0.5 + fi * 0.35;
    d = mat2(cos(rot), -sin(rot), sin(rot), cos(rot)) * d;
    float s = eyeData.z;
    float a = atan(d.y, d.x);
    float ei = length(vec2(d.x / (0.2 * s), d.y / (0.155 * s)));
    ei *= 1.0 + 0.14 * exp(-pow(a - 1.3, 2.0) * 5.0); // выемка сверху
    if (ei < e) {
      e = ei;
      ang = a;
    }
  }

  // Бородки пера: тонкие волнистые волокна поверх всего.
  float w = dot(p, vec2(0.8, 0.6)) + n1 * 0.4 + 0.25 * sin(p.x * 1.3 + t * 0.05);
  float fibers = mix(0.5 + 0.5 * sin(w * 150.0 + n2 * 2.0), 0.5 + 0.5 * sin(w * 330.0 + n2 * 5.0 + 1.3), 0.4);
  fibers = smoothstep(0.15, 0.95, fibers);

  // Фон: олива → золото по волокнам (без «зебры»), пятна зелёного отлива, блики.
  vec3 bg = mix(uColors[6], uColors[7], 0.3 + 0.55 * fibers);
  float green = smoothstep(0.1, 0.6, snoise(vec3(p * 1.4 + 4.0, t * 0.04)));
  bg = mix(bg, uColors[5] * mix(0.6, 1.1, fibers), green * 0.55);
  bg = mix(bg, uColors[8], pow(fibers, 6.0) * 0.35);

  // Глазок с тонкими радиальными лучами; внешний край «разлохмачен» лучами.
  float rays = 0.5 + 0.5 * sin(ang * 90.0 + n2 * 3.0);
  float fringe = 0.5 + 0.5 * sin(ang * 37.0 + n1 * 9.0);
  e -= 0.09 * fringe * smoothstep(0.85, 1.25, e);
  vec3 eyeColor = rings(e) * (0.9 + 0.12 * rays);
  float mask = 1.0 - smoothstep(1.22, 1.3, e);
  vec3 color = mix(bg, eyeColor, mask);
  color *= 0.85 + 0.22 * mix(fibers, 0.6, mask * 0.7);

  // Отдельные золотые волоски поверх, в т.ч. через глазки.
  float w2 = dot(p, vec2(0.95, -0.3)) + n1 * 0.7 + 0.3 * sin(p.y * 2.1 + t * 0.04);
  float strands = smoothstep(0.82, 0.98, 0.5 + 0.5 * sin(w2 * 38.0 + n2 * 4.0));
  strands *= smoothstep(-0.2, 0.4, snoise(vec3(p * 2.2 + 20.0, t * 0.03)));
  vec3 strandColor = mix(uColors[7], uColors[8], 0.5 + 0.5 * sin(w2 * 400.0));
  color = mix(color, strandColor, strands * 0.75);

  // Перелив: курсор поворачивает оттенок вокруг себя и слегка во всём блоке.
  float shift = influence * 1.4 + (uMouse.x - 0.5) * 0.35 * uHover + sin(t * 0.12 * uHueSpeed) * 0.08;
  return hueShift(color, shift);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  vec2 m = vec2(uMouse.x * aspect, uMouse.y);
  float t = uTime;

  // Влияние курсора: небольшое пятно вокруг него.
  float d = length(p - m);
  float influence = exp(-d * d * 22.5) * uHover;

  vec3 color = uMode > 0.5 ? peacock(p, m, aspect, t, influence) : flow(uv, p, m, t, influence);
  // Лёгкий дизеринг против полос на плавных переходах.
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

function hexToRgb(value: string): [number, number, number] {
  const hex = value.trim().replace('#', '');
  const full = hex.length === 3 ? [...hex].map((c) => c + c).join('') : hex;
  const n = parseInt(full, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

/**
 * Пресеты hero. Переключаются атрибутом `data-preset` у hero.
 * - `soft` — перетекающий градиент: медленная смена оттенков, мягкие границы.
 * - `vivid` — тот же градиент: быстрее смена оттенков, границы пятен резче.
 * - `peacock` — павлинье перо: глазки из колец, золотые волокна, радужный перелив.
 *
 * `colors` — CSS-переменная с палитрой, `resolution` — доля от разрешения экрана,
 * `blur` — размытие поверх, px (0 — без него).
 */
export const HERO_PRESETS = {
  soft: { mode: 0, hueSpeed: 1, edge: 1, colors: '--hero-colors', resolution: 0.5, blur: 0 },
  vivid: { mode: 0, hueSpeed: 2.5, edge: 0.35, colors: '--hero-colors', resolution: 0.5, blur: 0 },
  // Всё сильно размыто: рисуем в низком разрешении и добавляем CSS-блюр.
  peacock: { mode: 1, hueSpeed: 1, edge: 1, colors: '--hero-colors-peacock', resolution: 0.35, blur: 48 },
} as const;
export type HeroPreset = keyof typeof HERO_PRESETS;

interface Options {
  /** Статичная картинка без анимации и реакции на курсор. */
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
  const uMouse = gl.getUniformLocation(program, 'uMouse');
  const uHover = gl.getUniformLocation(program, 'uHover');
  const uColors = gl.getUniformLocation(program, 'uColors');
  const uCount = gl.getUniformLocation(program, 'uCount');

  const { mode, hueSpeed, edge, colors: colorsVar, resolution, blur } = HERO_PRESETS[preset];
  if (blur > 0) {
    // Увеличиваем холст, чтобы блюр не «съедал» края блока.
    canvas.style.filter = `blur(${blur}px)`;
    canvas.style.transform = `scale(${1 + (blur * 4) / Math.max(canvas.clientWidth, 1)})`;
  }
  const styles = getComputedStyle(root);
  const hexes = (styles.getPropertyValue(colorsVar).match(/#[0-9a-f]{3,6}\b/gi) ?? []).slice(0, 10);
  const colors = hexes.flatMap(hexToRgb);
  gl.uniform1f(uCount, hexes.length);
  gl.uniform1f(gl.getUniformLocation(program, 'uMode'), mode);
  gl.uniform1f(gl.getUniformLocation(program, 'uHueSpeed'), hueSpeed);
  gl.uniform1f(gl.getUniformLocation(program, 'uEdge'), edge);
  gl.uniform3fv(uColors, colors);

  // Градиент мягкий — рендерим в пониженном разрешении, браузер растянет.
  const resize = () => {
    const scale = Math.min(window.devicePixelRatio || 1, 2) * resolution;
    const width = Math.max(1, Math.round(canvas.clientWidth * scale));
    const height = Math.max(1, Math.round(canvas.clientHeight * scale));
    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;
    gl.viewport(0, 0, width, height);
    gl.uniform2f(uResolution, width, height);
  };

  const mouse = { x: 0.5, y: 0.5, hover: 0 };
  const target = { x: 0.5, y: 0.5, hover: 0 };
  let time = 0;
  let lastFrame: number | null = null;
  let visible = true;
  let lost = false;

  const draw = () => {
    if (lost) return;
    gl.uniform1f(uTime, time);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uHover, mouse.hover);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    canvas.dataset.ready = '';
  };

  const onPointerMove = (event: PointerEvent) => {
    const rect = root.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const inside = x >= 0 && x <= 1 && y >= 0 && y <= 1;
    target.hover = inside ? 1 : 0;
    if (inside) {
      target.x = x;
      target.y = 1 - y;
    }
  };
  const onPointerLeave = () => {
    target.hover = 0;
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

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onPointerLeave);

  const unsubscribe = onFrame((now) => {
    const dt = lastFrame === null ? 0 : Math.min(now - lastFrame, 0.1);
    lastFrame = now;
    if (!visible || document.hidden) return;
    time += dt;
    // Плавное следование за курсором, не зависящее от частоты кадров.
    const k = 1 - Math.pow(1 - 0.06, dt * 60);
    mouse.x += (target.x - mouse.x) * k;
    mouse.y += (target.y - mouse.y) * k;
    mouse.hover += (target.hover - mouse.hover) * k * 0.6;
    draw();
  });

  return () => {
    unsubscribe();
    intersectionObserver.disconnect();
    resizeObserver.disconnect();
    window.removeEventListener('pointermove', onPointerMove);
    document.documentElement.removeEventListener('pointerleave', onPointerLeave);
    canvas.removeEventListener('webglcontextlost', onLost);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  };
}
