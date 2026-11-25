"""Badwater Road from the salt basin to the furnace and the Mesquite dunes."""
import math
from worldkit import Painted, lin

PROFILE = [(0,-80), (890,-86), (2280,-83), (4630,-64), (6500,-71), (7740,-54), (9781.25,-53)]
HALF = 3.72


def elevation(d):
    for (a,h),(b,k) in zip(PROFILE, PROFILE[1:]):
        if d <= b:
            return h + (k-h)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]


def heading(d):
    return math.pi/2 + .09*math.sin(d/680) + .13*math.exp(-((d-4350)/580)**2)


def lay(course, theme, bc):
    stages=bc.stages(course['plan'])
    length=stages[-1]['to']
    rows=[]; x=0; y=-bc.LEAD_IN
    for i in range(math.ceil((bc.LEAD_IN+length+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN; h=heading(d)
        rows.append(dict(x=x,y=y,z=elevation(d),h=h,d=d,g=100*(elevation(d+.5)-elevation(d-.5)),k=heading(d+.5)-heading(d-.5)))
        x+=bc.STEP*math.cos(heading(d+bc.STEP/2));y+=bc.STEP*math.sin(heading(d+bc.STEP/2))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,0


def asphalt(road, stages, length, col, bc):
    lane=bc.Builder('Badwater pavement','asphalt')
    stripe=bc.Builder('Weathered desert paint','terrain');stripe.colours=[]
    for i in range(len(road.s)-1):
        lane.quad(road.at(i,HALF), road.at(i,-HALF), road.at(i+1,-HALF),road.at(i+1,HALF))
        for offset,width,tint in ((-.115,.06,0xcb9e39),(.115,.06,0xe3b644),(-3.54,.058,0xd5cdb7),(3.54,.058,0xd5cdb7)):
            points=(road.at(i,offset+width,.021),road.at(i,offset-width,.021),road.at(i+1,offset-width,.021),road.at(i+1,offset+width,.021))
            stripe.faces.append(tuple(stripe.v(p) for p in points))
            stripe.colours.extend([lin(tint)]*4)
    lane.build(col);stripe.build(col)


def basin(road,col,theme,bc):
    ground=bc.Builder('Valley strata and salt pan','terrain');ground.colours=[]
    def cross(d,left):
        if left>0:
            # Panamint front, separated from the near salt by a low band of fans.
            peak=math.exp(-((d-3420)/730)**2)
            z=max(0,(left-1020)/1700)*(205+110*peak+61*math.sin(d/550)+28*math.sin(d/145))
            return -.22+z+(.24*math.sin(d/29+left/58) if left>18 else 0)
        r=-left
        toe=70+29*math.sin(d/493)+21*math.cos(d/201)
        height=max(0,r-toe)
        fold=.57+.21*math.cos(d/124)+.18*math.sin(d/357)+.04*math.sin(d/33)
        return -.16 + .22 * (min(height,180)*fold+max(height-180,0)*(.4+.19*math.sin(d/245)))
    def face(vertices,colour):
        ground.faces.append(tuple(ground.v(v) for v in vertices))
        ground.colours.extend([lin(colour)]*len(vertices))
    for i in range(0,len(road.s)-1,2):
        j=min(i+2,len(road.s)-1);d=road.s[i]['d']
        for sign,bands in ((1,[0,4,9,21,72,156,380,790,1020,1320,1750,2260,2720]),(-1,[0,4,9,22,55,85,115,145,175,210,250,299,370,445,570,810])):
            for a,b in zip(bands,bands[1:]):
                if sign>0:
                    tint=(0xa99b83 if a<9 else 0xc9bc9d if a<21 else 0xe6e1cb if a<380 else 0xd0c7b4 if a<1020 else 0x978b87 if a<1750 else 0x827e83)
                    if a>=2260 and abs(d-3420)<490:tint=0xd3d5d0
                else:
                    strata=(0x5c514c,0x77685a,0x8e7867,0x6f625d,0xaa9780,0x756059,0x8e735f)
                    tint=0xae9c83 if a<22 else 0xa89174 if a<85 else strata[(bands.index(a)+int((d+1700)/750))%len(strata)]
                verts=[road.at(k,sign*l,cross(road.s[k]['d'],sign*l)) for k,l in ((i,a),(j,a),(j,b),(i,b))]
                face(verts if sign>0 else verts[::-1],tint)
    return ground.build(col),lambda x,y:elevation(y)


def scenery(kit):
    art=Painted(kit);r=kit.road;rng=kit.rng
    def pos(d,l,z=0):return r.at(r.index(d),l,z)
    # A real timber landing with visible plank joints and square rail posts.
    for j in range(46):
        i=r.index(949); x,y,z=r.at(i,8.6+j*.42)
        art.box((x,y,z+.22),(.409,3.45,.15),0,lin(rng.choice((0xb09c7d,0xc0af90,0xa48c72))))
        if j%6==0:
            for side in (-1,1):art.box((x,y+side*1.64,z+.24),(.115,.115,1.02),0,lin(0xa38c6a))
    for side in (-1,1):
        x,y,z=pos(949,18)
        art.box((x,y+side*1.64,z+1.21),(19.5,.1,.12),0,lin(0xb6a081))
    # Low dune crests bend downwind and alternate sunlit windward faces with shaded slip faces.
    for row in range(7):
        for part in range(32):
            d=7180+part*51+row*61
            if d>9400:continue
            near=46+row*33+10*math.sin(d/184+row)
            high=(9+row*3.7)*(1+.41*math.sin(d/191+row)+.22*math.sin(d/83))
            def ridge(k):
                return [pos(k,near-25,-.15),pos(k,near+7,high*.59),pos(k,near+19,high),pos(k,near+38,.1)]
            a,b=ridge(d),ridge(d+51)
            for n,c in enumerate((0xc69b69,0xe6b578,0x9f7353)):
                vs=(a[n],b[n],b[n+1],a[n+1]);art.face(vs,(lin(c),)*4)
    return {'efforts':0}


THEME=dict(lay=lay,road_builder=asphalt,land_builder=basin,road_half_width=HALF,
           terrain={'sea':False},land={'mid':0xb2a087},haze=0xc7c4b7,
           sky=[0xe6dfc8,0xd7dddb,0xb5cbd5,0x8eb1cb,0x7197b7],
           light=[0xffefd5,3.08],fill=[0xd7dfdf,0xc8b491],sun_azimuth=1.26,sun_altitude=.958)
