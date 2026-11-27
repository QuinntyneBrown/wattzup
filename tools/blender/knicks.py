"""Broadway's fixed landmarks between Bowling Green and City Hall."""
import math
import sys
from worldkit import lin, Painted


def route(course,theme,bc):
    st=bc.stages(course['plan']);length=st[-1]['to']
    mean=sum(s['level']*(s['to']-s['from']) for s in st)/length
    spans=[];z=5
    for s in st:
        g=(s['level']-mean)*.0028
        spans.append((s['from'],s['to'],z,g));z+=g*(s['to']-s['from'])
    rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        a,b,h,g=next((s for s in spans if d<s[1]),spans[-1])
        rows.append(dict(x=d,y=0,z=h+g*(max(a,min(b,d))-a),d=d,h=0,k=0,g=g*100))
    return rows,st,length,mean,.28


def surface(r,st,length,col,theme):
    bc=sys.modules[type(r).__module__]
    street=bc.Builder('Road','asphalt');street.colours=[]
    for i in range(len(r.s)-1):
        street.quad(r.at(i,-3.56,0),r.at(i+1,-3.56,0),r.at(i+1,3.56,0),r.at(i,3.56,0))
        street.colours.extend([lin(0x53555B)]*4)
    street.build(col)


def scenery(k):
    art=Painted(k);road=k.road
    def atlas(name):
        b=type(k.B['terrain'])(name,'terrain');b.colours=[];b.uvs=[];k.B[name]=b;return b
    fans=atlas('BroadwayFans');churches=atlas('BroadwayChurches')
    sculpture=type(k.B['terrain'])('ChargingBull','terrain');sculpture.colours=[];k.B['ChargingBull']=sculpture
    bronzeArt=Painted(k,'ChargingBull')
    def facade(batch,a,b,lane,z,h,u,v):
        left,right=(a,b) if lane<0 else (b,a)
        coords=[road.pos(d,lane,y) for d,y in ((left,z),(right,z),(right,z+h),(left,z+h))]
        batch.faces.append(tuple(batch.v(q) for q in coords));batch.colours.extend([(1,1,1,1)]*4)
        batch.uvs.extend(((u,0),(v,0),(v,1),(u,1)))
    for d in range(-30,7070,13):
        for side in (-1,1):
            if min(abs(d-120),abs(d-2720),abs(d-5340))<38:continue
            facade(fans,d,d+12.1,side*8.92,.14,2.32,0,1)
    def box(d,lane,z,w,depth,high,c):art.box(road.pos(d,lane,z),(w,depth,high),0,lin(c))
    def ell(d,lane,z,rx,ry,rz,colour,sculpt=False):
        angle=-.95 if sculpt else 0
        if sculpt:
            dx=d-103;dy=lane+7.7
            d,lane=125+dx*math.cos(angle)-dy*math.sin(angle),8.1+dx*math.sin(angle)+dy*math.cos(angle)
        draw=bronzeArt if sculpt else art
        origin=road.pos(d,lane,z);last=None
        for tier in range(9):
            t=-math.pi/2+tier*math.pi/8
            rim=[]
            for a in range(16):
                u=rx*math.cos(a*math.tau/16)*math.cos(t);v=ry*math.sin(a*math.tau/16)*math.cos(t)
                rim.append((origin[0]+u*math.cos(angle)-v*math.sin(angle),origin[1]+u*math.sin(angle)+v*math.cos(angle),origin[2]+rz*math.sin(t)))
            if last:
                for j in range(16):
                    n=(j+1)%16;c=lin(colour);shade=.71+.25*tier/8
                    draw.face((last[j],last[n],rim[n],rim[j]),((c[0]*shade,c[1]*shade,c[2]*shade,1),)*2+(c,c))
            last=rim
    # Bowling Green's wrought-iron fence and granite plinth, with a lowered, charging bronze bull.
    box(125,14,-.21,71,12,.42,0x667952)
    box(125,8.1,.12,9,4.9,.35,0x807F7C)
    for d in range(93,161,2):
        for lane in (9.8,19.0):
            art.tube(road.pos(d,lane,.18),.052,.044,1.6,lin(0x343B39),lin(0x676D62),6)
            box(d+1,lane,1.54,2.04,.055,.085,0x494F4D)
    def bull(*args):ell(*args,sculpt=True)
    bronze,polish=0x6F5541,0x97795A
    bull(103,-7.7,1.78,2.0,.79,.79,bronze);bull(101.9,-7.7,2.12,1.05,.91,.76,bronze)
    bull(100.97,-7.7,1.55,.83,.57,.53,polish);bull(100.45,-7.7,1.33,.39,.46,.26,bronze)
    for side in (-1,1):
        for d in (101.72,104.4):
            bull(d,-7.7+side*.49,1.02,.25,.19,.59,bronze)
            bull(d-.16,-7.7+side*.50,.52,.29,.19,.12,0x584A3F)
        bull(100.86,-7.7+side*.36,1.68,.12,.08,.10,0x423A33)
        for j in range(8):
            t=j/7;bull(100.96-.46*t,-7.7+side*(.43+.56*t),1.79+.29*t*t,.14-.082*t,.16-.12*t,.13-.079*t,polish)
    for j in range(9):
        t=j/8;bull(104.73+.38*math.sin(t*math.pi),-7.8-.38*t,1.96+.87*t,.13,.085,.13,bronze)
    # Trinity's sandstone spire and St. Paul's pale steeple stand above separate churchyards.
    for d,side,is_trinity in ((2720,1,True),(5340,-1,False)):
        l=side*22;stone=0x897F73 if is_trinity else 0x977C70
        box(d,l,-.32,66,28,.76,0x71835F)
        box(d,l,.42,31,12,10,stone)
        art.roof(road.pos(d,l,10.4),31,12.4,5,0,lin(0x5E646A))
        facade(churches,d-15.5,d+15.5,l-side*6.22,.47,9.91,0 if is_trinity else .5,.5 if is_trinity else 1)
        if is_trinity:
            for along in range(-12,13,5):
                for edge in (-1,1):box(d+along+edge*1.28,l-side*6.56,.44,.56,.8,8.6,stone)
            tower=d-15
            box(tower,l,.43,6.7,7.3,19.8,stone)
            for j in range(4):
                h=20+j*1.9;box(tower,l,h,6.5-j*.62,7.1-j*.64,1.94,stone)
            art.tube(road.pos(tower,l,27.62),3.25,.12,19.3,lin(0x665F59),lin(0x9A9184),8)
            for along in (-2.8,2.8):
                for cross in (-3.1,3.1):
                    art.tube(road.pos(tower+along,l+cross,19),.57,.035,5.2,lin(stone),lin(0xA69884),6)
        else:
            box(d,l-side*8,.35,14,5,.44,0xDAD1BA)
            for along in (-5,-1.65,1.65,5):
                art.tube(road.pos(d+along,l-side*9.55,.78),.39,.30,7.95,lin(0xC8BEAC),lin(0xF3EBDC),10)
            art.roof(road.pos(d,l-side*7.5,8.74),14.8,5.7,2.2,math.pi/2,lin(0xEEE4CD))
            box(d+8,l,10.42,4.1,4.1,7.7,0xBFAD93)
            art.tube(road.pos(d+8,l,18.1),2.2,1.6,4.5,lin(0xB7A991),lin(0xD4C8AD),8)
            art.tube(road.pos(d+8,l,22.55),1.68,.075,8.8,lin(0x948C7C),lin(0xB7AE99),8)
        for j in range(-7,8):
            box(d+j*3.5,l-side*9.9,.39,.56,.29,.94+(j%3)*.16,0x858983)
    # Curbside bronze plaques sunk into the granite and pedestrian signals.
    for i,d in enumerate(range(40,7010,27)):
        side=1 if i%2 else -1
        box(d,side*8.17,.158,1.65,.57,.039,0x84765B)
        for j in range(3):box(d,side*(8.02+j*.11),.199,1.28-j*.17,.024,.01,0xC2AD7F)
    for d in range(225,7000,236):
        side=-1 if d%2 else 1
        art.tube(road.pos(d,side*8.4,.15),.12,.08,6.7,lin(0x626D71),lin(0x929B9A),9)
        box(d,side*5.7,6.6,.095,5.5,.097,0x808A8F)
        for off in (2.95,5.7):
            box(d,side*off,5.56,.43,.35,1.07,0xC09746)
            for j,c in enumerate((0x749B78,0x817648,0x8A4D46)):
                ell(d-.23,side*off,5.76+j*.31,.07,.126,.126,c)
    return {'efforts':0}


THEME=dict(lay=route,surface_builder=surface,road_half_width=3.55,
           terrain={'rise':0},land={'low':0x858785,'mid':0x989A97,'high':0x8C918D,'rock':0x808181},
           sky=[0xCED8E0,0xC0D5E6,0xAACCE4,0x8DB7DB,0x72A2D0],haze=0xBFCBD6,
           light=[0xFFF1DC,2],fill=[0xB3C8DB,0x87847D],sun_altitude=.66,sun_azimuth=-2.8)
