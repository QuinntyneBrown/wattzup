"""Autumn repeats up Montréal's Camillien-Houde, the lake, cross and stone lookout."""
import math
from bondi import beam
from iten_landmarks import picture,pictured,site
from worldkit import Painted,lin,smooth
UV=((0,0),(1,0),(1,1),(0,1))


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    def height(d):
        d=max(0,min(d,length))
        # Repeated efforts up the same mountain, with a descent between visits to the park plateau.
        wave=(1-math.cos(2*math.pi*d/5770))*.5
        stage=sum((s['level']-mean)*max(0,min(d,s['to'])-s['from']) for s in stages)
        return 68+124*wave+40*smooth(22000,24560,d)+stage*.0015
    def heading(d):
        main=-math.radians(40)*math.sin(d/60)*math.cos(d/162+1)
        return main+2.71*(smooth(4390,4520,d)-smooth(4690,4860,d))
    rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d);z=height(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=100*(height(d+bc.STEP)-z)/bc.STEP))
        h=heading(d+bc.STEP*.5);x+=bc.STEP*math.cos(h);y+=bc.STEP*math.sin(h)
    return rows,stages,length,mean,.067


def road(r,st,length,col,bc):
    b=bc.Builder('ParkRoad','terrain');b.colours=[]
    for i,p in enumerate(r.s[:-1]):
        for a,e,z,c in ((-8,8,.012,0x928A72),(-5.65,5.65,.027,0x646668),(-4.13,-4.02,.036,0xF1E9D4),(4.02,4.13,.036,0xF1E9D4),(-.095,.095,.039,0xD8AD49)):
            b.quad(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,e,z),r.at(i,e,z));b.colours.extend([lin(c)]*4)
    b.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('Autumn park','terrain');b.colours=[]
    def pt(j,u):
        p=r.s[j];x,y,z=r.at(j,u);blend=smooth(15,70,abs(u));rise=0 if abs(u)<12 else (abs(u)-12)*(.16 if u<0 else -.23)
        return (x+(p['x']-x)*blend,y+(p['y']+u-y)*blend,z+rise-.16)
    for i in range(0,len(r.s)-3,3):
        offsets=(-450,-105,-40,-12,12,40,105,450)
        for a,e in zip(offsets,offsets[1:]):
            b.quad(pt(i,a),pt(i+3,a),pt(i+3,e),pt(i,e));b.colours.extend([lin(0x8C8A5F if abs(a)>20 else 0x939060)]*4)
    b.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));return r.s[i]['z']-.18
    return None,sample


def scenery(k):
    art=Painted(k);trees=pictured(k,'RoyalWoods');signs=pictured(k,'ParcSigns');skyline=pictured(k,'BelvedereCity')
    k.B['CastorsWater']=type(k.B['terrain'])('CastorsWater','terrain');water=Painted(k,'CastorsWater')
    silver=lin(0xA9ADA9);rock=lin(0x838481);stone=lin(0xC3B9A0);dark=lin(0x44534B);green=lin(0x35644A)
    for d in range(-54,25616,12):
        for side in (-1,1):
            if side>0 and (12920<d<13170 or 24440<d<24750):continue
            if side<0 and 18585<d<18738:continue
            for row in range(2):
                off=side*k.rng.uniform(10+row*13,19+row*21);a,h=site(k,d+k.rng.uniform(-4,4),off)
                r=k.rng.uniform(3.6,6.8);high=k.rng.uniform(8,15);n=k.rng.randrange(3);u=n/3;uv=((u+.002,0),(u+1/3-.002,0),(u+1/3-.002,1),(u+.002,1))
                for angle in (.23,1.80):
                    x=r*math.cos(angle);y=r*math.sin(angle)
                    picture(trees,(a(-x,-y,-.35),a(x,y,-.35),a(x,y,high),a(-x,-y,high)),uv)
        if 4200<d<4785 or 24380<d<24740:
            a,h=site(k,d,6.28);e,_=site(k,d+12,6.28)
            art.box(a(0,0,.02),(.18,.23,1.03),h,silver)
            beam(art,a(0,0,.72),e(0,0,.72),.16,.23,silver)
            if d<4785:
                a,h=site(k,d,-8.55);r=k.rng.uniform(2.2,4);art.tube(a(0,-.5,-.6),r,r*.81,k.rng.uniform(2.1,4.3),rock,lin(0xA0A09A),7,rock)
        if 8000<d<8470:
            a,h=site(k,d,-8.9);e,_=site(k,d+12,-8.9);c=lin(0xC0AB87)
            art.face((a(0,-1.4,.10),e(0,-1.4,.10),e(0,1.4,.10),a(0,1.4,.10)),(c,)*4)
    for d,tile in ((102,0),(4473,1),(8220,2),(13060,3),(18680,0),(24599,2)):
        a,h=site(k,d,-6.52)
        for side in (-.57,.57):art.box(a(0,side,0),(.12,.12,2.48),h,silver)
        u=tile%2*.5;v=(1-tile//2)*.5
        picture(signs,(a(0,1.12,1.55),a(0,-1.12,1.55),a(0,-1.12,2.67),a(0,1.12,2.67)),((u,v),(u+.5,v),(u+.5,v+.5),(u,v+.5)))
    # Stone pavilion and the low modern lake house seen across a curved, fixed waterline.
    a,h=site(k,13077,45);bottom=lin(0x73948A)
    for j in range(56):
        angle=j*math.tau/56;nextangle=(j+1)*math.tau/56
        def shore(t):return a(62*math.cos(t),28*math.sin(t),-.88)
        water.face((a(0,0,-.88),shore(angle),shore(nextangle)),(bottom,)*3)
    a,h=site(k,13116,65);art.box(a(0,0,-1),(22,9,3.8),h,lin(0x577679))
    art.roof(a(0,0,2.8),24,11,1.23,h,lin(0x494F48))
    for j in range(-10,11,2):art.box(a(j,-4.65,-.9),(.18,.21,3.8),h,stone)
    a,h=site(k,18696,-21)
    for x in (-.84,.84):
        for y in (-.62,.62):beam(art,a(x,y,0),a(x,y,19.6),.16,.16,silver)
    for j in range(10):
        for side in (-.62,.62):beam(art,a(-.84,side,2*j),a(.84,side,min(19.6,2*j+2)),.11,.11,silver)
    glow=lin(0xE8D6AA)
    for z in (13.5,15.15):beam(art,a(-5.35,0,z),a(5.35,0,z),.19,.24,glow)
    for j in range(-5,5):beam(art,a(j,0,13.5),a(j+1,0,15.15),.10,.12,silver)
    for d in range(24558,24630,3):
        a,h=site(k,d,10.55);art.box(a(0,0,0),(.49,.59,1.02),h,stone);art.box(a(0,0,1.0),(3.08,.66,.21),h,stone)
    a,h=site(k,24630,-17);art.box(a(0,0,0),(25,10,4.4),h,lin(0xBCAB8D));art.roof(a(0,0,4.4),28,13.2,3.3,h,lin(0x5E655E))
    for j in range(-10,11,2):art.box(a(j,5.2,.3),(1.22,.14,2.8),h,dark)
    a,h=site(k,24665,113)
    picture(skyline,(a(-91,42,-8),a(91,-42,-8),a(91,-42,35),a(-91,42,35)),UV)
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':5.65,'land':{'mid':0x939060},'sky':[0xE7DBBD,0xC7D7D8,0xABCCDE,0x82AFCE,0x6298BE],'haze':0xC5CFBF,'light':[0xFFE0A9,1.96],'fill':[0xD3E2EB,0xA89A79],'sun_radius':13,'sun_altitude':.46,'sun_azimuth':.62}
