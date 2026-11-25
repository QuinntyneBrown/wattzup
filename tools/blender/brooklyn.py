"""Brooklyn Bridge morning commute, from DUMBO to the Financial District."""
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


LENGTH=10700.
RADIUS=14.
TURN=math.pi*RADIUS
STREET=(LENGTH-2*TURN)/3
TOWERS=(1295.,1781.)
DECK_HALF=2.75


def deck(x):
    ramp=smooth(475,1275,x)*(1-smooth(1795,2680,x))
    crown=4.1*math.exp(-((x-1538)/285)**2)
    return 6+35*ramp+crown


def street(x):
    # The promenade goes round the centre pier at each pointed portal.
    return (30*math.sin(x/90)*max(0,1-smooth(270,620,x))
            +sum(6.25*math.exp(-((x-t)/43)**2) for t in TOWERS)
            +23*math.sin((x-2650)/125)*smooth(2570,2920,x))


def station(d):
    if d<STREET:return d,0,1
    d-=STREET
    if d<TURN:
        a=d/RADIUS;return STREET+RADIUS*math.sin(a),RADIUS*(1-math.cos(a)),math.cos(a)
    d-=TURN
    if d<STREET:
        # The two city blocks loop back to the same promenade at the approaches.
        x=STREET-d
        l=2*RADIUS*(1-smooth(0,180,d)) + 2*RADIUS*(1-smooth(0,180,x))
        return x,l,-1
    d-=STREET
    if d<TURN:
        a=d/RADIUS;return -RADIUS*math.sin(a),RADIUS*(1+math.cos(a)),-math.cos(a)
    return d-TURN,0,1


def sample(d):
    x,l,_=station(d);return (x,street(x)+l,deck(x))


def route(config,theme,bc):
    st=bc.stages(config['plan']);length=st[-1]['to'];points=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,z=sample(d);a=sample(d-.4);b=sample(d+.4)
        points.append(dict(d=d,x=x,y=y,z=z,h=math.atan2(b[1]-a[1],b[0]-a[0]),k=0,g=(b[2]-a[2])/.8))
    mean=sum((s['to']-s['from'])*s['level'] for s in st)/length
    return points,st,length,mean,0


def land(road,col,theme,bc):
    ground=bc.Builder('East River shores','terrain');ground.colours=[]
    for a,b,z,colr in ((-420,1050,5.72,0xA89F8D),(2040,4250,5.72,0xA49F92)):
        for x in range(a,b,50):
            ground.quad((x,-4600,z),(x+50,-4600,z),(x+50,4600,z),(x,4600,z))
            ground.colours.extend([lin(colr)]*4)
    sea=bc.Builder('East River','sea');sea.quad((840,-4000,0),(2280,-4000,0),(2280,4000,0),(840,4000,0));sea.build(col)
    return ground.build(col),lambda *_:0


def roadway(road,st,length,col,bc):
    surface=bc.Builder('Road','terrain');surface.colours=[]
    paint=bc.Builder('Promenade planks and paint','terrain');paint.colours=[]
    def ribbon(builder,a,b,l,r,z,tint,offset=0):
        pts=[(x,street(x)+v+offset,deck(x)+z) for x,v in ((a,l),(b,l),(b,r),(a,r))]
        builder.quad(*pts);builder.colours.extend([lin(tint)]*4)
    for a in range(-80,math.ceil(STREET+80),4):
        span=515<a<2630;width=DECK_HALF if span else 4.3
        ribbon(surface,a,a+4,-width,width,0,0xA6957A if span else 0x918A81)
        if span:
            if a%12<8:ribbon(paint,a,a+4,-.074,.074,.035,0xDDB75A)
    # Only the city turning loops need a second road surface.
    for i in range(len(road.s)-1):
        d=road.s[i]['d'];x,l,_=station(d)
        if d<=STREET or d>=2*(STREET+TURN) or l<.04:continue
        surface.quad(road.at(i,-4.3),road.at(i+1,-4.3),road.at(i+1,4.3),road.at(i,4.3))
        surface.colours.extend([lin(0x918A81)]*4)
    surface.build(col);paint.build(col)


THEME={'lay':route,'land_builder':land,'road_builder':roadway,'road_half_width':DECK_HALF,'terrain':{'sea':True},
       'land':{'mid':0xA6967D},'sky':[0xE6D8C6,0xC3CAD1,0x91AFC7,0x6D96BA,0x537EA9],
       'haze':0xCBBBA9,'light':[0xFFDBA3,3.05],'fill':[0xDDE1E0,0xBCAC97],
       'sun_azimuth':-1.45,'sun_altitude':.43,'palette':{'asphalt':0xA8987D,'sea':0x637E82},'chunks':{'Land':1}}


def box(art,x,y,z,w,d,h,col):art.box((x,y,z),(w,d,h),0,lin(col))


def portal(art,x):
    base=deck(x);depth=12.6;top=base+37.4
    # Draw masonry courses across the tower face, cutting two pointed openings out of each.
    for side in (-1,1):
        for row in range(38):
            z=base-7.6+row*1.17
            height=z-base
            opening=4.68 if height<16.2 else 4.68*(1-min(1,(height-16.2)/12)**1.55)
            spans=[(-14.2,14.2)] if opening<.035 else [(-14.2,-6.25-opening),(-6.25+opening,6.25-opening),(6.25+opening,14.2)]
            for lo,hi in spans:
                j=0;cursor=lo
                while cursor<hi-.035:
                    end=min(hi,cursor+(1.43 if j==0 and row%2 else 2.78))
                    tint=(0xA69784,0xAD9E88,0xB3A38B,0x9C9281,0xB5A591)[(row*17+j*13+int((lo+15)*3))%5]
                    box(art,x+side*(depth/2-.36),(cursor+end)/2,z,.73,max(.034,end-cursor-.025),1.14,tint)
                    cursor=end;j+=1
        for u in (-14.05,0,14.05):box(art,x+side*(depth/2+.2),u,base-6.8,1.26,1.02,42.8,0xA89A84)
        box(art,x+side*depth*.5,0,top-.65,1.12,29.8,1.25,0xB2A38C)
    for y,w in ((-12.7,3.0),(0,3.13),(12.7,3.0)):
        box(art,x,y,base-26,depth,w,44,0x948A77)
    for c in (-6.25,6.25):
        for sign in (-1,1):
            def curve(j):
                f=j/18;return c+sign*4.68*(1-f**1.55),base+16.2+12*f
            for j in range(18):
                y,z=curve(j);ny,nz=curve(j+1)
                face=((x-depth/2,y,z),(x+depth/2,y,z),(x+depth/2,ny,nz),(x-depth/2,ny,nz))
                art.face(face if sign>0 else face[::-1],(lin(0x857D70),)*4)
                for side in (-1,1):
                    beam(art,(x+side*(depth/2+.19),y,z),(x+side*(depth/2+.19),ny,nz),.63,.53,lin(0xC4B49A))
    box(art,x,0,top+.16,depth+1.3,30,1.26,0xAA9A83)
    for y in (-13.4,-6.6,0,6.6,13.4):box(art,x,y,top+1.4,depth*.88,1.8,1.3,0xB9AA90)
    for side in (-1,1):box(art,x+side*depth*.42,0,top+1.4,1.3,29.2,.55,0xB2A28A)


def main_cable(x):
    left,right=TOWERS
    if x<=left:a,b,z1,z2=885,left,deck(885)+2,deck(left)+39
    elif x<=right:a,b,z1,z2=left,right,deck(left)+39,deck(right)+39
    else:a,b,z1,z2=right,2215,deck(right)+39,deck(2215)+2
    t=(x-a)/(b-a)
    return z1+(z2-z1)*t-4*(29 if a==left else 7)*t*(1-t)


def bridge(art):
    for x in range(520,2630,8):
        z=deck(x);nz=deck(x+8);y=street(x);ny=street(x+8)
        for side in (-1,1):
            for h in (.23,.73,1.27):
                beam(art,(x,y+side*2.83,z+h),(x+8,ny+side*2.83,nz+h),.065,.082,lin(0x706B5C))
            for j in (0,2,4,6):
                v=street(x+j)+side*2.83;b=deck(x+j)
                box(art,x+j,v,b,.096,.11,1.33,0x686858)
                beam(art,(x+j,v,b+.29),(x+j+2,street(x+j+2)+side*2.83,deck(x+j+2)+1.25),.038,.038,lin(0x827F6A))
            for lane in (7.7,14.0):
                l=side*lane
                face=((x,l-3.18,z-4.02),(x+8,l-3.18,nz-4.02),(x+8,l+3.18,nz-4.02),(x,l+3.18,z-4.02))
                art.face(face,(lin(0x66676A),)*4)
                if x%24==0:box(art,x+2,l,z-4,3.4,.14,.027,0xC4BDA7)
            for h in (-4.29,-.91):
                beam(art,(x,side*17.3,z+h),(x+8,side*17.3,nz+h),.27,.24,lin(0x8D8070))
            beam(art,(x,side*17.3,z-4.29),(x+8,side*17.3,nz-.91),.16,.18,lin(0x867968))
        if x%32==8:
            v=y-2.91
            art.tube((x,v,z),.145,.088,3.95,lin(0x4F514B),lin(0x696B5E),8)
            art.tube((x,v,z+3.93),.24,.40,.79,lin(0xEBDFBA),lin(0xF1E5CC),6)
            art.tube((x,v,z+4.71),.43,.09,.32,lin(0x59615A),lin(0x73776A),6)
    for x in range(885,2215,5):
        for lane in (-14,-4.6,4.6,14):
            beam(art,(x,lane,main_cable(x)),(x+5,lane,main_cable(x+5)),.345,.35,lin(0x827768))
            if x%15==0:beam(art,(x,lane,deck(x)-2.2),(x,lane,main_cable(x)),.065,.068,lin(0x8D8373))
    for tower in TOWERS:
        portal(art,tower)
        for direction in (-1,1):
            for n in range(1,20):
                x=tower+direction*(16+n*7.7)
                for side in (-1,1):
                    beam(art,(tower+direction*5.9,side*10,deck(tower)+36.5),(x,side*12.3,deck(x)-2),.095,.092,lin(0x857B6B))


def warehouses(art,rng):
    for x in range(-65,575,23):
        for side in (-1,1):
            if x%115<18:continue
            y=street(x)+side*(14+rng.uniform(0,3));h=rng.choice((11.6,14.8,18.3));w=22.9
            clay=rng.choice((0x965B48,0x8D5A48,0x9E6952,0xA06A50))
            box(art,x,y,5.8,w,11,h,clay);face=y-side*5.55
            box(art,x,y,5.79+h,w+.35,11.4,.48,0x736A5C)
            for floor in range(int(h/3.4)):
                for j in range(5):
                    dx=x-8.7+j*4.25;z=7.06+floor*3.39
                    box(art,dx,face,z,2.22,.15,2.02,0x465960)
                    box(art,dx,face-side*.10,z-.16,2.53,.28,.20,0xC1A48B)
                    box(art,dx,face-side*.12,z+.94,2.2,.09,.086,0x8B9286)
                    box(art,dx,face-side*.13,z,.10,.11,2.04,0x8B9286)
            if x%69<23:
                box(art,x+5,face-side*.72,10.25,6.1,1.6,.14,0x55554E)
                for j in range(10):box(art,x+2+j*.66,face-side*1.48,10.38,.046,.046,1.11,0x464B48)
                beam(art,(x+2,face-side*1.45,10.38),(x-2.5,face-side*1.45,7.1),.11,.13,lin(0x535751))
    for x in range(56,540,28):
        y=street(x)
        box(art,x,y+5.3,6.02,.19,.22,3.48,0x535B56)
        box(art,x,y+5.3,9.53,.20,2.12,.73,0x4F796B)
    x=160;y=street(x)-9.8
    box(art,x,y,9.4,.17,3,.91,0x55776A)
    words(art,'DUMBO',(x-.102,y,9.63),(0,-1,0),(0,0,1),.65,2.64,0xF4E2BF)


def skyline(art,rng):
    for row in range(3):
        for j in range(42):
            y=-1000+j*52+rng.uniform(-14,14);x=3330+row*210+rng.uniform(-60,90)
            if abs(y)<78 or abs(y-268)<48:continue
            w=rng.uniform(25,47);depth=rng.uniform(27,57);h=rng.uniform(54,156)*(1+.29*math.cos(y/425))
            tone=rng.choice((0x9D978A,0xA5A59B,0x8F9C9E,0xA59888,0x9DA7A5))
            box(art,x,y,6,w,depth,h,tone)
            if j%3!=1:
                box(art,x,y,6+h,w*.73,depth*.72,h*.27,tone)
                box(art,x,y,6+h*1.27,w*.39,depth*.43,h*.105,0x959790)
            if j%2==0:
                for k in range(1,int(h/7)):
                    box(art,x-w*.5-.07,y,6+k*7,.13,depth*.94,.95,0x879597)
            else:
                for k in range(5):box(art,x-w*.5-.09,y+(k-2)*depth*.16,9,.15,1.8,h*.93,0xB0A898)
    # One World Trade Center. A square plan at the foot turns to a smaller diamond
    # below the observation level. Alternate glazed triangles catch the morning sun.
    x,y=3620,268
    base=[(x+a,y+b,65) for a,b in ((-33,-33),(33,-33),(33,33),(-33,33))]
    crown=[(x+a,y+b,380) for a,b in ((0,-25),(25,0),(0,25),(-25,0))]
    box(art,x,y,4,66,66,62,0x9AA8AC)
    for j in range(4):
        n=(j+1)%4
        for face,tone in (((base[j],base[n],crown[j]),(0x9EBDC6,0x829DA8,0xA8C3C6,0x809AA5)[j]),((base[n],crown[n],crown[j]),(0x839DA9,0xA7BEC0,0x8DA6AD,0xACBEBA)[j])):
            art.face(face,(lin(tone),)*3)
        beam(art,base[j],crown[j],.87,.9,lin(0xB4C7C4))
    art.tube((x,y,380),15,14,6,lin(0xA5B7B7),lin(0xBDCCC8),12)
    art.tube((x,y,386),1.75,.44,82,lin(0x788A90),lin(0xBCC8C7),8)
    for dx,dy,h in ((-150,172,233),(50,-240,210),(275,610,195)):
        bx,by=x+dx,dy
        box(art,bx,by,5,48,46,h*.68,0xB3A594)
        for j in range(4):box(art,bx,by,5+h*(.68+j*.066),39-j*6,36-j*5,h*.069,0xB2A58E)
        art.tube((bx,by,5+h*.944),9,.35,25,lin(0x8D9282),lin(0xA9A899),8)


def neighbour(art):
    y=-405
    for tx in (1240,1840):
        for side in (-1,1):
            box(art,tx,y+side*11,0,5,4.4,67,0x82969B)
            box(art,tx,y+side*11,67,5.7,5.4,3,0x839298)
        for h in (38,51,63):
            beam(art,(tx,y-11,h),(tx,y+11,h+9),.8,.8,lin(0x75898F))
            beam(art,(tx,y+11,h),(tx,y-11,h+9),.8,.8,lin(0x879A9D))
    for x in range(920,2180,12):
        box(art,x+6,y,29,12.03,24,1.6,0x77898A)
        def z(u):return 33+35*max(math.exp(-((u-1240)/127)**2),math.exp(-((u-1840)/127)**2))
        for side in (-1,1):
            beam(art,(x,y+side*11,z(x)),(x+12,y+side*11,z(x+12)),.4,.4,lin(0x8A9B9C))
            beam(art,(x,y+side*11,30),(x,y+side*11,z(x)),.10,.10,lin(0x93A3A1))


def scenery(k):
    art=Painted(k);rng=k.rng
    warehouses(art,rng);bridge(art)
    distant=Painted(k,'peaks');skyline(distant,rng);neighbour(distant)
    for side,x in ((-1,1050),(1,2040)):
        for y in range(-370,371,18):
            box(art,x+side*4,y,1.5,8,17.96,4.22,0x918674)
            for j in (0,6,12):art.tube((x-side*.64,y+j-8,0),.22,.21,5,lin(0x726957),lin(0x857562),7)
    # The waterfront forms a continuous base under the taller Financial District silhouettes.
    # Draw the distant bank with the skyline. A local, fogged ground chunk can
    # fall out of the Low visibility window while the towers are still visible.
    for shore in range(-4200,4200,120):
        z=5.78
        face=((2040,shore,z),(4300,shore,z),(4300,shore+120,z),(2040,shore+120,z))
        distant.face(face,(lin(0xA99C8B),)*4)
        edge=((2040,shore+120,-.14),(2040,shore,-.14),(2040,shore,z),(2040,shore+120,z))
        distant.face(edge,(lin(0x8C8273),lin(0x8C8273),lin(0xB2A48C),lin(0xB2A48C)))
    for r in range(3):
        for j in range(46):
            y=-1230+j*55+11*math.sin(j*.8+r)
            if abs(y)<68:continue
            x=2210+r*265+44*math.cos(j*.77+r)
            height=17+r*13+18*(1+math.sin(j*.85+r))
            stone=(0xA89984,0xB3A692,0x9DA49E,0xAB9C8D)[(j+r)%4]
            box(distant,x,y,5.79,38+r*3,43+r%2*6,height,stone)
            for floor in range(1,int(height/7)):
                box(distant,x-19-r*1.5-.04,y,6+floor*7,.13,40,.54,0x92938A)
            if j%3==0:box(distant,x,y,5.79+height,27,31,5.6,stone)
    for y in range(-870,901,40):
        if abs(y)<85:continue
        x=2120+32*math.sin(y/183)
        h=11+9*math.cos(y/87)**2
        box(distant,x,y,5.75,33,39.6,h,0xAB9F8F)
        box(distant,x,y,5.75+h,34.3,40.4,.72,0x9B9B90)
        for j in range(5):box(distant,x-16.65,y-14+j*6.7,8.9,.24,3.1,5.4,0x738486)
    for x in range(2580,3560,26):
        for side in (-1,1):
            if x%104<25:continue
            y=street(x)+side*rng.uniform(20,31)
            h=rng.choice((21,26,32,46));tone=rng.choice((0xAC9B8C,0xA69E8E,0xA5AA9F))
            box(art,x,y,5.8,25.8,13,h,tone)
            f=y-side*6.58
            for j in range(5):
                box(art,x-10+j*5.0,f,8.5,2.45,.18,h-6,0x71848A)
            for floor in range(3,h,4):box(art,x,f,5+floor,25.8,.25,.42,tone)
    return {'efforts':0}
