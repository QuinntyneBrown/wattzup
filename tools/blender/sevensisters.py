"""A coast road beneath the seven chalk brows, returning inland from Belle Tout."""
import math
from arenberg import beam
from iten_landmarks import picture,pictured
from worldkit import Painted,lin,smooth

TURN=6458.0
RADIUS=41.
EAST=TURN-math.pi*RADIUS/2
PROFILE=((0,24),(335,17),(930,8),(1350,16),(1733,25),(1983,66),(2383,35),(2633,71),
         (3033,39),(3283,73),(3683,45),(3933,79),(4333,43),(4583,72),(4983,34),
         (5233,64),(5633,37),(5883,72),(6280,79),(6458,83))


def height(d):
    x=d if d<TURN else 2*TURN-d
    for (a,z),(b,h) in zip(PROFILE,PROFILE[1:]):
        if x<=b:return z+(h-z)*smooth(a,b,x)
    return PROFILE[-1][1]


def baseline(x):
    return (92+.13*x+26*math.sin(x/328)+16*math.sin(x/171)
            -182*math.exp(-((x-105)/250)**2)
            -176*math.exp(-((x-2530)/215)**2)
            -141*math.exp(-((x-5420)/200)**2))


def centre(d):
    if EAST<d<EAST+math.pi*RADIUS:
        a=(d-EAST)/RADIUS
        return EAST+RADIUS*math.sin(a),baseline(EAST)+RADIUS*(1-math.cos(a)),a
    back=d>=EAST+math.pi*RADIUS
    x=2*EAST+math.pi*RADIUS-d if back else d
    dy=(baseline(x+.5)-baseline(x-.5))
    return x,baseline(x)+(2*RADIUS if back else 0),math.atan(dy)+(math.pi if back else 0)


def pos(d,left=0,up=0):
    x,y,h=centre(d);return (x-math.sin(h)*left,y+math.cos(h)*left,height(d)+up)


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];pts=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,h=centre(d);dh=centre(d+.5)[2]-centre(d-.5)[2]
        pts.append(dict(x=x,y=y,h=h,d=d,z=height(d),g=100*(height(d+1)-height(d)),k=math.atan2(math.sin(dh),math.cos(dh))))
    return pts,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1


def lip(x):
    # Alternate the seaward brows with the inland coombes. The haven breaks the ridge.
    ordinary=48+23*math.sin((x-1733)*math.tau/650)+5*math.sin(x/31)+49*math.exp(-((x-950)/315)**2)
    spur=max(math.exp(-((x-anchor)/95)**2) for anchor in (100,2550,5450))
    return baseline(x)-ordinary*(1-spur)-8.4*spur


def river_x(y):
    return 905+105*math.sin(y/51)+36*math.sin(y/26+.52)


def river_level(y):
    return 1.0+6.6*smooth(-65,90,y)+.0025*max(0,y-90)


def land_height(x,y):
    base=height(x);v=y-baseline(x)
    grade=base-.20+smooth(-3,80,abs(v-41)-41)*(2.4*math.sin(x/193+y/52)+.043*v)
    bank=smooth(6,40,abs(x-river_x(y)))
    return river_level(y)-.14+(grade-river_level(y)+.14)*bank if x<1200 else grade


def road(r,st,length,col,bc):
    t=bc.Builder('DownlandRoad','terrain');t.colours=[];t.uvs=[]
    marks=bc.Builder('FlintRoadPaint','terrain');marks.colours=[]
    for i in range(0,math.ceil(length+45),3):
        h=.095
        corners=((i,-3.55),(i+3,-3.55),(i+3,3.55),(i,3.55))
        picture(t,[pos(d,s,h) for d,s in corners],[(d/4,s/4) for d,s in corners])
        for s in (-3.24,0,3.24):
            if s==0 and i%12>1:continue
            pts=[pos(d,v,.127) for d,v in ((i,s-.057),(i+3,s-.057),(i+3,s+.057),(i,s+.057))]
            marks.quad(*pts);marks.colours.extend([lin(0xE5E0C6)]*4)
    t.build(col);marks.build(col)


def land(r,col,theme,bc):
    ground=bc.Builder('DownsTurf','terrain');ground.colours=[]
    cliffs=bc.Builder('ChalkScarps','terrain');cliffs.colours=[];cliffs.uvs=[]
    beach=bc.Builder('FlintShingle','terrain');beach.colours=[];beach.uvs=[]
    def newrow(x):
        y=lip(x);z=land_height(x,y)
        top=[]
        for v in (0,.8,2.8,7,15,25):
            top.append((x,y+v,land_height(x,y+v)-max(0,2.7-v)*.5))
        for frac in (0,.12,.3,.55,.8,1):
            v=y+26+(baseline(x)+82-y-26)*frac;top.append((x,v,land_height(x,v)))
        for v in (125,185,250,340,550,880):
            yy=baseline(x)+v;top.append((x,yy,land_height(x,yy)+smooth(145,450,v)*24*math.sin(x/460+v/224)))
        level=max(1.4,z)
        strata=[]
        for frac in (0,.11,.30,.51,.70,.86,.96,1):
            fluting=2.7*math.sin(x/8.1)+1.4*math.sin(x/3.8+frac*4)
            strata.append((x,y-(1-frac)*6.6+math.sin(frac*math.pi)*fluting,1+frac*(level-2.36)))
        bank=[(x,y-6.7,1.06),(x,y-13.5,.92),(x,y-24.7,0.40),(x,y-33,-.66)]
        return top,strata,bank
    last=None
    for x in range(-660,7300,6):
        cur=newrow(x)
        if last:
            for m,(left,right) in enumerate(zip(last,cur)):
                for j in range(len(left)-1):
                    pp=(left[j],right[j],right[j+1],left[j+1])
                    if m==0:
                        ground.quad(*pp);ground.colours.extend(lin(0x899D52 if j<9 else 0x829A57) for p in pp)
                    elif m==1:
                        picture(cliffs,pp,[(p[0]/22,p[2]/20) for p in pp])
                    else:picture(beach,pp,[(p[0]/3,p[1]/3) for p in pp])
        last=cur
    ground.build(col);cliffs.build(col);beach.build(col)
    return None,land_height


def scenery(k):
    art=Painted(k);rng=k.rng
    ocean=pictured(k,'ChannelWater');stream=pictured(k,'CuckmereRiver');gorse=pictured(k,'DownlandGorse')
    fronts=pictured(k,'CoastguardWhitewash');flint=pictured(k,'SussexFlint');roofs=pictured(k,'FlintRoofs')
    lantern=pictured(k,'BelleToutGlass');signs=pictured(k,'DownsWaymarks')
    white=lin(0xE9E4D3);dark=lin(0x41484C);wood=lin(0x826C4D);chalk=lin(0xD5D0B3)
    def face(m,pts,uv=((0,0),(1,0),(1,1),(0,1))):picture(m,pts,uv)
    def cottage(x,y,w,depth,z,roof_h=2.8):
        h=4.5
        art.box((x,y,z-.58),(w,depth,h+.58),0,white)
        for side in (-1,1):
            yy=y+side*(depth/2+.035)
            face(fronts,[(x+u,yy,z+up) for u,up in ((-w/2,0),(w/2,0),(w/2,h),(-w/2,h))])
            xx=x+side*(w/2+.039)
            face(fronts,[(xx,y+u,z+up) for u,up in ((depth/2,0),(-depth/2,0),(-depth/2,h),(depth/2,h))])
            art.face([(xx,y-depth/2,z+h),(xx,y+depth/2,z+h),(xx,y,z+h+roof_h)],(white,)*3)
            face(roofs,[(x-w*.52,y,z+h+roof_h),(x+w*.52,y,z+h+roof_h),
                        (x+w*.52,y+side*(depth*.5+.35),z+h),(x-w*.52,y+side*(depth*.5+.35),z+h)],
                       ((0,1),(w/3.7,1),(w/3.7,0),(0,0)))
        for i in (-1,1):
            xx=x+i*w*.36
            art.box((xx,y,z+h+roof_h-.55),(.82,.85,1.65),0,lin(0xAD866C))
            art.tube((xx,y,z+h+roof_h+1.08),.23,.19,.49,lin(0x9E6D50),lin(0xC0906C),8)
    # Cliff line and visible Channel continue beyond both ends of the measured road.
    for x in range(-3200,10100,36):
        a=lip(x)-16;b=lip(x+36)-16
        face(ocean,[(x,a,0),(x+36,b,0),(x+36,-5600,0),(x,-5600,0)],
             ((x,a),(x+36,b),(x+36,-5600),(x,-5600)))
    # Fold a chalk portrait onto the successive buttresses across Cuckmere Haven.
    # The mapped top edge also bounds the grass which joins the existing downland.
    brow=pictured(k,'CuckmereScarps')
    skyline=((0.0025, 1.0), (0.0025, 0.9901), (0.0025, 0.9828), (0.0049, 0.9754), (0.0049, 0.9729), (0.0049, 0.9704), (0.0074, 0.9704), (0.0074, 0.9704), (0.0074, 0.9729), (0.0099, 0.9729), (0.0099, 0.9729), (0.0123, 0.9729), (0.0123, 0.9729), (0.0123, 0.9729), (0.0123, 0.9704), (0.0148, 0.9655), (0.0148, 0.9606), (0.0172, 0.9532), (0.0172, 0.9433), (0.0197, 0.9335), (0.0197, 0.9187), (0.0197, 0.9015), (0.0197, 0.8793), (0.0222, 0.8153), (0.0222, 0.7414), (0.0246, 0.7241), (0.0246, 0.7069), (0.0246, 0.6897), (0.0271, 0.67), (0.0271, 0.665), (0.0271, 0.6626), (0.0296, 0.6626), (0.0296, 0.6601), (0.032, 0.6626), (0.032, 0.665), (0.032, 0.6675), (0.0345, 0.6724), (0.0369, 0.6749), (0.0369, 0.6798), (0.0394, 0.6823), (0.0419, 0.6872), (0.0419, 0.6847), (0.0419, 0.6823), (0.0419, 0.6773), (0.0443, 0.6675), (0.0443, 0.6576), (0.0468, 0.6429), (0.0468, 0.6133), (0.0493, 0.5468), (0.0493, 0.532), (0.0493, 0.5123), (0.0517, 0.5074), (0.0542, 0.5049), (0.0542, 0.5025), (0.0542, 0.5074), (0.0567, 0.5099), (0.0567, 0.5123), (0.0591, 0.5148), (0.0616, 0.5197), (0.0616, 0.5197), (0.0616, 0.5148), (0.064, 0.5074), (0.064, 0.4951), (0.0665, 0.4754), (0.0665, 0.4507), (0.069, 0.3941), (0.069, 0.3818), (0.0714, 0.3793), (0.0739, 0.3793), (0.0739, 0.3818), (0.0764, 0.3867), (0.0764, 0.3916), (0.0788, 0.3941), (0.0788, 0.3916), (0.0813, 0.3818), (0.0813, 0.3695), (0.0837, 0.3399), (0.0862, 0.2956), (0.0862, 0.2931), (0.0887, 0.2956), (0.0887, 0.298), (0.0911, 0.303), (0.0911, 0.3054), (0.0936, 0.298), (0.0961, 0.2833), (0.0961, 0.2414), (0.0985, 0.2414), (0.0985, 0.2438), (0.101, 0.2488), (0.1034, 0.2488), (0.1034, 0.2389), (0.1034, 0.2118), (0.1059, 0.1897), (0.1084, 0.1946), (0.1084, 0.1946), (0.1084, 0.1823), (0.0025, 0.0123))
    previous=None
    for idx,(toe,crest) in enumerate(skyline):
        u=idx/(len(skyline)-1)
        x=364+1010*u
        outer=75-221*u+12*math.sin(14*math.pi*u)
        top_z=2+106*(crest-toe)
        row=[]
        for v in (0,.13,.35,.62,.84,1):
            y=outer+v*(8+7*math.sin(u*math.pi*13))+2.2*math.sin(u*61+v*3)*math.sin(v*math.pi)
            row.append(((x,y,1.1+(top_z-1.1)*v),(u,toe+(crest-toe)*v)))
        inland=max(outer+4,lip(x)+2)
        back=(x,inland,land_height(x,inland)-.19)
        if previous:
            prior,prev_back=previous
            for j in range(len(row)-1):
                pts=(prior[j],row[j],row[j+1],prior[j+1]);picture(brow,[p for p,uv in pts],[uv for p,uv in pts])
            art.face((prior[-1][0],row[-1][0],back,prev_back),(lin(0x90A159),)*4)
        previous=row,back
    for j in range(6):
        x=155+j*7.1;y=baseline(155)+5.8+j*.76
        cottage(x,y,7.1,6.8,land_height(x,y)-.13)
    for x in range(145,205,3):
        y=baseline(155)+.7+(x-155)*.11;z=land_height(x,y)
        face(flint,[(x,y,z-.2),(x+3,y+.1,z-.2),(x+3,y+.1,z+.91),(x,y,z+.91)])
        art.box((x+1.5,y,z+.88),(3,.43,.15),0,chalk)
    # Cuckmere's sinuous channel cuts across the coastal floodplain. The lane bridges it.
    last=None
    for j in range(151):
        y=-64+j*3.0;x=river_x(y);z=river_level(y)+.11
        derivative=(river_x(y+1)-river_x(y-1))/2;coef=1/math.hypot(1,derivative)
        row=[(x+off*coef,y-off*derivative*coef,z) for off in (-7.4,7.4)]
        if last:face(stream,[last[0],row[0],row[1],last[1]])
        last=row
    for x in range(760,1090,8):
        if abs(x-river_x(baseline(x)))>17:continue
        for side in (-1,1):
            p=pos(x,side*4.08,-.2);art.box(p,(8.3,.45,.94),centre(x)[2],chalk)
    # Fixed pasture barriers and graded chalk walking tracks reach both the crowns and the lighthouse.
    for d in range(15,12220,5):
        if d%205<24:continue
        off=5.6 if d%740<340 else -6.6;a=pos(d,off);h=centre(d)[2]
        art.box((a[0],a[1],a[2]-.2),(.14,.18,1.33),h,wood)
        for up in (.45,.87):beam(art,pos(d,off,up),pos(d+5,off,up),.042,lin(0x796E52))
        if d%205==25:
            for v in (0,4):art.box(pos(d+v,off,-.25),(.24,.27,1.52),h,wood)
            for up in (.30,.72,1.1):beam(art,pos(d,off,up),pos(d+4,off,up),.14,wood)
            beam(art,pos(d,off,.28),pos(d+4,off,1.13),.13,wood)
    for d in range(0,6350,8):
        x,y,h=centre(d);v=20+7*math.sin(d/73)
        pts=[]
        for q,r in ((d,-.66),(d+8,-.66),(d+8,.66),(d,.66)):
            xx,yy,_=pos(q,-v+r);pts.append((xx,yy,land_height(xx,yy)+.19))
        art.face(pts,(chalk,)*4)
        for j in range(2):
            xx=x+rng.uniform(-3,3);yy=y+rng.choice((-1,1))*rng.uniform(6.8,47)
            if yy<lip(xx)+1 or abs(xx-river_x(yy))<11:continue
            zz=land_height(xx,yy);hh=rng.uniform(.64,1.5);ww=hh*1.25
            for yaw in (h+.68,h+2.25):
                dx,dy=ww*math.cos(yaw),ww*math.sin(yaw)
                face(gorse,[(xx-dx,yy-dy,zz-.15),(xx+dx,yy+dy,zz-.15),(xx+dx,yy+dy,zz+hh),(xx-dx,yy-dy,zz+hh)])
    # Belle Tout's lantern stands over a short round white tower attached to a low keeper's house.
    lx,ly,_=pos(6334,-14);z=land_height(lx,ly)
    cottage(lx+9,ly+1,13,8.3,z-.12,2.3)
    art.tube((lx,ly,z-.31),3.65,3.25,9.6,white,white,32)
    art.tube((lx,ly,z+9.27),3.67,3.67,.55,dark,dark,32)
    for i in range(16):
        a=i*math.tau/16;b=(i+1)*math.tau/16
        def pt(angle,up,r):return (lx+r*math.cos(angle),ly+r*math.sin(angle),z+up)
        face(lantern,[pt(a,9.84,2.72),pt(b,9.84,2.72),pt(b,12.14,2.72),pt(a,12.14,2.72)])
        beam(art,pt(a,9.82,3.41),pt(a,10.83,3.41),.065,dark)
        beam(art,pt(a,10.82,3.41),pt(b,10.82,3.41),.065,dark)
    art.tube((lx,ly,z+12.1),3.02,.34,1.45,dark,lin(0x64706B),24)
    for j,(d,side) in enumerate(((113,-1),(6298,-1),(5420,-1),(9536,1))):
        x,y,h=pos(d,side*4.93);yaw=centre(d)[2];w=1.67
        for v in (-.65,.65):
            art.box((x-v*math.sin(yaw),y+v*math.cos(yaw),h-.12),(.13,.13,1.8),yaw,wood)
        art.box((x,y,h+.9),(.10,w,.81),yaw,wood)
        u=j%2*.5;v=.5-j//2*.5
        face(signs,[(x-.065*math.cos(yaw)-s*math.sin(yaw),y-.065*math.sin(yaw)+s*math.cos(yaw),h+zv) for s,zv in ((w/2,.91),(-w/2,.91),(-w/2,1.7),(w/2,1.7))],((u,v),(u+.5,v),(u+.5,v+.5),(u,v+.5)))
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':True},'road_half_width':3.55,
       'land':{'mid':0x90A565},'haze':0xC8D3CD,'sky':[0xD6E2E3,0xB1D1DB,0x97C1D4,0x77A7C4,0x618DB1],
       'light':[0xFFF0CB,1.60],'fill':[0xCEDFE3,0xA9B194],'sun_altitude':.55,'sun_azimuth':.42}
