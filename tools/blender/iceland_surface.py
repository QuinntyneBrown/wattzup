"""Bake seamless black-sand grit and broad moss variation into two linear texture channels."""
from pathlib import Path
import random

from PIL import Image, ImageChops

def texture():
    rng=random.Random(2139)
    size=384
    def octave(cells):
        raw=Image.new('L',(cells,cells))
        raw.putdata([rng.randrange(256) for _ in range(cells*cells)])
        # Tile before bicubic interpolation to keep opposite edges continuous.
        tile=Image.new('L',(cells*3,cells*3))
        for x in range(3):
            for y in range(3):tile.paste(raw,(cells*x,cells*y))
        return tile.resize((size*3,size*3),Image.Resampling.BICUBIC).crop((size,size,2*size,2*size))
    grit=Image.blend(octave(32),octave(size),.66)
    lichen=Image.blend(octave(7),octave(29),.31)
    relief=ImageChops.subtract(grit,ImageChops.offset(grit,1,1),1,128)
    return Image.merge('RGB',(grit,lichen,relief))

if __name__=='__main__':
    texture().save(Path(__file__).resolve().parents[2]/'frontend/projects/ride/public/courses/iceland-basalt-grain.webp',quality=89,method=6)
