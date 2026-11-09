# Omni 1.2 Flash: el calcetín del abuelo

Vídeo vertical de 60 s (1080×1920, 60 fps) hecho con HyperFrames: HTML + canvas renderizado a MP4.

- `index.html`: la composición raíz (un canvas con `renderAt(t)` determinista y la mezcla de audio).
- `assets/js/core.js`: easing (easeInOutExpo con overshoot), cristal líquido, sprites de texto, morph metaball y movimientos de cámara (zoom a través, pull-back, paneo).
- `assets/js/chars.js`: personajes y atrezo en cristal (calcetín, paloma minera, vaca, cactus, faro, flamenco, tortuga, autobús, cisne, piña, ciervo, luna, abuelo, candado…).
- `assets/js/film.js`: el plano secuencia, los subtítulos cinéticos palabra a palabra, la escarcha, el desenfoque de movimiento y el cierre en bucle.
- `tools/vo.py`: coloca la locución, susurra el tramo 26-28 s (vocoder LPC) y estima los tiempos de cada palabra.
- `tools/audio.py`: música a 120 BPM (un compás = 2 s = una sorpresa) y efectos de sonido, todo sintetizado por código.
- `tools/preview.js`: captura fotogramas sueltos para revisar.

```bash
python3 tools/vo.py && python3 tools/audio.py
```

```bash
npx hyperframes render . -o renders/omni_raw.mp4 --fps 60 --quality delivery
```
