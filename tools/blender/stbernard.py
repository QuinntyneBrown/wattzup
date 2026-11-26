"""The Great Saint Bernard road from the avalanche galleries to the hospice and col."""
import math
from worldkit import Painted,lin,smooth
from iten_landmarks import site,pictured,picture
from arenberg import beam
PROFILE=[[0, 1600], [2226.6666666666665, 1687.1993], [2451.6666666666665, 1700.7356], [2851.6666666666665, 1715.2002], [3076.6666666666665, 1728.7365], [3476.6666666666665, 1743.2011], [3726.6666666666665, 1758.9914], [4860.0, 1810.1743], [5993.333333333333, 1868.1572], [7193.333333333333, 1933.1508], [7593.333333333333, 1945.2154], [8585.0, 1995.9504], [9635.0, 2052.8199], [10685.0, 2115.9893], [11218.333333333334, 2132.0754], [12118.333333333334, 2180.8206], [13018.333333333334, 2234.9659], [14018.333333333334, 2298.1273], [14591.666666666668, 2315.4198], [15229.166666666668, 2353.7727], [15937.500000000002, 2398.512], [16645.833333333336, 2447.5013], [17412.500000000004, 2470.625]]

def height(d):
    if d<=0:return PROFILE[0][1]
    for (a,z),(b,h) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(h-z)*(d-a)/(b-a)
    return PROFILE[-1][1]

def heading(d):
    bearing=.21+.16*math.sin(d/381)+.08*math.sin(d/137)
    for centre,radius in ((1850,48),(3810,-42),(4320,44),(5670,-41),(7330,43),(9100,-53),(10960,45),(12200,-48),(14100,52),(14840,-47)):
        turn=2.64;t=max(0,min(1,(d-centre)/(abs(radius)*turn)+.5))
        bearing+=math.copysign(turn*t,radius)
    return bearing

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=height(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(height(d+.5)-height(d-.5))))
        x+=bc.STEP*math.cos(heading(d+.5*bc.STEP));y+=bc.STEP*math.sin(heading(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def road(r,st,length,col,bc):
    path=bc.Builder('HospiceRoad','terrain');path.colours=[];path.uvs=[]
    stripes=bc.Builder('PassMarkings','terrain');stripes.colours=[]
    for i,p in enumerate(r.s[:-1]):
        picture(path,[r.at(i,-3.45),r.at(i+1,-3.45),r.at(i+1,3.45),r.at(i,3.45)],((0,0),(0,1),(1,1),(1,0)))
        for a,b in ((-3.22,-3.12),(3.12,3.22),(-.053,.053)):
            if abs(a)<1 and i%5>1:continue
            stripes.quad(r.at(i,a,.027),r.at(i+1,a,.027),r.at(i+1,b,.027),r.at(i,b,.027));stripes.colours.extend((lin(0xDFDCC6),)*4)
    path.build(col);stripes.build(col)

def land(r,col,theme,bc):
    rock=bc.Builder('PassScree','terrain');rock.colours=[];rock.uvs=[]
    verge=bc.Builder('AlpineVerges','terrain');verge.colours=[]
    lake=r.pos(12784,-52);lake_z=lake[2]-3
    def level(x,y):
        _,i,dist=r.tree.find((x,y,0));p=r.s[i]
        side=(-math.sin(p['h'])*(x-p['x'])+math.cos(p['h'])*(y-p['y']))
        rough=math.sin(x/63+y/87)*6.5+math.cos(y/38-x/98)*4.7+math.sin(x/21)*1.6
        z=p['z']-1.5+smooth(3,37,dist)*((y-p['y'])*.24+rough)
        rad=((x-lake[0])/108)**2+((y-lake[1])/65)**2
        if rad<1.32:z+=(min(z,lake_z-5)-z)*(1-smooth(.68,1.32,rad))*smooth(4,14,dist)
        return z
    rows=r.s;last=None;cell=21
    xs=range(int(min(p['x'] for p in rows))-350,int(max(p['x'] for p in rows))+351,cell)
    for y in range(int(min(p['y'] for p in rows))-395,int(max(p['y'] for p in rows))+420,cell):
        row=[(x,y,level(x,y)) for x in xs]
        if last:
            for j in range(len(row)-1):
                pts=(last[j],last[j+1],row[j+1],row[j]);picture(rock,pts,[(x/19,y/19) for x,y,z in pts])
        last=row
    for sign in (-1,1):
        last=None
        for i in range(0,len(rows),2):
            line=[]
            for v in (3.44,4.25,7.7,14.5):
                x,y,z=r.at(i,sign*v);line.append((x,y,z-.12 if v<5 else level(x,y)+.35))
            if last:
                for j,c in enumerate((0xA9A493,0xA8A78A,0x8F9475)):
                    verge.quad(last[j],line[j],line[j+1],last[j+1]);verge.colours.extend((lin(c),)*4)
            last=line
    rock.build(col);verge.build(col);return None,level

def scenery(k):
    art=Painted(k);front=pictured(k,'HospiceStone');snow=pictured(k,'SnowCut');lake=pictured(k,'ColLake');peaks=pictured(k,'PassPeaks')
    stone,slate,white,red,steel,bronze=map(lin,(0xB8B3A3,0x646A6D,0xE7E8DC,0xAC3831,0x838782,0x575747))
    def tile(m,pts,n,cols):
        u=n/cols;picture(m,pts,((u+.001,.001),(u+1/cols-.001,.001),(u+1/cols-.001,.999),(u+.001,.999)))
    for i,d in enumerate(range(-22,17450,39)):
        for s in (-1,1):
            at,h=site(k,d+s*2,s*4.18)
            art.box(at(0,0,0),(.13,.13,1.08),h,white);art.box(at(0,0,.75),(.145,.145,.24),h,red)
        if 1200<d<7250 and i%3==0:
            at,h=site(k,d,-4.4);art.box(at(0,0,-.1),(1.14,.66,.79),h,stone)
    for start,end in ((64,253),(910,1075),(5850,5964)):
        for n,d in enumerate(range(start,end,7)):
            at,h=site(k,d,0);art.box(at(0,0,5.35),(7.18,9.71,.58),h,stone)
            art.box(at(0,4.44,-.27),(7.17,.64,5.65),h,slate)
            art.box(at(-2.9,-4.13,-.2),(.68,.73,5.64),h,stone)
            art.box(at(0,-4.2,5),(7.1,.82,.51),h,slate)
    for start,end,side in ((7250,8690,1),(8090,8330,-1),(10970,11510,1),(14020,14580,-1)):
        last=None
        for j,d in enumerate(range(start,end,5)):
            v=side*(4.07+.36*math.sin(d/32));at,h=site(k,d,v)
            ht=2.78+1.12*math.sin(d/55)+.33*math.sin(d/14)
            line=(at(0,0,-.13),at(0,side*.38,ht),at(0,side*6.1,ht-.28))
            if last:
                u=j%4*.25
                picture(snow,(last[0],line[0],line[1],last[1]),((u,0),(u+.25,0),(u+.25,1),(u,1)))
                art.face((last[1],line[1],line[2],last[2]),(white,)*4)
            last=line
    at,h=site(k,12784,-52);bed=k.road.pos(12784,-52)[2]-3
    center=at(0,0,0);ring=[]
    for j in range(60):
        a=j*math.tau/60;r=1+.074*math.sin(3*a)+.045*math.sin(7*a);x=center[0]+108*r*math.cos(a);y=center[1]+64*r*math.sin(a)
        ring.append((x,y,bed))
    for j,p in enumerate(ring):
        q=ring[(j+1)%len(ring)];picture(lake,[(center[0],center[1],bed),p,q],((.5,.5),(0,0),(1,0)))
    for j in range(38):
        a=k.rng.uniform(0,math.tau);r=k.rng.uniform(.19,.93);cx=center[0]+r*98*math.cos(a);cy=center[1]+r*59*math.sin(a)
        width=k.rng.uniform(2,8);depth=k.rng.uniform(2,5)
        art.face([(cx+width*math.cos(q*math.tau/7),cy+depth*math.sin(q*math.tau/7),bed+.09) for q in range(7)],(lin(0xCBDADB),)*7)
    def building(d,v,w,dep,ht,t):
        at,h=site(k,d,v);side=1 if v>0 else -1
        art.box(at(0,0,-.5),(w,dep,ht+.5),h,stone)
        art.roof(at(0,0,ht),w,dep,dep*.49,h,slate)
        for v0 in (-dep/2-.035,dep/2+.035):
            tile(front,[at(a,v0,z) for a,z in ((-w/2,0),(w/2,0),(w/2,ht),(-w/2,ht))],t,3)
        for a in (-w/2-.05,w/2+.05):
            tile(front,[at(a,b,z) for b,z in ((-dep/2,0),(dep/2,0),(dep/2,ht),(-dep/2,ht))],1 if t<2 else 2,3)
        for j in (-.26,.19):art.box(at(w*j,0,ht+dep*.39),(.68,.75,1.83),h,stone)
    for d,v,w,dep,ht,t in ((12852,87,33,13,13,0),(15539,16,36,12,14,0),(15569,-18,27,14,12.3,1),(15519,-13,11,7,5.4,2),(17099,11,13,7.4,5.2,2),(17131,-12,11,8,4.8,0)):
        building(d,v,w,dep,ht,t)
    at,h=site(k,15528,-7.6)
    for j in range(11):
        art.box(at(j-5,0,0),(.11,.13,1.22),h,slate)
    for z in (.45,.98):art.box(at(0,0,z),(11,.12,.095),h,slate)
    at,h=site(k,17124,-14.7)
    art.tube(at(0,0,0),2.3,1.44,2.9,stone,slate,8,cap=slate)
    art.box(at(0,0,2.9),(1.86,1.68,2),h,stone)
    art.tube(at(0,0,4.9),.62,.36,1.85,bronze,bronze,10,cap=bronze)
    art.tube(at(0,0,6.75),.24,.22,.4,bronze,bronze,10,cap=bronze)
    beam(art,at(0,0,6.31),at(.71,0,6.62),.16,bronze);beam(art,at(.73,0,4.9),at(.73,0,7.06),.058,bronze)
    for d,v in ((17092,5.65),(17102,-5.6)):
        at,h=site(k,d,v);art.tube(at(0,0,0),.081,.044,5.21,steel,steel,10)
    # A summit ring remains in world space so nearer road and snow walls cross it with real parallax.
    rows=k.s;cx=sum(p['x'] for p in rows)/len(rows);cy=sum(p['y'] for p in rows)/len(rows)
    for j in range(52):
        a=j*math.tau/52;b=(j+1)*math.tau/52;u=(j%13)/13;rad=6800
        def point(angle,z):return cx+rad*math.cos(angle),cy+rad*math.sin(angle),z
        picture(peaks,(point(a,1180),point(b,1180),point(b,3980),point(a,3980)),((u,0),(u+1/13,0),(u+1/13,1),(u,1)))
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':3.45,'terrain':{'sea':False},'land':{'mid':0x8F9479},
       'sky':[0xDDE2DF,0xBFD4DD,0xA4C7DE,0x87B7D7,0x6EA2CF],'haze':0xC3CFD0,'light':[0xFFEAC8,1.34],'fill':[0xCDDEE9,0xB0AB98],
       'sun_altitude':.56,'sun_azimuth':-.78}
