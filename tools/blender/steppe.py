"""A grass double-track across Khentii, from the ger camp to the evening herd."""
import math
from worldkit import Painted,lin,smooth
from iten_landmarks import site,pictured,picture
from arenberg import beam
PROFILE=[[0, 100], [2400.0, 74.4804], [3200.0, 70.7739], [4475.0, 72.5166], [4700.0, 76.1992], [4900.0, 72.8725], [5700.0, 66.766], [6975.0, 68.5087], [7775.0, 62.4022], [8200.0, 65.5331], [9700.0, 103.5834], [11300.0, 76.9703], [12800.0, 115.0206], [14400.0, 88.4075], [15900.0, 126.4578], [16700.0, 113.1512], [17500.0, 107.0447], [18350.0, 113.3065], [19150.0, 100.0]]

def heading(d): return .29*math.sin(d/560)+.18*math.sin(d/241)+.056*math.cos(d/113)

def height(d):
    if d<=0:return PROFILE[0][1]
    for (a,z),(b,h) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(h-z)*(d-a)/(b-a)
    return PROFILE[-1][1]

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=height(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(height(d+.5)-height(d-.5))))
        x+=bc.STEP*math.cos(heading(d+.5*bc.STEP));y+=bc.STEP*math.sin(heading(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def road(r,st,length,col,bc):
    path=bc.Builder('SteppeRuts','terrain');path.colours=[];path.uvs=[]
    tracks=[(0,length,0,1)]+[(start,start+span,side*width,.77) for start,span,side,width in ((65,510,1,8),(3100,620,-1,12),(6020,760,1,19),(9550,490,-1,11),(13190,510,1,13),(18140,790,-1,23))]
    for start,end,width,scale in tracks:
        for i in range(max(0,r.index(start)-1),min(r.index(end)+2,len(r.s)-1)):
            p,q=r.s[i],r.s[i+1];hw=2.56*scale
            def offset(d):return width*math.sin(math.pi*max(0,min(1,(d-start)/(end-start))))**1.25
            a=offset(p['d']);b=offset(q['d']);z=.018 if width else .032
            picture(path,(r.at(i,a-hw,z),r.at(i+1,b-hw,z),r.at(i+1,b+hw,z),r.at(i,a+hw,z)),((0,p['d']/5.3),(0,q['d']/5.3),(1,q['d']/5.3),(1,p['d']/5.3)))
    path.build(col)

def land(r,col,theme,bc):
    m=bc.Builder('SteppeTurf','terrain');m.colours=[];m.uvs=[];last=None
    def surface(d,v):
        w=smooth(16,105,abs(v));far=smooth(115,640,abs(v))
        return height(d)-.14+w*(3.3*math.sin(d/265+v/69)+2.5*math.cos(v/83-d/217))+far*(18+24*math.sin(d/610+v/320))
    for i in range(0,len(r.s),3):
        d=r.s[i]['d'];line=[]
        for v in (-790,-490,-290,-170,-98,-59,-31,-18,0,18,31,59,98,170,290,490,790):
            x,y,_=r.at(i,v);line.append((x,y,surface(d,v)))
        if last:
            for a,b,c,e in zip(last,last[1:],line[1:],line):
                pts=(a,e,c,b);picture(m,pts,[(x/6,y/6) for x,y,z in pts])
        last=line
    return m.build(col),lambda x,y:height(r.s[r.tree.find((x,y,0))[1]]['d'])-.14

def scenery(k):
    art=Painted(k);felt=pictured(k,'GerFelt');sky=pictured(k,'KhentiiSky');flowers=pictured(k,'SteppeFlowers')
    rope,cream,ochre,metal,blue=map(lin,(0x6C5A44,0xE5DEBF,0xB9894E,0x766F61,0x4681AC))
    def ger(d,v,r):
        at,h=site(k,d,v);ht=r*.51;last=None;n=24
        for j in range(n+1):
            # The doorway faces the road at the centre of this unwrap.
            a=math.tau*j/n+(math.pi/2 if v>0 else -math.pi/2);x=r*math.cos(a);y=r*math.sin(a)
            row=(at(x,y,-.12),at(x,y,ht),at(x*1.04,y*1.04,ht+.07),at(x*.21,y*.21,ht+r*.43))
            if last:
                u=(j-1)/n;t=j/n
                picture(felt,(last[0],row[0],row[1],last[1]),((u,0),(t,0),(t,1),(u,1)))
                tone=(cream,lin(0xDCD4B8),lin(0xD3CBB4))[(j//4)%3]
                art.face((last[2],row[2],row[3],last[3]),(tone,)*4)
                if j%4==0:beam(art,row[2],row[3],.025,rope)
            last=row
        art.tube(at(0,0,ht+r*.415),r*.24,r*.24,.08,ochre,cream,14,cap=cream)
        art.tube(at(.38,0,ht+r*.44),.08,.07,r*.28,metal,metal,8)
    for d,v,r in ((225,36,3.3),(3182,12,3.9),(3201,23,3.2),(3218,15,3.5),(4440,-29,3.4),(11040,28,3.2),(13455,31,3.1),(18769,-18,3.6),(18790,-24,3.1)):
        ger(d,v,r)
    for d,v in ((9754,7.6),(15280,-11.7)):
        at,h=site(k,d,v)
        for layer,count,rad,z in ((0,33,2.1,0),(1,22,1.55,.39),(2,14,1.08,.78),(3,8,.58,1.08)):
            for j in range(count):
                a=j*math.tau/count+layer*.51;r=rad*(.76+.22*k.rng.random());c=lin((0x92897A,0x77796E,0xA9A191,0x818775)[j%4])
                art.tube(at(r*math.cos(a),r*math.sin(a),z-.08),.42,.28,.44+k.rng.random()*.22,c,c,6,cap=c)
        for j in range(7):
            beam(art,at(.39*math.cos(j),.37*math.sin(j),.8),at(.49*math.cos(j+.6),.48*math.sin(j+.6),3.51+.25*math.sin(j)),.064,rope)
        for j in range(3):
            art.tube(at(0,0,2.3+j*.28),.42-j*.06,.38-j*.06,.18,blue,blue,10)
    for i,d in enumerate(range(-4,19164,6)):
        if i%3 and not (12880<d<13600):continue
        for j in range(3):
            v=k.rng.choice((-1,1))*k.rng.uniform(2.9,7.8);at,h=site(k,d+j*.9,v)
            ht=k.rng.uniform(.21,.41);w=k.rng.uniform(.21,.41)
            for a in (.32,1.9):
                dx=w*.5*math.cos(a);dy=w*.5*math.sin(a)
                picture(flowers,(at(-dx,-dy,-.09),at(dx,dy,-.09),at(dx,dy,ht),at(-dx,-dy,ht)),((0,0),(1,0),(1,1),(0,1)))
    # Break the panoramic ring into sectors and mirror successive strips so their ends meet.
    for j in range(80):
        a=math.tau*j/80;b=math.tau*(j+1)/80;u=j%16/16;v=u+1/16
        if j//16%2:u,v=1-u,1-v
        def rim(t,z):return 9000+15400*math.cos(t),15000*math.sin(t),z
        picture(sky,(rim(a,-1300),rim(b,-1300),rim(b,4600),rim(a,4600)),((u,0),(v,0),(v,1),(u,1)))
    return {'efforts':0}
THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':2.55,'terrain':{'sea':False},'land':{'mid':0x839657},'sky':[0xCFDFD9,0xB8D2DB,0x9BC5DA,0x78B0D0,0x5C9BC4],'haze':0xBBCDC2,'light':[0xFFF0D2,1.3],'fill':[0xCDDFE4,0xB7AE8A],'sun_altitude':.41,'sun_azimuth':-.94}
