"""The temple road along Angkor's moat, with causeways between the trees."""
import math
from worldkit import Painted, lin, smooth

WATER = -1.3


def route(course,theme,bc):
    stages=bc.stages(course["plan"])
    length=stages[-1]["to"]
    mean=sum((s["to"]-s["from"])*s["level"] for s in stages)/length
    def yaw(d):
        return .26*math.sin(d/300)+.14*math.sin(d/105)+.48*smooth(-80,100,d)-.48*smooth(230,520,d)
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
    palette=(0x586342,0x76563F,0xA36142,0xA36142,0xB56F48,0x925337,0x877D75,0x855C48,0x526646)
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
    "edge":"verge","kerbs":False,"sky":[0xF5BA97,0xDAAEA8,0xAAA6BB,0x8198B2,0x6385A5],
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
    i=k.road.index(166)
    yaw=k.s[i]["h"]-.40
    origin=k.road.at(i,83)
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


def scenery(k):
    art=Painted(k)
    wat(k,art)
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
                foliage=lin(k.rng.choice((0x40543B,0x526144,0x677552)))
                cx=x+2.3*math.cos(a);cy=y+2.3*math.sin(a)
                art.tube((cx,cy,h-.5+j*.65),3.6,4.6,1.8,foliage,foliage,8)
                art.tube((cx,cy,h+1.3+j*.65),4.6,.45,2.3,foliage,foliage,8,foliage)
    return {"efforts":0}
