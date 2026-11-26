"""London's cable-net arena, built once around the 250 metre measurement line."""
import math
from aguascalientes import THEME as TRACK, LAP, point, pose, track_bike
from arenberg import beam
from iten_landmarks import picture, pictured
from worldkit import Painted, lin

THEME={**TRACK,'sample_step':2,'road_half_width':3.8,'haze':0xD2CCC2,
       'fill':[0xF4F1EA,0xCABCA4],'light':[0xFFF7EC,1.32]}

def scenery(k):
    art=Painted(k);boards=pictured(k,'LeePine');stands=pictured(k,'LeeStands')
    glass=pictured(k,'LeeGlass');staff=pictured(k,'LeeTeam');banners=pictured(k,'LeeBanners')
    cream,coal,cedar,rail,silver,blue=map(lin,(0xECE2C5,0x31353A,0x977455,0x414A51,0xA4A9AA,0x9CBBD2))
    def quad(mesh,pts,uv):
        picture(mesh,pts,uv)
    def strip(d,e,lo,hi,c,lift):
        art.face([point(t,v,lift) for t,v in ((d,lo),(d,hi),(e,hi),(e,lo))],(c,)*4)
    def level(d,v,z):
        x,y,_=point(d,v);return x,y,z
    for d in range(250):
        stations=((d,-.93),(d,7.95),(d+1,7.95),(d+1,-.93))
        quad(boards,[point(t,v) for t,v in stations],[(v/2,t/5) for t,v in stations])
        for lo,hi,c in ((-2.5,-.93,0x76B5D3),(-.13,-.035,0x292B2E),(1.01,1.11,0xB9373B),(3.53,3.63,0x3A6395)):
            strip(d,d+1,lo,hi,lin(c),.019)
        a,b=point(d,-2.5),point(d+1,-2.5)
        art.face((a,b,level(d+1,-4.4,-.5),level(d,-4.4,-.5)),(blue,)*4)
        base=[point(t,7.95,z) for t,z in ((d,0),(d+1,0),(d+1,.85),(d,.85))]
        idx=(d//8)%4;u=(idx+d%8/8)/4;v=u+1/32
        quad(banners,base,((u,0),(v,0),(v,1),(u,1)))
        quad(glass,[point(t,8,z) for t,z in ((d,.86),(d+1,.86),(d+1,1.79),(d,1.79))],((0,0),(1,0),(1,1),(0,1)))
        if d%3==0:
            beam(art,point(d,8,.72),point(d,8,1.87),.06,silver)
            beam(art,point(d,8,1.84),point(d+3,8,1.84),.06,rail)
        for r in range(12):
            inner=9+r*.85
            def seat(t,v,up=0):
                return level(t,v,point(t,8)[2]+.58+r*.53+up)
            a,b=seat(d,inner),seat(d+1,inner)
            art.face((a,b,seat(d+1,inner+.85),seat(d,inner+.85)),(coal,)*4)
            art.face((a,seat(d,inner,-.51),seat(d+1,inner,-.51),b),(rail,)*4)
            if r%2==0 and d%5==0 and d%25!=0:
                # The terrace follows the banking. A wide atlas spans adjacent seats.
                e=d+5;idx=(d//5+r)%3;u=idx/3;v=u+1/3
                quad(stands,[seat(t,inner,z) for t,z in ((d,0),(e,0),(e,1.6),(d,1.6))],((u,0),(v,0),(v,1),(u,1)))
    for d in (0,125):
        strip(d-.35,d+.35,-.9,7.92,cream,.036)
        strip(d-.045,d+.045,-.9,7.92,coal,.045)
    art.box((0,0,-1.3),(151,99,.79),0,blue)
    # Timber soffit and suspension cables form the saddle visible from either straight.
    def roof(x,y):
        return x,y,16.9+6.5*(x/75)**2-2.8*(y/48)**2
    for x in range(-75,75,3):
        for y in range(-48,48,6):
            a,b,c,e=roof(x,y),roof(x+3,y),roof(x+3,y+6),roof(x,y+6)
            col=lin((0xB49A77,0xAD916F,0xAB906F,0xB39876)[(x//3)%4])
            art.face((a,e,c,b),(col,)*4)
    for x in range(-72,73,8):
        for y in range(-48,48,8):
            a=roof(x,y);b=roof(x,y+8)
            beam(art,(a[0],a[1],a[2]-.19),(b[0],b[1],b[2]-.19),.11,silver)
    for y in range(-44,45,8):
        for x in range(-75,75,10):
            a=roof(x,y);b=roof(x+10,y);beam(art,(x,y,a[2]-.32),(x+10,y,b[2]-.32),.10,rail)
            if y in (-28,28,-12,12):
                art.box((x,y,a[2]-.75),(2.4,.65,.35),0,rail)
                art.box((x,y,a[2]-.83),(2.25,.6,.1),0,lin(0xFFFAE2))
    for side in (-1,1):
        for x in range(-74,75,4):
            z=roof(x,48*side)[2]
            art.box((x,48*side,-1),(4,.6,z+1),0,cedar)
            art.box((x,47.63*side,z-3.5),(3.84,.10,2.4),0,lin(0xBDCED3))
        art.box((side*75,0,-.9),(.7,96,24),0,cedar)
        for j,x in enumerate((-20,-7,6,19)):
            y=side*10;art.box((x,y,-.5),(10,4.3,.06),0,lin(0x6F94AD))
            art.box((x,y+side*2,-.44),(10,.13,1),0,cream)
            art.box((x+5,y,-.44),(.12,4,1),0,rail)
            for n in (0,1):track_bike(art,x+n*1.9,y-.4,-.43,lin(0xC74942 if j%2 else 0x3E637E))
            w=1.35;z=-.43;u=(j%4)/4
            quad(staff,[(x-2+dx,y+.4,z+h) for dx,h in ((-w/2,0),(w/2,0),(w/2,2.05),(-w/2,2.05))],((u,0),(u+.25,0),(u+.25,1),(u,1)))
        art.box((side*39+.18*side,-side*18,5),(0.38,13.4,4.82),0,coal)
        for dy in (-5,5):beam(art,(side*39,-side*18+dy,9.8),(side*39,-side*18+dy,roof(side*39,-side*18+dy)[2]),.11,rail)
    return {'efforts':0}
