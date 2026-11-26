"""Stonework, café frontages and race furniture on the Cathedral Circuit."""
import math
from bondi import beam
from iten_landmarks import picture,pictured,site
from worldkit import Painted,lin

UV=((0,0),(1,0),(1,1),(0,1))


def road(r,st,length,col,bc):
    stones=bc.Builder('MarktSetts','terrain')
    stones.colours=[];stones.uvs=[]
    walks=bc.Builder('SquarePavements','terrain');walks.colours=[]
    for i,p in enumerate(r.s[:-1]):
        for left,right in ((5,2.7),(2.7,.9),(.9,-.9),(-.9,-2.7),(-2.7,-5)):
            pts=(r.at(i,left,.025),r.at(i,right,.025),r.at(i+1,right,.025),r.at(i+1,left,.025))
            stones.quad(*pts)
            for j,off in enumerate((left,right,right,left)):
                d=r.s[i+(j//2)]['d'];shade=.82+.13*math.cos(off*2.1)+.035*math.sin(d*.064)
                stones.colours.append((shade,shade,shade,1));stones.uvs.append((off/2.25,d/2.25))
        for side in (-1,1):
            for a,b,h,colour in ((5,5.26,.03,0x5D5C5C),(5.26,5.48,.174,0xA49F95),(5.48,16,.165,0xADAA9E)):
                pts=(r.at(i,side*a,h),r.at(i+1,side*a,h),r.at(i+1,side*b,h),r.at(i,side*b,h))
                walks.quad(*(pts if side>0 else pts[::-1]));walks.colours.extend([lin(colour)]*4)
    stones.build(col);walks.build(col)


def facades(k,art,elevations):
    """Add shutters, stepped gables and retail windows at actual house footprints."""
    def place(index,wall,width,height,side,variant):
        a=lambda x,y,z:k.P(index,x,wall+y*side,z);u=variant%3/3
        s=1 if side>0 else -1
        points=(a(-s*width*.49,-.03,.16),a(s*width*.49,-.03,.16),a(s*width*.49,-.03,height+.78),a(-s*width*.49,-.03,height+.78))
        picture(elevations,points,((u+.002,0),(u+.331,0),(u+.331,.91),(u+.002,.91)))
        for n in range(1,4):
            w=width*(.8-.18*n)
            art.box(a(0,-.02,height+.48+(n-1)*.49),(w,.39,.50),k.s[index]['h'],lin((0xB16F59,0xDDD2B3,0xC6A36D)[variant%3]))
    return place


def sprint_square(k,art,portal,stage):
    d=stage['to']+26
    off=32
    if not k.room(k.road.index(d),off,16,72):off=-off
    at,h=site(k,d,off)
    block=lin(0xB7AFA0);trim=lin(0xD3CBBC);slate=lin(0x56565C);shadow=lin(0x5A6264)
    art.box(at(12,0,-3),(36,16,22),h,block);art.roof(at(12,0,19),36,16,7,h,slate)
    for v in (-7.9,7.9):
        art.box(at(-5,v,-2),(6.4,5.8,32),h,block)
        for level in (9,18,27):art.box(at(-5,v,level),(6.76,6.2,.62),h,trim)
        art.tube(at(-5,v,30),3.9,2.6,3.5,block,trim,8);art.tube(at(-5,v,33.5),2.66,.10,8.9,slate,slate,8)
        for u in (-2.52,2.52):
            for e in (-2.26,2.26):art.tube(at(-5+u,v+e,29.8),.54,.04,3.45,trim,trim,5)
    art.box(at(7,0,23.2),(7.1,7.1,11.4),h,block)
    art.tube(at(7,0,34.6),4.9,3.16,6.4,block,trim,8);art.tube(at(7,0,41),3.15,.10,21,slate,slate,8)
    picture(portal,(at(-8.38,10.7,.04),at(-8.38,-10.7,.04),at(-8.38,-10.7,28.8),at(-8.38,10.7,28.8)),UV)
    for v in (-8.12,8.12):
        for u in (1,7,13,19,25):art.box(at(u,v,0),(1.1,1.84,18.3),h,trim);art.box(at(u+2.5,v,5),(2.1,.21,9.1),h,shadow)


def race_day(k,art):
    portals=pictured(k,'WestPortal');crowd=pictured(k,'MarktSupporters');sponsors=pictured(k,'RaceSponsors')
    steel=lin(0x879496);wood=lin(0x77644D);cream=lin(0xE8D8AA)
    for stage in k.st:
        if stage['kind']=='work':sprint_square(k,art,portals,stage)
    for d in range(-42,int(k.length)+80,7):
        packed=any(s['kind']=='work' and s['from']-22<d<s['to']+22 for s in k.st) or abs(d-k.length)<190
        for side in (-1,1):
            at,h=site(k,d,side*5.49);end,_=site(k,d+6.88,side*5.49)
            for z in (.28,1.01):beam(art,at(0,0,z),end(0,0,z),.065,.07,steel)
            for u in (.2,1.32,2.46,3.6,4.74,5.88):
                art.box(at(u,0,.14),(.055,.055,.89),h,steel)
            if (d//7)%3!=0:
                u=((d//7)%4)*.25;rev=side<0
                points=(at(.3,-side*.07,.33),at(5.76,-side*.07,.33),at(5.76,-side*.07,.92),at(.3,-side*.07,.92))
                picture(sponsors,points,((u+.247 if rev else u+.001,0),(u+.001 if rev else u+.247,0),(u+.001 if rev else u+.247,1),(u+.247 if rev else u+.001,1)))
            if not packed and d%21!=-42%21:continue
            for row in range(3 if packed else 1):
                u=(row%2)*1.5+(.4 if d%14 else 0);v=side*(.58+row*.73);high=1.8+.1*row;w=4.7+row*.28
                picture(crowd,(at(u,v,.17),at(u+w,v,.17),at(u+w,v,high+.17),at(u,v,high+.17)),UV)
    for d in (7008,7022,7036):
        at,h=site(k,d,-8.24)
        art.tube(at(0,0,.16),.08,.065,2.63,wood,wood,8)
        art.tube(at(0,0,2.53),2.02,.11,.73,lin(0x9B574B),cream,12)
        art.tube(at(0,0,.18),.14,.10,.79,wood,wood,8)
        art.tube(at(0,0,.97),.86,.86,.09,wood,wood,12,cream)
        for u in (-1.15,1.15):art.box(at(u,0,.18),(.53,.55,.54),h,wood);art.box(at(u*1.2,0,.67),(.11,.55,.53),h,wood)
