"""The road from the Wensleydale barns to the Buttertubs and into Swaledale."""
import math
from worldkit import Painted, lin, smooth

LENGTH=24046.7
START=-180
PATH=[]
PROFILE=((0,231),(1900,251),(3260,281),(5500,350),(7480,450),(9250,526),(10100,501),
         (11400,462),(13100,348),(14520,300),(16200,285),(18300,318),(20200,302),(22880,260),(24047,266))


def height(d):
    if d<=0:return PROFILE[0][1]
    for (a,h),(b,z) in zip(PROFILE,PROFILE[1:]):
        if d<=b:
            f=(d-a)/(b-a)
            return h+(z-h)*(.57*f+.43*f*f*(3-2*f))
    return PROFILE[-1][1]


def heading(d):
    return .25+.54*math.sin(d/1150)+.2*math.sin(d/239)+.18*math.sin(d/137)+.68*math.exp(-((d-7480)/285)**2)


def pose(d,left=0,up=0):
    t=max(0,min(d-START,len(PATH)-1.001));i=int(t);f=t-i
    a,b=PATH[i:i+2];h=heading(d)
    return(a[0]+f*(b[0]-a[0])-left*math.sin(h),a[1]+f*(b[1]-a[1])+left*math.cos(h),height(d)+up)


def lay(course,theme,bc):
    stages=bc.stages(course['plan']);PATH.clear();x,y=0,0
    for d in range(START,math.ceil(LENGTH)+360):
        PATH.append((x,y));h=heading(d+.5);x+=math.cos(h);y+=math.sin(h)
    rows=[]
    for i in range(math.ceil((bc.LEAD_IN+LENGTH+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,z=pose(d)
        rows.append(dict(x=x,y=y,z=z,d=d,h=heading(d),k=heading(d+.5)-heading(d-.5),g=100*(height(d+.5)-height(d-.5))))
    return rows,stages,LENGTH,sum((s['to']-s['from'])*s['level'] for s in stages)/LENGTH,0


def road(rows,stages,length,col,bc):
    b=bc.Builder('Buttertubs road','asphalt')
    paint=bc.Builder('Road paint','terrain');paint.colours=[]
    for d in range(-80,int(length)+160,4):
        b.quad(pose(d,2.84),pose(d,-2.84),pose(d+4,-2.84),pose(d+4,2.84))
        if (d<260 or 6200<d<10500 or d>22000) and d%16==0:
            vs=[pose(d,.065,.022),pose(d,-.065,.022),pose(d+2.7,-.065,.022),pose(d+2.7,.065,.022)]
            paint.faces.append(tuple(paint.v(p) for p in vs));paint.colours.extend([lin(0xd9d8c9)]*4)
    b.build(col);paint.build(col)


def ground_height(d,side):
    dist=max(0,abs(side)-3.5)
    drop=smooth(5100,6900,d)*(1-smooth(11300,12900,d))
    return -.11+dist*((.085+.025*math.sin(d/170)) if side>0 else -(.055+.47*drop))+min(1,dist/48)*(3.3*math.sin(d/174+side/57)+2.1*math.sin(d/396-side/125))


def ground(rows,col,theme,bc):
    b=bc.Builder('Fells and pastures','terrain');b.colours=[]
    for d in range(-80,int(LENGTH)+150,14):
        moor=6850<d<11820
        for sign in (-1,1):
            for a,c in ((2.76,3.95),(3.95,8),(8,37),(37,92),(92,165)):
                green=(0x7c8754,0x819152,0x899653,0x7d8c53)[int((d+300)/287+sign)%4]
                tint=(0x999789 if a<3 else (0x857655 if moor else green))
                pts=[pose(t,l,ground_height(t,l)) for t,l in ((d,sign*a),(d,sign*c),(d+14,sign*c),(d+14,sign*a))]
                b.faces.append(tuple(b.v(p) for p in (pts[::-1] if sign>0 else pts)));b.colours.extend([lin(tint)]*4)
    return b.build(col),lambda x,y:0


THEME=dict(lay=lay,land_builder=ground,road_builder=road,terrain={'sea':False},land={'mid':0x85905f},
           haze=0xb9c0b8,wet=.26,sky=[0xe2dfc8,0xbccbd2,0xa6bbc9,0x8faabd,0x849eaf],
           light=[0xffeaca,2.48],fill=[0xc7d6db,0x909672],sun_azimuth=3,sun_altitude=.49,
           palette={'asphalt':0x616367})


def scenery(kit):
    art=Painted(kit);rng=kit.rng
    # Tapered dry-stone walls: two rough faces, a rubble core and on-edge coping stones.
    for start,end,side in ((-40,490,1),(870,1690,-1),(2520,3520,1),(3160,3610,-1),(7050,7660,1),
                            (8550,8890,1),(9020,9430,-1),(13730,14230,1),(22120,23190,1),(22730,23250,-1)):
        for d in range(start,end,4):
            if d%241<8:continue
            l=side*4.4;z=ground_height(d,l)
            art.box(pose(d,l,z),(4.12,.68,.91),heading(d),lin(0x777b6d))
            for j in range(5):
                offset=d-1.6+j*.8+rng.uniform(-.08,.08);h=rng.uniform(.22,.42)
                art.box(pose(offset,l,z+.83),(.72,.65,h),heading(d)+rng.uniform(-.11,.11),lin(rng.choice((0x989b89,0x8e9584,0xa6a493))))
    for d in range(7000,8030,11):
        z=ground_height(d,-3.77);x,y,_=pose(d,-3.77)
        art.box((x,y,height(d)+z),(.14,.17,1.09),heading(d),lin(0x696e63))
        art.box((x,y,height(d)+z+.83),(.146,.18,.25),heading(d),lin(0xe4dfcb))
    valleys(kit)
    settlements(art,rng)
    return {'efforts':0}


def valleys(kit):
    art=Painted(kit,'peaks')
    def rolling(x,y):
        return 165+45*math.sin(x/1260)+26*math.cos(y/350+x/1760)+220*(1-math.exp(-((abs(y)/1800)**2)))+58*math.sin(x/1470+y/670)
    for x in range(-5500,31000,190):
        for y in range(-7600,7400,190):
            coords=((x,y),(x+190,y),(x+190,y+190),(x,y+190))
            heights=[rolling(a,b) for a,b in coords]
            # Keep the near valley floor below every road crossing this longitude.
            level=height(min(LENGTH,max(0,x*1.15)))-32
            heights=[min(z,level-35+abs(b)*.019) for z,(a,b) in zip(heights,coords)]
            p=[(a,b,z) for (a,b),z in zip(coords,heights)]
            band=math.sin(x/1120+y/460)
            colour=0x72875f if band>.45 else (0x768666 if band>-.1 else 0x697c5f)
            art.face(p,(lin(colour),)*4)
    # An irregular patchwork of limestone walls and meadows can be seen below the road.
    for d in range(450,int(LENGTH)-250,136):
        if 6100<d<12600:continue
        for side in (-1,1):
            far=side*(41+29*(1+math.sin(d/317)))
            for a,b in ((side*5,far),(far,side*146)):
                pts=(pose(d,a,ground_height(d,a)),pose(d,b,ground_height(d,b)),pose(d,b,ground_height(d,b)+.91),pose(d,a,ground_height(d,a)+.91))
                art.face(pts,(lin(0x7b806d),)*4)
                art.face(pts[::-1],(lin(0x8d9181),)*4)
            for k in range(0,136,12):
                a,b=d+k,d+k+12
                p=(pose(a,far,ground_height(a,far)),pose(b,far,ground_height(b,far)),pose(b,far,ground_height(b,far)+.87),pose(a,far,ground_height(a,far)+.87))
                art.face(p,(lin(0x818575),)*4);art.face(p[::-1],(lin(0x8e907e),)*4)


def settlements(art,rng):
    def house(d,l,w,depth,high,barn=False,pub=False):
        yaw=heading(d)+(math.pi if l<0 else 0);cs,sn=math.cos(yaw),math.sin(yaw)
        zoff=ground_height(d,l);x,y,z=pose(d,l,zoff)
        def point(u,v,h):return x+u*cs-v*sn,y+u*sn+v*cs,z+h
        def block(u,v,h,a,b,c,tint):art.box(point(u,v,h),(a,b,c),yaw,lin(tint))
        stone=rng.choice((0x989487,0x9f9b8e,0xa7a496,0x928e83))
        block(0,0,-1.2,w,depth,high+1.2,stone)
        art.roof(point(0,0,high),w,depth,depth*.34,yaw,lin(rng.choice((0x636761,0x73736a,0x686b66))))
        front=-depth/2
        def panel(u,h,width,height,tint,proud=.035):
            art.panel(point(0,front,0),(cs,sn),(sn,-cs),u-width/2,u+width/2,z+h,z+h+height,proud,lin(tint))
        if barn:
            panel(-w*.21,-.07,1.64,2.13,0x4e554c)
            panel(w*.23,1.93,.65,.72,0x4f534c)
            block(-w*.21,front-.07,2.05,2.02,.24,.22,0x88877a)
            for i in range(5):panel(-w*.21-.61+i*.30,.05,.023,1.88,0x696a59,.064)
        else:
            door=rng.choice((0x4a665c,0x5c6b72,0x6d5446))
            panel(0,-.06,1.06,2.19,door)
            for u in (-w*.29,w*.29):
                for h in (.64,high-1.9):
                    panel(u,h,1.34,1.4,0xdad8c8)
                    panel(u,h+.09,1.13,1.21,0x536771,.068)
                    panel(u,h+.63,1.19,.067,0xd9d9cc,.077)
                    panel(u,h+.08,.057,1.25,0xdbdacb,.078)
                    block(u,front-.11,h-.04,1.6,.31,.12,0x777a73)
            for u in (-w*.37,w*.36):
                block(u,0,high+.2,.67,.73,depth*.33+.83,0x8e8c80)
                for t in (-.18,.17):
                    art.tube(point(u+t,0,high+depth*.33+1.03),.12,.14,.42,lin(0x94775f),lin(0xa38166),8)
            if pub:
                panel(0,2.26,w-.32,.74,0x395344,.08)
                for k in range(9):panel(-w*.25+k*w*.062,2.48,.19,.29,0xe6dbb1,.105)
                block(w*.42,front-.54,3.39,.13,1.05,.09,0x45463c)
                block(w*.42,front-.95,2.54,.11,.62,.84,0x3b574a)
        # Individual pinning stones and long bed joints give the weathered wall a local scale.
        for row in range(1,int(high/.32)):
            for col in range(int(w/.9)):
                if rng.random()>.21:continue
                u=-w/2+.45+col*.9+(.23 if row%2 else 0)
                if abs(u)<.62 or abs(abs(u)-w*.29)<.7:continue
                panel(u,row*.32,.47+rng.random()*.3,.071,0x86867a,.016)
    for d in range(620,23040,499):
        if 6400<d<12200:continue
        side=-1 if d%3 else 1
        house(d,side*(28+d%39),8.3,5.3,4.1,True)
    for d,l in ((3240,-14),(3302,26),(3410,-32),(14290,-22)):house(d,l,9.2,5.9,4.4,True)
    for start,count in ((-34,22),(13120,17),(22730,24)):
        for j in range(count):
            for sign in (-1,1):
                if j%7==2 and sign<0:continue
                house(start+9.1*j+3*(sign>0),sign*(7.1+.48*math.sin(j)),8.4,5.8,5.0+.5*rng.random(),pub=j%13==6)
    # Heather and rough grasses form low, irregular patches across the summit shoulder.
    for j in range(5900):
        d=rng.uniform(6650,12050);l=rng.choice((-1,1))*rng.uniform(3.85,70);h=ground_height(d,l)+.12
        a=rng.uniform(.52,2.2);b=rng.uniform(.3,1.2)
        vs=[pose(d+u,l+v,h+.08) for u,v in ((-a,0),(-.4*a,-b),(.8*a,-.61*b),(a,.36*b),(.15*a,b))]
        art.face(vs,(lin(rng.choice((0x867464,0x8b7770,0x947d7e,0x7e7554,0x827451))),)*5)
