"""The Loire à Vélo, vineyard lanes and the Cher gallery."""
import math
import sys
from bondi import words
from iten_landmarks import picture, pictured, site
from loire_chateaux import chambord, chenonceau, clifftop, elevation
from worldkit import Painted, lin, smooth


def heading(d):return .31*math.sin(d/345)+.17*math.cos(d/184)+.21*math.sin(d/882)


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    x=y=0;z=69;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=bc.STEP*i-bc.LEAD_IN;s=next((s for s in stages if d<s['to']),stages[-1])
        g=(s['level']-mean)*.0012 if 0<=d<length else 0
        h=heading(d);rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=100*g))
        z+=bc.STEP*g;x+=bc.STEP*math.cos(heading(d+bc.STEP/2));y+=bc.STEP*math.sin(heading(d+bc.STEP/2))
    return rows,stages,length,mean,.12


def lane(r,st,length,col,theme):
    bc=sys.modules[type(r).__module__];b=bc.Builder('LoireLane','terrain');b.colours=[]
    for i in range(len(r.s)-1):
        for a,c,t in ((-2.58,-2.31,0xA59B7E),(-2.31,2.31,0x74716B),(2.31,2.58,0xB0A788)):
            b.quad(r.at(i,a),r.at(i+1,a),r.at(i+1,c),r.at(i,c))
            for idx,side in ((i,a),(i+1,a),(i+1,c),(i,c)):
                d=r.s[idx]['d'];under=all(abs(d-x)>110 for x in (2191,6639,9003,11682))
                stripe=abs(((d+40+side*1.14+10.5)%21)-10.5)
                factor=1-.32*(1-smooth(.9,4,stripe)) if under else 1
                colour=lin(t);b.colours.append((*[v*factor for v in colour[:3]],1))
    b.build(col)


def shore(d):return 11+4*math.cos(d/440)+6*(smooth(2900,3310,d)-smooth(4700,5100,d))


def land(r,col,theme,bc):
    field=bc.Builder('LoireBanks','terrain');field.colours=[]
    level=min(p['z'] for p in r.s)-1.42
    def height(p,o):
        if o>2.5:return p['z']-.12+(level-.35-p['z']+.12)*smooth(3.2,shore(p['d'])+2,o)
        return p['z']-.14+smooth(6,100,-o)*(3.8+2.9*math.cos(p['d']/706))*(.8+.22*math.sin(o/43))
    prev=None
    for i in range(0,len(r.s),2):
        p=r.s[i];edge=shore(p['d']);row=[]
        for o,t in ((-430,0x73875F),(-115,0x839766),(-37,0x8B9A6D),(-7,0x92A271),(-2.5,0xB0A582),(2.5,0xA9A380),(5.2,0x889867),(edge,0xADA88A),(edge+3,0x9A9B84)):
            x,y,_=r.at(i,o);row.append(((x,y,height(p,o)),lin(t)))
        if prev:
            for a,b,c,e in zip(prev,prev[1:],row[1:],row):field.quad(a[0],e[0],c[0],b[0]);field.colours.extend((a[1],e[1],c[1],b[1]))
        prev=row
    field.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));p=r.s[i];off=-(x-p['x'])*math.sin(p['h'])+(y-p['y'])*math.cos(p['h']);return height(p,off)
    return None,sample


def scenery(k):
    art=Painted(k);river=Painted(k,'sea');level=min(p['z'] for p in k.s)-1.42
    castle=Painted(k);castle.b=type(k.B['terrain'])('LoireMasonry','terrain');castle.b.colours=[];k.B['LoireMasonry']=castle.b
    reflection=Painted(k);reflection.b=type(k.B['terrain'])('LoireReflection','terrain');reflection.b.colours=[];k.B['LoireReflection']=reflection.b
    facades=pictured(k,'LoireGallery');village=pictured(k,'CaveHouses');tree=pictured(k,'LoireTrees')
    chambord(k,castle,facades,river);chenonceau(k,castle,facades,reflection,level)
    clifftop(k,castle,facades,9003,48,False);clifftop(k,castle,facades,11682,54,True)
    previous=None;farland=Painted(k,'peaks')
    for d in range(-90,12460,20):
        width=238+76*math.cos(d/686);edge=shore(d);row=[]
        for off,z,t in ((edge-1,level,0x83B1A2),(edge+8,level,0x73A89E),(width*.51,level,0x528D94),(width,level,0x729D96),(width+5,level+.20,0xD1C59C),(width+23,level+.6,0x93A67E),(width+64,level+3.4,0x729273),(width+375,level+10+8*math.sin(d/371),0x6C8A70)):
            x,y,_=k.road.pos(d,off);row.append(((x,y,z),lin(t)))
        if previous:
            for j,(a,b,c,e) in enumerate(zip(previous,previous[1:],row[1:],row)):
                (river if j<3 else farland).face((a[0],e[0],c[0],b[0]),(a[1],e[1],c[1],b[1]))
        previous=row
    for d in range(160,12200,283):
        ox=k.rng.uniform(47,159);cx,cy,_=k.road.pos(d,ox);long=k.rng.uniform(16,55);short=k.rng.uniform(3,11)
        rim=[(cx+long*math.cos(j*math.tau/12),cy+short*math.sin(j*math.tau/12),level+.09) for j in range(12)]
        farland.face(rim,(lin(0xD5C69D),)*12)
        if d%2:farland.tube((cx,cy,level+.09),short*.70,short*.28,.52,lin(0x858D65),lin(0x91A373),8)
    def plant(d,off,size,aspect,tile):
        x,y,_=k.road.pos(d,off);z=k.height_at(x,y)-.12
        if off>shore(d):z=level+.05
        a=heading(d)+k.rng.uniform(-.42,.42);half=size*aspect*.5;dx=half*math.sin(a);dy=half*math.cos(a)
        u=(tile%2)*.5;v=(1-tile//2)*.5
        picture(tree,((x-dx,y-dy,z),(x+dx,y+dy,z),(x+dx,y+dy,z+size),(x-dx,y-dy,z+size)),((u,v),(u+.5,v),(u+.5,v+.5),(u,v+.5)))
    for index,d in enumerate(range(-40,12400,21)):
        near=any(abs(d-x)<108 for x in (2191,6639,9003,11682))
        if not near:plant(d,k.rng.uniform(-8,-4),k.rng.uniform(9,15),.78,0 if index%3==0 else 1)
        if index%3==1 and not near:plant(d,shore(d)-.91,k.rng.uniform(7,12),1.03,2)
    for a,b in ((3110,4720),(9700,10440)):
        for d in range(a,b,10):
            for j in range(6):plant(d+j*.52,-7-j*4.8,1.30+.12*(j%3),2.5,3)
    for centre in (4434,8900):
        for j in range(13):
            d=centre-67+j*12;at,h=site(k,d,-11.3);w=9.8;depth=6.3;high=4.65+(j%3)*.70
            art.box(at(0,0,-.45),(w,depth,high+.45),h,lin(0xDBCFAF))
            art.roof(at(0,0,high),w+.43,depth+.35,2.0,h,lin(0x66717B))
            elevation(village,at,-w/2,w/2,depth/2+.06,-.25,high+.23,(0,0))
            art.box(at(2.8,0,high+1.3),(.62,.75,1.32),h,lin(0xBCAD95))
    for d in range(4190,4340,12):
        at,h=site(k,d,-11);art.box(at(0,0,-.40),(12.2,4,4.3),h,lin(0xCEC4A5))
        if d%24==14:
            art.box(at(0,2.04,.02),(2.2,.095,2.04),h,lin(0x675E51))
            pts=[at(0,2.10,1.95)]+[at(1.1*math.cos(j*math.pi/10),2.10,1.95+1.03*math.sin(j*math.pi/10)) for j in range(11)]
            art.face(pts,(lin(0x675E51),)*len(pts))
    for d in (105,1020,2115,4342,6560,8938,11588):
        at,h=site(k,d,-3.65);art.box(at(0,0,-.15),(.11,.11,2.33),h,lin(0xAAAFA2))
        art.box(at(0,0,1.42),(.125,1.87,.66),h,lin(0x407858))
        words(art,'LOIRE À VÉLO',at(-.078,0,1.68),(math.sin(h),-math.cos(h),0),(0,0,1),.26,1.62,0xF7F2D8)
    return {'efforts':0}


THEME={'lay':route,'surface_builder':lane,'land_builder':land,'terrain':{'sea':False},'land':{'mid':0x85976E},
       'road_half_width':2.55,'sky':[0xE1E8D7,0xD3E6E3,0xAED3E1,0x91BCD7,0x6B9DC7],'haze':0xCEDBD3,
       'light':[0xFFF2D2,1.58],'fill':[0xD9E5EA,0xB1A890],'sun_radius':15,'sun_altitude':.77,'sun_azimuth':.87}
