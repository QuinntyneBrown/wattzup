"""Alpe d'Huez. One climb with twenty-one signed hairpins for Elevate Your Climbing Power."""
from functools import lru_cache
import math

import bpy
from worldkit import Painted, lin

# The first winner commemorated at each numbered bend, from the valley to the station.
# Source: Alpe d'Huez Tourisme, Les vainqueurs du Tour de France à l'Alpe d'Huez.
WINNERS = (
    "Fausto Coppi", "Joop Zoetemelk", "Hennie Kuiper", "Hennie Kuiper",
    "Joaquim Agostinho", "Joop Zoetemelk", "Peter Winnen", "Beat Breu",
    "Peter Winnen", "Luis Herrera", "Bernard Hinault", "Federico Echave",
    "Steven Rooks", "Gert-Jan Theunisse", "Gianni Bugno", "Gianni Bugno",
    "Andrew Hampsten", "Roberto Conti", "Marco Pantani", "Marco Pantani", "Giuseppe Guerini",
)
RADIUS = 18


def turns(length):
    # A shorter first approach shows the beginning of the stair from the start line.
    first, finish = 155, 380
    remaining = length - first - finish - 21*math.pi*RADIUS
    legs = [1 + .27*math.sin(j*1.7) + .16*math.cos(j*.81) for j in range(20)]
    d = first
    result = []
    for j in range(21):
        result.append(d)
        d += math.pi*RADIUS
        if j<20:
            d += remaining*legs[j]/sum(legs)
    return result


def route(course, theme, bc):
    st = bc.stages(course["plan"])
    length = st[-1]["to"]
    bends = turns(length)
    mean = sum((s["to"]-s["from"])*s["level"] for s in st)/length
    n = math.ceil((bc.LEAD_IN+length+bc.RUN_OUT)/bc.STEP)+1
    raw=[]
    for i in range(n):
        d=i*bc.STEP-bc.LEAD_IN
        stage = bc.stage_at(st,d)
        g=0 if not stage else 1.05*(stage["level"]-12)
        raw.append(g*min(1,max(0,d/160)))
    grades=bc.box_smooth(raw, int(16/bc.STEP))
    x=y=0
    z=738
    samples=[]
    for i,g in enumerate(grades):
        d=i*bc.STEP-bc.LEAD_IN
        heading=0
        curvature=0
        for j,begin in enumerate(bends):
            angle=min(math.pi,max(0,(d-begin)/RADIUS))
            sign=1 if j%2==0 else -1
            heading+=sign*angle
            if 0<angle<math.pi:curvature=sign/RADIUS
        x+=math.cos(heading)*bc.STEP
        y+=math.sin(heading)*bc.STEP
        z+=g*bc.STEP/100
        samples.append(dict(x=x,y=y,z=z,h=heading,k=curvature,g=g,d=d))
    return samples,st,length,mean,1.05


THEME={
    "lay":route, "terrain":{"sea":False,"rise":100,"far":23,"valley":True},
    "sky":[0xDCE9F0,0xB9D9EE,0x88C3E8,0x549FDA,0x377FBF],
    "light":[0xFFF1C9,3.2], "fill":[0xDAECF9,0x82835D],"haze":0xC8D9E0,
    "sun_altitude":.78,"sun_azimuth":-.9,"kerbs":False,"edge":"verge","centre":"white",
    "land":{"low":0x7D9855,"mid":0x69904A,"high":0x829263,"rock":0x878B80,"snow":0xF4F5F3},
    "palette":{"asphalt":0x565555,"sand":0x929383,"promenade":0x9A9A8A},
    "chunks":{"Land":2},
}


@lru_cache(maxsize=96)
def lettering(text):
    """Original raised sign lettering as triangles. The exported course needs no font."""
    curve=bpy.data.curves.new("Sign master","FONT")
    curve.body=text
    curve.align_x="CENTER"
    curve.resolution_u=2
    obj=bpy.data.objects.new("Sign master",curve)
    bpy.context.scene.collection.objects.link(obj)
    evaluated=obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    mesh=evaluated.to_mesh()
    try:
        mesh.calc_loop_triangles()
        triangles=[tuple(tuple(mesh.vertices[v].co[:2]) for v in t.vertices) for t in mesh.loop_triangles]
        width=max(x for tri in triangles for x,y in tri)-min(x for tri in triangles for x,y in tri)
        return triangles,width
    finally:
        evaluated.to_mesh_clear()
        bpy.data.objects.remove(obj,do_unlink=True)
        bpy.data.curves.remove(curve)


def words(b,text,origin,right,up,size,max_width,tint):
    triangles,width=lettering(text)
    scale=min(size,max_width/width)
    col=lin(tint)
    for tri in triangles:
        points=[tuple(origin[k]+scale*(x*right[k]+y*up[k]) for k in range(3)) for x,y in tri]
        b.face(points,(col,)*3)


def bend_sign(k,b,d,number):
    i=k.road.index(d-14)
    x,y,z=k.road.at(i,-6.35)
    yaw=k.s[i]["h"]
    right=(math.sin(yaw),-math.cos(yaw),0)
    up=(0,0,1)
    b.box((x,y,z-.7),(.14,.18,3.8),yaw,lin(0x6D7979))
    b.box((x,y,z+1.4),(.12,2.25,1.63),yaw,lin(0xDAE4DF))
    b.box((x-.08*math.cos(yaw),y-.08*math.sin(yaw),z+2.81),(.04,2.25,.22),yaw,lin(0xE3B54C))
    ox,oy=x-.11*math.cos(yaw),y-.11*math.sin(yaw)
    words(b,str(number),(ox,oy,z+2.04),right,up,.84,1.65,0x253638)
    words(b,WINNERS[21-number],(ox,oy,z+1.54),right,up,.27,2.0,0x233840)
    approach=k.road.index(d-31)
    ax,ay,az=k.road.at(approach)
    words(b,WINNERS[21-number].split()[-1].upper(),(ax,ay,az+.055),right,
          (math.cos(yaw),math.sin(yaw),k.s[approach]["g"]/100),1.44,6.25,0xF5E8C6)
    x,y,z=k.road.at(i)
    words(b,("ALLEZ","HUP","VAMOS")[number%3],(x,y,z+.055),right,(math.cos(yaw),math.sin(yaw),k.s[i]["g"]/100),1.75,5.8,0xEBD482 if number%2 else 0xEEEAE2)



def chalet(b,x,y,z,yaw,width=7.5,depth=6,height=4.8):
    wood, cream, slate = lin(0x91684B),lin(0xE6DDCA),lin(0x59626B)
    cs,sn=math.cos(yaw),math.sin(yaw)
    def pos(u,v,h):
        return x+u*cs-v*sn, y+u*sn+v*cs, z+h
    b.box(pos(0,0,-1.5),(width,depth,height+1.5),yaw,cream)
    b.box(pos(0,0,height*.65),(width+.12,depth+.12,height*.35),yaw,wood)
    b.roof(pos(0,0,height),width+.65,depth+.75,height*.42,yaw,slate)
    for face in (-1,1):
        for j in (-.30,0,.30):
            b.box(pos(width*j,face*(depth/2+.09),height*.35),(1.02,.14,1.15),yaw,lin(0x48575F))
        b.box(pos(0,face*(depth/2+.5),height*.56),(width*.86,1.05,.15),yaw,wood)
        b.box(pos(0,face*(depth/2+.96),height*.72),(width*.86,.1,.14),yaw,wood)
        for j in range(7):
            b.box(pos(width*(j-3)*.13,face*(depth/2+.96),height*.56),(.08,.1,.79),yaw,wood)


def camper(b,x,y,z,yaw):
    cs,sn=math.cos(yaw),math.sin(yaw)
    def pos(u,v,h):
        return x+u*cs-v*sn,y+u*sn+v*cs,z+h
    white,glass = lin(0xF0EBDA),lin(0x4F6573)
    b.box(pos(0,0,.38),(5.5,2.2,2.2),yaw,white)
    b.box(pos(3.1,0,.46),(1.45,2.12,1.65),yaw,white)
    b.box(pos(2.65,0,2.12),(1.55,2.16,.52),yaw,white)
    for side in (-1,1):
        for u in (-1.35,.35,2.9):
            b.box(pos(u,side*1.11,1.35),(1.0,.09,.61),yaw,glass)
        b.box(pos(-.15,side*1.11,.97),(5,.1,.14),yaw,lin(0x417C86))
        for u in (-1.7,2.35):
            b.box(pos(u,side*1.06,0),(.76,.34,.74),yaw,lin(0x323437))


def fan(k,b,x,y,z,yaw,orange):
    rng=k.rng
    tall=rng.uniform(.9,1.12)
    skin=lin(rng.choice((0xB78264,0xE4B696,0x936B55)))
    shirt=lin(rng.choice((0xED6B22,0xF68423,0xCF521F) if orange else (0x446C91,0xF0D768,0xBA5648,0xDDDCCF)))
    b.box((x,y,z),(.34,.34,.81*tall),yaw,lin(0x485260))
    b.tube((x,y,z+.78*tall),.18,.24,.6*tall,shirt,shirt,7)
    b.tube((x,y,z+1.37*tall),.13,.115,.24*tall,skin,skin,7,skin)
    for side in (-1,1):
        lift=rng.uniform(.22,.58)
        b.box((x-math.sin(yaw)*side*.24,y+math.cos(yaw)*side*.24,z+1.03*tall),
              (.13,.12,lift),yaw,skin)
    if rng.random()<.38:
        b.tube((x,y,z+1.58*tall),.16,.13,.08,shirt,shirt,8,shirt)


def flag(b,x,y,z,yaw):
    pole,red,white,blue=map(lin,(0x777F83,0xC34B43,0xEFEACA,0x455C91))
    b.tube((x,y,z),.045,.036,4.7,pole,pole,5)
    cs,sn=math.cos(yaw),math.sin(yaw)
    def point(j,up):
        return x+j*.46*cs-math.sin(j*1.3)*.13*sn,y+j*.46*sn+math.sin(j*1.3)*.13*cs,z+up-j*.035
    for j in range(4):
        for h,tint in enumerate((blue,white,red)):
            base=3.58+h*.34
            pts=(point(j,base),point(j+1,base),point(j+1,base+.34),point(j,base+.34))
            b.face(pts,(tint,)*4);b.face(pts[::-1],(tint,)*4)


def church(k,b,bend):
    i=k.road.index(bend+8)
    x,y,z=k.P(i,6,15)
    # Set the small nave on the inside of the bend; the square tower is seen before the bell.
    cream,slate=lin(0xEEE4CD),lin(0x59616B)
    b.box((x,y,z-1.8),(9,5.1,5.8),0,cream)
    b.roof((x,y,z+4),9,5.1,2.5,0,slate)
    b.box((x-3.1,y-1,z-1.8),(2.8,2.8,10.4),0,cream)
    for dy in (-1.44,1.44):
        b.box((x-3.1,y-1+dy,z+6.45),(.8,.1,1.3),0,lin(0x424B51))
    b.tube((x-3.1,y-1,z+8.6),2.22,.09,4.9,slate,slate,4,slate)
    b.box((x-3.1,y-1,z+13.4),(.10,.10,1.1),0,slate)
    b.box((x-3.1,y-1,z+14.0),(.72,.1,.11),0,slate)


def lift(k,b):
    towers=[]
    steel, red = lin(0x7B868B),lin(0xC65F45)
    for d in (k.length-420,k.length-225,k.length-60):
        i=k.road.index(d)
        x,y,z=k.road.at(i,-18)
        b.tube((x,y,z-2),.77,.46,16,steel,steel,8,steel)
        b.box((x,y,z+14),(6,.75,.5),0,steel)
        towers.append((x,y,z+14))
    for a,c in zip(towers,towers[1:]):
        prev=a
        for j in range(1,17):
            t=j/16
            hx,hy,hz=[a[k]+(c[k]-a[k])*t for k in range(3)]
            hz-=3.4*math.sin(math.pi*t)
            line=(hx,hy,hz)
            pts=(prev,(prev[0],prev[1],prev[2]+.14),(hx,hy,hz+.14),line)
            b.face(pts,(steel,)*4);b.face(pts[::-1],(steel,)*4)
            if j in (4,10):
                b.box((hx,hy,hz-1.5),(.12,.12,1.5),0,steel)
                b.box((hx,hy,hz-3.1),(1.56,1.98,1.62),0,red)
                b.box((hx,hy,hz-2.55),(1.59,1.99,.74),0,lin(0x536A76))
            prev=line

def grandes_rousses(k):
    b=Painted(k,"peaks")
    cx,cy,reach=k.centre()
    radius=reach+1850
    count=180
    def vertex(j,band):
        a=math.tau*(j%count)/count
        peak=abs(math.sin(7*a+.4))**2 + .35*abs(math.sin(17*a+.9))
        relief=470+470*peak+75*math.sin(31*a)
        snowline=.66+.13*math.sin(13*a)+.12*math.cos(39*a)
        f=(0,snowline,1)[band]
        r=radius+(330+80*math.cos(11*a))*f
        return (cx+r*math.cos(a),cy+r*math.sin(a),k.s[0]["z"]-130+f*relief)
    for j in range(count):
        for band,tint in enumerate((0x778590,0xD8E4EB)):
            low=lin(tint)
            high=lin((0x73818F,0xEDF3F6)[band] if j%5<3 else (0x657686,0xB8CBD9)[band])
            pts=(vertex(j,band),vertex(j,band+1),vertex(j+1,band+1),vertex(j+1,band))
            b.face(pts,(low,high,high,low))
            b.face(pts[::-1],(low,high,high,low))


def supporters_smoke(k,d):
    b=Painted(k,"orange-smoke")
    for distance,side in ((d-24,-1),(d+6,1)):
        i=k.road.index(distance)
        x,y,z=k.road.at(i,side*7.3)
        for j in range(9):
            t=j/8
            cx=x+t*t*5.8+math.sin(j*1.9)*.26
            cy=y+side*(.55*t+math.sin(j*1.3)*.36)
            cz=z+2.1+4.5*t
            radius=.18+1.6*t
            tint=lin(0xFB802F if j<4 else 0xFCA769)
            # Crossed translucent billows read around the hairpin from either direction.
            for angle in (0,math.pi/2):
                ring=[]
                for q in range(12):
                    a=math.tau*q/12
                    dx=radius*math.cos(a)*(1+.13*math.sin(3*a+j))
                    ring.append((cx+math.cos(angle)*dx,cy+math.sin(angle)*dx,cz+.72*radius*math.sin(a)))
                for q in range(12):
                    b.face(((cx,cy,cz),ring[q],ring[(q+1)%12]),(tint,)*3)


def scenery(k):
    b=Painted(k)
    bends=turns(k.length)
    for j,d in enumerate(bends):
        bend_sign(k,b,d,21-j)
        for d2 in range(int(d)-24,int(d+math.pi*RADIUS)+20,5):
            i=k.road.index(d2)
            side=-1 if j%2==0 else 1
            x,y,z=k.road.at(i,side*7.6)
            b.box((x,y,z-.6),(5.15,.58,1.3),k.s[i]["h"],lin(0xA99E89 if j%3 else 0x899996))
            if j in (0,14,20) or d2%3==0:
                x,y,z=k.road.at(i,side*k.rng.uniform(8.5,11.0))
                k.person((x,y,z-.2),k.s[i]["h"]+side*math.pi/2,["crowd-3","crowd-2"])
    # Dutch Corner has the densest roadside supporters; the rest of the hill retains
    # enough open verge for an unobstructed view of the numbered signs.
    for j,d in enumerate(bends):
        for offset in range(-46,52,2 if j==14 else 9):
            i=k.road.index(d+offset)
            for side in (-1,1):
                off=side*k.rng.uniform(5.8,7.4)
                x,y,z=k.road.at(i,off)
                fan(k,b,x,y,z-.12,k.s[i]["h"]+side*math.pi/2,j==14)
            if offset%7==0:
                x,y,z=k.road.at(i,-7)
                flag(b,x,y,z,k.s[i]["h"]+.4)
        i=k.road.index(d-53)
        x,y,z=k.road.at(i,-9)
        camper(b,x,y,z-.2,k.s[i]["h"])
    church(k,b,bends[14])
    for start,end,spacing in [(-35,123,19),(k.length-410,k.length-18,22)]:
        for j,d in enumerate(range(int(start),int(end),spacing)):
            i=k.road.index(d)
            side=1 if j%2 else -1
            x,y,z=k.road.at(i,side*k.rng.uniform(13,19))
            chalet(b,x,y,z-.27,k.s[i]["h"]+.2,7.5,6,4.2 if start<0 else 7)
    lift(k,b)
    grandes_rousses(k)
    supporters_smoke(k,bends[14])
    return {"efforts":0}
