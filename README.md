# Rumbo · Del ruido al rumbo (motion graphics, 25 s)

| Archivo | Qué es |
|---|---|
| `rumbo-motion.html` | **La animación.** Archivo único, autocontenido (fuentes Inter incrustadas, sin dependencias). Ábrelo en Chrome/Safari/Firefox. |
| `rumbo-motion.mp4` | Render real: H.264, 1920×1080, 60 fps, 1500 fotogramas, 25,0 s. |
| `rumbo-motion-vertical.html` | **Versión vertical 9:16** (1080×1920) para Reels, TikTok y Shorts. Mismo reloj y controles, más **S** para ver las zonas de seguridad. |
| `rumbo-motion-vertical.mp4` | Render real vertical: H.264, 1080×1920, 60 fps, 1500 fotogramas, 25,0 s. |
| `src/rumbo-vertical.template.html` | Fuente editable de la vertical (`CONFIG` al principio del `<script>`). |
| `tools/safecheck.mjs` | Comprueba que titulares, datos, marca y CTA de la vertical quedan dentro de la zona segura. |
| `rumbo-suscripciones.html` | **Nuevo vídeo:** suscripciones, ingresos recurrentes y moneda principal (16:9, 25 s). Controles iguales + **S** para ver la zona segura. |
| `rumbo-suscripciones-4k.mp4` | Render real 4K: H.264, 3840×2160, 60 fps, 1500 fotogramas, 25,0 s. |
| `rumbo-suscripciones-vertical.html` | **Vídeo 2 en vertical 9:16** (lienzo 1080×1920), recompuesto para móvil. Controles iguales + **S** para la zona segura. |
| `rumbo-suscripciones-vertical.mp4` | Render real vertical: H.264, 1080×1920, 60 fps, 1500 fotogramas, 25,0 s. |
| `src/rumbo-suscripciones-vertical.template.html` | Fuente de la vertical (generada con `tools/make_vertical_subs.py` a partir de la horizontal + geometría propia). |
| `tools/safecheck-suscripciones-vertical.mjs` | Comprueba que el lienzo es vertical y la zona segura (x 80–920, y 180–1600). |
| `src/rumbo-suscripciones.template.html` | Fuente editable del nuevo vídeo (`CONFIG`: textos, datos, monedas y tiempos). |
| `tools/safecheck-suscripciones.mjs` | Comprueba la zona segura del nuevo vídeo (x 160–1760, y 100–880). |
| `src/rumbo.template.html` | Fuente editable (textos, colores, datos y tiempos en `CONFIG` al principio del `<script>`). |
| `tools/build.py` | Inserta las fuentes en las plantillas → `rumbo-motion.html` y `rumbo-motion-vertical.html`. |
| `tools/render.mjs` | Renderiza el HTML a MP4 fotograma a fotograma (Playwright + ffmpeg). |
| `tools/snap.mjs` | Capturas PNG de instantes concretos para revisión. |

## Controles
- **Espacio** reproducir/pausa · **R** reiniciar · **H** ocultar/mostrar controles (para grabar) · **← / →** fotograma a fotograma (Mayús: ±1 s).
- La barra de tiempo tiene marcas por escena; se puede hacer clic en ellas.
- Parámetros de URL: `?controls=0` (sin controles), `?autoplay=0`, `?t=14.5` (empezar en ese segundo).

## Editar y volver a generar
```bash
python3 tools/build.py                 # src/rumbo.template.html → rumbo-motion.html
node tools/render.mjs 60 rumbo-motion.mp4                         # horizontal
VERTICAL=1 node tools/render.mjs 60 rumbo-motion-vertical.mp4     # vertical
node tools/safecheck.mjs                                          # zonas de seguridad (vertical)
FILE=rumbo-suscripciones.html DPR=2 node tools/render.mjs 60 rumbo-suscripciones-4k.mp4   # nuevo vídeo en 4K
node tools/safecheck-suscripciones.mjs                            # zona segura (nuevo vídeo)
python3 tools/make_vertical_subs.py && python3 tools/build.py    # regenera la vertical del vídeo 2
FILE=rumbo-suscripciones-vertical.html VW=1080 VH=1920 node tools/render.mjs 60 rumbo-suscripciones-vertical.mp4
node tools/safecheck-suscripciones-vertical.mjs                   # lienzo 9:16 + zona segura
VERTICAL=1 VW=360 VH=640 node tools/snap.mjs /tmp/movil 12.4      # vista a tamaño de móvil
```

### Zona segura (vertical)
Libres de información esencial: 180 px arriba, 320 px abajo, 160 px a la derecha y 80 px a la izquierda
(zona útil x 80–920, y 180–1600). El fondo y los iconos decorativos pueden ocupar toda la pantalla.
Todo se calcula a partir de un único reloj (`render(t)`): reproducir, pausar, recorrer y renderizar dan siempre el mismo fotograma para el mismo instante.

## Datos ficticios (cuadran entre sí)
Ingresos 1.600 + 250 = **1.850 €** · Gastos 560 + 420 + 140 + 120 = **1.240 €** · Ahorro **610 €** ·
Meta 3.000 €: 530 € previos + 610 € este mes = **1.140 € (38 %)**, faltan **1.860 €**.

## Vídeo 2 · Suscripciones, ingresos y moneda
Composición lógica 1920×1080 renderizada con densidad de píxeles 2 → **3840×2160 reales** (texto y vectores dibujados a 4K, sin reescalar).
Datos ficticios: suscripciones 20 + 10 + 15 + 25 + 5 = **75 €/mes (5)** · ingresos recurrentes 200 + 150 + 250 = **600 €/mes registrados (3)** ·
monedas EUR, USD, MXN, ARS, COP, CLP, PEN y PYG (se elige MXN; no se muestra ninguna conversión).
