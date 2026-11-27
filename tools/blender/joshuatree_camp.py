"""Trailhead pull-outs, Jumbo Rocks' individual campsites and the Little San Bernardino ridge."""
import math
from worldkit import lin


def campground(k,art):
    rng=k.rng
    for d0,side in ((4294,1),(12399,-1),(12455,1)):
        yaw=k.road.s[k.road.index(d0)]['h']
        for j in range(4):
            d=d0+j*11
            x,y,_=k.road.pos(d,side*(8.1+j%2*1.3));z=k.height_at(x,y)
            art.box((x,y,z+.28),(4.55,1.85,.63),yaw+.2,lin((0x94877D,0xB7BEB3,0x617C82,0xA17D69)[j]))
            art.box((x+.09,y,z+.88),(2.56,1.58,.61),yaw+.2,lin(0x637481))
            art.box((x+.11,y,z+1.47),(2.12,1.61,.12),yaw+.2,lin(0xC0B8A7))
            for dx in (-1.35,1.34):
                for dy in (-.88,.88):
                    art.box((x+dx*math.cos(yaw)-dy*math.sin(yaw),y+dx*math.sin(yaw)+dy*math.cos(yaw),z+.07),(.55,.25,.6),yaw,lin(0x4B4543))
            if d0<5000:continue
            x,y,_=k.road.pos(d+2,side*(16+j%2*3.5));z=k.height_at(x,y)
            art.roof((x,y,z),3.4,2.3,1.37,yaw+.38,lin((0xB97732,0x81975D,0x537F88,0xCF7346)[j]))
            for leg in (-.68,.68):
                art.box((x+2.8+leg,y,z),(.13,1.5,.67),yaw,lin(0x76634F))
            art.box((x+2.8,y,z+.68),(2.02,1,.14),yaw,lin(0x91755C))
            for s in (-1,1):
                art.box((x+2.8,y+s*.74,z+.34),(2.1,.36,.14),yaw,lin(0xA4896B))
    # Low sage and creosote occupy the gaps between the larger yuccas.
    for d in range(0,int(k.length),7):
        x,y,_=k.road.pos(d,rng.choice((-1,1))*rng.uniform(5,46));z=k.height_at(x,y)
        tint=rng.choice((0x8D8861,0x8D916C,0x929475,0xAB9F75))
        for j in range(3):
            a=j*2.09+.8;h=rng.uniform(.32,.76)
            art.tube((x+.28*math.cos(a),y+.28*math.sin(a),z),.21,.41,h,lin(0x736B51),lin(tint),5)
            art.tube((x+.28*math.cos(a),y+.28*math.sin(a),z+h),.41,.09,.2,lin(tint),lin(tint),5)
