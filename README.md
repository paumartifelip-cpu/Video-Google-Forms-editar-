# Rumbo · Del ruido al rumbo (motion graphics, 25 s)

| Archivo | Qué es |
|---|---|
| `rumbo-motion.html` | **La animación.** Archivo único, autocontenido (fuentes Inter incrustadas, sin dependencias). Ábrelo en Chrome/Safari/Firefox. |
| `rumbo-motion.mp4` | Render real: H.264, 1920×1080, 60 fps, 1500 fotogramas, 25,0 s. |
| `rumbo-motion-vertical.html` | **Versión vertical 9:16** (1080×1920) para Reels, TikTok y Shorts. Mismo reloj y controles, más **S** para ver las zonas de seguridad. |
| `rumbo-motion-vertical.mp4` | Render real vertical: H.264, 1080×1920, 60 fps, 1500 fotogramas, 25,0 s. |
| `src/rumbo-vertical.template.html` | Fuente editable de la vertical (`CONFIG` al principio del `<script>`). |
| `tools/safecheck.mjs` | Comprueba que titulares, datos, marca y CTA de la vertical quedan dentro de la zona segura. |
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
VERTICAL=1 VW=360 VH=640 node tools/snap.mjs /tmp/movil 12.4      # vista a tamaño de móvil
```

### Zona segura (vertical)
Libres de información esencial: 180 px arriba, 320 px abajo, 160 px a la derecha y 80 px a la izquierda
(zona útil x 80–920, y 180–1600). El fondo y los iconos decorativos pueden ocupar toda la pantalla.
Todo se calcula a partir de un único reloj (`render(t)`): reproducir, pausar, recorrer y renderizar dan siempre el mismo fotograma para el mismo instante.

## Datos ficticios (cuadran entre sí)
Ingresos 1.600 + 250 = **1.850 €** · Gastos 560 + 420 + 140 + 120 = **1.240 €** · Ahorro **610 €** ·
Meta 3.000 €: 530 € previos + 610 € este mes = **1.140 € (38 %)**, faltan **1.860 €**.
