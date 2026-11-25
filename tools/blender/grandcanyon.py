"""Desert View Drive with fixed tributaries, temples and the eastern rim below the rider."""
import math
from worldkit import Painted,lin
LENGTH=13425
PROFILE=((0,2160),(1050,2194),(2050,2220),(3210,2180),(4480,2198),(5980,2230),
         (7110,2242),(7290,2229),(8580,2208),(10160,2251),(11580,2234),(13425,2240))
POINTS=(2050,4480,7220,10160,13240)
def elevation(d):
    for (a,z),(b,h) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(h-z)*max(0,d-a)/(b-a)
    return PROFILE[-1][1]
def direction(d):
    yaw=.22*math.sin(d/184)+.17*math.sin(d/77)
    for point in POINTS:
        dx=d-point
        if -420<dx<390:yaw+=.72*math.exp(-((dx+59)/157)**2)-.69*math.exp(-((dx-136)/96)**2)
    for point in POINTS:
        dx=d-point
        if -175<dx<160:
            blend=min(1,(dx+175)/112,(160-dx)/110)
            if point==13240:angle=.53-.44*min(1,max(0,(dx-19)/62))
            else:angle=1.09-.97*min(1,max(0,(dx-30)/105))
            weight=max(0,blend);yaw=yaw*(1-weight)+angle*weight
    return yaw
path=[(-150.,0.)]
for d in range(-149,LENGTH+501):
    x,y=path[-1];h=direction(d-.5);path.append((x+math.cos(h),y+math.sin(h)))
def pos(d,off=0):
    j=max(0,min(len(path)-2,math.floor(d)+150));f=d+150-j
    x,y=path[j];a,b=path[j+1];h=direction(d)
    return x+(a-x)*f-off*math.sin(h),y+(b-y)*f+off*math.cos(h)
def lay(course,theme,bc):
    stages=bc.stages(course['plan']);samples=[]
    for i in range(math.ceil((LENGTH+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y=pos(d);h=direction(d)
        samples.append(dict(x=x,y=y,z=elevation(d),h=h,k=(direction(d+1)-direction(d-1))/2,
                            d=d,g=100*(elevation(d+.5)-elevation(d-.5))))
    return samples,stages,LENGTH,sum(s['level']*(s['to']-s['from']) for s in stages)/LENGTH,0

def rim(d):
    near=min(abs(d-point) for point in POINTS)
    if abs(d-7220)<145:
        near_lipan=abs(d-7220)
        return 5.2+.09*max(0,near_lipan-44)+.90*max(0,near_lipan-106)
    return 7.4+min(135,near*.33)*(1+.23*math.sin(d/89))
def land(road,col,theme,bc):
    apron=bc.Builder('Forest floor and Kaibab rim','terrain');apron.colours=[]
    strata=bc.Builder('CanyonStrata','terrain');strata.colours=[];strata.uvs=[]
    far=bc.Builder('FarRim','terrain');far.colours=[];far.uvs=[]
    temple=bc.Builder('GrandviewTemple','terrain');temple.colours=[];temple.uvs=[]
    water=bc.Builder('Colorado River','terrain');water.colours=[]
    bend=bc.Builder('ColoradoBend','terrain');bend.colours=[]
    lipan_x,lipan_y=pos(7220)
    axis=direction(7227)+.255
    target_x=lipan_x+7620*math.cos(axis)
    def width_factor(x):
        # A long oblique meander at the mouth of the tributary can be read in silhouette
        # against its gravel bars from the rim, high above the bedrock.
        plateau=math.exp(-(max(0,lipan_x-x,x-target_x-550)/740)**2)
        return 1+plateau*(5.72+2.18*math.sin((x-target_x)/510))
    palette=(0xDDD0AB,0xBDA27C,0xCAAC88,0xA97151,0xB88062,0xCB9276,0xA86852,0xD8A489,0xB37C67)
    def face(batch,pts,tone,uv=False):
        batch.quad(*pts);batch.colours.extend([lin(tone)]*4)
        if uv:batch.uvs.extend([((x+.38*y)/39,z/34) for x,y,z in pts])
    def shore(d):
        x,y=pos(d,rim(d));return x,y,elevation(d)-.22
    def row(d):
        x,y,z=shore(d)
        ravine=65*math.sin(d/211)+37*math.sin(d/77)+18*math.sin(d/32)
        rings=[]
        for i,(off,depth) in enumerate(((0,0),(2,3),(3,13),(16,15),(24,32),(48,38),(57,76),
              (101,81),(130,108),(165,118),(183,178),(226,184),(260,216),(320,225),
              (362,287),(409,297),(510,388),(553,393),(620,450),(715,470))):
            f=min(1,off/460)
            rings.append((x+.24*off*math.sin(d/275+i*.09),y+(off+f*ravine)*width_factor(x),z-depth+f*11*math.sin(d/144)))
        return rings
    def apronrow(d):
        pts=[]
        for v in (-575,-290,-130,-52,-24,-11,-5,0,5,(rim(d)+5)/2,rim(d)):
            x,y=pos(d,v);base=elevation(d)-.23
            lift=min(1,max(0,(-v-7)/35))
            pts.append((x,y,base+lift*(6+4*math.sin(x*.009)+2.7*math.sin(y*.025))))
        return pts
    a=apronrow(-100);prev=row(-100)
    for d in range(-90,LENGTH+150,10):
        b=apronrow(d)
        for i in range(len(a)-1):
            face(apron,(a[i],b[i],b[i+1],a[i+1]),0xC5B092 if i>7 else 0x9A9277 if i<5 else 0xB7AA8D)
        a=b
        if d%20:continue
        nxt=row(d)
        for i in range(len(prev)-1):
            tone=palette[min(8,i//2)]
            face(strata,(prev[i],nxt[i],nxt[i+1],prev[i+1]),tone,True)
        prev=nxt
    # The opposite rim and the river stay in world coordinates even where the road bends inland.
    def distant(d,j):
        x,y,z=shore(d)
        depth=(1220,1180,1150,1060,1010,910,820,770,680,630,510,460,340,275,150,80,-35,-150)[j]
        off=(735,905,999,1125,1168,1270,1350,1365,1450,1500,1540,1660,1780,1860,1920,2040,2180,2295)[j]
        return (x,y+(off+124*math.sin(d/398)+57*math.sin(d/147))*width_factor(x),z-depth*.66+75*math.sin(d/488)+34*math.sin(d/160)+398*(j/17)**2)
    last=[distant(-95,j) for j in range(18)]
    for d in range(-64,LENGTH+180,32):
        nxt=[distant(d,j) for j in range(18)]
        for j in range(17):
            pts=(last[j],nxt[j],nxt[j+1],last[j+1])
            face(far,pts,0xFFFFFF)
            far.uvs.extend([(d/3250,1-j/17),((d+32)/3250,1-j/17),((d+32)/3250,1-(j+1)/17),(d/3250,1-(j+1)/17)])
        last=nxt
    last=None
    for d in range(-96,LENGTH+150,16):
        x,y,z=shore(d);scale=width_factor(x)
        centre=y+(828+49*math.sin(d/267)+17*math.sin(d/78))*scale
        level=1755.-d*.0007
        # Gravel banks at the same elevation join the single channel to the lower rock benches.
        row=[(x,centre+off,level+up) for off,up in ((-260,4),(-182,1.8),(-136,.3),(-124,0),
              (124,0),(136,.3),(182,2),(260,5))]
        if last:
            for j in range(7):
                pts=(last[j],row[j],row[j+1],last[j+1])
                if j==3:face(bend if abs(x-target_x)<770 else water,pts,0x509F98)
                else:face(strata,pts,0xB6A07B if j in (2,4) else 0xAE8567,True)
        last=row
    # Eroded isolated temples. Their scalloped outlines change at each ledge.
    for d,off,radius,top in ((1730,620,156,-28),(2440,478,116,15),(4620,550,172,49),(4960,910,155,75),
               (7380,580,132,36),(7950,790,213,56),(10190,605,174,69),(11210,810,146,38),(13380,590,165,58)):
        x,y,z=shore(d);y+=off;last=None
        foreground={2440:(2050,595,55),4620:(4480,675,-82),7380:(7220,625,445),10190:(10160,710,44),13380:(13240,610,94)}
        peak=foreground.get(d);batch=temple if d==2440 else strata
        if peak:
            station,forward,across=peak;u,v=pos(station);h=direction(station+9)
            x=u+forward*math.cos(h)-across*math.sin(h);y=v+forward*math.sin(h)+across*math.cos(h)
            z=elevation(station);top=47 if d!=10190 else 56;radius*=.56

        for i,(factor,level) in enumerate(((2.05,-485),(1.73,-379),(1.59,-362),(1.35,-275),(1.31,-260),
                    (1.07,-164),(1.02,-154),(.83,-84),(.80,-74),(.7,-31),(.58,-24),(.51,-4),(.46,0))):
            ring=[]
            for k in range(74):
                a=k*math.tau/74;radial_scale=1+.16*math.sin(3*a+.9*d)+.09*math.sin(7*a+d*.1)
                r=radius*factor*(radial_scale+.047*math.sin(17*a)+.025*math.sin(29*a+.24*i));ring.append((x+1.21*r*math.cos(a),y+.77*r*math.sin(a),z+top+level+6*math.sin(3*a)+2.3*math.sin(11*a+.23*i)))
            if last:
                for k in range(74):
                    n=(k+1)%74;face(batch,(last[k],last[n],ring[n],ring[k]),palette[(i+2)%9],True)
            last=ring
        for k in range(1,73):
            points=(last[0],last[k],last[k+1]);batch.tri(*points);batch.colours.extend([lin(0xCBAD88)]*3)
            batch.uvs.extend([(u/40,v/40) for u,v,_ in points])
    for b in (apron,strata,temple,far,water,bend):b.build(col)
    return None,lambda x,y:road.s[road.tree.find((x,y,0))[1]]['z']-.21

def road_surface(road,st,length,col,theme,bc):
    tar=bc.Builder('Road','asphalt');line=bc.Builder('Road markings','yellow');edge=bc.Builder('RoadPaint','paint')
    for i in range(road.index(-70),road.index(length+40)):
        def band(batch,left,right,z):batch.quad(road.at(i,left,z),road.at(i,right,z),road.at(i+1,right,z),road.at(i+1,left,z))
        band(tar,4.45,-4.45,.01)
        for side in (-1,1):
            band(line,*sorted((side*.075,side*.18),reverse=True),.03)
            band(edge,*sorted((side*4.12,side*4.22),reverse=True),.03)
    for b in (tar,line,edge):b.build(col)

def scenery(k):
    art=Painted(k);rng=k.rng
    def frame(d,l):
        x,y=pos(d,l);z=elevation(d)-.12;h=direction(d)
        def pt(u,v,w):return x+u*math.cos(h)-v*math.sin(h),y+u*math.sin(h)+v*math.cos(h),z+w
        return pt,h
    greens=[lin(c) for c in (0x435946,0x4E6048,0x54654B,0x5B664C)]
    for d in range(-50,LENGTH+50,9):
        for side in (-1,1):
            near=min(abs(d-p) for p in POINTS)
            if side>0 and near<170:continue
            lane=side*rng.uniform(6.4,40)
            if side>0 and lane>rim(d)-2:continue
            q,h=frame(d,lane);a=rng.uniform(.62,1.43)
            if rng.random()<.64 and (d<1500 or near>380):
                # Long clean reddish trunk and an irregular tiered ponderosa crown.
                art.tube(q(0,0,0),.34*a,.17*a,9*a,lin(0x7E5E46),lin(0x8C7156),8)
                for whorl in range(5):
                    for branch in range(7):
                        angle=branch*math.tau/7+whorl*.93;length=a*(2.5-.29*whorl)*(1+.17*math.sin(branch+d))
                        base=(4.15+whorl*1.43)*a
                        def needle(f,width,lift):
                            return q(length*f*math.cos(angle)-width*math.sin(angle),length*f*math.sin(angle)+width*math.cos(angle),base+lift*a)
                        tip=needle(1,0,-.35);peak=needle(.56,0,.43)
                        for side in (-1,1):
                            art.face((needle(.12,0,.14),needle(.62,side*.46,-.16),tip,peak),(greens[(whorl+branch)%4],)*4)
                for j in range(4):
                    u=.3*math.sin(j*2.4+d);v=.28*math.cos(j*2+d)
                    art.tube(q(u,v,(4.1+j*1.9)*a),(1.46-.25*j)*a,.14*a,(2.6-.25*j)*a,greens[j],greens[min(3,j+1)],10)
            else:
                art.tube(q(0,0,0),.33*a,.18*a,2.5*a,lin(0x75634E),lin(0x81715A),7)
                for j in range(4):
                    u=a*1.22*math.cos(j*2.4);v=a*1.1*math.sin(j*2.4)
                    art.tube(q(u,v,(1.4+j*.28)*a),1.1*a,(1.68-j*.13)*a,1.12*a,greens[j],greens[j],9)
                    art.tube(q(u,v,(2.52+j*.28)*a),(1.68-j*.13)*a,.22*a,1.1*a,greens[j],greens[min(3,j+1)],9)
    stone=[lin(t) for t in (0xAB8C6E,0xC4A485,0xAD947A,0xBEA287,0x9A806A)]
    for point in POINTS:
        for d in range(point-51,point+126,3):
            if point==7220 and d<point+77:continue
            q,h=frame(d,8.35)
            if (d-point)%39>29:continue
            for row in range(3):
                for j in range(2):
                    art.box(q(j*1.46+.49*(row%2),0,row*.24),(1.40,.60,.226),h,rng.choice(stone))
            art.box(q(.5,0,.73),(2.85,.68,.18),h,lin(0xCDAD8B))
        for d in range(point+15,point+86,4):
            q,h=frame(d,min(9.5,rim(d)-.30));art.tube(q(0,0,0),.09,.08,1.23,lin(0x534E44),lin(0x6E6557),8)
            art.box(q(2,0,1.14),(4.02,.09,.095),h,lin(0x6B6256))
        for j in range(17):
            d=point+(rng.uniform(86,125) if point==7220 else rng.uniform(-18,103));q,h=frame(d,rng.uniform(6.55,8))
            legs=lin(0x524D4A);jacket=lin(rng.choice((0x8C5550,0x667685,0xB39859,0x6C775D)))
            skin=lin(rng.choice((0xC09979,0xA48061,0xA17B62)))
            for v in (-.11,.11):art.tube(q(0,v,0),.075,.09,.73,legs,legs,6)
            art.tube(q(0,0,.70),.20,.24,.62,jacket,jacket,7)
            art.tube(q(0,0,1.32),.145,.14,.29,skin,skin,8)
            if j%3==0:art.tube(q(0,0,1.58),.25,.16,.12,lin(0xAB946B),lin(0xB8A375),8)
        for j in range(3):
            q,h=frame(point+52+j*8,-8.3);colour=lin(rng.choice((0x7A8B8D,0xA05947,0xB8B1A3)))
            art.box(q(0,0,.4),(4.25,1.83,.72),h,colour)
            art.box(q(-.2,0,1.1),(2.27,1.54,.7),h,lin(0x596B71))
            art.box(q(-.2,0,1.78),(2.27,1.55,.12),h,colour)
        if point!=13240:
            for j in range(8):
                q,h=frame(point+(85 if point==7220 else 7)+j*2.7,6.8);art.box(q(0,0,-.24),(2.61,2.1,.34),h,lin(0xC1AF93))
    # Colter's Desert View tower has a weathered taper, narrow irregular windows and a crenellated crown.
    tower=Painted(k,'paint');tower.b.name='Watchtower'
    pt,h=frame(13342,14)
    def pol(radius,a,z):return pt(radius*math.cos(a),radius*math.sin(a),z)
    for row in range(43):
        base=row*.52;radius=5.0-.037*row
        for j in range(30):
            a=(j+.50*(row%2))*math.tau/30;b=a+math.tau/30-.003
            window=(row in (11,12,20,21,31,32) and j in (1,10,17,24)) or (37<=row<=39 and j%5 in (0,1))
            colour=lin(0x443F38) if window else rng.choice(stone)
            arr=(pol(radius,a,base),pol(radius,b,base),pol(radius-.037,b,base+.51),pol(radius-.037,a,base+.51))
            tower.face(arr,(colour,)*4)
    for j in range(16):
        a=j*math.tau/16;b=a+.26;rad=3.44
        tower.face((pol(rad,a,22.35),pol(rad,b,22.35),pol(rad,b,23.05),pol(rad,a,23.05)),(stone[j%5],)*4)
    art.tube(pt(3,6,.1),5.8,5.5,3.6,stone[3],stone[2],24)
    art.tube(pt(3,6,3.7),5.9,5.7,.34,stone[1],stone[1],24)
    return {'efforts':0}

THEME={'lay':lay,'land_builder':land,'road_builder':road_surface,'land':{'mid':0xAE9578},'terrain':{'sea':False},
       'haze':0xD7A999,'sky':[0x779AB5,0x95AAB8,0xC0B8AC,0xE6B997,0xB6AAAF],
       'light':[0xFFD6A0,1.65],'fill':[0xD1DFE5,0x997A63],'sun_altitude':.31,'sun_azimuth':2.77,
       'palette':{'asphalt':0x575656,'paint':0xEADEBF,'yellow':0xDDA83F}}
