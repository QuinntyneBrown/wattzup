"""Frederick Street and Woodford Square during Port of Spain's J'Ouvert."""
import math
from worldkit import Painted, lin, smooth


def bearing(d):
    return .13*math.sin(d/256)+.59*(smooth(4530,4750,d)-smooth(4870,5070,d))-.30*(smooth(5660,5810,d)-smooth(6030,6180,d))


def route(course,theme,bc):
    st=bc.stages(course['plan']);length=st[-1]['to']
    mean=sum(s['level']*(s['to']-s['from']) for s in st)/length
    stretches=[];z=7
    for s in st:
        g=(s['level']-mean)*.0025
        stretches.append((s['from'],s['to'],z,g));z+=g*(s['to']-s['from'])
    x=y=0;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        a,b,h,g=next((q for q in stretches if d<q[1]),stretches[-1])
        rows.append(dict(x=x,y=y,z=h+g*(min(b,max(a,d))-a),h=bearing(d),k=bearing(d+.5)-bearing(d-.5),d=d,g=g*100))
        x+=bc.STEP*math.cos(bearing(d+bc.STEP*.5));y+=bc.STEP*math.sin(bearing(d+bc.STEP*.5))
    return rows,st,length,mean,.25


def road(r,st,length,col,bc):
    t=bc.Builder('Road','asphalt');t.colours=[]
    kerb=bc.Builder('Concrete pavements','terrain');kerb.colours=[]
    for i in range(len(r.s)-1):
        for a,b,z,c,mesh in ((-4.8,4.8,0,0x63585F,t),(-13,-5,.14,0x877474,kerb),(-5,-4.8,.07,0xA28A7B,kerb),(4.8,5,.07,0xA28A7B,kerb),(5,13,.14,0x877474,kerb)):
            mesh.quad(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,b,z),r.at(i,b,z));mesh.colours.extend([lin(c)]*4)
    t.build(col);kerb.build(col)


def square(k,art):
    road=k.road;d=4875
    yaw=bearing(d)-.78
    x,y,z=road.pos(d,32)
    def point(u,v,h):return x+u*math.cos(yaw)-v*math.sin(yaw),y+u*math.sin(yaw)+v*math.cos(yaw),z+h
    def box(u,v,h,w,l,high,c):art.box(point(u,v,h),(w,l,high),yaw,lin(c))
    wine,red,cream=0x923737,0xB64A44,0xE8C9AA
    box(0,0,-.45,78,14,8.1,wine)
    box(0,-1,7.58,79,13,.82,red)
    art.roof(point(0,0,8.38),76,12.8,2.25,yaw,lin(0x4C4850))
    for j in range(-8,9):
        u=j*4.26
        box(u,-7.15,.56,2.14,.29,2.85,0x533E43)
        box(u,-7.22,4.08,2.3,.33,2.95,cream)
        box(u,-7.43,4.27,1.75,.14,2.58,0x413B4A)
        box(u,-7.52,5.42,1.76,.14,.13,cream)
        box(u,-7.54,4.27,.13,.13,2.59,cream)
        box(u-1.75,-7.18,.03,.55,.54,7.97,red)
        box(u-1.75,-7.2,7.49,.78,.73,.33,cream)
    box(0,-7.25,3.59,78,.39,.34,cream)
    for u in (-29,0,29):
        box(u,-7.6,-.22,10,4.4,.5,cream)
        box(u,-7.9,8.2,11.2,5.5,.47,cream)
        for c in (-3.9,-1.35,1.35,3.9):
            art.tube(point(u+c,-9.5,.25),.37,.29,7.74,lin(wine),lin(red),10)
            box(u+c,-9.5,7.74,.94,.84,.46,cream)
        art.roof(point(u,-7.9,8.65),11.7,5.65,2.1,yaw+math.pi/2,lin(red))
    box(0,-1,8.3,9.3,8.1,4.1,red)
    for u in (-3,0,3):box(u,-5.15,9.1,1.35,.25,2.45,0x51424C)
    art.roof(point(0,-1,12.4),10.4,8.8,2.2,yaw,lin(0x5E4A50))
    for station in range(4740,4975,4):
        a=road.pos(station,7.6,.13);h=bearing(station)
        art.tube(a,.075,.06,1.45,lin(0x48535A),lin(0x6A6D69),6)
        for hh in (.33,1.14):art.box(road.pos(station+2,7.6,hh),(4.25,.055,.065),h,lin(0x596366))
    # A real lawn and shaded paths surround the Parliament approach.
    art.box(road.pos(4850,24,-.34),(202,34,.47),bearing(4850),lin(0x617759))


def scenery(k):
    art=Painted(k);road=k.road;rng=k.rng
    shop=type(k.B['terrain'])('FrederickFronts','terrain');shop.colours=[];shop.uvs=[];k.B['FrederickFronts']=shop
    for side in (-1,1):
        n=0;d=-68
        while d<k.length+65:
            width=rng.uniform(8.2,13.2);mid=d+width/2;n+=1
            if (side>0 and 4720<mid<4970) or (side<0 and 5830<mid<6045):
                d+=width;continue
            height=rng.uniform(5.9,8.7);h=bearing(mid);off=side*(8.3+rng.uniform(0,.48));tone=rng.choice((0xA58A70,0x94A298,0xB48E86,0x84989B))
            art.box(road.pos(mid,off+side*3.2,-.32),(width-.14,6.3,height+.35),h,lin(tone))
            art.box(road.pos(mid,off-side*.6,3.15),(width,2.05,.20),h,lin(0x786C6B))
            art.roof(road.pos(mid,off+side*3.2,height),width,6.4,1.0,h,lin(0x65636C))
            if n%3!=0:
                for j in (-.39,0,.39):
                    art.box(road.pos(mid+j*width,off-side*1.45,.12),(.16,.17,3.1),h,lin(0xABA292))
                art.box(road.pos(mid,off-side*1.5,4.04),(width,.08,.11),h,lin(0x8B9695))
                for rail in range(0,int(width),1):
                    art.box(road.pos(d+rail+.4,off-side*1.51,3.3),(.05,.07,.79),h,lin(0x847F78))
            # Facade geometry follows the same road frame as the balcony, with one of four original shop bays.
            s0,s1=(d,d+width-.12) if side<0 else (d+width-.12,d)
            verts=[road.pos(a,off-side*.08,z) for a,z in ((s0,.13),(s1,.13),(s1,height),(s0,height))]
            u=((n+int(side>0))%4)/4
            shop.faces.append(tuple(shop.v(q) for q in verts));shop.colours.extend([(1,1,1,1)]*4);shop.uvs.extend(((u,0),(u+.25,0),(u+.25,1),(u,1)))
            if n%3==0:
                art.box(road.pos(mid,off-side*1.1,3.85),(.16,1.7,1.0),h,lin(rng.choice((0xB58C4E,0x548E87,0xB16A6C))))
            d+=width
    for i,d in enumerate(range(-40,6390,31)):
        side=1 if i%2 else -1;k.lamp(road.index(d),side*5.65,'bulb',6.4);k.light(road.pos(d,side*3.9,.1),'bulb',11.2,.86)
        x,y,z=road.pos(d,side*6.8)
        if 4720<d<5000 or d>5710:
            if i%3==1:k.palm(x,y,z+.13)
            else:
                art.tube((x,y,z),.36,.26,4.5,lin(0x665647),lin(0x856A56),7)
                for j in range(4):
                    a=j*1.65+.5
                    art.tube((x+1.4*math.cos(a),y+1.4*math.sin(a),z+3.74),2.3,2.7,1.05,lin(0x394E4B),lin(0x657759),9)
                    art.tube((x+1.4*math.cos(a),y+1.4*math.sin(a),z+4.79),2.7,.54,1.15,lin(0x596B55),lin(0x77825C if i%3 else 0xA35F4C),9)
    # Crushed cups and dropped rags lie chiefly where the revellers have been.
    for i in range(1300):
        d=rng.uniform(0,k.length);l=rng.choice((-1,1))*rng.uniform(2.2,5.5);at=road.pos(d,l,.039)
        if i%4:art.tube(at,.065,.10,.14,lin(0xA69180),lin(0xC9B8A2),6)
        else:art.box(at,(.32,.19,.021),rng.random()*math.pi,lin(rng.choice((0xAD594A,0xD2A350,0x508986,0xB89593))))
    square(k,art)
    return {'efforts':0}


THEME=dict(lay=route,road_builder=road,road_half_width=4.8,night=True,wet=.24,chunks={'Land':1},
    terrain={'rise':1},land={'low':0x57505C,'mid':0x655D64,'high':0x716570,'rock':0x645C64},
    sky=[0x534A59,0x39384C,0x25283F,0x191D32,0x101429],haze=0x4B424F,
    light=[0xFFD49D,1.09],fill=[0xA9ACCA,0x77605F],sun_altitude=.27,sun_azimuth=2.41)
