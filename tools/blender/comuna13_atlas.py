"""Trees and neighbourhood spectators adapted from the project's original Caribana atlas."""
import io
import json
import struct
from pathlib import Path
from PIL import Image

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
# Keep the visitors' original aspect ratio inside the lower-right tile.
people=base.crop((0,1665,1165,2048))
people.thumbnail((500,500),Image.Resampling.LANCZOS)
atlas.paste(people,(518,1020-people.height))
atlas.save(root/'courses/comuna13-neighbours.webp',quality=88,method=6)
