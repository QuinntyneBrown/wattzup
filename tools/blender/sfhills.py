"""Russian Hill blocks, Powell–Hyde rails and eight Lombard switchbacks."""
import math
from bisect import bisect_right
from arenberg import beam
from iten_landmarks import picture,pictured
from worldkit import Painted,lin,smooth

PROFILE=((0, 28), (180, 32), (260, 32), (400, 42), (500, 42), (795, 57), (867, 57), (1210, 69), (1260, 69), (1460, 57), (1550, 57), (1830, 42), (1995, 42), (2240, 54), (2300, 54), (2630, 65), (2740, 65), (2860, 102.8), (2930, 102.8), (3290, 79), (3380, 79), (3830, 53), (3910, 53), (4190, 85), (4250, 85), (4610, 54), (4690, 54), (5150, 71), (5220, 71), (5560, 51), (5680, 51), (6090, 70), (6140, 70), (6490, 88), (6540, 88), (6960, 65), (7080, 65), (7480, 53), (7580, 53), (7925, 62), (8010, 62), (8350, 75), (8400, 75), (8780, 45), (8900, 44))
FLATS=(218,457,831,1233,1574,1935,2272,2690,2900,3340,3870,4212,4650,5180,5623,6120,6510,7020,7530,7962,8375)
TURNS=((457,1),(1233,-1),(1935,-1),(2690,1),(3340,1),(4212,-1),(5180,-1),(6120,1),(7530,1),(8375,-1))
CROOKED_START=6536.
CROOKED_END=6970.


def elevation(d):
    if d<=0:return PROFILE[0][1]
    for (a,h),(b,v) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return h+(v-h)*(d-a)/(b-a)
    return PROFILE[-1][1]


def direction(d):
    angle=.14
    for station,sense in TURNS:angle+=sense*math.pi/2*smooth(station-16,station+16,d)
    if CROOKED_START<d<CROOKED_END:
        f=(d-CROOKED_START)/(CROOKED_END-CROOKED_START)
        angle+=math.radians(67)*math.tanh(1.95*math.sin(f*8*math.pi))*min(1,f*28,(1-f)*28)
    return angle


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=-bc.LEAD_IN*math.cos(.14);y=-bc.LEAD_IN*math.sin(.14)
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        if i:
            h=direction(d-bc.STEP/2);x+=bc.STEP*math.cos(h);y+=bc.STEP*math.sin(h)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=direction(d),g=100*(elevation(d+.5)-elevation(d-.5)),k=direction(d+.5)-direction(d-.5)))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1


def road(r,st,length,col,bc):
    def surface(name):
        m=bc.Builder(name,'terrain');m.colours=[];m.uvs=[];return m
    street,concrete,brick=surface('HillAsphalt'),surface('FilbertConcrete'),surface('LombardBrick')
    paint=bc.Builder('CityStreetPaint','terrain');paint.colours=[]
    asphalt=lin(0x484849);grey=lin(0xA3A095);white=lin(0xDFE0D4);yellow=lin(0xCCAF54)
    def strip(m,i,lo,hi,z):
        pts=[r.at(j,v,z) for j,v in ((i,lo),(i+1,lo),(i+1,hi),(i,hi))]
        picture(m,pts,[(r.s[j]['d']/3,v/3) for j,v in ((i,lo),(i+1,lo),(i+1,hi),(i,hi))])
    def band(i,lo,hi,z,c):
        pts=[r.at(j,v,z) for j,v in ((i,lo),(i+1,lo),(i+1,hi),(i,hi))];paint.quad(*pts);paint.colours.extend([c]*4)
    for i in range(len(r.s)-1):
        d=r.s[i]['d'];crooked=CROOKED_START<=d<=CROOKED_END;half=3.55 if crooked else 6.15
        m=brick if crooked else concrete if 2740<=d<=2860 else street
        strip(m,i,-half,half,.1)
        for side in (-1,1):
            a,b=sorted((side*half,side*(half+1.9)));band(i,a,b,.24,grey)
            a,b=sorted((side*half,side*(half+.22)));band(i,a,b,.26,white)
        nearest=min(abs(d-x) for x in FLATS)
        if not crooked and nearest>11:
            band(i,-.14,-.045,.126,yellow);band(i,.045,.14,.126,yellow)
        if not crooked and 10<nearest<=14:
            for j in range(-5,6):band(i,j-.24,j+.24,.129,white)
        if 1040<d<1610:
            for lane in (-2.8,2.8):
                for e in (-.72,.72):band(i,lane+e-.039,lane+e+.039,.136,lin(0xA7A79E))
                band(i,lane-.058,lane+.058,.137,lin(0x262A29))
    for m in (street,concrete,brick,paint):m.build(col)


def land(r,col,theme,bc):
    m=bc.Builder('CityFoundations','terrain');m.colours=[]
    def height(x,y):
        _,j,dist=r.tree.find((x,y,0));return r.s[j]['z']-.25-1.6*smooth(7,35,dist)
    # One continuous ground surface, including between adjacent arms of the crooked street.
    # A ribbon per road arm can throw a strip of uphill ground across the downhill lane.
    samples=r.s;points={}
    for p in samples[::4]:
        ix,iy=math.floor(p['x']/8),math.floor(p['y']/8)
        for xx in range(ix-8,ix+9):
            for yy in range(iy-8,iy+9):points[(xx,yy)]=None
    vertices={}
    for xx,yy in points:
        x,y=xx*8,yy*8
        near=r.tree.find_n((x,y,0),9)
        z=min(samples[i]['z'] for _,i,_ in near)-2.85
        vertices[(xx,yy)]=m.v((x,y,z))
    for xx,yy in points:
        cell=((xx,yy),(xx+1,yy),(xx+1,yy+1),(xx,yy+1))
        if all(c in vertices for c in cell):
            m.faces.append(tuple(vertices[c] for c in cell));m.colours.extend([lin(0x888D78)]*4)
    return m.build(col),height


def scenery(k):
    art=Painted(k);sky=Painted(k,'peaks');rng=k.rng
    homes=pictured(k,'RussianHillBays');beds=pictured(k,'LombardFlowers');signs=pictured(k,'HillStreetSigns')
    bay=pictured(k,'SFBay')
    cream=lin(0xD9CDB4);iron=lin(0x565651);wood=lin(0x7F705E);dark=lin(0x383C3B)
    def tile(m,points,i,cols,rows):
        u=i%cols/cols;v=1-(i//cols+1)/rows
        picture(m,points,((u+.003,v+.003),(u+1/cols-.003,v+.003),(u+1/cols-.003,v+1/rows-.003),(u+.003,v+1/rows-.003)))
    def site(d,side):
        i=k.road.index(d);x,y,z=k.road.at(i,side);yaw=k.s[i]['h'];cs=math.cos(yaw);sn=math.sin(yaw)
        def at(a=0,v=0,up=0):return (x+a*cs-v*sn,y+a*sn+v*cs,z+up)
        return at,yaw
    def house(d,side,w,h,index):
        # The stepped bays project independently of the facade's colour and trim.
        at,yaw=site(d,side);sgn=1 if side>0 else -1;depth=8.0;half=w/2
        if k.road.tree.find((*at()[:2],0))[2] < 7.3+math.hypot(w/2,depth/2):return
        art.box(at(0,0,-5.1),(w,depth,h+5.1),yaw,lin([0xADB59F,0xC49D89,0xA99780,0xA9ACAD][index]))
        art.box(at(0,0,h-.27),(w+.45,depth+.48,.36),yaw,cream)
        v=-sgn*4.08
        tile(homes,[at(a,v,z) for a,z in ((-half,0),(half,0),(half,h),(-half,h))],index,2,2)
        for sidewall in (-1,1):
            a=sidewall*(half+.025)
            tile(homes,[at(a,b,z) for b,z in ((-4,0),(4,0),(4,h),(-4,h))],index,2,2)
        for a in (-w*.18,w*.18):
            art.box(at(a,v,2.3),(w*.12,.85,h-2.6),yaw,cream)
            panel=[at(a+u,v-sgn*.46,up) for u,up in ((-w*.063,2.4),(w*.063,2.4),(w*.063,h-.36),(-w*.063,h-.36))]
            tile(homes,panel,index,2,2)
        art.box(at(w*.29,1.3,h),(.62,.85,1.15),yaw,lin(0x9A7969))
    for i,d in enumerate(range(0,8960,13)):
        near=min(abs(d-f) for f in FLATS)
        if near<19 or 4185<d<4263 or 8320<d<8425:continue
        for sgn in (-1,1):
            if 6520<d<6990 and i%4:continue
            side=sgn*(rng.uniform(13.7,16.3) if not 6520<d<6990 else rng.uniform(21,29))
            house(d,side,rng.uniform(9.1,12.7),rng.uniform(8.7,13.5),(i+sgn+5)%4)
        if i%3==0:
            at,h=site(d,7.35);art.tube(at(),.12,.09,6.9,iron,iron,8)
            beam(art,at(0,0,6.8),at(0,-1.7,7.2),.11,iron)
            art.box(at(0,-1.7,7.0),(.6,.27,.19),h,cream)
            dest,_=site(d+39,7.35)
            for u in (-.43,.43):
                beam(art,at(u,0,6.54),dest(u,0,6.54),.027,dark)
        if i%4==0 and not 2650<d<3000:
            at,h=site(d,-8.9);art.tube(at(),.20,.15,3.6,wood,wood,8)
            for j in range(5):
                leaf=lin([0x688060,0x657D54,0x80945E][j%3])
                art.tube(at(1.1*math.cos(j*1.9),.98*math.sin(j*1.9),2.8+j*.16),1.5,.65,2.3,leaf,leaf,9)
    for n,d in enumerate(FLATS):
        at,yaw=site(d,0);roadcol=lin(0x605F5B)
        for side in (-1,1):art.box(at(0,side*29,-.18),(11,44,.24),yaw,roadcol)
        disc=at(2.3,1.35,.137);art.tube(disc,.39,.39,.012,dark,iron,18)
        for v in (-7.4,7.4):
            art.tube(at(3,v,.12),.065,.065,3.15,iron,iron,6)
            pts=[at(2.96,v+.39*math.cos(.3927+k*math.pi/4),2.25+.39*math.sin(.3927+k*math.pi/4)) for k in range(8)]
            art.face(pts,(lin(0xAB4E3F),)*8)
            tile(signs,[at(2.91,v+b,z) for b,z in ((.84,2.9),(-.84,2.9),(-.84,3.24),(.84,3.24))],0 if abs(d-2820)<180 else 1 if abs(d-6670)<410 else 2,1,4)
    for d in range(2740,2860):
        for sgn in (-1,1):
            at,h=site(d,sgn*7.08);art.box(at(0,0,-.10),(1.05,1.55,.51),h,cream)
    cars=[lin(c) for c in (0x687E84,0x9B6153,0xAAA995,0x7F8988,0x998747)]
    for i,d in enumerate(range(45,8760,49)):
        if 6480<d<7000 or min(abs(d-f) for f in FLATS)<15:continue
        side=1 if i%2 else -1
        a=d+2.0;lo=.5*(elevation(d)-elevation(a));at,yaw=site(d,side*4.8)
        art.box(at(0,0,.33),(3.95,1.62,.62),yaw, cars[i%5])
        art.box(at(-.19,0,.94),(2.04,1.45,.60),yaw,lin(0x6A7979))
        art.box(at(-.19,0,1.53),(2.00,1.48,.14),yaw,cars[i%5])
        for axle in (-1.19,1.21):
            for v in (-.78,.78):
                art.box(at(axle,v,.10+lo*axle),(0.59,.21,.54),yaw+(side*.37 if axle>0 else 0),dark)
    for i,d in enumerate(range(6548,6960,3)):
        for sgn in (-1,1):
            at,h=site(d,sgn*(4.85+1.1*math.sin(i*.7)));w=1.5
            for a in (h+.59,h+2.16):
                x,y,z=at();dx=w*math.cos(a);dy=w*math.sin(a)
                tile(beds,[(x-dx,y-dy,z-.09),(x+dx,y+dy,z-.09),(x+dx,y+dy,z+1.47),(x-dx,y-dy,z+1.47)],0,1,1)
    # Telegraph Hill and the Bay Bridge share a fixed horizon across the city.
    # Streets which continue straight past the two crest turns fall away towards the skyline.
    for crest in (4212,8375):
        at,yaw=site(crest,0);yaw=direction(crest-30)
        ox,oy,oz=at();cs,sn=math.cos(yaw),math.sin(yaw)
        def point(d,v,up):return (ox+cs*d-sn*v,oy+sn*d+cs*v,oz-.15*d+up)
        for a in range(12,325,8):
            art.face((point(a,-6,.05),point(a+8,-6,.05),point(a+8,6,.05),point(a,6,.05)),(lin(0x666663),)*4)
            for v in (-7,7):
                zz=point(a,v,.12);art.box(zz,(8.1,1.7,.12),yaw,cream)
        for a in range(42,311,17):
            for side in (-1,1):
                x,y,z=point(a,side*16,0)
                if k.road.tree.find((x,y,0))[2]<14:continue
                h=9+(a%5)
                art.box((x,y,z-1.6),(13,8,h+1.6),yaw,lin(0xB7B3A3))
                tile(homes,[point(a+u,side*11.95,zv) for u,zv in ((-6.5,0),(6.5,0),(6.5,h),(-6.5,h))],(a+side)%4,2,2)
    p=k.s[k.road.index(4212)];h=direction(4182);fx,fy=math.cos(h),math.sin(h);sx,sy=-fy,fx
    bx=p['x']+fx*440+sx*34;by=p['y']+fy*440+sy*34
    sky.tube((bx,by,6),157,64,90,lin(0x617A63),lin(0x798865),28)
    sky.tube((bx,by,96),7.2,5.3,46,cream,white:=lin(0xE0DCCD),32)
    for j in range(16):
        a=j*math.tau/16;sky.tube((bx+5.65*math.cos(a),by+5.65*math.sin(a),100),.55,.32,41,cream,white,6)
    sky.tube((bx,by,142),6.5,6.8,1.7,cream,white,24)
    for j in range(12):
        a=j*math.tau/12;sky.tube((bx+5.65*math.cos(a),by+5.65*math.sin(a),143),.86,.69,6.2,cream,white,7)
    sky.tube((bx,by,149.2),6.8,6.3,2.1,cream,white,24)
    end=k.s[k.road.index(8375)];efx,efy=math.cos(direction(8345)),math.sin(direction(8345))
    ex,ey=end['x']+efx*1320,end['y']+efy*1320
    picture(bay,[(ex-7400,ey-7300,-6),(ex+7400,ey-7300,-6),(ex+7400,ey+7300,-6),(ex-7400,ey+7300,-6)],((0,0),(1,0),(1,1),(0,1)))
    ix=ex+efy*280;iy=ey-efx*280
    sky.box((ix,iy,-7),(188,72,23),.17,lin(0x94947E));sky.box((ix,iy,16),(97,23,10),.17,lin(0xC6C1A8))
    sky.tube((ix+44,iy,16),2.8,1.9,18,cream,white,12)
    def bridge(u,side,up):return ex+efx*(380+side)-efy*u,ey+efy*(380+side)+efx*u,up
    for q in (-290,290):
        for side in (-8,8):
            sky.box(bridge(q,side,-6),(6,6,108),0,lin(0x74838A))
            for v in (38,64,88):beam(sky,bridge(q,side,v),bridge(q,-side,v+12),1.6,iron)
    beam(sky,bridge(-650,0,29),bridge(650,0,29),8,lin(0x7D8B8D))
    for side in (-8,8):
        for u in range(-580,580,16):
            def rise(v):return 42+53*(abs(v)/290)**2 if abs(v)<290 else 96-.163*(abs(v)-290)
            beam(sky,bridge(u,side,rise(u)),bridge(u+16,side,rise(u+16)),1.25,iron)
            beam(sky,bridge(u,side,29),bridge(u,side,rise(u)),.55,iron)
    return {'efforts':0}

THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':True},'road_half_width':6.15,
       'land':{'mid':0x9D9E89},'haze':0xB9CBCE,'sky':[0xDDE2DE,0xBDD1DA,0x9ABECF,0x76A6BE,0x5891AD],
       'light':[0xFFDEAB,1.62],'fill':[0xCBDBE7,0xB2AFA3],'sun_altitude':.51,'sun_azimuth':1.12}
