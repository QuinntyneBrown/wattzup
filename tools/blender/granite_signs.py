"""Paint the col bornes from the baked road altitude and grade."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

assets=Path(__file__).resolve().parents[2]/'frontend/projects/ride/public/courses'
course=json.loads((assets/'granite.course.json').read_text())
canvas=Image.new('RGBA',(1024,2048))
def height(m):
    pos=course['startIndex']+m/course['step'];j=int(pos);t=pos-j;z=course['points'][1::3]
    return z[j]+t*(z[j+1]-z[j])
def font(n):
    for candidate in ('DejaVuSans-Bold.ttf','/System/Library/Fonts/Supplemental/Arial Bold.ttf'):
        try:return ImageFont.truetype(candidate,n)
        except OSError:pass
    return ImageFont.load_default(size=n)
for i in range(21):
    board=Image.new('RGBA',(256,256))
    p=ImageDraw.Draw(board)
    if i<=16:
        p.rounded_rectangle((1,2,254,254),radius=18,fill='#e8e2cd',outline='#7b766a',width=4)
        p.rounded_rectangle((2,3,253,77),radius=14,fill='#e8b84c')
        m=i*1000;end=min(course['lengthMetres'],m+1000)
        grade=(height(end)-height(m))*100/(end-m)
        for y,txt,size in ((41,'COL DU GRANIT',26),(105,f'km {i}',34),(160,f'{height(m):.0f} m',42),(218,f'{grade:.1f} %',34)):
            p.text((128,y),txt,font=font(size),fill='#302e2d',anchor='mm')
    elif i==17:
        p.rounded_rectangle((0,0,255,255),radius=12,fill='#ece7d6',outline='#434343',width=9)
        for y,txt,size in ((50,'SOMMET',30),(114,'COL DU',54),(167,'GRANIT',54),(218,f'{height(course["lengthMetres"]):.0f} m',37)):
            p.text((128,y),txt,font=font(size),fill='#363635',anchor='mm')
    else:
        p.text((128,128),('ALLEZ !','LÉA','HUGO')[i-18],font=font(52),anchor='mm',fill='#d1cec0',stroke_width=1)
    canvas.alpha_composite(board,(i%4*256,i//4*256))
canvas.save(assets/'granite-col-signs.webp',lossless=True)
