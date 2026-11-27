"""Model the Calzada de los Muertos, east-side Sun and north-end Moon monuments."""
import math
from iten_landmarks import pictured, picture, site
from worldkit import Painted, lin

PROFILE = [[0, 2280], [2125.0, 2282.9168], [2525.0, 2282.6738], [3025.0, 2284.3501], [3425.0, 2284.1071], [4425.0, 2287.4597], [5225.0, 2286.9738], [6725.0, 2292.0027], [7925.0, 2291.2738], [9925.0, 2297.979], [11525.0, 2297.0071], [14025.0, 2305.3886], [16025.0, 2304.1738], [19025.0, 2314.2316], [21425.0, 2312.7738], [21675.0, 2313.7769], [22275.0, 2313.4125]]

def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d <= b:
            return z + (y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]

def route(course,theme,bc):
    stages=bc.stages(course['plan'])
    length=stages[-1]['to']
    samples=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        grade=(elevation(d+1)-elevation(d-1))*50
        samples.append(dict(d=d,x=d,y=0,z=elevation(d),h=0,k=0,g=grade))
    return samples,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def surface(r,builder,low,high,height):
    for i,p in enumerate(r.s[:-1]):
        end=r.s[i+1]['d']
        pts=[r.at(j,v,height) for j,v in ((i,low),(i+1,low),(i+1,high),(i,high))]
        picture(builder,pts,[(x*.22,y*.22) for x,y,z in pts])

def road(r,st,length,col,bc):
    dust=bc.Builder('AvenueDust','terrain');dust.colours=[];dust.uvs=[]
    surface(r,dust,-14,14,.045)
    dust.build(col)

def land(r,col,theme,bc):
    grass=bc.Builder('HighlandGrass','terrain');grass.colours=[];grass.uvs=[]
    surface(r,grass,-1200,1200,-.21)
    return grass.build(col),lambda x,y:elevation(x)-.21

def scenery(k):
    masonry=pictured(k,'VolcanicStone')
    sun=pictured(k,'SunPyramid');moon=pictured(k,'MoonPyramid')
    flora=pictured(k,'HighlandPlants');people=pictured(k,'ValleyVisitors')
    faces=pictured(k,'QuetzalFaces');sky=pictured(k,'AnahuacSky')
    art=Painted(k)
    def stone(mesh,pts):
        x,y,z=pts[0];u=math.dist(pts[0],pts[1])/3;v=math.dist(pts[1],pts[2])/3
        picture(mesh,pts,((0,0),(u,0),(u,v),(0,v)))
    def terrace(mesh,at,along,wide,base,top,rake):
        low=[at(u*along,v*wide,base) for u,v in ((-1,-1),(1,-1),(1,1),(-1,1))]
        high=[at(u*(along-rake),v*(wide-rake),top) for u,v in ((-1,-1),(1,-1),(1,1),(-1,1))]
        for i in range(4):
            n=(i+1)%4;stone(mesh,[low[i],low[n],high[n],high[i]])
        stone(mesh,high)
    def pyramid(mesh,at,along,wide,levels,rise,run):
        for i in range(levels):
            a=along-i*run;b=wide-i*run;z=i*rise-.15
            terrace(mesh,at,a,b,z,z+rise*.78,run*.67)
            terrace(mesh,at,a-run*.63,b-run*.63,z+rise*.78,z+rise,run*.06)
    def steps(mesh,at,count,rise,tread,half):
        for j in range(count):
            a=j*tread;b=a+tread;z=j*rise
            stone(mesh,[at(a,-half,z),at(a,half,z),at(a,half,z+rise),at(a,-half,z+rise)])
            stone(mesh,[at(a,-half,z+rise),at(a,half,z+rise),at(b,half,z+rise),at(b,-half,z+rise)])
    def stair_from_side(d,offset,sign):
        return lambda u,v,z:(d+v,offset+sign*u,elevation(d)+z)
    def cutout(mesh,at,width,height,index=0,cols=4):
        u=(index+.008)/cols;v=(index+.992)/cols
        picture(mesh,[at(0,y,z) for y,z in ((-width/2,-.18),(width/2,-.18),(width/2,height),(-width/2,height))],((u,0),(v,0),(v,1),(u,1)))
    at,h=site(k,8620,-310);pyramid(sun,at,113,108,5,13.25,18)
    steps(sun,stair_from_side(8620,-191,-1),186,.348,.50,7.3)
    for side in (-1,1):
        curb=stair_from_side(8620+side*8.4,-191,-1)
        for j in range(31):
            lo=j*3;hi=lo+3;bottom=j*2.088
            for v in (-.62,.62):
                stone(sun,[curb(lo,v,bottom),curb(hi,v,bottom+2.088),curb(hi,v,bottom+3.15),curb(lo,v,bottom+1.05)])
            stone(sun,[curb(lo,-.62,bottom+1.05),curb(hi,-.62,bottom+3.15),curb(hi,.62,bottom+3.15),curb(lo,.62,bottom+1.05)])
    at,h=site(k,22475);pyramid(moon,at,85,109,5,8.7,14)
    at,h=site(k,22378);steps(moon,at,130,.329,.58,8.7)
    at,h=site(k,227,-34);pyramid(masonry,at,37,23,4,3.5,5)
    # The heads project from the west-facing temple wall and carry a deep receding collar.
    for x in (165,175,185):
        for lane in (-13,-19,-25,-31,-37,-43):
            at,h=site(k,x,lane)
            if x>165 and lane<-13:continue
            art.box(at(1.1,0,-.18),(4.8,3.5,2.98),h,lin(0x8B7969))
            art.box(at(-1.32,0,.1),(.68,2.97,2.63),h,lin(0xA39783))
            cutout(faces,lambda u,v,z:at(-1.68,v,z+.19),2.69,2.42,0,1)
    for j,d in enumerate(range(-96,22290,79)):
        for sign in (-1,1):
            offset=sign*(34+k.rng.uniform(0,12));at,h=site(k,d,offset)
            if sign==-1 and abs(d-8620)<155 or sign==-1 and abs(d-227)<59:continue
            width=k.rng.uniform(9,14)
            pyramid(masonry,at,k.rng.uniform(19,32),width,2,1.45,2.9)
            steps(masonry,stair_from_side(d,offset-sign*(width+2.8),sign),13,.212,.52,3.5)
            for n in range(4):
                kind=(j+2*n)%4
                off=sign*(k.rng.uniform(17,28) if kind<3 else k.rng.uniform(54,96))
                pos,h=site(k,d+n*16+k.rng.uniform(0,5),off)
                cutout(flora,pos,(1.75,2.1,1.35,9.5)[kind],(1.1,2.2,.8,6.8)[kind],kind)
        if j%3==0:
            at,h=site(k,d+19,(-1 if j%2 else 1)*k.rng.uniform(10,16))
            cutout(people,at,3.25,1.77,2)
    for j,d in enumerate((17405,17431,17470,17517,17566)):
        side=-1 if j%3 else 1
        at,h=site(k,d,side*(9+j%2));cutout(people,at,3.4,1.22,3)
        if j!=2:
            at,h=site(k,d+1,side*11);cutout(people,at,1.06,1.86,0)
        for v in (-1.8,1.8):
            art.box(at(0,v,-.15),(.12,.12,2.58),h,lin(0x846A50))
        art.box(at(0,0,2.43),(2.68,4.2,.16),h,lin((0x866B55,0xA0956D,0xAF6E4C)[j%3]))
        at,h=site(k,d+5,side*15);cutout(flora,at,7.6,5.7,3)
    for j,d in enumerate((152,169,4240,4253,4266,8515,8530,12824,12860,17470,17481,22102,22115)):
        at,h=site(k,d,(-1 if j%2 else 1)*(10+j%4));cutout(flora,at,2.2,1.4,j%2)
    # A large elliptical backdrop keeps the mountain skyline beyond the architectural geometry.
    for j in range(96):
        a=j*math.tau/96;b=(j+1)*math.tau/96;u=j%24/24;v=u+1/24
        if j//24%2:u,v=1-u,1-v
        def point(t,z):return 11100+19800*math.cos(t),14800*math.sin(t),z+2280
        picture(sky,(point(a,-3500),point(b,-3500),point(b,12200),point(a,12200)),((u,0),(v,0),(v,1),(u,1)))
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':14,'terrain':{'sea':False},'land':{'mid':0xA8A26C},'sky':[0xD1C6B1,0xC0CBCA,0x9DB8CF,0x6797C3,0x4676A7],'haze':0xC8C3A9,'light':[0xFFE2B9,1.46],'fill':[0xB9D1E4,0xA68A65],'sun_altitude':.57,'sun_azimuth':-.87}
