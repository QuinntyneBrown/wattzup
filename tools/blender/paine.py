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
    # The foreground shoulders are solid rock; the farther massif follows the
    # curved glacial wall in depth with original relief artwork across each face.
    for station,offset,rx,ry,high,seed in ((1590,1480,590,410,120,4),(3270,1710,640,430,165,7),(9430,1220,370,260,115,3),(10490,1490,650,410,140,8),(12460,1440,760,490,170,7)):
        peak(station,offset,rx,ry,high,True,seed)
    for name,station,offset,width,high in (('CuernosRelief',2630,1120,1700,415),('TorresRelief',10010,1040,1360,420)):
        relief=pictured(k,name);at,_=site(k,station,offset);base=LAKE-14-k.road.pos(station)[2]
        def relief_point(u,v):
            return at((u-.5)*width,82*math.cos(u*math.tau)+56*v+23*math.sin(u*math.tau*3)*v,base+high*v*(.18+.82*smooth(0,.17,u)*(1-smooth(.85,1,u))))
        for col in range(32):
            for row in range(6):
                u=col/32;v=row/6;uv=((u,v),(u+1/32,v),(u+1/32,v+1/6),(u,v+1/6))
                picture(relief,tuple(relief_point(x,y) for x,y in uv),uv)
    # A continuous, layered shore grounds the massif and closes the lake between
    # distant spurs. Permanent far-water geometry meets the distance-culled near lake.
    bank_builder=type(k.B['terrain'])('PaineFarShore','terrain')
    k.B['PaineFarShore']=bank_builder;bank=Painted(k,'PaineFarShore')
    def bank_point(d,band):
        row=k.s[k.road.index(d)];x=row['x'];y=row['y'];bend=43*math.sin(d/243)+64*math.cos(d/472)
        profile=((255,LAKE-.25),(650+bend,LAKE-.25),(720+bend,LAKE+2),(810+bend,LAKE+23+10*math.sin(d/85)),(930+bend,LAKE+47+20*math.cos(d/124)),(1110+bend,LAKE+61+31*math.sin(d/228)),(1460+bend,LAKE+85+29*math.sin(d/304)),(2260,LAKE+96+18*math.cos(d/510)))
        v,z=profile[band];return x,y+v,z
    for d in range(-78,13172,31):
        for j,c in enumerate((0x448B97,0x567D7D,0x7C806B,0x646E60,0x69756B,0x78837C,0x88938D)):
            pts=(bank_point(d,j),bank_point(d+31,j),bank_point(d+31,j+1),bank_point(d,j+1))
            dye=lin(c+int(3*math.sin(d/92))*0x010101)
            bank.face(pts,(dye,)*4)
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
    # A basalt promontory separates the upper river from Pehoé. Present the
    # cascade across the inlet so the rider sees its face above the near bank.
    at,h=site(k,7263,82);zero=LAKE-k.road.pos(7263)[2]
    falls=pictured(k,'SaltoCurtain')
    for j in range(18):
        x=-30+j*3.35;lip=zero+14+.24*math.sin(j*.64)
        art.box(at(x,10,zero-.42),(3.41,20.1,lip-zero+.42),h,lin(0x5B6055))
        art.box(at(x,10,lip),(3.4,20.1,.13),h,lin(0x80B6A7))
        u=j/18
        picture(falls,(at(x-1.68,-3,zero+.09),at(x+1.68,-3,zero+.09),at(x+1.68,-.06,lip+.16),at(x-1.68,-.06,lip+.16)),((u,0),(u+1/18,0),(u+1/18,1),(u,1)))
    for side in (-1,1):
        for j in range(8):
            x=side*(29+j*3.3);width=5.8;high=14.8*(1-j/9)
            a=at(x-width,0,zero+.15);b=at(x+width,-1.3,zero+.15);c=at(x+width,15,zero+.15);e=at(x-width,17,zero+.15);top=at(x+1,5,zero+high)
            for p,q in ((a,b),(b,c),(c,e),(e,a)):
                art.face((p,q,top),(lin(0x686858),lin(0x5F6457),lin(0x91917C)))
    for d,v,w in ((880,824,602),(3300,-960,870),(7050,1450,1100),(10130,1630,980),(12460,-870,710)):
        at,h=site(k,d,v);z=196
        picture(cloud,(at(-w/2,-100,z),at(w/2,100,z),at(w/2,100,z+110),at(-w/2,-100,z+110)),UV)
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':3.65,'land':{'mid':0xA39866},'sky':[0xE9E7DD,0xC3CFD4,0x91A9C2,0x628CAC,0x4073A5],'haze':0xB0BEC1,'light':[0xFFF0D6,2.31],'fill':[0xC9D9E4,0xA79C77],'sun_radius':7,'sun_altitude':.39,'sun_azimuth':-.9}
