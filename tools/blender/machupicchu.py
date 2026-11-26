"""Hiram Bingham road from the Urubamba to the citadel saddle."""
import math
from bondi import beam
from iten_landmarks import picture, pictured, site
from worldkit import Painted, lin, smooth


def heading(distance):
    # scene-bend.ts counts clockwise, while Blender counts anticlockwise from +X.
    return -math.radians(60)*math.sin(distance/48)*math.cos(distance/(2.7*48)+1)


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    x=y=0;z=2040;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;s=next((s for s in stages if d<s['to']),stages[-1])
        grade=.033+(s['level']-mean)*.007 if 0<=d<length else 0
        rows.append(dict(d=d,x=x,y=y,z=z,h=heading(d),k=heading(d+.5)-heading(d-.5),g=100*grade))
        turn=heading(d+bc.STEP/2);x+=bc.STEP*math.cos(turn);y+=bc.STEP*math.sin(turn);z+=bc.STEP*grade
    return rows,stages,length,mean,.7


def surface(road,st,length,col,bc):
    b=bc.Builder('HiramRoad','terrain');b.colours=[]
    for i,p in enumerate(road.s[:-1]):
        t=0x807669 if math.sin(p['d']/83)+math.sin(p['d']/41)>.73 else 0xA99173
        for a,c,tint in ((-3.45,-3.02,0x958674),(-3.02,3.02,t),(3.02,3.45,0x958674)):
            b.quad(road.at(i,a),road.at(i+1,a),road.at(i+1,c),road.at(i,c));b.colours.extend([lin(tint)]*4)
    b.build(col)


def water_level(d):
    return 2028+.018*min(max(0,d),2150)


def bank(p,v):
    bridge=smooth(34,60,p['d'])*(1-smooth(110,134,p['d']))
    near=32+13*math.sin(p['d']/176)
    depth=p['z']-.27+max(0,-v-4)*.75
    bottom=water_level(p['d'])-2.5
    gorge=smooth(4,near+4,v)
    channel=gorge+(1-gorge)*bridge
    return depth+(bottom-depth)*channel


def land(r,col,theme,bc):
    b=bc.Builder('VilcanotaForest','terrain');b.colours=[]
    def height(x,y):
        _,i,_=r.tree.find((x,y,0));p=r.s[i]
        across=-(x-p['x'])*math.sin(p['h'])+(y-p['y'])*math.cos(p['h'])
        return bank(p,across)
    previous=None
    for i in range(0,len(r.s),2):
        p=r.s[i];row=[]
        # Far profiles stay parallel to the valley and cannot fold back through a hairpin.
        for v,c in ((-680,0x48614E),(-160,0x38573D),(-38,0x4B6747),(-11,0x756F5B),(-3.4,0x998970),(3.4,0x8D8162),(12,0x4D673F),(35,0x425C3B),(160,0x536D4E),(700,0x597563)):
            x,y,_=r.at(i,v)
            blend=smooth(12,58,abs(v));x+=(p['x']-x)*blend;y+=(p['y']+v-y)*blend
            row.append(((x,y,bank(p,v)),lin(c)))
        if previous:
            for a,c,e,f in zip(previous,previous[1:],row[1:],row):
                b.quad(a[0],f[0],e[0],c[0]);b.colours.extend((a[1],f[1],e[1],c[1]))
        previous=row
    b.build(col)
    return None,height


def peak(art,x,y,z,width,depth,rise,seed):
    rings=[]
    for j,(fraction,radius) in enumerate(((0,1),(.26,.83),(.50,.55),(.69,.42),(.85,.25),(.97,.10),(1,.018))):
        ring=[]
        for n in range(32):
            a=n*math.tau/32
            ripple=1+.18*math.cos(3*a+seed)+.11*math.sin(7*a+seed)+.065*math.cos(11*a+.46*j)
            ring.append((x+width*(math.cos(a)*radius*ripple+.23*fraction),y+depth*math.sin(a)*radius*ripple,z+rise*(fraction+.014*radius*math.sin(5*a+seed))))
        rings.append(ring)
    for j,(bottom,top) in enumerate(zip(rings,rings[1:])):
        for n in range(32):
            m=(n+1)%32
            palette=(0x617D65,0x496850,0x63766B,0x526859,0x769080)
            base=lin(palette[(n//3+j//3+seed)%5]);upper=lin(palette[(n//3+seed+1)%5])
            art.face((bottom[n],bottom[m],top[m],top[n]),(base,base,upper,upper))


def ruins(k,art,d,side):
    at,h=site(k,d,side);grass=lin(0x8A9B5C);stone=lin(0xABAC96)
    # Terraces face downhill toward the rider; buildings occupy the crown.
    ground=Painted(k)
    slope=lin(0x738475);lichen=lin(0x949B79)
    def flank(u,v1,v2,z,direction):
        a,b=at(u,v1,z),at(u,v2,z)
        edge=u+direction*(8+.2*(v1+20))
        c,e=at(edge,v2,z-6.5),at(edge,v1,z-6.2)
        ground.face((a,b,c,e),(grass,grass,lichen,slope))
        low1,low2=at(edge+direction*36,v1+13,-85),at(edge+direction*36,v2+13,-85)
        ground.face((e,c,low2,low1),(slope,lichen,slope,slope))
    terrace_height=1.02
    for j in range(9):
        v=-20+j*3.12;z=-7.6+j*terrace_height;wide=51-j*1.4
        for sign in (-1,1):flank(4+sign*wide/2,v-1.56,v+1.56,z,sign)
        if j==0:
            ground.face((at(4-wide/2,v-1.56,z-1),at(4+wide/2,v-1.56,z-1),at(4+wide/2+5,v-3.2,-12),at(4-wide/2-5,v-3.2,-12)),(slope,slope,lichen,lichen))
        art.box(at(4,v-1.51,z-terrace_height), (wide,.21,terrace_height),h,stone)
        ground.box(at(4,v,z),(wide,3.12,.10),h,grass)
        for n in range(5):
            ground.box(at(-10+.17*j,v-1.55+n*.59,z-.83+n*.21),(1.33,.63,.23),h,stone)
    ground.box(at(4,13,1.38),(48,13,.23),h,grass)
    for sign in (-1,1):flank(4+sign*24,6.50,19.5,1.61,sign)
    ground.face((at(-20,19.5,1.61),at(28,19.5,1.61),at(54,68,-82),at(-50,68,-82)),(grass,grass,slope,slope))
    original=at
    def at(u,v,w=0):return original(u,v+12,w+1.67)
    for u,v,w,l in ((-19,1,6,9),(-8,0,5,7),(5,1,7,10),(18,2,6,8),(25,8,4,5)):
        for side in (-1,1):
            art.box(at(u,v+side*w/2,-.58),(l,.58,3.02),h,stone)
            gable=[at(u+side*l/2,v-w/2,2.42),at(u+side*l/2,v+w/2,2.42),at(u+side*l/2,v,4.57)]
            art.face(gable,(stone,stone,lin(0xBCC0A9)))
        art.box(at(u-l/2,v,-.58),(.6,w,3),h,stone)
        for side in (-1,1):art.box(at(u+l/2,v+side*w*.33,-.58),(.60,w*.34,3),h,stone)


def scenery(k):
    art=Painted(k);far=Painted(k,'peaks');water=Painted(k,'sea')
    for d in range(-70,10890,610):
        x,y,z=k.road.pos(d)
        for side in (-1,1):
            peak(far,x,y+side*(1220+95*math.cos(d/287)),z-380,790,490,610+160*math.cos(d/514+side),d%17)
    x,y,z=k.road.pos(10500)
    # Fix the mountain behind the citadel, perpendicular to its real rider sightline.
    sx,sy,sz=k.road.pos(10370);tx,ty,_=k.road.pos(10428,30)
    norm=math.hypot(tx-sx,ty-sy);fx,fy=(tx-sx)/norm,(ty-sy)/norm
    cx,cy=sx+fx*550,sy+fy*550
    summit=pictured(k,'HuaynaPicchu')
    outline=[]
    for w,up in ((-290,-95),(290,-95),(290,225),(-290,225)):
        outline.append((cx+fy*w,cy-fx*w,sz+up))
    picture(summit,outline,((0,0),(1,0),(1,1),(0,1)))
    last=None
    for d in range(-75,11070,12):
        x,y,_=k.road.pos(d);margin=34+13*math.sin(d/176)-96*smooth(34,60,d)*(1-smooth(110,134,d));row=[]
        for offset,t in ((0,0x98816A),(3,0xA48B70),(12,0x8F745E),(30,0x947A63),(45,0xA58C70)):
            row.append(((x,y+margin+offset,water_level(d)),lin(t)))
        if last:
            for a,b,c,e in zip(last,last[1:],row[1:],row):water.face((a[0],e[0],c[0],b[0]),(a[1],e[1],c[1],b[1]))
        last=row
        if d%36==9 and d<2800:
            xx,yy,zz=row[2][0];art.tube((xx,yy,zz-.45),2.6,1.35,1.3,lin(0x696858),lin(0x96927C),7,lin(0x938F79))
    for d in range(-35,455,13):
        at,h=site(k,d,-9);w=k.rng.uniform(6.8,10.2);hi=k.rng.uniform(4.5,9.8)
        art.box(at(0,0,0),(w,6.3,hi),h,lin(k.rng.choice((0xBD977B,0xD0AB92,0xB9B6A0,0xA68E7E))))
        art.roof(at(0,0,hi),w+.5,6.8,1.4,h,lin(0x996E59))
        for j in (-2,0,2):art.box(at(j,3.18,hi-2),(.90,.07,1.23),h,lin(0x4B5651))
    for side in (-3.55,3.55):
        for d in range(42,122,6):
            at,h=site(k,d,side);steel=lin(0x66766F)
            beam(art,at(0,0,0),at(0,0,4.8),.17,.18,steel)
            beam(art,at(0,0,4.7),k.road.pos(d+6,side,4.7),.22,.21,steel)
            beam(art,at(0,0,.26),k.road.pos(d+6,side,4.70),.17,.17,steel)
    stone=Painted(k);stone.b=type(k.B['terrain'])('IncaAshlar','terrain');stone.b.colours=[];k.B['IncaAshlar']=stone.b
    for d in (8440,8550,10428,10530):ruins(k,stone,d,28)
    plants=pictured(k,'YungasPlants')
    for d in range(118,10935,5):
        for j in range(3):
            if (8150<d<8730 or d>10170) and (d+j)%2:
                if j or d%5:continue
            side=(-1,1)[(d+j)%2]
            off=side*k.rng.uniform(4.1+j*2,8+j*5)
            x,y,_=k.road.pos(d+k.rng.uniform(-2,2),off);z=k.height_at(x,y)-.12
            variety=k.rng.choice((0,0,1,1,2,3)) if j else k.rng.choice((1,2,3,3))
            high=k.rng.uniform(6,13) if variety==0 else k.rng.uniform(3.6,6.9) if variety==1 else k.rng.uniform(.7,1.65)
            width=high*(.78 if variety<2 else 1.12)
            u=(variety%2)*.5;v=(1-variety//2)*.5;yaw=k.rng.random()*math.pi
            for turn in (yaw,yaw+math.pi/2):
                dx=width*.5*math.cos(turn);dy=width*.5*math.sin(turn)
                picture(plants,((x-dx,y-dy,z),(x+dx,y+dy,z),(x+dx,y+dy,z+high),(x-dx,y-dy,z+high)),((u+.002,v+.002),(u+.498,v+.002),(u+.498,v+.498),(u+.002,v+.498)))
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':surface,'terrain':{'sea':False},
       'land':{'mid':0x536C4E},'road_half_width':3.15,'sky':[0xD5DEDC,0xB8CBCB,0x98B6BC,0x88A6B0,0x769AA6],
       'haze':0xC1CCCC,'light':[0xE6E8D9,1.6],'fill':[0xD5E1E1,0x8A947B],'sun_radius':17,'sun_altitude':.89,'sun_azimuth':.47}
