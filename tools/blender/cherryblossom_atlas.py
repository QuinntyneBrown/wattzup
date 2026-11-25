"""Bake two original Yoshino silhouettes above two crowd tiles from the Caribana atlas."""
import io
import json
import struct
import math
import random
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2] / 'frontend/projects/ride/public'
SIZE = 512


def tree(seed):
    rng = random.Random(seed)
    im = Image.new('RGBA', (SIZE, SIZE))
    draw = ImageDraw.Draw(im)
    tips = []

    def branch(x, y, angle, length, width, depth):
        end = x + length*math.cos(angle), y + length*math.sin(angle)
        bend = x + length*.52*math.cos(angle+.16), y + length*.52*math.sin(angle+.16)
        bark = rng.choice(['#5d4946','#665253','#735e56','#504248'])
        draw.line([(x,y),bend,end],fill=bark,width=max(1,round(width)),joint='curve')
        draw.line([(x-width*.18,y),bend],fill='#927978',width=max(1,round(width*.18)))
        if depth == 0:
            tips.append(end)
            return
        for direction in (-1,1):
            turn = angle + direction*rng.uniform(.22,.68)
            # Outer growth spreads, then newer shoots reach for the sky.
            turn = turn*.86 - math.pi*.07
            branch(*end,turn,length*rng.uniform(.65,.81),width*.60,depth-1)

    for x,angle in [(248,-2.30),(258,-1.87),(256,-1.35),(259,-.94)]:
        branch(x,506,angle,rng.uniform(88,98),rng.uniform(16,23),7)
    for x,y in sorted(tips,key=lambda v:-v[1]):
        for n in range(36):
            a=rng.random()*math.tau
            r=math.sqrt(rng.random())*rng.uniform(7,13)
            cx,cy=x+r*math.cos(a),y+r*.73*math.sin(a)
            size=rng.uniform(.7,2.8)
            color=rng.choice(['#f6dfdd','#fcece6','#fff4e9','#eecccc','#dfbabc','#d4a7ad','#c9a2aa'])
            draw.ellipse((cx-size,cy-size,cx+size,cy+size),fill=color)
    rect=im.getbbox()
    return im.crop(rect).resize((SIZE-6,SIZE-6),Image.Resampling.LANCZOS)


if __name__ == '__main__':
    atlas = Image.new('RGBA',(SIZE*2,SIZE*2))
    for i in range(2):
        atlas.paste(tree(2097+i),(3+i*SIZE,3))
    glb=(ROOT/'worlds/caribana/caribana-tablet.glb').read_bytes()
    size=struct.unpack_from('<I',glb,12)[0]
    document=json.loads(glb[20:20+size])
    image=next(im for im in document['images'] if im['name']=='parade-atlas')
    view=document['bufferViews'][image['bufferView']]
    start=28+size+view.get('byteOffset',0)
    original=Image.open(io.BytesIO(glb[start:start+view['byteLength']])).convert('RGBA')
    crowd=original.crop((0,1665,1165,2048))
    atlas.paste(crowd.resize((2*SIZE,SIZE),Image.Resampling.LANCZOS),(0,SIZE))
    atlas.save(ROOT/'courses/cherryblossom-shore.webp',quality=88,method=6)
