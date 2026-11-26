"""Golden-hour ridge ride on Mulholland Drive, with the Valley and the LA basin below."""
import math
from bondi import beam
from iten_landmarks import picture,pictured,site
from worldkit import Painted,lin,smooth
UV=((0,0),(1,0),(1,1),(0,1))


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    def height(d):
        d=max(0,min(length,d));stage=sum((s['level']-mean)*max(0,min(d,s['to'])-s['from']) for s in stages)
        return 291+30*math.sin(d/790)+21*math.sin(d/487)+17*math.sin(d/2440)+stage*.0021
    def heading(d):return -math.radians(35)*math.sin(d/70)*math.cos(d/189+1)
    rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d);z=height(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=100*(height(d+bc.STEP)-z)/bc.STEP))
        h=heading(d+bc.STEP*.5);x+=bc.STEP*math.cos(h);y+=bc.STEP*math.sin(h)
    return rows,stages,length,mean,.05


def road(r,st,length,col,bc):
    b=bc.Builder('RidgePavement','terrain');b.colours=[]
    for i,p in enumerate(r.s[:-1]):
        for a,e,z,c in ((-5.6,5.6,.004,0xB49A72),(-4.27,4.27,.025,0x5B5856),(-.17,-.055,.037,0xE1AA43),(.055,.17,.037,0xE1AA43),(-4.12,-4.03,.037,0xD4C7AB),(4.03,4.12,.037,0xD4C7AB)):
            b.quad(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,e,z),r.at(i,e,z));b.colours.extend([lin(c)]*4)
    b.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('Chaparral slopes','terrain');b.colours=[];offsets=(-480,-240,-112,-55,-28,-11,-5.4,5.4,11,28,55,112,240,480)
    def pt(i,off):
        p=r.s[i];x,y,z=r.at(i,off);blend=smooth(12,78,abs(off));x+=(p['x']-x)*blend;y+=(p['y']+off-y)*blend
        k=max(0,abs(off)-5.4);z-=k*(.44+.13*math.cos(p['d']/602+off*.003));z+=smooth(7,38,k)*(5*math.sin(off*.041+p['d']/94)+3*math.cos(off*.073));return x,y,z-.17
    for i in range(0,len(r.s)-3,3):
        for a,e in zip(offsets,offsets[1:]):
            face=(pt(i,a),pt(i+3,a),pt(i+3,e),pt(i,e));b.quad(*face)
            for x,y,z in face:
                t=math.sin(x*.027+y*.042)+math.cos(y*.057+x*.009)
                c=(int(163+t*15),int(147+t*13),int(104+t*11));b.colours.append(lin(c[0]<<16|c[1]<<8|c[2]))
    b.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));return r.s[i]['z']-.17
    return None,sample


def scenery(k):
    art=Painted(k);flora=pictured(k,'CanyonPlants');basin=pictured(k,'LosAngelesBasin');valley=pictured(k,'ValleyGrid');letters=pictured(k,'MountLeeLetters');signs=pictured(k,'MulhollandSigns')
    steel=lin(0xADB3AF);timber=lin(0x896C51);earth=lin(0xB8976A);cream=lin(0xDDCDB7);dark=lin(0x42484A);glass=lin(0x70837F)
    def plant(d,off,n,r,high):
        a,h=site(k,d,off);foot=-max(0,abs(off)-5.5)*.42-.25
        for angle in (.25,1.78):
            dx=r*math.cos(angle);dy=r*math.sin(angle);u=n/3
            picture(flora,(a(-dx,-dy,foot),a(dx,dy,foot),a(dx,dy,foot+high),a(-dx,-dy,foot+high)),((u+.002,0),(u+1/3-.002,0),(u+1/3-.002,1),(u+.002,1)))
    for d in range(-46,17212,11):
        for side in (-1,1):
            if not((side==1 and (2570<d<2780 or 8120<d<8450 or 16300<d<16630)) or (side==-1 and 11950<d<12270)):
                for j in range(2):plant(d+k.rng.uniform(-4,4),side*k.rng.uniform(7+8*j,13+17*j),2,k.rng.uniform(1.1,2.8),k.rng.uniform(.75,2.65))
                if d%55==-46%55:plant(d,side*k.rng.uniform(9,17),k.rng.choice((0,1)),k.rng.uniform(2.7,4.5),k.rng.uniform(8,14))
        if d%44==-46%44:
            a,h=site(k,d,-6.8);e,_=site(k,d+44,-6.8)
            art.tube(a(0,0,-.55),.21,.13,7.8,timber,timber,9,timber);art.box(a(0,0,6.95),(.16,2.36,.18),h,timber)
            for off in (-.91,0,.91):
                end=e(0,off,7.18);start=a(0,off,7.18);mid=tuple((v+w)*.5 for v,w in zip(start,end));sag=(mid[0],mid[1],mid[2]-.65)
                beam(art,start,sag,.031,.031,dark);beam(art,sag,end,.031,.031,dark)
        if any(abs(d-n)<130 for n in (105,2660,8310,12100,16460)):
            a,h=site(k,d,5.9);e,_=site(k,d+11,5.9)
            art.box(a(0,0,-.19),(.17,.23,1.12),h,steel);beam(art,a(0,0,.73),e(0,0,.73),.17,.23,steel)
    for d,n in ((112,0),(2662,1),(5225,0),(8304,1),(12088,2),(16452,3)):
        a,h=site(k,d,-5.45);art.box(a(0,0,-.05),(.13,.13,2.35),h,steel)
        u=n%2*.5;v=(1-n//2)*.5
        picture(signs,(a(0,.62,1.36),a(0,-.62,1.36),a(0,-.62,2.57),a(0,.62,2.57)),((u,v),(u+.5,v),(u+.5,v+.5),(u,v+.5)))
    for d in (410,1480,2810,4150,5225,5270,6090,9205,10710,13040,14400,15870):
        a,h=site(k,d,-13.7)
        for u in (-6,0,6):
            for v in (-4,3):art.box(a(u,v,-6.4),(.36,.36,6.55),h,dark)
        art.box(a(0,0,-.1),(15.4,8.7,.44),h,cream);art.box(a(0,-.6,.34),(14.5,7.2,3.62),h,cream)
        art.box(a(0,3.06,.7),(12.9,.12,2.68),h,glass)
        for u in range(-6,7,2):art.box(a(u,3.17,.65),(.15,.16,2.79),h,cream)
        art.box(a(1.7,-1.1,3.96),(9.9,5.8,2.76),h,cream);art.box(a(1.7,1.87,4.22),(8.7,.13,1.89),h,glass)
        art.box(a(0,0,3.84),(15.6,8.6,.24),h,dark)
        for u in (-4,-2,0,2,4):art.box(a(u,6.53,-.1),(.12,.16,1.68),h,dark)
    for d,side,plate in ((2660,1,basin),(12087,-1,valley),(16455,1,basin)):
        a,h=site(k,d+100,side*172)
        picture(plate,(a(-126,side*51,-74),a(126,-side*51,-74),a(126,-side*51,13),a(-126,side*51,13)),UV)
        a,h=site(k,d+6,side*10.2);art.box(a(0,0,-2.6),(25,9.4,2.67),h,earth)
        for u in range(-12,13,3):art.box(a(u,side*4.42,.01),(.15,.15,1.15),h,steel)
        beam(art,a(-12,side*4.42,1.08),a(12,side*4.42,1.08),.105,.105,steel)
        art.tube(a(1,side*3.47,.06),.15,.12,1.43,dark,dark,10,dark);beam(art,a(1,side*3.09,1.48),a(1,side*3.84,1.64),.22,.24,steel)
    a,h=site(k,8365,117);base=a;a=lambda x,y,z=0:base(x*.78+y*.63,-x*.63+y*.78,z)
    mound=lin(0x8E805A)
    for j in range(-7,8):
        high=20+8*math.cos(j*.2);art.tube(a(j*9,2,-37),15,9,high+37,mound,lin(0xADA17C),10,mound)
    for i in range(9):
        u=(i-4)*7.05;height=15.7+2*math.cos((i-4)*.45);v=-16.6
        picture(letters,(a(u-3.35,v,height),a(u+3.35,v,height),a(u+3.35,v,height+8.3),a(u-3.35,v,height+8.3)),((i/9,0),((i+1)/9,0),((i+1)/9,1),(i/9,1)))
    art.tube(a(5,2,26),.48,.12,12,steel,steel,8,steel)
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':4.27,'land':{'mid':0xAB956B},'sky':[0xE5C4A3,0xDBCAB4,0xBECDD0,0x9CBAC8,0x79A8C2],'haze':0xCCB9A9,'light':[0xFFDB9B,2.04],'fill':[0xD7DFE5,0xAF9272],'sun_radius':12,'sun_altitude':.26,'sun_azimuth':.62}
