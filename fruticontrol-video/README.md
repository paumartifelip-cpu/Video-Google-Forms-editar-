# FrutiControl · anuncio de 25 s (HyperFrames)

Pieza de motion graphics de 25 s, 1920 × 1080, 60 fps, hecha con HTML, CSS, SVG y GSAP sobre
[HyperFrames](https://github.com/heygen-com/hyperframes): una composición HTML con una única línea de
tiempo maestra en pausa (`window.__timelines.main`) que se puede recorrer fotograma a fotograma.

## Archivos

| Archivo | Qué es |
| --- | --- |
| `dist/FrutiControl-25s.html` | **Reproductor autocontenido** (un solo archivo, sin dependencias externas). Ábrelo con doble clic. |
| `renders/FrutiControl-25s-1080p60.mp4` | Vídeo renderizado con `hyperframes render` (H.264, 1920×1080, 60 fps). |
| `index.html` | La composición HyperFrames (fuente). |
| `scripts/build-player.mjs` | Genera el reproductor incrustando GSAP, fuentes y logo. |
| `assets/fruticontrol-logo.png` | Logo original recortado de las capturas (fondo eliminado). |
| `assets/fonts/` | Figtree (licencia OFL). |

### Controles del reproductor

- **Reproducir / pausar**: botón o barra espaciadora.
- **Reiniciar**: botón o tecla `R`.
- **Recorrer la línea de tiempo**: barra deslizante; `←` / `→` avanzan un fotograma (1/60 s).
- **Ocultar controles para grabar**: botón o tecla `H` (otra vez `H` para mostrarlos).
- `?autoplay=0` en la URL arranca en pausa. `window.FrutiPlayer.seek(s)` permite automatizar.

La composición se escala siempre en 16:9 y no arranca hasta que fuentes e imágenes están listas.

## Comandos

```bash
npx hyperframes check                     # lint + auditoría de layout, movimiento y contraste
npx hyperframes preview                   # Studio (editor visual)
npx hyperframes render --fps 60 --quality delivery --output renders/FrutiControl-25s-1080p60.mp4
node scripts/build-player.mjs             # regenera dist/FrutiControl-25s.html
```

## Qué se puede editar sin tocar la animación

En el `<script>` de `index.html`:

- `DATA`: todos los importes ficticios. Los totales del día se calculan solos
  (ingresos 150.000 + 100.000 = 250.000; gastos 20.000 + 60.000 = 80.000; beneficio 170.000).
  **Las pérdidas (12.000) nunca se restan del beneficio.**
- `T`: el segundo en que empieza cada escena. Todo lo que pasa dentro de una escena va relativo a ese valor.
- Colores: variables CSS en `:root` (extraídas píxel a píxel de las capturas).
- Textos: directamente en el HTML (titulares en `.hl`, cierre en `#wm`, `#tag`, `#cta`).

## Identidad visual extraída de las capturas

- Menú lateral con degradado menta `#b1e1c3 → #97d6af`; elemento activo en una tarjeta blanca.
- Fondo de página `#f2f8f4`, tarjetas blancas con borde `#e3ebe6`.
- Verde de acción `#2c9a5e`, cifras de ingreso `#1c7348`, rótulos `#1e7644`, titulares `#12291d`.
- Rojo coral `#c03a2a` para gastos y pérdidas, sobre superficie `#fbeae7`.
- Tarjetas de cifra con barra lateral de 6 px; tarjeta de beneficio con degradado `#8ad1a5 → #5ec088`.
- Rótulos de sección en mayúsculas con espaciado ancho; cifras grandes y gruesas «Gs. 0».
- El logo original (la F naranja con forma de fruta y hoja verde) se usa tal cual: en el menú y como protagonista del cierre.

## Guion y cadencia

| Tiempo | Escena | Ritmo | Transformación |
| --- | --- | --- | --- |
| 0–2,35 s | «¿Sabes cuánto gana tu frutería?» | RÁPIDO → pausa | Fruta, monedas, tickets y cajas entran desde todos lados |
| 2,35–6,7 s | Caja | LENTO | La manzana vendida → ticket «Venta de fruta Gs. 150.000» → ingreso; bolsa → gasto Gs. 20.000; beneficio Gs. 130.000 |
| 6,7–9,3 s | Pérdidas | RÁPIDO | La tarjeta de beneficio se compacta y queda arriba sin cambiar; plátanos que se estropean → registro de pérdida Gs. 12.000 en el historial |
| 9,3–12,9 s | Inventario | RÁPIDO | El registro vuelve a ser plátano; la fruta se agrupa por tipo → tarjetas 25 / 30 / 3 kg; plátanos → «Stock bajo» |
| 12,9–17,25 s | Suscripciones | medio | La fruta salta de las tarjetas a una caja → la caja se convierte en el pack de María; «Pagó» → Pagado → cobro a la caja → Packs por entregar: 1 |
| 17,25–20,55 s | Estadísticas | LENTO | Las tarjetas de ingresos, gastos y pérdidas encajan en el panel; barras y cifras; beneficio Gs. 170.000 desacelerando |
| 20,55–21,8 s | Producto | RÁPIDO + cámara | Aparece la app completa (cabecera, resumen de hoy, packs, stock bajo); la cámara se aleja y recorre los cinco apartados |
| 21,8–25 s | Cierre | CALMA | El panel se convierte en el círculo del logo; frutas alrededor; «FrutiControl · Tu frutería, bajo control. · Empieza a organizar tu negocio». Totalmente quieto desde 22,95 s (2 s de lectura) |

## Sonido (sugerencia, no incluido)

| Tiempo | Efecto |
| --- | --- |
| 0,0–0,6 s | «Whoosh» corto + pequeños golpes de fruta al caer; tintineo de monedas a 0,3 s |
| 0,8 s | Golpe seco de cajas de madera al apilarse |
| 2,4 s | Whoosh ascendente (la manzana sale volando) |
| 3,1 s | «Pop» suave al convertirse en ticket |
| 3,65 s y 4,35 s | Clic de botón (+ Ingreso / – Gasto) |
| 4,15 s y 5,85 s | Caja registradora suave al sumar/restar |
| 7,3–7,7 s | Pequeño «squelch» al estropearse el plátano |
| 7,85 s | Clic «Registrar pérdida» |
| 9,65–10,4 s | Ráfaga de pops de fruta entrando |
| 12,0 s | Aviso suave (dos notas descendentes) en «Stock bajo» |
| 13,6–14,05 s | Golpecitos de fruta en la caja |
| 15,3 s | Clic «Pagó» + «ding» de confirmación |
| 19,35 s | Subida tonal larga mientras crece el beneficio |
| 20,6 s | Whoosh de cámara |
| 22,2 s | Acorde final cálido con el logo; silencio hasta el final |
