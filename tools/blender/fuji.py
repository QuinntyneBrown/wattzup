"""The Fuji Subaru Line from the forest toll booths to the Kawaguchiko fifth station."""
import math
import random
from worldkit import Painted, lin

PROFILE = ((0, 1450), (1050, 1494), (2210, 1556), (3600, 1628), (5360, 1737), (6450, 1810), (7470, 1872), (8820, 1978), (9840, 2052), (11200, 2154), (12410, 2258), (12910, 2301), (13250, 2305))


def elevation(distance):
    for (a, low), (b, high) in zip(PROFILE, PROFILE[1:]):
        if distance <= b:
            return low + (high-low)*max(0,(distance-a)/(b-a))
    return PROFILE[-1][1]


def bearing(distance):
    h = 1.28 + .19*math.sin(distance/520)
    for turn,change,width in ((960,.58,85),(1720,-1.25,52),(2135,1.84,60),(2990,-1.70,68),
                              (3650,1.04,100),(5620,-1.19,85),(6290,.85,84),
                              (7060,1.78,80),(7670,-1.69,85),(8920,-.98,70),
                              (9440,1.40,85),(10560,-.91,88),(11710,.59,125)):
        h += change*(1+math.tanh((distance-turn)/width))/2
    return h


def lay(course, theme, bc):
    stages = bc.stages(course['plan'])
    length = stages[-1]['to']
    rows = []
    x = y = 0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d = i*bc.STEP-bc.LEAD_IN
        h = bearing(d+bc.STEP/2)
        rows.append(dict(x=x,y=y,z=elevation(d),d=d,h=bearing(d),
                         k=bearing(d+.5)-bearing(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x += bc.STEP*math.cos(h)
        y += bc.STEP*math.sin(h)
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,0


def ground(d,l):
    edge=max(0,abs(l)-7.4)
    if d<240 or d>12420:
        return -.12+max(0,edge-42)*.11
    if l>0 and 9240<d<10380:
        return -.12-max(0,l-6.1)*.55
    if l>0:
        return -.12-edge*(.31 if d>6500 else .135)
    return -.12+edge*(.14+.04*math.sin(d/350))+min(edge*.072,2.9)*(.5+.5*math.sin(d/35+l/10))


def strip(batch,r,i,a,b,h0,h1,k0,k1,tone):
    pts=[r.at(i,b,k0),r.at(i,a,h0),r.at(i+1,a,h1),r.at(i+1,b,k1)]
    batch.faces.append(tuple(batch.v(p) for p in pts))
    batch.colours.extend([lin(tone)]*4)


def road(r,st,length,col,bc):
    tar=bc.Builder('Subaru Line bitumen','fuji-tarmac')
    markings=bc.Builder('Japanese road markings','terrain')
    tar.colours=[];markings.colours=[]
    for i in range(len(r.s)-1):
        for a,b,h,k in ((-5.2,0,.006,.095),(0,5.2,.095,.006)):
            strip(tar,r,i,a,b,h,h,k,k,0x555354)
        for left in (-4.98,4.84):
            strip(markings,r,i,left,left+.13,.025,.025,.025,.025,0xe3e2d6)
        if i%3 or 1500<r.s[i]['d']<3900:
            strip(markings,r,i,-.08,.08,.105,.105,.105,.105,0xdaaa50)
    tar.build(col);markings.build(col)


def land(r,col,theme,bc):
    batches=[bc.Builder(name,mat) for name,mat in [('Forest banks','fuji-moss'),('Black lava','fuji-clinker'),('Oxidised scoria','fuji-scoria'),('Station forecourt','fuji-tarmac')]]
    for batch in batches:batch.colours=[]
    lanes=(-140,-80,-42,-22,-12,-7,-5.2,5.2,7,12,22,42,80,140)
    for i in range(len(r.s)-1):
        d=r.s[i]['d'];e=r.s[i+1]['d']
        for a,b in zip(lanes,lanes[1:]):
            if a<0<b:continue
            middle=(a+b)/2
            if (d<220 or 12480<d<13230) and abs(middle)<38:idx=3
            elif d<3850 and abs(middle)>8:idx=0
            elif d>5100 and math.sin(d/530+middle/35)>-.2:idx=2
            else:idx=1
            colour=(0x596b47,0x48423c,0x874b36,0x595954)[idx]
            strip(batches[idx],r,i,a,b,ground(d,a),ground(e,a),ground(d,b),ground(e,b),colour)
    for batch in batches:batch.build(col)
    return None,lambda x,y:r.s[r.tree.find((x,y,0))[1]]['z']


def scenery(k):
    r=k.road;art=Painted(k);rng=random.Random(2121)
    rock=Painted(k,'fuji-clinker')
    def box(d,l,z,w,depth,h,colour):
        art.box(r.pos(d,l,z),(w,depth,h),bearing(d),lin(colour))
    # The toll canopy covers three lanes; the middle lane remains open for the rider.
    d=138
    box(d,0,5.9,6.6,27,.62,0x497d78)
    box(d,0,6.51,6.9,27.5,.18,0x8c9d8c)
    for l in (-11,-4.4,4.4,11):
        box(d,l,-.07,9,1.5,.25,0x9b9a86)
        box(d,l,.17,3.1,1.2,2.3,0xa0b7a9)
        box(d,l,1.37,2.85,1.28,.86,0x496069)
        box(d,l,2.46,.29,.4,3.5,0x8e9e90)
    for d in range(310,12300,6):
        if 7250<d<7970 or 9300<d<10380 or int(d//230)%4==2:
            box(d,6.45,-.13,.2,.17,1.24,0x7e8078)
            box(d,6.43,.76,6.05,.13,.23,0xa1a69c)
    for d in range(4480,12340,11):
        l=rng.choice((-1,1))*rng.uniform(8,48)
        root=r.pos(d,l,ground(d,l)-.20);radius=rng.uniform(.41,1.65)
        rock.tube(root,radius,radius*.57,radius*.73,lin(0x463d38),lin(0x574539),7,lin(0x5b4b43))
    # Mark individual bus bays with short stripes painted on the arrival terrace.
    for d in range(12830,13100,16):
        for l in (-11.8,-17.8):
            box(d,l,-.10,6,.17,.035,0xe4dfcc)
    # Arrival terrace with the lodge's roof and the neighbouring three-storey shop.
    for d,l,w,dep,h in ((12968,-22,34,13,7.9),(13015,-25,39,15,9.8),(13068,-31,32,15,7.1)):
        box(d,l,-.16,w,dep,h,0xaa9c85)
        art.roof(r.pos(d,l,h-.16),w+.9,dep+1,2.6,bearing(d),lin(0x6b5149 if d!=13015 else 0x837c73))
        box(d,l+dep/2+1.1,2.94,w,2.8,.22,0x665a4e)
        for off in range(-int(w/2)+2,int(w/2),5):
            box(d+off,l+dep/2+2,.02,.17,.17,2.93,0x827868)
    # Komitake shrine is set back behind the vermilion torii.
    d=13066;l=19
    for span in (-2.7,2.7):box(d,l+span,.0,.52,.52,5.6,0xbf492e)
    box(d,l,3.9,.55,7.2,.45,0xc85b3e)
    box(d,l,5.4,.78,8.3,.48,0xb84b32)
    box(d,l,5.88,.88,8.8,.2,0x4f453d)
    box(d+13,l,.0,8,8,4.2,0x906d4f)
    art.roof(r.pos(d+13,l,4.2),11,10,3.45,bearing(d),lin(0x66554b))
    return {'efforts':0}


THEME=dict(lay=lay,road_builder=road,land_builder=land,road_half_width=5.2,terrain={'sea':False},
           land={'mid':0x4a5545},sky=[0xc4d9e4,0x9cc9eb,0x74afe0,0x528dc9,0x4277b7],haze=0xbacbd4,
           palette={'asphalt':0x555354,'sea':0x65715e},light=[0xfff1d7,3.3],fill=[0xd3e3f2,0x8b8173],
           sun_azimuth=-.56,sun_altitude=.81)
