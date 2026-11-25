"""Lake Louise, from the Château terrace and canoe dock to the mountain roads."""
import math
import sys
from bondi import beam, words
from iten_landmarks import picture, pictured, site
from worldkit import Painted, lin, smooth


def bearing(d):
    return .29*math.sin(d/468)-.16*math.cos(d/216)+.28*math.sin(d/1190)


def route(course, theme, bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    x=y=0;z=1738;rows=[]
    for i in range(math.ceil((bc.LEAD_IN+length+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        stage=next((s for s in stages if d<s['to']),stages[-1])
        g=(stage['level']-mean)*.0025 if 0<=d<length else 0
        h=bearing(d);rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=bearing(d+.5)-bearing(d-.5),g=g*100))
        z+=g*bc.STEP;x+=bc.STEP*math.cos(bearing(d+bc.STEP/2));y+=bc.STEP*math.sin(bearing(d+bc.STEP/2))
    return rows,stages,length,mean,.25


def road(r,st,length,col,theme):
    bc=sys.modules[type(r).__module__];b=bc.Builder('LouiseGravel','terrain');b.colours=[]
    for i,p in enumerate(r.s[:-1]):
        pavement=3380<p['d']<5250 or p['d']>6740
        for a,c,t in ((-3.5,-3.1,0x868278),(-3.1,3.1,0x707170 if pavement else 0xA69D85),(3.1,3.5,0x998E76)):
            b.quad(r.at(i,a),r.at(i+1,a),r.at(i+1,c),r.at(i,c));b.colours.extend([lin(t)]*4)
    b.build(col)


def edge(d):
    return 12+19*(smooth(3300,3750,d)-smooth(4810,5380,d))+7*math.cos(d/275)**2


def land(r,col,theme,bc):
    b=bc.Builder('LouiseBank','terrain');b.colours=[]
    level=min(a['z'] for a in r.s)-1.15
    def height(d,off,z):
        if off>3:return z-.17+(level-.40-z+.17)*smooth(4,edge(d)+3,off)
        return z-.17+smooth(7,240,-off)*(31+19*math.sin(d/250))
    last=None
    for i in range(0,len(r.s),2):
        p=r.s[i];d=p['d'];row=[]
        for off,t in ((-480,0x435A49),(-190,0x516655),(-70,0x5F7355),(-30,0x6A785B),(-8,0x70835A),(-3,0x857F6A),(3.2,0xB2A68F),(6.1,0x969078),(edge(d),0x7C857C),(edge(d)+4,0x647B74)):
            x,y,_=r.at(i,off);row.append(((x,y,height(d,off,p['z'])),lin(t)))
        if last:
            for a,c,e,f in zip(last,last[1:],row[1:],row):
                b.quad(a[0],f[0],e[0],c[0]);b.colours.extend((a[1],f[1],e[1],c[1]))
        last=row
    b.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));p=r.s[i]
        off=-(x-p['x'])*math.sin(p['h'])+(y-p['y'])*math.cos(p['h'])
        return height(p['d'],off,p['z'])
    return None,sample


def facade(mesh,at,u1,u2,v,lo,hi,tile):
    a,b=tile
    picture(mesh,(at(u1,v,lo),at(u2,v,lo),at(u2,v,hi),at(u1,v,hi)),((a+.003,b+.003),(a+.497,b+.003),(a+.497,b+.497),(a+.003,b+.497)))


def chateau(k,art,walls):
    at,h=site(k,140,-34)
    cream=lin(0xDECEAA);slate=lin(0x536566);trim=lin(0xEBE0CB);glass=lin(0x52646C)
    for u,v,w,depth,high in ((0,0,62,15,24),(-36,4,17,23,29),(35,4,18,23,27),(-49,0,13,16,19),(49,0,13,16,19)):
        art.box(at(u,v,-.28),(w,depth,high),h,cream)
        art.box(at(u,v,high-.42),(w+.6,depth+.6,.5),h,trim)
        art.roof(at(u,v,high),w,depth,3.2,h,slate)
        bays=max(1,round(w/19))
        for j in range(bays):
            left=u-w/2+w*j/bays;right=left+w/bays
            facade(walls,at,left,right,v+depth/2+.09,3.80,high-.46,(0,.5))
            facade(walls,at,left,right,v+depth/2+.09,.06,3.80,(.5,.5))
        # The short wings face a rider approaching along the shore.
        def end(a,b,c):return at(u-w/2-.08,v-a,c)
        facade(walls,end,-depth/2,depth/2,0,3.80,high-.46,(0,.5))
        facade(walls,end,-depth/2,depth/2,0,.06,3.80,(.5,.5))
    for i in range(-9,10):
        art.box(at(i*3.65,10,-.18),(.70,1.15,3.92),h,trim)
    art.box(at(0,9.7,3.7),(70,3.3,.68),h,trim)
    for a in (-23,23):
        art.tube(at(a,7.2,20),2.8,2.8,7,cream,trim,10)
        art.tube(at(a,7.2,27),3.1,.09,5,slate,slate,10)


def scenery(k):
    art=Painted(k);water=Painted(k,'sea');wood=lin(0x78513E);level=min(a['z'] for a in k.road.s)-1.15
    walls=pictured(k,'ChateauWalls');chateau(k,art,walls)
    peaks=pictured(k,'VictoriaGlacier')
    # This ridge stands in a fixed arc beyond the head of the lake. Its reflection ends at lake level.
    for i in range(18):
        def ridge(n,top):
            angle=-.76+n*1.96/18
            return (2450+9050*math.cos(angle),-1100+9050*math.sin(angle),level+(2340 if top else -24))
        lo=i/18;hi=(i+1)/18
        picture(peaks,(ridge(i,False),ridge(i+1,False),ridge(i+1,True),ridge(i,True)),((lo,0),(hi,0),(hi,1),(lo,1)))
    # The walls across the lake rise directly from the water, in front of Mount Victoria.
    mountains=type(k.B['terrain'])('FairviewRock','terrain');mountains.colours=[];k.B['FairviewRock']=mountains
    previous=None
    for d in range(-1200,10201,62):
        rows=[]
        bank=1490+105*math.sin(d/616)+75*math.sin(d/377)
        height=(230+1090*math.exp(-((d-5480)/1040)**2)
                +1190*math.exp(-((d-7670)/950)**2)+340*math.exp(-((d-310)/865)**2))
        for j,(distance,rise) in enumerate(((0,0),(80,.08),(190,.21),(278,.33),(369,.48),(428,.52),(518,.67),(609,.81),(738,1),(930,.73))):
            x=d+22*math.sin(d/210+j*.34);y=bank+distance
            noise=16*math.sin(d/65+j*.86)+9*math.sin(d/29+j*.8)
            z=level+rise*height+(noise if j else -.25)
            if j<3:color=(0x416054,0x465C49,0x4F6853)[j]
            elif z>level+950+56*math.sin(d/89) and j>6:color=0xDCDFD9
            else:color=(0x7C817E,0x929793,0x606C6D,0x90948D)[j%4]
            rows.append(((x,y,z),lin(color)))
        if previous:
            for a,b,c,e in zip(previous,previous[1:],rows[1:],rows):
                mountains.quad(a[0],e[0],c[0],b[0]);mountains.colours.extend((a[1],e[1],c[1],b[1]))
        previous=rows
    trees=pictured(k,'LouiseSpruce')
    last=None
    for d in range(-80,8350,18):
        row=[]
        for off,tint in ((edge(d)-1,0x8FBDA7),(edge(d)+5,0x64C2AE),(edge(d)+36,0x44B6A8),(360,0x3BA598),(1750,0x659F97),(6100,0x537E7C)):
            x,y,_=k.road.pos(d,off);row.append(((x,y,level),lin(tint)))
        if last:
            for a,b,c,e in zip(last,last[1:],row[1:],row):water.face((a[0],e[0],c[0],b[0]),(a[1],e[1],c[1],b[1]))
        last=row
        for j in range(4):
            off=-k.rng.uniform(6,106)
            if 15<d<222 and off>-62:continue
            if 3380<d<5150 and j==0:off=k.rng.uniform(8,edge(d)-3)
            x,y,_=k.road.pos(d+k.rng.uniform(-9,9),off);z=k.height_at(x,y)-.45
            size=k.rng.uniform(8,22);yaw=bearing(d)+k.rng.uniform(-.65,.65);dx=.28*size*math.sin(yaw);dy=.28*size*math.cos(yaw)
            u=.25*k.rng.randrange(2);v=0
            picture(trees,((x-dx,y-dy,z),(x+dx,y+dy,z),(x+dx,y+dy,z+size),(x-dx,y-dy,z+size)),((u,v),(u+.25,v),(u+.25,1),(u,1)))
    # Rental boathouse sits on piles. Planks and floats descend to the water beside it.
    at,h=site(k,1250,25);floor=level-at(0,0,0)[2]+1.1
    art.box(at(0,0,floor),(17,8,3.4),h,wood);art.roof(at(0,0,floor+3.4),17,9,2.8,h,lin(0x69726F))
    facade(walls,at,-8.50,8.50,-4.16,floor+.08,floor+3.39,(0,0))
    for u in range(-8,9,2):art.box(at(u,-4.1,floor+.32),(.13,.14,3),h,lin(0xAAA392))
    for u in (-5,0,5):art.box(at(u,-4.13,floor+.87),(3.35,.13,1.67),h,lin(0x403E39))
    for j in range(67):
        art.box(at(-17+j*.45,-6.5,floor-.45),(.43,4,.22),h,lin(0xA79375 if j%3 else 0x918572))
    for d in range(30,8100,27):
        if 3450<d<5100 or d>6700:continue
        at,h=site(k,d,5.1)
        for j in range(7):
            art.box(at(j*1.15,0,-.43),(1.12,.63,.91+(j%3)*.05),h,lin((0x92948B,0x9D9D91,0x8F938F)[j%3]))
        if d%81==30:
            art.box(at(1,-1.07,.39),(2.4,.52,.12),h,wood)
            art.box(at(1,-.86,.68),(2.4,.13,.38),h,wood)
            for u in (0,2):art.box(at(u,-1.06,-.15),(.14,.38,.56),h,lin(0x4C5350))
    for d,name in ((4166,'BOW VALLEY PARKWAY'),(7550,'MORAINE LAKE ROAD')):
        at,h=site(k,d,-4.5)
        for j in (-1.55,1.55):art.box(at(0,j,-.15),(.17,.17,2.7),h,wood)
        art.box(at(0,0,1.2),(.20,4.2,1.62),h,lin(0x476450))
        words(art,name,at(-.115,0,1.72),(math.sin(h),-math.cos(h),0),(0,0,1),.42,3.74,0xF7EDD5)
    return {'efforts':0}


THEME={'lay':route,'surface_builder':road,'land_builder':land,'terrain':{'sea':False},
       'land':{'mid':0x76835E},'road_half_width':3.5,'sky':[0xCBDDDB,0xBBD9E4,0x91C3DE,0x669DD0,0x3E74B5],
       'haze':0xBED1D0,'light':[0xFFF1D7,1.62],'fill':[0xC8DEE9,0xA49A80],'sun_altitude':.70,'sun_azimuth':.83}
