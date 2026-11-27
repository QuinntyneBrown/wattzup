"""The terraced lanes and white limestone domes of the butte of Montmartre."""
import math
from bondi import beam
from iten_landmarks import pictured, picture, site
from worldkit import Painted, lin

UV=((0,0),(1,0),(1,1),(0,1))


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    grades={'warm-up':3,'work':8,'recover':4,'cool-down':2,'steady':5}
    x=y=0;z=61;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;stage=next((s for s in stages if d<s['to']),stages[-1])
        grade=grades[stage['kind']]+1.6*math.sin(d/42)
        def heading(v):return -math.radians(30)*math.sin(v/60)*math.cos(v/162+1)
        h=heading(d); rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=grade))
        h=heading(d+bc.STEP*.5);x+=bc.STEP*math.cos(h);y+=bc.STEP*math.sin(h);z+=bc.STEP*grade/100
    return rows,stages,length,mean,.08


def road(r,st,length,col,bc):
    b=bc.Builder('ParisPaves','terrain');b.colours=[]
    for i,p in enumerate(r.s[:-1]):
        for l,h,z,c in ((-8,8,.007,0xABA49A),(-4.1,4.1,.026,0x938C83),(-4.25,-4.05,.08,0xBDB4A5),(4.05,4.25,.08,0xBDB4A5)):
            b.quad(r.at(i,l,z),r.at(i+1,l,z),r.at(i+1,h,z),r.at(i,h,z));b.colours.extend([lin(c)]*4)
    b.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('Butte','terrain');b.colours=[]
    for i in range(0,len(r.s)-3,3):
        for x,y in ((-360,-60),(-60,-12),(-12,12),(12,60),(60,360)):
            def point(j,u):
                p=r.s[j];x,y,z=r.at(j,u);blend=min(1,max(0,(abs(u)-12)/45))
                return (x+(p['x']-x)*blend,y+(p['y']+u-y)*blend,z-.17+max(0,abs(u)-12)*(.16 if u<0 else -.13))
            b.quad(point(i,x),point(i+3,x),point(i+3,y),point(i,y));b.colours.extend([lin(0x968D77)]*4)
    b.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));return r.s[i]['z']-.13
    return None,sample


def scenery(k):
    art=Painted(k);faces=pictured(k,'ParisFronts');leaves=pictured(k,'PlaneTrees');church=pictured(k,'BasilicaFront');paint=pictured(k,'ButtePaint');sign=pictured(k,'MetroSign')
    stone=lin(0xC5B9A6);iron=lin(0x354C40);red=lin(0xA74537);green=lin(0x376549);cream=lin(0xE2CFAE)
    def house(d,off,w,high,tile):
        a,h=site(k,d,off);side=1 if off>0 else -1
        art.box(a(0,side*3.55,0),(w,7,high),h,cream)
        art.roof(a(0,side*3.55,high),w+.4,7.45,2,h,lin(0x646873))
        u=tile%2*.5;v=(1-tile//2)*.5
        picture(faces,(a(-side*w/2,0,0),a(side*w/2,0,0),a(side*w/2,0,high),a(-side*w/2,0,high)),((u,v),(u+.5,v),(u+.5,v+.5),(u,v+.5)))
        # End walls remain visible on the bends. Give each a vertical bay and a limestone sill at every storey.
        for signend in (-1,1):
            end=signend*(w/2+.03);v=.006
            picture(faces,(a(end,side*.15,0),a(end,side*6.95,0),a(end,side*6.95,high),a(end,side*.15,high)),((.52,.01),(.81,.01),(.81,.49),(.52,.49)))
            for floor in range(3,int(high),3):
                art.box(a(signend*(w/2+.07),side*3.5,floor),(.16,7.03,.12),h,stone)
    for d in range(-44,8540,16):
        for side in (-1,1):
            if any(abs(d-m)<55 for m in (112,1610,2940,4408,6050,7965)):continue
            house(d,side*k.rng.uniform(8.5,12.6),k.rng.uniform(12.5,15.8),k.rng.uniform(6.1,12),3)
        if d%32==-44%32:
            house(d+7,-26,15.2,k.rng.uniform(10,16),3)
            house(d-5,28,16,k.rng.uniform(9,14),3)
        if d%32==-44%32:
            a,h=site(k,d,6.7)
            art.tube(a(0,0,0),.13,.067,3.55,iron,iron,8,iron)
            art.tube(a(0,0,3.55),.19,.33,.48,cream,cream,4,cream)
            art.tube(a(0,0,4.03),.35,.025,.22,iron,iron,4,iron)
        if d%48==-44%48:
            a,h=site(k,d,-13.4)
            for angle in (.22,1.79):
                x=3.6*math.cos(angle);y=3.6*math.sin(angle)
                picture(leaves,(a(-x,-y,0),a(x,y,0),a(x,y,9.7),a(-x,-y,9.7)),UV)
    for d,off,w,high,tile in ((112,-9,11.5,9.7,0),(1610,-8,12.5,7.5,1),(2940,10,15,7,2),(4408,-19,15,10,0)):house(d,off,w,high,tile)
    for start,side,col in ((110,-1,red),(1610,-1,green),(4388,-1,red),(4420,-1,green)):
        a,h=site(k,start,side*8)
        art.face((a(-5.5,0,3.2),a(5.5,0,3.2),a(5.5,-side*1.9,2.62),a(-5.5,-side*1.9,2.62)),(col,)*4)
        for j in (-4,0,4):
            p=a(j,-side,0);art.tube(p,.08,.07,.81,iron,iron,8,iron)
            art.tube(a(j,-side,.81),.51,.51,.07,cream,cream,14,cream)
            for v in (-1,1):
                art.tube(a(j+.17,v*.68-side,0),.17,.23,.48,stone,stone,8,stone)
                art.box(a(j+.17,v*.86-side,.47),(.40,.08,.36),h,stone)
    for d in range(60,8370,7):
        if min(abs(d-m) for m in (100,1610,2940,4408,6050))<64:
            for s in (-1,1):
                a,h=site(k,d,s*4.57)
                art.tube(a(0,0,.11),.115,.096,.72,iron,iron,8,iron)
                art.tube(a(0,0,.83),.11,.062,.09,iron,iron,8,iron)
    for d in range(2900,2990,3):
        a,h=site(k,d,8.65)
        for j in range(3):
            art.tube(a(0,.10*j,.34*j),.72,.46,.55,green,lin(0x81905B),7,green)
    for d in range(2800,3070,4):
        a,h=site(k,d,-8);art.box(a(0,-.5,-.15),(4.15,1.0,1.38),h,stone)
        for row in range(3):
            p=a(0,-3-row*2,1+row*.30);art.tube(p,.085,.06,1.35,iron,iron,5,iron)
            art.box(a(0,-3-row*2,1.72+row*.30),(3.7,.79,.59),h,green)
    for d in range(2920,2967):
        a,h=site(k,d,7.2);art.box(a(0,0,0),(.68,.12,1.12),h,green)
    for d in (6058,6063):
        a,h=site(k,d,7.3)
        for off in (-.82,.82):
            art.tube(a(0,off,0),.11,.075,2.57,iron,iron,8,iron)
            beam(art,a(0,off,2.4),a(-.31,off*1.4,2.95),.08,.08,green)
            art.tube(a(-.31,off*1.4,2.94),.14,.075,.29,red,red,8,red)
        picture(sign,(a(0,1,2.05),a(0,-1,2.05),a(0,-1,2.52),a(0,1,2.52)),UV)
    for d in range(5985,6105):
        a,h=site(k,d,-8);art.box(a(0,0,-.2),(1.07,3.5,.25+(d%10)*.12),h,stone)
        if d%4==0:
            e,_=site(k,d+4,-8)
            for v in (-1.6,1.6):
                art.tube(a(0,v,0),.055,.055,1.7,iron,iron,6,iron)
                beam(art,a(0,v,1.7),e(0,v,1.7),.07,.07,iron)
    for d in (6025,6065):
        i=k.road.index(d);u=0 if d==6025 else .5
        picture(paint,(k.road.at(i,-1.8,.046),k.road.at(i,1.8,.046),k.road.at(i+2,1.8,.046),k.road.at(i+2,-1.8,.046)),((u,0),(u+.5,0),(u+.5,1),(u,1)))
    a,h=site(k,7970,-22)
    picture(church,(a(0,22,.1),a(0,-22,.1),a(0,-22,43),a(0,22,43)),UV)
    for u,v,r,high in ((12,0,7.6,26),(7,-12,4.1,18),(7,12,4.1,18),(21,-10,4.4,17),(21,10,4.4,17)):
        art.tube(a(u,v,.15),r,r,high,cream,cream,16,cream)
        for j in range(8):
            radius=lambda n:r*max(.036,math.cos(n*math.pi/16))
            art.tube(a(u,v,high+j*r*.155),radius(j),radius(j+1),r*.155,cream,cream,16,cream)
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':4.05,'land':{'mid':0xAD9B77},'sky':[0xF2DAB9,0xE5CEAF,0xC6D0CB,0xA6BFC5,0x82ADC3],'haze':0xD5C9B3,'light':[0xFFDAA0,2.10],'fill':[0xD3E0E6,0xA48A72],'sun_radius':12,'sun_altitude':.34,'sun_azimuth':.74}
