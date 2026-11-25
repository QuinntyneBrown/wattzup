"""The temple road along Angkor's moat, with causeways between the trees."""
import math
from worldkit import Painted, lin, smooth

WATER = -1.3


def route(course,theme,bc):
    stages=bc.stages(course["plan"])
    length=stages[-1]["to"]
    mean=sum((s["to"]-s["from"])*s["level"] for s in stages)/length
    def yaw(d):
        return .26*math.sin(d/300)+.14*math.sin(d/105)-.95*smooth(35,180,d)+.95*smooth(240,540,d)
    x,y=-bc.LEAD_IN,0
    samples=[]
    for i in range(math.ceil((bc.LEAD_IN+length+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        h=yaw(d)
        # The raised causeways crown gently; the rest of the temple road is flat.
        gap=(d-650+820)%1640-820
        stage=bc.stage_at(stages,min(length-.01,max(0,d-gap)))
        lift=1.55+.09*(stage["level"]-mean)
        t=min(1,abs(gap)/55)
        z=lift*(1+math.cos(t*math.pi))*.5
        grade=-50*lift*math.pi/55*math.sin(t*math.pi)*math.copysign(1,gap)
        samples.append(dict(d=d,x=x,y=y,z=z,h=h,k=(yaw(d+1)-yaw(d-1))/2,g=grade))
        x+=bc.STEP*math.cos(h);y+=bc.STEP*math.sin(h)
    return samples,stages,length,mean,.09


def banks(road,col,theme,bc):
    b=bc.Builder("Moat and laterite banks","terrain")
    b.colours=[]
    profile=((-160,.1),(-14,.1),(-8,-.05),(-4,-.15),(4,-.15),(7,-.09),(10,WATER),(64,WATER),(68,.15),(165,.2))
    palette=(0x586342,0x76563F,0xA36142,0xA36142,0xB56F48,0x925337,0x646D65,0x855C48,0x526646)
    for i in range(0,len(road.s)-1,3):
        j=min(i+3,len(road.s)-1)
        for k,((a,az),(c,cz)) in enumerate(zip(profile,profile[1:])):
            ids=[]
            for n,v,z in ((i,a,az),(j,a,az),(j,c,cz),(i,c,cz)):
                x,y,_=road.at(n,v)
                ids.append(b.v((x,y,z)))
                colour=lin(palette[k])
                fade=.94+.055*math.sin(road.s[n]["d"]/37+v*.2)
                b.colours.append((*[u*fade for u in colour[:3]],1))
            b.faces.append(tuple(ids))
    return b.build(col),lambda x,y:.08


THEME={
    "lay":route,"land_builder":banks,"terrain":{"sea":False},"land":{"mid":0x576449},
    "edge":"laterite","kerbs":False,"sky":[0xF5BA97,0xDAAEA8,0xAAA6BB,0x8198B2,0x6385A5],
    "haze":0xCCAEA3,"light":[0xFFDAA9,2.7],"fill":[0xDAD2DD,0x837259],"sun_altitude":.085,
    "sun_azimuth":.7,"palette":{"asphalt":0x565356,"sand":0xAA6345,"promenade":0xA05C40},
}


def lotus_tower(art,c,height,radius,stone):
    x,y,z=c
    for tier in range(10):
        t=tier/10
        r=radius*(.96+.21*math.sin(t*math.pi))*(1-t*.72)
        rise=height*.086
        art.tube((x,y,z),r,r*.91,rise*.78,stone,stone,8)
        art.tube((x,y,z+rise*.78),r*1.07,r*.99,rise*.22,stone,stone,8,stone)
        z+=rise
    art.tube((x,y,z),radius*.28,.11,height*.14,stone,stone,8,stone)


def wat(k,art):
    i=k.road.index(24)
    # Across the water, just left of the initial line of travel. The road turns
    # right along the moat while the towers retain their original bearing.
    yaw=k.s[i]["h"]+math.pi/2+.29
    origin=k.P(i,184,21)
    cs,sn=math.cos(yaw),math.sin(yaw)
    def pt(u,v,z):
        return (origin[0]+u*cs-v*sn,origin[1]+u*sn+v*cs,z)
    stone=lin(0x76695D)
    for j in range(3):
        art.box(pt(0,0,j*2),(72-j*13,29-j*6,2.15),yaw,stone)
    for u in range(-32,34,3):
        art.box(pt(u,-13.5,2.1),(1.05,1.2,4.4),yaw,stone)
    art.roof(pt(0,-13,6.5),68,4.5,2.5,yaw,stone)
    for u,v,h in ((0,0,26),(-19,-8,16),(19,-8,16),(-19,8,19),(19,8,19)):
        lotus_tower(art,pt(u,v,6),h,4.5 if u==0 else 3.45,stone)
    # Broken reflections ripple across the near water in the dawn light.
    for j in range(25):
        for u,h in ((-19,16),(0,26),(19,16)):
            if j>h: continue
            width=(4.7 if u==0 else 3.3)*(1-j/(h+2))
            art.box(pt(u+.4*math.sin(j),-19-j*.85,WATER+.025),(2*width,.63,.025),yaw,lin(0x655F61))


def gate(k,art,d):
    i=k.road.index(d);yaw=k.s[i]["h"];base=k.s[i]["z"]
    def pt(u,v,h):
        x,y,_=k.P(i,u,v)
        return x,y,base+h
    stone=lin(0x978875);shade=lin(0x736756)
    for side in (-1,1):
        art.box(pt(0,side*7,0),(6,5.0,7.1),yaw,stone)
        for j in range(4):
            art.box(pt(0,side*(6.9-j*.34),7+j*.62),(6.2-j*.43,5.2,.68),yaw,stone)
        for u in range(-46,-7,4):
            v=side*5.9
            art.box(pt(u,v,0),(4.07,1.1,.86),yaw,shade)
            art.tube(pt(u,v,.8),.52,.6,.88,stone,stone,6)
            art.tube(pt(u,v,1.68),.39,.31,.53,stone,stone,7,stone)
            art.tube(pt(u,v,2.2),.36,.05,.29,shade,stone,7,stone)
            art.box(pt(u,v*.91,1.1),(4.05,.31,.28),yaw,stone)
    art.box(pt(0,0,9.24),(6.3,16.4,2.3),yaw,stone)
    for side in (-1,0,1):
        h=10.5 if side==0 else 6.2
        lotus_tower(art,pt(0,side*4.4,11.4),h,2.4,stone)
        # Projecting brow, eyelids, nose and mouth remain readable on the front.
        for off in (-.59,.59):
            art.box(pt(-2.23,side*4.4+off,12.87),(.43,.89,.15),yaw,shade)
            art.box(pt(-2.27,side*4.4+off,13.22),(.52,.98,.23),yaw,stone)
        art.box(pt(-2.44,side*4.4,12.21),(.57,.40,.97),yaw,stone)
        art.box(pt(-2.27,side*4.4,11.93),(.46,.89,.15),yaw,shade)


def crown(art,x,y,z,radius,depth,rng):
    # A dipterocarp has an irregular, spreading top and a shadowed understorey.
    profile=[rng.uniform(.72,1.2) for _ in range(11)]
    colours=list(map(lin,(0x354C36,0x486342,0x61734D,0x71845C)))
    rings=[]
    for scale,height in ((.47,-.28),(1,.12),(.82,.65),(.34,1)):
        rings.append([(x+math.cos(j*math.tau/11)*radius*v*scale,
                       y+math.sin(j*math.tau/11)*radius*v*scale,
                       z+(height+.09*math.sin(j*2.7))*depth) for j,v in enumerate(profile)])
    for level in range(3):
        for j in range(11):
            n=(j+1)%11
            art.face((rings[level][j],rings[level][n],rings[level+1][n],rings[level+1][j]),
                     (colours[level],colours[level],colours[level+1],colours[level+1]))
    art.face(rings[-1],(colours[-1],)*11)
    art.face(rings[0][::-1],(colours[0],)*11)


def scenery(k):
    art=Painted(k)
    wat(k,art)
    traffic_models(k)
    for d in range(650,int(k.length),1640):
        gate(k,art,d)
    for d in range(-60,int(k.length)+80,12):
        for side in (-1,1):
            if side==1 and (d<240 or d%720<250): continue
            i=k.road.index(d)
            offset=k.rng.uniform(9,22)*side if side<0 else k.rng.uniform(68,85)
            x,y,_=k.road.at(i,offset)
            h=k.rng.uniform(12,23)
            bark=lin(k.rng.choice((0x8D8272,0xAAA18C,0x726C5D)))
            art.tube((x,y,.1),.65,.35,h,bark,bark,7)
            for j in range(3):
                a=j*2.1+d
                radius=k.rng.uniform(3.6,6.2)
                cx=x+2.8*math.cos(a);cy=y+2.8*math.sin(a)
                crown(art,cx,cy,h-.5+j*.65,radius,k.rng.uniform(2.5,4.1),k.rng)
            for j in range(3):
                a=d+j*math.tau/3
                toe=(x+math.cos(a)*1.9,y+math.sin(a)*1.9,.13)
                shoulder=(x+.4*math.cos(a),y+.4*math.sin(a),2.5)
                edge=(x+.5*math.cos(a+.7),y+.5*math.sin(a+.7),.13)
                art.face((toe,edge,shoulder),(bark,bark,bark))
                art.face((shoulder,edge,toe),(bark,bark,bark))
            if d%5:
                crown(art,x+2,y+1.5,.7,2.4,1.9,k.rng)
    # Clumps of lotus and broken dawn highlights reveal the surface of the moat.
    leaf,flower,glint=map(lin,(0x617653,0xD7B5A3,0xA99C85))
    for d in range(-25,int(k.length),17):
        i=k.road.index(d)
        for j in range(4):
            offset=k.rng.uniform(10.6,15.2)
            for k2 in range(3):
                u=j*.75+k2*.22
                a=k.rng.uniform(0,math.tau)
                pts=[]
                for q in range(7):
                    ang=a+q*math.tau/7
                    x,y,_=k.P(i,u+math.cos(ang)*.28,offset+math.sin(ang)*.22)
                    pts.append((x,y,WATER+.045))
                art.face(pts,(leaf,)*7)
                if j==2 and k2==1:
                    x,y,_=k.P(i,u,offset)
                    art.tube((x,y,WATER+.04),.04,.112,.13,flower,flower,6,flower)
            x,y,_=k.P(i,j*2.4,k.rng.uniform(16,45))
            art.box((x,y,WATER+.02),(1.2,.045,.013),k.s[i]["h"],glint)
    for d in range(975,int(k.length),3340):
        bayon(k,art,d)
    for d in range(1215,int(k.length),3340):
        root_temple(k,art,d)
    for d in range(230,int(k.length),730):
        market(k,art,d)
    return {"efforts":0}

def root_temple(k,art,d):
    i=k.road.index(d)
    yaw=k.s[i]["h"]
    def pt(u,v,z):
        x,y,_=k.P(i,u,v)
        return x,y,z
    stones=[lin(h) for h in (0xA69B83,0x8A846E,0x878772,0xA99D86)]
    for row in range(8):
        for j in range(-9,10):
            u=j*1.4+.68*(row%2)
            if abs(u)<1.65 and row<6: continue
            if abs(j)>7 and row>5: continue
            art.box(pt(u,-8.8,.1+row*.54),(1.36,2.6,.52),yaw,k.rng.choice(stones))
    for side in (-1,1):
        art.box(pt(1.81*side,-7.38,.1),(.49,.3,3.45),yaw,stones[0])
    for j in range(3):
        art.box(pt(0,-7.31,3.35+j*.27),(4.2-j*.32,.41,.25),yaw,stones[j])
    root=lin(0xA59B82)
    for j in range(10):
        origin=2.7+j*.13
        end=(j-4)*1.9
        for n in range(9):
            t=n/9;t2=(n+1)/9
            def edge(t,sign):
                u=origin+(end-origin)*(t**1.42)+.35*math.sin(t*8+j)*t
                return pt(u+sign*(.39-.22*t),-7.31+.45*math.sin(t*3.8)-.5*math.exp(-7*t),5.5*(1-t))
            coords=(edge(t,-1),edge(t,1),edge(t2,1),edge(t2,-1))
            art.face(coords,(root,lin(0xCBC0A4),lin(0xB4AC91),root))
            art.face(coords[::-1],(root,)*4)
    art.tube(pt(3.25,-8.15,4),1.28,.72,12,root,root,9)
    for j in range(5):
        a=j*math.tau/5
        art.tube(pt(3+3.1*math.cos(a),-8+3.1*math.sin(a),15+j*.42),3.5,1.8,2.9,
                 lin(0x435D41),lin(0x526843),8,lin(0x566F47))


def market(k,art,d):
    i=k.road.index(d);yaw=k.s[i]["h"]
    def pt(u,v,z): return k.P(i,u,v,z)
    for j in range(2):
        off=-8.1-3.5*j
        wood=lin(0x7E624B)
        art.box(pt(j*4,off,.5),(2.5,1.25,.65),yaw,wood)
        art.tube(pt(j*4,off,1.1),.06,.05,1.7,wood,wood,6)
        cloth=lin(0xAB7150 if j==0 else 0x8C8C68)
        art.tube(pt(j*4,off,2.6),1.8,.16,.62,cloth,cloth,10,cloth)
        for t in range(4):
            art.box(pt(j*4-1+t*.55,off,1.15),(.42,.53,.23),yaw,lin(0xA79B68))
    for j in range(3):
        c=pt(-9+j*2.15,-5.8,.03)
        saffron=lin((0xCE782E,0xB76927,0xD69033)[j])
        skin=lin(0xA47858)
        art.tube(c,.28,.17,1.36,saffron,saffron,7,saffron)
        art.tube((c[0],c[1],c[2]+1.35),.12,.135,.24,skin,skin,8,skin)

def traffic_models(k):
    def wheel(art,x,y,r):
        rubber=lin(0x333331)
        rim=lin(0x878980)
        for j in range(14):
            a=j*math.tau/14;b=(j+1)*math.tau/14
            def point(at,radius,side):
                return (x+side,y+radius*math.cos(at),r+radius*math.sin(at))
            quad=(point(a,r,-.05),point(b,r,-.05),point(b,r,.05),point(a,r,.05))
            art.face(quad,(rubber,)*4)
            for side in (-.051,.051):
                q=(point(a,r,side),point(b,r,side),point(b,r*.82,side),point(a,r*.82,side))
                art.face(q,(rubber,)*4);art.face(q[::-1],(rubber,)*4)
                spoke=(point(a,r*.84,side),point(a+.045,r*.84,side),(x+side,y,r))
                art.face(spoke,(rim,)*3);art.face(spoke[::-1],(rim,)*3)
    art=Painted(k,"tuk-tuk")
    red,teal,cream,iron,skin=map(lin,(0x9C5642,0x446C67,0xD9B88C,0x4D5149,0xA37C60))
    for x in (-.76,.76): wheel(art,x,-.68,.34)
    wheel(art,0,1.5,.32)
    art.box((0,-.35,.43),(1.48,1.81,.29),0,teal)
    art.box((0,-.92,.71),(1.39,.25,.59),0,red)
    art.box((0,-.64,.72),(1.29,.43,.15),0,cream)
    for x in (-.66,.66):
        for y in (-1.0,.39):art.tube((x,y,.68),.038,.035,1.1,iron,iron,6)
    art.box((0,-.33,1.76),(1.65,1.79,.16),0,red)
    art.roof((0,-.33,1.92),1.76,1.64,.19,math.pi/2,red)
    art.box((0,.91,.43),(.31,1.08,.29),0,teal)
    art.tube((0,.91,.73),.18,.22,.56,cream,cream,7)
    art.tube((0,.95,1.28),.14,.14,.25,skin,skin,7,skin)
    art=Painted(k,"touring-bike")
    for y in (-.54,.54):wheel(art,0,y,.34)
    for a,b in (((-.54,.34),(-.18,.8)),((-.18,.8),(0,.34)),((0,.34),(-.54,.34)),((0,.34),(.39,.80)),((.39,.80),(.54,.34))):
        quad=tuple((0,u,z+off) for (u,z),off in ((a,-.028),(b,-.028),(b,.028),(a,.028)))
        art.face(quad,(teal,)*4);art.face(quad[::-1],(teal,)*4)
    art.tube((0,-.17,.85),.14,.19,.48,red,red,7)
    art.tube((0,-.13,1.33),.12,.13,.23,skin,skin,7,skin)

def bayon(k,art,d):
    i=k.road.index(d);yaw=k.s[i]["h"]
    dark,base,light=map(lin,(0x675F52,0x9B937D,0xB0A48C))
    for along,off,h in ((0,-12,10.8),(-8,-21,7.8),(10,-23,8.7)):
        def pt(u,v,z):return k.P(i,along+u,off+v,z)
        for j in range(9):
            size=5.2-.095*j
            art.box(pt(0,0,j*.79),(size,size,.77),yaw,base)
        # Four faces on a tower look out in the cardinal directions. The lips
        # curve toward each cheek; the heavy eyelids are downcast (real-14).
        for side in range(4):
            angle=side*math.pi/2
            def facept(horizontal,relief,z):
                u=horizontal*math.sin(angle)+(2.14+relief)*math.cos(angle)
                v=-horizontal*math.cos(angle)+(2.14+relief)*math.sin(angle)
                return pt(u,v,z)
            def patch(outline,tint):
                coords=[facept(*p) for p in outline]
                art.face(coords,(tint,)*len(coords));art.face(coords[::-1],(tint,)*len(coords))
            patch([(-1.48,0,6.1),(-1.40,.14,4.1),(-.87,.27,3.3),(0,.37,3.0),(.87,.27,3.3),(1.40,.14,4.1),(1.48,0,6.1)],base)
            for sign in (-1,1):
                patch([(sign*.16,.38,5.22),(sign*.55,.50,5.37),(sign*1.19,.19,5.20),(sign*.73,.50,5.05)],light)
                patch([(sign*.23,.42,5.10),(sign*.68,.53,4.99),(sign*1.12,.24,5.12),(sign*.66,.54,5.08)],dark)
            patch([(-.32,.38,4.44),(0,.91,4.29),(.32,.38,4.44),(.15,.39,5.25),(-.15,.39,5.25)],light)
            patch([(-.78,.36,4.03),(0,.63,3.89),(.78,.36,4.03),(.47,.48,3.83),(0,.63,3.80),(-.47,.48,3.83)],dark)
        lotus_tower(art,pt(0,0,7.1),h-3,2.05,base)
