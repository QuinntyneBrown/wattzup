"""Chicago's Lakefront Trail from the park and harbours to North Avenue and Oak Street."""
import bisect
import math
import sys
from bondi import beam, words
from iten_landmarks import pictured, picture
from worldkit import Painted, lin, smooth


def heading(d):
    return (.14*math.sin(d/405)+.12*math.cos(d/181)
            +.42*(smooth(1360,1690,d)-smooth(1870,2230,d))
            +.58*(smooth(7530,7840,d)-smooth(8140,8450,d))
            -.40*(smooth(9230,9550,d)-smooth(10030,10340,d)))


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    x=y=0;z=185;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        stage=next((s for s in stages if d<s['to']),stages[-1])
        grade=(stage['level']-mean)*.00048 if 0<=d<length else 0
        rows.append(dict(d=d,x=x,y=y,z=z,h=heading(d),k=heading(d+.5)-heading(d-.5),g=100*grade))
        z+=grade*bc.STEP;x+=math.cos(heading(d+bc.STEP/2))*bc.STEP;y+=math.sin(heading(d+bc.STEP/2))*bc.STEP
    return rows,stages,length,mean,.048


def surface(r,st,length,col,theme):
    bc=sys.modules[type(r).__module__];mesh=bc.Builder('LakefrontTrail','terrain');mesh.colours=[]
    paint=bc.Builder('TrailPaint','paint');paint.colours=[]
    for i,p in enumerate(r.s[:-1]):
        for a,b,h,tone,out in ((-3.25,3.25,0,0x777879,mesh),(-.08,.08,.023,0xE5B44A,paint),
                               (-3.01,-2.91,.022,0xECEADC,paint),(2.91,3.01,.022,0xEEEBDD,paint),(1.84,1.91,.021,0xE4E2D9,paint)):
            if abs(a)<.1 and i%3==1:continue
            out.quad(r.at(i,a,h),r.at(i+1,a,h),r.at(i+1,b,h),r.at(i,b,h));out.colours.extend([lin(tone)]*4)
    mesh.build(col);paint.build(col)


def beach(d):
    return max(smooth(2800,3290,d)*(1-smooth(3910,4460,d)),smooth(7130,7470,d)*(1-smooth(8100,8650,d)))


def shore(d):
    return 8+beach(d)*(49+7*math.cos(d/142))


def terrain(r,col,theme,bc):
    field=bc.Builder('LincolnPark','terrain');field.colours=[]
    sand=bc.Builder('LakeSand','terrain');sand.colours=[]
    centres=[p['x'] for p in r.s];level=min(p['z'] for p in r.s)-.8
    def height(p,off):
        d=p['d'];edge=shore(d)
        if off>=3.25:
            t=smooth(3.25,edge+3,off)
            return p['z']-.16+(level-.24-p['z']+.16)*t
        return p['z']-.16+smooth(6,66,-off)*(1.4*math.cos(d/81+off/29)+.85*math.sin(d/44))
    def height_at(x,y):
        i=min(len(centres)-1,bisect.bisect_left(centres,x))
        for _ in range(2):
            p=r.s[i];delta=(x-p['x'])*math.cos(p['h'])+(y-p['y'])*math.sin(p['h'])
            i=r.index(p['d']+delta)
        p=r.s[i];off=-(x-p['x'])*math.sin(p['h'])+(y-p['y'])*math.cos(p['h'])
        return height(p,off)
    last=None
    for i in range(0,len(r.s),2):
        p=r.s[i];edge=shore(p['d']);row=[]
        for off in (-660,-330,-160,-65,-21,-8,-3,0,3.2,4.7,edge*.64+2,edge,edge+3.5):
            x,y,_=r.at(i,off);z=height(p,off)
            tone=0x8B9D60 if off<3 else 0xE2CDA0 if beach(p['d'])>.2 else 0xB4B8AD
            row.append(((x,y,z),lin(tone)))
        if last:
            for j,(a,b,c,e) in enumerate(zip(last,last[1:],row[1:],row)):
                mesh=sand if j>=8 and beach(p['d'])>.2 else field
                mesh.quad(a[0],e[0],c[0],b[0]);mesh.colours.extend((a[1],e[1],c[1],b[1]))
        last=row
    field.build(col);sand.build(col)
    return None,height_at


def skyline(k):
    facades=pictured(k,'MichiganTowers')
    paint=Painted(k,'peaks')
    level=min(p['z'] for p in k.road.s)-.6
    def tower(x,y,w,deep,height,width_top,variant):
        bottom=((x-w/2,y-deep/2),(x+w/2,y-deep/2),(x+w/2,y+deep/2),(x-w/2,y+deep/2))
        top=[(x+(a-x)*width_top,y+(b-y)*width_top) for a,b in bottom]
        u=(variant%2)*.5;v=(variant//2)*.5
        for j in range(4):
            a=bottom[j];b=bottom[(j+1)%4];c=top[(j+1)%4];e=top[j]
            # Map floors at a constant scale so the tall towers retain readable storeys.
            sections=max(1,round(height/58))
            def point(lo,hi,t):return (lo[0]+(hi[0]-lo[0])*t,lo[1]+(hi[1]-lo[1])*t,level+height*t)
            for f in range(sections):
                t=f/sections;t1=(f+1)/sections
                picture(facades,(point(a,e,t),point(b,c,t),point(b,c,t1),point(a,e,t1)),((u,v),(u+.5,v),(u+.5,v+.5),(u,v+.5)))
        paint.face(tuple((a,b,level+height) for a,b in top),(lin(0x61717B),)*4)
        return bottom,top
    for j in range(52):
        x=11980+k.rng.uniform(-1400,2800);y=k.rng.uniform(-1500,540)
        if abs(x-11100)<155 and abs(y+130)<190:continue
        tower(x,y,k.rng.uniform(28,63),k.rng.uniform(25,57),k.rng.uniform(43,177),k.rng.uniform(.87,1.0),2+j%2)
    # Nine bundled square tubes make Willis's staggered silhouette.
    for i,h in enumerate((145,205,270,205,365,315,145,315,270)):
        x=11990+(i%3)*25;y=-332+(i//3)*25
        tower(x,y,25.1,25.1,h,1,0)
    for x in (12006,12024):
        paint.tube((x,-308,level+365),1.5,.4,53,lin(0x737C7E),lin(0xC0C9C8),7)
    x,y=11100,-130
    ring,top=tower(x,y,78,52,296,.59,1)
    for j in range(4):
        a,b=ring[j],ring[(j+1)%4];e,c=top[j],top[(j+1)%4]
        def corner(base,tip,t):return (base[0]+(tip[0]-base[0])*t,base[1]+(tip[1]-base[1])*t,level+296*t)
        for n in range(5):
            beam(paint,corner(a,e,n/5),corner(b,c,(n+1)/5),2.0,2.0,lin(0x323E45))
            beam(paint,corner(b,c,n/5),corner(a,e,(n+1)/5),2.0,2.0,lin(0x323E45))
    for a in (-13,13):
        paint.tube((x+a,y,level+296),1.4,.45,44,lin(0x7A8283),lin(0xC4CACC),8)


def beach_house(k,art):
    d=3580;off=17;theta=heading(d)
    x,y,_=k.road.pos(d,off);z=k.height_at(x,y)
    def p(u,v,h):return (x+u*math.cos(theta)-v*math.sin(theta),y+u*math.sin(theta)+v*math.cos(theta),z+h)
    white=lin(0xE1E3DB);blue=lin(0x2F668B);dark=lin(0x446572)
    # A rounded bow returns into the two long portholed elevations.
    outline=[(-19,-4.9),(11,-4.9),(15,-4.3),(18,-2.7),(19,0),(18,2.7),(15,4.3),(11,4.9),(-19,4.9)]
    for a,b in zip(outline,outline[1:]+outline[:1]):
        for low,hi,c in ((-.55,.36,blue),(.36,3.15,white),(3.15,3.48,blue)):
            art.face((p(*a,low),p(*b,low),p(*b,hi),p(*a,hi)),(c,)*4)
        beam(art,p(*a,4.55),p(*b,4.55),.062,.065,white)
        beam(art,p(*a,4.13),p(*b,4.13),.046,.045,white)
        for j in range(max(1,int(math.dist(a,b)/1.7))):
            t=j/max(1,int(math.dist(a,b)/1.7));u=a[0]+(b[0]-a[0])*t;v=a[1]+(b[1]-a[1])*t
            art.tube(p(u,v,3.44),.043,.043,1.11,white,white,6)
    art.face(tuple(p(*a,3.47) for a in outline),(lin(0xC7B9A5),)*len(outline))
    for side in (-1,1):
        for u in range(-16,13,3):
            pts=[p(u+.49*math.cos(j*math.tau/16),side*4.93,1.98+.49*math.sin(j*math.tau/16)) for j in range(16)]
            art.face(pts if side<0 else pts[::-1],(blue,)*16)
            pts=[p(u+.36*math.cos(j*math.tau/16),side*4.96,1.98+.36*math.sin(j*math.tau/16)) for j in range(16)]
            art.face(pts if side<0 else pts[::-1],(dark,)*16)
    art.box(p(-4,0,3.5),(16,6.4,2.0),theta,white)
    art.box(p(-4,0,5.46),(16.8,7,.39),theta,blue)
    for u in range(-10,4,2):art.box(p(u,-3.21,4.1),(1.56,.07,.86),theta,dark)
    for u in (0,13):art.tube(p(u,0,3.55),.07,.06,4.45,white,white,8)


def scenery(k):
    art=Painted(k);lake=Painted(k,'sea');trees=pictured(k,'LakefrontTrees')
    skyline(k);beach_house(k,art)
    level=min(p['z'] for p in k.road.s)-.8
    last=None
    for d in range(-80,10650,19):
        row=[]
        for off,tone in ((shore(d)-1,0x58A9A7),(shore(d)+3,0x6ECAC2),(shore(d)+24,0x40A6B4),(shore(d)+130,0x288CA5),(6200,0x3F7F9F)):
            x,y,_=k.road.pos(d,off);row.append(((x,y,level),lin(tone)))
        if last:
            for a,b,c,e in zip(last,last[1:],row[1:],row):lake.face((a[0],e[0],c[0],b[0]),(a[1],e[1],c[1],b[1]))
        last=row
    for d in range(0,10600,17):
        if beach(d)<.7 and d>330:
            n=5
            for j in range(n):
                p=k.road.pos(d,4.95+j*1.19)
                top=p[2]-(p[2]-level)*(j+.25)/n
                art.box((p[0],p[1],top-.72),(17.5,1.31,.72),heading(d),lin(0xADB2AE if j%2 else 0xBBC0B8))
        side=-1
        off=side*k.rng.uniform(5.3,29);x,y,_=k.road.pos(d,off);z=k.height_at(x,y)-.26
        variant=k.rng.randrange(4);u=variant%2*.5;v=variant//2*.5
        h=k.rng.uniform(9,16);half=h*.57
        yaw=heading(d)+k.rng.uniform(-.54,.54);dx,dy=half*math.sin(yaw),half*math.cos(yaw)
        picture(trees,((x-dx,y-dy,z),(x+dx,y+dy,z),(x+dx,y+dy,z+h),(x-dx,y-dy,z+h)),((u,v),(u+.5,v),(u+.5,v+.5),(u,v+.5)))
    for d in (*range(3000,3960,27),*range(7460,8140,23)):
        x,y,_=k.road.pos(d,k.rng.uniform(11,max(13,shore(d)-4)));z=k.height_at(x,y)
        art.tube((x,y,z),.04,.04,2.12,lin(0xBBB7A9),lin(0xE1E0D6),6)
        for j in range(10):
            a=j*math.tau/10;b=(j+1)*math.tau/10
            tone=lin(0xE8D7BE if j%2 else 0x548BA0 if d%2 else 0xD66E50)
            art.face(((x,y,z+2.42),(x+1.26*math.cos(a),y+1.26*math.sin(a),z+1.94),(x+1.26*math.cos(b),y+1.26*math.sin(b),z+1.94)),(tone,)*3)
    for d in (3555,3617,7784,7875):
        x,y,_=k.road.pos(d,13.8);z=k.height_at(x,y)
        white=lin(0xEBE9DB)
        for i in (-1,1):
            for j in (-1,1):beam(art,(x+i*.88,y+j*.68,z),(x+i*.60,y+j*.54,z+2.46),.08,.09,white)
        art.box((x,y,z+2.35),(1.55,1.36,.17),0,white);art.box((x+.62,y,z+2.5),(.12,1.4,.77),0,white)
        for j in range(5):beam(art,(x-.97,y-.55,z+.31+j*.37),(x-.97,y+.55,z+.31+j*.37),.07,.07,white)
    for d in range(1610,1960,35):
        p=k.road.pos(d,26)
        art.box((p[0],p[1],level+.12),(2.2,31,.42),heading(d),lin(0x9E9581))
        for off in (18,27,37):
            x,y,_=k.road.pos(d+6,off)
            art.tube((x,y,level),.085,.045,9.6,lin(0x879495),lin(0xDBE0DB),7)
            art.box((x,y,level+.04),(5.4,1.68,.71),heading(d),lin(0xE2E5DC))
    return {'efforts':0}


THEME={'lay':route,'surface_builder':surface,'land_builder':terrain,'terrain':{'sea':False},'land':{'mid':0x7E9760},
       'road_half_width':3.25,'sky':[0xE2ECE6,0xCCE5E7,0x97CEE2,0x679FCE,0x3F80B9],
       'haze':0xC3D7DC,'light':[0xFFF2D9,1.63],'fill':[0xCADDE5,0xAD967D],
       'sun_altitude':.74,'sun_azimuth':.87,'sun_radius':48}
