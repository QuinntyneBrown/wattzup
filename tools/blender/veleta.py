"""The Sierra Nevada road from Pradollano to the Veleta summit ridge."""
import math
from arenberg import beam
from iten_landmarks import site, pictured, picture
from worldkit import Painted, lin

PROFILE=[[0, 2140], [2000.0, 2212.1121], [2850.0, 2251.6099], [3300.0, 2280.3294], [5200.0, 2381.807], [5650.0, 2410.5265], [7550.0, 2512.0041], [8000.0, 2540.7236], [9900.0, 2642.2012], [10350.0, 2670.9208], [12250.0, 2772.3983], [14250.0, 2830.6279], [14700.0, 2859.3474], [16600.0, 2960.825], [17050.0, 2989.5445], [18950.0, 3091.0221], [19400.0, 3119.7416], [21300.0, 3221.2192], [21750.0, 3249.9388], [23650.0, 3351.4163], [25250.0, 3398.0]]

def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]

def heading(d):
    return 1.21*math.tanh(4.2*math.sin((d-5485)/520))+.18*math.sin(d/310)+.13

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+.5*bc.STEP));y+=bc.STEP*math.sin(heading(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def ground(d,v):
    bench=26 if d<720 or abs(d-15270)<160 else 5
    e=max(0,abs(v)-bench)
    fall=-.31 if v<0 else .23
    return elevation(d)-.24+e*fall+min(1,e/15)*(1+e*.035)*math.sin(d/39+v/14)*math.cos(d/73-v/16)

def road(r,st,length,col,bc):
    lower=bc.Builder('VeletaTarmac','terrain');upper=bc.Builder('SummitTrack','terrain')
    for m in (lower,upper):m.colours=[];m.uvs=[]
    for i in range(len(r.s)-1):
        d=r.s[i]['d'];w=3.9-1.55*max(0,min(1,(d-17100)/2800));m=lower if d<19100 else upper
        pts=[r.at(j,v,.042) for j,v in ((i,-w),(i+1,-w),(i+1,w),(i,w))]
        picture(m,pts,[(x/6,y/6) for x,y,z in pts])
    lower.build(col);upper.build(col)

def land(r,col,theme,bc):
    m=bc.Builder('NevadaSlate','terrain');m.colours=[];m.uvs=[];last=None
    for i in range(0,len(r.s),3):
        d=r.s[i]['d'];row=[]
        for v in (-115,-60,-35,-20,-6,-3,0,3,6,20,35,60,115):
            n=max(-32,min(v,32));x,y,_=r.at(i,n);y+=v-n;row.append((x,y,ground(d,v)))
        if last:
            for a,b,c,e in zip(last,last[1:],row[1:],row):
                pts=(a,e,c,b);picture(m,pts,[(x/9,y/9) for x,y,z in pts])
        last=row
    return m.build(col),lambda x,y:elevation(r.s[r.tree.find((x,y,0))[1]]['d'])-.24

def scenery(k):
    art=Painted(k);village=pictured(k,'Pradollano');plants=pictured(k,'NevadaFlora');signs=pictured(k,'VeletaPosts')
    peaks=pictured(k,'Mulhacen');valley=pictured(k,'GranadaVega')
    stone,steel,white,roof,snow,ice,red=map(lin,(0x736A63,0x687078,0xCFCAC4,0x62544B,0xE6E8E5,0xBAC9D0,0xA93834))
    def panel(mesh,pts,lo,hi):
        picture(mesh,pts,((lo,0),(hi,0),(hi,1),(lo,1)))
    def card(mesh,at,w,h,lo,hi):
        panel(mesh,[at(0,v,z) for v,z in ((w/2,0),(-w/2,0),(-w/2,h),(w/2,h))],lo,hi)
    for j,d in enumerate(range(-40,620,39)):
        for side in (-1,1):
            at,h=site(k,d,side*(15+j%4));idx=(j+int(side==1))%3
            width=(11,15,12)[idx];high=(15,8,9)[idx]
            art.box(at(0,side*3.1,-1),(width,6,high*.78+1),h,roof)
            panel(village,[at(x,0,z) for x,z in ((-width/2,0),(width/2,0),(width/2,high),(-width/2,high))],(0,.25,.51)[idx],(.25,.51,.78)[idx])
            # Texture each gable as it comes into the uphill rider's sightline.
            panel(village,[at(-width/2-.02,v,z) for v,z in ((side*6,0),(0,0),(0,high*.80),(side*6,high*.80))],(0,.25,.51)[idx],(.25,.51,.78)[idx])
            art.roof(at(0,side*3.1,high*.78-.1),width,6,1.2,h,roof)
    for d in range(110,740,72):
        at,h=site(k,d,-9)
        art.tube(at(0,0,-.4),.45,.23,10,steel,white,10)
        beam(art,at(0,-2.2,9.4),at(0,2.2,9.4),.24,steel)
        for v in (-1.7,1.7):beam(art,at(0,v,9.6),k.road.pos(d+72,-9+v,9.6),.046,steel)
    for j,d in enumerate(range(-40,25290,16)):
        if d<17500:
            pts=[k.road.pos(d+x,v,.065) for x,v in ((-1.7,-.06),(1.7,-.06),(1.7,.06),(-1.7,.06))]
            art.face(pts,(white,)*4)
        v=(-1 if j%2 else 1)*k.rng.uniform(5.6,19)
        at,h=site(k,d,v);base=ground(d,v)-elevation(d)
        if d<7400 and (d<3800 or j%3==0):
            idx=j%4 if d<3100 else 1+j%3;w=(5.8,3.2,2.5,3.5)[idx];height=(7.7,2,1.4,1.2)[idx]
            card(plants,lambda u,n,z:at(u,n,z+base),w,height,(0,.255,.51,.755)[idx],(.255,.51,.755,1)[idx])
        elif j%3==0:
            radius=k.rng.uniform(.45,1.75);art.tube(at(0,0,base-.21),radius,radius*.58,radius*.69,stone,roof,6,cap=stone)
        if d>11200 and j%23==0:
            last=None
            for s in range(9):
                n=14+3*s;along=d+s*1.6;w=1+4*math.sin(math.pi*s/8)
                row=[]
                for x in (-w,w):
                    a,_=site(k,along+x,n);row.append(a(0,0,ground(along+x,n)-elevation(along+x)+.38))
                if last:art.face((last[0],row[0],row[1],last[1]),(ice,snow,snow,ice))
                last=row
    for d in (20585,20642,22510):
        at,h=site(k,d,-3.25);art.box(at(0,0,-.3),(.32,.38,1.65),h,red)
        for i in range(6):beam(art,at(i*.84,0,1.05+i*.15),at((i+1)*.84,0,1.20+i*.15),.11,red if i%2 else white)
    for d in (260,5490,10640,15304,20634,25009):
        at,h=site(k,d,-4.3);idx=d>24000
        card(signs,at,2.4 if idx else 1.05,2.15 if idx else 1.5,.77 if idx else 0,1 if idx else .212)
    for u in (-15,12):
        at,h=site(k,15318+u,21)
        art.box(at(0,0,-.4),(11,9,3.5),h,stone)
        for j in range(6):
            a=j*math.pi/12;b=(j+1)*math.pi/12
            art.tube(at(0,0,3+4.5*math.sin(a)),4.5*math.cos(a),4.5*math.cos(b),4.5*(math.sin(b)-math.sin(a)),white,white,18)
    hillside=pictured(k,'NevadaSlateBanks')
    # Old service ramps climb the opposite shoulder in three connected traverses.
    # Interpolate the turn ends so each upper ramp is joined by a rounded hairpin.
    at,h=site(k,5512,0)
    def ramp(u,v):
        x,y,_=at(u,v);return (x,y,elevation(5512)+9+(v-38)*.52+u*.018)
    path=[]
    for n in range(3):
        side=1 if n%2==0 else -1
        path.extend([(-63*side+side*j*3,38+n*14) for j in range(43)])
        if n<2:
            path.extend([(63*side+side*7*math.sin(j*math.pi/12),38+n*14+7*(1-math.cos(j*math.pi/12))) for j in range(1,13)])
    for (u,v),(x,y) in zip(path,path[1:]):
        length=math.hypot(x-u,y-v)
        if length<.1:continue
        dv,du=(x-u)/length*2.2,-(y-v)/length*2.2
        corners=[ramp(a+du*b,c+dv*b) for a,c,b in ((u,v,-1),(x,y,-1),(x,y,1),(u,v,1))]
        art.face(corners,(lin(0x686460),)*4)
        for j in (0,2):
            A,B=corners[j],corners[j+1]
            bank=(A,B,(B[0]+3,B[1]-3,B[2]-25),(A[0]+3,A[1]-3,A[2]-25))
            picture(hillside,bank,[(x/8+z/5,y/8) for x,y,z in bank])
    # Laguna de la Caldera occupies a rock basin beneath the final crest.
    at,h=site(k,25028,-45)
    centre=elevation(25028)-12.3
    water=lin(0x27617A);shore=lin(0x969391)
    rings=[]
    for radius in (0,.54,.91,1.12):
        row=[]
        for j in range(38):
            t=math.tau*j/38;rag=1+.08*math.sin(3*t)+.055*math.cos(7*t)
            x,y,_=at(25*radius*rag*math.cos(t),10*radius*rag*math.sin(t))
            row.append((x,y,centre+max(0,radius-.91)*6))
        rings.append(row)
    for i,(lo,hi) in enumerate(zip(rings,rings[1:])):
        for j in range(38):
            n=(j+1)%38;art.face((lo[j],hi[j],hi[n],lo[n]),(water if i<2 else shore,)*4)
    for j in range(80):
        a=j*math.tau/80;b=(j+1)*math.tau/80;u=(j%20)/20;v=u+.05
        if j//20%2:u,v=1-u,1-v
        def ring(t,z):return 5600+19500*math.cos(t),17500*math.sin(t),z
        panel(peaks,[ring(a,-9000),ring(b,-9000),ring(b,11500),ring(a,11500)],u,v)
    at,h=site(k,10655,-238)
    panel(valley,[at(u,0,z) for u,z in ((-320,-220),(320,-220),(320,65),(-320,65))],0,1)
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':3.9,'terrain':{'sea':False},'land':{'mid':0x746C66},'sky':[0xBFC9CF,0x91A8C3,0x628ABC,0x3165A5,0x194984],'haze':0xADBBC8,'light':[0xFFF2DF,1.5],'fill':[0xCBDDF2,0xA09582],'sun_altitude':.93,'sun_azimuth':-.96}
