"""Yucatán foliage cards, using Caribana's original broadleaf cutouts and an original palm."""
import io
import json
import math
import random
import struct
from pathlib import Path
from PIL import Image,ImageDraw

root=Path(__file__).resolve().parents[2]/'frontend/projects/ride/public'
glb=(root/'worlds/caribana/caribana-tablet.glb').read_bytes()
size=struct.unpack_from('<I',glb,12)[0]
doc=json.loads(glb[20:20+size]);src=next(i for i in doc['images'] if i['name']=='parade-atlas')
view=doc['bufferViews'][src['bufferView']];begin=28+size+view.get('byteOffset',0)
base=Image.open(io.BytesIO(glb[begin:begin+view['byteLength']])).convert('RGBA')
atlas=Image.new('RGBA',(1024,1024))
for i,box in enumerate([(0,0,1024,990),(1030,0,1900,995)]):
    img=base.crop(box);img=img.crop(img.getbbox()).resize((504,504),Image.Resampling.LANCZOS)
    atlas.paste(img,(512*i+4,4))
palm=Image.new('RGBA',(512,512));draw=ImageDraw.Draw(palm);rng=random.Random(2099)
for j in range(185):
    t=j/185
    cx=254+19*math.sin(t*2.1);y=507-330*t;w=9-4*t
    draw.polygon([(cx-w,y),(cx+w,y),(cx+w,y-3),(cx-w,y-3)],fill=rng.choice(['#83795b','#766b50','#988a67']))
for i in range(19):
    a=i*math.tau/19;rad=rng.uniform(122,225);lift=rng.uniform(65,144);droop=rng.uniform(65,119)
    def point(t):
        return (271+math.cos(a)*rad*t,181-math.sin(t*math.pi*.72)*lift+droop*t*t+math.sin(a)*48*t)
    draw.line([point(j/36) for j in range(37)],fill='#78804b',width=3)
    for j in range(3,39):
        t=j/40;x,y=point(t);leaf=(1-t*.6)*rng.uniform(34,62)*math.sin(t*math.pi)**.46
        for side in (-1,1):
            draw.polygon([(x,y),(x+side*leaf*.24,y+leaf*.15),(x+side*leaf*.39+math.cos(a)*13,y+leaf*.86),(x+side*1.3,y+2)],
                         fill=rng.choice(['#59753b','#79954b','#486739','#85934e','#365936']))
atlas.paste(palm,(0,512))
people=base.crop((0,1665,1165,2048)).resize((504,504),Image.Resampling.LANCZOS)
atlas.paste(people,(516,516));atlas.save(root/'courses/chichen-forest.webp',quality=88,method=6)
