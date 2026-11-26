"""Ocean Drive at first light. Positive left offset is the west hotel frontage."""
import math
from worldkit import Painted,lin
from iten_landmarks import site,pictured,picture
from arenberg import beam
PROFILE=((0,26),(1275,7.154),(2125,9.8901),(2443.75,5.1786),(2800,15.9441),(3118.75,11.2326),(3475,21.998),(3793.75,17.2866),(4150,28.052),(4468.75,23.3405),(4825,34.106),(5143.75,29.3945),(5500,40.16),(5818.75,35.4485),(6175,46.214),(7025,26))

def height(d):
    if d<=0:return PROFILE[0][1]
    for (a,z),(b,h) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(h-z)*(d-a)/(b-a)
    return PROFILE[-1][1]

def heading(d):return .095*math.sin(d/405)+.08*math.cos(d/820)+.05*math.sin(d/148)

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=height(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(height(d+.5)-height(d-.5))))
        x+=bc.STEP*math.cos(heading(d+.5*bc.STEP));y+=bc.STEP*math.sin(heading(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def road(r,st,length,col,bc):
    asphalt=bc.Builder('OceanDrive','terrain');asphalt.uvs=[];asphalt.colours=[]
    kerb=bc.Builder('BeachPavement','terrain');kerb.colours=[]
    def band(i,a,b,up,tone):
        kerb.quad(r.at(i,a,up),r.at(i+1,a,up),r.at(i+1,b,up),r.at(i,b,up));kerb.colours.extend((lin(tone),)*4)
    for i,p in enumerate(r.s[:-1]):
        picture(asphalt,[r.at(i,-5.5),r.at(i+1,-5.5),r.at(i+1,5.5),r.at(i,5.5)],((0,0),(0,1),(1,1),(1,0)))
        for a,b,c in ((5.5,11.5,0xC9AB9E),(-8.2,-5.5,0xCEB1A0),(-19.5,-16.4,0xD1BCAB)):
            band(i,a,b,.14,c)
        for a in (-.13,.1):band(i,a,a+.056,.032,0xDDBA63)
        band(i,-3.38,-3.29,.032,0xE3DBBF)
        if i%4==1:band(i,3.65,3.72,.034,0xE3DBBF)
    asphalt.build(col);kerb.build(col)

def land(r,col,theme,bc):
    m=bc.Builder('BeachAndDunes','terrain');m.colours=[];last=None
    def level(d,v):
        if v>-21:return height(d)-.21
        if v>-42:return height(d)-.21+0.34*math.sin((v+21)*math.pi/21)**2
        return max(.4,height(d)-.018*(-v-42))-.26
    for i in range(0,len(r.s),3):
        d=r.s[i]['d'];line=[]
        for v,c in ((-720,0x92BAB7),(-335,0x8AAEAC),(-133,0x539DA7),(-82,0x7AB3B9),(-58,0xCBE3DA),(-55,0xBFB396),(-43,0xE5D1A5),(-31,0xDDCDA5),(-24,0xB4B37F),(-18,0xA2AA74),(-8,0x97A86F),(0,0xA7A37D),(12,0xA6A076),(72,0xA6A076)):
            x,y,_=r.at(i,v);line.append(((x,y,level(d,v)),lin(c)))
        if last:
            for a,b,c,e in zip(last,last[1:],line[1:],line):
                m.quad(a[0],e[0],c[0],b[0]);m.colours.extend((a[1],e[1],c[1],b[1]))
        last=line
    return m.build(col),lambda x,y:r.s[r.tree.find((x,y,0))[1]]['z']-.2

def scenery(k):
    art=Painted(k);front=pictured(k,'DecoHotels');palms=pictured(k,'RoyalPalms');stands=pictured(k,'LifeguardTowers')
    dawn=pictured(k,'AtlanticDawn');paint=pictured(k,'SprintPaint')
    white,teal,coral,chrome,black,yellow=map(lin,(0xEDE9D7,0x87C6C0,0xE49192,0xBCBFBB,0x3C4243,0xECCC8D))
    def tile(m,pts,t,cols,rows):
        u=t%cols/cols;v=1-(t//cols+1)/rows
        picture(m,pts,((u+.002,v+.002),(u+1/cols-.002,v+.002),(u+1/cols-.002,v+1/rows-.002),(u+.002,v+1/rows-.002)))
    # Hotels face east across the promenade. Project the main fins and cantilevered window bands.
    for i,d in enumerate(range(2,7040,24)):
        hero=next((n for n,x in enumerate((143,1367,2664)) if abs(d-x)<13),None)
        t=hero if hero is not None else (3,1,0,3,2,1,3)[i%7]
        at,h=site(k,d,19.65);w=22.7;ht=11.2+(i%3)*1.1;v=-6.08
        art.box(at(0,0,-.6),(w,12,ht+.56),h,(teal,white,yellow,coral)[t])
        tile(front,[at(a,v,z) for a,z in ((-w/2,0),(w/2,0),(w/2,ht),(-w/2,ht))],t,2,2)
        for s in (-1,1):
            a=s*(w*.5+.03);tile(front,[at(a,b,z) for b,z in ((-6,0),(6,0),(6,ht),(-6,ht))],t,2,2)
        for z in (3.4,6.25,ht-.25):
            art.box(at(0,-6.1,z),(w+.13,.85,.17),h,white)
        if hero is not None:
            art.box(at(0,-6.52,1.15),(2.41,.8,ht+1.2),h,(teal,white,teal)[hero])
            u=hero%2*.5+.25;v0=(1-hero//2)*.5
            picture(front,[at(a,-6.95,z) for a,z in ((-1.25,1.1),(1.25,1.1),(1.25,ht+2.3),(-1.25,ht+2.3))],((u-.047,v0+.05),(u+.047,v0+.05),(u+.047,v0+.497),(u-.047,v0+.497)))
        if i%3==0 or hero is not None:
            for j in (-5.9,2.8):
                a=j;v=-9.5
                art.tube(at(a,v,.14),.053,.048,2.41,chrome,chrome,7)
                art.tube(at(a,v,2.35),1.66,.14,.55,(coral,teal,yellow)[i%3],white,12)
                art.tube(at(a,v,.84),.67,.67,.09,white,white,12)
                for b in (-.88,.88):art.box(at(a+.42,v+b,.16),(.48,.46,.46),h,teal);art.box(at(a+.62,v+b,.59),(.10,.46,.48),h,white)
    # Graded writing follows both ends of each sprint stage. This retains Ocean Drive's earlier paint fix.
    for n,d in enumerate((530,1490,2510,3160,3850,4520,5280,5950,6770)):
        pts=[k.road.pos(d+a,v,.055) for a,v in ((0,1.8),(0,-1.8),(6,-1.8),(6,1.8))]
        tile(paint,pts,n%3,1,3)
    for i,d in enumerate(range(-30,7080,15)):
        if 5152<d<5178:continue
        y=-9.8-2.3*math.sin(i*.7);at,h=site(k,d,y);t=i%3;w=5.15+(i%4)*.3;ht=10.2+(i%5)*.67
        # Two crossing planes have the same silhouette; a thin native trunk anchors their base.
        for a in (.79,2.19):
            dx=w*.5*math.cos(a);dy=w*.5*math.sin(a)
            tile(palms,[at(-dx,-dy,-.15),at(dx,dy,-.15),at(dx,dy,ht),at(-dx,-dy,ht)],t,3,1)
        art.tube(at(0,0,-.18),.16,.11,ht*.57,lin(0xA19683),lin(0xACA790),8)
        if i%2==0:
            # Palm shadows from the east cross the road; their vertices follow its grade.
            at0=d
            for spread in (-1.1,-.55,0,.55,1.1):
                pts=[k.road.pos(at0+a,v,.022) for a,v in ((0,y),(.22,y),(.8+spread,4.8),(.55+spread,4.8))]
                art.face(pts,(lin(0x62645F),)*4)
    for i,d in enumerate((720,1790,3045,4054,5183,6240)):
        at,h=site(k,d,-30.8);w=8.2;ax=.47*w;v=.68*w
        tile(stands,[at(-ax,-v,-.1),at(ax,v,-.1),at(ax,v,5.5),at(-ax,-v,5.5)],i%2,2,1)
    for i,d in enumerate(range(67,6850,87)):
        at,h=site(k,d,4.42);col=(coral,teal,yellow,white)[i%4]
        art.box(at(0,0,.38),(4.75,1.82,.49),h,col);art.box(at(.21,0,.86),(2.16,1.54,.22),h,white)
        beam(art,at(-.8,-.73,.94),at(-.49,-.73,1.39),.069,chrome)
        beam(art,at(-.8,.73,.94),at(-.49,.73,1.39),.069,chrome)
        beam(art,at(-.49,-.73,1.39),at(-.49,.73,1.39),.064,chrome)
        for axle in (-1.39,1.48):
            for s in (-1,1):
                art.box(at(axle,s*.87,.12),(.55,.19,.48),h,black)
                art.box(at(axle,s*.976,.22),(.31,.03,.27),h,chrome)
    # The sun sits in one geographic place east of the road; the pan of the coast changes with chainage.
    for j in range(28):
        a=-.5+j/28;b=-.5+(j+1)/28
        def coast(t,z):
            ang=t*math.pi*.94;return (4250+math.sin(ang)*6400,-math.cos(ang)*5900,z)
        picture(dawn,(coast(a,-510),coast(b,-510),coast(b,1720),coast(a,1720)),((a+.5,0),(b+.5,0),(b+.5,1),(a+.5,1)))
    at,h=site(k,7071,0)
    for wide,deep,z,ht,c in ((18,12,0,16,white),(14,9,16,7,teal),(10,7,23,6,white),(6.6,4,29,4,coral),(3.5,2,33,5,teal)):
        art.box(at(0,0,z),(deep,wide,ht),h,c)
        art.box(at(0,0,z+ht-.29),(deep+.5,wide+.58,.36),h,white)
    for left in (-2.2,0,2.2):art.box(at(-4.1,left,3),(.3,.52,27-abs(left)),h,coral)
    art.tube(at(0,0,38),.26,.07,7.4,teal,chrome,8)
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':5.5,'terrain':{'sea':False},'land':{'mid':0xC9B98B},
       'sky':[0xFAD7BC,0xF3C7B6,0xE3C8CE,0xB6CBD6,0x91BBD6],'haze':0xEDCFBA,'light':[0xFFD2A3,1.45],'fill':[0xCCDEE1,0xC6AF96],
       'sun_altitude':.085,'sun_azimuth':-1.53}
