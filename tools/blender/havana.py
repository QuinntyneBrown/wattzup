"""Golden-hour Malecón. Real road metres drive the bay, Hotel Nacional and harbour mouth."""
import json
import math
from pathlib import Path
from worldkit import Painted, lin

LENGTH=8950
PROFILE=((0,4),(820,5),(1450,7),(2400,5),(3040,4),(4050,6),(4380,4),(5290,5),(6510,4),(7320,6),(8640,5),(8950,4))


def elevation(d):
    for (a,z),(b,h) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(h-z)*max(0,d-a)/(b-a)
    return PROFILE[-1][1]


def direction(d):
    return .32*math.sin(d/1300)+.24*math.sin(d/610)+.11*math.cos(d/241)+.36*math.exp(-((d-8640)/200)**2)


points=[(-110.,0.)]
for d in range(-109,LENGTH+231):
    x,y=points[-1];a=direction(d-.5);points.append((x+math.cos(a),y+math.sin(a)))


def pos(d,off=0):
    i=max(0,min(len(points)-2,math.floor(d)+110));t=d+110-i
    x,y=points[i];u,v=points[i+1];a=direction(d)
    return (x+(u-x)*t-off*math.sin(a),y+(v-y)*t+off*math.cos(a))


def lay(course,theme,bc):
    stages=bc.stages(course['plan']);rows=[]
    for i in range(math.ceil((LENGTH+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y=pos(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=direction(d),k=direction(d+.5)-direction(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
    return rows,stages,LENGTH,sum(s['level']*(s['to']-s['from']) for s in stages)/LENGTH,0


def road(r,st,length,col,bc):
    batches={key:bc.Builder(name,mat) for key,name,mat in [('road','Road','asphalt'),('white','RoadPaint','paint'),('yellow','CentreLine','yellow')]}
    for i,p in enumerate(r.s[:-1]):
        def stripe(key,left,right,z):
            batches[key].quad(r.at(i,left,z),r.at(i,right,z),r.at(i+1,right,z),r.at(i+1,left,z))
        stripe('road',14.9,-5.1,.01)
        for u in (4.95,4.70):stripe('yellow',u+.055,u-.055,.03)
        if int(p['d']/8)%2==0:
            for u in (11.5,8.25,1.45,-1.82):stripe('white',u+.060,u-.06,.029)
    for b in batches.values():b.build(col)


def land(r,col,theme,bc):
    stone=bc.Builder('MaleconStone','terrain');stone.colours=[];stone.uvs=[]
    sea=bc.Builder('FloridaStraits','sea');sea.colours=[]
    urban=bc.Builder('HavanaPavement','terrain');urban.colours=[]
    reef=bc.Builder('LimestoneReef','terrain');reef.colours=[]
    def finish(batch,vertices,c,uv=None):
        batch.quad(*vertices);batch.colours.extend([lin(c)]*4)
        if uv:batch.uvs.extend(uv)
    prev=None
    for d in range(-90,LENGTH+206,5):
        z=elevation(d)
        row=[(*pos(d,off+9.9),z+up) for off,up in ((-250,-.45),(-16,.14),(-15,.14),(-15,0),(5,0),(5,.17),(9.1,.17),(9.1,.9),(9.25,1.02),(9.96,1.02),(10.1,.90),(10.1,-.9))]
        x,y=pos(d,20.9);coast=(*pos(d,21.0+1.2*math.sin(d*.12)),.22+.31*math.sin(d*.23))
        wet=[(x,y,-.13),(x,y+180,-.13),(x,y+3200,-.13)]
        if prev:
            for j,c in enumerate((0xA99178,0xBBB0A3,0xA19587,0x575452,0x938B82,0xC8BDAD,0xC1B6A6,0xDAD1BB,0xD4C9AD,0xC7BCAC,0xA69B86)):
                corners=(prev[j],row[j],row[j+1],prev[j+1]);iswall=j>=6
                finish(stone if iswall else urban,corners,c,[(d/5-1,0),(d/5,0),(d/5,1),(d/5-1,1)] if iswall else None)
            finish(reef,(prev[-1],row[-1],coast,oldcoast),0x827B63)
            for j in (0,1):finish(sea,(oldwet[j],wet[j],wet[j+1],oldwet[j+1]),0x366B79)
        prev=row;oldwet=wet;oldcoast=coast
    for batch in (stone,sea,urban,reef):batch.build(col)
    return None,lambda x,y:r.s[r.tree.find((x,y,0))[1]]['z']-.12


def originals():
    """Read the flattened original HavanaStreet vehicle and fortress artwork in Blender coordinates."""
    import bpy
    path=Path(__file__).parent/'assets/havana-source-models.glb'
    previous=set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(path))
    added=set(bpy.data.objects)-previous;result={}
    for obj in added:
        if obj.type!='MESH':continue
        data=obj.data;attribute=data.color_attributes.active_color
        verts=[tuple(obj.matrix_world@v.co) for v in data.vertices]
        faces=[]
        for polygon in data.polygons:
            ids=list(polygon.vertices)
            cols=[tuple(attribute.data[i].color) for i in (ids if attribute.domain=='POINT' else polygon.loop_indices)]
            faces.append((ids,cols))
        result[obj.name]=(verts,faces)
    for obj in added:bpy.data.objects.remove(obj,do_unlink=True)
    return result


def scenery(k):
    art=Painted(k);original=originals();rng=k.rng
    def frame(d,off):
        x,y=pos(d,off);a=direction(d);z=elevation(d)
        return lambda u,v,w:(x+u*math.cos(a)-v*math.sin(a),y+u*math.sin(a)+v*math.cos(a),z+w),a
    def paint_model(batch,name,location):
        verts,faces=original[name];points=[location(v[1],-v[0],v[2]) for v in verts]
        for ids,cs in faces:batch.face([points[i] for i in ids],cs)
    # Every moving template has a single origin-centred mesh, shared by instances along the full avenue.
    for name,material,key in (('Almendron0','neon-pink','TaxiRed'),('Almendron1','neon-cyan','TaxiTeal'),('QuinceaneraConvertible','neon-violet','Convertible'),('CocoTaxi0','neon-lime','CocoTaxi'),('BiciTaxi0','neon-amber','BiciTaxi')):
        batch=Painted(k,material);batch.b.name=key
        paint_model(batch,name,lambda u,v,w:(u,v,w))
    for i,name in enumerate(('SonTrio','Parada','DominoTable','FruitCart','Manisero','PhotoParty','ZebraCrossing')):
        material=('crowd-0','crowd-1','crowd-2','crowd-3','crowd-4','crowd-5','arrow')[i]
        batch=Painted(k,material);batch.b.name=name
        paint_model(batch,name,lambda u,v,w:(u,v,w))
    fort=Painted(k,'peaks');fort.b.name='Morro'
    q,a=frame(8940,114)
    paint_model(fort,'ElMorro',lambda u,v,w:q(u*.85,v*.85,w*.85-elevation(8940)))
    sizes=json.loads((Path(__file__).parent/'assets/havana-elevations.json').read_text())
    elevations=k.B['paint'];elevations.name='OriginalElevations';elevations.colours=[];elevations.uvs=[]
    d=-65
    while d<LENGTH+120:
        tile=rng.randrange(len(sizes));size=sizes[tile];w=size['width'];h=size['height']
        centre=d+w/2
        d+=w+rng.choice((.3,.5,1.2,6.2))
        if 1430<centre<1680:continue
        q,a=frame(centre,-9.0-rng.uniform(0,.55))
        # The fronts keep the original class's awnings, Cuban flags, peeling
        # paint, shutters, arcade and rooftop tanks. Return walls give depth
        # where a side street interrupts the row.
        tint=rng.choice((0xD69E82,0x99BFB6,0xCAB184,0xB9C0D1,0xD9A79B))
        art.box(q(0,-7.4,.16),(w-.6,13.2,h*.80),a,lin(tint))
        base=.16+size['bottom']
        elevations.quad(q(-w/2,0,base),q(w/2,0,base),q(w/2,0,base+h),q(-w/2,0,base+h))
        elevations.colours.extend([lin(0xffffff)]*4)
        left=(tile%4)/4+.0006;right=left+.2488;top=1-(tile//4)/4-.0006;bottom=top-.2488
        elevations.uvs.extend([(right,bottom),(left,bottom),(left,top),(right,top)])
        if h<26:
            for z in (4.0,8.2):
                art.box(q(0,.26,z),(w-.75,.66,.14),a,lin(0xCBBFB2))
    air=Painted(k,'wood');air.b.name='WallSpray';air.b.uvs=[]
    wash=Painted(k,'accent');wash.b.name='SaltPuddles';wash.b.uvs=[]
    for d in range(17,LENGTH+50,34):
        q,a=frame(d,0);wet=rng.uniform(.3,1.)
        phase=rng.random()
        # A thin fan rolls up from the water and over the seawall. The varying
        # cross section leaves daylight between the individual fingers of spray.
        for offset in range(-6,7):
            width=2.75+.8*math.sin(phase+offset)
            maximum=1+3.4*(1-(offset/7)**2)
            def jet(u,v):
                reach=22.3-v*(6.6+wet)
                return q(u*.96,reach,-1.55+4*v+(maximum+1)*math.sin(v*math.pi)-3*v*v)
            for j in range(7):
                v=j/7;w=(j+1)/7
                pts=(jet(offset,v),jet(offset+.84,v),jet(offset+.84,w),jet(offset,w))
                air.face(pts,(lin(0xDBECE7 if j>2 else 0x86B6AE),)*4)
                air.b.uvs.extend([(phase,v),(phase,v),(phase,w),(phase,w)])
        for j in range(10):
            u=rng.uniform(-6,6);off=rng.uniform(10.1,14.84)
            length=rng.uniform(.45,2.8);w=rng.uniform(.11,.47)
            wash.face((q(u-length,off,.047),q(u,off-w,.047),q(u+length,off,.047),q(u+.1,off+w,.047)),(lin(0xB9C6C5),)*4)
            wash.b.uvs.extend([(phase,0)]*4)
    # Promenade lamps and the ringed trunks and divided crowns of royal palms.
    for d in range(16,LENGTH+100,36):
        q,a=frame(d,17.8)
        art.tube(q(0,0,.17),.20,.078,7.1,lin(0x696C65),lin(0x96948B),8)
        art.box(q(0,-.61,7.21),(.12,1.34,.10),a,lin(0x83847E))
        art.box(q(0,-1.23,7.08),(.30,.64,.12),a,lin(0xE1CDA6))
        if not 1430<d<1660:
            q,a=frame(d+2,-7.5);ht=rng.uniform(9.1,12.6)
            art.tube(q(0,0,0),.32,.24,ht*.77,lin(0xA6A396),lin(0xBDB9A5),9)
            art.tube(q(0,0,ht*.77),.27,.20,ht*.23,lin(0x708B5B),lin(0x7A975D),9)
            for n in range(10):
                angle=n*math.tau/10+rng.uniform(-.12,.12);reach=rng.uniform(2.3,3.4)
                def frond(t,side):
                    w=.39*math.sin(t*math.pi)*side
                    return q(t*reach*math.cos(angle)-w*math.sin(angle),t*reach*math.sin(angle)+w*math.cos(angle),ht+.58*math.sin(t*math.pi)-1.05*t*t)
                for j in range(7):
                    t=j/7;f=(j+1)/7;c=lin(0x577C44 if n%2 else 0x6D8B52)
                    art.face((frond(t,0),frond(f,0),frond(f,1),frond(t,1)),(c,)*4)
                    art.face((frond(t,-.25),frond(f,-.25),frond(f,0),frond(t,0)),(c,)*4)
                    if j>0:
                        for side in (-1,1):
                            centre=frond(t,0);tip=frond(min(1,t+.10),side*2.1)
                            art.face((centre,frond(t+.035,side*.18),(tip[0],tip[1],tip[2]-.37)),(c,)*3)
    for d in range(22,LENGTH+38,28):
        q,a=frame(d,19.45);skin=lin(rng.choice((0x955F45,0xB67D58,0xD8A882,0x7B5344)))
        shirt=lin(rng.choice((0xC76447,0xC7B574,0x499A9C,0xA7AF77,0xA9C8D5)))
        sitting=d%3!=0;feet=.56 if sitting else .15;hip=1.04 if sitting else .97
        for v in (-.12,.12):
            art.tube(q(.11,v-.23,feet),.074,.082,hip-feet,lin(0x434A54),lin(0x606674),7)
        art.tube(q(0,0,hip),.16,.22,.55,shirt,shirt,8)
        art.tube(q(0,0,hip+.55),.12,.14,.23,skin,skin,8)
        art.tube(q(0,0,hip+.74),.145,.10,.10,lin(0x463D36),lin(0x544C40),8)
        if d%4==2:
            # Long tapering rod projecting seawards from a seated angler.
            arm=(q(.05,0,hip+.39),q(.09,2.55,hip+2.42),q(.11,2.57,hip+2.43),q(.10,0,hip+.42))
            art.face(arm,(lin(0x6C675F),)*4)
        if abs(d-6510)<52:
            # Oval guitar body, waist, neck and dark round sound hole.
            art.tube(q(.04,-.23,hip+.22),.22,.18,.21,lin(0x9F6841),lin(0xD7A965),12)
            art.box(q(.25,-.24,hip+.38),(.53,.066,.07),a,lin(0x69452F))
    hotel=Painted(k,'whitewash');hotel.b.name='Nacional'
    q,a=frame(1600,-37)
    paint_model(hotel,'HotelNacional',q)
    return {'efforts':0}


THEME={'lay':lay,'land_builder':land,'road_builder':road,'land':{'mid':0xA79279},'terrain':{'sea':True},
       'haze':0xBECCD0,'sky':[0xE5C7AB,0xC3D6DA,0x93BBCF,0x73A1BD,0x577DA3],
       'light':[0xFFD5A1,1.5],'fill':[0xD6DFE2,0xB9A284],'sun_radius':46,'sun_altitude':.20,'sun_azimuth':.70,
       'palette':{'asphalt':0x626064,'yellow':0xE9CC63,'paint':0xDACEC0}}
