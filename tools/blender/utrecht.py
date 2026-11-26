"""Utrecht's two-level Oudegracht, red fietspaden, Stationsplein and Domtoren."""
import math
from arenberg import beam
from iten_landmarks import pictured,picture,site
from worldkit import Painted,lin

PROFILE=[[0, 4], [2930, 4], [3100, 6], [3275, 4], [6650, 4], [6820, 6], [6995, 4], [11170, 4], [11340, 6], [11515, 4], [16620, 4], [16790, 6], [16965, 4], [20030, 4], [20200, 6], [20375, 4], [22590, 4]]

def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return 4

def heading(d):
    # Four city quarters, with right-angle feeder streets inside each quarter.
    base=math.floor((d+400)/5700)*math.pi/2
    t=(d+400)%5700
    for c,angle in ((1050,.83),(1410,-.83),(2250,-.83),(2680,.83),(4260,.58),(4610,-.58)):
        base+=angle*(.5+.5*math.tanh((t-c)/35))
    if t<80:base-=math.pi/2*.5*(1-math.tanh(t/24))
    if t>5620:base+=math.pi/2*.5*(1+math.tanh((t-5700)/24))
    return base

def route(course,theme,bc):
    st=bc.stages(course['plan']);length=st[-1]['to'];x=y=0;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+bc.STEP/2));y+=bc.STEP*math.sin(heading(d+bc.STEP/2))
    return rows,st,length,sum((s['to']-s['from'])*s['level'] for s in st)/length,1

def road(r,st,length,col,bc):
    paving=bc.Builder('Fietspad','terrain');paving.colours=[];paving.uvs=[]
    for i,p in enumerate(r.s[:-1]):
        pts=[r.at(i,-2.85,.04),r.at(i+1,-2.85,.04),r.at(i+1,2.85,.04),r.at(i,2.85,.04)]
        picture(paving,pts,[(x*.27,y*.27) for x,y,_ in pts])
    paving.build(col)

def land(r,col,theme,bc):
    ground=bc.Builder('WharfPaving','terrain');ground.colours=[];ground.uvs=[]
    for i in range(0,len(r.s)-1,4):
        end=min(i+4,len(r.s)-1)
        for a,b,h in ((-130,-2.82,-.09),(2.82,5.8,-.09),(5.8,30,-4.2),(30,130,-.09)):
            pts=[r.at(i,a,h),r.at(end,a,h),r.at(end,b,h),r.at(i,b,h)]
            picture(ground,pts,[(x*.43,y*.43) for x,y,_ in pts])
    return ground.build(col),lambda x,y:3.8

def scenery(k):
    art=Painted(k);water=pictured(k,'OudegrachtWater');cellars=pictured(k,'WerfCellars');homes=pictured(k,'UtrechtGables')
    trees=pictured(k,'WharfElms');bikes=pictured(k,'WharfBikes');dom=pictured(k,'Domtoren');rim=pictured(k,'UtrechtSky')
    brick,stone,dark,white,timber,zinc,green,red,lit=map(lin,(0x87594b,0xa79c8e,0x343c3e,0xeee6cf,0x724d3c,0x556968,0x527951,0xb14131,0xe5ce90))
    def panel(mesh,pts,idx=0,count=1):
        a=idx/count;b=(idx+1)/count;picture(mesh,pts,((a+.001,0),(b-.001,0),(b-.001,1),(a+.001,1)))
    def facade(mesh,at,u,v,w,h,idx,count,base=0):
        panel(mesh,[at(u+x,v,base+z) for x,z in ((-w/2,0),(w/2,0),(w/2,h),(-w/2,h))],idx,count)
    def cross(mesh,at,u,v,w,h,idx,count,base=0):
        panel(mesh,[at(u,v+x,base+z) for x,z in ((-w/2,0),(w/2,0),(w/2,h),(-w/2,h))],idx,count)
    for j,d in enumerate(range(-80,22760,16)):
        at,h=site(k,d)
        pts=[k.road.pos(d+u,v,-3.4) for u,v in ((0,11),(16,11),(16,25),(0,25))]
        picture(water,pts,[(x*.1,y*.1) for x,y,_ in pts])
        for wall,deck in ((5.85,8.45),(29.85,27.4)):
            panel(cellars,[k.road.pos(d+u,wall,z) for u,z in ((0,-2.98),(16,-2.98),(16,-.04),(0,-.04))])
            outer=11.2 if wall<10 else 24.8
            art.box(at(8,(wall+outer)/2,-3.4),(16.18,abs(outer-wall),.48),h,stone)
            if j%4==1:
                art.tube(at(6,deck,-2.9),.11,.1,1.35,dark,timber,6)
                art.tube(at(6,deck,-1.57),1.25,.16,.45,timber,lit,8,cap=lit)
                art.box(at(5.4,deck+.5,-2.9),(.58,.52,.62),h,dark)
        # Keep views into the lower level from the near bank between the iron posts.
        for u in (3,11):
            art.box(at(u,5.64,-.05),(.1,.11,1),h,dark)
        beam(art,at(0,5.64,.84),at(16,5.64,.84),.085,dark)
        if not 8120<d<8640:
            for side in (-1,1):
                v=-8.5 if side<0 else 33.2
                idx=(j*3+(1 if side<0 else 0))%4
                high=9+(j*7+idx)%6
                facade(homes,at,8,v,15.8,high,idx,4)
                # Solid side returns give each frontage depth up to its roofline.
                if j%3==0:art.box(at(.22,v+side*2.9,-.04),(.36,5.7,high*.75),h,brick)
        if j%4==0:
            for side,v in ((0,4.1),(1,31.1)):
                cross(trees,at,4+j%9,v,8.3,9.2+j%4,(j//4+side)%4,4,-.1)
        if j%5==1:
            facade(bikes,at,7,-3.6,5.8,1.6,0,3,-.04)
        if j%2==0:
            art.box(at(3,0,.049),(.96,.1,.012),h,white)
        if j%44==0:
            # Shallow segmental brick bridge over the canal, with a shaped arch opening.
            for n in range(16):
                a=n*math.pi/16;b=(n+1)*math.pi/16
                def arch(t,u,extra):return at(u,18+7.6*math.cos(t),-3.75+3.24*math.sin(t)+extra)
                for u in (-1.8,1.8):
                    art.face((arch(a,u,0),arch(b,u,0),at(u,18+7.6*math.cos(b),.12),at(u,18+7.6*math.cos(a),.12)),(brick,)*4)
                art.face((arch(a,-1.8,0),arch(b,-1.8,0),arch(b,1.8,0),arch(a,1.8,0)),(stone,)*4)
            art.box(at(0,18,.1),(3.7,27,.2),h,stone)
            for u in (-1.7,1.7):
                for i in range(8):art.box(at(u,5+i*3.6,.3),(.10,.14,.86),h,dark)
                beam(art,at(u,5,1.14),at(u,31,1.14),.1,dark)
    # Domtoren: square masonry base, recessed bell levels, open octagonal lantern and copper spire.
    at,h=site(k,4420,1.5)
    for base,top,ra,rb,n,idx in ((0,46,10,9,4,0),(46,70,8.8,8.2,4,1),(70,91,6.9,6.1,8,1)):
        for j in range(n):
            a=(j+.5)*math.tau/n;b=(j+1.5)*math.tau/n
            def v(t,r,z):return at(r*math.cos(t),r*math.sin(t),z)
            panel(dom,(v(a,ra,base),v(b,ra,base),v(b,rb,top),v(a,rb,top)),idx,2)
            art.tube(v(a,rb,top),.63,.09,3.1,stone,stone,5)
        art.tube(at(0,0,top-.6),rb*1.06,rb*1.06,.8,stone,stone,n,cap=stone)
    art.tube(at(0,0,91),6.4,.28,20.7,zinc,dark,8,cap=zinc)
    # The station apron descends through an array of actual two-storey racks.
    at,h=site(k,8405,-14)
    for j in range(6):
        u=j*8-22
        art.box(at(u,-3,-.4),(.55,.66,5.5),h,stone)
        art.box(at(u,7,-.4),(.55,.66,5.5),h,stone)
        art.box(at(u,2,4.85),(8.1,13,.5),h,white)
        for z in (.22,1.61):
            art.box(at(u,-2,z),(7.6,1.8,.1),h,zinc)
            facade(bikes,at,u,-2,7.0,1.45,0,3,z)
        art.box(at(u,2,4.65),(5.7,.22,.14),h,lit)
    # The priority markings at the signal form triangles pointing back at approaching bikes.
    at,h=site(k,12344)
    for n in range(8):
        v=-2.55+n*.71
        art.face((at(0,v,.08),at(0,v+.43,.08),at(-.71,v+.22,.08)),(white,)*3)
    for v in (-3.15,3.15):
        art.box(at(1,v,0),(.12,.12,3.25),h,dark)
        art.box(at(1,v,2.3),(.28,.43,.91),h,dark)
        art.box(at(.83,v,2.39),(.065,.22,.19),h,green)
    for j in range(72):
        a=j*math.tau/72;b=(j+1)*math.tau/72;u=j%18/18;v=u+1/18
        if j//18%2:u,v=1-u,1-v
        def sky(t,z):return 2600+13800*math.cos(t),2000+13800*math.sin(t),z
        picture(rim,(sky(a,-1300),sky(b,-1300),sky(b,7500),sky(a,7500)),((u,0),(v,0),(v,1),(u,1)))
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':2.85,'terrain':{'sea':False},'land':{'mid':0x81756b},'sky':[0xd6dfdf,0xc4d6df,0xa6bac9,0x91abbe,0x7997ac],'haze':0xcbdbdc,'light':[0xffefd4,1.45],'fill':[0xd3e4ed,0x8c8075],'sun_altitude':.69,'sun_azimuth':-.86}
