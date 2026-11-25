"""East Coast Road above the Atlantic reef at Bathsheba, Saint Joseph, Barbados."""
import math
import bpy
from functools import lru_cache
from mathutils import Vector
from worldkit import Painted,lin,smooth

def head(d):
    return -.63*math.exp(-((d-1180)/98)**2)-.50*math.exp(-((d-2150)/93)**2)-.49*math.exp(-((d-8050)/94)**2)+.22*math.sin(d/390)+.25*math.sin(d/221)-.31*math.sin(d/93)*(.35+.65*math.exp(-((d-1230)/400)**2))

def elevation(d):
    return 4.6+4.3*math.sin(d/525)**2+7.4*math.exp(-((d-5210)/530)**2)

def route(course,theme,bc):
    st=bc.stages(course['plan']);length=st[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in st)/length
    x=-bc.LEAD_IN;y=0;points=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        if i:
            yaw=head(d-bc.STEP/2);x+=bc.STEP*math.cos(yaw);y+=bc.STEP*math.sin(yaw)
        points.append(dict(d=d,x=x,y=y,z=elevation(d),h=head(d),k=head(d+.5)-head(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
    return points,st,length,mean,0

def shore(d):
    return 23.0+7.3*math.sin(d/211)+5.2*math.cos(d/146)

def surface(d,l):
    road=elevation(d)
    if l>0:
        broad=max(0,l-4)
        return road-.19+.06*broad+.25*broad*smooth(28,150,broad)+.17*broad*math.sin(d/350+l/104)*smooth(15,120,broad)
    v=-l;edge=shore(d)
    if v<4:return road-.18
    if v<edge:return (road-.18)*(1-smooth(4,edge,v))+.32*smooth(4,edge,v)
    return .32-(v-edge)*.127

def land(road,col,theme,bc):
    b=bc.Builder('Beach, reef shelf and terraces','terrain');b.colours=[]
    for i in range(0,len(road.s)-1,3):
        end=min(i+3,len(road.s)-1)
        for a,c in zip((-120,-65,-40,-30,-24,-18,-12,-7,-4,0,5,13,25,47,85,160,290),(-65,-40,-30,-24,-18,-12,-7,-4,0,5,13,25,47,85,160,290,570)):
            pts=[];cols=[]
            for j,l in ((i,a),(end,a),(end,c),(i,c)):
                d=road.s[j]['d'];z=surface(d,l)
                pts.append(road.at(j,l,z-road.s[j]['z']))
                grain=math.sin(d/68+l*.28)+.53*math.sin(d/21-l/13)
                if -l>shore(d)-7: hue=0xECCE99 if grain>0 else 0xE5D5AE
                elif l<-6:hue=0xC6BD85 if grain>.2 else 0xA4AD72
                else:hue=0x789451 if grain>0 else 0x638549
                cols.append(lin(hue))
            b.quad(*pts);b.colours.extend(cols)
    sea=bc.Builder('Atlantic Ocean','sea')
    sea.quad((-8000,-10000,0),(18000,-10000,0),(18000,4800,0),(-8000,4800,0));sea.build(col)
    return b.build(col),lambda x,y:0

def road(road,st,length,col,bc):
    asphalt=bc.Builder('Road','asphalt');mark=bc.Builder('RoadPaint','paint')
    for i in range(len(road.s)-1):
        d=road.s[i]['d'];w=3.66+.29*math.sin(d/515)
        def band(b,l,r,z):b.quad(road.at(i,r,z),road.at(i+1,r,z),road.at(i+1,l,z),road.at(i,l,z))
        band(asphalt,w,-w,0)
        if 220<d%1500<450 and i%3==0:band(mark,.045,-.045,.014)
    asphalt.build(col);mark.build(col)

THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':True},'land':{'mid':0x829D58},
       'sky':[0xB1DAE5,0x8CCDDC,0x5AB0D7,0x3F94C8,0x327BBA],'haze':0xA5CFD7,
       'light':[0xFFF1CD,3.35],'fill':[0xCCE4EC,0xA2A278],'sun_azimuth':-.92,'sun_altitude':.79,
       'palette':{'asphalt':0x737878}}

@lru_cache(maxsize=96)
def lettering(text):
    """Original raised sign lettering as triangles. The exported course needs no font."""
    curve=bpy.data.curves.new("Sign master","FONT")
    curve.body=text
    curve.align_x="CENTER"
    curve.resolution_u=2
    obj=bpy.data.objects.new("Sign master",curve)
    bpy.context.scene.collection.objects.link(obj)
    evaluated=obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh=evaluated.to_mesh()
    try:
        mesh.calc_loop_triangles()
        triangles=[tuple(tuple(mesh.vertices[v].co[:2]) for v in t.vertices) for t in mesh.loop_triangles]
        width=max(x for tri in triangles for x,y in tri)-min(x for tri in triangles for x,y in tri)
        return triangles,width
    finally:
        evaluated.to_mesh_clear()
        bpy.data.objects.remove(obj,do_unlink=True)
        bpy.data.curves.remove(curve)


def words(b,text,origin,right,up,size,max_width,tint):
    triangles,width=lettering(text)
    scale=min(size,max_width/width)
    col=lin(tint)
    for tri in triangles:
        points=[tuple(origin[k]+scale*(x*right[k]+y*up[k]) for k in range(3)) for x,y in tri]
        b.face(points,(col,)*3)


def beam(art,a,b,width,height,colour):
    start,end=Vector(a),Vector(b);axis=(end-start).normalized()
    across=axis.cross(Vector((0,0,1)))
    if across.length<.001:across=Vector((1,0,0))
    across.normalize();up=across.cross(axis).normalized()
    rim=[width*.5*u*across+height*.5*v*up for u,v in ((1,1),(-1,1),(-1,-1),(1,-1))]
    for j in range(4):
        n=(j+1)%4
        art.face((start+rim[j],end+rim[j],end+rim[n],start+rim[n]),(colour,)*4)


def rock(art,x,y,r,h,rng):
    """An old coral boulder on a small, dark base undercut by Atlantic breakers."""
    n=19; wob=[rng.uniform(.83,1.13) for _ in range(n)]
    levels=((-1,.56),(.08,.57),(.17,.50),(.25,.72),(.31,.97),(.62,1),(.83,.81),(.98,.44),(1.02,.08))
    rows=[]
    for j,(z,rad) in enumerate(levels):
        row=[]
        for i in range(n):
            t=i*math.tau/n;grain=1+.043*math.sin(i*4.2+j)
            row.append((x+r*rad*wob[i]*grain*math.cos(t)+.22*r*z,y+.86*r*rad*wob[i]*math.sin(t),h*(z+.023*math.sin(i*3.1+j))))
        rows.append(row)
    for j in range(len(rows)-1):
        for i in range(n):
            q=(i+1)%n;f=(rows[j][i],rows[j][q],rows[j+1][q],rows[j+1][i])
            if j<3:low,hi=0x524D42,0x736856
            else:low,hi=rng.choice(((0x867E6D,0xAAA491),(0xA09A87,0xC2B9A3),(0x908F7B,0xAFAA92)))
            art.face(f,(lin(low),lin(low),lin(hi),lin(hi)))
    for i in range(58):
        t=rng.random()*math.tau;z=rng.uniform(.35,.83);rad=1.0-.28*abs(z-.55)
        q=int(t*n/math.tau)%n;mark=rng.uniform(.06,.22)*r
        px=x+.22*r*z+r*rad*wob[q]*math.cos(t);py=y+.86*r*rad*wob[q]*math.sin(t)
        a=(px,py,z*h);b=(px-mark*math.sin(t),py+mark*math.cos(t),z*h+.2*mark);c=(px,py,z*h+mark)
        co=lin(rng.choice((0x877F70,0xB9B39E,0x797B6A)));art.face((a,b,c),(co,)*3);art.face((c,b,a),(co,)*3)

def cottage(k,art,d,l,paint,rum=False):
    x,y,_=k.road.pos(d,l);z=surface(d,l);yaw=head(d)+(math.pi if l<0 else 0);cs,sn=math.cos(yaw),math.sin(yaw)
    def p(u,v,h):return(x+u*cs-v*sn,y+u*sn+v*cs,z+h)
    def box(u,v,h,w,b,high,t):art.box(p(u,v,h),(w,b,high),yaw,lin(t))
    trim=0xE6DDC5;timber=0x756553
    box(0,0,-1,8.7,5.6,1.4,0x9B9680);box(0,0,.37,8.3,5.2,2.96,paint)
    for n in range(11):box(0,-2.62,.5+n*.253,8.23,.07,.034,0xA89C88 if rum else 0x94B8A0)
    art.roof(p(0,0,3.29),8.99,6.08,2.05,yaw,lin(0x8B705E if rum else 0xA9B9B3))
    box(0,-3.37,.02,8.58,1.69,.25,0xA3917C);box(0,-3.33,2.96,8.74,1.77,.19,trim)
    for u in (-3.98,-1.6,1.6,3.98):box(u,-4.01,.25,.12,.12,2.78,trim)
    box(0,-2.64,.36,1.22,.13,2.38,0x4B5653)
    for u in (-2.48,2.53):
        box(u,-2.69,1.13,1.46,.14,1.35,trim);box(u,-2.8,1.23,1.25,.12,1.14,0x4B6562)
        for side in (-1,1):
            for n in range(7):box(u+.85*side,-2.81,1.2+n*.16,.41,.11,.10,paint)
    if rum:
        box(0,-4.13,2.69,6.5,.11,.67,0xF0DEBC)
        words(art,'RUM SHOP',p(0,-4.21,2.81),(cs,sn,0),(0,0,1),.52,5.4,0x924C45)
        for j in range(4):
            u=-2.6+j*1.57;box(u,-4.9,.39,.49,.48,.09,trim);box(u,-5.12,.44,.49,.075,.47,trim)
            for a in (-.19,.19):
                for b in (-.19,.19):box(u+a,-4.9+b,0,.065,.065,.42,trim)

def boat(k,art,d,l,colour):
    x,y,_=k.road.pos(d,l);z=surface(d,l)+.04;yaw=head(d)+.3;cs,sn=math.cos(yaw),math.sin(yaw)
    def p(u,v,h):return(x+u*cs-v*sn,y+u*sn+v*cs,z+h)
    for side in (-1,1):
        old=None
        for n in range(11):
            u=-2.7+.54*n;width=.77*math.sin(n*math.pi/10)**.66
            section=(p(u,side*.10,.19),p(u,side*width,.76+.31*(abs(u)/2.7)**2),p(u,side*width*.91,.85+.31*(abs(u)/2.7)**2))
            if old:
                for j,col in ((0,colour),(1,0xE1D8B8)):
                    f=(old[j],section[j],section[j+1],old[j+1]);co=lin(col);art.face(f,(co,)*4);art.face(f[::-1],(co,)*4)
            old=section
    for u in (-1,0,1):art.box(p(u,0,.6),(.25,1.18,.09),yaw,lin(0xB48E65))

def scenery(k):
    import sys
    bc=sys.modules['__main__'];art=Painted(k);distant=Painted(k,'peaks');rng=k.rng
    for base in (1240,4140,8170):
        for d,l,r,h in ((base+22,-27,7.8,9.6),(base+57,-43,4.8,4.1),(base+105,-32,5.2,4.8),(base+142,-61,3.2,3.1)):
            x,y,_=k.road.pos(d,l);rock(art,x,y,r,h,rng)
    for d in range(30,10690,36):
        l=rng.choice((8.3,11.5,-8.9,-12.4));x,y,_=k.road.pos(d,l)
        if any(abs(d-q)<11 for q in (98,129,609,1121,2024,2220)):continue
        if d%5<2:bc.palm(k.B,x,y,surface(d,l),rng,rng.uniform(7,12),head(d)-.97)
        else:k.palm(x,y,surface(d,l))
    for i,d in enumerate((98,129,166,212,455,609,1121,2024,2220,3692,3821,5250,6830,7260,8953,9790,10471)):
        cottage(k,art,d,11.8+(i%4)*2,(0x6BB4A5,0xD69D7D,0xE5C58D,0x87A9B1)[i%4] if d not in (609,3821,8953) else 0xAC4C42,d in (609,3821,8953))
    cottage(k,art,620,-10.2,0xAD4941,True)
    cottage(k,art,115,-11.4,0x66B1A4)
    for d in (2222,2230,2236):
        boat(k,art,d,-12.7,rng.choice((0x407F9E,0xCE654F,0xD3AD4D)))
    # Low spreading sea grape above the beach, with grey trunks and clusters of broad leaves.
    for i in range(200):
        d=45+rng.uniform(0,10580);lane=rng.choice((1,-1))*rng.uniform(6.6,16.8)
        if any(abs(d-q)<16 for q in (115,620,1262,2222)):continue
        x,y,_=k.road.pos(d,lane);z=surface(d,lane)
        for j in range(3):
            angle=rng.random()*math.tau;r=rng.uniform(.8,2.2)
            u,v=x+r*math.cos(angle),y+r*math.sin(angle);h=rng.uniform(1.2,2.4)
            beam(art,(x,y,z),(u,v,z+h),.15,.13,lin(0x82765B))
            for n in range(8):
                a=n*math.tau/8;b=(n+1)*math.tau/8
                rim=(u+1.6*math.cos(a),v+1.3*math.sin(a),z+h)
                next_rim=(u+1.6*math.cos(b),v+1.3*math.sin(b),z+h)
                top=(u+.1,v-.1,z+h+.66);co=lin(rng.choice((0x66804B,0x78934E,0x779454,0x5D854D)))
                art.face((rim,next_rim,top),(co,co,lin(0x93A563)))
    for d in (2251,2259,2265,5298,5304,8037):boat(k,art,d,-shore(d)+4,rng.choice((0x6598AA,0xC87A60,0x70A186)))
    for d in range(235,10230,5):
        if d%1780>675:continue
        x,y,z=k.road.pos(d,-4.55);c=lin(rng.choice((0xBAAE90,0xBFB49A,0xC7BCA7)))
        art.box((x,y,z-.36),(4.75,.49,.89),head(d),c)
    previous=None
    for d in range(-900,13800,90):
        x=d;y=720+156*math.sin(d/370);h=150+95*math.sin(d/770)+40*math.cos(d/201)
        row=((x,y-380,-10),(x,y-98,h*.71),(x,y,h))
        if previous:
            for j in range(2):
                co=lin((0x73986E,0x8BA589)[j]);a,b,c,e=previous[j],row[j],row[j+1],previous[j+1];distant.face((a,b,c,e),(co,)*4)
        previous=row
    return {'efforts':0}
