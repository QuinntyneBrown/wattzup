"""Bake two original Yoshino silhouettes above two crowd tiles from the Caribana atlas."""
import io
import json
import struct
import random
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2] / 'frontend/projects/ride/public'
SIZE = 512


def flowering_tree(original, box, seed):
    """Colour individual leaf clusters in the existing cutout; retain bark, shadow and gaps."""
    rng=random.Random(seed)
    tree=original.crop(box)
    tree=tree.crop(tree.getbbox()).resize((SIZE-8,SIZE-8),Image.Resampling.LANCZOS)
    pixels=tree.load()
    for y in range(tree.height):
        for x in range(tree.width):
            r,g,b,a=pixels[x,y]
            if not a:
                continue
            green=g-b
            if green>9 and g>r*.78 and y<tree.height*.84:
                light=min(1,max(0,(g-20)/167))
                noise=rng.uniform(-.06,.06)
                light=min(1,max(0,light+noise))
                deep, bright=(140,89,110),(255,247,235)
                pixels[x,y]=(*[round(v+(w-v)*light**.62) for v,w in zip(deep,bright)],a)
    return tree


if __name__ == '__main__':
    atlas = Image.new('RGBA',(SIZE*2,SIZE*2))
    glb=(ROOT/'worlds/caribana/caribana-tablet.glb').read_bytes()
    size=struct.unpack_from('<I',glb,12)[0]
    document=json.loads(glb[20:20+size])
    image=next(im for im in document['images'] if im['name']=='parade-atlas')
    view=document['bufferViews'][image['bufferView']]
    start=28+size+view.get('byteOffset',0)
    original=Image.open(io.BytesIO(glb[start:start+view['byteLength']])).convert('RGBA')
    for i,box in enumerate([(0,0,1024,990),(1030,0,1900,995)]):
        atlas.paste(flowering_tree(original,box,2097+i),(4+i*SIZE,4))
    crowd=original.crop((0,1665,1165,2048))
    atlas.paste(crowd.resize((2*SIZE,SIZE),Image.Resampling.LANCZOS),(0,SIZE))
    atlas.save(ROOT/'courses/cherryblossom-shore.webp',quality=88,method=6)
