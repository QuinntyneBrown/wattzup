"""Packed Atlantic sand beneath the original pooled foreground, with fixed Daytona landmarks."""
import math
from worldkit import Painted,lin

HEIGHT=1.7
PIER=3915
SHELL=3530
HILTON=2400


def lay(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];rows=[]
    for i in range(math.ceil((bc.LEAD_IN+length+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN
        rows.append(dict(x=0,y=d,z=HEIGHT,h=math.pi/2,k=0,g=0,d=d))
    return rows,stages,length,sum((s['to']-s['from'])*s['level'] for s in stages)/length,0


def strand(road,stages,length,col,bc):
    b=bc.Builder('Low tide foundation','sand')
    for i in range(0,len(road.s)-1):
        b.quad(road.at(i,26,-.26),road.at(i,-44,-.26),road.at(i+1,-44,-.26),road.at(i+1,26,-.26))
    b.build(col)


def beach(road,col,theme,bc):
    b=bc.Builder('Fixed shoreline','terrain');b.colours=[]
    for i in range(0,len(road.s)-1,8):
        j=min(i+8,len(road.s)-1)
        for a,c,h,k,tint in ((165,30,-.52,-.53,0x78919c),(30,0,-.53,-.12,0xc6ad8b),(0,-44,-.12,.12,0xcbb894),(-44,-121,.12,2.28,0xdac69e),(-121,-184,2.28,2.45,0xb6af87)):
            vs=(road.at(i,a,h),road.at(i,c,k),road.at(j,c,k),road.at(j,a,h))
            b.faces.append(tuple(b.v(p) for p in vs));b.colours.extend([lin(tint)]*4)
    return b.build(col),lambda x,y:HEIGHT


THEME=dict(lay=lay,land_builder=beach,road_builder=strand,road_half_width=4.15,
           terrain={'sea':False},land={'mid':0xdcc399},haze=0xeac8aa,
           sky=[0xffddab,0xf4c4a1,0xc7beca,0xa8bed5,0x84a9c7],
           light=[0xffd9a4,2.85],fill=[0xddd2cb,0xc4ad8f],sun_azimuth=2.9,sun_altitude=.18)


def scenery(kit):
    art=Painted(kit);rng=kit.rng
    def box(x,y,z,a,b,h,c):art.box((x,y,z),(a,b,h),0,lin(c))
    # The oceanfront resort steps down at both ends, with glass bays behind white balcony lines.
    for j in range(-7,8):
        floors=15-max(0,abs(j)-1)*2
        y=HILTON+j*9
        box(64,y,3,20,9.1,floors*2.72,0xaab6b4)
        box(53.88,y,4.9,.18,8.36,floors*2.64-2,0x638793)
        for n in range(floors):
            box(53.4,y,4.3+n*2.72,1.64,9.14,.31,0xe6e2d2)
            for dy in (-3.05,.1,3.18):box(53.62,y+dy,4.56+n*2.72,.22,.18,2.47,0xcbcdbe)
        box(64,y,3+floors*2.72,20.7,9.21,.39,0xeee8d8)
    for d in range(-40,8420,147):
        if abs(d-HILTON)<100 or 3400<d<4100:continue
        x=rng.uniform(97,145);height=rng.uniform(19,52);width=rng.uniform(19,40)
        box(x,d,3,17,width,height,rng.choice((0xd8cebe,0xe6dcd0,0xc8c4b5,0xcdbba6)))
        for n in range(2,int(height)-1,4):
            box(x-8.55,d,3+n,.12,width-1.25,1.36,0x788d95)
            box(x-8.84,d,4.51+n,1.03,width+.22,.16,0xe2dbcb)
    # The restaurant's long white veranda and sign deck on dark timber pile bents.
    for x in range(-153,52,6):
        box(x,PIER,8.22,6.05,8.1,.57,0x96816b)
        for side in (-1,1):
            for z in (9.1,9.64):box(x,PIER+side*4.24,z,6.06,.13,.13,0xb2a18a)
            box(x,PIER+side*4.24,8.79,.17,.19,1.05,0x8d7764)
            if abs(x)>6:art.tube((x,PIER+side*3.67,.67),.43,.34,7.61,lin(0x5b5246),lin(0x8f7966),9,lin(0x8f7966))
    box(-61,PIER,8.75,63,14.1,4.31,0xf0e7d3)
    box(-61,PIER,13.06,65,15,.45,0x77a8ac)
    art.roof((-61,PIER,13.48),63,14.6,2.09,0,lin(0x9ba99a))
    for x in range(-91,-30,3):
        for side in (-1,1):
            box(x,PIER+side*7.09,9.63,2.47,.13,2.58,0x567a88)
            box(x,PIER+side*7.16,10.9,2.49,.1,.11,0xe8e7d5)
            box(x,PIER+side*8.2,8.8,.15,.15,3.38,0xe5ddca)
    # Ochre coquina towers flank the shell's deep arched opening facing the beach.
    floor=3.0
    box(32,SHELL,floor,11,25,.79,0xcabfa1)
    for j in range(26):
        t=math.pi*j/25;u=math.cos(t);v=math.sin(t)
        a=math.pi*(j+1)/25
        if j==25:break
        def arch(angle,r):
            return (27,SHELL+r*math.cos(angle),floor+.71+r*math.sin(angle))
        vs=(arch(t,8.74),arch(a,8.74),arch(a,10.72),arch(t,10.72))
        col=lin(rng.choice((0xcaa879,0xd0b38a,0xb99b74)))
        art.face(vs,(col,)*4);art.face(vs[::-1],(col,)*4)
        back=((34,SHELL,floor+.77),(34,SHELL+8.8*u,floor+.77+8.8*v),(34,SHELL+8.8*math.cos(a),floor+.77+8.8*math.sin(a)))
        art.face(back,(lin(0x836f57),)*3);art.face(back[::-1],(lin(0x836f57),)*3)
    for side in (-1,1):
        y=SHELL+side*12.8
        box(30,y,floor,5.8,4.3,10.53,0xcdb18b)
        for h in (3,6.8,9.7):box(30,y,floor+h,6.08,4.6,.32,0xe1c49b)
        for xx in (-1.94,1.94):
            for yy in (-1.41,1.41):art.tube((30+xx,y+yy,floor+10.5),.36,.33,1,lin(0xbda078),lin(0xd3b68d),8)
    # Gentle ramps slope from the public access signs and boardwalk to open sand.
    for d in (680,1860,3080,4930,6520,7780):
        for j in range(11):
            x=17+j*3.8
            box(x,d,1.71+j*.11,3.82,5.8,.18,0xbba385)
            if j%2==0:
                for side in (-1,1):box(x,d+side*2.98,1.83+j*.11,.15,.15,1.01,0xa99475)
    return {'efforts':0}
