"""The D8 across the Valensole plateau, with lavender ridges, hives and hilltop villages."""
import math
from bondi import beam
from iten_landmarks import pictured, picture, site
from worldkit import Painted, lin, smooth

PROFILE=((0,558),(1100,566),(2310,560),(3310,578),(4850,589),(6440,576),(7970,570),
         (9630,581),(11100,559),(12300,551),(13720,585),(15110,593),(16300,583),(17960,611),(18545,607))


def height(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*smooth(a,b,d)
    return PROFILE[-1][1]


def route(course,theme,bc):
    stages=bc.stages(course['plan'])
    length=stages[-1]['to']
    def angle(d):return .14*math.sin(d/510)+.075*math.sin(d/213)+.095*math.sin(d/1490)
    rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=angle(d);z=height(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=angle(d+.5)-angle(d-.5),g=100*(height(d+bc.STEP)-z)/bc.STEP))
        x+=bc.STEP*math.cos(angle(d+bc.STEP*.5));y+=bc.STEP*math.sin(angle(d+bc.STEP*.5))
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    return rows,stages,length,mean,.04


def lateral(d,v):
    hill=11*math.sin(d/440+v/164)+4*math.sin(d/223-v/96)
    if v>0:hill+=14*smooth(55,155,v)*smooth(13100,13650,d)*(1-smooth(14100,14600,d))
    return hill*smooth(6,160,abs(v))


def road(r,st,length,col,bc):
    b=bc.Builder('PlateauRoad','terrain');b.colours=[]
    for i,p in enumerate(r.s[:-1]):
        strips=[(-4.45,4.45,.035,0xBAA27B),(-3.39,3.39,.065,0x555658)]
        if i%5==0:strips.append((-.07,.07,.08,0xE6DDCA))
        for u,v,z,c in strips:
            b.quad(r.at(i,u,z),r.at(i+1,u,z),r.at(i+1,v,z),r.at(i,v,z));b.colours.extend([lin(c)]*4)
    b.build(col)


def land(r,col,theme,bc):
    names=('Lavandin','DeepLavender','GoldWheat','Sunflowers','Marl')
    fields=[]
    for name in names:
        b=bc.Builder(name,'terrain');b.colours=[];b.uvs=[];fields.append(b)
    def field(i,v):
        d=r.s[i]['d'];side=1 if v>0 else 0
        section=int((d+80+side*96)//191)
        if side==0 and d<350:return 2
        if side==1 and 6320<d<6590:return 0
        if side==1 and 9500<d<9870:return 1
        return (0,1,0,2,1,0,3,1,0)[(section+3*side)%9]
    for i in range(0,len(r.s)-1,3):
        j=min(i+3,len(r.s)-1)
        for u,v in ((-660,-190),(-190,-62),(-62,-7.3),(-7.3,7.3),(7.3,62),(62,190),(190,660)):
            side=(u+v)/2;idx=4 if u<0<v else field(i,side)
            b=fields[idx];pts=((i,u),(j,u),(j,v),(i,v));xyz=[]
            for n,w in pts:
                x,y,z=r.at(n,w);d=r.s[n]['d']
                f=smooth(52,190,abs(w))
                x+=(r.s[n]['x']-x)*f;y+=(r.s[n]['y']+w-y)*f
                xyz.append((x,y,z+lateral(d,w)-.12))
                # UV columns measure distance across the crop rows in metres.
                b.uvs.append(((w+.16*d)/9.3,d/9.3))
            b.quad(*xyz);b.colours.extend([lin(0xCEB385 if idx==4 else 0xFFFFFF)]*4)
    # Crown the close lavender beds with a continuous ridge. The same field UVs
    # run over the curved top and down to the bare marl between plants.
    for centre in (80,3310,6440,9630,13720,17960):
        for d in range(centre-65,centre+126,5):
            i=r.index(d);j=r.index(d+5)
            if i==j:continue
            for side in (-1,1):
                group=field(i,side*15)
                if group>1:continue
                b=fields[group]
                for row in range(12):
                    lane=(9+row*1.8)*side
                    for u,v,zu,zv in ((-.55,-.27,0,.32),(-.27,.23,.32,.43),(.23,.55,.43,0)):
                        pts=((i,lane+u,zu),(j,lane+u,zu),(j,lane+v,zv),(i,lane+v,zv))
                        xyz=[]
                        for n,w,hh in pts:
                            x,y,z=r.at(n,w);station=r.s[n]['d']
                            xyz.append((x,y,z+lateral(station,w)+hh))
                            b.uvs.append(((w+.16*station)/9.3,station/9.3))
                        b.quad(*xyz);b.colours.extend([lin(0xFFFFFF)]*4)
    for b in fields:b.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));p=r.s[i];v=-(x-p['x'])*math.sin(p['h'])+(y-p['y'])*math.cos(p['h'])
        return p['z']+lateral(p['d'],v)-.12
    return None,sample


def scenery(k):
    from themes import CROWD
    art=Painted(k)
    flora=pictured(k,'ValensolePlants');walls=pictured(k,'MasFacades');signs=pictured(k,'PlateauSigns')
    stone,tile,iron,wood,glass=[lin(c) for c in (0xB8A787,0xAC6448,0x4D514F,0x958265,0x67848C)]
    def panel(at,mesh,x,y,z,w,h,angle,index,cols,rows):
        dx=math.cos(angle)*w*.5;dy=math.sin(angle)*w*.5;u=index%cols/cols;v=1-(1+index//cols)/rows
        picture(mesh,(at(x-dx,y-dy,z),at(x+dx,y+dy,z),at(x+dx,y+dy,z+h),at(x-dx,y-dy,z+h)),
                ((u+.002,v+.002),(u+1/cols-.002,v+.002),(u+1/cols-.002,v+1/rows-.002),(u+.002,v+1/rows-.002)))
    def base(d,v):
        at,h=site(k,d,v);return at,h,lateral(d,v)-.12
    def tree(d,v,index,high):
        at,h,z=base(d,v);width=high*(.77 if index==2 else 1.12)
        for a in (.48,2.05):panel(at,flora,0,0,z,width,high,a,index,3,2)
    for d in range(180,18400,239):
        tree(d,(1 if d%3 else -1)*(45+d%99),0 if d%4 else 1,8.3+d%6)
    for d,v in ((159,34),(3370,23),(6469,-37),(9820,53),(17895,-33),(18008,34)):tree(d,v,1,9.2)
    def house(d,v,w,b,high,index):
        at,h,z=base(d,v)
        art.box(at(0,0,z-.25),(w,b,high+.25),h,stone)
        for side in (-1,1):
            panel(at,walls,0,side*(b/2+.025),z,w,high,0,index,2,2)
            panel(at,walls,side*(w/2+.025),0,z,b,high,math.pi/2,index,2,2)
        art.roof(at(0,0,z+high),w+.55,b+.55,2.05,h,tile)
        art.box(at(w*.29,.5,z+high+1.05),(.72,.73,2.35),h,stone)
    for d,v in ((3351,20),(3388,39),(4860,-76),(7280,67),(10060,-92),(12480,77),(16110,-89)):
        house(d,v,14.8,8.2,6.53,0);tree(d+13,v+8,2,13.5)
    at,h,z=base(3343,-16)
    for j in range(13):
        rr=3.35*(1-(j/14)**1.65)
        art.tube(at(0,0,z+.37*j),rr,rr-.12,.38,stone,stone,14,stone)
    art.box(at(-2.75,0,z),(1.3,1.4,2.2),h,iron)
    for center,side in ((13745,1),(18004,1)):
        for j in range(31):
            d=center+(j%9-4)*11.8+(j//9)*5;v=side*(24+(j//9)*13+3*math.sin(j*9))
            house(d,v,8+j%4,6.7+j%3,5.8+j%5,j%4)
        at,h,z=base(center+41,side*55)
        art.box(at(0,0,z),(8.1,8.1,20.4),h,stone)
        art.roof(at(0,0,z+20.4),8.5,8.5,4.5,h,tile)
        for sidewall in (-1,1):
            for yy in (-1.45,1.45):art.box(at(sidewall*4.08,yy,z+15.3),(.11,1.22,3.1),h,iron)
        for dx in (-42,-20,5,28):tree(center+dx,-9-abs(dx)%3,5,8.9)
    for d,v,index in ((97,-6,0),(3334,7,2),(6461,8,3),(13744,-6,0),(17982,-6,1)):
        at,h,z=base(d,v)
        art.box(at(0,0,z),(.10,.10,2.4),h,iron)
        panel(at,signs,-.11,0,z+1.24,2.08,1.12,-math.pi/2,index,2,2)
    for j in range(18):
        d=6448+(j%6)*3.9;v=10.9+(j//6)*3.3;at,h,z=base(d,v)
        art.box(at(0,0,z),(1.05,.84,.25),h,wood)
        for n in range(3):
            c=lin((0xBFAB70,0x8EACA3,0xA6A6BE,0xDDC48B)[(j+n)%4])
            art.box(at(0,0,z+.25+n*.25),(1,.78,.23),h,c)
        art.box(at(0,0,z+1.00),(1.19,.96,.08),h,iron)
    # Tractor, hopper and cutting head at the end of the working row.
    at,h,z=base(9656,15)
    yellow,blue,black=lin(0xE2AC41),lin(0x417DA2),lin(0x343635)
    art.box(at(0,0,z+1.08),(4.2,2.5,1.13),h,yellow)
    art.box(at(-.3,0,z+2.14),(2.1,1.99,1.74),h,glass)
    art.box(at(-.3,0,z+3.89),(2.35,2.25,.22),h,yellow)
    art.box(at(4.37,0,z+.81),(4.9,2.92,2.74),h,blue)
    for x in (-1.43,1.30,4.59):
        for side in (-1,1):
            atwheel=at(x,side*1.29,z+1.00)
            for j in range(14):
                a=j*math.tau/14;b=(j+1)*math.tau/14
                def rim(t,v):return at(x+.95*math.cos(t),side*1.29+v,z+1+.95*math.sin(t))
                art.face((rim(a,-.26),rim(b,-.26),rim(b,.26),rim(a,.26)),(black,)*4)
                art.face((rim(a,side*.28),rim(b,side*.28),at(x,side*1.57,z+1)),(black,black,wood))
    for j in range(9):
        at,h,z=base(9730+j*9,28+j%3*1.8)
        art.tube(at(0,0,z),1.3,1.28,1.48,wood,lin(0xBAA16C),14,lin(0xBAA16C))
    for j in range(6):
        at,h,z=base(13722+j*7.5,9.3)
        for x in (-1.9,1.9):
            for y in (-1.2,1.2):art.box(at(x,y,z),(.095,.095,2.5),h,wood)
        art.roof(at(0,0,z+2.52),4.4,3.3,.74,h,lin((0xA89ABE,0xE5D7B9,0x9299AC)[j%3]))
        art.box(at(0,-.8,z),(3.65,1.12,1.01),h,wood)
        panel(at,signs,0,-1.38,z+.1,3.2,.86,0,2+j%2,2,2)
        for n in range(3):k.person(at(n*.85-1.1,-2.35-(n%2)*.7,z),h+n,CROWD)
    # Fixed mountain ranges beyond the fields, with different ridge profiles on either horizon.
    peaks=Painted(k,'peaks')
    for side in (-1,1):
        for band in range(2):
            last=None
            for x in range(-3500,22500,65):
                y=side*(1100+band*1350)
                z=636+band*76+47*math.sin(x/465+band)+31*math.sin(x/186+side)+11*math.sin(x/53)+57*max(0,math.cos(x/1103+band))
                pts=((x,y,493),(x,y,z));c=lin((0x8E9EAA,0xAAB6C0)[band])
                if last:peaks.face((last[0],pts[0],pts[1],last[1]),(c,)*4)
                last=pts
    for x in (21200,-2100):
        last=None
        for y in range(-5000,5001,60):
            z=925+105*math.sin(y/569)+53*math.sin(y/241)+21*math.cos(y/88)
            pts=((x,y,510),(x,y,z));c=lin(0x9FAFBA)
            if last:peaks.face((last[0],pts[0],pts[1],last[1]),(c,)*4)
            last=pts
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':3.39,
       'land':{'mid':0xBCAA7C},'sky':[0xF4DABC,0xE5E2CC,0xBBD6DC,0x91C2DB,0x6EA8CA],
       'haze':0xD6CDC1,'light':[0xFFE0AB,2.48],'fill':[0xC0D6E2,0xABA17C],
       'sun_radius':7,'sun_altitude':.62,'sun_azimuth':-.94}
