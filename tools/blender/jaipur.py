"""A sprint down Johari Bazaar, through two walled-city gates."""
import math

from jaipur_palaces import Front, LIME, OCHRE, ROSE, SHADOW, gate, palace
from worldkit import Painted, lin, smooth


def bearing(d):
    return (.16*math.sin(d/290) + .43*(smooth(2760,2900,d)-smooth(2970,3120,d))
            -.28*(smooth(6050,6180,d)-smooth(6320,6480,d)))


def route(course, theme, bc):
    stages=bc.stages(course['plan'])
    length=stages[-1]['to']
    mean=sum(s['level']*(s['to']-s['from']) for s in stages)/length
    stretches=[]
    z=431
    for s in stages:
        grade=.0025*(s['level']-mean)
        stretches.append((s['from'],s['to'],z,grade))
        z+=grade*(s['to']-s['from'])
    rows=[]
    x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        a,b,h,grade=next((p for p in stretches if d<p[1]),stretches[-1])
        rows.append(dict(d=d,x=x,y=y,z=h+grade*(min(b,max(a,d))-a),h=bearing(d),
                         k=bearing(d+.5)-bearing(d-.5),g=100*grade))
        x+=bc.STEP*math.cos(bearing(d+bc.STEP/2))
        y+=bc.STEP*math.sin(bearing(d+bc.STEP/2))
    return rows,stages,length,mean,.25


def surface(road,st,length,col,bc):
    b=bc.Builder('Johari Bazaar','terrain')
    b.colours=[]
    offsets=(-19,-11,-8.2,-7.5,-7.15,-3.8,-1,2.6,5.5,7.15,7.5,8.2,11,19)
    tones=(0xB9A28A,0xB69C83,0xDAAD8E,0x69594C,0x605A57,0x655E5C,0x605B59,
           0x625D5B,0x615B57,0x69594C,0xDAAD8E,0xB69C83,0xB9A28A)
    for i in range(len(road.s)-1):
        for j,(a,e) in enumerate(zip(offsets,offsets[1:])):
            z=.1 if abs((a+e)/2)>7.45 else 0
            b.quad(road.at(i,a,z),road.at(i+1,a,z),road.at(i+1,e,z),road.at(i,e,z))
            b.colours.extend([lin(tones[j])]*4)
    b.build(col)


def shop(front,width,height,rng,detail):
    front.box(0,-4,-.55,width,7,height+.55,OCHRE if rng.random()<.6 else ROSE)
    front.box(0,-1,height-.15,width+.2,5,.28,LIME)
    front.box(0,1,2.96,width,3.2,.32,ROSE)
    for side in (-1,1):
        x=side*width*.27
        front.box(x,2.3,-.1,.46,.66,3.12,OCHRE)
        front.box(x,-.43,.16,width*.40,.25,2.38,SHADOW)
        front.box(x,.42,3.33,width*.42,.09,.13,LIME)
        front.box(x,.3,4,width*.23,.12,1.09,SHADOW)
        if detail:
            front.arch(x,.42,4.65,width*.12,.61,.10,LIME)
            tint=rng.choice((0xBF4D55,0xD49A37,0x508489,0xBB593F,0x659168))
            front.box(x,1.76,2.62,width*.43,2,.14,tint)
            front.box(x,2.7,2.24,width*.43,.16,.41,tint)
            front.box(x,1.5,.12,width*.28,.8,.68,0x90583D)
            for j in range(3):
                front.box(x+(j-1)*.47,1.5,.8,.4,.51,.25,rng.choice((0xDDA740,0xB65243,0x75844A)))
    if detail and rng.random()<.19:
        front.pavilion(0,-1,height+.16,1.06)


def scenery(k):
    art=Painted(k)
    road=k.road
    for side in (-1,1):
        d=-65
        while d<k.length+70:
            w=k.rng.uniform(9,15)
            mid=d+w/2
            near=any(abs(mid-x)<175 for x in (80,1360,2920,4580,6210,8120))
            if not (side==1 and abs(mid-2966)<55):
                front=Front(art,road.pos(mid,side*14.2),bearing(mid)+(math.pi if side==1 else 0))
                shop(front,w-.22,k.rng.uniform(5.6,8.9),k.rng,near)
            d+=w
    for distance,is_chandpole in ((119,False),(8155,True)):
        gate(Front(art,road.pos(distance),bearing(distance)+math.pi/2),is_chandpole)
    palace(Front(art,road.pos(2966,20),bearing(2966)+math.pi+.32))
    colours=(0xB95C91,0xCE9960,0x63A18A,0x728FAA,0xA98985)
    for i in range(1750):
        d=k.rng.uniform(0,k.length)
        side=k.rng.uniform(-6.9,6.9)
        if abs(d-4580)>230 and abs(side)<2.8:continue
        u=k.rng.uniform(.15,1.45)
        v=k.rng.uniform(.18,.71)
        cl=lin(k.rng.choice(colours))
        rim=[]
        for j in range(9):
            a=j*math.tau/9
            r=k.rng.uniform(.6,1.1)
            rim.append(road.pos(d+math.cos(a)*u*r,side+math.sin(a)*v*r,.021))
        art.face(rim,[cl]*len(rim))
    # Fort ramparts follow the successive crests of the Aravalli ridge.
    far=Painted(k,'peaks')
    for j in range(106):
        centre=road.pos(8170,0)
        x=centre[0]+450+j*12
        y=centre[1]+550-j*12
        z=centre[2]+49+22*math.cos(j/20)+11*math.sin(j/6)
        far.box((x,y,z-140),(28,170,140),.76,lin(0xAB9986))
        if 35<j<76:
            far.box((x,y,z-3),(23,5,6 if j%6 else 9),-.78,lin(0xBDA48A))
    return {'efforts':0}


THEME={'lay':route,'road_builder':surface,'terrain':{'rise':2},
       'land':{'low':0xAC9279,'mid':0xB69B83,'high':0xC4A991,'rock':0xA18B79},
       'road_half_width':7.15,'sky':[0xF1C99B,0xEDDAC1,0xC1D4D4,0x91B8D1,0x72A4C5],
       'haze':0xD8BDAB,'light':[0xFFDEAB,1.54],'fill':[0xDFDFDA,0xC78E72],
       'sun_altitude':.51,'sun_azimuth':-.78}
