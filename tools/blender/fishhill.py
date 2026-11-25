"""Broadway's High Street, the A44 beech cutting and the ridge at Broadway Tower."""
import math
import random

from worldkit import Painted, lin


PROFILE = ((0,87),(1060,95),(2120,116),(2880,154),(3720,228),(4050,263),(4580,282),
           (5360,291),(6480,305),(7470,295),(8630,302),(9700,292),(10500,301),(11600,312))


def elevation(distance):
    for (a, low), (b, high) in zip(PROFILE, PROFILE[1:]):
        if distance <= b:
            return low + (high-low)*max(0,(distance-a)/(b-a))
    return PROFILE[-1][1]


def bearing(distance):
    h = 1.43 + .14*math.sin(distance/390)
    for turn,change,width in ((2050,-.48,70),(2890,1.32,55),(3450,-1.64,50),(3940,1.74,55),
                              (4690,-.86,92),(6040,.72,110),(7120,-.90,150),(9480,.48,110)):
        h += change*(1+math.tanh((distance-turn)/width))/2
    return h


def lay(course, theme, bc):
    stages = bc.stages(course['plan'])
    length = stages[-1]['to']
    rows = []
    x = y = 0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d = i*bc.STEP-bc.LEAD_IN
        h = bearing(d+bc.STEP/2)
        rows.append(dict(x=x,y=y,z=elevation(d),d=d,h=bearing(d),
                         k=bearing(d+.5)-bearing(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x += bc.STEP*math.cos(h)
        y += bc.STEP*math.sin(h)
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,0


def ground(d, left):
    edge=max(0,abs(left)-5)
    if d<2000:
        return -.08 + min(edge,10)*.012
    if 2550<d<5020:
        return -.12+min(edge,27)*(.28 if left>0 else .14)
    if 5400<d<7430 and left>0:
        return -.12-edge*.27
    return -.12+min(edge,70)*(.035+.042*math.sin(d/230+left/60))


def strip(builder,r,i,a,b,h0,h1,k0,k1,tone):
    pts=[r.at(i,b,k0),r.at(i,a,h0),r.at(i+1,a,h1),r.at(i+1,b,k1)]
    builder.faces.append(tuple(builder.v(p) for p in pts))
    builder.colours.extend([lin(tone)]*4)


def road(r,st,length,col,bc):
    lane=bc.Builder('Damp A44 wearing course','fishhill-lane')
    paint=bc.Builder('British road markings','terrain')
    lane.colours=[]
    paint.colours=[]
    for i in range(len(r.s)-1):
        for a,b,h,k in ((-4.3,0,.012,.095),(0,4.3,.095,.012)):
            strip(lane,r,i,a,b,h,h,k,k,0x5e6061)
        for side in (-1,1):
            if r.s[i]['d']>1550:
                a=side*4.05
                strip(paint,r,i,a,a+.095,.037,.037,.037,.037,0xd7d5c9)
        if i%3==0:
            strip(paint,r,i,-.075,.075,.105,.105,.105,.105,0xdbd8c8)
    lane.build(col)
    paint.build(col)


def land(r,col,theme,bc):
    meadow=bc.Builder('Cotswold pasture and grass verges','fishhill-meadow')
    meadow.colours=[]
    lanes=(-220,-95,-40,-18,-8,-4.3,4.3,8,18,40,95,220)
    for i in range(len(r.s)-1):
        d=r.s[i]['d']
        e=r.s[i+1]['d']
        for j,(a,b) in enumerate(zip(lanes,lanes[1:])):
            if a<0<b:continue
            colour=(0x899458,0x798b48,0x758447,0x83944b)[(int(d//370)+j//2)%4] if abs(a)>18 else 0x7b8c49
            strip(meadow,r,i,a,b,ground(d,a),ground(e,a),ground(d,b),ground(e,b),colour)
    meadow.build(col)
    return None,lambda x,y:r.s[r.tree.find((x,y,0))[1]]['z']


def scenery(k):
    r=k.road
    art=Painted(k)
    stone=Painted(k,'fishhill-wall')
    slate=Painted(k,'fishhill-slate')
    rng=random.Random(2120)
    def box(d,l,z,w,depth,height,colour,material=art):
        material.box(r.pos(d,l,z),(w,depth,height),bearing(d),lin(colour))
    # Village facades are applied to these dimensions in the runtime; the tiled roofs and
    # chimney stacks retain their depth when a rider turns past each frontage.
    for n in range(94):
        d=-35+n*19
        for side in (-1,1):
            if (n+(1 if side>0 else 3))%9==0:continue
            pos=d+(5 if side>0 else 0)
            l=side*(14+(n%3)*1.4)
            w=12+n%5
            depth=7.2+n%3
            height=4.8+(n%4)*.5
            foot=ground(pos,l)
            box(pos,l,foot,w,depth,height,0xb39b72)
            (art if n%4==2 else slate).roof(r.pos(pos,l,foot+height),w+.7,depth+.95,2.4,bearing(pos),lin(0x998260 if n%4==2 else 0x77756b))
            box(pos+w*.31,l,foot+height+1.4,.78,.86,2.2,0x95816a)
            if n%3:
                box(pos,l-side*(depth/2+2.5),foot,w*.72,.4,.68,0xb2a386,stone)
    # Dry-laid limestone. The uneven coping stones catch the sky along the crest of the wall.
    for d in range(1750,11590,5):
        for side in (-1,1):
            if (d//95+side)%7==0 or 5050<d<7450 and side==1:continue
            l=side*(6.5 if d<5100 else 7.8)
            foot=ground(d,l)-.14
            box(d,l,foot,5.1,.66,.91+rng.uniform(-.05,.06),0xb1a388,stone)
            for j in range(4):
                box(d-1.85+j*1.25,l,foot+.87,1.20,.75,.20+rng.random()*.15,0xa79e86,stone)
    # Broadway Tower, designed as a three-sided folly with a round tower at each corner.
    at=11443
    l=-20
    base=ground(at,l)
    x,y,z=r.pos(at,l,base)
    radius=4.85
    rotation=bearing(at)-math.pi+.28
    towers=[(x+radius*math.cos(rotation+i*math.tau/3),
             y+radius*math.sin(rotation+i*math.tau/3)) for i in range(3)]
    # There is a windowed bay and a projecting balcony between each pair of turrets.
    for j,(cx,cy) in enumerate(towers):
        ex,ey=towers[(j+1)%3]
        normal=bearing(at)-math.pi+.28+(j+.5)*math.tau/3
        wx,wy=(cx+ex)/2,(cy+ey)/2
        yaw=math.atan2(ey-cy,ex-cx)
        for dx,dy,w,h,up in [(0,0,8.4,16.5,0),(.37,.37,8.8,.47,2.5),(.38,.38,8.8,.37,15.9)]:
            art.box((wx+dx*math.cos(normal),wy+dy*math.sin(normal),z+up),(w,.69,h),yaw,lin(0xb7a485))
        balcony=(wx+.85*math.cos(normal),wy+.85*math.sin(normal))
        for up in (7.25,8.22):art.box((*balcony,z+up),(3.2,1.46,.2),yaw,lin(0xb5a488))
        for i in range(10):
            u=(i-4.5)*.32
            art.box((balcony[0]+u*math.cos(yaw)+.61*math.cos(normal),
                     balcony[1]+u*math.sin(yaw)+.61*math.sin(normal),z+7.43),
                    (.12,.14,.8),yaw,lin(0xc1b398))
        h=20 if j==0 else 18.9
        art.tube((cx,cy,z),2.22,1.63,2.65,lin(0x978566),lin(0xb8a47d),18)
        art.tube((cx,cy,z+2.64),1.63,1.60,h-2.64,lin(0xac9975),lin(0xc3b08c),18,lin(0xb3a484))
        art.tube((cx,cy,z+h-.59),1.65,1.87,.57,lin(0x9f8c6c),lin(0xbfae90),18)
        for k in range(10):
            angle=k*math.tau/10
            for size,up,height in ((1.7,h-.72,.36),(1.64,h,.72)):
                art.box((cx+size*math.cos(angle),cy+size*math.sin(angle),z+up),
                        (.44,.57,height),angle,lin(0xb4a183))
    art.tube((*towers[0],z+20),.047,.047,3.4,lin(0x9da39d),lin(0xa1aaa4),6)
    return {'efforts':0}


THEME=dict(lay=lay,road_builder=road,land_builder=land,road_half_width=4.3,terrain={'sea':False},
           land={'mid':0x89945b},sky=[0xc6cdce,0xbac8d1,0xa7bfce,0x96b5cd,0x89a7bf],haze=0xbcc7c7,
           palette={'asphalt':0x5e6061,'sea':0x8b9366},light=[0xffedd3,2.7],fill=[0xdae2ea,0x898267],
           sun_azimuth=-.62,sun_altitude=.58)
