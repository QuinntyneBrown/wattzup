"""Calgary, from the downtown parade to the Stampede Park midway."""
import math
from worldkit import Painted,lin
from iten_landmarks import site,pictured,picture
from arenberg import beam
PROFILE=[[0, 12], [400.0, 1.4303], [1200.0, -10.1091], [1600.0, -20.6788], [2500.0, -8.4606], [3700.0, -40.1697], [6200.0, 23.7697], [6600.0, 11.6], [7800.0, -5.7091], [8700.0, -0.6909], [9900.0, -32.4], [12400.0, 31.5394], [12800.0, 19.3697], [13200.0, 12.0]]

def height(d):
    if d<=0:return PROFILE[0][1]
    for (a,z),(b,h) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(h-z)*(d-a)/(b-a)
    return PROFILE[-1][1]

def heading(d):return .39*math.sin(d/920)+.24*math.sin(d/371)+.12*math.cos(d/185)

def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=height(d),h=h,k=heading(d+.5)-heading(d-.5),g=100*(height(d+.5)-height(d-.5))))
        x+=bc.STEP*math.cos(heading(d+.5*bc.STEP));y+=bc.STEP*math.sin(heading(d+.5*bc.STEP))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,1

def road(r,st,length,col,bc):
    pavement=bc.Builder('ParadeRoad','terrain');pavement.uvs=[];pavement.colours=[]
    paint=bc.Builder('ParadeMarkings','terrain');paint.colours=[]
    for i,p in enumerate(r.s[:-1]):
        picture(pavement,[r.at(i,-5.2),r.at(i+1,-5.2),r.at(i+1,5.2),r.at(i,5.2)],((0,0),(0,1),(1,1),(1,0)))
        def band(a,b,z,c):
            paint.quad(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,b,z),r.at(i,b,z));paint.colours.extend((lin(c),)*4)
        for a,b in ((-8.6,-5.2),(5.2,8.6)):band(a,b,.12,0xBAAF9A if p['d']<3900 else 0xC2A178)
        if p['d']<3900 and i%3==0:band(-.075,.075,.026,0xD8B662)
    pavement.build(col);paint.build(col)

def land(r,col,theme,bc):
    turf=bc.Builder('Prairie','terrain');turf.colours=[];last=None
    for i in range(0,len(r.s),4):
        row=[r.at(i,v,-.28+(math.sin(i*.17+v*.12)*min(abs(v)/350,1)*1.3)) for v in (-700,-200,-68,-21,0,21,68,200,700)]
        if last:
            for j in range(len(row)-1):
                turf.quad(last[j],row[j],row[j+1],last[j+1]);turf.colours.extend((lin((0xACAC78,0x9DAD71,0xBEBC8A)[j%3]),)*4)
        last=row
    return turf.build(col),lambda x,y:r.s[r.tree.find((x,y,0))[1]]['z']-.25

def scenery(k):
    art=Painted(k);shops=pictured(k,'WesternShops');crowd=pictured(k,'WhiteHats');city=pictured(k,'CalgarySkyline')
    wood,steel,cream,red,gold,blue,dirt=map(lin,(0x986D4A,0x92999D,0xF4E6C9,0xB43836,0xD8AC63,0x58778D,0xAB7752))
    def tile(m,pts,n,cols,rows):
        u=n%cols/cols;v=1-(n//cols+1)/rows
        picture(m,pts,((u+.002,v+.002),(u+1/cols-.002,v+.002),(u+1/cols-.002,v+1/rows-.002),(u+.002,v+1/rows-.002)))
    for i,d in enumerate(range(0,13200,23)):
        urban=d<3690;midway=d>11500
        if urban or midway:
            for side in (-1,1):
                at,h=site(k,d,side*(15+2*(i%4)));w=22 if urban else 13.5;ht=(8.8+1.6*(i%3)) if urban else 4.6
                art.box(at(0,0,-.28),(w,8,ht+.26),h,wood if i%3 else cream)
                v=-side*4.03
                tile(shops,[at(a,v,z) for a,z in ((-w/2,0),(w/2,0),(w/2,ht),(-w/2,ht))],i%2 if urban else 2,3,1)
                art.box(at(0,v,ht-.18),(w+.2,.55,.29),h,cream)
                art.box(at(0,v-side*.4,2.95),(w*.95,1.74,.17),h,(red,gold,blue)[i%3])
                if urban and i%4==1:
                    for start in (-7,0,7):art.box(at(start,5,ht-.3),(6.8,9,5.1+((i+start)%6)*1.8),h,blue)
            if i%2==0:
                at,h=site(k,d,0)
                for j in range(11):
                    v=-9+j*1.7;z=6.3+.012*v*v
                    beam(art,at(0,v,z),at(0,v+1.7,6.3+.012*(v+1.7)**2),.026,wood)
                    art.face([at(0,v,z),at(0,v+.83,z),at(.04,v+.42,z-.63)],((red,cream,blue)[j%3],)*3)
        for side in (-1,1):
            at,h=site(k,d,side*6.8)
            if not urban:
                for v in (.52,1.06):art.box(at(0,0,v),(22.9,.12,.14),h,wood)
                for a in (-10,0,10):art.box(at(a,0,0),(.16,.16,1.28),h,wood)
            if i%4==0:art.box(at(3,side*.6,.07),(1.62,.85,.79),h,gold)
        if urban or midway or 6450<d<7300:
            for side in (-1,1):
                for j in range(15 if urban or midway else 7):
                    crowdD=d+(j%8)*2.72+k.rng.uniform(-.55,.55);crowdV=side*(6.05+(j//8)*1.18+k.rng.uniform(-.28,.28));
                    at,h=site(k,crowdD,crowdV);dx=.40;dy=-side*.38;ht=1.59+.13*((i+j)%4)
                    tile(crowd,[at(-dx,-dy,.13),at(dx,dy,.13),at(dx,dy,ht+.13),at(-dx,-dy,ht+.13)],(i*3+j+side)%8,4,2)
    # A half-mile dirt oval lies beside the rider; two 215 m straights connect the turns.
    at,h=site(k,4665,85)
    last=None
    for j in range(97):
        a=math.tau*j/96
        line=[at(107.5*math.tanh(math.cos(a)*8)+r*math.cos(a),r*math.sin(a),.2) for r in (48,65)]
        if last:art.face((last[0],line[0],line[1],last[1]),(dirt,)*4)
        last=line
    at,h=site(k,6944,45)
    for j in range(18):
        for row in range(8):
            art.box(at((j-8)*6.55,row*1.28,1+row*.57),(6.51,1.31,.56),h,(blue,cream,red)[(row//3)%3])
        art.box(at((j-8)*6.55,5,10.2),(6.60,16,.37),h,cream)
        beam(art,at((j-8)*6.55,8,0),at((j-8)*6.55,9.7,10.2),.22,steel)
        art.box(at((j-8)*6.55,-9,.3),(5.9,.55,1.65),h,cream)
        for q in (-2,0,2):art.box(at((j-8)*6.55+q,-9.4,.2),(.11,.13,1.79),h,steel)
    bleachers=pictured(k,'RodeoStand')
    for j in range(3):
        a=-56+j*39; b=a+39
        picture(bleachers,(at(a,-.8,1.3),at(b,-.8,1.3),at(b,7.9,9.9),at(a,7.9,9.9)),((0,0),(1,0),(1,1),(0,1)))
    # The dirt infield, chute boxes and paddock surround the track.
    art.face((at(-99,-33,.26),at(98,-33,.26),at(98,1,.26),at(-99,1,.26)),(dirt,)*4)
    for j in range(7):
        a=-22+j*6
        art.box(at(a,-16,.21),(5.5,2.2,1.54),h,cream)
        for b in (-2,0,2):art.box(at(a+b,-17.18,.28),(.13,.16,1.55),h,blue)
    for i,d in enumerate(range(8750,9520,24)):
        at,h=site(k,d,-(13+(i%3)*13))
        art.tube(at(0,0,0),3.3,.19,5.9,cream,gold,14)
        for j in range(4):
            a=j*math.pi*.5;beam(art,at(3.24*math.cos(a),3.24*math.sin(a),0),at(-.5*math.cos(a),-.5*math.sin(a),6.79),.065,wood)
        art.face((at(-.78,.2,.03),at(.78,.2,.03),at(0,-2.34,2.25)),(wood,)*3)
    campers=pictured(k,'RiverCamp')
    for i,(d,v,t) in enumerate(((151,5.4,2),(183,-5.1,0),(2191,6.2,2),(8948,-12,1),(9119,-11.4,1),(9138,-15,0),(9150,-9,1),(9202,-13,0))):
        at,h=site(k,d,v);w=1.35 if t==1 else 3.55;ht=1.84 if t==1 else 3.3
        dx=.36*w;dy=.32*w
        tile(campers,[at(-dx,-dy,.10),at(dx,dy,.10),at(dx,dy,ht),at(-dx,-dy,ht)],t,3,1)
    # The city's profile occupies a fixed world position, with an independent freestanding Calgary Tower.
    at,h=site(k,328,28)
    art.tube(at(0,0,0),3.8,2.4,48,cream,cream,16)
    art.tube(at(0,0,48),2.9,6.7,3.8,red,red,20)
    art.tube(at(0,0,51.8),6.7,6.55,3.1,blue,blue,24)
    art.tube(at(0,0,54.9),6.75,3.4,2.5,red,red,24)
    art.tube(at(0,0,57.4),.29,.11,6.2,steel,cream,8)
    for i,d in enumerate((495,2800,7320,12930)):
        at,h=site(k,d,63)
        picture(city,(at(-50,-160,-2),at(50,160,-2),at(50,160,93),at(-50,-160,93)),((0,0),(1,0),(1,1),(0,1)))
    return {'efforts':0}

THEME={'lay':route,'road_builder':road,'land_builder':land,'road_half_width':5.2,'terrain':{'sea':False},'land':{'mid':0xABAD76},
       'sky':[0xE3DDC5,0xCCDDE2,0x9ACBE6,0x72B4DC,0x5598D0],'haze':0xD5D4BF,'light':[0xFFE0AE,1.5],'fill':[0xCFDEEC,0xB8A181],
       'sun_altitude':.81,'sun_azimuth':-.71}
