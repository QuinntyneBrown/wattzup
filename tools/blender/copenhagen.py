"""The protected Supercykelsti and the two harbour crossings, from the rider's lane."""
import math
from bisect import bisect_right
from worldkit import Painted, lin

LENGTH=13650
START=-100
PATH=[]
SNAKE=(2380,2780)
INNER=(10280,10660)


def smooth(x):
    v=max(0,min(1,x))
    return v*v*(3-2*v)


def bearing(d):
    heading=1.42+.18*math.sin(d/700)+.24*math.sin(d/380)
    for a,b,amplitude in ((*SNAKE,.94),(*INNER,.33)):
        t=(d-a)/(b-a)
        if 0<t<1:
            heading+=amplitude*math.sin(t*math.tau)*math.sin(t*math.pi)
    return heading


def deck_rise(d):
    return sum(high*smooth((d-a+125)/125)*smooth((b+125-d)/125)
               for (a,b),high in ((SNAKE,4.2),(INNER,2.7)))


def pose(d,side=0,up=0):
    f=min(len(PATH)-1.00001,max(0,d-START))
    i=int(f);t=f-i
    a,b=PATH[i:i+2];h=bearing(d)
    x=a[0]+(b[0]-a[0])*t-math.sin(h)*side
    y=a[1]+(b[1]-a[1])*t+math.cos(h)*side
    return x,y,a[2]+(b[2]-a[2])*t+up


def lay(course,theme,bc):
    stages=bc.stages(course['plan']);ends=[s['to'] for s in stages]
    PATH.clear();x,y,z=0,START,3
    for d in range(START,LENGTH+351):
        PATH.append((x,y,z+deck_rise(d)))
        t=d+.5;h=bearing(t);stage=stages[min(len(stages)-1,bisect_right(ends,t))]
        x+=math.cos(h);y+=math.sin(h)
        z+=(.005 if stage['kind']=='work' else 0)+.003*math.sin(t/310)*math.cos(t/870+1)
    samples=[]
    for i in range(math.ceil((bc.LEAD_IN+LENGTH+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y,z=pose(d)
        samples.append(dict(x=x,y=y,z=z,d=d,h=bearing(d),k=bearing(d+.5)-bearing(d-.5),
                            g=100*(pose(d+.5)[2]-pose(d-.5)[2])))
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/LENGTH
    return samples,stages,LENGTH,mean,0


def paint(b,points,shade):
    b.faces.append(tuple(b.v(p) for p in points));b.colours.extend([lin(shade)]*len(points))


def ribbon(b,d,e,left,right,z,shade):
    paint(b,[pose(d,left,z),pose(d,right,z),pose(e,right,z),pose(e,left,z)],shade)


def crossing(d):
    return next((v for v in (SNAKE,INNER) if v[0]<=d<v[1]),None)


def road(road,stages,length,col,bc):
    b=bc.Builder('Raised cycle track','terrain');b.colours=[]
    for d in range(-80,LENGTH+160,4):
        bridge=crossing(d)
        surface=(0xc16543 if bridge==SNAKE else 0x939796 if bridge else 0x686f70)
        ribbon(b,d,d+4,2.85,-2.85,0,surface)
        if not bridge:
            for side in (-2.69,2.79):
                ribbon(b,d,d+4,side,side-.12,.013,0x478baf)
        ribbon(b,d,d+1.3,.046,-.046,.013,0xe5e5d8)
        if not bridge and d%260 in (128,132,136,140):
            ribbon(b,d,d+4,2.64,-2.64,.009,0x598fab)
            for l in (-1.98,-1.28,-.58,.12,.82,1.52,2.22):
                ribbon(b,d+.2,d+.38,l,l-.12,.018,0xd9e3e0)
    b.build(col)


def ground(road,col,theme,bc):
    b=bc.Builder('Harbour and avenues','terrain');b.colours=[]
    for d in range(-80,LENGTH+160,4):
        bridge=crossing(d)
        water=bool(bridge) or 3920<d<4710 or 6970<d<8160
        water_level=-2.6-deck_rise(d)
        ribbon(b,d,d+4,125,-180,water_level if water else -.42,0x678c95 if water else 0x888c7a)
        if bridge:
            ribbon(b,d,d+4,3.5,2.84,-.02,0xa7a29a)
            ribbon(b,d,d+4,-2.84,-3.5,-.02,0xa7a29a)
            continue
        ribbon(b,d,d+4,3.23,2.85,-.03,0xb9b7a8)
        ribbon(b,d,d+4,14,3.23,-.19,0x757977)
        ribbon(b,d,d+4,22,14,-.10,0xb8b4a6)
        ribbon(b,d,d+4,-2.85,-8.7,-.02,0xc1bdaf)
        if not water: ribbon(b,d,d+4,-8.7,-19,-.15,0x8c9b78)
        if d%12==0:ribbon(b,d,d+3.1,8.75,8.65,-.175,0xdcdacc)
    return b.build(col),lambda x,y:0


THEME=dict(lay=lay,road_builder=road,land_builder=ground,road_half_width=2.85,
           terrain={'sea':False},land={'mid':0x839491},haze=0xc0d0d7,
           sky=[0xdde3df,0xcbd8df,0xabc4d3,0x91b1c6,0x7ca0bd],
           light=[0xffe3b9,2.85],fill=[0xc6d9e9,0xb9b7ac],sun_azimuth=2.6,sun_altitude=.32)


def scenery(kit):
    art=Painted(kit)
    def box(d,l,z,length,width,h,tint):
        art.box(pose(d,l,z),(length,width,h),bearing(d),lin(tint))
    for a,b in (SNAKE,INNER):
        for d in range(a,b,2):
            for side in (-3.17,3.17):
                box(d,side,0,.055,.065,1.19,0x788884)
                box(d+1,side,1.19,2.08,.11,.075,0xc9d1ce)
                for j in (0,.4,.8,1.2,1.6):
                    box(d+j,side,.12,.037,.035,1.04,0x959f9c)
            if d%20==0:
                box(d,0,-7,1.0,2.2,6.82,0x878b83)
                box(d,0,-.47,2.35,6.5,.43,0xa2a399)
    def tube(d,l,z,r1,r2,h,tint,sides=12):
        shade=lin(tint)
        art.tube(pose(d,l,z),r1,r2,h,shade,shade,sides,shade)
    def stick(a,b,width,tint):
        dx,dy,dz=(b[i]-a[i] for i in range(3))
        span=math.hypot(dx,dy);length=math.hypot(span,dz)
        if not length:return
        u,v=(-dy/span,dx/span) if span else (1,0)
        ring=[(width*(u*math.cos(q)-v*dz/length*math.sin(q)),
               width*(v*math.cos(q)+u*dz/length*math.sin(q)),width*span/length*math.sin(q))
              for q in (0,math.pi/2,math.pi,3*math.pi/2)]
        for j in range(4):
            nxt=(j+1)%4
            vertices=[tuple(point[i]+normal[i] for i in range(3)) for point,normal in
                      ((a,ring[j]),(a,ring[nxt]),(b,ring[nxt]),(b,ring[j]))]
            art.face(vertices,[lin(tint)]*4)
    rng=kit.rng
    # North-facing coloured gables on the far quay; the houses share party walls but have
    # individual ridge heights, chimney pots and framed windows above their café fronts.
    for j,d in enumerate(range(6930,8190,10)):
        l=-45;h=rng.choice((9,11,13,15));w=rng.uniform(9.4,10.4)
        tint=(0xb8674a,0xe3b85b,0x7d9ca8,0xb35243,0xecdec0,0xadb59b)[j%6]
        box(d,l,-.2,w,10,h,tint)
        art.roof(pose(d,l,h-.2),10.4,w+.35,rng.uniform(2.8,4.7),bearing(d)+math.pi/2,lin(0x884f43))
        box(d+2,l-2,h+1.5,.65,.72,3,0x9f6755)
        for floor in range(int(h/3)):
            z=floor*2.8+.65
            for off in (-3,0,3):
                box(d+off,l+5.04,z,1.3,.15,1.72,0xe2ded0)
                box(d+off,l+5.15,z+.10,1.07,.08,1.48,0x51636a)
                box(d+off,l+5.22,z+.12,.09,.08,1.47,0xd7d5c4)
                box(d+off,l+5.23,z+.91,1.06,.08,.075,0xd7d5c4)
        box(d,l+5.65,2.4,w*.8,1.45,.19,0xd7c9a9)
        for off in (-2.8,1.9):
            tube(d+off,l+7,.01,.4,.4,.68,0x8e735b,8)
    # The quays and timber sailing boats, each with a hull narrowing towards its stem and stern.
    for d in range(6950,8160,10):
        box(d,-47,-3,10,19,2.77,0x8f8372)
    for j,d in enumerate(range(7008,8130,31)):
        l=-17-j%2*4
        for k in range(12):
            t=k/11;half=1.67*math.sin(math.pi*(.035+.93*t))**.6
            box(d-8+k*1.4,l,-2.42,1.48,half*2,1.22,0x634a3b if j%2 else 0x424f51)
            box(d-8+k*1.4,l,-1.20,1.50,half*2+.11,.11,0xc6a37a)
        box(d+1,l,-1.06,4.0,2.18,1.19,0xd7c8a6)
        box(d+1,l,.14,4.16,2.33,.17,0x876d55)
        for off,top in ((-3,11),(4,8.7)):
            tube(d+off,l,-1.03,.105,.065,top,0x947857,9)
            stick(pose(d+off,l,top-1.15),pose(d+off+5,l,-.99),.026,0x6c6859)
            stick(pose(d+off,l,top-1.15),pose(d+off-4,l,-.99),.026,0x6c6859)
    # Islands Brygge's open swimming basin, wrapped in timber decks and the diving steps.
    for d in range(4170,4350,3):
        for l,w in ((-12.3,7.5),(-34.5,3)):
            box(d,l,-1.06,2.98,w,.62,0xb09671)
    for d in (4171,4260,4348):
        box(d,-23,-1.08,3,22,.67,0xb59e7c)
    for j in range(14):
        box(4292+j*.65,-15,-.41,.67,3.1,(j+1)*.26,0xb0956f)
    for j in range(6):
        tube(4272,-31,-.46+j*.81,1.0-j*.055,.95-j*.055,.81,
             0xb9473d if j%2==0 else 0xe8e6d7,8)
    # City signals have a bike head at eye level, a lean rail, orange route sign and pump.
    for n,d in enumerate(range(124,13600,260)):
        if crossing(d):continue
        tube(d,-3.4,-.03,.085,.075,2.60,0x697676,8)
        box(d,-3.4,1.79,.26,.40,.68,0x333e40)
        for j in range(3):
            box(d-.14,-3.4,1.85+j*.21,.035,.14,.14,(0x355452,0x736753,0x794c4a)[j])
        for off in (-2.3,-.45):
            tube(d+off,-3.25,0,.055,.055,.86,0x778684,8)
        box(d-1.37,-3.25,.84,1.95,.082,.085,0xa9b4ad)
        box(d-1.37,-3.1,.28,1.95,.34,.09,0x7b8784)
        if n%3==0:
            box(d-10,-3.62,0,.1,.11,2.68,0x808b86)
            box(d-10,-3.62,1.88,.12,.84,.75,0xe7984e)
            for k in range(11):
                a=math.radians(53+25*k)
                box(d-10.075,-3.62+.23*math.sin(a),2.18+.23*math.cos(a),.025,.076,.08,0xffecd1)
            box(d-6,-4.4,0,.25,.28,.97,0xb75841)
            box(d-6,-4.4,.95,.13,.56,.10,0x56645e)
    # Late nineteenth-century blocks, linden-lined cafés and parked bikes occupy the avenue.
    for n,d in enumerate(range(-35,13800,28)):
        if crossing(d):continue
        h=rng.choice((10,13,16,19));l=23+rng.uniform(0,4);w=rng.uniform(20,27)
        tone=rng.choice((0xc6b8a1,0xb17f69,0xd5c9ad,0xbab5aa,0xd0c5bb))
        box(d,l+5,0,w,10,h,tone)
        art.roof(pose(d,l+5,h),w+1,11,2.6,bearing(d),lin(0x716c64))
        for floor in range(h//3):
            z=.7+floor*3
            for off in range(-8,10,4):
                box(d+off,l-.11,z,1.3,.2,1.7,0x556368)
                box(d+off,l-.23,z-.09,1.6,.32,.13,0xd6d2c3)
        if n%3==0:
            box(d,l-1.25,2.6,6.7,2.5,.14,0xb9a784)
            for q in (-2,1.6):tube(d+q,l-2.5,0,.52,.52,.8,0x8e7766)
    # The copper skyline remains fixed across the harbour, with pointed and stepped roofs.
    far=Painted(kit,'peaks')
    for d,side,h in ((1180,-245,61),(3880,-285,93),(6960,-190,72),(7890,-245,96),(10950,-218,88)):
        x,y,z=pose(d,side)
        far.box((x,y,z-2),(22,30,h*.49),bearing(d),lin(0xb29478))
        far.tube((x,y,z+h*.46),9,6,h*.18,lin(0x687d75),lin(0x82968b),8)
        far.tube((x,y,z+h*.64),5.7,.45,h*.35,lin(0x667c72),lin(0x98a69a),8)
        far.tube((x,y,z+h*.98),.42,.12,3.1,lin(0x998850),lin(0xc6a766),6)
    # Dock warehouses and the old city's rooftops ground the spires on both banks.
    for d in range(-500,14500,47):
        for side in (-1,1):
            setback=(220+rng.uniform(0,45)) if side<0 else (110+rng.uniform(0,35))
            x,y,z=pose(d,side*setback)
            h=rng.uniform(8,21)
            far.box((x,y,z-22),(rng.uniform(33,48),38,22+h),bearing(d),
                    lin(rng.choice((0xb7b6aa,0xa3aba8,0xb2a396,0xb5ac9e))))
            far.roof((x,y,z+h),(40),39,3.7,bearing(d),lin(0x898a83))
    for d,side,h in ((1180,-245,61),(3880,-285,93),(6960,-190,72),(7890,-245,96),(10950,-218,88)):
        x,y,z=pose(d,side)
        far.box((x,y,z-32),(31,40,34),bearing(d),lin(0xa79680))
    # A Copenhagen cycle counter, a service hose, parking hoops and kerb stones.
    for index,d in enumerate(range(124,13600,260)):
        if crossing(d):continue
        if index%3==0:
            box(d-8,-4.14,0,.45,.69,1.9,0x4e5c5e)
            box(d-8.25,-4.14,1.04,.045,.53,.59,0x273838)
            for q in range(5):
                for h in (1.17,1.29,1.41):
                    box(d-8.29,-4.32+q*.082,h,.016,.052,.024,0xaff2ba)
            stick(pose(d-6,-4.47,.83),pose(d-5.84,-4.64,.17),.027,0x454d48)
        for q in range(12):
            box(d+q*1.3,3.07,-.015,1.27,.38,.068,0xb8baaf)
    for d in range(0,13620,195):
        if crossing(d):continue
        for q in range(5):
            s=d+q*.83
            tube(s,-5.33,-.02,.035,.035,.76,0x7b8581,7)
            tube(s,-6.01,-.02,.035,.035,.76,0x7b8581,7)
            box(s,-5.67,.71,.07,.67,.07,0x969e98)
    # The diving steps have horizontal treads, a handrail, individual boards and pool ladders.
    for j in range(14):
        d=4292+j*.65
        for k in range(5):
            box(d,-16.3+k*.58,-.41+(j+1)*.26,.635,.55,.055,0xc8ac81)
        if j%2==0: tube(d,-16.55,-.38+(j+1)*.26,.04,.04,.93,0x7d8883,7)
        stick(pose(d,-16.55,.55+(j+1)*.26),pose(d+.65,-16.55,.81+(j+1)*.26),.045,0xa7b1a8)
    for d in (4187,4244,4315):
        for off in (-.32,.32):
            tube(d+off,-16.4,-2.71,.045,.045,2.68,0x8d9b96,8)
        for j in range(6):box(d,-16.4,-2.51+j*.34,.67,.08,.07,0x9aa79f)
    return {'efforts':0}
