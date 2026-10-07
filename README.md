# Rumbo · Del ruido al rumbo (motion graphics, 25 s)

| Archivo | Qué es |
|---|---|
| `rumbo-motion.html` | **La animación.** Archivo único, autocontenido (fuentes Inter incrustadas, sin dependencias). Ábrelo en Chrome/Safari/Firefox. |
| `rumbo-motion.mp4` | Render real: H.264, 1920×1080, 60 fps, 1500 fotogramas, 25,0 s. |
| `src/rumbo.template.html` | Fuente editable (textos, colores, datos y tiempos en `CONFIG` al principio del `<script>`). |
| `tools/build.py` | Inserta las fuentes en la plantilla → `rumbo-motion.html`. |
| `tools/render.mjs` | Renderiza el HTML a MP4 fotograma a fotograma (Playwright + ffmpeg). |
| `tools/snap.mjs` | Capturas PNG de instantes concretos para revisión. |

## Controles
- **Espacio** reproducir/pausa · **R** reiniciar · **H** ocultar/mostrar controles (para grabar) · **← / →** fotograma a fotograma (Mayús: ±1 s).
- La barra de tiempo tiene marcas por escena; se puede hacer clic en ellas.
- Parámetros de URL: `?controls=0` (sin controles), `?autoplay=0`, `?t=14.5` (empezar en ese segundo).

## Editar y volver a generar
```bash
python3 tools/build.py                 # src/rumbo.template.html → rumbo-motion.html
node tools/render.mjs 60 rumbo-motion.mp4
```
Todo se calcula a partir de un único reloj (`render(t)`): reproducir, pausar, recorrer y renderizar dan siempre el mismo fotograma para el mismo instante.

## Datos ficticios (cuadran entre sí)
Ingresos 1.600 + 250 = **1.850 €** · Gastos 560 + 420 + 140 + 120 = **1.240 €** · Ahorro **610 €** ·
Meta 3.000 €: 530 € previos + 610 € este mes = **1.140 € (38 %)**, faltan **1.860 €**.
