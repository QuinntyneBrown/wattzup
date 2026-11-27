"""Crater Rim Drive: rope lava, sulphur banks, Nāhuku and the Halemaʻumaʻu overlook."""
import math
import sys
from worldkit import lin, Painted, smooth


def bearing(d):
    return .19*math.sin(d/270)+.11*math.sin(d/97)+.39*(smooth(5360,5600,d)-smooth(5740,5930,d))


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to']
    mean=sum(s['level']*(s['to']-s['from']) for s in stages)/length
    sections=[];z=1060
    for s in stages:
        grade=(s['level']-mean)*.009
        sections.append((s['from'],s['to'],z,grade));z+=grade*(s['to']-s['from'])
    x=y=0;out=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;a,b,h,g=next((row for row in sections if d<row[1]),sections[-1])
        out.append(dict(x=x,y=y,z=h+g*(max(a,min(b,d))-a),h=bearing(d),k=bearing(d+.5)-bearing(d-.5),d=d,g=g*100))
        x+=bc.STEP*math.cos(bearing(d+.5*bc.STEP));y+=bc.STEP*math.sin(bearing(d+.5*bc.STEP))
    return out,stages,length,mean,.9


def road(r,stages,length,col,theme):
    bc=sys.modules[type(r).__module__]
    asphalt=bc.Builder('Road','asphalt');asphalt.colours=[]
    stripes=bc.Builder('RoadPaint','paint');stripes.colours=[]
    for i in range(len(r.s)-1):
        for a,b,h,c,mesh in ((-3.4,3.4,0,0x575457,asphalt),(-.16,-.055,.028,0xD7AA37,stripes),(.055,.16,.028,0xD7AA37,stripes),(-3.16,-3.07,.023,0xBFBCAD,stripes),(3.07,3.16,.023,0xBFBCAD,stripes)):
            mesh.quad(r.at(i,a,h),r.at(i+1,a,h),r.at(i+1,b,h),r.at(i,b,h));mesh.colours.extend([lin(c)]*4)
    asphalt.build(col);stripes.build(col)


def rim_depth(off):
    # Each bench has a steep scarp and a long, nearly level scree shelf.
    levels=((0,0),(5,0),(13,-3),(19,-18),(34,-21),(42,-34),(72,-38),(89,-65),
            (131,-69),(161,-99),(226,-110),(258,-139),(357,-153),(460,-154),
            (525,-145),(571,-106),(619,-99),(655,-68),(705,-61),(744,-33),(809,-27),(850,9),(960,18))
    for (a,z),(b,q) in zip(levels,levels[1:]):
        if off<=b:return z+(q-z)*max(0,(off-a)/(b-a))
    return 18


def height(d,off):
    rim=smooth(4970,5460,d)*(1-smooth(7430,7770,d))
    apron=max(0,min(1,(abs(off)-3.8)/20))
    surface=(.52*math.sin(d/17+off/13)+.34*math.cos(off/5-d/27)+.66*math.sin(d/65+off/17))*apron
    return -.21+surface+(rim*rim_depth(off) if off>0 else 0)


def land(r,col,theme,bc):
    terrain=bc.Builder('KilaueaBasalt','terrain');terrain.colours=[]
    rim=bc.Builder('CalderaWalls','terrain');rim.colours=[];rim.uvs=[]
    offsets=(-540,-240,-98,-51,-27,-15,-8,-3.7,0,3.7,5,9,13,19,34,42,72,89,131,161,226,258,357,460,525,571,619,655,705,744,809,850,960)
    previous=None
    for d in range(-100,7851,8):
        row=[]
        for o in offsets:
            vary=min(1,max(0,(o-7)/55))*(9*math.sin(d/75)+4*math.sin(d/21))
            row.append(r.pos(d,o+vary,height(d,o)))
        if previous:
            for j,(a,b) in enumerate(zip(offsets,offsets[1:])):
                inside=4970<d<7770 and a>9
                batch=rim if inside else terrain
                tone=(0x554945,0x6B5952,0x80706A,0x4A4549,0x77665E)[j%5] if inside else (0x393638 if math.sin(d/124+a/16)>.05 else 0x454044)
                if 2490<d<2720 and -36<a<-5:tone=(0xA5995B,0xB19C53,0x89824E,0x817563)[(j+d//19)%4]
                variation=.93+.065*math.sin(d/21+j*.98)
                c=lin(tone);lit=(c[0]*variation,c[1]*variation,c[2]*variation,1)
                batch.quad(previous[j],row[j],row[j+1],previous[j+1]);batch.colours.extend((c,lit,lit,c))
                if inside:
                    def cliff_v(off):return .06+.76*max(0,min(1,(rim_depth(off)+155)/182))
                    rim.uvs.extend((((d-8)/1150,cliff_v(a)),(d/1150,cliff_v(a)),(d/1150,cliff_v(b)),((d-8)/1150,cliff_v(b))))
        previous=row
    terrain.build(col);rim.build(col)
    return None,lambda x,y:r.s[r.tree.find((x,y,0))[1]]['z']-.21


def scenery(k):
    art=Painted(k);rng=k.rng;road=k.road
    vegetation=type(k.B['terrain'])('OhiaForest','terrain');vegetation.colours=[];vegetation.uvs=[];k.B['OhiaForest']=vegetation
    for i in range(2600):
        d=rng.uniform(-55,k.length+70)
        forest=3470<d<4320
        side=rng.choice((-1,1));off=side*rng.uniform(4.9,54)
        if (off>0 and d>5130) or (abs(d-3965)<18 and off<0) or (not forest and rng.random()<.68):continue
        slot=rng.choice((0,1,1,2)) if forest else 2
        h=rng.uniform(3.4,7.8) if slot!=2 else rng.uniform(.42,1.35);w=h*(1.08 if slot==1 else .81 if slot==0 else 1.9)
        x,y,z=road.pos(d,off,height(d,off)-.02)
        for axis in (bearing(d)+.93,bearing(d)+2.45):
            dx=w*.5*math.cos(axis);dy=w*.5*math.sin(axis)
            coords=((x-dx,y-dy,z),(x+dx,y+dy,z),(x+dx,y+dy,z+h),(x-dx,y-dy,z+h))
            vegetation.faces.append(tuple(vegetation.v(p) for p in coords));vegetation.colours.extend([(1,1,1,1)]*4)
            u=(slot+.006)/3;v=(slot+.994)/3;vegetation.uvs.extend(((u,0),(v,0),(v,1),(u,1)))
    # An uneven, many-kilometre shield holds its bearing beyond the closer collapsed shelves.
    sky=type(k.B['terrain'])('MaunaLoaShield','terrain');sky.colours=[];k.B['MaunaLoaShield']=sky
    shield=Painted(k,'MaunaLoaShield')
    cx,cy,cz=road.pos(6400,4650)
    previous=None
    colours=(0x665D72,0x6D6074,0x766779,0x817184,0x88798A)
    for radius,rise in ((1,-120),(.81,95),(.57,275),(.31,423),(.10,489),(.008,495)):
        ring=[]
        for i in range(84):
            a=math.tau*i/84
            r=radius*(1+.031*math.sin(a*5)+.015*math.cos(a*11))
            ring.append((cx+4400*r*math.cos(a),cy+2130*r*math.sin(a),cz+rise+r*8*math.cos(a*9)))
        if previous:
            for i in range(84):
                n=(i+1)%84
                tone=lin(colours[int((.5+.49*math.sin(i*.34+radius))*len(colours))])
                shield.face((previous[i],previous[n],ring[n],ring[i]),(lin(0x62596B),tone,tone,tone))
        previous=ring
    # The irregular openings anchor the moving steam. Mineral deposits thicken around the vents.
    for d,side in ((1526,-7.2),(1556,-10.8),(1594,-6.7),(2610,-7.7),(2645,-11.5),(2683,-8.2)):
        z=height(d,side)+.065
        for j in range(36):
            a=math.tau*j/36;b=math.tau*(j+1)/36
            def vent(t,r,lift):
                return road.pos(d+r*1.95*math.cos(t),side+r*(1+.11*math.sin(5*t))*math.sin(t),z+lift)
            ochre=lin((0xC9AB59,0xAD914D,0xC5B05D)[j%3] if d>2500 else 0x736462)
            art.face((vent(a,1.45,.02),vent(b,1.45,.02),vent(b,.74,.12),vent(a,.74,.12)),(ochre,ochre,lin(0x766359),ochre))
            art.face((vent(a,.74,.12),vent(b,.74,.12),road.pos(d,side,z+.025)),(lin(0x3C3239),lin(0x4B3E42),lin(0x211D24)))
    # Ferns lean above the portal from planted banks, with understory fronds at the road edge.
    for i in range(247):
        d=rng.uniform(3895,4020)
        off=rng.choice((-1,1))*rng.uniform(4.6,21)
        if off<0 and 3953<d<3984 and off>-12:continue
        h=rng.uniform(2.4,5.8);slot=1 if i%4 else 0
        if i%3==1:slot=2;h=rng.uniform(.55,1.32)
        z0=height(d,off)
        if off< -11 and abs(d-3968)<10:z0+=2.75
        x,y,z=road.pos(d,off,z0-.14)
        for a in (bearing(d)+1.15,bearing(d)+2.60):
            dx=h*.56*math.cos(a);dy=h*.56*math.sin(a)
            corners=((x-dx,y-dy,z),(x+dx,y+dy,z),(x+dx,y+dy,z+h),(x-dx,y-dy,z+h))
            vegetation.faces.append(tuple(vegetation.v(q) for q in corners));vegetation.colours.extend([(1,1,1,1)]*4)
            u=(slot+.002)/3;v=(slot+.998)/3;vegetation.uvs.extend(((u,0),(v,0),(v,1),(u,1)))
    # Raised lobes and glassy braided toes contrast with loose angular ʻaʻā.
    for i in range(4100):
        d=rng.uniform(-40,k.length+45);off=rng.choice((-1,1))*rng.uniform(4.2,29)
        if (d>5100 and off>8) or 3400<d<4310:continue
        x,y,z=road.pos(d,off,height(d,off)-.12)
        size=rng.uniform(.18,1.14);tone=rng.choice((0x453E40,0x524C4D,0x585152,0x37353A))
        if math.sin(d/175+off/23)>.06:
            # Three crescent ridges against each other read as lobate rope folds.
            yaw=rng.uniform(-1,1)+bearing(d)
            for fold in range(3):
                previous=None
                for j in range(7):
                    t=(j-3)*.42
                    along=size*(math.cos(t)+fold*.28);side=size*1.2*math.sin(t)
                    px=x+along*math.cos(yaw)-side*math.sin(yaw);py=y+along*math.sin(yaw)+side*math.cos(yaw)
                    ridge=((px,py,z+.17*size),(px+.19*size*math.cos(yaw),py+.19*size*math.sin(yaw),z+.43*size))
                    if previous:art.face((previous[0],ridge[0],ridge[1],previous[1]),(lin(0x363437),lin(tone),lin(0x655F61),lin(tone)))
                    previous=ridge
        else:
            art.tube((x,y,z),size*.79,size*.48,size*.56,lin(0x373337),lin(tone),5)
            art.tube((x,y,z+size*.56),size*.48,.02,size*.45,lin(tone),lin(0x665D58),5)
    # A darkening succession of irregular elliptical rings forms an actual tube opening.
    rock=type(k.B['terrain'])('TubeBasalt','terrain');rock.colours=[];k.B['TubeBasalt']=rock
    tube=Painted(k,'TubeBasalt')
    rings=[]
    for depth in (0,1.4,3.6,6.7,10.6):
        ring=[]
        for i in range(15):
            t=math.pi*i/14
            ring.append(road.pos(3968+3.75*math.cos(t),-8.5-depth,2.94*math.sin(t)-.27-depth*.058))
        rings.append(ring)
    for n,(near,far) in enumerate(zip(rings,rings[1:])):
        for j in range(14):
            colour=(0x5A4E49,0x3C3738,0x25252A,0x18191D)[n]
            tube.face((near[j],near[j+1],far[j+1],far[j]),(lin(colour),)*4)
    for j in range(14):
        tube.face((rings[-1][j],rings[-1][j+1],road.pos(3968,-19.12,-.2)),(lin(0x131217),)*3)
    for j in range(14):
        t=math.pi*j/14;u=math.pi*(j+1)/14
        tube.face((rings[0][j],rings[0][j+1],road.pos(3968+5.15*math.cos(u),-8.95,3.9*math.sin(u)-.3),
                  road.pos(3968+5.15*math.cos(t),-8.95,3.9*math.sin(t)-.3)),(lin(0x504241),lin(0x574E49),lin(0x685C52),lin(0x514842)))
    # Wrap the passage in a weathered hummock that meets the forest floor on all three sides.
    previous=None
    for depth,along,tall in ((0,5.15,3.9),(2,6.7,4.45),(5,8.3,4.85),(9,9.7,4.57),(14,10.6,3.95),(19,11.9,2.72),(25,13.8,-.15)):
        band=[]
        for j in range(21):
            t=math.pi*j/20
            band.append(road.pos(3968+along*math.cos(t),-8.95-depth,tall*math.sin(t)-.28+.12*math.cos(j*4+depth)))
        if previous:
            for j in range(20):
                c=lin((0x625754,0x75675B,0x5B504F,0x766D5B)[(j+int(depth))%4])
                tube.face((previous[j],band[j],band[j+1],previous[j+1]),(c,lin(0x695C55),c,lin(0x756658)))
        previous=band
    for start,end,side in ((1450,1640,-1),(2520,2710,-1),(5480,5830,1),(7080,7370,1)):
        for d in range(start,end,4):
            art.tube(road.pos(d,side*4.7,-.12),.085,.072,1.03,lin(0x57453D),lin(0x887568),6)
            for z in (.43,.83):art.box(road.pos(d+2,side*4.7,z),(4.12,.056,.074),bearing(d),lin(0x77655B))
    return {'efforts':0}


THEME=dict(lay=route,surface_builder=road,land_builder=land,road_half_width=3.4,
           sky=[0xBA8D8C,0x99839A,0x74658C,0x615777,0x4A4669],land={'mid':0x474145},terrain={'sea':False},
           haze=0x8A7A9A,light=[0xAAB8FF,1.4],fill=[0x5A5F8E,0x2A2422],sun_altitude=-.035,sun_azimuth=-.47)
