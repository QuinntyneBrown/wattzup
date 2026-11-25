"""The Cambridgeshire drove road, its drainage banks and scattered farm buildings."""
import math
import random
from worldkit import Painted, lin

PROFILE = [(0,1),(3200,1),(3700,2),(4900,1),(8000,1),(8400,2),(9850,1),
           (10400,1),(10750,7),(11000,7),(11400,1),(13300,1),(13800,2),(15000,2)]


def elevation(d):
    for (a, low), (b, high) in zip(PROFILE, PROFILE[1:]):
        if d <= b:
            return low + (high-low)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]


def heading(d):
    return 1.5 + sum(angle*(1+math.tanh((d-turn)/32))/2 for turn,angle in
                     [(3050,.36),(5920,-.57),(8020,.4),(10350,-.23),(11300,.19)])


def lay(course, theme, bc):
    stages = bc.stages(course['plan'])
    length = stages[-1]['to']
    x = y = 0
    rows = []
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d = i*bc.STEP-bc.LEAD_IN
        h = heading(d+bc.STEP/2)
        rows.append(dict(x=x,y=y,z=elevation(d),d=d,h=heading(d),
                         k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x += bc.STEP*math.cos(h)
        y += bc.STEP*math.sin(h)
    return rows, stages, length, sum((s['to']-s['from'])*s['level'] for s in stages)/length, 0


def quad(builder, points, colour):
    builder.faces.append(tuple(builder.v(p) for p in points))
    builder.colours.extend([lin(colour)]*4)


def road(r, stages, length, col, bc):
    lane = bc.Builder('Rolled asphalt and worn gravel shoulders','fen-lane')
    lane.colours = []
    for i in range(len(r.s)-1):
        for left,right,h,k,tone in [(-2.7,-2.28,-.04,.015,0x888475),(-2.28,0,.015,.065,0x595a58),
                                    (0,2.28,.065,.015,0x595a58),(2.28,2.7,.015,-.04,0x888475)]:
            quad(lane,[r.at(j,l,z) for j,l,z in [(i,right,k),(i,left,h),(i+1,left,h),(i+1,right,k)]],tone)
    lane.build(col)


def land(r, col, theme, bc):
    field = bc.Builder('Peat, wheat, beet and grass banks','fen-fields')
    water = bc.Builder('Roadside drains and the Great Ouse','fen-drains')
    field.colours = []
    water.colours = []
    lanes = (2.55,4.1,5.6,10.2,12.1,16,37,110,380,940)
    crops = (0x534439,0x8d9845,0xb9a057,0x6e863e,0x68603b,0x788749)
    for i in range(len(r.s)-1):
        d = r.s[i]['d']
        river = 10750 <= d < 10960
        for side in (-1,1):
            for j,(inner,outer) in enumerate(zip(lanes,lanes[1:])):
                if river:
                    if j == 0:
                        continue
                    batch,tone=water,0x526c75
                else:
                    batch=water if j==2 else field
                    tone=(0x73804b,0x647a47,0x536960,0x586740,0x819047)[j] if j<5 else crops[(int(d//430)+side*2+j//2)%len(crops)]
                pts=[]
                for idx,l in ((i,outer),(i,inner),(i+1,inner),(i+1,outer)):
                    z=r.s[idx]['z']
                    if river:
                        up=.2-z
                    elif l<=4.1:
                        up=-.08
                    elif l in (5.6,10.2):
                        up=-.55-z
                    else:
                        up=-z
                    pts.append(r.at(idx,side*l,up))
                if side<0:pts.reverse()
                quad(batch,pts,tone)
    field.build(col)
    water.build(col)
    return None,lambda x,y:0


def scenery(k):
    road=k.road
    art=Painted(k)
    rng=random.Random(2119)
    def box(d,l,z,w,depth,h,tone):
        art.box(road.pos(d,l,z),(w,depth,h),heading(d),lin(tone))
    for d in range(-15,14980,8):
        if 10710<d<11000:continue
        for side in (-1,1):
            for blade in range(5):
                at=d+rng.uniform(0,7)
                l=side*rng.uniform(3.0,4.4)
                x,y,z=road.pos(at,l,-.15)
                h=rng.uniform(.30,.85)
                c=lin(rng.choice((0x707548,0x83874f,0xa09b64,0x5e713d)))
                art.face([(x-.15,y,z),(x+.15,y,z),(x+h*.65,y+.07,z+h)],(c,c,c))
    for d in (530,2650,4760,6410,8120,9560,12000,14150):
        side=1 if d%3 else -1
        base=-elevation(d)
        box(d,side*8,base+1,5.6,10,.32,0x848579)
        for l in (4,12):
            box(d,side*l,base,1.4,1.5,1.2,0x746c5e)
        farm=d+95
        for at,l,w,depth,h,tone in [(farm,44,16,8,5.4,0x9a7455),(farm+24,52,24,12,4.6,0x675f4f)]:
            ground=-elevation(at)
            box(at,side*l,ground,w,depth,h,tone)
            art.roof(road.pos(at,side*l,ground+h),w+1,depth+1,2.7,heading(at),lin(0x72675e))
            for off in range(-int(w/2)+2,int(w/2)-1,3):
                box(at+off,side*(l-depth/2-.1),ground+1.2,1.1,.2,1.55,0x454e4a)
        for n in range(12):
            at=farm-35+n*7
            root=road.pos(at,side*37,-elevation(at))
            art.tube(root,.24,.16,7,lin(0x5a5348),lin(0x716958),7)
            for j in range(2):
                art.tube((root[0]+j*.55,root[1],root[2]+3+j*3),2.1-j*.35,.5,7-j,lin(0x49583a),lin(0x738052),8)
    for d in range(10750,10961,5):
        for side in (-1,1):
            box(d,side*2.9,-.22,5.2,.45,.45,0x77756e)
            box(d,side*2.9,.20,.14,.14,1.15,0x67716c)
            box(d,side*2.9,1.29,5.03,.11,.13,0x87918a)
            box(d,side*2.9,.78,5.03,.1,.1,0x79857d)
    return {'efforts':0}


THEME=dict(lay=lay,road_builder=road,land_builder=land,road_half_width=2.28,terrain={'sea':False},
           land={'mid':0x78854d},sky=[0xb6bbb8,0x9da6ab,0x8798a1,0x768895,0x718594],haze=0xacb5ae,
           palette={'asphalt':0x595a58,'sea':0x60716c},light=[0xffebcc,2.7],fill=[0xd4dce2,0x777663],
           sun_azimuth=-.72,sun_altitude=.58)
