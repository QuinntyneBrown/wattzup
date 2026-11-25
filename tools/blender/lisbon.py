"""Alfama's tram alignment, terraced roofs, river and hilltop landmarks."""
import math
import sys
from bondi import beam, words
from iten_landmarks import picture, pictured, site
from worldkit import Painted, lin, smooth


def heading(d):
    return .52*math.sin(d/121)+.28*math.sin(d/62)+.38*math.sin(d/385)


def opening(d):
    return max(smooth(2980,3200,d)*(1-smooth(3510,3700,d)),
               smooth(4320,4570,d)*(1-smooth(4850,5050,d)))


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    x=y=0;z=28;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=bc.STEP*i-bc.LEAD_IN;s=next((s for s in stages if d<s['to']),stages[-1])
        g=.023+(s['level']-mean)*.008 if 0<=d<length else 0
        h=heading(d);rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=100*g))
        z+=bc.STEP*g;x+=bc.STEP*math.cos(heading(d+bc.STEP/2));y+=bc.STEP*math.sin(heading(d+bc.STEP/2))
    return rows,stages,length,mean,.8


def paving(r,st,length,col,theme):
    bc=sys.modules[type(r).__module__];b=bc.Builder('Calcada','terrain');b.colours=[]
    steel=bc.Builder('TramRails','paint');steel.colours=[]
    for i,p in enumerate(r.s[:-1]):
        ribbons=[(-5.3,5.3,0,0xCEC4A4,b),(-5.3,-3.83,.09,0xE6DBC1,b),(3.83,5.3,.09,0xE4D9BE,b)]
        for left in (-1.50,1.50):
            for dx in (-.45,.45):
                mid=left+dx
                ribbons.extend(((mid-.074,mid+.074,.018,0x575752,steel),(mid-.022,mid+.041,.028,0xBEC1B9,steel)))
        for a,c,h,t,out in ribbons:
            out.quad(r.at(i,a,h),r.at(i+1,a,h),r.at(i+1,c,h),r.at(i,c,h));out.colours.extend([lin(t)]*4)
    b.build(col);steel.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('AlfamaHill','terrain');b.colours=[]
    def height(p,off):
        if off<0:return p['z']-.22+smooth(6,218,-off)*21
        return p['z']-.22-max(0,off-8)*(.27+.09*math.sin(p['d']/811))
    last=None
    for i in range(0,len(r.s),3):
        p=r.s[i];row=[]
        for off,t in ((-530,0x9C9971),(-100,0x91916A),(-18,0xB19E79),(-6,0xC0B18D),(6,0xD0BE97),(16,0xB09B77),(50,0xA7A27A),(220,0xA89C83),(540,0x8C8B79)):
            x,y,_=r.at(i,off);row.append(((x,y,height(p,off)),lin(t)))
        if last:
            for a,c,e,f in zip(last,last[1:],row[1:],row):
                b.quad(a[0],f[0],e[0],c[0]);b.colours.extend((a[1],f[1],e[1],c[1]))
        last=row
    b.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));p=r.s[i];off=-(x-p['x'])*math.sin(p['h'])+(y-p['y'])*math.cos(p['h']);return height(p,off)
    return None,sample


def arch(art,at,across,z,width,height,colour):
    # A rounded dark recess on a wall facing the approach, with a shallow spring line.
    r=width/2;spring=z+height-r
    pts=[at(-.04,across-r,z),at(-.04,across+r,z)]
    pts.extend(at(-.04,across+r*math.cos(j*math.pi/12),spring+r*math.sin(j*math.pi/12)) for j in range(13))
    art.face(pts,(colour,)*len(pts))


def churches(k,art):
    for d,off,color,tower_height in ((1076,-17,0xBBAB89,19),(4796,66,0xE2E0CC,28)):
        at,h=site(k,d,off);stone=lin(color);roof=lin(0xA16A4B);dark=lin(0x514F49)
        base=-1 if off<0 else -9
        art.box(at(8,0,base),(16,21,13.8),h,stone);art.roof(at(8,0,base+13.8),16.4,20.2,2.75,h,roof)
        for side in (-8,8):
            art.box(at(2.5,side,base),(6,5.7,tower_height),h,stone)
            art.box(at(2.5,side,base+tower_height-.25),(6.4,6.2,.65),h,lin(0xD9CCB4))
            def face(u,v,z):return at(u-.56,v,z)
            for j in (-.9,.9):arch(art,face,side+j,base+tower_height-4,1.22,2.8,dark)
            if off<0:
                for u in (-.1,1.18,2.46,3.74,5.02):
                    for v in (-2.52,2.52):art.box(at(u,side+v,base+tower_height+.35),(.70,.7,.93),h,stone)
            else:
                art.tube(at(2.5,side,base+tower_height+.36),3.0,.77,3.35,lin(0x75938A),lin(0x889A90),8)
                art.tube(at(2.5,side,base+tower_height+3.65),.21,.10,1.38,stone,stone,7)
        arch(art,at,0,base+.1,4.55,5.18,dark)
        if off<0:
            centre=base+9.8
            for radius,t in ((2.54,0xDFD1AC),(2.17,0x526473)):
                pts=[at(-.075-(2.54-radius)*.15,radius*math.cos(j*math.tau/32),centre+radius*math.sin(j*math.tau/32)) for j in range(32)]
                art.face(pts,(lin(t),)*len(pts))
            for j in range(12):
                a=j*math.tau/12
                beam(art,at(-.18,0,centre),at(-.18,2.13*math.cos(a),centre+2.13*math.sin(a)),.10,.11,stone)
        else:
            for j in (-4.3,0,4.3):art.box(at(-.08,j,base+6.2),(.15,.45,6.2),h,lin(0xC4C1AD))


def castle(k):
    # Two towers flank a rising curtain, plus the higher keep, as seen from the final lane.
    bare=type(k.B['terrain'])('CastleStone','terrain');bare.colours=[];k.B['CastleStone']=bare
    art=Painted(k);art.b=bare
    at,h=site(k,6096,23);wall=lin(0xC6B48E)
    for u,v,L in ((-6,-8,43),(23,2,19),(46,4,29)):
        art.box(at(u,v,-5),(L,3.8,13.4),h,wall)
        for j in range(round(L/2.4)):art.box(at(u-L/2+1+j*2.4,v,8.36),(1.34,3.7,1.42),h,wall)
    for u,v,size,hi in ((-26,-8,7.2,14),(14,-8,8.3,16),(36,4,10,19),(56,5,7.7,15)):
        art.box(at(u,v,-6),(size,size,hi+6),h,wall)
        art.box(at(u,v,hi-.65),(size+.38,size+.38,.7),h,lin(0xCFBD96))
        for j in range(4):
            for side in (-1,1):
                v0=-size/2+.72+j*(size-1.44)/3
                art.box(at(u+v0,v+side*(size/2-.5),hi),(1.08,1.16,1.5),h,wall)
                if j in (1,2):art.box(at(u+side*(size/2-.5),v+v0,hi),(1.08,1.16,1.5),h,wall)
    def gate(u,v,z):return at(-29.7+u,-8+v,z)
    arch(art,gate,0,0,3.15,4.85,lin(0x554F44))


def scenery(k):
    art=Painted(k);background=Painted(k,'peaks');river=Painted(k,'sea')
    walls=pictured(k,'Azulejos');tiles=(0xB96547,0xAE6249,0xCA7951,0xAF6952)
    churches(k,art);castle(k)
    river.face(((-1100,450,0),(9000,450,0),(9000,11000,0),(-1100,11000,0)),tuple(lin(t) for t in (0x5FABB7,0x5FABB7,0x83B6C0,0x86B9C5)))
    for d in range(-60,6660,13):
        yaw=heading(d)
        for side in (-1,1):
            if ((opening(d)>.15 and side>0) or (abs(d-1076)<28 and side<0) or (abs(d-6096)<60 and side>0) or (d//13+side)%12 in (3,4)):continue
            width=k.rng.uniform(9.3,13.7);depth=k.rng.uniform(5.7,8.2);high=k.rng.uniform(6.4,13.3)
            at,h=site(k,d,side*(5.7+depth/2));t=k.rng.randrange(4)
            art.box(at(0,0,-2),(width,depth,high+2),h,lin((0xDBC5AD,0xEBCEAE,0xCBC8AE,0xD9BBA8)[t]))
            art.roof(at(0,0,high),width+.18,depth+.32,1.46,h,lin(tiles[t]))
            y=-side*(depth/2+.045);u=(t%2)*.5;v=(t//2)*.5
            picture(walls,(at(-width/2,y,-.23),at(width/2,y,-.23),at(width/2,y,high),at(-width/2,y,high)),((u+.003,v+.003),(u+.497,v+.003),(u+.497,v+.497),(u+.003,v+.497)))
            if t==1:
                art.box(at(0,y-side*.32,3.75),(width*.67,.70,.17),h,lin(0xCCC0A5))
                for j in range(9):art.box(at(-width*.32+j*width*.08,y-side*.65,3.88),(.038,.041,.82),h,lin(0x485354))
                art.box(at(0,y-side*.65,4.69),(width*.67,.06,.05),h,lin(0x404B4C))
        if d%39==18:
            at,h=site(k,d,0)
            for a in (-1.5,1.5):
                beam(art,at(0,a,5.48),at(19.5,a,5.34),.035,.035,lin(0x4E5453))
            beam(art,at(0,-5.45,6.11),at(0,5.45,6.11),.027,.027,lin(0x505859))
            for a in (-1.5,1.5):beam(art,at(0,a,6.11),at(0,a,5.48),.025,.025,lin(0x505859))
        for a in (-1.5,1.5):
            A=k.road.pos(d,a,5.50);B=k.road.pos(d+13,a,5.50)
            beam(art,A,B,.031,.031,lin(0x505859))
    for d in range(20,6520,51):
        at,h=site(k,d,0)
        if d%153==20:
            for j in range(11):art.box(at(0,-6-j*.43,-.12+j*.175),(2.4,.46,.18),h,lin(0xCEC5AB if j%2 else 0xB9B09C))
        for off in (36,61,97,153,213,294):
            x,y,_=at(0,off);base=k.height_at(x,y);high=k.rng.uniform(5,11);w=k.rng.uniform(10,20);depth=k.rng.uniform(7,12)
            background.box((x,y,base-3),(w,depth,high+3),h,lin(k.rng.choice((0xE4CCA7,0xD9C6B1,0xDDBEAA))))
            background.roof((x,y,base+high),w,depth,k.rng.uniform(1.7,3),h,lin(k.rng.choice(tiles)))
    for d in (120,2178,3360,4705):
        at,h=site(k,d,0)
        for j in range(4):
            u=-4.8+j*3.3;v=-4.75
            art.tube(at(u,v,.12),.085,.085,.74,lin(0x555B51),lin(0x62645A),6)
            art.tube(at(u,v,.84),.60,.60,.074,lin(0xAB9877),lin(0xD7C6A6),12)
            for side in (-1,1):
                art.box(at(u+side*.86,v,.36),(.45,.45,.09),h,lin(0x6B6D53))
                art.box(at(u+side*1.06,v,.45),(.065,.45,.46),h,lin(0x6B6D53))
    for d in (*range(3260,3450,8),*range(4610,4810,8)):
        at,h=site(k,d,6.7)
        art.box(at(0,0,-.17),(8.18,.56,1.1),h,lin(0xE3DDC8))
        art.box(at(0,0,.93),(8.20,.65,.10),h,lin(0x6B8794))
        if 3300<d<3400 and d%16==4:
            for v in (-.9,2.1):art.box(at(0,v,.15),(.20,.20,3.16),h,lin(0xDEDBCC))
            art.box(at(0,.6,3.27),(.22,3.83,.16),h,lin(0xA2A189))
            art.box(at(0,1.82,3.43),(8.25,.16,.14),h,lin(0xA2A189))
    return {'efforts':0}


THEME={'lay':route,'surface_builder':paving,'land_builder':land,'terrain':{'sea':False},'land':{'mid':0xB4A27C},
       'road_half_width':3.83,'sky':[0xDBEBE9,0xBDDEE9,0x91C8E7,0x67A6DA,0x4588C8],'haze':0xC3DBDE,
       'light':[0xFFF0D3,1.72],'fill':[0xC9E0F1,0xB5A285],'sun_altitude':.89,'sun_azimuth':.79}
