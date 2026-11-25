"""The Atlanterhavsvegen island road, from the causeways to the Storseisundet cantilever."""
import math
from mathutils import Vector
from worldkit import Painted, lin, smooth

# Chainage, half length, rise above the approaches, span spacing.
BRIDGES=((1320,245,23,91),(3650,100,5.4,39),(4335,75,3.8,32),(4650,86,4.7,35),
         (4950,75,3.9,32),(7460,108,7.4,46),(9920,90,4.6,37),(11900,76,3.5,33))

def structure(d):
    for mid,half,rise,span in BRIDGES:
        if abs(d-mid)<=half:return mid,half,rise,span
    return None

def height(d):
    deck=3.4+.75*math.sin(d/391)+.4*math.cos(d/187)
    for mid,half,rise,span in BRIDGES:
        t=(d-mid)/(half+82)
        if abs(t)<1:deck+=rise*(.5+.5*math.cos(t*math.pi))
    return deck

def heading(d):
    return (.19*math.sin(d/510)+.12*math.sin(d/207)+.70*smooth(630,1060,d)
            -1.42*smooth(1135,1490,d)+.70*smooth(1620,2070,d))

def lay(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to']
    samples=[];x=-bc.LEAD_IN;y=0
    for i in range(math.ceil((bc.LEAD_IN+length+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        h=heading(d)
        if i:
            middle=heading(d-bc.STEP/2)
            x+=bc.STEP*math.cos(middle);y+=bc.STEP*math.sin(middle)
        samples.append(dict(d=d,x=x,y=y,z=height(d),h=h,k=(heading(d+.5)-heading(d-.5)),g=100*(height(d+.5)-height(d-.5))))
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    return samples,stages,length,mean,0

def sea(road,col,theme,bc):
    water=bc.Builder('Sea','sea')
    water.quad((-17000,-23000,0),(34000,-23000,0),(34000,23000,0),(-17000,23000,0))
    return water.build(col),lambda x,y:0

def road_deck(road,st,length,col,bc):
    asphalt=bc.Builder('Road','asphalt');white=bc.Builder('RoadPaint','paint')
    shoulder=bc.Builder('Rock fill and exposed bridge intrados','terrain');shoulder.colours=[]
    def pts(i,l,z):return road.at(i,l,z)
    def section(b,i,left,right,up):
        b.quad(pts(i,right,up),pts(i+1,right,up),pts(i+1,left,up),pts(i,left,up))
    for i,(a,b) in enumerate(zip(road.s,road.s[1:])):
        bridge=structure(a['d'])
        section(asphalt,i,4.9,-4.9,0)
        for lane in (-4.52,4.52):
            section(white,i,lane+.07,lane-.07,.011)
        if i%4==0:section(white,i,.07,-.07,.013)
        for side in (-1,1):
            levels=((4.9,-.025),(5.7,-.06),(6.1,-.26),(9.3,-2.1),(13,-6.8)) if not bridge else ((4.9,-.015),(5.68,-.015),(5.68,-.43),(3.9,-1.03))
            for j,((w,z),(ww,zz)) in enumerate(zip(levels,levels[1:])):
                def p(index,width,up):
                    # Submerged toes vary naturally while deck edges stay fair.
                    off=.52*math.sin(index*.7+side) if not bridge and width>=9.3 else 0
                    return pts(index,side*(width+off),up)
                f=(p(i,w,z),p(i+1,w,z),p(i+1,ww,zz),p(i,ww,zz))
                shoulder.quad(*(f if side>0 else f[::-1]))
                base=(0x778274,0x777870,0x535D5D,0x666B63) if not bridge else (0xA8ACA3,0x8C948E,0x687570)
                co=lin(base[j]);shoulder.colours.extend((co,)*4)
    for b in (asphalt,white,shoulder):b.build(col)

THEME={'lay':lay,'road_builder':road_deck,'land_builder':sea,'terrain':{'sea':True},'land':{'mid':0x677365},
       'sky':[0xAAB9B8,0x8BA7B1,0x6D8799,0x566D85,0x495A71],
       'haze':0xA1B0B4,'light':[0xFDE5B7,3.2],'fill':[0xC2D1DB,0x778981],
       'sun_altitude':.44,'sun_azimuth':2.45,'palette':{'asphalt':0x474B50},'chunks':{'Land':2}}

def beam(art,a,b,width,height,colour):
    start,end=Vector(a),Vector(b);axis=(end-start).normalized()
    across=axis.cross(Vector((0,0,1)))
    if across.length<.001:across=Vector((1,0,0))
    across.normalize();up=across.cross(axis).normalized()
    rim=[width*.5*u*across+height*.5*v*up for u,v in ((1,1),(-1,1),(-1,-1),(1,-1))]
    for j in range(4):
        n=(j+1)%4
        art.face((start+rim[j],end+rim[j],end+rim[n],start+rim[n]),(colour,)*4)

def skerry(art,x,y,rx,ry,h,seed):
    rings=[]
    for rad,z in ((1,-1.2),(.90,.28),(.72,.47),(.57,.72),(.31,.92),(.025,1)):
        row=[]
        for i in range(18):
            a=i*math.tau/18
            delta=1+.09*math.cos(3*a+seed)+.06*math.sin(7*a-seed)
            row.append((x+rx*rad*delta*math.cos(a),y+ry*rad*delta*math.sin(a),
                        z if z<0 else h*(z+.09*math.sin(4*a+seed)*rad)))
        rings.append(row)
    shade=(0x505A59,0x8B8D80,0x929486,0x798458,0x82895D)
    for j in range(5):
        for i in range(18):
            n=(i+1)%18
            a,b,c,d=rings[j][i],rings[j][n],rings[j+1][n],rings[j+1][i]
            co=lin(shade[j]);art.face((a,b,c,d),(co,)*4)
    art.face(rings[-1],(lin(shade[-1]),)*18)
    # Pale striations and dark joints run along the same strike on the exposed granite.
    for j in (2,5,8,13,16):
        n=(j+1)%18
        a,b,c,d=rings[2][j],rings[2][n],rings[3][n],rings[3][j]
        def lerp(u,v,t):return tuple(u[i]+(v[i]-u[i])*t for i in range(3))
        tint=lin(0xA9AA94 if j%2 else 0x636E69)
        art.face((lerp(a,d,.36),lerp(b,c,.52),lerp(b,c,.57),lerp(a,d,.40)),(tint,)*4)

def rorbu(art,x,y,z,yaw):
    red,white,slate,dark=map(lin,(0x954B40,0xD6D1BC,0x515C5A,0x475654))
    def p(u,v,h):return (x+u*math.cos(yaw)-v*math.sin(yaw),y+u*math.sin(yaw)+v*math.cos(yaw),z+h)
    art.box(p(0,0,-.1),(9.4,5.6,3.6),yaw,red);art.roof(p(0,0,3.5),9.4,5.8,2.2,yaw,slate)
    for side in (-1,1):
        for u in (-3.1,0,3.1):
            art.box(p(u,side*2.81,1.25),(1.25,.12,1.32),yaw,white)
            art.box(p(u,side*2.89,1.36),(.96,.09,1.05),yaw,dark)
        for u in (-4.68,4.68):art.box(p(u,side*2.77,0),(.16,.25,3.5),yaw,white)

def scenery(k):
    art=Painted(k);far=Painted(k,'peaks');rng=k.rng
    steel,shadow,concrete,pale=map(lin,(0x909C9D,0x677575,0x9CA398,0xB3B7A8))
    def at(d,l,z=0):return k.road.pos(d,l,z)
    # Twin rails with a shaded flange and separate I-posts on each side.
    for d in range(-72,int(k.length)+80,8):
        for side in (-1,1):
            for h,w,co in ((.75,.19,steel),(.59,.13,shadow)):
                beam(art,at(d,side*5.25,h),at(d+8,side*5.25,h),w,.11,co)
            st=at(d,side*5.29,.01);art.box(st,(.11,.12,.78),heading(d),steel)
    for mid,half,rise,span in BRIDGES:
        main=mid==1320
        # The main span narrows and deepens over two cantilever piers.
        for d in range(mid-half,mid+half,4):
            def depth(m):
                piers=(mid-span/2,mid+span/2)
                return 1.12+(4.6 if main else 1.15)*math.exp(-min(abs(m-p) for p in piers)/(30 if main else 15))
            for side in (-1,1):
                f=(at(d,side*4.3,-.45),at(d+4,side*4.3,-.45),at(d+4,side*3.65,-depth(d+4)),at(d,side*3.65,-depth(d)))
                art.face(f if side>0 else f[::-1],(pale,pale,concrete,concrete))
            if mid==3650 and d%8<4:
                beam(art,at(d,-6.68,.92),at(d+8,-6.68,.92),.075,.085,steel)
                art.box(at(d,-6.7,.03),(.085,.09,.9),heading(d),steel)
                art.box(at(d+4,-5.98,-.13),(8,1.58,.22),heading(d),concrete)
        for m in range(-2,3):
            d=mid+(m+.5)*span
            if abs(d-mid)>half-11:continue
            xx,yy,z=at(d,0,0)
            art.box((xx,yy,-.65),(3.4,5.6,1.92),heading(d),shadow)
            for side in (-1,1):
                beam(art,at(d,side*.9,-z+.4),at(d,side*2.6,-1.32),1.65,1.35,concrete)
    for d in range(-90,int(k.length)+200,52):
        for side in (-1,1):
            off=side*rng.uniform(35,197);xx,yy,_=at(d,off)
            skerry(art,xx,yy,rng.uniform(12,48),rng.uniform(11,31),rng.uniform(2.1,9.2),rng.uniform(0,6))
    for d,side in ((375,-1),(668,1),(2260,-1),(3330,1),(4020,-1),(5920,-1),(8530,1),(11020,-1)):
        x,y,_=at(d,31*side);skerry(art,x,y,26,15,3.6,.4);rorbu(art,x,y,3.3,heading(d)+.34)
    # Walkway and shore anglers, with peaked caps, bright jackets, boots and rods.
    for d,l in ((3576,-6.0),(3611,-6.0),(3635,-6.1),(3669,-5.96),(3712,-6.0),(4220,6.5)):
        def stand(u,v,h):return at(d+u,l+v,h+.12)
        coat=lin(rng.choice((0xA96746,0x71846E,0xA38A4E,0x516C78)))
        trouser=lin(0x4E5C5B);skin=lin(0xBF9578)
        for u in (-.125,.125):
            beam(art,stand(u,0,0),stand(u*.7,-.03,.85),.16,.15,trouser)
            art.box(stand(u,-.07,-.02),(.19,.31,.14),heading(d),lin(0x414B4A))
        art.tube(stand(0,0,.77),.22,.245,.64,coat,coat,9,coat)
        art.tube(stand(0,-.02,1.40),.13,.135,.25,skin,skin,9,skin)
        art.tube(stand(0,-.055,1.61),.17,.12,.105,trouser,trouser,8,trouser)
        for u in (-.19,.19):
            beam(art,stand(u,0,1.27),stand(u*1.15,-.20,1.05),.12,.13,coat)
            beam(art,stand(u*1.15,-.20,1.05),stand(u*.4,-.45,1.19),.10,.11,coat)
        p0,p1,p2=stand(.05,-.25,.93),stand(.15,-2.1,2.67),stand(.22,-3.48,3.22)
        beam(art,p0,p1,.035,.035,trouser);beam(art,p1,p2,.021,.021,trouser)
        beam(art,p2,stand(.28,-5.4,-2.1),.012,.012,lin(0x99A6A2))
    # One continuous mainland sill under irregular summits, with folded faces on the seaward side.
    ridge=[]
    for j in range(161):
        x=-3500+j*155
        h=135+85*math.sin(j*.15)+45*math.cos(j*.52)+26*math.sin(j*1.13)
        y=1900+170*math.sin(j*.13)
        ridge.append(((x,y-125, -9),(x+23*math.cos(j),y-50,h*.47),(x,y,h)))
    for j,(a,b) in enumerate(zip(ridge,ridge[1:])):
        co=lin(0x8A9B9B);top=lin(0x9CAAA7);shade=lin(0x839596)
        art_pts=(a[0],b[0],b[1],a[1])
        far.face(art_pts,(co,co,shade,shade))
        far.face((a[1],b[1],a[2]),(shade,shade,top))
        far.face((b[1],b[2],a[2]),(co,top,top))
    return {'efforts':0}
