"""Old US 93 descends to the curved crest; the road then follows the reservoir."""
import math
from worldkit import Painted, lin

LENGTH = 13175
CREST = (4700, 5080)
LAKE = 342
RIVER = 172
PROFILE = ((0,478),(650,461),(1650,431),(2310,419),(3440,393),(4310,377),
           (4660,373),(5110,373),(5920,389),(6810,398),(7610,386),(8710,401),
           (9830,391),(10630,401),(11800,405),(13175,416))

def elevation(d):
    for (a,z),(b,h) in zip(PROFILE, PROFILE[1:]):
        if d<=b:
            return z+(h-z)*max(0,d-a)/(b-a)
    return PROFILE[-1][1]

def ease(v):
    v=max(0,min(1,v))
    return v*v*(3-2*v)

def direction(d):
    if d<CREST[0]:
        approach=.38*math.sin(d/224)+.24*math.sin(d/102)
        for centre,sign in ((690,1),(1490,-1),(2380,1),(3230,-1)):
            approach+=1.26*sign*math.exp(-((d-centre)/114)**2)
        # The bypass arch is first seen from the west, looking downstream across its side.
        approach+=.84*math.exp(-((d-4345)/128)**2)
        blend=ease((d-4520)/180)
        return approach*(1-blend)+.69*blend
    if d<=CREST[1]:
        return .69-1.38*(d-CREST[0])/(CREST[1]-CREST[0])
    shore=-.21+.46*math.sin((d-5150)/490)+.25*math.sin((d-5060)/158)
    blend=ease((d-CREST[1])/240)
    return -.69*(1-blend)+shore*blend

points=[(-150.,0.)]
for d in range(-149,LENGTH+401):
    x,y=points[-1];a=direction(d-.5)
    points.append((x+math.cos(a),y+math.sin(a)))

def pos(d,off=0):
    i=max(0,min(len(points)-2,math.floor(d)+150));t=d+150-i
    x,y=points[i];u,v=points[i+1];a=direction(d)
    return x+(u-x)*t-off*math.sin(a), y+(v-y)*t+off*math.cos(a)

def lay(course,theme,bc):
    stages=bc.stages(course['plan']);rows=[]
    for i in range(math.ceil((LENGTH+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y=pos(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=direction(d),
                         k=direction(d+.5)-direction(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
    return rows,stages,LENGTH,sum(s['level']*(s['to']-s['from']) for s in stages)/LENGTH,0

def road(r,st,length,col,theme,bc):
    paving=bc.Builder('Road','asphalt');yellow=bc.Builder('CentreLine','yellow');white=bc.Builder('EdgeLines','paint')
    for i in range(len(r.s)-1):
        def stripe(batch,lft,rgt,z):
            batch.quad(r.at(i,lft,z),r.at(i,rgt,z),r.at(i+1,rgt,z),r.at(i+1,lft,z))
        stripe(paving,4.65,-4.65,.015)
        for u in (-.13,.13):stripe(yellow,u+.065,u-.065,.028)
        for u in (-4.29,4.29):stripe(white,u+.06,u-.06,.028)
    for b in (paving,yellow,white):b.build(col)

def surface(batch,vertices,tone):
    batch.quad(*vertices);batch.colours.extend([lin(tone)]*4)

def land(r,col,theme,bc):
    rock=bc.Builder('BlackCanyon','terrain');rock.colours=[]
    water=bc.Builder('MeadWater','sea');water.colours=[]
    def side(d,sign):
        z=elevation(d);closeness=1-ease(max(CREST[0]-d,d-CREST[1],0)/240)
        at=lambda width,h:(*pos(d,width*sign),h)
        if CREST[0]<=d<=CREST[1]:
            bottom=RIVER if sign==1 else LAKE
            return [at(4.64,z-.08),at(7,z-.08),at(7.5,z-1),at(8,z-2),
                    at(8.4,z-5),at(10,bottom),at(15,bottom-1),at(25,bottom-3)]
        relief=7*math.sin(d/43)+11*math.sin(d/131)
        if sign==-1 and d>CREST[1]:
            return [at(4.64,z-.09),at(6.5,z-.34),at(10,z-2),at(18,z-7),
                    at(32,361+3*math.sin(d/91)),at(40,354),at(52,LAKE),at(65,LAKE-5)]
        cut=(1 if sign==1 else .54)*max(.12,.55+.45*math.sin(d/241+sign*.7))
        return [at(4.64,z-.08),at(6.4,z-.31),at(10,z+.4),at(17,z+4*cut),
                at(25,z+16*cut),at(44,z+(37+relief)*cut-60*closeness),
                at(108,z+61*cut+relief-160*closeness),at(230,z+78*cut+1.7*relief-225*closeness)]
    for sign in (-1,1):
        previous=None
        for d in range(-88,LENGTH+205,8):
            row=side(d,sign)
            if previous:
                for i,tone in enumerate((0xAA9579,0xAC916E,0x9A7356,0x805943,0x654B42,0x755247,0x785850)):
                    if sign==-1 and d>CREST[1] and i in (5,6):tone=0xDAD1BB
                    surface(rock,(previous[i],row[i],row[i+1],previous[i+1]),tone)
            previous=row
    previous=None
    for d in range(4650,LENGTH+210,10):
        x,y=pos(d,-10)
        row=[(x,y,LAKE-.04),(x,y-350,LAKE-.04),(x,y-2100,LAKE-.04)]
        if previous:
            for i in (0,1):surface(water,(previous[i],row[i],row[i+1],previous[i+1]),0x255C71)
        previous=row
    for b in (rock,water):b.build(col)
    return None,lambda x,y:r.s[r.tree.find((x,y,0))[1]]['z']-.15

def scenery(k):
    art=Painted(k)
    for d in range(CREST[0],CREST[1]+1,4):
        a=direction(d);z=elevation(d)
        for off in (-7.2,7.2):
            art.box((*pos(d,off),z-.08),(4.05,.65,1.20),a,lin(0xDECDB0))
            art.box((*pos(d,off),z+1.12),(4.05,.76,.13),a,lin(0xE7DCC3))
    return {'efforts':0}

THEME={'lay':lay,'land_builder':land,'road_builder':road,'land':{'mid':0xA87C60},'terrain':{'sea':False},
       'haze':0xCBD2D8,'sky':[0xCCD8DF,0x90B8D7,0x669DC6,0x4384BA,0x3268A5],
       'light':[0xFFF0CF,1.85],'fill':[0xC3D7E4,0xAA825D],'sun_altitude':.96,'sun_azimuth':2.46,
       'palette':{'asphalt':0x555453,'yellow':0xE2B64E,'paint':0xDFDCCD}}
