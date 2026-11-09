"""Music bed and sound effects, synthesised in code. 120 BPM: one bar = 2 s = one surprise.

Writes assets/audio/music.wav and assets/audio/sfx.wav (48 kHz stereo).
"""
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt, lfilter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SR = 48000
DUR = 60.0
N = int(SR * DUR)
BEAT = 0.5
rng = np.random.default_rng(1987)

def t_(d):
    return np.arange(int(d * SR)) / SR

def lp(x, f, o=2):
    return sosfilt(butter(o, min(f, SR / 2 - 100), "low", fs=SR, output="sos"), x)

def hp(x, f, o=2):
    return sosfilt(butter(o, f, "high", fs=SR, output="sos"), x)

def bp(x, lo, hi, o=2):
    return sosfilt(butter(o, [lo, hi], "band", fs=SR, output="sos"), x)

def env(n, a, d, curve=6.0):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-np.maximum(0, t - a) * curve / max(d, 1e-4))
    return e

def add(buf, x, at, gain=1.0, pan=0.0):
    s = int(at * SR)
    if s >= len(buf):
        return
    x = x[: len(buf) - s]
    l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    buf[s:s + len(x), 0] += x * gain * l * 1.414
    buf[s:s + len(x), 1] += x * gain * r * 1.414

def note(m):
    return 440 * 2 ** ((m - 69) / 12)

# ---------------------------------------------------------------- instruments
def kick():
    t = t_(0.45)
    f = 45 + 110 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 7.5)
    x += 0.25 * np.exp(-t * 300) * rng.standard_normal(len(t))
    return np.tanh(1.6 * x)

def clap():
    t = t_(0.3)
    n = rng.standard_normal(len(t))
    e = np.zeros(len(t))
    for o in (0, 0.011, 0.022):
        e += np.where(t >= o, np.exp(-(t - o) * 60), 0) * 0.5
    e += np.exp(-t * 18) * 0.6
    return bp(n * e, 900, 5000)

def hat(open_=False):
    t = t_(0.25 if open_ else 0.06)
    n = hp(rng.standard_normal(len(t)), 7000, 4)
    return n * np.exp(-t * (14 if open_ else 70))

def pluck(m, d=0.35):
    # marimba / glass pluck: sine + inharmonic partials, fast decay
    t = t_(d)
    f = note(m)
    x = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 3.98 * t) * np.exp(-t * 30) \
        + 0.15 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t * 60)
    return x * env(len(t), 0.002, d, 7)

def bell(m, d=1.6):
    t = t_(d)
    f = note(m)
    mod = np.sin(2 * np.pi * f * 3.5 * t) * 2.2 * np.exp(-t * 3)
    x = np.sin(2 * np.pi * f * t + mod) * env(len(t), 0.003, d, 4.5)
    return x

def bass(m, d=0.24):
    t = t_(d)
    f = note(m)
    saw = 2 * ((f * t) % 1) - 1
    sq = np.sign(np.sin(2 * np.pi * f * t))
    x = 0.6 * saw + 0.4 * sq
    x = 0.6 * lp(x, 2200, 2) * np.exp(-t * 14) + 0.4 * lp(x, 500, 2)
    return np.tanh(2 * x * env(len(t), 0.004, d, 5))

def pad(ms, d):
    t = t_(d)
    x = np.zeros(len(t))
    for m in ms:
        for det in (-0.08, 0.0, 0.08):
            f = note(m + det)
            x += 2 * ((f * t + rng.random()) % 1) - 1
    x = lp(x, 1800, 2) / (len(ms) * 3)
    a = np.minimum(1, t / 0.25) * np.minimum(1, (d - t) / 0.25)
    return x * a

# ---------------------------------------------------------------- music
CHORDS = [  # Am F C G (bar = 2 s)
    (57, [57, 60, 64, 69]), (53, [53, 57, 60, 65]), (48, [55, 60, 64, 67]), (55, [55, 59, 62, 67]),
]

def energy(bar_t):
    """0 silent .. 3 full, per moment."""
    if 14.0 <= bar_t < 16.0 or 42.0 <= bar_t < 44.0:
        return 0
    if bar_t < 8 or bar_t >= 58:
        return 1
    if bar_t < 14:
        return 2
    if 26 <= bar_t < 30:
        return 1.5   # whisper: filtered
    if 52 <= bar_t < 54:
        return 0.5   # freeze: pad only
    return 3

def music():
    L = np.zeros((N + SR, 2))
    K, C, H, HO = kick(), clap(), hat(), hat(True)
    for b in range(int(DUR / BEAT)):
        tb = b * BEAT
        e = energy(tb)
        if e >= 1 and e != 1.5:
            add(L, K, tb, 0.9 if e >= 2 else 0.7)
        if e == 1.5 and b % 2 == 0:
            add(L, K, tb, 0.45)
        if e >= 2 and b % 2 == 1:
            add(L, C, tb, 0.35)
        if e >= 1:
            add(L, H, tb + 0.25, 0.18 if e >= 2 else 0.1, 0.3)
            if e >= 3:
                add(L, H, tb + 0.125, 0.08, -0.3); add(L, H, tb + 0.375, 0.08, -0.3)
        if e >= 3 and b % 4 == 3:
            add(L, HO, tb + 0.25, 0.12, 0.4)
    # harmony per bar
    arp_pat = [0, 2, 1, 3, 2, 1, 3, 2]
    for bar in range(30):
        tb = bar * 2.0
        e = energy(tb)
        root, ch = CHORDS[bar % 4]
        if e == 0:
            continue
        if e >= 0.5:
            add(L, pad(ch, 2.0), tb, 0.10 if e < 3 else 0.12)
        if e >= 1 and e != 0.5:
            for i in range(16):  # 16th-note arps
                if e < 2 and i % 2:
                    continue
                m = ch[arp_pat[i % 8]] + 12 + (12 if (i // 8) % 2 and e >= 3 else 0)
                add(L, pluck(m), tb + i * 0.125, 0.16 if e >= 2 else 0.12, 0.5 * np.sin(i))
        if e >= 2 and e != 1.5:
            for i in range(8):  # rolling offbeat bass
                m = root - 12 + (7 if i in (3, 7) else 0)
                add(L, bass(m), tb + i * 0.25 + (0.125 if i % 2 == 0 else 0), 0.30)
        if e >= 3:
            add(L, bell(ch[-1] + 24, 1.8), tb, 0.07, -0.4)
        if e == 0.5:  # freeze: shimmering held bell cluster
            for k, m in enumerate(ch):
                add(L, bell(m + 24, 2.0), tb + k * 0.02, 0.05, k / 2 - 0.75)
    # risers into the drops
    for start in (12.0, 40.0):
        t = t_(2.0)
        nse = rng.standard_normal(len(t))
        sweep = np.zeros(len(t))
        for i in range(0, len(t), 2400):
            fc = 300 + 7000 * (i / len(t)) ** 2
            sweep[i:i + 2400] = bp(nse[i:i + 2400], fc * 0.8, fc * 1.2, 1)
        add(L, sweep * (t / 2) ** 2 * 0.6, start, 1.0)
    # whisper section: low-pass the bed
    a, b_ = int(26 * SR), int(30 * SR)
    L[a:b_] = np.stack([lp(L[a:b_, 0], 900), lp(L[a:b_, 1], 900)], 1)
    # hard stops on the black hits
    for a, b_ in ((14.0, 16.0), (42.0, 44.0)):
        L[int(a * SR):int(b_ * SR)] = 0
    return L[:N]

# ---------------------------------------------------------------- sound effects
def whoosh(d=0.6, f0=300, f1=4000, peak=0.5):
    t = t_(d)
    n = rng.standard_normal(len(t))
    out = np.zeros(len(t))
    blk = 1200
    for i in range(0, len(t), blk):
        u = i / len(t)
        fc = f0 * (f1 / f0) ** u
        out[i:i + blk] = bp(n[i:i + blk], fc * 0.6, min(fc * 1.6, 20000), 1)
    u = t / d
    e = np.where(u < peak, (u / peak) ** 2, ((1 - u) / (1 - peak)) ** 1.5)
    return out * e

def pop(f=900, d=0.12):
    t = t_(d)
    f_ = f * (1 + 1.5 * np.exp(-t * 60))
    return np.sin(2 * np.pi * np.cumsum(f_) / SR) * np.exp(-t * 40)

def ding(f=1760, d=1.2):
    t = t_(d)
    x = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 4) \
        + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 8)
    return x * env(len(t), 0.001, d, 4)

def crack(d=0.35, bright=4000):
    t = t_(d)
    x = np.zeros(len(t))
    for _ in range(14):
        o = rng.random() * d * 0.5
        s = int(o * SR)
        k = t_(0.03)
        burst = rng.standard_normal(len(k)) * np.exp(-k * 200)
        x[s:s + len(k)] += burst[: len(x) - s] * rng.uniform(0.3, 1)
    x = hp(x, bright, 2)
    tinkle = sum(np.sin(2 * np.pi * rng.uniform(3000, 7000) * t) * np.exp(-t * rng.uniform(10, 30)) for _ in range(5)) * 0.15
    return x + tinkle

def thump(f=55, d=0.35):
    t = t_(d)
    return np.sin(2 * np.pi * np.cumsum(f * (1 + np.exp(-t * 30))) / SR) * np.exp(-t * 9)

def formant_voice(f0s, vowels, d, breath=0.15):
    """Tiny source-filter voice for animals and sneezes."""
    t = t_(d)
    f0 = np.interp(t, np.linspace(0, d, len(f0s)), f0s)
    f0 = f0 * (1 + 0.03 * np.sin(2 * np.pi * 6 * t))
    ph = np.cumsum(f0) / SR
    src = 2 * (ph % 1) - 1 + breath * rng.standard_normal(len(t))
    out = np.zeros(len(t))
    F = {"a": (800, 1200, 2500), "e": (500, 1900, 2500), "i": (300, 2300, 3000), "o": (500, 900, 2400), "u": (320, 800, 2300)}
    seq = list(vowels)
    seg = len(t) // len(seq)
    for k, v in enumerate(seq):
        s0, s1 = k * seg, len(t) if k == len(seq) - 1 else (k + 1) * seg
        y = np.zeros(s1 - s0)
        for j, f in enumerate(F[v]):
            y += bp(src[s0:s1], f * 0.85, f * 1.15, 1) * (1.0, 0.6, 0.3)[j]
        out[s0:s1] = y
    a = np.minimum(1, t / 0.03) * np.minimum(1, (d - t) / 0.06)
    return out * a

def sneeze(low=False):
    k = 0.6 if low else 1.0
    inhale = formant_voice([180 * k, 260 * k, 340 * k], "aa", 0.45, 0.6) * np.linspace(0.2, 1, int(0.45 * SR))
    t = t_(0.35)
    choo = hp(rng.standard_normal(len(t)), 1500 if not low else 700) * np.exp(-t * 9) * 1.4
    choo += formant_voice([300 * k, 200 * k], "u", 0.35, 0.8) * np.exp(-t * 6)
    return np.concatenate([inhale * 0.6, choo])

def bleat():
    d = 0.7
    t = t_(d)
    f0 = 330 + 40 * np.sin(2 * np.pi * 2 * t)
    trem = 1 + 0.6 * np.sin(2 * np.pi * 22 * t)
    return formant_voice(f0, "eeea", d, 0.25) * trem * 0.8

def horn():
    out = []
    for f, d in ((440, 0.18), (349, 0.32)):
        t = t_(d)
        x = np.sign(np.sin(2 * np.pi * f * t)) * 0.5 + np.sign(np.sin(2 * np.pi * f * 1.26 * t)) * 0.5
        out.append(lp(x, 2500) * np.minimum(1, (d - t) / 0.02))
    return np.concatenate(out)

def brakes():
    t = t_(0.6)
    f = 2600 + 400 * np.sin(2 * np.pi * 9 * t)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 + 0.3 * bp(rng.standard_normal(len(t)), 2000, 4000)
    return x * np.minimum(1, t / 0.05) * np.exp(-t * 2.5)

def trumpet_riff():
    # salsa montuno-ish brass stab line
    seq = [(72, 0.0, 0.12), (74, 0.15, 0.12), (76, 0.3, 0.12), (79, 0.45, 0.25), (77, 0.75, 0.12),
           (76, 0.9, 0.12), (74, 1.05, 0.12), (76, 1.2, 0.35)]
    out = np.zeros(int(1.7 * SR))
    for m, s, d in seq:
        t = t_(d)
        f = note(m) * (1 + 0.004 * np.sin(2 * np.pi * 5.5 * t))
        ph = np.cumsum(f) / SR
        saw = 2 * (ph % 1) - 1
        bright = np.minimum(1, t / 0.03)
        x = (lp(saw, 4000, 2) * bright + lp(saw, 900, 2) * (1 - bright)) * np.minimum(1, t / 0.015) * np.minimum(1, (d - t) / 0.03)
        i = int(s * SR)
        out[i:i + len(x)] += x
    return np.tanh(out * 1.5) * 0.7

def typewriter_key():
    t = t_(0.06)
    return hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 120) + 0.4 * np.sin(2 * np.pi * 180 * t) * np.exp(-t * 80)

def splash():
    t = t_(1.0)
    n = rng.standard_normal(len(t))
    return (bp(n, 300, 3000) * np.exp(-t * 3) + 0.5 * hp(n, 4000) * np.exp(-t * 8)) * np.minimum(1, t / 0.01)

def water(d=1.2):
    t = t_(d)
    x = np.zeros(len(t))
    for _ in range(int(d * 30)):
        o = int(rng.random() * (len(t) - 4000))
        k = t_(0.04)
        f = rng.uniform(600, 1500) * (1 + 2 * k / 0.04)
        x[o:o + len(k)] += np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-k * 80) * 0.5
    return x * np.minimum(1, t / 0.1) * np.minimum(1, (d - t) / 0.2)

def microwave_beep(f, d=0.14):
    t = t_(d)
    return np.sign(np.sin(2 * np.pi * f * t)) * 0.3 * np.minimum(1, (d - t) / 0.01)

def click():
    t = t_(0.03)
    return hp(rng.standard_normal(len(t)), 3000) * np.exp(-t * 300) + np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 200) * 0.6

def coo():
    return formant_voice([420, 380, 360, 400], "uuuo", 0.6, 0.1) * 0.6

def whistle_down(d=0.9, f0=2400, f1=500):
    t = t_(d)
    f = f0 * (f1 / f0) ** (t / d)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.minimum(1, t / 0.05) * np.minimum(1, (d - t) / 0.1) * 0.5

def shimmer(d=1.0):
    out = np.zeros(int(d * SR))
    for i in range(10):
        x = ding(rng.uniform(1800, 4200), 0.6) * 0.3
        s = int(i / 10 * d * 0.6 * SR)
        out[s:s + len(x)] += x[: len(out) - s]
    return out

def freeze():
    t = t_(1.2)
    n = hp(rng.standard_normal(len(t)), 5000) * np.exp(-t * 3) * 0.6
    return n + shimmer(1.2) * 0.8

def sfx():
    S = np.zeros((N + 2 * SR, 2))
    a = lambda x, at, g=1.0, p=0.0: add(S, x, at, g, p)
    # 0-2 sock falls, 1987 cracks
    a(whoosh(1.6, 200, 900, 0.5), 0.0, 0.25)
    a(crack(0.5), 1.0, 0.5, -0.2)
    # 2-4 dove rappel
    a(whistle_down(0.6, 1800, 900), 2.0, 0.25, 0.3)
    a(pop(1100), 3.15, 0.5)
    a(whoosh(0.5, 400, 5000, 0.7), 3.45, 0.35, -0.5)
    # 4 pull back into the cow's eye
    a(whoosh(0.7, 3000, 200, 0.5), 3.8, 0.55)
    a(ding(2093, 1.0), 4.35, 0.25, 0.2)
    # 6 cow sneeze, letters
    a(sneeze(low=True), 5.95, 0.9)
    for i, at in enumerate((6.55, 6.68, 6.81, 6.94)):
        a(thump(70 + i * 10, 0.25), at, 0.6); a(pop(700 + i * 120), at, 0.35, (i - 1.5) / 2)
    # 8 through the O, cactus types
    a(whoosh(0.6, 300, 6000, 0.65), 7.7, 0.5)
    for i in range(11):
        a(typewriter_key(), 8.3 + i * 0.13 + (0.03 if i % 3 == 0 else 0), 0.5, rng.uniform(-0.4, 0.4))
    a(ding(2637, 0.8), 9.85, 0.35)
    # 10 flower opens, lighthouse salsa
    a(shimmer(0.8), 10.0, 0.5)
    a(trumpet_riff(), 10.25, 0.55, 0.15)
    # 12 elevator
    a(whoosh(0.7, 200, 2500, 0.6), 11.75, 0.45)
    a(ding(1318, 1.4), 12.75, 0.45); a(ding(1046, 1.4), 12.95, 0.4)
    a(whoosh(0.4, 800, 1500, 0.5), 13.1, 0.2)
    # 14 into black: heartbeat for the 3
    a(whoosh(0.5, 4000, 150, 0.4), 13.75, 0.5)
    for at in (14.5, 15.0, 15.5):
        a(thump(50, 0.3), at, 0.9); a(thump(45, 0.3), at + 0.18, 0.6)
    # 16 drop, flamingo
    a(thump(42, 0.6), 16.0, 1.0); a(crack(0.5, 3000), 16.0, 0.4)
    a(pop(1500), 16.3, 0.4)
    # 18 the 10 and the turtle
    a(pop(800), 18.05, 0.5)
    for at in (18.75, 19.15, 19.55):
        a(crack(0.18, 1500), at, 0.6, 0.2)
    # 20 bus
    a(whoosh(0.5, 200, 1200, 0.8), 19.7, 0.6, 0.6)
    a(brakes(), 20.05, 0.45, 0.3)
    a(horn(), 20.45, 0.55)
    a(whoosh(0.3, 1500, 600, 0.3), 20.85, 0.3)
    a(bleat(), 21.05, 0.7, -0.2); a(bleat()[::1] * 0.8, 21.4, 0.5, 0.3)
    # 22 swan dive and the river
    a(whoosh(0.6, 400, 5000, 0.6), 21.75, 0.45)
    a(whistle_down(0.4, 2000, 700), 22.2, 0.3)
    a(splash(), 22.55, 0.7)
    a(water(1.3), 22.8, 0.5)
    # 24 river comes out of the phone
    a(whoosh(0.6, 3000, 300, 0.5), 23.8, 0.45)
    a(pop(1300), 24.5, 0.35)
    # 26 upside down, subtitles fall
    a(whoosh(0.8, 300, 1200, 0.5), 25.8, 0.35)
    a(whistle_down(1.0, 2200, 300), 26.9, 0.35)
    # 28 subtitles climb back up the rope
    a(whoosh(0.5, 1200, 300, 0.5), 27.8, 0.35)
    for i in range(6):
        a(pop(600 + i * 150, 0.08), 28.6 + i * 0.2, 0.4, (i % 2) * 0.6 - 0.3)
    # 30 pineapple conducts microwaves
    a(whoosh(0.5, 300, 5000, 0.7), 29.7, 0.45)
    for i, f in enumerate((880, 988, 1108, 1318, 1108, 1318, 1760)):
        a(microwave_beep(f), 30.4 + i * 0.18, 0.35, (i - 3) / 4)
    a(ding(1760, 0.8), 31.7, 0.3)
    # 32 into the crown: forest, deer on the phone
    a(whoosh(0.6, 400, 5000, 0.6), 31.75, 0.45)
    for at in (32.5, 32.65):
        a(microwave_beep(1400, 0.07) * 0.8, at, 0.4)
    # 34 moon and mustache
    a(whoosh(0.5, 300, 4000, 0.6), 33.75, 0.4)
    a(whoosh(0.35, 600, 3000, 0.8), 34.45, 0.4, -0.6)
    a(thump(90, 0.25), 34.8, 0.7); a(pop(500, 0.2), 34.8, 0.4)
    # 36 moon sneeze, stars
    a(sneeze(), 35.95, 0.7)
    a(shimmer(1.0), 36.45, 0.6)
    # 38 rain upward, umbrellas fall
    t = t_(1.6)
    rain = hp(rng.standard_normal(len(t)), 3000) * np.minimum(1, t / 0.3) * np.minimum(1, (1.6 - t) / 0.3) * 0.25
    a(rain[::-1], 38.1, 0.7)
    for i, at in enumerate((38.4, 38.8, 39.2)):
        a(whistle_down(0.5, 1800 - i * 200, 600), at, 0.25, (i - 1) * 0.5)
    # 40 umbrella opens: living room
    a(whoosh(0.25, 300, 900, 0.3), 40.25, 0.6); a(thump(80, 0.2), 40.4, 0.6)
    a(whoosh(0.6, 400, 4000, 0.6), 40.9, 0.4)
    # 42 lamp off: silence
    a(click(), 42.0, 0.9)
    # 44 lights on, grandpa, drop
    a(click(), 43.98, 0.9)
    a(thump(42, 0.6), 44.0, 1.0); a(shimmer(1.2), 44.1, 0.5)
    # 46 slow push to the bare foot, padlock appears
    a(whoosh(1.4, 200, 800, 0.5), 46.0, 0.3)
    a(ding(523, 1.2), 46.85, 0.4); a(thump(65, 0.3), 46.85, 0.6)
    # 48-52 padlock trembles and cracks, light leaks
    for i, at in enumerate((48.4, 49.2, 49.9, 50.5, 51.0, 51.4)):
        a(crack(0.3 + i * 0.03, 3500 - i * 300), at, 0.35 + i * 0.08, rng.uniform(-0.4, 0.4))
    t = t_(4.0)
    hum = (np.sin(2 * np.pi * 110 * t) + 0.5 * np.sin(2 * np.pi * 220 * t * (1 + t / 8))) * (t / 4) ** 2 * 0.2
    a(hum, 48.0, 1.0)
    # 52 freeze
    a(freeze(), 52.0, 0.7)
    # 54 sock unravels into thread writing YOUTUBE
    a(whoosh(0.6, 500, 6000, 0.5), 53.9, 0.4)
    for i in range(7):
        a(whoosh(0.18, 2000, 4000, 0.5), 54.5 + i * 0.22, 0.25, (i - 3) / 4)
        a(pop(900 + i * 110, 0.1), 54.62 + i * 0.22, 0.3)
    for k in range(4):  # comment icon on the beat
        a(pop(1200, 0.1), 56.0 + k * 0.5, 0.3)
    a(coo(), 56.4, 0.45, 0.7)
    # 58 thread re-knits into the falling sock: matches frame 0
    a(whoosh(0.8, 3000, 400, 0.4), 58.0, 0.4)
    a(whoosh(1.6, 200, 900, 0.5), 58.4, 0.15)
    return S[:N]

def duck(music, vo, amount=0.45):
    e = np.abs(vo)
    k = int(0.08 * SR)
    e = np.convolve(e, np.ones(k) / k, "same")
    e = e / (e.max() + 1e-9)
    g = 1 - amount * np.clip(e * 4, 0, 1)
    g = lfilter([0.002], [1, -0.998], g) / 1.0
    return music * g[:, None]

def main():
    sr, vo = wavfile.read(ROOT / "assets/audio/vo.wav")
    vo = vo.astype(np.float64)
    m = music()
    m = duck(m, vo)
    m *= 0.5 / np.max(np.abs(m))
    s = sfx()
    s *= 0.6 / np.max(np.abs(s))
    wavfile.write(ROOT / "assets/audio/music.wav", SR, m.astype(np.float32))
    wavfile.write(ROOT / "assets/audio/sfx.wav", SR, s.astype(np.float32))

if __name__ == "__main__":
    main()
