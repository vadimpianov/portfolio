/**
 * Живой градиент для hero: WebGL-шейдер без библиотек.
 * Пятна цвета медленно перетекают (шум с деформацией), курсор сдвигает палитру
 * вокруг себя и слегка — во всём блоке. Цвета берутся из CSS-переменных
 * `--hero-c0…--hero-c4` элемента, чтобы палитра жила рядом со стилями.
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
uniform vec3 uColors[5];

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

// Палитра из 5 опорных цветов, t в 0..1. Опоры неравномерные: жёлтой и
// фиолетовой зонам — по ~40%, розовый (c2) — узкий переход между ними.
vec3 palette(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 c = mix(uColors[0], uColors[1], smoothstep(0.0, 0.38, t));
  c = mix(c, uColors[2], smoothstep(0.38, 0.5, t));
  c = mix(c, uColors[3], smoothstep(0.5, 0.62, t));
  c = mix(c, uColors[4], smoothstep(0.62, 1.0, t));
  return c;
}

// «Пинг-понг»: сдвиг за край палитры отражается обратно, без резких швов.
float pingpong(float x) { return abs(mod(x + 1.0, 2.0) - 1.0); }

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution;
  float aspect = uResolution.x / uResolution.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  vec2 m = vec2(uMouse.x * aspect, uMouse.y);
  float t = uTime;

  // Влияние курсора: мягкое пятно вокруг него.
  float d = length(p - m);
  float influence = exp(-d * d * 2.5) * uHover;

  // Деформированный шум — перетекающие пятна; курсор слегка «тянет» поле.
  vec2 q = vec2(snoise(vec3(p * 0.8, t * 0.05)), snoise(vec3(p * 0.8 + 7.3, t * 0.05)));
  float f = snoise(vec3(p * 0.6 + q * 0.9 - (p - m) * influence * 0.8, t * 0.07));

  // База: жёлтый слева → фиолетовый справа, поверх — шум.
  float v = uv.x * 0.8 + (1.0 - uv.y) * 0.15;
  v = v * 0.8 + f * 0.32;

  // Курсор меняет цвет: локально вокруг себя и немного во всём блоке.
  v += influence * 0.45;
  v += (uMouse.x - 0.5) * 0.25 * uHover;

  vec3 color = palette(pingpong(v));
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

interface Options {
  /** Статичная картинка без анимации и реакции на курсор. */
  reducedMotion: boolean;
  /** Подписка на кадры (например, gsap.ticker); возвращает отписку. */
  onFrame: (callback: (timeSeconds: number) => void) => () => void;
}

/** Запускает градиент на `canvas` внутри `root`. Возвращает функцию очистки. */
export function mountHeroGradient(
  root: HTMLElement,
  canvas: HTMLCanvasElement,
  { reducedMotion, onFrame }: Options,
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

  const styles = getComputedStyle(root);
  const colors = [0, 1, 2, 3, 4].flatMap((i) => hexToRgb(styles.getPropertyValue(`--hero-c${i}`)));
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
