"""Three circuits of Via dei Fori Imperiali, the Colosseum and the Palatine."""
import bisect
import math
from iten_landmarks import pictured, picture, site
from worldkit import Painted, lin, smooth

LAP=14980.8333333333/3
PROFILE=((0,22),(470,23),(970,25),(1350,24),(1900,29),(2600,37),(3500,30),(4250,24),(LAP,22))
STREETS=((0,0),(140,0),(450,0),(750,0),(955,0),(1050,-4),(1140,-24),(1240,-78),
         (1285,-169),(1280,-340),(1330,-520),(1430,-730),(1490,-880),(1430,-965),
         (1080,-1000),(820,-1020),(580,-970),(330,-1005),(120,-995),(-135,-860),
         (-160,-635),(-149,-395),(-164,-175),(-130,-52))

def spline(i,t):
    a,b,c,d=[STREETS[(i+j)%len(STREETS)] for j in (-1,0,1,2)]
    return tuple(.5*(2*b[n]+(-a[n]+c[n])*t+(2*a[n]-5*b[n]+4*c[n]-d[n])*t*t+
                       (-a[n]+3*b[n]-3*c[n]+d[n])*t**3) for n in (0,1))


RAW=[spline(i,j/40) for i in range(len(STREETS)) for j in range(40)]+[STREETS[0]]
CHAIN=[0.]
for a,b in zip(RAW,RAW[1:]):CHAIN.append(CHAIN[-1]+math.dist(a,b))
SCALE=LAP/CHAIN[-1]


def height(d):
    d%=LAP
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*smooth(a,b,d)


def centre(d):
    s=(d%LAP)/SCALE;i=min(len(RAW)-2,bisect.bisect_right(CHAIN,s)-1)
    a,b=RAW[i:i+2];f=(s-CHAIN[i])/(CHAIN[i+1]-CHAIN[i])
    return tuple((a[n]+(b[n]-a[n])*f)*SCALE for n in (0,1))


def heading(d):
    a,b=centre(d-.5),centre(d+.5)
    return math.atan2(b[1]-a[1],b[0]-a[0])


def pos(d,v=0,up=0):
    x,y=centre(d);h=heading(d)
    return x-v*math.sin(h),y+v*math.cos(h),height(d)+up


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,z=pos(d);h=heading(d);diff=heading(d+.5)-heading(d-.5)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=math.atan2(math.sin(diff),math.cos(diff)),g=100*(height(d+bc.STEP)-z)/bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,.04


def road(r,st,length,col,bc):
    street=bc.Builder('Sampietrini','terrain');street.uvs=[];street.colours=[]
    walk=bc.Builder('RomanPavements','terrain');walk.colours=[]
    for i in range(math.ceil(LAP/3)):
        d=i*3;e=min(LAP,d+3)
        width=6.2+1.25*(1-smooth(1130,1300,d))
        for a,b,up,layer in ((-width,width,.12,street),(-width-4.6,-width,.23,walk),(width,width+4.6,.23,walk)):
            dv=((d,a),(e,a),(e,b),(d,b));pts=[pos(t,v,up) for t,v in dv]
            if layer is street:picture(street,pts,[(v/4,t/4) for t,v in dv])
            else:walk.quad(*pts);walk.colours.extend([lin(0xB8AA95)]*4)
    street.build(col);walk.build(col)


def land(r,col,theme,bc):
    mesh=bc.Builder('PalatineEarth','terrain');mesh.colours=[]
    def ground(x,y):
        _,i,dist=r.tree.find((x,y,0));d=r.s[i]['d']%LAP;z=height(d)-.35
        forum=smooth(15,40,abs(y))*(1-smooth(160,230,abs(y)))*smooth(164,290,x)*(1-smooth(875,1005,x))
        hill=smooth(28,110,dist)*math.exp(-((x-1040)/380)**2-((y+543)/290)**2)
        return z-6*forum+25*hill
    for x in range(-450,1860,20):
        for y in range(-1310,370,20):
            vs=[(x+u,y+v) for u,v in ((0,0),(20,0),(20,20),(0,20))]
            mesh.quad(*[(u,v,ground(u,v)-.9) for u,v in vs])
            mesh.colours.extend(lin(0x9D9F65+int(4*math.sin(u/89+v/64))*0x010101) for u,v in vs)
    for i in range(math.ceil(LAP/5)):
        d=i*5;e=min(LAP,d+5)
        for a,b in ((-19,-11),(-11,11),(11,19)):
            vs=[pos(t,v) for t,v in ((d,a),(e,a),(e,b),(d,b))]
            mesh.quad(*[(x,y,ground(x,y)-.12) for x,y,z in vs])
            mesh.colours.extend([lin(0xABA08B)]*4)
    mesh.build(col)
    return None,ground


def scenery(k):
    art=Painted(k);stone=pictured(k,'RomanTravertine');brick=pictured(k,'ImperialBrick')
    relief=pictured(k,'ArchReliefs');trees=pictured(k,'RomanPines');people=pictured(k,'RomanWalkers')
    palazzi=pictured(k,'RomanPalazzi');market=pictured(k,'MarketBays');monument=pictured(k,'MarbleMonument');horse=pictured(k,'BronzeHorse')
    def panel(mesh,pts,s=1,t=1):
        picture(mesh,pts,((0,0),(s,0),(s,t),(0,t)))
    def block(mesh,at,u,v,z,w,d,h,tex=3):
        for a,b in (((-w/2,-d/2),(w/2,-d/2)),((w/2,-d/2),(w/2,d/2)),
                    ((w/2,d/2),(-w/2,d/2)),((-w/2,d/2),(-w/2,-d/2))):
            panel(mesh,[at(u+x,v+y,z+zz) for (x,y),zz in ((a,0),(b,0),(b,h),(a,h))],math.dist(a,b)/tex,h/tex)
        panel(mesh,[at(u+x,v+y,z+h) for x,y in ((-w/2,-d/2),(w/2,-d/2),(w/2,d/2),(-w/2,d/2))],w/tex,d/tex)
    cx,cy,cz=1190,63,24
    def ellipse(a,depth,z):return (cx+(94-depth)*math.cos(a),cy+(77-depth)*math.sin(a),cz+z)
    # Every arch is open through the wall. The second ring filters light through the arcade.
    for depth,n,base,height0 in ((0,72,0,10),(6,64,0,8.5)):
        for j in range(n):
            angle=(j+.5)*math.tau/n
            tiers=3 if depth==0 and (j>n*.45 and j<n*.77) else 4 if depth==0 and (j<n*.31 or j>n*.86) else 2 if depth else 3
            if depth==0 and j>=n*.50 and j<n*.68:tiers=2
            for tier in range(tiers):
                bottom=base+tier*height0;hi=bottom+height0
                def p(t,w,z):return ellipse((j+t)*math.tau/n,depth+w,z)
                # The piers flare below the arch springs and narrow under the entablature.
                for a,b in ((0,.20),(.80,1)):
                    panel(stone,[p(a,0,bottom),p(b,0,bottom),p(b,0,hi),p(a,0,hi)],.65,height0/3)
                for i in range(10):
                    a=math.pi*(1-i/10);b=math.pi*(1-(i+1)/10)
                    u=.5+.30*math.cos(a);v=.5+.30*math.cos(b)
                    z=bottom+height0*(.48+.29*math.sin(a));w=bottom+height0*(.48+.29*math.sin(b))
                    panel(stone,[p(u,0,z),p(v,0,w),p(v,0,hi),p(u,0,hi)],.27,.86)
                    arch=(p(u,0,z),p(u,2.9,z),p(v,2.9,w),p(v,0,w))
                    art.face(arch,(lin(0xA79370),lin(0x735C45),lin(0x75604A),lin(0xA79675)))
                for u in (.20,.80):
                    art.face((p(u,0,bottom),p(u,2.9,bottom),p(u,2.9,bottom+.48*height0),p(u,0,bottom+.48*height0)),(lin(0x9A866A),)*4)
                panel(stone,[p(0,-.34,hi-.55),p(1,-.34,hi-.55),p(1,-.34,hi+.10),p(0,-.34,hi+.10)],2,.24)
                panel(stone,[p(0,-.34,hi+.10),p(1,-.34,hi+.10),p(1,3,hi+.10),p(0,3,hi+.10)],2,.87)
                if depth==0:
                    loc=p(.02,-.18,bottom+.35)
                    art.tube(loc,.48,.39,height0-.95,lin(0xC9B798),lin(0xDCCCAB),8)
                    art.tube(p(.02,-.18,hi-.95),.64,.66,.48,lin(0xC2AE89),lin(0xD5C5A3),8)
                    art.tube(p(.02,-.18,bottom+.10),.63,.59,.38,lin(0xC2AE89),lin(0xD5C5A3),8)
            if depth==0 and tiers==4:
                top=tiers*height0
                panel(stone,[p(0,0,top),p(1,0,top),p(1,0,top+4.8),p(0,0,top+4.8)],2,1.2)
                panel(stone,[p(.43,-.05,top+1.4),p(.63,-.05,top+1.4),p(.63,-.05,top+3),p(.43,-.05,top+3)],.25,.4)
    # The brick hemicycle and vaulted shop bays of Trajan's Market overlook the sunken Forum.
    mx,my=542,62
    for j in range(23):
        a=math.pi*(j+.5)/23;u=mx+50*math.cos(a);v=my+36*math.sin(a)
        yaw=math.atan2(36*math.cos(a),-50*math.sin(a))
        def bay(x,y,z):return (u+x*math.cos(yaw)-y*math.sin(yaw),v+x*math.sin(yaw)+y*math.cos(yaw),16+z)
        block(brick,bay,0,0,0,7.6,6.4,14)
        for level in (0,5.4):
            art.box(bay(0,3.23,level),(3.35,.13,3.29),yaw,lin(0x624A3B))
            art.tube(bay(0,3.05,level+2.85),1.8,1.6,.40,lin(0x8F6650),lin(0xA77859),9)
        block(stone,bay,0,0,12.9,7.9,6.7,.48)
    def tower(x,y,z):return (614+x,112+y,19+z)
    block(brick,tower,0,0,0,13.4,12.4,32);block(brick,tower,0,0,32,10.6,9.9,7.7)
    for side in (-1,1):
        for d in range(255,950,22):
            x,y,z=pos(d,side*(30+8*math.sin(d/61)))
            z=k.height_at(x,y);tall=k.rng.uniform(1.6,8.2)
            art.box((x,y,z-.6),(2.7,2.7,1.2),0,lin(0xC9B793))
            art.tube((x,y,z+.58),.88,.74,tall,lin(0xBCAD92),lin(0xD3C4AA),12)
            if tall>5.8:art.box((x,y,z+tall+.55),(2.05,2.05,.55),0,lin(0xD2C3A6))
            at,h=site(k,d,side*49)
            block(brick,at,0,0,-7,7+k.rng.random()*8,2,3+k.rng.random()*5)
    # Vittoriano at Piazza Venezia. Ascending stairs, central statue, deep marble portico and quadrigas.
    at,h=site(k,101,-39)
    for j in range(12):
        block(stone,at,0,-j*.77,.05+j*.43,69-j*.77,24-j*.97,.52)
    block(stone,at,0,-12,5.3,58,15,6)
    for side in (-1,1):
        block(stone,at,side*29,-13,5.3,13,16,12.1)
        block(stone,at,side*29,-13,17.4,14,17,1)
    for u in range(-23,24,4):
        art.tube(at(u,-6,10.9),.83,.69,10.2,lin(0xDEDACE),lin(0xF3ECDD),12)
        art.box(at(u,-6,20.8),(1.96,1.96,.77),h,lin(0xE8E0CA))
    block(stone,at,0,-11,21.5,66,13,2.35)
    for side in (-1,1):
        block(stone,at,side*29,-12,23.8,13.9,13,1.2)
        for j in range(4):
            uu=side*29+(j-1.5)*1.24
            art.box(at(uu,-10,25.65),(.8,2.4,1.24),h,lin(0x4F594C))
            art.box(at(uu,-8.9,26.4),(.57,.87,.85),h,lin(0x50594D))
            for v in (-10.83,-9.25):art.box(at(uu,v,25),(.3,.38,.93),h,lin(0x485446))
        art.box(at(side*29,-12.73,25.0),(2.8,2.3,1.9),h,lin(0x4C5649))
        art.tube(at(side*29,-12.6,26.77),.39,.34,2.1,lin(0x52604F),lin(0x56634E),8)
    # The broad stair and silhouetted quadrigas read together along the oblique approach.
    panel(monument,[at(u,-4.9,z) for u,z in ((-39,-.1),(39,-.1),(39,27.8),(-39,27.8))])
    block(stone,at,0,5.9,.15,8.2,4.1,4.2)
    panel(horse,[at(u,5.9,z) for u,z in ((-4.9,4.35),(4.9,4.35),(4.9,10.25),(-4.9,10.25))])
    # Front elevations face the traffic on the near side of the excavated market.
    for j in range(15):
        a,b=math.pi*j/15,math.pi*(j+1)/15
        def frontage(t,z):return (mx+47*math.cos(t),my+32*math.sin(t),16+z)
        panel(market,[frontage(a,.1),frontage(b,.1),frontage(b,11.5),frontage(a,11.5)],.45,1)
    # Warm rendered palazzi, roof terraces and church domes enclose the city beyond the ruins.
    for first,last,side,step,setback in ((-70,240,1,24,29),(273,918,-1,34,85),(1680,2460,1,39,54),(2750,4550,-1,49,38),(4200,4910,1,41,39)):
        for d in range(first,last,step):
            near,h0=site(k,d,side*(setback+k.rng.uniform(-3,4)))
            w=step*k.rng.uniform(.73,.97);high=k.rng.uniform(12,22);depth=k.rng.uniform(10.5,14)
            art.box(near(0,0,-1.1),(w,depth,high+1.1),h0,lin(k.rng.choice((0xCC9D70,0xC99D77,0xD1AB87))))
            v=-side*(depth/2+.05)
            panel(palazzi,[near(x,v,z) for x,z in ((-w/2,0),(w/2,0),(w/2,high),(-w/2,high))])
            art.roof(near(0,0,high),w+.48,depth+.74,1.9,h0,lin(0xAB755F))
            for end in (-1,1):
                for z in range(2,int(high)-2,4):
                    for y in (-depth*.27,depth*.18):art.box(near(end*(w/2+.05),y,z),(.1,1.1,2.0),h0,lin(0x786C5E))
    for d,side in ((670,-89),(208,96),(2350,86),(3490,-97)):
        near,h0=site(k,d,side);rc=lin(0xAC8066);pale=lin(0xD4BD99)
        art.box(near(0,0,0),(19,17,14.5),h0,pale)
        for z,r1,r2,hi in ((14,8.4,8.4,4.5),(18.5,8.4,7.7,3.2),(21.7,7.7,5.4,3.3),(25,5.4,2.2,2.3),(27.3,2.2,1.3,2.1)):
            art.tube(near(0,0,z),r1,r2,hi,rc,rc,18)
        art.tube(near(0,0,29.4),1.3,.15,2.3,pale,pale,10)
    # Arch of Constantine, three through passages and four detached Corinthian columns on each face.
    at,h=site(k,1386,17.5)
    for u,w in ((-11.1,2.7),(-4.9,2.5),(4.9,2.5),(11.1,2.7)):
        block(stone,at,u,0,-.4,w,6.9,14.1)
    for mid,span,spring in ((0,3.68,6.6),(-8,1.94,4.2),(8,1.94,4.2)):
        for j in range(16):
            a=j*math.pi/16;b=(j+1)*math.pi/16
            x,u=mid+span*math.cos(a),mid+span*math.cos(b);z,w=spring+span*math.sin(a),spring+span*math.sin(b)
            for v in (-3.46,3.46):panel(stone,[at(x,v,z),at(u,v,w),at(u,v,14),at(x,v,14)],.40,1.35)
            art.face((at(x,-3.46,z),at(u,-3.46,w),at(u,3.46,w),at(x,3.46,z)),(lin(0xB4A88C),)*4)
    block(stone,at,0,0,13.6,25.4,7.6,3.3)
    for side in (-1,1):
        for u in (-11,-5,5,11):
            block(stone,at,u,side*4.0,-.12,1.6,1.7,2.1)
            art.tube(at(u,side*4,1.95),.48,.40,8.6,lin(0xBFAF91),lin(0xD3C3A6),12)
            block(stone,at,u,side*4,10.55,1.5,1.54,.7)
            panel(relief,[at(u+x,side*3.82,z) for x,z in ((-1.25,14.1),(1.25,14.1),(1.25,16.4),(-1.25,16.4))])
    # Palatine brick remains, broken buttresses and the tree-lined public avenue.
    for d in range(1720,2490,31):
        at,h=site(k,d,-k.rng.uniform(28,51));block(brick,at,0,0,0,22,3.4,k.rng.uniform(3.8,9.2))
        block(brick,at,8,-2.8,0,3,5.8,k.rng.uniform(3.1,6.8))
    def sprite(mesh,at,index,w,h,cols,rows,turn):
        dx=w*math.cos(turn)*.5;dy=w*math.sin(turn)*.5
        u=index%cols/cols;v=1-(index//cols+1)/rows
        picture(mesh,[at(-dx,-dy,0),at(dx,dy,0),at(dx,dy,h),at(-dx,-dy,h)],
                ((u+.003,v+.003),(u+1/cols-.003,v+.003),(u+1/cols-.003,v+1/rows-.003),(u+.003,v+1/rows-.003)))
    for side in (-1,1):
        for d in range(150,int(LAP),27):
            if (950<d<1500 or 280<d<780 and side==1) and k.rng.random()<.86:continue
            at,h=site(k,d,side*k.rng.uniform(12,18));height0=k.rng.uniform(11,18);width=height0*k.rng.uniform(.71,1.11)
            j=k.rng.randrange(3);angle=k.rng.uniform(.6,1.4)
            for rot in (angle,angle+math.pi/2):sprite(trees,at,j,width,height0,3,1,rot)
        for d in range(25,1590,7):
            if k.rng.random()<.35:continue
            at,h=site(k,d+k.rng.uniform(-1.5,1.5),side*k.rng.uniform(8.3,12))
            sprite(people,at,k.rng.randrange(3),k.rng.uniform(2.7,4.5),k.rng.uniform(1.69,2.05),3,1,k.rng.uniform(.55,1.5))
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':6.2,
       'land':{'mid':0xB2A582},'sky':[0xEAD1AB,0xE0DCC7,0xBFD5D9,0x8EBACA,0x76A2BD],
       'haze':0xDFCEAA,'light':[0xFFE1AB,1.8],'fill':[0xE4E0CB,0xA99778],
       'sun_altitude':.34,'sun_azimuth':2.2,'sun_radius':125}
