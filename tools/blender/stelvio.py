"""The Trafoi ascent, with a continuous road folded through all forty-eight tornanti."""
import math,json
from pathlib import Path
from worldkit import Painted,lin,smooth
from iten_landmarks import site,pictured,picture
from arenberg import beam
PROFILE=[[0, 2127], [800.0, 2177.6789], [1225.0, 2210.9771], [1625.0, 2236.3165], [2025.0, 2270.056], [2250.0, 2291.7344], [2650.0, 2325.4739], [2875.0, 2347.1523], [3275.0, 2380.8917], [4075.0, 2429.1706], [4475.0, 2462.9101], [4700.0, 2484.5885], [5100.0, 2518.328], [5325.0, 2540.0064], [5725.0, 2573.7459], [6525.0, 2622.0248], [6750.0, 2643.7032], [7150.0, 2677.4427], [7375.0, 2699.1211], [7775.0, 2732.8606], [8175.0, 2757.0]]
TURNS=json.loads((Path(__file__).resolve().parent/'courses/stelvio.json').read_text())['tornantiMetres']
def heading(d):
    i=min(range(len(TURNS)),key=lambda j:abs(d-TURNS[j]))
    angle=2.69
    half_arc=angle*(11+(i*7)%9)*.5
    t=max(0,min(1,(d-TURNS[i]+half_arc)/(2*half_arc)))
    return .20+angle*(t if i%2==0 else 1-t)+.025*math.sin(d/28)

def height(d):
    if d<=0:return PROFILE[0][1]
    for (a,z),(b,h) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(h-z)*(d-a)/(b-a)
    return PROFILE[-1][1]

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=height(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(height(d+.5)-height(d-.5))))
        x+=bc.STEP*math.cos(heading(d+.5*bc.STEP));y+=bc.STEP*math.sin(heading(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def road(r,st,length,col,bc):
    path=bc.Builder('TornanteRoad','terrain');path.colours=[];path.uvs=[]
    stripes=bc.Builder('StelvioLines','terrain');stripes.colours=[]
    for i,p in enumerate(r.s[:-1]):
        picture(path,[r.at(i,-3.04),r.at(i+1,-3.04),r.at(i+1,3.04),r.at(i,3.04)],((0,0),(0,1),(1,1),(1,0)))
        for a,b in ((-2.94,-2.83),(2.83,2.94),(-.053,.053)):
            if abs(a)<1 and i%5>1:continue
            stripes.quad(r.at(i,a,.027),r.at(i+1,a,.027),r.at(i+1,b,.027),r.at(i,b,.027));stripes.colours.extend((lin(0xDFDCC6),)*4)
    path.build(col);stripes.build(col)

def land(r,col,theme,bc):
    face=bc.Builder('TrafoiScree','terrain');face.colours=[];face.uvs=[]
    verge=bc.Builder('StelvioShoulder','terrain');verge.colours=[]
    def altitude(x,y):
        _,i,dist=r.tree.find((x,y,0));p=r.s[i]
        relief=math.sin(x/75+y/84)*4+math.sin(y/37+x/29)*1.8
        return p['z']-1.35+smooth(3.3,16,dist)*(.14*(y-p['y'])+relief)
    rows=r.s;cell=9
    xs=range(int(min(s['x'] for s in rows))-230,int(max(s['x'] for s in rows))+240,cell);last=None
    for y in range(int(min(s['y'] for s in rows))-290,int(max(s['y'] for s in rows))+300,cell):
        row=[(x,y,altitude(x,y)) for x in xs]
        if last:
            for j in range(len(row)-1):
                pts=(last[j],last[j+1],row[j+1],row[j]);picture(face,pts,[(x/19,y/19) for x,y,z in pts])
        last=row
    for side in (-1,1):
        last=None
        for i in range(len(rows)):
            line=[]
            for v in (3.02,4.03,6.5):
                x,y,z=r.at(i,v*side);line.append((x,y,z-.09 if v<4.04 else altitude(x,y)+.12))
            if last:
                for j,c in enumerate((0xA3A398,0x8D927D)):
                    verge.quad(last[j],line[j],line[j+1],last[j+1]);verge.colours.extend((lin(c),)*4)
            last=line
    face.build(col);verge.build(col);return None,altitude

def scenery(k):
    art=Painted(k);walls=pictured(k,'TornanteMasonry');trees=pictured(k,'TrafoiLarches');paint=pictured(k,'RiderWriting');signs=pictured(k,'TornantePlaques');peaks=pictured(k,'OrtlerMassif');huts=pictured(k,'PassHuts')
    stone,slate,white,red,metal=map(lin,(0xABA99D,0x686D6D,0xE4E0D3,0xBD4841,0x7A8082))
    def tile(m,pts,n,c,r):
        u=n%c/c;v=1-(n//c+1)/r
        picture(m,pts,((u+.002,v+.002),(u+1/c-.002,v+.002),(u+1/c-.002,v+1/r-.002),(u+.002,v+1/r-.002)))
    # Retaining walls and coping follow the true outer edge of each return traverse.
    for i,p in enumerate(k.s[:-1]):
        d=p['d'];n=min(range(48),key=lambda j:abs(d-TURNS[j]));side=-1 if n%2==0 else 1
        outward=side*3.68;ht=1.16+min(1.75,max(0,1-abs(d-TURNS[n])/65)*1.68)
        low=k.road.at(i,outward,-ht);low2=k.road.at(i+1,outward,-ht)
        upper=k.road.at(i,outward,.64);upper2=k.road.at(i+1,outward,.64)
        for v in (outward,side*3.29):
            a=k.road.at(i,v,-ht);b=k.road.at(i+1,v,-ht);c=k.road.at(i+1,v,.64);e=k.road.at(i,v,.64)
            picture(walls,(a,b,c,e),((d/4.6,0),((d+4)/4.6,0),((d+4)/4.6,(ht+.64)/2.6),(d/4.6,(ht+.64)/2.6)))
        art.face((upper,upper2,k.road.at(i+1,side*3.29,.65),k.road.at(i,side*3.29,.65)),(stone,)*4)
        if i%7==0:
            at,h=site(k,d,outward);art.box(at(0,0,.65),(.16,.16,.71),h,white);art.box(at(0,0,1.17),(.169,.169,.15),h,red)
    for i,d in enumerate(TURNS):
        side=1 if i%2==0 else -1
        at,h=site(k,d-18,side*3.93);art.tube(at(0,0,0),.069,.052,1.85,metal,metal,8)
        tile(signs,[at(-.03,v,z) for v,z in ((-.84,1.24),(.84,1.24),(.84,2.02),(-.84,2.02))],i,6,8)
        tile(signs,[at(.03,v,z) for v,z in ((.84,1.24),(-.84,1.24),(-.84,2.02),(.84,2.02))],i,6,8)
        if i%2==0:
            k0=d-29
            tile(paint,[k.road.pos(k0+a,v,.04) for a,v in ((0,1.5),(0,-1.5),(3.8,-1.5),(3.8,1.5))],i//2%4,4,1)
    for i,d in enumerate((5199,5218,5232)):
        tile(paint,[k.road.pos(d+a,v,.058) for a,v in ((0,1.2),(0,-1.2),(4,-1.2),(4,1.2))],i,4,1)
    for i,d in enumerate(range(-35,2690,13)):
        side=-1 if i%2 else 1;v=(7.5+(i%7)*3.1)*side;at,h=site(k,d,v)
        w=5.3+i%3;ht=13+i%6
        for a in (.49,2.06):
            dx=w*.5*math.cos(a);dy=w*.5*math.sin(a)
            tile(trees,[at(-dx,-dy,-.9),at(dx,dy,-.9),at(dx,dy,ht),at(-dx,-dy,ht)],i%4,4,1)
    for j,d in enumerate(range(5570,7990,7)):
        s=1 if j%21<11 else -1;at,h=site(k,d,s*(4.3+j%4*.34));ht=.65+.42*math.sin(d/35)
        pts=(at(-3.4,0,.12),at(3.4,0,.12),at(4.2,s*2.6,ht),at(-2.8,s*3.9,ht+.21))
        art.face(pts,(lin(0xD4D9D9),white,white,lin(0xC5D2D4)))
    def hut(d,v,w,dep,ht,t):
        at,h=site(k,d,v);art.box(at(0,0,-.38),(w,dep,ht+.39),h,stone);art.roof(at(0,0,ht),w,dep,dep*.31,h,slate)
        for y in (-dep/2-.04,dep/2+.04):
            tile(huts,[at(a,y,z) for a,z in ((-w/2,0),(w/2,0),(w/2,ht),(-w/2,ht))],t,3,1)
        for a in (-w/2-.04,w/2+.04):
            tile(huts,[at(a,b,z) for b,z in ((-dep/2,0),(dep/2,0),(dep/2,ht),(-dep/2,ht))],t,3,1)
    for params in ((8075,12,19,9,11,0),(8111,-8,7,4,3.6,1),(8122,-9,9,4.5,3.8,2),(8153,13,17,8,7,0)):
        hut(*params)
    at,h=site(k,8097,-4.5);art.box(at(0,0,.03),(.13,.13,2.05),h,metal)
    tile(paint,[at(0,v,z) for v,z in ((-1.34,1.3),(1.34,1.3),(1.34,2.18),(-1.34,2.18))],3,4,1)
    # Fixed glaciated massif; the compact 48 traverses remain separate below it.
    cx=k.s[len(k.s)//2]['x'];cy=k.s[len(k.s)//2]['y']
    for j in range(64):
        a=math.tau*j/64;b=math.tau*(j+1)/64;u=j%16/16;v=u+1/16
        if j//16%2:u,v=1-u,1-v
        def rim(angle,z):return cx+4200*math.cos(angle),cy+4200*math.sin(angle),z
        picture(peaks,(rim(a,1620),rim(b,1620),rim(b,4110),rim(a,4110)),((u,0),(v,0),(v,1),(u,1)))
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':3.04,'terrain':{'sea':False},'land':{'mid':0x969A7D},'sky':[0xD7DEDD,0xBCCFDC,0xA3C5DE,0x85B4D5,0x68A0CA],'haze':0xBDCCD1,'light':[0xFFEAD1,1.44],'fill':[0xC8DAEA,0xADA995],'sun_altitude':.66,'sun_azimuth':-.88}
