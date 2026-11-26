"""St. Charles Avenue parade route across the neutral ground to Canal Street."""
import math
from bondi import beam
from iten_landmarks import picture, pictured, site
from worldkit import Painted, lin, smooth


def heading(distance):
    # scene-bend.ts counts clockwise, while Blender counts anticlockwise from +X.
    return -math.radians(6)*math.sin(distance/250)*math.cos(distance/(2.7*250)+1)


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    x=y=0;z=2.4;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;s=next((s for s in stages if d<s['to']),stages[-1])
        grade=(s['level']-mean)*.00082 if 0<=d<length else 0
        rows.append(dict(d=d,x=x,y=y,z=z,h=heading(d),k=heading(d+.5)-heading(d-.5),g=100*grade))
        turn=heading(d+bc.STEP/2);x+=bc.STEP*math.cos(turn);y+=bc.STEP*math.sin(turn);z+=bc.STEP*grade
    return rows,stages,length,mean,.082


def pavement(r,st,length,col,bc):
    lane=bc.Builder('ParadeAvenue','terrain');lane.colours=[]
    for i,p in enumerate(r.s[:-1]):
        for left,right,z,c in ((-24,-14,.12,0x807571),(-14,-8,0,0x626260),(-8,-5,.08,0x676F49),(-5,-4.92,.10,0xB9ABA0),(-4.92,-3.62,.08,0x695F52),(-3.62,-3.54,.10,0xAFA79C),(-3.54,-2.9,.08,0x6F7652),(-2.9,3.95,0,0x626262),(3.95,4.12,.11,0xC4B9A3),(4.12,17,.12,0x958777)):
            lane.quad(r.at(i,left,z),r.at(i+1,left,z),r.at(i+1,right,z),r.at(i,right,z));lane.colours.extend([lin(c)]*4)
    lane.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('StCharlesGround','terrain');b.colours=[]
    for i in range(0,len(r.s)-5,5):
        b.quad(r.at(i,-680,-.20),r.at(i+5,-680,-.20),r.at(i+5,680,-.20),r.at(i,680,-.20));b.colours.extend([lin(0x685F56)]*4)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));return r.s[i]['z']-.20
    b.build(col);return None,sample


def image_panel(mesh,coords,tile):
    u,v=tile
    picture(mesh,coords,((u+.004,v+.004),(u+.496,v+.004),(u+.496,v+.496),(u+.004,v+.496)))


def scenery(k):
    art=Painted(k);avenue=pictured(k,'GardenDistrict');people=pictured(k,'KreweCrowd')
    iron=lin(0x48464A);white=lin(0xD5C9B0)
    carnival=[lin(c) for c in (0x9F55B0,0x57975C,0xE1B64D)]
    for d in range(-60,8610,19):
        for side in (-1,1):
            at,h=site(k,d,side*(13 if side>0 else 22));downtown=d>6950
            length=18.8 if downtown else k.rng.uniform(11,16.8)
            high=k.rng.uniform(8,12) if downtown else k.rng.uniform(7.4,9.6)
            art.box(at(0,side*3.9,-.2),(length,7.8,high+.20),h,lin(k.rng.choice((0xA99D8B,0xC4B6A8,0xC1A38F))))
            art.roof(at(0,side*3.9,high),length+.4,8,2.1,h,lin(0x514D51))
            image_panel(avenue,(at(-length/2,0,0),at(length/2,0,0),at(length/2,0,high),at(-length/2,0,high)),(.5 if downtown else 0,0))
            if downtown:
                for z in (3.45,6.55):
                    art.box(at(0,-side*.82,z),(length,1.7,.16),h,iron)
                    for j in range(8):art.box(at(-length*.46+j*length*.13,-side*1.54,z+.18),(.10,.11,1.10),h,iron)
                    art.box(at(0,-side*1.54,z+1.23),(length,.13,.1),h,iron)
            else:
                for j in (-4,-1.4,1.4,4):art.tube(at(j,-side*1.18,.10),.25,.20,5.3,white,white,10)
                art.roof(at(0,-side*.73,5.39),10.7,2.3,1.65,h,white)
                for j in range(5):art.box(at(-length*.4+j*length*.2,-side*2.8,0),(.09,.1,1.16),h,iron)
            if d%3!=0:
                p,h=site(k,d-7,side*(7.7 if side>0 else 9.6))
                top=k.rng.uniform(8.2,12.4);width=top*1.52
                for a in (0,math.pi/2):
                    dx=width*.5*math.cos(a);dy=width*.5*math.sin(a)
                    image_panel(people,(p(-dx,-dy,.14),p(dx,dy,.14),p(dx,dy,top),p(-dx,-dy,top)),(0,.5))
            p,h=site(k,d+4,side*(5.2 if side>0 else 8.4))
            if d%3!=1 or 2900<d<5100 or downtown:
                width=k.rng.uniform(3.7,5.1)
                image_panel(people,(p(-width/2,0,.1),p(width/2,0,.1),p(width/2,0,3.12),p(-width/2,0,3.12)),(.5,.5))
                for rail in (.45,.96):beam(art,p(-3,-side*.48,rail),p(3,-side*.48,rail),.06,.065,iron)
        at,h=site(k,d,-4.26)
        beam(art,at(0,0,5.16),k.road.pos(d+19,-4.26,5.16),.026,.028,iron)
        if d%3==0:
            art.tube(at(0,-3.4,-.02),.14,.095,6.15,iron,iron,8)
            beam(art,at(0,-3.4,5.75),at(0,.3,5.15),.069,.069,iron)
        # Beads, paper cups and confetti collect along the kerb.
        for n in range(5):
            u=k.rng.uniform(-8.5,8.5);v=k.rng.uniform(6.4,8.0);t=carnival[n%3]
            if n==0:art.tube(at(u,v,.02),.04,.059,.13,white,white,6)
            else:art.box(at(u,v,.018),(.073,.10,.014),h+n,t)
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':pavement,'terrain':{'sea':False},
       'road_half_width':3.2,'land':{'mid':0x5D5C54},'sky':[0xECC3A2,0xC7A7B5,0x9587B5,0x5F6591,0x454D78],
       'haze':0xC4ADB5,'light':[0xF5D1B7,1.43],'fill':[0xC7BBE0,0xAC938D],'sun_radius':12,'sun_altitude':.18,'sun_azimuth':.51}
