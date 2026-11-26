"""Maple Avenue at daybreak, ending in a broad cul-de-sac."""
import math
from arenberg import beam
from iten_landmarks import site,pictured,picture
from worldkit import Painted,lin

PROFILE=[[0, 85], [800.0, 81.9913], [1250.0, 81.7165], [1700.0, 82.3866], [2150.0, 83.5292], [2600.0, 85.6168], [2850.0, 87.5641], [3250.0, 84.7998], [3700.0, 84.5249], [4150.0, 85.195], [4600.0, 86.3377], [4850.0, 88.2849], [5250.0, 85.5206], [5700.0, 85.2457], [5925.0, 85.817], [6175.0, 87.7643], [6575.0, 85.0]]

def elevation(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]

def heading(d):
    if d<6270:return .26*math.sin(d/328)+.16*math.sin(d/182)+.07*math.cos(d/80)
    initial=.26*math.sin(6270/328)+.16*math.sin(6270/182)+.07*math.cos(6270/80)
    return initial+min(1,(d-6270)/116)*math.pi*1.70

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=elevation(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elevation(d+.5)-elevation(d-.5))))
        x+=bc.STEP*math.cos(heading(d+.5*bc.STEP));y+=bc.STEP*math.sin(heading(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def road(r,st,length,col,bc):
    asphalt=bc.Builder('MapleRoad','terrain');asphalt.colours=[];asphalt.uvs=[]
    for i,p in enumerate(r.s[:-1]):
        w=4.25+1.68*max(0,1-abs(p['d']-6330)/93)
        picture(asphalt,[r.at(j,v,.035) for j,v in ((i,-w),(i+1,-w),(i+1,w),(i,w))],((0,0),(1,0),(1,1),(0,1)))
    asphalt.build(col)

def land(r,col,theme,bc):
    lawn=bc.Builder('MapleLawns','terrain');lawn.colours=[];lawn.uvs=[]
    prev=None
    for i in range(0,len(r.s),2):
        row=[]
        for v in (-650,-120,-36,-22,-12,-4,0,4,12,22,36,120,650):
            x,y,z=r.at(i,v);row.append((x,y,z-.12+min(1,abs(v)/80)*1.1*math.sin(r.s[i]['d']/177+v/39)))
        if prev:
            for a,b,c,e in zip(prev,prev[1:],row[1:],row):
                picture(lawn,(a,e,c,b),[(x/9,y/9) for x,y,z in (a,e,c,b)])
        prev=row
    return lawn.build(col),lambda x,y:elevation(r.s[r.tree.find((x,y,0))[1]]['d'])-.12

def scenery(k):
    art=Painted(k);trees=pictured(k,'MapleCanopy');fronts=pictured(k,'MapleClapboard');signs=pictured(k,'AvenueSigns');dawn=pictured(k,'MapleDawn')
    wood,white,curb,walk,slate,postmetal,rubber,glass,red=map(lin,(0x997659,0xDEDCD0,0xA8A69F,0xC3BCB0,0x64696A,0x777F7D,0x3B3C40,0x819299,0xB54E42))
    colours=list(map(lin,(0x6F8793,0x848D76,0xC9B897,0xA16A5C)))
    def tree(at,u,v,ht,w,t):
        for a in (.49,2.07):
            dx=w*.5*math.cos(a);dy=w*.5*math.sin(a);left=t/4
            picture(trees,[at(u+x,v+y,z) for x,y,z in ((-dx,-dy,-.12),(dx,dy,-.12),(dx,dy,ht),(-dx,-dy,ht))],((left,0),(left+.25,0),(left+.25,1),(left,1)))
    def sign(at,side,t,w,ht):
        art.tube(at(0,side,0),.067,.059,2.34,postmetal,postmetal,7)
        u=t/4
        picture(signs,[at(0,side+y,z) for y,z in ((-w/2,ht),(w/2,ht),(w/2,ht+.79),(-w/2,ht+.79))],((u,0),(u+.25,0),(u+.25,1),(u,1)))
    for j,d in enumerate(range(-45,6630,18)):
        # Omit duplicate household plots inside the turning bulb.
        if 6268<d<6394:continue
        for side in (-1,1):
            at,h=site(k,d);drive=5.8 if j%2==0 else -5.8;setback=14.8+(j*5%4);col=(j+side)%4
            art.box(at(0,side*4.56,.01),(18,.25,.14),h,curb);art.box(at(0,side*6.95,.02),(17.94,1.39,.13),h,walk)
            art.box(at(drive,side*10.2,.10),(2.91,11.1,.07),h,walk)
            for n in (-6,0,6):art.box(at(n,side*6.95,.147),(.025,1.38,.013),h,curb)
            art.box(at(0,side*setback,-.07),(9,6.2,5.85),h,colours[col]);art.roof(at(0,side*setback,5.77),9.4,6.65,2.42,h,slate)
            v=side*(setback-3.12);u=col/4
            picture(fronts,[at(x,v,z) for x,z in ((-4.48,.06),(4.48,.06),(4.48,5.76),(-4.48,5.76))],((u,0),(u+.25,0),(u+.25,1),(u,1)))
            art.box(at(0,v-side*.9,.05),(7.6,1.91,.45),h,wood);art.roof(at(0,v-side*.77,2.88),7.8,2.46,.51,h,slate)
            for x in (-3.55,-1.22,1.22,3.55):art.box(at(x,v-side*1.79,.5),(.15,.15,2.44),h,white)
            for n in range(3):art.box(at(0,v-side*(2.04+.30*n),.04),(1.49,.34,.36-.10*n),h,walk)
            art.box(at(drive+1.57,side*5.49,.03),(.11,.11,.96),h,wood);art.box(at(drive+1.57,side*5.49,.96),(.47,.28,.21),h,postmetal)
            if j%2==0:
                tree(at,-5.82,side*6.05,11+(j%5),8.8+(j%4),j%4)
            if j%5==0:tree(at,3.5,side*(setback+5),15,11,(col+1)%4)
            if (j+side)%3==0:
                # A family sedan parked in a driveway or parallel at the kerb.
                along,lane,yaw=(drive,side*10.75,h+math.pi/2) if j%2 else (-2,side*3.39,h)
                origin=at(along,lane,.1);cs=math.cos(yaw);sn=math.sin(yaw)
                def car(x,y,z):return (origin[0]+x*cs-y*sn,origin[1]+x*sn+y*cs,origin[2]+z)
                paint=lin((0x738B95,0xB84B42,0xC7C5B7,0x596963)[col])
                art.box(car(0,0,.28),(4.35,1.76,.68),yaw,paint);art.box(car(.07,0,.96),(2.38,1.56,.50),yaw,glass);art.box(car(.05,0,1.46),(1.92,1.48,.12),yaw,paint)
                for x in (-1.36,1.31):
                    for y in (-.87,.87):art.box(car(x,y,.11),(.59,.14,.49),yaw,rubber)
                for y in (-.61,.61):art.box(car(2.18,y,.64),(.03,.31,.14),yaw,white)
            if side==1 and j%3==0:
                art.tube(at(-6.8,8,.08),.18,.12,8.3,wood,wood,8);art.box(at(-6.8,8,7.85),(.19,2.22,.16),h,wood)
                for v in (7.25,8.7):beam(art,at(-6.8,v,8.1),at(47.2,v,8.1),.024,rubber)
            if j%13==0 and side==-1:
                art.tube(at(4,-5.25,.12),.13,.14,.58,red,red,9,cap=red);art.tube(at(4,-5.25,.68),.17,.09,.14,red,red,8,cap=red)
                art.tube(at(drive,side*12.3,.12),.068,.058,3.1,postmetal,postmetal,6);art.box(at(drive,side*12.3,2.85),(1.13,.10,.83),h,white)
                for n in range(12):
                    a=n*math.tau/12;b=(n+1)*math.tau/12
                    beam(art,at(drive+.24*math.cos(a),side*12.3+.28+.24*math.sin(a),2.94),at(drive+.24*math.cos(b),side*12.3+.28+.24*math.sin(b),2.94),.03,red)
        if j%19==0:
            at,h=site(k,d,-4.99);sign(at,0,j//19%2,.94,1.56)
    at,h=site(k,6340,-6.8);sign(at,0,0,1.03,1.51)
    for j in range(64):
        a=math.tau*j/64;b=math.tau*(j+1)/64;u=j%16/16;v=u+1/16
        if j//16%2:u,v=1-u,1-v
        def rim(t,z):return 3120+5900*math.cos(t),6100*math.sin(t),z
        for base,top,t0,t1 in ((-930,2150,0,1),(2150,13500,.999,1)):
            picture(dawn,(rim(a,base),rim(b,base),rim(b,top),rim(a,top)),((u,t0),(v,t0),(v,t1),(u,t1)))
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':4.3,'terrain':{'sea':False},'land':{'mid':0x7A8852},'sky':[0xEFC6AE,0xEBBCA9,0xD6BEC3,0xC0C6D4,0xA8BDCE],'haze':0xD8C0AE,'light':[0xFFD2A1,1.46],'fill':[0xD0D7DF,0xA39975],'sun_altitude':.26,'sun_azimuth':-1.28}
