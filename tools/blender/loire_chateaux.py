"""Four distinct Loire Valley landmarks. Origins and reflections use the river's waterline."""
import math
from iten_landmarks import picture
from worldkit import lin


def location(k,d,off,z,turn=0):
    x,y,_=k.road.pos(d,off);h=k.s[k.road.index(d)]['h']+turn;c,s=math.cos(h),math.sin(h)
    def at(u,v,w=0):return (x+u*c-v*s,y+u*s+v*c,z+w)
    return at,h


def elevation(mesh,at,u0,u1,v,base,height,tile):
    u,w=tile
    picture(mesh,(at(u0,v,base),at(u1,v,base),at(u1,v,base+height),at(u0,v,base+height)),((u+.004,w+.004),(u+.496,w+.004),(u+.496,w+.496),(u+.004,w+.496)))


def tower(art,at,u,v,r,h,spire,cream,slate):
    art.tube(at(u,v,-.32),r,r*.98,h+.32,cream,cream,16)
    art.tube(at(u,v,h-.34),r*1.07,r*1.04,.52,cream,cream,16)
    art.tube(at(u,v,h+.18),r*1.10,.16,spire,slate,lin(0x57626D),16)
    art.tube(at(u,v,h+spire+.12),.17,.07,1.48,slate,lin(0x777A75),6)


def chambord(k,art,facades,river):
    d=2191;off=-40;x,y,_=k.road.pos(d,off);z=k.height_at(x,y)
    at,h=location(k,d,off,z,-.13);cream=lin(0xDDCEAF);slate=lin(0x505966)
    art.box(at(0,0,-1),(62,18,12.8),h,cream);art.roof(at(0,0,11.7),63,19,5.7,h,slate)
    art.box(at(0,0,10.5),(26,20,7.5),h,cream);art.roof(at(0,0,18),27,21,7.3,h,slate)
    for side in (-1,1):
        for v in (-8,8):tower(art,at,side*28,v,4.10,15.1,7.2,cream,slate)
        tower(art,at,side*11,8.7,3.4,19.2,7.7,cream,slate)
    for j in range(8):
        u=-28+j*8;elevation(facades,at,u-3.95,u+3.95,9.075,.20,11.36,(0,.5))
    # Slate dormers alternate with carved chimneys; the central double lantern rises above both.
    for j in range(13):
        u=-27+j*4.5;high=16.0 if abs(u)>13 else 22.5
        art.box(at(u,5.6,high-3.4),(2.1,1.8,3.5),h,cream)
        art.roof(at(u,5.6,high+.1),2.3,1.8,1.55,h,slate)
        art.tube(at(u,1.5,high-1.2),.57,.45,3.8+(j%3),cream,cream,7)
        art.tube(at(u,1.5,high+2.5+(j%3)),.74,.60,.57,cream,cream,7)
    art.tube(at(0,0,22),3.2,2.55,4.4,cream,cream,8)
    art.tube(at(0,0,26.3),2.69,1.36,2.2,slate,slate,8)
    art.tube(at(0,0,28.4),1.28,1.12,2.65,cream,cream,8)
    art.tube(at(0,0,31),1.27,.08,2.9,slate,slate,8)
    river.face((at(-53,13,-.15),at(51,13,-.15),at(51,19,-.15),at(-53,19,-.15)),(lin(0x679597),)*4)
    for j in range(6):
        for v in (21,28):
            u=-33+j*11
            for along in (-3.8,3.8):art.box(at(u+along,v,0),(.53,5.0,.63),h,lin(0x586C3E))
            for cross in (-2.5,2.5):art.box(at(u,v+cross,0),(7.7,.53,.63),h,lin(0x60764A))


def chenonceau(k,art,facades,reflection,level):
    at,h=location(k,6639,63,level,.64);cream=lin(0xDDDAC6);shade=lin(0xA9AE9E);slate=lin(0x626A72)
    def reflected(points):
        return tuple((x+math.sin(h)*(z-level)*1.45,y-math.cos(h)*(z-level)*1.45,level+.04) for x,y,z in points)
    reflection.face(reflected((at(-28,-4.38,5.2),at(28,-4.38,5.2),at(28,-4.38,11.8),at(-28,-4.38,11.8))),(lin(0x8EA7A0),)*4)
    # Each arch has an actual void from the spring line down to the water. The soffit joins both faces.
    for j in range(5):
        c=-22+j*11
        for n in range(16):
            def edge(t,v):return at(c-4.65*math.cos(t),v,.58+3.32*math.sin(t))
            a=n*math.pi/16;b=(n+1)*math.pi/16
            for v in (-4.2,4.2):
                p,q=edge(a,v),edge(b,v);r=at(c-4.65*math.cos(b),v,5.25);s=at(c-4.65*math.cos(a),v,5.25)
                art.face((p,q,r,s) if v<0 else (s,r,q,p),(cream,)*4)
                reflection.face(reflected((p,q,r,s)),(lin(0x708F8E),)*4)
            art.face((edge(a,-4.2),edge(a,4.2),edge(b,4.2),edge(b,-4.2)),(shade,)*4)
        art.box(at(c-5.52,0,-.50),(1.76,8.6,5.78),h,cream)
        art.tube(at(c-5.52,-4.35,-.28),.94,.38,3.3,shade,cream,8)
    art.box(at(27.6,0,-.5),(1.70,8.6,5.8),h,cream)
    art.box(at(0,0,5.20),(57,8.7,6.68),h,cream);art.roof(at(0,0,11.84),57.2,9.0,3.10,h,slate)
    for side in (-1,1):
        for j in range(5):elevation(facades,at,-28+j*11.2,-16.8+j*11.2,side*4.38,5.26,6.52,(.5,.5))
    for u in range(-24,27,8):
        art.box(at(u,-2.9,11.9),(1.85,1.65,2.03),h,cream);art.roof(at(u,-2.9,13.92),2.06,1.79,1.06,h,slate)
    art.box(at(-34,0,-.32),(14,14,14.9),h,cream);art.roof(at(-34,0,14.55),15,14.6,5.7,h,slate)
    for a in (-40,-28):
        for b in (-6.3,6.3):tower(art,at,a,b,1.51,15.3,3.5,cream,slate)
    tower(art,at,-51,-9,3.5,12.5,5.15,cream,slate)


def clifftop(k,art,facades,d,off,chaumont):
    x,y,_=k.road.pos(d,off);z=k.road.pos(d)[2]+6;at,h=location(k,d,off,z,-.47)
    cream=lin(0xDCCFB0);slate=lin(0x535E69)
    art.box(at(0,0,-16),(63,33,16),h,lin(0xC5BDA4));art.box(at(0,0,0),(46,13,11.7),h,cream)
    art.roof(at(0,0,11.7),46.6,13.4,4.9,h,slate)
    for j in range(4):elevation(facades,at,-22+j*11,-11+j*11,-6.58,.21,11.3,(0,.5))
    if chaumont:
        for a,b in ((-21,-6.1),(21,-6.1),(-21,6.1),(21,6.1)):
            tower(art,at,a,b,4.6,13.5,8.0,cream,slate)
        for a in (-5.4,5.4):tower(art,at,a,-9.5,3.55,11.7,6.7,cream,slate)
    else:
        for a in (-22,22):art.tube(at(a,-10,-14),5.2,4.95,24,cream,cream,16)
        art.box(at(16,1,10),(9,11,5.3),h,cream);art.roof(at(16,1,15.3),9.3,11.4,4.4,h,slate)
        art.box(at(-12,-11,-.2),(8,4.2,5.8),h,cream);art.roof(at(-12,-11,5.6),8.35,4.2,3.1,h,slate)
        art.tube(at(-12,-11,8.4),.75,.07,4.5,slate,slate,7)
