"""Two racing directions on one level, groomed Rideau Canal Skateway."""
import math
from bisect import bisect_left
from arenberg import beam
from iten_landmarks import picture,pictured,site
from worldkit import Painted,lin
L=7720
R=10
ARC=math.pi*R
LAP=2*(L+ARC)
def heading(s):
    a=s*math.tau/L
    return .49*math.sin(2*a)+.26*math.sin(5*a)+.13*math.sin(9*a)
XY=[(0,0)]
for n in range(0,L,2):
    x,y=XY[-1];h=heading(n+1);XY.append((x+2*math.cos(h),y+2*math.sin(h)))
def centre(d):
    t=d%LAP
    if L<=t<L+ARC:
        a=(t-L)/R;x,y=XY[-1];return x+R*math.sin(a),y+R*(1-math.cos(a)),a
    if t>=2*L+ARC:
        a=(t-2*L-ARC)/R;return -R*math.sin(a),R*(1+math.cos(a)),math.pi+a
    back=t>L;s=2*L+ARC-t if back else t
    i=min(len(XY)-2,int(s//2));f=(s-2*i)/2
    x,y=XY[i];xx,yy=XY[i+1];h=heading(s)
    return x+(xx-x)*f-(2*R*math.sin(h) if back else 0),y+(yy-y)*f+(2*R*math.cos(h) if back else 0),h+(math.pi if back else 0)
def route(course,theme,bc):
    st=bc.stages(course['plan']);length=st[-1]['to'];rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,h=centre(d);dh=centre(d+.5)[2]-centre(d-.5)[2]
        rows.append(dict(d=d,x=x,y=y,z=54,h=h,k=math.atan2(math.sin(dh),math.cos(dh)),g=0))
    return rows,st,length,sum((s['to']-s['from'])*s['level'] for s in st)/length,1
def pos(d,v,z):
    s=max(0,min(L,d));x,y,h=centre(s);over=d-s
    return x+over*math.cos(h)-v*math.sin(h),y+over*math.sin(h)+v*math.cos(h),54+z
def edges(d):
    lake=math.exp(-((d-7560)/460)**2);return -22-78*lake,39+48*lake
def road(r,st,length,col,bc):
    m=bc.Builder('RideauIce','terrain');m.colours=[];m.uvs=[]
    for d in range(-100,L+100,5):
        a,b=edges(d);c,e=edges(d+5)
        pts=[pos(t,v,.041) for t,v in ((d,a),(d+5,c),(d+5,e),(d,b))]
        picture(m,pts,[(x/6,y/6) for x,y,z in pts])
    m.build(col)
def land(r,col,theme,bc):
    m=bc.Builder('RideauSnow','terrain');m.colours=[];m.uvs=[]
    for d in range(-100,L+100,10):
        a,b=edges(d);c,e=edges(d+10)
        for side,lo,hi in ((-1,a,c),(1,b,e)):
            old=None
            for off,z in ((-.4,.03),(1.3,1.04),(3.4,1.3),(6.1,.95),(7.2,2.6),(15,3.4),(65,3.3),(170,4.0)):
                w=.27*math.sin(d*.12+off)+.21*math.cos(d*.045-off)
                row=[pos(d,lo+side*off,z+w),pos(d+10,hi+side*off,z+.27*math.sin((d+10)*.12+off)+.21*math.cos((d+10)*.045-off))]
                if old:
                    pts=(*old,row[1],row[0]);picture(m,pts,[(x/8,y/8) for x,y,_ in pts])
                old=row
    return m.build(col),lambda x,y:54
def scenery(k):
    art=Painted(k);trees=pictured(k,'OttawaTrees');sky=pictured(k,'OttawaSkyline');carves=pictured(k,'WinterCarvings');boards=pictured(k,'RideauSigns')
    snow,cream,wood,green,iron,slate,brown,blue,ice,rose=map(lin,(0xE8EEF0,0xE8D7BC,0x9A694A,0x4B6D61,0x58616A,0x687787,0x887C69,0x839DAE,0xAEDCE8,0xB4A2D8))
    def panel(m,pts,uv=(0,0,1,1)):
        a,b,c,e=uv;picture(m,pts,((a,b),(c,b),(c,e),(a,e)))
    for j,d in enumerate(range(0,L,12)):
        for i,side in enumerate((-1,1)):
            edge=edges(d)[i];at,h=site(k,d,edge+side*7)
            art.box(at(0,0,.8),(12.2,1.2,1.72),h,brown)
            art.box(at(0,0,2.49),(12.25,1.32,.23),h,snow)
            for n in range(4):art.box(at(-5+3*n,side*-.62,1.64),(.08,.045,.82),h,slate)
            if (j%2==0 or (d<620 and side<0)) and not (4000<d<4340 and side==1):
                off=edge+side*(10+(j%4)*3);at,h=site(k,d,off)
                u=(j+i)%4/4;w=9+j%4;ht=11+j%5
                for axis in (0,1):
                    pts=[at(x if axis==0 else 0,x if axis else 0,z+2.8) for x,z in ((-w/2,0),(w/2,0),(w/2,ht),(-w/2,ht))]
                    panel(trees,pts,(u,0,u+.25,1))
            if j%8==1:
                at,h=site(k,d,edge+side*4.8)
                art.tube(at(0,0,.92),.12,.069,5.26,green,iron,8)
                art.tube(at(0,0,6.18),.28,.25,.48,cream,cream,8,cap=green)
            if j%39==2:
                at,h=site(k,d,edge+side*.7)
                for n in range(8):art.box(at(0,n*side*.6,.12), (4.65,.69,n*.30+.27),h,slate if n%2 else snow)
    # Stone towers flank the lift span; diagonal lattice and overhead beams read from below.
    for d,width,style in ((2292,20,1),(736,16,0),(5260,14,0)):
        at,h=site(k,d,8);sidewidth=47
        art.box(at(0,0,6.5),(width,sidewidth*2,.97),h,slate)
        for x in (-width/2+.4,width/2-.4):
            art.box(at(x,0,7.45),(.65,sidewidth*2,1.0),h,brown)
            for y in range(-44,46,4):
                beam(art,at(x,y,7.8),at(x,y+4,8.66),.095,iron)
                if style:beam(art,at(x,y+4,10.8),at(x,y,7.7),.14,iron)
            if style:beam(art,at(x,-35,10.9),at(x,35,10.9),.16,iron)
        for y in range(-42,44,5):art.box(at(0,y,6.14),(width+1,.39,.60),h,iron)
        for y in (-26,31):
            for x in (-width/2+2,width/2-2):
                if style:
                    art.tube(at(x,y,-.2),2.18,2.03,10,brown,cream,16)
                    art.tube(at(x,y,9.8),2.23,2.23,.64,snow,snow,16,cap=snow)
                    if x>0:art.tube(at(x,y,10.4),1.78,1.60,2.05,cream,cream,12,cap=slate)
                else:art.box(at(x,y,-.25),(3.4,4.1,6.9),h,brown)
    for j,d in enumerate((3990,4030,4079,4155,4220,4295)):
        side=1 if j%3 else -1;at,h=site(k,d,8*side+(14 if side>0 else -4))
        if j%2:
            art.box(at(0,0,.13),(9,5.3,2.9),h,wood)
            art.roof(at(0,0,3.01),9.5,5.8,1.9,h,snow)
            art.box(at(0,-side*2.72,1.42),(5.8,.14,1.23),h,green)
            panel(boards,[at(x,-side*2.8,z) for x,z in ((-3.9,2),(3.9,2),(3.9,3.06),(-3.9,3.06))],(0,0,1,.5) if j==3 else (0,.5,1,1))
        else:
            for x in (-4.5,4.5):
                for v in (-2.7,2.7):beam(art,at(x,v,.04),at(x,v,3.2),.078,iron)
            art.roof(at(0,0,3.08),9.3,5.7,2.05,h,snow)
    # A bear and owl are snow-carved; the heron and fish are translucent ice under a lit roof.
    for j,(d,v,ht,w) in enumerate(((6352,-10,4.7,7.2),(6373,-12,5.8,5.7),(4151,28,4.2,5.9),(4170,28,3.4,5.3))):
        at,h=site(k,d,v)
        art.box(at(0,0,.04),(w+1,3.3,.64),h,ice if j>1 else snow)
        u=(j%2)*.5;b=.5 if j<2 else 0
        for axis in (0,1):
            pts=[at(x if axis==0 else 0,x if axis else 0,z+.64) for x,z in ((-w/2,0),(w/2,0),(w/2,ht),(-w/2,ht))]
            panel(carves,pts,(u,b,u+.5,b+.5))
        if j==2:
            for x in (-9,17):
                for v2 in (-4.2,4.2):beam(art,at(x,v2,.06),at(x,v2,6.15),.15,iron)
            art.roof(at(4,0,6.13),28,9.3,2.7,h,slate)
    # Face the downtown skyline independently on both the inbound and outbound stretches.
    at,h=site(k,290,-94)
    panel(sky,[at(x,0,z) for x,z in ((-143,2),(143,2),(143,72),(-143,72))])
    return {'efforts':0}
THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':5,'terrain':{'sea':False},'land':{'mid':0xD5DEE2},'sky':[0xD9E7EB,0xC6DDE9,0xABCFE3,0x92BAD6,0x7DA8C9],'haze':0xBECDDA,'light':[0xFFF1D7,1.23],'fill':[0xDCEBF6,0xA9BACB],'sun_altitude':.28,'sun_azimuth':-.9}
