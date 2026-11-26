"""The Pehoé gravel, its windward lakeshore, layered Cuernos and granite towers."""
import math
from worldkit import Painted, lin, smooth
from iten_landmarks import pictured, picture, site
from bondi import beam

PROFILE=((0,93),(1500,108),(2800,98),(4400,136),(5200,112),(7000,96),(7510,114),(8100,103),(9900,173),(11100,134),(13025,95))
LAKE=84
UV=((0,0),(1,0),(1,1),(0,1))


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    def height(d):
        for (a,lo),(b,hi) in zip(PROFILE,PROFILE[1:]):
            if d<=b:
                work=sum((s['level']-mean)*max(0,min(d,s['to'])-s['from']) for s in stages)
                return lo+(hi-lo)*smooth(a,b,d)+1.5*math.sin(d/186)+.00055*work
        return PROFILE[-1][1]
    def head(d):return .19*math.sin(d/232)+.21*math.sin(d/628)-.08*math.cos(d/145)
    rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=head(d);z=height(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=head(d+.5)-head(d-.5),g=100*(height(d+bc.STEP)-z)/bc.STEP))
        x+=bc.STEP*math.cos(head(d+bc.STEP*.5));y+=bc.STEP*math.sin(head(d+bc.STEP*.5))
    return rows,stages,length,mean,.11


def road(r,st,length,col,bc):
    b=bc.Builder('PehoeGravel','terrain');b.colours=[];b.uvs=[]
    for i,p in enumerate(r.s[:-1]):
        for l,e,c in ((-4.4,-3.65,0x9A8F78),(-3.65,-1.83,0xBCB4A2),(-1.83,-1.24,0xA69D8D),(-1.24,1.24,0xC5BBA7),(1.24,1.83,0xA69D8D),(1.83,3.65,0xBCB4A2),(3.65,4.4,0x9A8F78)):
            pts=(r.at(i,l,.034),r.at(i+1,l,.034),r.at(i+1,e,.034),r.at(i,e,.034))
            b.quad(*pts);b.colours.extend([lin(c)]*4);b.uvs.extend((x/2.8,y/2.8) for x,y,z in pts)
    b.build(col)


def shore(d): return 53+16*math.sin(d/315)+9*math.cos(d/156)


def land(r,col,theme,bc):
    ground=bc.Builder('Patagonian steppe','terrain');ground.colours=[]
    lake=bc.Builder('PehoeWater','terrain');lake.colours=[]
    def point(i,v):
        s=r.s[i];d=s['d'];x,y,z=r.at(i,v);f=smooth(14,85,abs(v))
        x+=(s['x']-x)*f;y+=(s['y']+v-y)*f
        if v>0:
            z+=(LAKE-.52-z)*smooth(4.6,shore(d),v)
        else:
            z+=(15+11*math.sin(d/223)+8*math.cos(d/98))*smooth(5,61,-v)
            z+=(83+44*math.cos(d/348))*smooth(65,410,-v)
        return x,y,z-.08
    for i in range(0,len(r.s)-3,3):
        j=i+3
        for a,b,c in ((-840,-380,0x6F7056),(-380,-95,0x8E875B),(-95,-28,0x98925D),(-28,-8,0xA59F70),(-8,9,0xA29871),(9,23,0xA69C68),(23,39,0x898A62),(39,82,0x787D68)):
            pts=(point(i,a),point(j,a),point(j,b),point(i,b));ground.quad(*pts)
            for x,y,z in pts:ground.colours.append(lin(c+int(5*math.sin(x*.032+y*.09))*0x010101))
        for a,b,c in ((24,82,0x70B4A9),(82,155,0x48AAB0),(155,522,0x2597A8),(522,3400,0x368795)):
            locs=((i,a),(j,a),(j,b),(i,b));pts=[(*point(k,v)[:2],LAKE) for k,v in locs];lake.quad(*pts);lake.colours.extend([lin(c)]*4)
    ground.build(col);lake.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));s=r.s[i];return point(i,(y-s['y'])*math.cos(s['h'])-(x-s['x'])*math.sin(s['h']))[2]
    return None,sample


def scenery(k):
    art=Painted(k);grass=pictured(k,'Coiron');cloud=pictured(k,'PaineCloud');animals=pictured(k,'Guanacos')
    def peak(d,offset,rx,ry,high,cap,seed):
        at,h=site(k,d,offset);base=LAKE-3-k.road.pos(d)[2];rings=[]
        levels=(0,.18,.40,.60,.73,.84,.946,1)
        for row,q in enumerate(levels):
            ring=[]
            for i in range(21):
                t=math.tau*i/21
                rough=1+.16*math.sin(3*t+seed)+.12*math.sin(7*t+.71*seed)+.052*math.cos(11*t+row)
                w=(1-q)**(.70 if cap else .46)
                if cap and .72<q<.85:w*=1.18
                u=rx*w*rough*math.cos(t)+rx*.17*q;v=ry*w*rough*math.sin(t)
                ridge=high*.038*math.sin(t*5+seed+q)*math.sin(q*math.pi)
                ring.append(at(u,v,base+high*q+ridge))
            rings.append(ring)
        for j in range(len(levels)-1):
            for i in range(21):
                n=(i+1)%21;upper=levels[j+1]
                snow=(math.cos(i*.69+seed)+.43*math.sin(j*1.5+i))>.70 and upper>.48
                if cap and levels[j]>=.73:col=0x424447 if not snow else 0xCBD5D6
                elif snow:col=0xC7DADD if j%3 else 0xA8C7CE
                elif j<2:col=0x696F68
                else:col=0xA8A396 if cap else 0xAA9E8E
                shade=int(12*math.sin(i*1.7+seed)+7*math.cos(i*.61+j*.7));c=lin(col+shade*0x010101)
                a,b=rings[j][i],rings[j][n];e,f=rings[j+1][n],rings[j+1][i]
                art.face((a,b,e),(c,)*3);art.face((a,e,f),(c,)*3)
    for args in ((1380,950,565,315,362,True,4),(2230,1180,720,590,606,True,1),(2710,1280,490,430,738,True,5),(3070,1350,470,500,580,True,3),(3790,1500,600,382,432,True,7),
                 (9650,950,220,260,502,False,3),(9880,1080,190,265,637,False,4),(10130,1070,177,242,544,False,1),(10580,1510,730,380,405,True,8),(12130,1320,740,490,480,True,7)):
        peak(*args)
    def billboard(group,d,v,w,h,variant,count,alt=0):
        at,_=site(k,d,v);x,y,_=at(0,0);z=k.height_at(x,y)-k.road.pos(d)[2]+alt
        u=variant/count;uv=((u+.002,0),(u+1/count-.002,0),(u+1/count-.002,1),(u+.002,1))
        for a in (.43,1.71):
            dx=w*.5*math.cos(a);dy=w*.5*math.sin(a)
            picture(group,(at(-dx,-dy,z),at(dx,dy,z),at(dx,dy,z+h),at(-dx,-dy,z+h)),uv)
    for d in range(-60,13161,5):
        for side in (-1,1):
            v=side*k.rng.uniform(4.8,33);j=k.rng.randrange(3);billboard(grass,d+k.rng.uniform(-2,2),v,1.4+j*.4,.59+j*.15,j,3)
    for d,v,j in ((4588,-7,0),(4594,-11,1),(4600,-16,2),(4610,-8,1),(4615,-18,0),(4622,-15,2),(4630,-23,1)):
        billboard(animals,d,v,2.1,1.67,j,3)
    # A rocky channel projects into Pehoé; the waterfall drops from the higher shelf.
    at,h=site(k,7261,54);zero=LAKE-k.road.pos(7261)[2]
    for j in range(12):
        dy=-17+j*3;lip=zero+8+.4*math.sin(j*.82)
        art.box(at(12,dy,zero-.4),(22.5,3.12,lip-zero+.4),h,lin(0x656959))
        art.box(at(12,dy,lip),(22.6,3.11,.15),h,lin(0x75B5AD))
        pts=(at(.76,dy-1.55,lip),at(.76,dy+1.55,lip),at(-2.6,dy+1.55,zero+.09),at(-2.6,dy-1.55,zero+.09));art.face(pts[::-1],(lin(0xC9E5DB),lin(0xB1DCD4),lin(0xECEFE2),lin(0xD9E7DB))[::-1])
    for d,v,w in ((880,824,602),(3300,-960,870),(7050,1450,1100),(10130,1630,980),(12460,-870,710)):
        at,h=site(k,d,v);z=196
        picture(cloud,(at(-w/2,-100,z),at(w/2,100,z),at(w/2,100,z+110),at(-w/2,-100,z+110)),UV)
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':3.65,'land':{'mid':0xA39866},'sky':[0xE9E7DD,0xC3CFD4,0x91A9C2,0x628CAC,0x4073A5],'haze':0xB0BEC1,'light':[0xFFF0D6,2.31],'fill':[0xC9D9E4,0xA79C77],'sun_radius':7,'sun_altitude':.39,'sun_azimuth':-.9}
