"""Two lakeside laps of Hyde Park, with fixed shore, boats, bridge, trees and lawns."""
import math
from arenberg import beam
from iten_landmarks import pictured,picture
from worldkit import Painted,lin,smooth

LAP=3318.75
RADIUS=109.
STRAIGHT=(LAP-2*math.pi*RADIUS)/2
PROFILE=[[0, 19], [480, 19.6], [920, 20.6], [1220, 21], [1440, 23.2], [1620, 21], [2140, 19.2], [2700, 19.8], [3060, 19.2], [3318.75, 19]]


def elevation(d):
    q=d%LAP
    for (a,z),(b,w) in zip(PROFILE,PROFILE[1:]):
        if q<=b:return z+(w-z)*smooth(a,b,q)


def centre(d):
    q=d%LAP
    if q<STRAIGHT:return q,0,0
    q-=STRAIGHT
    if q<math.pi*RADIUS:
        a=q/RADIUS
        return STRAIGHT+RADIUS*math.sin(a),RADIUS*(math.cos(a)-1),-a
    q-=math.pi*RADIUS
    if q<STRAIGHT:return STRAIGHT-q,-2*RADIUS,-math.pi
    a=math.pi+(q-STRAIGHT)/RADIUS
    return RADIUS*math.sin(a),RADIUS*(math.cos(a)-1),-a


def pos(d,side=0,up=0):
    x,y,h=centre(d)
    return x-side*math.sin(h),y+side*math.cos(h),elevation(d)+up


def route(course,theme,bc):
    st=bc.stages(course['plan']);length=st[-1]['to'];rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,h=centre(d);dh=centre(d+.5)[2]-centre(d-.5)[2]
        rows.append(dict(x=x,y=y,h=h,d=d,z=elevation(d),k=math.atan2(math.sin(dh),math.cos(dh)),g=100*(elevation(d+1)-elevation(d))))
    return rows,st,length,sum((s['to']-s['from'])*s['level'] for s in st)/length,1


WATER = 17.65
BRIDGE_X = 1331.


def shore(d):
    return 18 + 4*math.sin(d/106) + 2.5*math.sin(d/51) - 12*math.exp(-((d%LAP-3042)/47)**2)


def road(r,st,length,col,bc):
    asphalt=bc.Builder('ParkTarmac','terrain')
    asphalt.colours=[];asphalt.uvs=[]
    for i in range(math.ceil(LAP/3)):
        a=i*3;b=min(LAP,a+3)
        corners=((a,-3.65),(b,-3.65),(b,3.65),(a,3.65))
        picture(asphalt,[pos(d,v,.09) for d,v in corners],[(d/4,v/4) for d,v in corners])
    asphalt.build(col)


def land(r,col,theme,bc):
    lawn=bc.Builder('HydeParkLawns','terrain');lawn.colours=[]
    lake=bc.Builder('LongWater','terrain');lake.colours=[];lake.uvs=[]
    def row(d):
        w=shore(d)
        return [(pos(d,v,z-elevation(d)),lin(c)) for v,z,c in (
           (-w-3,WATER-.9,0x685E47),(-w,WATER+.12,0x948B70),(-w+1,WATER+.24,0xB4A789),
           (-w+2,elevation(d)-.35,0xAA9A80),(-7,elevation(d)-.14,0xC0AA8B),
           (-5,elevation(d)-.10,0x7A9149),(-3.55,elevation(d),0x6A8146),
           (3.55,elevation(d),0x85994B),(4.3,elevation(d)-.06,0x738B41),
           (14,elevation(d)-.1,0x8F9E52),(55,elevation(d)+.2,0x94A958),
           (115,elevation(d)+2,0x86A15D),(410,elevation(d)+4,0x718B55))]
    last=row(0)
    for i in range(1,math.ceil(LAP/6)+1):
        d=min(LAP,i*6);cur=row(d)
        for j in range(len(cur)-1):
            pts=(last[j],cur[j],cur[j+1],last[j+1]);lawn.quad(*(p for p,c in pts));lawn.colours.extend(c for p,c in pts)
        a,b=last[0][0],cur[0][0];mid=(STRAIGHT/2,-RADIUS,WATER)
        lake.faces.append(tuple(lake.v(t) for t in ((a[0],a[1],WATER),mid,(b[0],b[1],WATER))))
        lake.colours.extend([lin(0xFFFFFF)]*3);lake.uvs.extend([(a[0],a[1]),mid[:2],(b[0],b[1])]);last=cur
    lake.build(col)
    def height(x,y):
        _,idx,_=r.tree.find((x,y,0));return r.s[idx]['z']-.1
    return lawn.build(col),height


def serpentine_bridge(art, masonry):
    # Five elliptical ashlar arches run across the narrow western neck.
    stone=lin(0xA49B89);sun=lin(0xC6BBA7);mortar=lin(0x857E70);dark=lin(0x685F50)
    start=-202;span=39.3;deck=27.0
    for arch in range(5):
        cy=start+(arch+.5)*span
        for side in [-1,1]:
            face_x=BRIDGE_X+side*5.25
            for j in range(20):
                a=math.pi*j/20;b=math.pi*(j+1)/20
                def pt(angle,outer=False):
                    return (face_x,cy+math.cos(angle)*(span/2-(.86 if outer else 2.05)),
                            WATER-.55+(8.00 if outer else 6.76)*math.sin(angle))
                left,right=pt(a),pt(b);top_l,top_r=pt(a,True),pt(b,True)
                shade=sun if (arch*7+j)%4 else stone
                art.face((left,right,top_r,top_l),(dark,stone,shade,shade))
                spandrel=(top_l,top_r,(face_x,top_r[1],deck),(face_x,top_l[1],deck))
                picture(masonry,spandrel,[(pt[1]/7.6,pt[2]/4.8) for pt in spandrel])
                # Each joint follows the ellipse from intrados to extrados.
                if j%2==0:beam(art,left,top_l,.072,mortar)
                if side==1:
                    art.face((left,right,(face_x-10.5,right[1],right[2]),(face_x-10.5,left[1],left[2])),(dark,)*4)
            art.box((face_x,cy,deck+.34),(.46,span,.36),0,stone)
            for j in range(19):
                art.box((face_x,cy-span/2+(j+.5)*span/19,deck+.69),(.38,.32,.71),0,sun)
            art.box((face_x,cy,deck+1.39),(.68,span,.19),0,sun)
        art.box((BRIDGE_X,cy,deck-.14),(10.5,span,.5),0,stone)
        for end in ([-1,1] if arch==0 else [1]):
            y=cy+end*span/2
            art.box((BRIDGE_X,y,WATER-1.1),(11.2,3.9,deck-WATER+1.1),0,stone)
            for side in (-1,1):
                art.tube((BRIDGE_X+side*5.64,y,WATER-.7),1.97,1.77,4.25,mortar,sun,9)
                art.tube((BRIDGE_X+side*5.64,y,WATER+3.55),1.77,.12,1.15,sun,mortar,9)


def scenery(k):
    rng=k.rng;art=Painted(k);sky=Painted(k,'peaks')
    leaves=pictured(k,'LondonPlanes');walls=pictured(k,'ParkPavilion');people=pictured(k,'ParkVisitors')
    masonry=pictured(k,'BridgeAshlar');cafe=pictured(k,'LidoCafe');signs=pictured(k,'ParkSigns')
    cream=lin(0xE2D6B8);dark=lin(0x3D453B);wood=lin(0x826945);blue=lin(0x327EA6)
    white=lin(0xEEE9DC);green=lin(0x3E7856)
    def portrait(mesh,x,y,z,h,w,angle,uv):
        dx=math.cos(angle)*w/2;dy=math.sin(angle)*w/2
        picture(mesh,((x-dx,y-dy,z),(x+dx,y+dy,z),(x+dx,y+dy,z+h),(x-dx,y-dy,z+h)),uv)
    def tile(index,cols,rows):
        u=(index%cols)/cols;v=1-(index//cols+1)/rows
        return ((u+.003,v+.003),(u+1/cols-.003,v+.003),(u+1/cols-.003,v+1/rows-.003),(u+.003,v+1/rows-.003))
    for d in range(0,int(LAP),13):
        for row in (0,1,2):
            if row==0 and (d%187<51 or 460<d<750 or 1150<d<1450 or d<140):continue
            off=(rng.uniform(6.4,15) if row==0 else rng.uniform(32,73) if row==1 else rng.uniform(89,170))
            x,y,z=pos(d,off);h=rng.uniform(11.7,24.5);angle=rng.uniform(0,math.pi)
            for a in (angle,angle+math.pi/2):portrait(leaves,x,y,z-.38,h,h*rng.uniform(.9,1.15),a,tile((d//13+row)%2,2,1))
        if d%39==0 and not 3010<d<3070:
            x,y,z=pos(d,-4.62);art.tube((x,y,z),.14,.075,4.2,dark,dark,7)
            art.tube((x,y,z+4.16),.14,.3,.55,cream,white,4);art.tube((x,y,z+4.70),.40,0,.28,dark,dark,4)
        for v in (-4.65,):
            x,y,z=pos(d,v);art.tube((x,y,z),.048,.048,.75,dark,dark,6)
            for t in (.31,.67):beam(art,pos(d,v,t),pos(min(LAP,d+13),v,t),.05,dark)
        if d%39==0 and not 3005<d<3090 and not 1230<d<1470:
            x,y,z=pos(d,-8);a=centre(d)[2]+.65
            portrait(people,x,y,z-.16,1.7 if d%3 else 1.85,2.65,a,tile((d//39)%6,3,2))
    # Dappled light under the plane avenues, leaving open sky at the bridge and lawns.
    shade=pictured(k,'PlaneShade')
    for d in range(12,int(LAP),17):
        if d%187<51 or 450<d<765 or 1100<d<1470:continue
        x,y,z=pos(d,rng.uniform(-1.5,2.0),.14)
        angle=centre(d)[2];half=rng.uniform(2.0,4.0)
        pts=[pos(d+u,v,.135) for u,v in ((-half,-3.52),(half,-3.52),(half,3.52),(-half,3.52))]
        picture(shade,pts,tile(0,1,1))
    for d in list(range(460,765,12))+list(range(1975,2170,15)):
        for j in range(3):
            x,y,z=pos(d+rng.uniform(-2,2),5.1+j*4.1+rng.uniform(0,2));yaw=centre(d)[2]+rng.uniform(-.65,.65)
            def chair(u,v,h):return (x+u*math.cos(yaw)-v*math.sin(yaw),y+u*math.sin(yaw)+v*math.cos(yaw),z+h)
            for u in (-.37,.37):
                beam(art,chair(u,-.55,-.04),chair(u,.28,1.12),.052,wood)
                beam(art,chair(u,.55,-.04),chair(u,-.33,.54),.052,wood)
            for n in range(7):
                lo=-.33+n*.66/7;hi=lo+.66/7;c=green if n%2==0 else white
                art.face((chair(lo,-.33,.47),chair(hi,-.33,.47),chair(hi,.28,1.07),chair(lo,.28,1.07)),(c,)*4)
    # Boat sheds and the Lido sit at opposite banks and face the water.
    for d,w,depth,name in ((112,24,8,'boats'),(2150,34,9,'lido')):
        x,y,z=pos(d,-11);a=centre(d)[2]
        art.box((x,y,z-.5),(w,depth,3.8),a,cream);art.roof((x,y,z+3.3),w+1,depth+1,2.15,a,dark)
        for sign in (-1,1):
            for j in range(4):
                along=(j-1.5)*w/4;v=sign*(depth/2+.025)
                xx=x+along*math.cos(a)-v*math.sin(a);yy=y+along*math.sin(a)+v*math.cos(a)
                portrait(cafe if name=="lido" else walls,xx,yy,z-.15,3.43,w/4,a,tile(0,1,1))
        for side in (-1,1):
            xx=x+side*(w/2+.055)*math.cos(a);yy=y+side*(w/2+.055)*math.sin(a)
            portrait(cafe if name=="lido" else walls,xx,yy,z-.12,3.4,depth,a+math.pi/2,tile(0,1,1))
            xx+=side*.06*math.cos(a);yy+=side*.06*math.sin(a)
            portrait(signs,xx,yy,z+1.7,.82,4.5,a+math.pi/2,tile(0 if name=="boats" else 1,1,2))
        art.box((x+2*math.cos(a),y+2*math.sin(a),z+4.45),(1.1,.85,2.2),a,lin(0x976E58))
        if name=="lido":
            for j in range(6):
                xx,yy,zz=pos(d-14+j*5,-17)
                art.tube((xx,yy,zz-.3),.052,.052,2.55,wood,wood,6)
                art.tube((xx,yy,zz+2.25),1.55,.12,.62,green,cream,8)
                art.tube((xx,yy,zz+.74),.67,.67,.11,cream,cream,8)
        if name=='boats':
            for t in range(7):
                xx=x+2.5*t-26; yy=-shore(d)-2-(t%2)*2.2
                for pontoon in (-.58,.58):
                    art.box((xx,yy+pontoon,WATER+.08),(2.45,.34,.28),.09,blue)
                art.box((xx,yy,WATER+.33),(1.62,1.32,.18),.09,white)
                for v in (-.34,.34):
                    art.box((xx+.12,yy+v,WATER+.51),(.62,.44,.15),.09,blue)
                    art.box((xx+.32,yy+v,WATER+.64),(.14,.44,.29),.09,white)
                for v in (-.49,.49):art.tube((xx+.5,yy+v,WATER+.15),.29,.27,.28,blue,white,8)
            art.box((x-8,-shore(d)-1,WATER+.15),(24,2.5,.35),0,wood)
        else:
            for t in range(19):
                xx,yy,_=pos(d-28+t*3,-shore(d)-9)
                art.tube((xx,yy,WATER+.02),.19,.14,.17,white if t%2 else blue,white,7)
    serpentine_bridge(art,masonry)
    # Knightsbridge's pale slab and the narrower Park Lane hotels rise behind the park canopy.
    for idx,(x,y,w,depth,h) in enumerate(((1050,-435,23,17,77),(1031,-428,12,15,56),(282,-570,42,22,42),(360,-580,18,16,49),(466,-609,29,19,39),(712,-638,23,19,55))):
        sky.box((x,y,18),(w,depth,h),0,lin(0x9DA4A0))
        for floor in range(3,int(h)-1,3):
            sky.box((x,y+depth*.5+.04,18+floor),(w*.92,.08,1.1),0,lin(0x717D80))
        sky.box((x,y,18+h),(w*.73,depth*.8,3),0,lin(0x87918E))
    return {'efforts':0}

THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':3.65,
       'land':{'mid':0x91A166},'haze':0xCAD2C7,'sky':[0xD9E1D7,0xB7D0D9,0x98BFCC,0x87B1C2,0x739FB3],
       'light':[0xFFF0CC,1.56],'fill':[0xCDDCE1,0xAEB18D],'sun_altitude':.65,'sun_azimuth':1.05}
