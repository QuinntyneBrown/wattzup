"""The Corvara ascent of Passo Campolongo, sharing the Sella Ronda kit's Ladin architecture."""
import math
from functools import lru_cache
import bpy
from mathutils import Vector
from mathutils.kdtree import KDTree
from worldkit import Painted, lin, smooth
from sellaronda_kit import rock_tower, PASSES
from sellaronda_kit.villages import _onion_dome_church, _village_chalet
from sellaronda_kit.rifugi import _rifugio_complex


HEIGHTS=((0,0),(510,9),(1830,81),(3500,172),(4120,176),(5600,240),(6350,245),(7460,295),(8235,307))
TURNS=((1150,1),(1570,-1),(2090,1),(2660,-1),(3210,1),(3690,-1))


def height(d):
    for (a,b),(c,e) in zip(HEIGHTS,HEIGHTS[1:]):
        if d<=c:return b+(e-b)*smooth(a,c,d)
    return HEIGHTS[-1][1]


def heading(d):
    h=.15*math.sin(d/223)+.10*math.sin(d/95)
    for start,sign in TURNS:
        h+=sign*2.72*smooth(start,start+85,d)
    return h+.64*math.sin((d-4300)/420)*smooth(4080,4570,d)


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];samples=[];x=-bc.LEAD_IN;y=0
    for i in range(math.ceil((bc.LEAD_IN+length+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        if i:
            h=heading(d-bc.STEP/2);x+=bc.STEP*math.cos(h);y+=bc.STEP*math.sin(h)
        samples.append(dict(d=d,x=x,y=y,z=height(d),h=heading(d),k=heading(d+.5)-heading(d-.5),g=(height(d+.5)-height(d-.5))*100))
    return samples,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,0


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





def relief(d,l):
    width=abs(l);side=l if math.cos(heading(d))>=0 else -l
    steep=.18+.13*smooth(760,1600,d)*(1-smooth(4460,5180,d))
    return -.17+smooth(4.55,17,width)*(steep*side+2.5*math.sin(d/168+l/55))


def land(road,col,theme,bc):
    b=bc.Builder('Alpine valley and open saddle','terrain');b.colours=[]
    points=road.s[::24];keys=KDTree(len(points))
    for i,p in enumerate(points):keys.insert((p['x'],p['y'],0),i)
    keys.balance()
    cell=8
    xmin=int(min(p['x'] for p in points))-270;ymin=int(min(p['y'] for p in points))-330
    xmax=int(max(p['x'] for p in points))+310;ymax=int(max(p['y'] for p in points))+330
    @lru_cache(maxsize=45000)
    def vertex(x,y):
        samples=keys.find_n((x,y,0),8)
        total=0;weighted=0
        for _,i,gap in samples:
            w=1/(gap*gap+2800)**1.7;sample=points[i]
            weighted+=w*(sample['z']+.10*(y-sample['y']));total+=w
        _,i,dist=road.tree.find((x,y,0));p=road.s[i]
        base=weighted/total+4.5*math.sin(x/136+y/119)+2.3*math.cos(x/58-y/67)
        # One surface supports the adjacent switchbacks. A narrow cut follows each carriageway.
        offset=-(x-p['x'])*math.sin(p['h'])+(y-p['y'])*math.cos(p['h'])
        near=p['z']-1.02+relief(p['d'],offset)
        bias=1-smooth(11,52,dist);z=base+(near-base)*bias
        patch=math.sin(x/37+y/23)+.44*math.cos(x/16-y/27)
        tint=0x91A959 if patch>.5 else (0x7D9B53 if patch>-.65 else 0x708C50)
        return (x,y,z),lin(tint)
    for x in range(xmin,xmax,cell):
        for y in range(ymin,ymax,cell):
            quad=[vertex(a,c) for a,c in ((x,y),(x+cell,y),(x+cell,y+cell),(x,y+cell))]
            b.quad(*(q[0] for q in quad));b.colours.extend(q[1] for q in quad)
    def ground(x,y):
        a=xmin+math.floor((x-xmin)/cell)*cell;c=ymin+math.floor((y-ymin)/cell)*cell
        u=(x-a)/cell;v=(y-c)/cell
        return sum(vertex(a+j*cell,c+k*cell)[0][2]*wx*wy for j,wx in enumerate((1-u,u)) for k,wy in enumerate((1-v,v)))
    return b.build(col),ground


def roadway(road,st,length,col,bc):
    asphalt=bc.Builder('Road','asphalt');paint=bc.Builder('RoadPaint','paint');verge=bc.Builder('Shoulder','terrain');verge.colours=[]
    for i in range(len(road.s)-1):
        def strip(builder,a,b,h):
            builder.quad(road.at(i,a,h),road.at(i+1,a,h),road.at(i+1,b,h),road.at(i,b,h))
        strip(asphalt,-3.65,3.65,0)
        for side in (-1,1):
            strip(paint,side*3.48-.055,side*3.48+.055,.014)
            v=(road.at(i,side*3.64,-.015),road.at(i+1,side*3.64,-.015),
               road.at(i+1,side*6.8,-1.22),road.at(i,side*6.8,-1.22))
            verge.quad(*(v if side>0 else v[::-1]));verge.colours.extend((lin(0xA99F87),)*4)
        if i%4==0 and abs(road.s[i]['k'])<.010:strip(paint,-.055,.055,.016)
    asphalt.build(col);paint.build(col);verge.build(col)


THEME={'lay':route,'land_builder':land,'road_builder':roadway,'road_half_width':3.65,
       'terrain':{'sea':False},'land':{'mid':0x84965C},
       'sky':[0xACCFE7,0x8EC5ED,0x72AFE8,0x5F9ADB,0x5086CC],'haze':0xB8D1D8,
       'light':[0xFFF0CC,3.05],'fill':[0xCDDFF0,0x969877],
       'sun_azimuth':-.86,'sun_altitude':.66,'palette':{'asphalt':0x5D5C58},'chunks':{'Land':2}}


def scenery(k):
    art=Painted(k);peaks=Painted(k,'peaks');rng=k.rng
    def ground(d,l):
        x,y,_=k.road.pos(d,l)
        return x,y,k.height_at(x,y)
    def sign(d,l,lines,w=3.7):
        x,y,z=ground(d,l);h=heading(d);panel=2.07
        for v in (-w*.36,w*.36):
            art.box((x-v*math.sin(h),y+v*math.cos(h),z-.25),(.12,.12,panel+1.0),h,lin(0x777A73))
        art.box((x,y,z+panel),(.18,w,1.02),h,lin(0xD8D9C9))
        art.box((x-.10*math.cos(h),y-.10*math.sin(h),z+panel+.05),(.06,w-.14,.90),h,lin(0x51674B))
        for j,t in enumerate(lines):
            origin=(x-.14*math.cos(h),y-.14*math.sin(h),z+panel+.65-j*.29)
            words(art,t,origin,(math.sin(h),-math.cos(h),0),(0,0,1),.25,w-.30,0xF5EEE0)
    for j,d in enumerate(range(-40,931,31)):
        side=1 if j%2==0 else -1
        if 410<d<530 and side==1:continue
        _village_chalet(k.B,k,k.road,k.road.index(d),side,8+j%4,11+j%5,7.8,2+j%2,k.height_at)
    x,y,z=ground(498,17)
    _onion_dome_church(k.B,k,x,y,z,heading(498),'roof-slate',True)
    sign(155,-5.2,['Corvara','Corvara in Badia'])
    sign(7820,-5.25,['Ju de Ćiaulonch','Passo Campolongo'])
    sign(8106,-4.73,['PASSO CAMPOLONGO','1 875 m'],3.8)
    _rifugio_complex(k.B,k,k.road,k.height_at,8132,1,17.7,10.0,2)
    _rifugio_complex(k.B,k,k.road,k.height_at,7870,-1,13.6,8.5,2)
    for d in (602,815,6130,6585,7049):
        x,y,z=ground(d,19);yaw=heading(d)
        art.box((x,y,z-1.0),(9.4,6.5,2.1),yaw,lin(0xA9A08A))
        art.box((x,y,z+1.1),(10,6.9,3.7),yaw,lin(0x8C6540))
        art.roof((x,y,z+4.8),10,6.9,2.1,yaw,lin(0x5C5C4D))
    for d in range(930,4330,8):
        l=-4.42 if math.cos(heading(d))>=0 else 4.42
        a=k.road.pos(d,l,.68);b=k.road.pos(d+8,l,.68)
        beam(art,a,b,.16,.28,lin(0xA6ACA6))
        art.box(k.road.pos(d,l,-.17),(.14,.17,1.06),heading(d),lin(0x8C8D7E))
    for d,_ in TURNS:
        for j in (10,30,51):
            u=d+j; l=-4.66 if heading(u+1)>heading(u) else 4.66
            x,y,z=ground(u,l);h=heading(u)-.2
            art.box((x,y,z),(.11,.11,1.74),h,lin(0x8A8C82))
            art.box((x,y,z+1.26),(.11,1.08,.68),h,lin(0xF3F1D7))
            direction=1 if l<0 else -1
            for a,b in (((-.28,.22),(.05,0)),((.05,0),(-.28,-.22))):
                def point(v,h0):
                    return (x-.08*math.cos(h)-v*direction*math.sin(h),y-.08*math.sin(h)+v*direction*math.cos(h),z+1.61+h0)
                beam(art,point(*a),point(*b),.14,.13,lin(0x383F3C))
    # Forest breaks follow the graded ski pistes and the first open pastures.
    for d in range(680,7700,7):
        for side in (-1,1):
            l=side*rng.uniform(8,80)
            if d>4400 and (d%410<305 or abs(l)<32):continue
            if d<4400 and d%630<52 and abs(l)>17:continue
            x,y,z=ground(d+rng.uniform(-4,4),l)
            if not k.road.clear_of_road(x,y,7,k.road.index(d),70):continue
            h=rng.uniform(6.5,17);larch=rng.random()<.38
            art.tube((x,y,z-.3),h*.024,h*.013,h*.74,lin(0x574D39),lin(0x817458),6)
            tint=(0x718651,0x89A161,0x9AA86B) if larch else (0x365940,0x4D704B,0x638259)
            for n in range(4):
                radius=h*(.204-.037*n)*(1+.11*math.sin(n+d))
                art.tube((x,y,z+h*(.20+.16*n)),radius,.05,h*(.42-.027*n),lin(tint[0]),lin(tint[min(2,n)]),7)
    # A second row of dense conifers is visible through the near trunks. Leave
    # alternating clear views into the valley, especially on the outward bends.
    for d in range(915,4550,8):
        for side in (-1,1):
            if side<0 and d%480<240:continue
            l=side*rng.uniform(8,21);x,y,z=ground(d,l)
            if not k.road.clear_of_road(x,y,7,k.road.index(d),70):continue
            h=rng.uniform(7,14)
            art.tube((x,y,z-.18),h*.022,h*.014,h*.71,lin(0x554E3C),lin(0x8B8168),7)
            for j in range(5):
                r=h*(.19-.031*j)
                art.tube((x,y,z+h*(.23+.13*j)),r,r*.14,h*.32,lin(0x354E39),lin(0x5C7A4E),7)
    for d in range(5680,7350,4):
        l=-8.7-2.0*math.sin(d/108);x,y,z=ground(d,l)
        art.box((x,y,z-.22),(.17,.18,1.48),heading(d),lin(0x977E5A))
        b=ground(d+4,-8.7-2.0*math.sin((d+4)/108))
        for h in (.50,1.01):beam(art,(x,y,z+h),(b[0],b[1],b[2]+h),.11,.16,lin(0xA18A67))
    # Fixed dolomite strata and snow streaks. Use the Ronda kit's rock ribs with a summer palette.
    def limestone(nx,ny,nz,z,snow=False):
        if snow:return lin(0xF0F3EF if nx*.4-ny*.7>.1 else 0xCCD7DB)
        light=nx*.40-ny*.73+nz*.38
        if z<95:return lin(0x647957 if light>.10 else 0x566A55)
        return lin(0xCEC9B7 if light>.38 else (0xB4B2A4 if light>-.21 else 0x969FA0))
    sx,sy=2250,245
    for dx,dy,base,top,rx,ry,taper in ((0,0,-68,615,276,235,.24),(-162,72,-48,440,184,163,.62),(187,52,-57,467,143,149,.47)):
        rock_tower(peaks.b,sx+dx,sy+dy,base,top,rx,ry,14,-.69,limestone,taper=taper,flat_cap=False,seed_phase=dx*.02+5.3)
    mx,my,_=k.road.pos(8160,0);mx+=1450;my+=485
    for j in range(13):
        dy=(j-6)*120;top=773+37*math.sin(j*.9)
        rock_tower(peaks.b,mx+95*math.sin(j*.63),my+dy,80,top,305,141,14,.27,limestone,taper=.77,flat_cap=True,seed_phase=j+.24)
    rock_tower(peaks.b,mx+80,my+138,560,1065,308,246,15,.33,limestone,taper=.27,flat_cap=False,seed_phase=4.0)
    return {'efforts':0}
