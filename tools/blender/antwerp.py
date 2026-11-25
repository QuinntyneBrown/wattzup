"""The Scheldt quays, the Eilandje and the workings of the Port of Antwerp."""
import math
from functools import lru_cache
import bpy
from worldkit import Painted, lin, smooth
from mathutils import Vector

WATER = -2.65


def route(course, theme, bc):
    stages = bc.stages(course['plan'])
    length = stages[-1]['to']
    mean = sum((s['to']-s['from'])*s['level'] for s in stages)/length
    def heading(d):
        h=.17*math.sin(d/420)+.08*math.sin(d/160)
        for start,turn,end,straight in ((25,90,128,235),(460,560,640,755),(1110,1245,1340,1460)):
            h-=.60*smooth(start,turn,d)*(1-smooth(end,straight,d))
        return h
    samples = []
    x,y = -bc.LEAD_IN,0
    for i in range(math.ceil((bc.LEAD_IN+length+bc.RUN_OUT)/bc.STEP)+1):
        d = i*bc.STEP-bc.LEAD_IN
        h = heading(d)
        gap = (d-1100+1050)%2100-1050
        level = bc.stage_at(stages,max(0,min(length-.01,d-gap)))['level']
        lift = 1.7+.045*(level-14)
        phase = min(abs(gap)/88,1)*math.pi
        z = lift*(1+math.cos(phase))*.5
        grade = -50*lift*math.pi/88*math.sin(phase)*math.copysign(1,gap)
        samples.append(dict(d=d,x=x,y=y,z=z,h=h,k=(heading(d+1)-heading(d-1))/2,g=grade))
        x+=bc.STEP*math.cos(h)
        y+=bc.STEP*math.sin(h)
    return samples,stages,length,mean,.045


def banks(road,col,theme,bc):
    b=bc.Builder('Scheldt and quays','terrain')
    b.colours=[]
    profile=[(-235,-.12),(-18,-.12),(-5,-.07),(5,-.07),(11,-.07),(11.3,WATER),
             (175,WATER),(177,-.12),(290,-.12)]
    tints=(0x797F76,0x96958E,0x8C8980,0xA6A399,0x726F62,0x809596,0x727F78,0x788675)
    for i in range(0,len(road.s)-1,3):
        j=min(i+3,len(road.s)-1)
        for n,(a,c) in enumerate(zip(profile,profile[1:])):
            coords=[(i,a),(j,a),(j,c),(i,c)]
            verts=[]
            for idx,(v,z) in coords:
                x,y,_=road.at(idx,v)
                verts.append(b.v((x,y,z)))
                tint=lin(tints[n])
                light=.96+.035*math.sin(x/(22 if n==5 else 73)+v*.07)
                b.colours.append(tuple(q*light for q in tint[:3])+(1,))
            b.faces.append(tuple(verts))
    return b.build(col),lambda x,y:0


THEME={
    'lay':route,'land_builder':banks,'land':{'mid':0x7E8883},'terrain':{'sea':False},
    'edge':'scheldt','kerbs':False,'wet':.27,'sky':[0xD5D8D5,0xC1CCD1,0xADC0CA,0x9EB1BD,0x899FAB],
    'haze':0xCBD1D2,'light':[0xF0EADB,2.7],'fill':[0xD8E0E1,0x888B85],'sun_altitude':.49,'sun_azimuth':2.5,
    'palette':{'asphalt':0x626566,'promenade':0x9A968E},
}


def beam(art,a,b,width,colour):
    """Triangular steelwork and diagonals between two fixed pivots."""
    a,b=Vector(a),Vector(b)
    axis=(b-a).normalized()
    side=axis.cross(Vector((0,0,1)))
    if side.length<.01: side=Vector((1,0,0))
    side.normalize()
    up=axis.cross(side).normalized()
    ring=[(side*x+up*y)*width*.5 for x,y in ((1,1),(-1,1),(-1,-1),(1,-1))]
    for j in range(4):
        j2=(j+1)%4
        art.face((a+ring[j],b+ring[j],b+ring[j2],a+ring[j2]),(colour,)*4)


def castle(art,x,y):
    pale,shade,slate=map(lin,(0xB5AF96,0x8B8A79,0x535B61))
    art.box((x,y,0),(26,18,9),0,pale)
    art.box((x-2,y,8.9),(18,13,3.5),0,pale)
    art.roof((x-2,y,12.4),18,13,4.1,0,slate)
    for u,v,r,h in ((-12,-8,3.1,12),(11,-8,2.8,11),(-11,8,2.5,13),(6,7,2.1,14)):
        art.tube((x+u,y+v,0),r*1.09,r,h,pale,shade,14,pale)
        art.tube((x+u,y+v,h),r*1.12,.13,6,slate,slate,12,slate)
        for a in (0,1.5,3.1,4.7):
            art.box((x+u+r*math.cos(a),y+v+r*math.sin(a),h-3),(.24,.32,1.1),a,slate)
    for j in range(-11,12,2):
        art.box((x+j,y-8.8,9),(1.1,.75,1.1),0,pale)
    for u in range(-9,10,3):
        for z in (4.8,7.2):
            art.box((x+u,y-9.09,z),(.72,.15,1.23),0,shade)
            art.box((x+u,y-9.16,z+1.23),(1.05,.17,.13),0,pale)
    for j in (-4,-2,0,2,4):
        art.box((x+j,y-9.05,0),(.98,.13,3.6+.45*(4-abs(j))),0,shade)


def mas(art,x,y):
    rust,red,glass,iron=map(lin,(0xAE553D,0xB86045,0x718C91,0x53666C))
    art.box((x,y,0),(37,27,3),0,rust)
    for storey in range(9):
        z=3+storey*4.75
        along=storey%4
        yaw=along*math.pi/2
        dx,dy=3.8*math.cos(yaw),3.8*math.sin(yaw)
        art.box((x,y,z),(25.8,25.8,1.8),0,glass)
        art.box((x+dx,y+dy,z+1.75),(31.0,25.8,3.1),yaw,red if storey%3 else rust)
        for u in range(-12,13,2):
            art.box((x+u,y-12.98,z),(.12,.15,1.85),0,iron)
        for u in range(-11,12,4):
            art.box((x+u,y+dy-13.01,z+2.9),(.18,.12,.21),0,lin(0xC1B8A5))


def port_house(art,x,y):
    base,edge=lin(0xADA99A),lin(0xDFDCCB)
    art.box((x,y,0),(66,22,12),0,base)
    art.box((x,y,12),(68,23,.7),0,edge)
    for u in range(-30,31,4):
        for z in (2.3,6.1,9.1):
            art.box((x+u,y-11.06,z),(2.1,.12,2.2),0,lin(0x68747B))
    # The historic fire station has a slate roof between two projecting bays.
    art.roof((x,y+1,12.6),62,18,4.6,0,lin(0x58656B))
    for u in (-28,26):
        art.box((x+u,y-10,0),(7,4.8,13.3),0,base)
        art.roof((x+u,y-10,13.3),7.2,5.1,2.5,math.pi/2,lin(0x63727A))
        for a in (-2,0,2):
            art.box((x+u+a,y-12.46,1.2),(.93,.12,4.5),0,lin(0x53646F))
    beam(art,(x-23,y-3,12),(x-34,y-3,23),3.4,edge)
    beam(art,(x+19,y+3,12),(x+24,y+3,20),3.2,edge)
    # The overhanging prow tapers in plan and pitches up at the tip (real 01 and 14).
    rows=[(-51,1.0,26,28),(-37,7,21,32),(-17,11,20,36),(16,11,20,36),(32,8.0,21,33),(38,4,25,31)]
    glass=list(map(lin,(0x708998,0x92A5AB,0xB2BFC1,0x617A88,0x96ABA8)))
    for n,(a,b) in enumerate(zip(rows,rows[1:])):
        for side in (-1,1):
            for j in range(5):
                def pt(t,top):
                    u,r,lo,hi=(a[k]+(b[k]-a[k])*t for k in range(4))
                    return (x+u, y+side*r*(.73 if top else 1), hi if top else lo)
                v=[pt(j/5,False),pt((j+1)/5,False),pt((j+1)/5,True),pt(j/5,True)]
                for tri,idx in (((0,1,2),n+j),((0,2,3),n+j+2)):
                    pts=tuple(v[k] for k in tri)
                    art.face(pts if side<0 else pts[::-1],(glass[idx%5],)*3)
                    art.face(pts[::-1] if side<0 else pts,(glass[idx%5],)*3)
        art.face(((x+a[0],y-a[1]*.73,a[3]),(x+b[0],y-b[1]*.73,b[3]),(x+b[0],y+b[1]*.73,b[3]),(x+a[0],y+a[1]*.73,a[3])),(glass[2],)*4)
        bottom=((x+a[0],y+a[1],a[2]),(x+b[0],y+b[1],b[2]),(x+b[0],y-b[1],b[2]),(x+a[0],y-a[1],a[2]))
        art.face(bottom,(glass[3],)*4)
    for u,r,lo,hi in (rows[0],rows[-1]):
        cap=((x+u,y-r,lo),(x+u,y+r,lo),(x+u,y+r*.73,hi),(x+u,y-r*.73,hi))
        art.face(cap,(glass[1],)*4);art.face(cap[::-1],(glass[1],)*4)



def crane(art,x,y,scale):
    steel=lin(0x5A7881);dark=lin(0x53636C);red=lin(0xAC6653)
    def p(u,v,z): return x+u*scale,y+v*scale,z*scale
    for u in (-8,8):
        for v in (-9,9):
            beam(art,p(u,v,0),p(u*.69,v*.75,24),1.05*scale,steel)
    for v in (-6,6):
        beam(art,p(-5,v,24),p(-2,v,38),.9*scale,steel)
        beam(art,p(-2,v,38),p(4,-21,25),.42*scale,dark)
    beam(art,p(0,15,24),p(0,-30,24),1.65*scale,steel)
    art.box(p(0,0,23),(13*scale,18*scale,2.1*scale),0,steel)
    art.box(p(0,-13,21),(3*scale,4*scale,2.0*scale),0,red)
    for u in (-1.1,1.1):beam(art,p(u,-13,21),p(u,-13,12),.13*scale,dark)


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


def shed(art,x,y,yaw,open_sides):
    steel,brick,roof=map(lin,(0x505E5F,0xA5654A,0x737B79))
    if not open_sides:art.box((x,y,0),(43,14,7),yaw,brick)
    art.roof((x,y,7),44,15,2.1,yaw,roof)
    for u in range(-20,21,4):
        for v in (-7,7):
            art.box((x+u,y+v,0),(.36,.36,7),0,steel)
            if not open_sides:art.box((x+u,y+v*1.01,2),(2.2,.15,3.7),0,lin(0x50636B))
        if open_sides:
            beam(art,(x+u,y-7,6.9),(x+u,y,9.1),.22,steel)
            beam(art,(x+u,y,9.1),(x+u,y+7,6.9),.22,steel)


def scenery(k):
    art=Painted(k)
    def pos(d,side):return k.road.at(k.road.index(d),side)
    skyline(art,*pos(710,-185)[:2])
    for d,l in ((245,68),(798,53),(955,98),(2190,44),(11950,57),(20150,48)):
        ship(art,*pos(d,l)[:2],77 if d%2 else 104)
    port_finish(k,art)
    castle(art,*pos(100,19)[:2])
    mas(art,*pos(615,32)[:2])
    port_house(art,*pos(1330,22)[:2])
    for d in (205,300,410,760,850,1720,4390,7600,12700,16700):
        x,y,_=pos(d,-17)
        shed(art,x,y,0,d in (205,300))
        if d in (760,850):
            words(art,"RED STAR LINE",(x,y+7.12,5.2),(-1,0,0),(0,0,1),1.65,28,0xE3DCC5)
    for d in range(160,int(k.length)+400,200):
        x,y,_=pos(d,194)
        crane(art,x,y,k.rng.uniform(.78,1.4))
        for n in range(12):
            u=k.rng.uniform(-43,43);v=k.rng.uniform(13,43)
            for layer in range(k.rng.randint(1,3)):
                colour=lin(k.rng.choice((0xA55E47,0x517E90,0x779082,0xAD9969,0xB2AB99)))
                art.box((x+u,y+v,layer*2.55),(12.2,2.44,2.52),0,colour)
    iron=lin(0x485453)
    # Dock-rail joints, parallel runoff staining and slotted cast-iron drains.
    for d in range(0,int(k.length),16):
        i=k.road.index(d)
        yaw=k.s[i]['h']
        for left,right in ((5.0,7.85),(7.88,10.92)):
            pt=k.road.at(i,(left+right)/2)
            art.box((pt[0],pt[1],-.038),(.028,right-left,.018),yaw,lin(0x777974))
        if d%64==0:
            x,y,z=k.road.at(i,-4.47)
            art.box((x,y,z+.009),(.77,.41,.012),yaw,iron)
            for j in range(5):
                along=(j-2)*.128
                art.box((x+along*math.cos(yaw),y+along*math.sin(yaw),z+.022),(.035,.31,.01),yaw,lin(0x898A80))
    for d in range(0,int(k.length),27):
        x,y,_=pos(d,9.7)
        art.tube((x,y,-.1),.22,.18,.62,iron,iron,9,iron)
        art.tube((x,y,.52),.26,.23,.11,iron,iron,9,iron)
    for d in range(1100,int(k.length),2100):
        for side in (-1,1):
            last=None
            for u in range(-36,37,4):
                x,y,z=pos(d+u,side*5.1)
                art.box((x,y,z),(.13,.15,1.2),0,iron)
                if last:
                    beam(art,last,(x,y,z+1.12),.12,iron)
                last=(x,y,z+1.12)
            x,y,z=pos(d+36,side*6.2)
            art.box((x,y,z),(3.8,2.2,2.3),0,lin(0x6D807C))
            beam(art,(x,y,z+2.2),(x-1.4,y+side*1.6,z+6.9),.38,lin(0xD7D5BC))
    return {'efforts':0}


def ship(art,x,y,length):
    """A moored inland freighter with a fine stem, wheelhouse, hatch covers and an anchor stripe."""
    deck=lin(0x66685F); hull=lin(0x454F57); oxide=lin(0x965B4A)
    sides=[(-.50,.0),(-.40,4.6),(.31,4.6),(.49,2.0),(.50,0)]
    for side in (-1,1):
        for (u,v),(w,t) in zip(sides,sides[1:]):
            a,b=(x+u*length,y+side*v),(x+w*length,y+side*t)
            pts=((*a,WATER),(*b,WATER),(*b,WATER+1.3),(*a,WATER+1.3))
            art.face(pts,(oxide,)*4)
            art.face(((*a,WATER+1.3),(*b,WATER+1.3),(*b,1.8),(*a,1.8)),(hull,)*4)
            art.face(((*a,1.8),(*b,1.8),(b[0],y,1.8),(a[0],y,1.8)),(deck,)*4)
    for i in range(5):
        art.box((x+(i-2)*length*.125,y,1.8),(length*.12,7.5,.75),0,lin(0x818B88))
    art.box((x+length*.33,y,1.8),(8,7.6,2.8),0,lin(0xE2DBBF))
    art.box((x+length*.33,y,4.6),(7.5,6.9,1.15),0,lin(0x6E8489))
    art.box((x+length*.33,y,5.75),(8.5,7.5,.36),0,lin(0xC6C5B9))


def skyline(art,x,y):
    stone=lin(0x9A998C)
    art.box((x,y,0),(31,16,12),0,stone)
    art.roof((x,y,12),32,17,9,0,lin(0x777E7E))
    art.box((x-12,y,10),(8,8,30),0,stone)
    for j in range(5):
        r=5.3-j*.72
        art.tube((x-12,y,40+j*4.8),r,r*.78,4.8,stone,stone,8,stone)
    art.tube((x-12,y,64),1.75,.13,9,stone,stone,8,stone)


def port_finish(k,art):
    black,yellow,red,white=map(lin,(0x454C51,0xE4B846,0xAB5147,0xE7E2CF))
    def sidepoint(d,l):return k.road.at(k.road.index(d),l)
    for d in (k.length-1000,k.length-24):
        x,y,z=sidepoint(d,0)
        for width in (-5.15,5.15):
            art.box((x,y+width,z),(.42,.42,6.6),0,black)
        art.box((x,y-0.01,z+6.15),(.6,10.7,.78),0,red if d<k.length-100 else black)
        if d<k.length-100:
            tri=((x-.34,y-1.05,z+6.12),(x-.34,y+1.05,z+6.12),(x-.34,y,z+4.5))
            art.face(tri,(red,)*3);art.face(tri[::-1],(red,)*3)
        else:
            for j in range(18):
                art.box((x-.32,y-4.9+.56*j,z+6.44),(.05,.54,.29),0,white if j%2 else black)
    for d in range(int(k.length)-440,int(k.length)+15,3):
        for side in (-1,1):
            x,y,z=sidepoint(d,side*4.38)
            art.box((x,y,z),(.1,.15,1.13),0,black)
            art.box((x,y,z+.89),(3.1,.14,.21),0,white if d%18<9 else yellow)
            for j in range(2):
                x1=x+k.rng.uniform(-1.2,1.2);y1=y+side*(.66+j*.61)
                shirt=lin(k.rng.choice((0x5A7986,0xD8B25A,0x637C64,0xAD6256)))
                skin=lin(k.rng.choice((0x946E59,0xC29576,0xDAAD8B)))
                art.tube((x1,y1,z),.15,.17,.81,black,black,7)
                art.tube((x1,y1,z+.81),.18,.22,.55,shirt,shirt,7)
                art.tube((x1,y1,z+1.36),.13,.12,.23,skin,skin,8,skin)
                if j%2:
                    beam(art,(x1,y1,z+1.16),(x1+.34,y1-side*.12,z+1.69),.095,skin)
    for i in range(4):
        x,y,z=sidepoint(k.length-185+i*38,-10.1)
        art.box((x,y,z+.34),(12,2.7,2.8),0,red if i%2 else lin(0x577D91))
        art.box((x,y+1.36,z+1.75),(11.7,.08,1.0),0,lin(0x4D606B))
        for u in (-3.7,3.6):
            art.box((x+u,y+1.18,z),(.87,.43,.85),0,black)
