"""The Northland bay road, from the Paihia waterfront to Waitangi and the Russell shore."""
import math
import bpy
from functools import lru_cache
from mathutils import Vector
from worldkit import Painted,lin,smooth

INLET=(3112,3242)
def bearing(d):
    return .32*math.sin(d/427)+.19*math.sin(d/116)-sum(.52*math.exp(-((d-q)/114)**2) for q in (310,1450,2920,8000,26570))

def height(d):
    coast=3.9+2.5*(math.sin(d/510)**2)+7*math.exp(-((d-5430)/600)**2)+12*math.exp(-((d-15620)/720)**2)
    blend=smooth(2980,3100,d)*(1-smooth(3250,3350,d))
    return coast*(1-blend)+5.15*blend

def route(course,theme,bc):
    st=bc.stages(course['plan']);length=st[-1]['to'];mean=sum((s['to']-s['from'])*s['level'] for s in st)/length
    x=-bc.LEAD_IN;y=0;samples=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        if i:
            m=bearing(d-bc.STEP/2);x+=bc.STEP*math.cos(m);y+=bc.STEP*math.sin(m)
        samples.append(dict(d=d,x=x,y=y,z=height(d),h=bearing(d),k=bearing(d+.5)-bearing(d-.5),g=100*(height(d+.5)-height(d-.5))))
    return samples,st,length,mean,0

def beach(d):return 28+12*math.sin(d/282)+5*math.cos(d/192)

def ground(d,l):
    road=height(d);mouth=smooth(3090,3122,d)*(1-smooth(3234,3260,d))
    if l<0:
        verge=max(0,-l-4.3)
        h=road-.15-(road+.9)*smooth(0,beach(d),verge)-max(0,verge-beach(d))*.16
    else:
        v=max(0,l-11);h=road-.17+v*(.17+.1*math.sin(d/442)+.08*math.cos(v/120+d/550))*smooth(0,100,v)
    return h*(1-mouth)-2.2*mouth

def land(road,col,theme,bc):
    b=bc.Builder('Grass banks and tidal beach','terrain');b.colours=[]
    sides=(-164,-85,-48,-31,-23,-18,-12,-7,-4,0,5,12,22,58,120,260,580)
    for i in range(0,len(road.s)-1,4):
        end=min(i+4,len(road.s)-1)
        for a,c in zip(sides,sides[1:]):
            pts=[];cols=[]
            for j,l in ((i,a),(end,a),(end,c),(i,c)):
                d=road.s[j]['d'];z=ground(d,l)
                pts.append(road.at(j,l,z-road.s[j]['z']))
                patch=math.sin(d/53+l/9)+.5*math.sin(d/126-l/34)
                if -l>beach(d)*.58:hue=0xD7C99A if patch<0 else 0xE4D4A9
                else:hue=0x7FA05A if patch>0 else 0x698E50
                cols.append(lin(hue))
            b.quad(*pts);b.colours.extend(cols)
    sea=bc.Builder('Sheltered bay','sea')
    sea.quad((-11000,-14000,0),(42000,-14000,0),(42000,1200,0),(-11000,1200,0));sea.build(col)
    return b.build(col),lambda x,y:0

def road(road,st,length,col,bc):
    t=bc.Builder('Road','asphalt');mark=bc.Builder('CentreLine','yellow');edge=bc.Builder('RoadPaint','paint')
    for i in range(len(road.s)-1):
        def strip(b,l,r,z):b.quad(road.at(i,r,z),road.at(i+1,r,z),road.at(i+1,l,z),road.at(i,l,z))
        strip(t,4.15,-4.15,0)
        strip(mark,.13,.015,.017)
        if i%4<2:strip(mark,-.015,-.125,.017)
        for side in (-1,1):strip(edge,side*3.94+.044,side*3.94-.044,.015)
    t.build(col);mark.build(col);edge.build(col)

THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':True},'land':{'mid':0x72965E},
       'sky':[0xBFDEE5,0x9FD1E0,0x7ABAD5,0x579BCC,0x427EB5],'haze':0xAACCD4,'light':[0xFDE6C0,2.8],
       'fill':[0xCCDFE7,0xA2AD83],'sun_azimuth':-.41,'sun_altitude':.52,'palette':{'asphalt':0x6F7373,'yellow':0xE4BA48}}

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


def tree(art,x,y,z,size,seed):
    """A low, split pohutukawa trunk carries overlapping domes of evergreen foliage."""
    bark=lin(0x736A59)
    for arm in range(4):
        yaw=seed+arm*2.4;cs,sn=math.cos(yaw),math.sin(yaw)
        a=(x,y,z);elbow=(x+cs*.22*size,y+sn*.22*size,z+.52*size)
        tip=(x+cs*.63*size,y+sn*.63*size,z+.82*size)
        beam(art,a,elbow,.13*size,.11*size,bark);beam(art,elbow,tip,.084*size,.076*size,bark)
        cx,cy,cz=tip
        for n in range(8):
            t=n*math.tau/8;e=t+math.tau/8;radius=size*(.51+.13*math.sin(arm+n*9.3))
            p=(cx+radius*math.cos(t),cy+radius*math.sin(t),cz-.07*size)
            q=(cx+.57*size*math.cos(e),cy+.57*size*math.sin(e),cz-.08*size)
            high=(cx+.05*size,cy-.04*size,cz+.36*size)
            co=lin((0x476A47,0x52784E,0x537C56)[(arm+n)%3])
            art.face((p,q,high),(co,co,lin(0x709265)));art.face((q,p,(cx,cy,cz-.24*size)),(co,)*3)

def island(k,art,d,side,rx,ry,h):
    x,y,_=k.road.pos(d,side);rings=[]
    for j,(radius,z) in enumerate(((1.05,-1.1),(1,.65),(.86,h*.35),(.62,h*.70),(.24,h),(.02,h*.94))):
        row=[]
        for n in range(13):
            t=math.tau*n/13;wob=1+.16*math.sin(n*2.8+d*.03)
            row.append((x+rx*radius*wob*math.cos(t),y+ry*radius*wob*math.sin(t),z+.1*h*math.sin(n+1.24*j)*max(0,j-1)/3))
        rings.append(row)
    for j in range(len(rings)-1):
        for n in range(13):
            q=(n+1)%13;f=(rings[j][n],rings[j][q],rings[j+1][q],rings[j+1][n])
            low=lin((0x837D6B,0x958B71,0x576F45,0x526F46,0x63835B)[j]);hi=lin((0xC4B595,0xA9987D,0x728452,0x6E8C5D,0x749569)[j]);art.face(f,(low,low,hi,hi))

def building(k,art,d,l,width,depth,high,tint,shop=None):
    x,y,_=k.road.pos(d,l);z=ground(d,l);yaw=bearing(d)+(math.pi if l<0 else 0);cs,sn=math.cos(yaw),math.sin(yaw)
    def p(u,v,w):return(x+u*cs-v*sn,y+u*sn+v*cs,z+w)
    def box(u,v,w,a,b,c,color):art.box(p(u,v,w),(a,b,c),yaw,lin(color))
    trim=0xE6E1CC
    box(0,0,-.7,width,depth,high+.7,tint)
    art.roof(p(0,0,high),width+.45,depth+.3,1.65,yaw,lin(0x697E76 if shop else 0x788681))
    for i in range(int(high/.32)):box(0,-depth/2-.04,.26+i*.32,width,.08,.033,0x9FA9A1)
    for n in range(3):
        u=(n-1)*width*.31;box(u,-depth/2-.09,.5,1.8,.14,1.86,trim);box(u,-depth/2-.18,.64,1.55,.10,1.57,0x698389)
        box(u,-depth/2-.24,.65,.09,.07,1.55,trim)
    e=-depth/2-2.0
    box(0,e+.9,2.61,width+1,2.44,.2,trim)
    for n in (-1,0,1):box(n*(width/2-.15),e,.03,.13,.13,2.65,trim)
    if shop:
        box(0,e-.07,2.65,width+.25,.19,.8,0x597B76)
        words(art,shop,p(0,e-.22,2.81),(cs,sn,0),(0,0,1),.60,width-.8,0xF0E8D1)

def wharf(k,art):
    d=365;yaw=bearing(d);x,y,z=k.road.pos(d,0);cs,sn=math.cos(yaw),math.sin(yaw)
    def p(u,v,h):return(x+cs*u-sn*v,y+sn*u+cs*v,h)
    def box(u,v,h,a,b,c,col):art.box(p(u,v,h),(a,b,c),yaw,lin(col))
    deck=2.9
    for lane in range(-67,-9,3):
        box(0,lane,deck,7.7,2.99,.28,0x978D75)
        for side in (-1,1):
            box(side*3.68,lane,-.8,.26,.3,4.9,0x7E8177)
            for h in (.51,1.03):box(side*3.68,lane,deck+h,.11,3.05,.10,0xE3E4CF)
    for u in (-4.7,4.7):
        for v in (-49,-58,-65):box(u,v,-.9,.41,.4,6.95,0x8A9587)
    box(0,-56,2.8,12,19,.45,0xA59982)
    art.roof(p(0,-56,6),13.4,20.0,3.8,yaw,lin(0x54846A))
    box(0,-47,5.5,10,.28,1.06,0xEEE9D7)
    words(art,'PAIHIA WHARF',p(0,-46.81,5.72),(-cs,-sn,0),(0,0,1),.72,8.9,0x49695E)

def waitangi(k,art):
    d=3296;l=-12.4;x,y,_=k.road.pos(d,l);z=ground(d,l);h=bearing(d)+math.pi/2;cs,sn=math.cos(h),math.sin(h)
    def p(u,v,w):return(x+cs*u-sn*v,y+sn*u+cs*v,z+w)
    art.box(p(0,4,-.6),(11,13,3.6),h,lin(0x8F5846))
    art.roof(p(0,4,3.0),12.0,14,4.65,h+math.pi/2,lin(0x8D6F56))
    for side in (-1,1):
        beam(art,p(0,-3.25,7.7),p(side*6.1,-3.25,2.8),.34,.42,lin(0xA45444))
        beam(art,p(side*4.8,-3.2,-.1),p(side*4.8,-3.2,3.8),.54,.52,lin(0xA34F40))
        for j in range(8):
            beam(art,p(side*4.8-.18,-3.52,.22+j*.37),p(side*4.8+.18,-3.52,.36+j*.37),.055,.065,lin(0xD29172))
    art.box(p(0,-2.76,.04),(2.82,.23,3.25),h,lin(0x4B443A))
    xx,yy,zz=k.road.pos(3324,-10);base=ground(3324,-10)
    art.tube((xx,yy,base),.2,.085,16,lin(0xD8D9C8),lin(0xE7E9DB),8)
    beam(art,(xx-2.25,yy,base+12),(xx+2.25,yy,base+12),.12,.12,lin(0xD4D7CB))
    for j in range(4):
        for side in (-1,1):
            i=INLET[0]+j*40;x,y,z=k.road.pos(i,side*3.9)
            art.box((x,y,-2.3),(1.05,.8,z+2.2),bearing(i),lin(0x9C9C8B))
    for i in range(INLET[0],INLET[1],3):
        for side in (-1,1):
            l=side*4.3;x,y,z=k.road.pos(i,l)
            art.box((x,y,z),(.13,.16,1.06),bearing(i),lin(0xA2ACA9))
            for up in (.50,1.03):beam(art,k.road.pos(i,l,up),k.road.pos(i+3,l,up),.085,.09,lin(0xCCD0C7))

def scenery(k):
    art=Painted(k);sky=Painted(k,'peaks');rng=k.rng
    wharf(k,art);waitangi(k,art)
    for i,d in enumerate((86,112,142,191,230,264,303,352,388,419,447)):
        building(k,art,d,12.8,rng.uniform(9,15),7,4.5+(i%3)*.65,(0xB6B2A4,0xAABABA,0xD7C8B0)[i%3],('BAY CAFE','MARSDEN ROAD','FERRY TICKETS','BOOKS','PIER CAFE')[i%5])
    for base in (8170,26575):
        for j in range(13):
            d=base+j*17;building(k,art,d,12+(j%3),10.4,6.5,3.7+(j%3)*.42,(0xE6E3D5,0xDADACC,0xD1DCD8)[j%3],None)
    for d in range(15,27930,51):
        if 3080<d<3345:continue
        lane=rng.choice((-1,1))*rng.uniform(6.8,15.5)
        x,y,_=k.road.pos(d,lane);tree(art,x,y,ground(d,lane),rng.uniform(3.9,6.6),rng.random()*6)
    for d in (92,161,314,8181,8225,26585,26653):
        x,y,_=k.road.pos(d,-8);tree(art,x,y,ground(d,-8),8.2,1.24+d*.01)
    for base in (0,1420,3250,5620,8180,10900,15330,18120,22600,26510):
        for n in range(5):
            d=base+110+105*n;island(k,sky,d,-(65+51*n),26+11*n,18+4*n,10+4*n)
    for d in range(-500,29300,320):
        x,y,_=k.road.pos(d,570);tree_height=70+43*math.sin(d/720)
        island(k,sky,d,620,420,190,tree_height)
    return {'efforts':0}
