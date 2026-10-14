# Motion graphics – 33 anuncios en 3 minutos

Secuencia de 30 s a 1080p / 60 fps generada a partir de las 5 imágenes de `assets/` (en orden 1 → 5).

- `prep.py` separa cada imagen en capas: fondo, bollería, burbuja de cristal y cada línea de texto.
- `render.py` anima las capas (muelles con overshoot, squash & stretch, parallax, motion blur por supermuestreo)
  y encadena las escenas con transiciones:
  intro de puntos que rebotan y se fusionan → blob líquido → whip pan → franjas en píldora → zoom + iris → tarjeta final con rebote y confeti.

```bash
pip install opencv-python-headless numpy
python3 prep.py
python3 render.py            # -> build/motion.mp4
python3 render.py --stills 3 12.4   # fotogramas de prueba
```
