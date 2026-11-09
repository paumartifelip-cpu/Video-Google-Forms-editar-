"""Place voiceover lines on the 60 s timeline, whisperize line 13, and estimate word timings.

Outputs assets/audio/vo.wav (48 kHz mono) and assets/data/words.json.
"""
import json, re, subprocess, numpy as np
from scipy.io import wavfile
from scipy.signal import lfilter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
DUR = 60.0

# idx, start (s), tempo, display words, whisper
LINES = [
    (0, 0.06, 1.12, "Mi abuelo perdió un calcetín en 1987.", False),
    (1, 2.62, 1.05, "Hoy lo ha encontrado una IA.", False),
    (2, 4.30, 1.00, "Y no, no es broma.", False),
    (3, 5.85, 1.05, "Se llama Omni 1.2 Flash. Es de Google.", False),
    (4, 8.15, 1.00, "Tú le escribes lo que quieras...", False),
    (5, 10.05, 1.00, "...y te hace el vídeo. Con sonido.", False),
    (6, 11.95, 1.12, "Vídeos que hasta ahora nadie sabía hacer.", False),
    (7, 14.35, 1.00, "Tres cosas.", False),
    (8, 16.08, 1.00, "Una.", False),
    (9, 17.85, 1.10, "Antes, diez segundos de vídeo.", False),
    (10, 20.10, 1.00, "Ahora, quince.", False),
    (11, 22.05, 1.00, "Dos. Está en Google Flow.", False),
    (12, 23.90, 1.10, "Lo abres, escribes, y listo.", False),
    (13, 26.15, 1.00, "Y la tres... es la buena.", True),
    (14, 28.10, 1.00, "Eh. Volved.", False),
    (15, 30.05, 1.00, "¿No sabes editar? Da igual.", False),
    (16, 32.05, 1.00, "Se lo pides como a un amigo.", False),
    (17, 34.05, 1.00, "'Ponle bigote a la luna.'", False),
    (18, 36.10, 1.00, "Y lo cambia.", False),
    (19, 37.92, 1.10, "'Ahora, que llueva hacia arriba.'", False),
    (20, 40.20, 1.00, "Hecho.", False),
    (21, 42.35, 1.00, "¿Y el abuelo?", False),
    (22, 44.08, 1.00, "El abuelo ya tiene su calcetín.", False),
    (23, 46.10, 1.00, "Pero le falta el otro.", False),
    (24, 48.10, 1.00, "El otro lo tengo yo. Y dentro está el truco para que tus vídeos parezcan de cine.", False),
    (25, 52.02, 1.15, "Ese te lo enseño en el vídeo completo.", False),
    (26, 54.70, 1.00, "Escribe YOUTUBE en los comentarios y te lo paso.", False),
]

# spoken-syllable weights for tokens whose spelling hides their length
SPOKEN = {"1987": "mil novecientos ochenta y siete", "1.2": "uno punto dos", "IA": "i a",
          "YOUTUBE": "yutub", "Google": "gugel", "Flow": "flou", "Flash": "flas", "Omni": "omni"}

def syllables(word):
    key = word.strip(".,¿?¡!'\"…")
    w = SPOKEN.get(key, key).lower()
    w = re.sub(r"[^a-záéíóúüñ ]", "", w)
    n = len(re.findall(r"[aeiouáéíóúü]+", w))
    return max(1, n)

def load(path):
    out = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(out, dtype=np.float32).copy()

def tempo(x, k):
    if abs(k - 1) < 1e-3:
        return x
    p = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-",
                        "-af", f"atempo={k}", "-f", "f32le", "-"], input=x.tobytes(), capture_output=True, check=True)
    return np.frombuffer(p.stdout, dtype=np.float32).copy()

def whisperize(x, order=24, n=1024, hop=256):
    """LPC vocoder with noise excitation: keeps the words, removes the voicing."""
    rng = np.random.default_rng(7)
    win = np.hanning(n)
    y = np.zeros(len(x) + n)
    norm = np.zeros(len(x) + n)
    pre = lfilter([1, -0.95], [1], x)
    for s in range(0, len(x) - n, hop):
        f = pre[s:s + n] * win
        r = np.correlate(f, f, "full")[n - 1:n + order]
        if r[0] < 1e-9:
            continue
        # Levinson-Durbin
        a = np.zeros(order + 1); a[0] = 1; e = r[0]
        for i in range(1, order + 1):
            acc = r[i] + np.dot(a[1:i], r[i - 1:0:-1])
            k = -acc / e
            a[1:i + 1] = a[1:i + 1] + k * np.concatenate([a[i - 1:0:-1], [1]])
            e *= (1 - k * k)
            if e <= 0:
                break
        noise = rng.standard_normal(n) * np.sqrt(max(e, 0) / n)
        seg = lfilter([1], a, noise) * win
        y[s:s + n] += seg; norm[s:s + n] += win ** 2
    y = y[:len(x)] / np.maximum(norm[:len(x)], 1e-3)
    y = lfilter([1], [1, -0.95], y)
    y = lfilter([1, -0.5], [1], y)  # brighten a touch: breathy
    y *= np.sqrt(np.mean(x ** 2) / max(np.mean(y ** 2), 1e-12))
    return (0.88 * y + 0.12 * x).astype(np.float32)

def envelope(x, hop=240):
    frames = len(x) // hop
    e = np.sqrt(np.array([np.mean(x[i * hop:(i + 1) * hop] ** 2) for i in range(frames)]) + 1e-12)
    e = np.convolve(e, np.ones(5) / 5, "same")
    return e, hop / SR

def word_times(x, words):
    """Split the line among its words by syllable weight, snapping each seam to a nearby energy dip."""
    e, dt = envelope(x)
    total = len(x) / SR
    w = np.array([syllables(t) for t in words], float)
    cum = np.concatenate([[0], np.cumsum(w)]) / w.sum() * total
    seams = []
    for b in cum[1:-1]:
        i0 = int(max(0, (b - 0.09) / dt)); i1 = int(min(len(e) - 1, (b + 0.09) / dt))
        if i1 > i0:
            j = i0 + int(np.argmin(e[i0:i1 + 1]))
            seams.append(j * dt)
        else:
            seams.append(b)
    seams = np.maximum.accumulate(np.array([0] + seams + [total]))
    return [(float(seams[i]), float(seams[i + 1])) for i in range(len(words))]

def main():
    vo = np.zeros(int(SR * DUR) + SR, np.float32)
    data = []
    for idx, start, k, text, wh in LINES:
        x = load(ROOT / f"assets/vo/tight/{idx:02d}.wav")
        x = tempo(x, k)
        if wh:
            x = whisperize(x)
        fade = int(0.008 * SR)
        x[:fade] *= np.linspace(0, 1, fade); x[-fade:] *= np.linspace(1, 0, fade)
        s = int(start * SR)
        vo[s:s + len(x)] += x
        words = text.split()
        times = word_times(x, words)
        data.append({"line": idx, "start": start, "end": start + len(x) / SR, "text": text, "whisper": wh,
                     "words": [{"w": wd, "s": round(start + a, 3), "e": round(start + b, 3)} for wd, (a, b) in zip(words, times)]})
        print(f"{idx:02d} {start:6.2f}-{start + len(x) / SR:6.2f} {text}")
    vo = vo[:int(SR * DUR)]
    vo *= 0.89 / np.max(np.abs(vo))
    (ROOT / "assets/audio").mkdir(parents=True, exist_ok=True)
    (ROOT / "assets/data").mkdir(parents=True, exist_ok=True)
    wavfile.write(ROOT / "assets/audio/vo.wav", SR, vo.astype(np.float32))
    (ROOT / "assets/data/words.json").write_text(json.dumps(data, ensure_ascii=False, indent=1))

if __name__ == "__main__":
    main()
