"""Ocean Front Walk and the separate Marvin Braude cycle path."""
import math
from arenberg import beam
from iten_landmarks import pictured,picture,site
from worldkit import Painted,lin

PROFILE=[[0, 4], [1350, 5], [2720, 4], [3820, 6], [5110, 4], [6200, 5], [6950, 4]]
def elev(d):
    for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(y-z)*max(0,(d-a)/(b-a))
    return PROFILE[-1][1]
def heading(d):
    return .07*math.sin(d/260)+.16*math.sin(d/91)*math.exp(-((d-2680)/510)**2)
def route(course,theme,bc):
    st=bc.stages(course['plan']);length=st[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d);rows.append(dict(d=d,x=x,y=y,z=elev(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(elev(d+.5)-elev(d-.5))))
        x+=bc.STEP*math.cos(heading(d+bc.STEP/2));y+=bc.STEP*math.sin(heading(d+bc.STEP/2))
    return rows,st,length,sum(s['level']*(s['to']-s['from']) for s in st)/length,1

def road(r,st,length,col,bc):
    m=bc.Builder('BraudeConcrete','terrain');m.colours=[];m.uvs=[]
    for i in range(len(r.s)-1):
        for lo,hi in ((-2.8,2.8),(-18,-5.2)):
            pts=[r.at(n,v,.05) for n,v in ((i,lo),(i+1,lo),(i+1,hi),(i,hi))]
            picture(m,pts,[(x/6,y/6) for x,y,z in pts])
    m.build(col)

def land(r,col,theme,bc):
    m=bc.Builder('VeniceSand','terrain');m.colours=[];m.uvs=[];last=None
    for i in range(0,len(r.s),3):
        d=r.s[i]['d'];row=[]
        for v in (-200,-30,-18,-4,3,14,40,82,100,122,160,230):
            x,y,z=r.at(i,v);z-=.14+max(0,v-13)*.030
            row.append((x,y,z))
        if last:
            for a,b,c,e in zip(last,last[1:],row[1:],row):
                pts=(a,e,c,b);picture(m,pts,[(x/6,y/6) for x,y,z in pts])
        last=row
    return m.build(col),lambda x,y:elev(r.s[r.tree.find((x,y,0))[1]]['d'])-.15

def scenery(k):
    art=Painted(k);shops=pictured(k,'WalkShops');palms=pictured(k,'FanPalms')
    walls=pictured(k,'VeniceMurals');players=pictured(k,'BeachPerformers');coast=pictured(k,'SantaMonicaBay')
    ocean=pictured(k,'BeachSurf')
    white,iron,wood,teal,skin,concrete,ochre,gymblue=map(lin,(0xEBDCBE,0x555858,0x846247,0x5897AD,0xAC7659,0xA3A19B,0xB89A71,0x748F9B))
    def panel(m,pts,lo,hi):picture(m,pts,((lo,0),(hi,0),(hi,1),(lo,1)))
    for j,d in enumerate(range(-40,7000,10)):
        at,h=site(k,d)
        pts=[k.road.pos(d+x,v,.073) for x,v in ((-1.6,-.071),(1.6,-.071),(1.6,.071),(-1.6,.071))]
        art.face(pts,(lin(0xE6B85B),)*4)
        for lo,hi in ((-18,-5.2),(-2.8,2.8)):
            pts=[k.road.pos(d+x,v,.068) for x,v in ((-.025,lo),(.025,lo),(.025,hi),(-.025,hi))]
            art.face(pts,(lin(0x8F8B83),)*4)
        if j%3==0:
            for side in (-1,1):
                off=(-4.2 if side<0 else k.rng.uniform(5.6,15))
                at,h=site(k,d,off);high=k.rng.uniform(12,21);w=high*.32;idx=(j//3+side)%3
                panel(palms,[at(0,v,z) for v,z in ((w/2,0),(-w/2,0),(-w/2,high),(w/2,high))],idx/3,(idx+1)/3)
        if j%2==0 and d<4850:
            idx=(j//2)%4;at,h=site(k,d,-20);width=19.7;high=(5.6,7.3,5.1,6.4)[idx]
            art.box(at(0,-4.2,-.2),(width,8.3,high-.4),h,(teal,ochre,white,wood)[idx])
            panel(shops,[at(x,0,z) for x,z in ((-width/2,0),(width/2,0),(width/2,high),(-width/2,high))],(idx+1)*.25,idx*.25)
            # Wrap the corners of the arcades so the rider sees the shops on approach.
            panel(shops,[at(-width/2-.03,v,z) for v,z in ((-8,0),(0,0),(0,high-.55),(-8,high-.55))],idx*.25,(idx+1)*.25)
            for n in range(3):
                dv=-13+n*.9+(j%4)*.6;cx=j%3+n*2;idx2=(j+n)%4
                panel(players,[at(cx+x,dv+20,z) for x,z in ((-1.04,0),(1.04,0),(1.04,1.94),(-1.04,1.94))],idx2/4,(idx2+1)/4)
            if j%6==0:
                art.box(at(2,1.8,-.15),(2.7,.9,1.05),h,wood)
                for q in range(5):art.box(at(.9+q*.5,1.8,.92),(.33,.66,.18),h,(teal,white,ochre)[q%3])
        if j%7==0 and d<5550:
            at,h=site(k,d,-8-(j%4));idx=j%4;w=2.15
            panel(players,[at(0,v,z) for v,z in ((w/2,0),(-w/2,0),(-w/2,2.05),(w/2,2.05))],idx*.25,(idx+1)*.25)
    at,h=site(k,175,16)
    art.box(at(0,0,-.2),(34,15,.25),h,gymblue)
    for j in range(-17,18,2):
        for v in (-7.5,7.5):
            beam(art,at(j,v,0),at(j,v,2.25),.067,iron)
            if j<16:
                beam(art,at(j,v,2.18),at(j+2,v,2.18),.052,iron)
                for z in (.45,.95,1.45):beam(art,at(j,v,z),at(j+2,v,z+.45),.021,iron)
    for j in range(-13,15,6):
        for v in (-2,2):beam(art,at(j,v,.1),at(j,v,3),.12,iron)
        beam(art,at(j,-2,3),at(j,2,3),.10,iron)
        art.box(at(j+1.5,0,.35),(2.4,.65,.39),h,iron)
        beam(art,at(j+1,-1.4,1.3),at(j+1,1.4,1.3),.08,iron)
        for v in (-.96,.96):art.tube(at(j+1,v,.95),.4,.4,.25,iron,iron,10)
    for j,(x,v) in enumerate(((-9,-2),(-5,2),(1,-2),(8,2),(12,0))):
        # Lifters and spotters, with a barbell above the bench.
        at,h=site(k,175+x,16+v)
        col=lin((0x44658C,0x923D37,0x347566)[j%3])
        art.tube(at(0,0,.88),.2,.31,.58,col,col,8)
        art.tube(at(0,0,1.45),.14,.13,.25,skin,skin,8,cap=skin)
        for side in (-1,1):
            beam(art,at(0,side*.14,.9),at(.16,side*.23,.42),.13,col)
            beam(art,at(.16,side*.23,.42),at(0,side*.24,.05),.1,skin)
            beam(art,at(0,side*.24,1.4),at(.25,side*.39,1.12),.09,skin)
            beam(art,at(.25,side*.39,1.12),at(.38,side*.41,1.43),.075,skin)
        beam(art,at(.38,-.65,1.43),at(.38,.65,1.43),.052,iron)
    signage=pictured(k,'BeachSigns')
    for station,lane,index,wide in ((164,8.6,0,4.3),(2659,5.7,1,3.6),(3821,6.8,2,2.9),(5138,23,3,3.9)):
        at,h=site(k,station,lane)
        for v in (-wide*.44,wide*.44):beam(art,at(0,v,0),at(0,v,2.78),.08,iron)
        panel(signage,[at(0,v,z) for v,z in ((wide/2,1.72),(-wide/2,1.72),(-wide/2,2.78),(wide/2,2.78))],index/4,(index+1)/4)
    # Intersecting concrete bowls with swept coping stand on a shared deck.
    for d,v,sx,sy in ((2665,15,13,7.5),(2692,23,15,9),(2720,14,10,6),(2750,21,12,8)):
        at,h=site(k,d,v);rings=[]
        for rad,z in ((.02,.12),(.43,.19),(.70,.6),(.88,1.45),(1,2.26),(1.27,2.27)):
            rings.append([at(sx*rad*math.cos(j*math.tau/44),sy*rad*math.sin(j*math.tau/44),z) for j in range(44)])
        for a,b in zip(rings,rings[1:]):
            for j in range(44):
                n=(j+1)%44;art.face((a[j],b[j],b[n],a[n]),(concrete,white,white,concrete))
        for j in range(44):beam(art,rings[-2][j],rings[-2][(j+1)%44],.083,iron)
        for j in range(44):
            a,b=rings[-1][j],rings[-1][(j+1)%44];art.face((a,b,(b[0],b[1],b[2]-2.5),(a[0],a[1],a[2]-2.5)),(concrete,concrete,ochre,ochre))
    for j,d in enumerate((3829,3848,3859,3873)):
        at,h=site(k,d,8+j%2*5);w=(12,6,9,12)[j];high=(3.3,2.7,3.7,2.8)[j]
        art.box(at(0,0,-.1),(w,.42,high),h,concrete)
        panel(walls,[at(x,-.23,z) for x,z in ((-w/2,0),(w/2,0),(w/2,high),(-w/2,high))],j%3/3,(j%3+1)/3)
    for j,d in enumerate((520,1450,2950,4210,5143,6020)):
        at,h=site(k,d,28);floor=2.75
        for x in (-2.4,2.4):
            for v in (-1.6,1.6):beam(art,at(x,v,-1),at(x,v,floor),.20,wood)
        art.box(at(0,0,floor),(6.4,4.5,.31),h,teal)
        art.box(at(-.3,.4,floor+.31),(4.2,3.6,2.05),h,lin(0x80B6D0))
        art.box(at(-.3,-1.42,floor+1),(3.55,.10,1),h,lin(0x52788C))
        art.roof(at(-.3,.4,floor+2.35),5,4.1,.75,h,white)
        pts=[at(x,v,z) for x,v,z in ((3,-1.6,3),(3,-.4,3),(11,-.4,-.5),(11,-1.6,-.5))];art.face(pts,(teal,)*4)
        art.box(at(-.35,-2.15,floor+.64),(5.6,.09,.10),h,white)
        for x in (-2.9,-1.4,.2,1.7,2.4):beam(art,at(x,-2.15,floor+.3),at(x,-2.15,floor+1.36),.07,white)
        art.box(at(-.35,-2.15,floor+1.34),(5.6,.10,.10),h,white)
        for v in (-1.6,-.4):beam(art,at(3,v,3.9),at(11,v,.5),.065,white)
    at,h=site(k,6850,0)
    art.box(at(0,105,-.3),(22,175,1.2),h,wood)
    for v in range(24,194,8):
        for x in (-9,9):
            beam(art,at(x,v,-6),at(x,v,.2),.38,wood)
            beam(art,at(x,v,.8),at(x,v,2),.09,white)
            beam(art,at(x,v,2),at(x,v+8,2),.07,white)
    for j in range(34):
        u=j*1.4;at2=lambda q:at(-8+q*.21,72+q,5+3*math.sin(q/7))
        beam(art,at2(u),at2(u+1.4),.15,lin(0xC96C48))
        if j%3==0:beam(art,at2(u),at(-8+u*.21,72+u,.9),.14,lin(0xC8B35D))
    for d in range(-80,7040,18):
        pts=[k.road.pos(t,v,-max(0,v-10)*.03-.10) for t,v in ((d,101),(d+18,101),(d+18,305),(d,305))]
        picture(ocean,pts,[(x/26,y/15) for x,y,z in pts])
    for idx,d in enumerate(range(-60,6950,12)):
        for crest in (0,1):
            lane=102+crest*8+1.6*math.sin(d/57+crest)
            finish=d+6+3*math.cos(d/41)
            pts=[k.road.pos(t,v,-(v-10)*.03+.08) for t,v in ((d,lane),(finish,lane+.6),(finish,lane+1.15),(d,lane+.22))]
            art.face(pts,(lin(0xCADBD8),)*4)
    for j in range(72):
        a=j*math.tau/72;b=(j+1)*math.tau/72;u=j%18/18;v=u+1/18
        if j//18%2:u,v=1-u,1-v
        def e(t,z):return 3500+8200*math.cos(t),7600*math.sin(t),z
        panel(coast,(e(a,-2900),e(b,-2900),e(b,3600),e(a,3600)),u,v)
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':2.8,'terrain':{'sea':False},'land':{'mid':0xDFCBA8},'sky':[0xDED8CE,0xCADEEA,0xACCBDF,0x85B9D9,0x6AA6CE],'haze':0xD6D5CE,'light':[0xFFF0D6,1.48],'fill':[0xDDE7F0,0xBDAC8A],'sun_altitude':.84,'sun_azimuth':-.70}
