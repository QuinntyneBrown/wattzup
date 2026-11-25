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
    x,y,z=k.road.at(i)
    words(b,("ALLEZ","HUP","VAMOS")[number%3],(x,y,z+.055),right,(math.cos(yaw),math.sin(yaw),k.s[i]["g"]/100),1.75,5.8,0xEBD482 if number%2 else 0xEEEAE2)


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
    k.peaks(25,700,1700,(550,1030),"limestone","snow",k.s[-1]["z"]-100)
    return {"efforts":0}
