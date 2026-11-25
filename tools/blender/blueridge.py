"""The Appalachian Parkway from the hardwood canopy to Linn Cove and Mabry Mill."""
import math
from functools import lru_cache
import bpy
from mathutils import Vector
from worldkit import Painted, lin, smooth

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

def bearing(d):
    base = .28*math.sin(d/333) + .23*math.sin(d/128) + .11*math.cos(d/67)
    # The preceding spur looks across the ravine onto the continuous curve of Linn Cove.
    arc = -.10 + 1.00*smooth(1040,1190,d) - 1.62*smooth(1240,1480,d) + .95*smooth(1490,1680,d)
    weight = smooth(830,1040,d)*(1-smooth(1680,1890,d))
    return base + weight*(arc-base)


def route(config, theme, bc):
    stages = bc.stages(config['plan'])
    length = stages[-1]['to']
    mean = sum((s['to']-s['from'])*s['level'] for s in stages)/length
    chain = [i*bc.STEP-bc.LEAD_IN for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1)]
    grades = []
    for d in chain:
        stage = bc.stage_at(stages, max(0,min(length-.01,d)))
        grades.append(.65+.65*(stage['level']-mean)+1.2*math.cos(d/390) if 0<=d<length else 0)
    x,y,z = -bc.LEAD_IN,0,960
    samples = []
    for d,g in zip(chain,bc.box_smooth(grades,9)):
        samples.append(dict(d=d,x=x,y=y,z=z,h=bearing(d),g=g,k=bearing(d+.5)-bearing(d-.5)))
        mid = bearing(d+bc.STEP/2)
        x += bc.STEP*math.cos(mid)
        y += bc.STEP*math.sin(mid)
        z += bc.STEP*g/100
    return samples, stages, length, mean, .65


def relief(d, l):
    width = abs(l)
    side = (1 if l>0 else -1)
    opening = smooth(4.7,24,width)
    drop = -.18 + opening*(side*(width-4.7)*(.23+.13*math.sin(d/130)) + 2.1*math.sin(d/69+l/28))
    # The viaduct stands clear over a rocky draw, while the masonry span crosses a narrow creek.
    basin = smooth(1244,1320,d)*(1-smooth(1625,1700,d))
    creek = 1-smooth(5,33,abs(d-2280-l*.12))
    drop -= 41*basin + 9.3*creek
    pond = smooth(6140,6175,d)*(1-smooth(6240,6270,d))*smooth(5,12,-l)*(1-smooth(31,51,-l))
    return drop - 4.2*pond


def land(road, col, theme, bc):
    land = bc.Builder('Parkway ridge, rock cuts and wooded ravines','terrain')
    land.colours = []
    lanes=(-183,-105,-68,-45,-30,-20,-13,-9,-6.2,-4.5,0,4.5,6.2,9,15,24,39,62,100,154)
    for i in range(0,len(road.s)-1,3):
        j=min(i+3,len(road.s)-1)
        for near,far in zip(lanes,lanes[1:]):
            points=[]; colours=[]
            for index,l in ((i,near),(j,near),(j,far),(i,far)):
                d=road.s[index]['d']
                points.append(road.at(index,l,relief(d,l)))
                patch=math.sin(d/32+l/17)+.64*math.cos(d/19-l/29)
                meadow=d%3100<515
                shade=(0x869052 if meadow else 0x776D47) if patch>.6 else (0x737B4C if patch>-.5 else 0x8C7952)
                if 1245<d<1680 and abs(l)<44: shade=0x766D61 if patch>0 else 0x918679
                colours.append(lin(shade))
            land.quad(*points);land.colours.extend(colours)
    return land.build(col),lambda x,y:0


def roadway(road, stages, length, col, bc):
    asphalt=bc.Builder('Road','asphalt'); mark=bc.Builder('Parkway markings','terrain');mark.colours=[]
    for i in range(len(road.s)-1):
        def stripe(builder,a,b,up):
            builder.quad(road.at(i,a,up),road.at(i+1,a,up),road.at(i+1,b,up),road.at(i,b,up))
        stripe(asphalt,-3.65,3.65,0)
        for side in (-1,1):
            stripe(mark,side*3.37-.048,side*3.37+.048,.012)
            mark.colours.extend([lin(0xD4CEAD)]*4)
            stripe(mark,side*.112-.057,side*.112+.057,.015)
            mark.colours.extend([lin(0xCDA646 if i%37>1 else 0xAC925B)]*4)
    asphalt.build(col);mark.build(col)


THEME={'lay':route,'land_builder':land,'road_builder':roadway,'road_half_width':3.65,'terrain':{'sea':False},
       'land':{'mid':0x827E50},'sky':[0xE6DFC6,0xD0D9DE,0xB6CDDE,0x94B7D0,0x83A9C8],
       'haze':0xBBC7CE,'light':[0xFFDBA3,3.1],'fill':[0xD2DCE6,0xAB9474],
       'sun_azimuth':-.86,'sun_altitude':.48,'palette':{'asphalt':0x64635E},'chunks':{'Land':2}}


def crown(art,base,r,height,angle,tint):
    x,y,z=base; shade=lin(tint)
    tint_lo=tuple(c*.64 for c in shade[:3])+(1.,)
    rings=[]
    for frac,size in ((0,.48),(.25,1),(.66,.86),(1,.30)):
        ring=[]
        for i in range(8):
            a=i*math.tau/8+angle
            radius=r*size*(1+.16*math.sin(i*2.25+angle))
            ring.append((x+radius*math.cos(a),y+.84*radius*math.sin(a),z+height*(frac+.065*math.sin(i+angle))))
        rings.append(ring)
    for low,high in zip(rings,rings[1:]):
        for i in range(8):
            n=(i+1)%8
            lit=tuple(c*(.93+.07*math.sin(angle+i)) for c in shade[:3])+(1.,)
            art.face((low[i],low[n],high[n],high[i]),(tint_lo,shade,lit,shade))
    art.face(rings[-1],(shade,)*8)


def leaf_spray(art,x,y,z,length,a,shade):
    # A branch tip carries overlapping pointed leaves, bright on top and dark underneath.
    for j in range(5):
        t=a+(j-2)*.53
        c,s=math.cos(t),math.sin(t)
        u=x+.10*length*j*math.cos(a);v=y+.10*length*j*math.sin(a)
        dz=z+.12*length*math.sin(j)
        tip=(u+c*length,v+s*length,dz-.17*length)
        mid=(u+c*length*.44,v+s*length*.44,dz+.10*length)
        span=.19*length
        left=(mid[0]-s*span,mid[1]+c*span,dz)
        right=(mid[0]+s*span,mid[1]-c*span,dz)
        base=(u,v,dz)
        low=tuple(k*.72 for k in shade[:3])+(1.,)
        high=tuple(min(1,k*1.12) for k in shade[:3])+(1.,)
        art.face((base,left,tip,mid),(shade,high,shade,high))
        art.face((base,mid,tip,right),(low,shade,high,shade))


def tree(k,art,d,l,h,species):
    x,y,z=k.road.pos(d,l,relief(d,l));a=k.rng.random()*math.tau
    bark=lin(0x695C4A)
    art.tube((x,y,z),h*.034,h*.012,h*.76,bark,lin(0x786855),7)
    palette=((0xB44E2F,0xCD6735,0xA6412F),(0xC78C3D,0xB46B36,0xC7793D),(0xDCA945,0xE4B952,0xC8A14B))
    for j in range(4):
        yaw=a+2.4*j
        end=(x+h*.21*math.cos(yaw),y+h*.21*math.sin(yaw),z+h*(.50+.043*j))
        beam(art,(x,y,z+h*.32),end,h*.047,h*.045,bark)
        crown(art,end,h*(.23+.018*species),h*(.36+.035*species),yaw,palette[species][j%3])
    crown(art,(x,y,z+h*.70),h*.21,h*.35,a,palette[species][1])
    # Paint canopy detail on the inward-facing edge, the portion visible to riders.
    if abs(l)<16:
        towards=bearing(d)+(math.pi/2 if l<0 else -math.pi/2)
        for j in range(13):
            t=towards+1.26*math.sin(j*2.53+a);rr=h*(.28+.06*math.cos(j*.87))
            leaf_spray(art,x+rr*math.cos(t),y+rr*math.sin(t),z+h*(.67+.19*math.sin(j*1.71)),h*.075,t,lin(palette[species][j%3]))


def overlook(k,art,d,name):
    # The sign faces approaching traffic and the half-moon pull-off widens the valley shoulder.
    points=[]
    for j in range(17):
        t=j/16;station=d-28+56*t;l=-3.5-6.4*math.sin(math.pi*t)
        points.append(k.road.pos(station,l,-.028))
        if j:
            face=(k.road.pos(station-3.5,-3.5,-.027),k.road.pos(station,-3.5,-.027),points[j],points[j-1])
            art.face(face[::-1],(lin(0x837D6A),)*4)
        for row in range(3):
            for b in range(2):
                u=station+b*1.75+row%2*.79
                if abs(u-d)>23:continue
                side=-3.65-6.5*math.cos((u-d)/56*math.pi)
                art.box(k.road.pos(u,side,row*.27-.10),(1.69,.74,.30),bearing(u),lin((0x998E77,0x837866,0x9D9483)[(j+b+row)%3]))
    a=bearing(d);x,y,z=k.road.pos(d,-7.0)
    for offset in (-.99,.99):
        art.box((x-offset*math.sin(a),y+offset*math.cos(a),z-.16),(.19,.20,2.16),a,lin(0x66503A))
    art.box((x,y,z+1.08),(.20,2.94,1.02),a,lin(0x584A38))
    text=(x-.115*math.cos(a),y-.115*math.sin(a),z+1.76)
    right=(math.sin(a),-math.cos(a),0)
    words(art,name,text,right,(0,0,1),.30,2.61,0xECE2C6)
    words(art,'OVERLOOK',(text[0],text[1],z+1.36),right,(0,0,1),.29,2.4,0xE3D7B7)


def viaduct(k,art):
    deck=lin(0xC1B9A8);soffit=lin(0x8A8479);cap=lin(0xD3CCB7)
    for d in range(1250,1690,4):
        for lane in (-3.77,3.77):
            beam(art,k.road.pos(d,lane,-.24),k.road.pos(d+4,lane,-.24),.49,.61,deck)
            beam(art,k.road.pos(d,lane,.91),k.road.pos(d+4,lane,.91),.29,.26,cap)
            if d%8==2:art.box(k.road.pos(d,lane,-.02),(.38,.36,.90),bearing(d),deck)
        for width,up,thickness in ((7.58,-.34,.61),(4.7,-1.12,1.02)):
            beam(art,k.road.pos(d,0,up),k.road.pos(d+4,0,up),width,thickness,soffit)
        if (d-1250)%32==16:
            depth=-relief(d,0)
            art.box(k.road.pos(d,0,-depth-.4),(2.43,2.83,max(.26,depth-.7)),bearing(d),deck)
            art.box(k.road.pos(d,0,-2.61),(3.05,5.13,1.14),bearing(d),deck)


def stone_crossings(k,art):
    stone=(0x857B6C,0x9B8C77,0xA99A85,0x8F8679)
    for side in (-1,1):
        for j in range(35):
            d=2263+j
            art.box(k.road.pos(d,side*3.87,.02),(.98,.60,.89),bearing(d),lin(stone[j%4]))
            arch=-1.71-6.5*((d-2280)/17)**2
            art.box(k.road.pos(d,side*3.5,arch),(1.1,1.21,-arch),bearing(d),lin(stone[(j//2)%4]))
        for j in range(27):
            a=j*math.pi/26
            art.box(k.road.pos(2280+16.2*math.cos(a),side*3.83,-8.38+6.8*math.sin(a)),(1.32,.66,.70),bearing(2280),lin(stone[j%4]))
    # Longitudinal rock lining and voussoirs circumscribe an open bore that the bike actually enters.
    for d in range(4860,4918,3):
        for j in range(24):
            a=j*math.pi/24;b=(j+1)*math.pi/24
            corners=[k.road.pos(st,5.1*math.cos(t),1.26+5.1*math.sin(t)) for st,t in ((d,a),(d+3,a),(d+3,b),(d,b))]
            colour=lin(0x645E55 if (d+j)%4 else 0x777064)
            art.face(corners,(colour,)*4);art.face(corners[::-1],(colour,)*4)
        for side in (-1,1):art.box(k.road.pos(d,side*5.18,-.25),(3.1,.46,1.64),bearing(d),lin(0x817565))
    for d in (4860,4917):
        for j in range(27):
            a=j*math.pi/27;b=(j+1)*math.pi/27
            pts=[k.road.pos(d+.01,r*math.cos(t),1.26+r*math.sin(t)) for r,t in ((5.1,a),(6.12,a),(6.12,b),(5.1,b))]
            art.face(pts,(lin(stone[j%4]),)*4);art.face(pts[::-1],(lin(stone[j%4]),)*4)
        for side in (-1,1):
            for j in range(6):art.box(k.road.pos(d,side*(6.7+.25*j),j-.6),(4,2.2,1.07),bearing(d),lin(stone[j%4]))


def mill(k,art):
    d,l=6193,-12; a=bearing(d); x,y,z=k.road.pos(d,l,-.67)
    c,s=math.cos(a),math.sin(a)
    def p(u,v,h):return (x+c*u-s*v,y+s*u+c*v,z+h)
    for u,v,w,b,h in ((0,0,8.8,5.6,5.2),(5.9,-.39,4.2,4.8,3.54),(-5.8,.3,3.2,4.4,2.87)):
        art.box(p(u,v,-.61),(w,b,h+.61),a,lin(0x715F48))
        art.roof(p(u,v,h),w+.22,b+.19,1.76,a,lin(0x979995))
        for j in range(int(w/.37)):
            art.box(p(u-w/2+j*.37,v+b/2+.008,.18),(.04,.06,h-.23),a,lin(0x554B3B))
        for side in (-1,1):
            art.box(p(u+side*w*.25,v+b/2+.06,h*.46),(1.01,.07,1.02),a,lin(0x343D3B))
    for j in range(22):
        theta=math.tau*j/22;theta2=math.tau*(j+1)/22
        centre=p(-.8,7.3,-.41)
        pts=(centre,p(-.8+23*math.cos(theta),7.3+5.8*math.sin(theta),-.43),p(-.8+23*math.cos(theta2),7.3+5.8*math.sin(theta2),-.43))
        art.face(pts,(lin(0x657C76),lin(0x899585),lin(0x74897A)))


def scenery(k):
    art=Painted(k);rng=k.rng
    for d,name in ((108,'MEMPHIS RIDGE'),(1100,'LINN COVE'),(13264,'GRANDVIEW'),(20350,'PINE SPUR')):overlook(k,art,d,name)
    viaduct(k,art);stone_crossings(k,art);mill(k,art)
    # Across Grandfather Mountain, the deciduous canopy climbs from the ravine
    # floor to the far abutment, leaving the sightline from the first turnout open.
    for d in range(1170,1800,5):
        for side in (-1,1):
            lane=side*rng.uniform(19,71)
            if 1170<d<1280 and side<0 and abs(lane)<48:continue
            tree(k,art,d,lane,rng.uniform(4.2,9.6),rng.randrange(3))
    for d in range(1220,1710,19):
        for lane in (-62,-50,44,67):
            d0=d+rng.uniform(-6,6);l=lane+rng.uniform(-2.7,2.7)
            tree(k,art,d0,l,rng.uniform(7,12),rng.randrange(3))
    for d in range(6,24243,6):
        if d%12==0 and not any(abs(d-c)<145 for c in (108,1145,1490,2280,4860,6193,13264)):
            continue
        for side in (-1,1):
            l=side*rng.uniform(6.4,28)
            if any(abs(d-anchor)<width for anchor,width in ((108,34),(1400,262),(2280,27),(4884,40),(6193,53),(13264,55))) and (side<0 or 1260<d<1690):continue
            if d%3100<490 and side<0:continue
            tree(k,art,d,l,rng.uniform(6.0,13.5),rng.randrange(3))
        if d%12==6:
            side=rng.choice((-1,1));l=side*rng.uniform(4.9,9)
            if any(abs(d-anchor)<w for anchor,w in ((108,28),(1450,221),(2280,19),(4884,35),(6193,40))):continue
            crown(art,k.road.pos(d,l,relief(d,l)),rng.uniform(1.10,2.2),rng.uniform(.89,1.7),d*.32,0x455F47)
    for start in range(170,24100,2400):
        for j in range(45):
            d=start+3.4*j;l=-6.4+.72*(j%2)
            art.box(k.road.pos(d,l,relief(d,l)),(.17,.20,1.19),bearing(d),lin(0x827356))
            for h in (.36,.74,1.04):
                next_l=-6.4+.72*((j+1)%2)
                beam(art,k.road.pos(d,l,h+relief(d,l)),k.road.pos(d+3.4,next_l,h+relief(d+3.4,next_l)),.16,.12,lin(0x927D5A))
    distant=Painted(k,'peaks')
    for side in (-1,1):
        for row in range(4):
            last=None
            for i in range(184):
                x=-3000+i*175
                y=side*(805+row*770+65*math.sin(i*.16+row))
                high=818+row*115+116*math.sin(i*.21+row*.93)+61*math.cos(i*.49-row*1.6)
                top=(x,y,high);bottom=(x,y-side*220,high-497)
                if last:
                    pts=(last[0],bottom,top,last[1]);color=lin((0x747F79,0x87989C,0x97AAB2,0xACB9C1)[row])
                    distant.face(pts if side>0 else pts[::-1],(color,)*4)
                last=(bottom,top)
    return {'efforts':0}
