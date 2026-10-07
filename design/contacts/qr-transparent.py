"""QR без белой подложки: *-qr-white.webp (обрезанные QR на белом) → public/images/contacts/*-qr.webp с прозрачным фоном.
Белое (мин. канал ≥ 245) — прозрачное, цветные модули — непрозрачные, край — плавный переход (200…245)."""
import pathlib

import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parents[1] / 'public/images/contacts'

for name in ('telegram', 'max'):
    rgb = np.asarray(Image.open(HERE / f'{name}-qr-white.webp').convert('RGB')).astype(np.float32)
    low = rgb.min(axis=2)
    alpha = np.clip((245 - low) / 45, 0, 1)
    # Край модуля был смешан с белым — вычитаем белое, чтобы на тёмном фоне не было светлой каймы
    a = np.maximum(alpha, 1e-3)[..., None]
    color = np.clip((rgb - 255 * (1 - a)) / a, 0, 255)
    out = np.dstack([color, alpha * 255]).astype(np.uint8)
    Image.fromarray(out, 'RGBA').save(OUT / f'{name}-qr.webp', 'WEBP', quality=92, method=6)
    print(name, out.shape)
