"""Four laps through the Khao San Songkran street festival."""
import math
from worldkit import Painted,lin,smooth
from arenberg import beam
from iten_landmarks import site,pictured,picture
LAP=2937.5
PROFILE=((0,4),(430,4),(780,5),(1200,4),(1590,3),(2050,4),(2450,5),(LAP,4))

def height(d):
    t=d%LAP
    for (a,z),(b,h) in zip(PROFILE,PROFILE[1:]):
        if t<=b:return z+(h-z)*(t-a)/(b-a)

def heading(d):
    u=d/(LAP/4);n=math.floor(u);f=u-n
    return (n+smooth(.73,.87,f))*math.pi/2+.055*math.sin(math.tau*f)

def route(course,theme,bc):
    n=4000;step=LAP/n;pts=[(0,0)]
    for j in range(n):
        h=heading((j+.5)*step);x,y=pts[-1];pts.append((x+step*math.cos(h),y+step*math.sin(h)))
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;t=d%LAP/step;j=int(t);f=t-j
        x,y=(pts[j][k]*(1-f)+pts[j+1][k]*f for k in (0,1))
        rows.append(dict(d=d,x=x,y=y,z=height(d),h=heading(d),k=math.sin(heading(d+.5)-heading(d-.5)),g=100*(height(d+.5)-height(d-.5))))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def road(r,st,length,col,bc):
    mat=bc.Builder('SongkranRoad','terrain');mat.uvs=[];mat.colours=[]
    kerb=bc.Builder('KhaoSanPaving','terrain');kerb.colours=[]
    for i,p in enumerate(r.s[:-1]):
        if not 0<=p['d']<LAP:continue
        def band(a,b,z,c):
            kerb.quad(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,b,z),r.at(i,b,z));kerb.colours.extend((lin(c),)*4)
        picture(mat,[r.at(i,-4.75),r.at(i+1,-4.75),r.at(i+1,4.75),r.at(i,4.75)],((0,0),(0,1),(1,1),(1,0)))
        for s in (-1,1):
            a,b=sorted((4.75*s,9.3*s));band(a,b,.12,0xB8A68E)
            a,b=sorted((4.67*s,4.82*s));band(a,b,.136,0xA95248 if i%3 else 0xD7D0BB)
    mat.build(col);kerb.build(col)

def land(r,col,theme,bc):
    m=bc.Builder('BangkokGround','terrain');m.colours=[]
    m.quad((-1650,-1650,-1),(2050,-1650,-1),(2050,2050,-1),(-1650,2050,-1));m.colours.extend((lin(0x9D957B),)*4)
    return m.build(col),lambda x,y:r.s[r.tree.find((x,y,0))[1]]['z']-.25

def scenery(k):
    art=Painted(k);shops=pictured(k,'KhaoSanShops');crowd=pictured(k,'FestivalCrowds');carts=pictured(k,'BangkokCarts')
    temple=pictured(k,'ThaiTemple');signs=pictured(k,'KhaoSanSigns')
    plaster,metal,wood,cream,gold,red=map(lin,(0xBBAB8E,0x7F8580,0x735841,0xECE2C5,0xCAA046,0x9A3730))
    awnings=[lin(v) for v in (0x64886B,0xB6784B,0xAB5852,0x7494A2,0xD1B65F)]
    def tile(m,pts,index,cols,rows):
        u=index%cols/cols;v=1-(index//cols+1)/rows
        picture(m,pts,((u+.002,v+.002),(u+1/cols-.002,v+.002),(u+1/cols-.002,v+1/rows-.002),(u+.002,v+1/rows-.002)))
    for i,d in enumerate(range(0,2937,13)):
        for s in (-1,1):
            if s<0 and 2314<d<2400:continue
            w=k.rng.uniform(10.75,12.8);ht=k.rng.uniform(7.1,12.0);dep=k.rng.uniform(7,10)
            at,h=site(k,d,s*(8.8+dep*.5));v=-s*(dep/2+.04)
            art.box(at(0,0,-.5),(w,dep,ht+.45),h,plaster)
            tile(shops,[at(a,v,z) for a,z in ((-w*.5,0),(w*.5,0),(w*.5,ht),(-w*.5,ht))],(i+2*s)%4,2,2)
            for j in (-1,1):
                a=j*(w*.5+.03);tile(shops,[at(a,b,z) for b,z in ((-dep*.5,0),(dep*.5,0),(dep*.5,ht),(-dep*.5,ht))],(i+j)%4,2,2)
            art.box(at(0,v-.16*s,3.0),(w+.25,1.34,.16),h,awnings[(i+s)%5])
            if i%2==0:
                a=w*.35
                art.box(at(a,v-1.0*s,4.95),(.17,2.05,2.31),h,metal)
                for face in (-1,1):
                    tile(signs,[at(a+face*.093,v+s*b,z) for b,z in ((-2.03,5.02),(.01,5.02),(.01,7.19),(-2.03,7.19))],(i+s)%6,3,2)
        if i%2==0:
            at,h=site(k,d,0);last=None
            for j in range(9):
                v=-8+j*2;z=8.4+.0107*v*v
                pos=at(0,v,z)
                if last:beam(art,last,pos,.035,wood)
                if j%2:art.tube(at(0,v,z-.21),.093,.07,.18,cream,gold,7)
                last=pos
    # Most participants line the curb. Keep projection widths and high-density groups out of the riding lane.
    for i,d in enumerate(range(0,2938,3)):
        dense=300<d<625 or 870<d<1000
        if i%3 and not dense:continue
        for s in (-1,1):
            for row in range(2 if dense else 1):
                station=d+k.rng.uniform(-1,1);ofs=s*(k.rng.uniform(4.83,5.6)+row*1.28)
                at,h=site(k,station,ofs);angle=-s*(.65+.28*math.sin(i*1.3));dx=.72*math.cos(angle);dy=.72*math.sin(angle);ht=k.rng.uniform(1.52,2.04)
                tile(crowd,[at(-dx,-dy,.13),at(dx,dy,.13),at(dx,dy,ht+.13),at(-dx,-dy,ht+.13)],(i+row+3*s)%8,4,2)
    for i,d in enumerate((84,217,389,876,942,973,992,1130,1455,2030,2210,2690)):
        s=-1 if i%2 else 1;at,h=site(k,d,s*5.55)
        tile(carts,[at(-1.5,-s*.92,.14),at(1.5,s*.92,.14),at(1.5,s*.92,2.78),at(-1.5,-s*.92,2.78)],i%2,2,1)
    # The temple compound opens onto the avenue. A shallow relief displays its fine gable carving.
    at,h=site(k,2362,-15);art.box(at(7,-7,-.25),(16,8,3.2),h,cream)
    for j in range(3):
        length=26-j*4;width=16-j*3;art.roof(at(7,-7,3.1+j*1.13),length*.7,width*.71,2.9-j*.4,h,red)
        for v in (-1,1):art.box(at(7,-7+v*width*.355,3.04+j*1.13),(length*.7,.21,.27),h,gold)
    for j in range(9):
        def panel(u,v):
            return at(-2+(u-.5)*15,1.0+(u-.5)*20+.65*math.sin(u*math.pi),.12+v*13.4)
        a=j/9;b=(j+1)/9
        picture(temple,(panel(a,0),panel(b,0),panel(b,1),panel(a,1)),((a,0),(b,0),(b,1),(a,1)))
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':4.75,'terrain':{'sea':False},
       'land':{'mid':0xAB987A},'haze':0xD6C9B3,'sky':[0xF4E3C9,0xDFDFCA,0xC7DDE3,0x9ECBDB,0x82B8D5],
       'light':[0xFFE4B6,1.44],'fill':[0xD7E7E9,0xC4B69C],'sun_altitude':.89,'sun_azimuth':-.82}
