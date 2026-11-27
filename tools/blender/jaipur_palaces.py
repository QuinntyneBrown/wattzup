"""Lime-outlined arches, chhatris and the five-storey palace of winds."""
import math

from worldkit import lin

OCHRE = 0xD78465
ROSE = 0xBA6657
LIME = 0xFFE0AB
SHADOW = 0x653E39


class Front:
    """A local facade plane with horizontal, outward and vertical coordinates."""
    def __init__(self, art, centre, angle):
        self.art, self.centre, self.angle = art, centre, angle
        self.c, self.s = math.cos(angle), math.sin(angle)

    def point(self, u, v, z):
        x, y, base = self.centre
        return x + u*self.c-v*self.s, y+u*self.s+v*self.c, base+z

    def box(self, u, v, z, w, depth, h, colour):
        self.art.box(self.point(u,v,z), (w,depth,h), self.angle, lin(colour))

    def face(self, coords, colour):
        self.art.face([self.point(*p) for p in coords], [lin(colour)]*len(coords))

    def arch(self, u, v, z, r, rise, thickness, colour):
        # A pointed multifoil arch. Join inner and outer profiles so the sky or shaded recess shows through.
        last = None
        for i in range(21):
            a = math.pi * i / 20
            scallop = 1 - .075*abs(math.sin(5*a))
            x, y = math.cos(a)*scallop, math.sin(a)*scallop
            pair = ((u+r*x,v,z+rise*y),(u+(r+thickness)*x,v,z+(rise+thickness)*y))
            if last:
                self.face((last[0],pair[0],pair[1],last[1]),colour)
                self.face((last[1],pair[1],pair[0],last[0]),colour)
            last = pair

    def pavilion(self, u, v, z, radius):
        for a in (-.62,.62):
            for b in (-.62,.62):
                self.box(u+a*radius,v+b*radius,z,.15*radius,.15*radius,radius, LIME)
        self.box(u,v,z+radius,2*radius,2*radius,.14*radius, ROSE)
        for bottom,r0,r1,h in ((1.12,1,.9,.28),(1.4,.9,.55,.39),(1.79,.55,.12,.21),(2,.12,.025,.34)):
            self.art.tube(self.point(u,v,z+radius*bottom),radius*r0,radius*r1,radius*h,lin(ROSE),lin(LIME),12)

    def window(self, u, v, z, w, h):
        self.box(u,v,z,w,.35,h,ROSE)
        self.box(u,v+.22,z+.12,w*.68,.11,h*.68,SHADOW)
        self.arch(u,v+.3,z+.55*h,w*.34,h*.32,.075,LIME)
        self.box(u,v+.32,z+.1,w*.85,.15,.09,LIME)
        self.box(u,v+.32,z+.12,.07,.08,h*.63,LIME)


def palace(front):
    for tier, count in enumerate((31,31,27,21,13)):
        z=2.8+tier*2.8
        front.box(0,-2,z,count*2.1+1,4.3,2.9,OCHRE)
        front.box(0,.18,z,count*2.1+1.25,.48,.19,LIME)
        for j in range(count):
            u=(j-(count-1)/2)*2.1
            front.window(u,.38,z+.26,1.53,2.04)
            if tier==4 or (tier>=2 and (j<2 or j>=count-2)):
                front.pavilion(u,.2,z+2.83,.78)
    front.box(0,-1,0,68,5,2.83,ROSE)
    for side in (-1,1):
        front.pavilion(side*34,-.5,6.15,2.05)
        front.box(side*34,-1,0,4,4,6.2,OCHRE)


def gate(front, chandpole):
    stone=OCHRE if chandpole else 0xE3C49B
    # A real through opening across the roadway, with smaller side passages.
    for face in (-2.1,2.1):
        for side in (-1,1):
            front.box(side*8,0,-.45,4.6,4.3,9.85,stone)
            front.box(side*8,face,6.1,4.7,.28,.22,LIME)
            front.window(side*8,face+(.16 if face>0 else -.16),7.1,1.8,1.7)
        front.arch(0,face,4.2,5.7,4.7,.45,LIME)
        for i in range(28):
            u=-5.7+(i+.5)*11.4/28
            start=4.2+4.7*math.sqrt(max(0,1-(u/5.7)**2))
            front.box(u,0,start,11.4/28+.015,4.2,10.2-start,stone)
    front.box(0,0,10,20.6,4.65,.38,LIME)
    for u in (-8,0,8):
        front.pavilion(u,0,10.38,1.3 if u else 1.85)
