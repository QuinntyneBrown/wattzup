"""Render the original 16-bar Kuipke race march. Pass a destination WAV path."""
from array import array
from functools import lru_cache
from math import exp, sin, tanh, tau
import random
import sys
import wave

RATE = 32000
BEAT = 60 / 126
# Concert B flat major. A dot extends the last note through the next eighth.
MELODY = [
    "70 . 74 77", "79 77 74 .", "75 . 72 69", "70 72 74 .",
    "77 77 79 82", "81 . 77 74", "75 72 69 65", "70 . . .",
    "82 . 79 75", "77 74 70 .", "72 75 79 81", "82 . 81 77",
    "79 75 72 .", "77 . 74 70", "72 69 65 69", "70 . . .",
]
ROOTS = [46, 46, 41, 46, 46, 46, 41, 46, 51, 46, 41, 46, 51, 46, 41, 46]
VOICES = {
    "cornet": (1, .68, .57, .53, .30, .18, .13, .08),
    "horn": (1, .60, .40, .23, .15, .08),
    "tuba": (1, .75, .44, .20, .09),
}


@lru_cache(maxsize=256)
def note(voice, midi, eighths):
    length = int(RATE * BEAT * .5 * eighths * .94)
    frequency = 440 * 2 ** ((midi - 69) / 12)
    samples = array('f')
    for i in range(length):
        t = i / RATE
        phase = tau * frequency * t + .06 * sin(tau * 5 * t)
        attack = min(1, i / (RATE * .027))
        release = min(1, (length - i) / (RATE * .048))
        partials = sum(a * sin(h * phase) * (0.68 + .32 * attack ** h)
                       for h, a in enumerate(VOICES[voice], start=1))
        samples.append(partials * attack * release * (.89 + .11 * exp(-8 * t)))
    return samples


def render(destination):
    size = round(len(MELODY) * 2 * BEAT * RATE)
    mix = array('f', [0]) * size
    def add(eighth, samples, gain):
        start = round(eighth * BEAT * .5 * RATE)
        for i, value in enumerate(samples):
            mix[(start + i) % size] += gain * value

    rng = random.Random(166)
    snare = array('f')
    last = 0
    for i in range(RATE // 8):
        white = rng.uniform(-1, 1)
        snare.append((white - .76 * last) * exp(-40 * i / RATE))
        last = white
    for bar, (phrase, root) in enumerate(zip(MELODY, ROOTS)):
        words = phrase.split()
        for step, pitch in enumerate(words):
            if pitch == '.':
                continue
            duration = 1
            while step + duration < len(words) and words[step + duration] == '.':
                duration += 1
            add(bar * 4 + step, note("cornet", int(pitch), duration), .30)
        for step in (0, 2):
            add(bar * 4 + step, note("tuba", root - 12 + (7 if step else 0), 2), .34)
            add(bar * 4 + step + 1, note("horn", root + 16, 1), .15)
            add(bar * 4 + step + 1, note("horn", root + 7, 1), .12)
        add(bar * 4 + 2, snare, .13)
        if bar % 4 == 3:
            add(bar * 4 + 3.5, snare, .09)
    # Short indoor reflections wrap through the loop boundary.
    pcm = array('h', (round(24000 * tanh(s + .13 * mix[(i - 1450) % size]
                                         + .08 * mix[(i - 2470) % size]))
                      for i, s in enumerate(mix)))
    with wave.open(destination, 'wb') as output:
        output.setparams((1, 2, RATE, 0, 'NONE', ''))
        output.writeframes(pcm.tobytes())


if __name__ == "__main__":
    render(sys.argv[1])
