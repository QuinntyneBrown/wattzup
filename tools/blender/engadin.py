"""The Upper Engadin lakes road, from Maloja east to the St. Moritz hillside."""
import math
import random
from worldkit import Painted, lin

PROFILE=((0,1815),(1450,1805),(3140,1802),(5280,1825),(7440,1809),(9420,1820),(12820,1797),(14900,1829),(17100,1793),(19360,1774),(21400,1803),(23910,1826),(24625,1822))
LAKES=((-310,6860,1797),(8800,16250,1790),(18140,25210,1766))


def level(d):
    for (a,z),(b,h) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(h-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]


def bearing(d):
    return .55+.47*math.sin(d/890)+.23*math.sin(d/360)+sum(.46*math.exp(-((d-v)/285)**2) for v in (140,3150,12840,23890))


def lay(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];x,y=0,0;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=bearing(d+bc.STEP/2)
        rows.append(dict(x=x,y=y,z=level(d),d=d,h=bearing(d),k=bearing(d+.5)-bearing(d-.5),g=100*(level(d+.5)-level(d-.5))))
        x+=bc.STEP*math.cos(h);y+=bc.STEP*math.sin(h)
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,0


def banks(d):
    for a,b,z in LAKES:
        if a<=d<=b:
            t=(d-a)/(b-a);w=math.sin(math.pi*t)**.65
            return 14+10*(.5+.5*math.sin(d/237))+8*(.5+.5*math.cos(d/465)),28+630*w,z
    return 60,4,level(d)-2


def road(r,st,length,col,bc):
    b=bc.Builder('Malojastrasse bitumen and markings','terrain');b.colours=[]
    for i in range(len(r.s)-1):
        for lo,hi,tone in [(-7.35,-6.8,0x9d9b92),(-6.8,-6.68,0xffffff),(-6.68,-5.22,0x585a59),(-5.22,-5.08,0xe7b73f),(-5.08,-.075,0x52565a),(-.075,.075,0xe3e4de if i%2==0 else 0x52565a),(.075,5.08,0x52565a),(5.08,5.22,0xe7b73f),(5.22,6.68,0x585a59),(6.68,6.8,0xffffff),(6.8,7.35,0x9d9b92)]:
            pts=[r.at(j,l,.07-.006*abs(l)) for j,l in ((i,hi),(i,lo),(i+1,lo),(i+1,hi))]
            b.faces.append(tuple(b.v(p) for p in pts));b.colours.extend([lin(tone)]*4)
    b.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('Lake shores, pastures and high valley shoulders','terrain');b.colours=[]
    def row(i):
        d=r.s[i]['d'];base=r.s[i]['z'];edge,width,water=banks(d)
        pts=[(-800,base+205),(-330,base+78),(-110,base+27),(-46,base+6),(-19,base+(.19 if 17700<d<21110 else .8)),(-7.25,base-.02),(7.25,base-.02),(edge,water+.34),(edge+2,water),(edge+min(9,width*.2),water),(edge+width,water),(edge+width+5,water+.43),(edge+width+65,water+18),(edge+width+280,water+92+48*math.sin(d/430)+21*math.cos(d/193))]
        return [(*r.at(i,x)[:2],z) for x,z in pts]
    colours=(0x697e55,0x526b46,0x71845a,0x84945c,0x94a561,0x738448,0x8b9b61,0xaba78d,0x629896,0x286b80,0x9a9980,0x697e4d,0x5a704c)
    a=row(0)
    for i in range(1,len(r.s)):
        c=row(i)
        for j,tone in enumerate(colours):
            if j>=11:continue  # The textured far-bank slopes share the physical section in engadin-shore.ts.
            b.faces.append(tuple(b.v(v) for v in (a[j+1],a[j],c[j],c[j+1])));b.colours.extend([lin(tone)]*4)
        a=c
    b.build(col)
    return None,lambda x,y:r.s[r.tree.find((x,y,0))[1]]['z']


def scenery(k):
    r=k.road;art=Painted(k);rng=random.Random(2117)
    def box(d,l,z,w,dep,h,c):art.box(r.pos(d,l,z),(w,dep,h),bearing(d),lin(c))
    def tube(d,l,z,ra,rb,h,c,n=8):art.tube(r.pos(d,l,z),ra,rb,h,lin(c),lin(c),n,lin(c))
    # Farm rails pass close to the rider, with cattle among the open meadow sections.
    for d in range(-40,24660,8):
        if not (d%1850<720 or 6600<d<8100):continue
        l=-11.8
        box(d,l,0,.22,.23,1.24,0x89724c)
        for z in (.43,.94):box(d+4,l,z,8,.13,.12,0x9c8258)
    for d in range(6640,7950,47):
        l=-rng.uniform(17,37);z=.6+(abs(l)-18)*.12
        box(d,l,z+.62,1.66,.68,.87,0x91664c);box(d+.89,l,z+1.12,.6,.53,.55,0x9b7659)
        for dx in (-.59,.54):
            for off in (-.24,.24):box(d+dx,l+off,z,.13,.14,.76,0x765843)
    # The red train keeps this pair of steel rails, sleepers and wire masts beside the road.
    for d in range(17700,21110,4):
        for l in (-15.7,-17.15):box(d+2,l,.43,4.02,.12,.13,0x797d7e)
        box(d,-16.4,.28,.24,2.45,.17,0x655448)
        if (d-17700)%40==0:
            box(d,-18.4,.28,.23,.26,6.3,0x616668);box(d,-17.5,6.13,.17,2.22,.12,0x71767a);box(d+20,-16.5,6.0,40.2,.048,.06,0x585957)
    # White limewashed houses with deep-set openings and sgraffito bands at both villages.
    for centre in (7440,12910,23400):
        for j in range(-6,12):
            d=centre+j*29;side=-1 if j%4 else 1;l=side*(19+j%3*3);h=(9 if centre==23400 else 6.8)+j%3
            if centre==12910 and side>0:continue
            box(d,l,0,15,10,h,0xe0d8bd);art.roof(r.pos(d,l,h),(16),11,3.0,bearing(d),lin(0x646360))
            for f in (1.15,4.2):
                for along in (-5,-1.8,1.8,5):
                    box(d+along,l-side*5.08,f,1.55,.18,1.96,0xb8a98c)
                    box(d+along,l-side*5.21,f+.21,1.08,.13,1.47,0x465251)
            box(d,l-side*5.12,h-.6,14.8,.16,.24,0xa6977b)
    for d,l,lean in ((24295,-67,True),(24380,-75,False)):
        for n in range(9):box(d+n*.13 if lean else d,l,8+n*2.5,5.8,5.5,2.55,0xc8b99a)
        tube(d+1 if lean else d,l,30.5,3.7,.07,8.0,0x73746a,8)
    for d in range(450,24600,550):
        box(d,-8,.02,.42,.32,.85,0xd9d4bb)
    return {'efforts':0}


THEME=dict(lay=lay,road_builder=road,land_builder=land,road_half_width=6.8,terrain={'sea':False},land={'mid':0x78884d},sky=[0xdbebf2,0xabcfe9,0x80b9e3,0x509ada,0x387ac0],haze=0xafc6d3,palette={'asphalt':0x53565a,'sea':0x397886},light=[0xffefd2,2.8],fill=[0xd6e8ee,0x8c9462],sun_azimuth=-.92,sun_altitude=.73)
