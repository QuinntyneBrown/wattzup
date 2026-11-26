"""Chemin des Chapelles, its Walloon village and the wall above the Meuse."""
import math
from bondi import beam
from iten_landmarks import picture, pictured, site
from worldkit import Painted, lin, smooth

UV = ((0,0),(1,0),(1,1),(0,1))


def route(course, theme, bc):
    stages = bc.stages(course['plan'])
    length = stages[-1]['to']
    rows = []
    x, y, z = 0, 0, 78
    def heading(d):
        return math.radians(45)*math.sin(d/55)*(.59+.41*math.cos((d-4810)/660))
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d = i*bc.STEP-bc.LEAD_IN
        stage = next((s for s in stages if d<s['to']), stages[-1])
        steep = .12 + .14*math.exp(-((d-4810)/83)**4)
        grade = steep if stage['level']>=21 else (.042 if stage['kind']=='warm-up' else -.049)
        if stage['kind']=='cool-down': grade=.024
        if d<0 or d>=length: grade=0
        h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=grade*100))
        x+=bc.STEP*math.cos(heading(d+bc.STEP*.5))
        y+=bc.STEP*math.sin(heading(d+bc.STEP*.5))
        z+=bc.STEP*grade
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    return rows, stages, length, mean, .05


def road(r, st, length, col, bc):
    b=bc.Builder('HuyTarmac','terrain');b.colours=[];b.uvs=[]
    for i,p in enumerate(r.s[:-1]):
        for a,e,z,c in ((-3.5,3.5,.005,0x948B77),(-3.06,3.06,.035,0xCACCD0)):
            b.quad(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,e,z),r.at(i,e,z))
            b.colours.extend([lin(c)]*4)
            b.uvs.extend(((a/4,p['d']/4),(a/4,r.s[i+1]['d']/4),(e/4,r.s[i+1]['d']/4),(e/4,p['d']/4)))
    b.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('Meuse hills','terrain');b.colours=[]
    offsets=(-490,-160,-57,-21,-8,-3.4,3.4,8,21,57,160,490)
    def pt(i,off):
        p=r.s[i];x,y,z=r.at(i,off);t=smooth(9,51,abs(off))
        x+=(p['x']-x)*t;y+=(p['y']+off-y)*t
        edge=max(0,abs(off)-5)
        z+=(-.48 if off>0 else .15)*edge+smooth(8,50,edge)*5*math.sin(p['d']/100+off*.035)
        return x,y,z-.23
    for i in range(0,len(r.s)-3,3):
        for a,e in zip(offsets,offsets[1:]):
            face=(pt(i,a),pt(i+3,a),pt(i+3,e),pt(i,e));b.quad(*face)
            for x,y,z in face:
                v=int(8*math.sin(x*.024+y*.018)+6*math.cos(y*.054))
                b.colours.append(lin((98+v)<<16|(127+v)<<8|(69+v)))
    b.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));return r.s[i]['z']-.23
    return None,sample


def scenery(k):
    art=Painted(k)
    walls=pictured(k,'HuyFacades');trees=pictured(k,'HuyLeaves')
    paint=pictured(k,'HuyLettering');fans=pictured(k,'HuySupporters');valley=pictured(k,'MeuseValley')
    slate=lin(0x555862);stone=lin(0xAAA69B);ivory=lin(0xE4E0CF);steel=lin(0xA4ADAE)
    def tile(mesh,points,col,row):
        u,v=col*.5,row*.5
        picture(mesh,points,((u+.002,v+.002),(u+.498,v+.002),(u+.498,v+.498),(u+.002,v+.498)))
    def shrine(d,side):
        a,h=site(k,d,side*5.35)
        art.box(a(0,0,-.28),(2.65,2.05,.62),h,stone)
        art.box(a(0,0,.34),(2.22,1.75,2.56),h,ivory)
        art.roof(a(0,0,2.88),2.3,1.88,1.24,h+math.pi/2,slate)
        art.box(a(0,0,3.96),(.13,.13,.88),h,slate);art.box(a(0,0,4.52),(.60,.13,.11),h,slate)
        y=-side*.89
        # The original atlas includes the niche and figure inside the whitewashed opening.
        picture(walls,(a(-1.08,y,.32),a(1.08,y,.32),a(1.08,y,2.94),a(-1.08,y,2.94)),((.13,.545),(.363,.545),(.363,.856),(.13,.856)))
    for d in (360,1260,2371,3625,4843,6346,8105,9204,10546):shrine(d,1 if d in (2371,4843,9204) else -1)
    for start,count in ((-36,27),(1210,8),(3160,7),(5990,9),(10455,7)):
        for n in range(count):
            for side in (-1,1):
                d=start+n*8.4+(side+1)*2.7;a,h=site(k,d,side*8.8)
                height=5.7+k.rng.random()*1.7
                art.box(a(0,0,-1.1),(8.1,6.5,height+1.1),h,lin(k.rng.choice((0x9F6F57,0xB28F79,0x928E84))))
                art.roof(a(0,0,height),8.18,6.52,2.5,h,slate)
                art.box(a(1.8,1.1,height+1.2),(.69,.7,2.44),h,lin(0x924E3A))
                y=-side*3.27
                tile(walls,(a(-4,y,-.25),a(4,y,-.25),a(4,y,height),a(-4,y,height)),int(n%3!=0),int(n%3!=0))
    for d in range(250,11210,16):
        for side in (-1,1):
            if 6420<d<6780 and side==1:continue
            off=k.rng.uniform(6.1,18);a,_=site(k,d+k.rng.uniform(-5,5),off*side)
            size=k.rng.uniform(4.3,6.5);high=k.rng.uniform(8,15);bottom=-max(0,off-5)*(.48 if side==1 else -.15)
            u=k.rng.randrange(3)/3
            for angle in (.24,1.80):
                x=size*math.cos(angle);y=size*math.sin(angle)
                picture(trees,(a(-x,-y,bottom),a(x,y,bottom),a(x,y,bottom+high),a(-x,-y,bottom+high)),((u+.002,0),(u+.331,0),(u+.331,1),(u+.002,1)))
    for begin,end in ((2280,2410),(4680,5020),(8680,8890),(10770,10972)):
        for d in range(begin,end,3):
            for side in (-1,1):
                a,h=site(k,d,side*3.65);e,_=site(k,d+3,side*3.65)
                for z in (.23,1.08):beam(art,a(0,0,z),e(0,0,z),.044,.054,steel)
                for j in range(5):
                    p,jh=site(k,d+j*.6,side*3.65);art.box(p(0,0,.06),(.037,.044,1.02),jh,steel)
                u=k.rng.randrange(4)/4
                picture(fans,(a(-1.65,side*.7,.02),a(1.65,side*.7,.02),a(1.65,side*.7,2.04),a(-1.65,side*.7,2.04)),((u+.002,0),(u+.248,0),(u+.248,1),(u+.002,1)))
    for j,d in enumerate((65,89,1270,2328,2353,4787,4815,4841,6493,8805,10821)):
        v=j%3/3
        picture(paint,tuple(k.road.pos(d+s,l,.075) for s,l in ((0,-1.8),(0,1.8),(2.85,1.8),(2.85,-1.8))),((0,v),(1,v),(1,v+1/3),(0,v+1/3)))
    a,h=site(k,6665,175)
    picture(valley,(a(-269,69,-99),a(269,-69,-99),a(269,-69,49),a(-269,69,49)),UV)
    a,h=site(k,10855,-13)
    art.box(a(0,0,-.85),(22,9,8.8),h,stone);art.roof(a(0,0,7.92),22,9,4.2,h,slate)
    art.box(a(-9.1,0,6.7),(4.5,4.6,7.3),h,stone)
    art.tube(a(-9.1,0,14),3.58,.1,7.8,slate,slate,4)
    for j in range(5):art.box(a(-6+j*3.6,4.53,2.5),(1.3,.12,4.41),h,lin(0x475461))
    for x in (-9.6,-5.4,-1.2,3,7.2,10.3):
        art.box(a(x,4.79,-.4),(.64,.8,6.2),h,stone)
        art.roof(a(x,4.79,5.8),.72,.88,.58,h,slate)
    for side in (-1,1):
        for n in range(3):
            art.box(a(-10.2+n*1.05,side*2.32,9.55),(.70,.13,2.5),h,lin(0x484B4C))
    art.tube(a(-9.1,0,21.1),.09,.055,1.75,slate,slate,8)
    art.box(a(-9.1,0,22.2),(.8,.08,.08),h,slate)
    a,h=site(k,10855)
    for side in (-1,1):
        for x in (-.38,.38):art.box(a(x,side*3.72,-.25),(.11,.11,5.5),h,steel)
        for j in range(6):beam(art,a(-.38,side*3.72,j*.83),a(.38,side*3.72,(j+1)*.83),.065,.065,steel)
    art.box(a(0,0,4.71),(.79,8.2,1.02),h,lin(0xE5C043))
    return {'efforts':0}

THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':3.06,'land':{'mid':0x718C50},'sky':[0xE3DFCE,0xDDE4DE,0xC9D8DC,0xA9C8D5,0x8BB6CF],'haze':0xC3CCBD,'light':[0xFFF0D0,2.15],'fill':[0xDDE9EB,0xBBC49E],'sun_radius':9,'sun_altitude':.56,'sun_azimuth':.94}
