"""The highland murram from the training roads of Iten to the Kerio escarpment."""
import bisect
import math
import sys

from worldkit import Painted, lin, smooth


def bearing(d):
    return (.14*math.sin(d/346)+.14*math.sin(d/738)+.07*math.sin(d/85)
            -.40*(smooth(8540,8810,d)-smooth(9080,9430,d))
            -.44*(smooth(15920,16580,d)-smooth(17040,17480,d)))


def route(course,theme,bc):
    stages=bc.stages(course['plan'])
    length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    touches=[]
    z=2335
    for s in stages:
        slope=(s['level']-mean)*.01
        touches.append((s['from'],s['to'],z,slope))
        z+=(s['to']-s['from'])*slope
    rows=[]
    x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        a,b,z,slope=next((r for r in touches if d<r[1]),touches[-1])
        h=bearing(d)
        rows.append(dict(d=d,x=x,y=y,z=z+(min(b,max(a,d))-a)*slope,h=h,k=bearing(d+.5)-bearing(d-.5),g=slope*100))
        x+=bc.STEP*math.cos(bearing(d+bc.STEP/2))
        y+=bc.STEP*math.sin(bearing(d+bc.STEP/2))
    return rows,stages,length,mean,1


def surface(road,st,length,col,theme):
    bc=sys.modules[type(road).__module__]
    b=bc.Builder('Murram','terrain');b.colours=[]
    offsets=(-3.65,-3.35,-2.06,-1.45,-.87,-.36,.31,.88,1.45,2.08,3.32,3.65)
    uplifts=(-.15,-.07,-.01,-.055,-.032,.034,.04,-.031,-.053,-.012,-.06,-.15)
    browns=(0x866845,0xAC683C,0xB9693C,0xBB7042,0xAA6739,0x90653D,0xAB6539,0xBE7040,0xB4673B,0xAA653A,0x856244)
    def edge(i,n):
        d=road.s[i]['d'];u=offsets[n]
        jitter=.09*math.sin(d/8.8+n*.71)+.05*math.cos(d/4.3+n*.88)
        return road.at(i,u+jitter,uplifts[n]+.008*math.cos(d/2.7+n))
    for i in range(len(road.s)-1):
        d=road.s[i]['d']
        for n,tone in enumerate(browns):
            c=lin(tone)
            if n==5 and math.sin(d/21)+math.cos(d/65)>.37:c=lin(0x777846)
            share=.95+.05*math.cos(d/29+n*.21)
            colour=tuple(v*share for v in c[:3])+(1,)
            b.quad(edge(i,n),edge(i+1,n),edge(i+1,n+1),edge(i,n+1))
            b.colours.extend((colour,)*4)
    b.build(col)


def land(road,col,theme,bc):
    points=road.s;xs=[p['x'] for p in points]
    def row(x):return points[min(len(xs)-1,bisect.bisect_left(xs,x))]
    def height(x,y):
        p=row(x);side=(y-p['y'])*math.cos(p['h'])
        distance=abs(side)
        noise=math.sin(x/150+y/118)*14+math.cos(y/61-x/239)*6
        # South of the rim the Keiyo spurs descend towards the floor of the Kerio Valley.
        rim=smooth(14500,16000,p['d'])
        drop=rim*smooth(12,570,-side)*(480+95*math.cos(x/264))
        return p['z']-.43+smooth(6,110,distance)*noise-drop
    b=bc.Builder('Keiyo highlands','terrain');b.colours=[]
    offsets=(-1650,-1100,-730,-455,-270,-165,-94,-53,-26,-12,-7,-3.6,-2,0,2,3.6,7,12,26,53,94,165,270,455,730,1100,1650)
    previous=None
    for i in range(0,len(points),3):
        s=points[i];line=[]
        for off in offsets:
            x,y,z=road.at(i,off)
            if abs(off)<=3.6:z-=.24
            elif abs(off)<=12:z-=.31
            else:z=height(x,y)
            tr=math.sin(x/153+y/90)*.4+math.cos(y/46-x/81)*.3
            colr=lin(0x76864E if tr>.17 else 0x889153 if tr>-.12 else 0x7A804A)
            if abs(off)<7:colr=lin(0x908251)
            if off<-165 and s['d']>15300:colr=lin(0x6D8659 if tr>0 else 0x74856A)
            line.append(((x,y,z),colr))
        if previous:
            for a,b0,c,d in zip(previous,previous[1:],line[1:],line):
                b.quad(a[0],d[0],c[0],b0[0]);b.colours.extend((a[1],d[1],c[1],b0[1]))
        previous=line
    return b.build(col),height


def scenery(k):
    art=Painted(k)
    # Posts are separately planted rather than extruding a wall through dips in the grade.
    for start,end,side in ((35,590,1),(2480,3160,-1),(4600,6070,1),(7450,8310,-1),(15350,16200,1)):
        last=None
        for d in range(start,end,7):
            x,y,_=k.road.pos(d,side*(5.65+.14*math.sin(d/46)));z=k.height_at(x,y)
            tall=k.rng.uniform(1.2,1.46)
            art.tube((x,y,z-.15),.063,.052,tall,lin(0x645341),lin(0x816D50),6)
            if last:
                for lift in (.55,.97):
                    a=(last[0],last[1],last[2]+lift)
                    b=(x,y,z+lift)
                    art.face((a,b,(x,y,z+lift+.018),(a[0],a[1],a[2]+.018)),(lin(0x656962),)*4)
            last=(x,y,z)
    return {'efforts':0}


THEME={'lay':route,'surface_builder':surface,'land_builder':land,'terrain':{'sea':False},'land':{'mid':0x798950},'road_half_width':3.62,
       'sky':[0xF3E0BF,0xD3DCD4,0xA0CADC,0x639CC0,0x4D84B1],'haze':0xC1D0C5,'light':[0xF9DCB5,1.6],
       'fill':[0xC8D6DA,0xAA8661],'sun_altitude':.41,'sun_azimuth':-.8}
