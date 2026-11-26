"""A Día de Muertos procession on Paseo de la Reforma in Ciudad de México."""
import math
from bondi import beam
from iten_landmarks import picture,pictured,site
from worldkit import Painted,lin
UV=((0,0),(1,0),(1,1),(0,1))


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    def heading(d):return -math.radians(4)*math.sin(d/300)*math.cos(d/810+1)+.13*math.exp(-((d-3950)/125)**2)
    x=y=0;z=2240;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;s=next((s for s in stages if d<s['to']),stages[-1]);g=(.5 if s['kind']=='work' else 0)+.3*math.sin(d/114);h=heading(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=g));h=heading(d+bc.STEP*.5);x+=bc.STEP*math.cos(h);y+=bc.STEP*math.sin(h);z+=g*bc.STEP/100
    return rows,stages,length,mean,.005


def road(r,st,length,col,bc):
    b=bc.Builder('ReformaAsphalt','terrain');b.colours=[]
    for i,p in enumerate(r.s[:-1]):
        for a,e,z,c in ((-115,115,-.15,0x706575),(-22,22,.006,0xA39490),(-12.4,12.4,.026,0x5B555D),(-12.63,-12.4,.08,0xBCAB9A),(12.4,12.63,.08,0xBCAB9A)):
            b.quad(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,e,z),r.at(i,e,z));b.colours.extend([lin(c)]*4)
        if i%4==0:
            for s in (-8,-4,4,8):
                b.quad(r.at(i,s,.038),r.at(i+1,s,.038),r.at(i+1,s+.12,.038),r.at(i,s+.12,.038));b.colours.extend([lin(0xC3B9AE)]*4)
    b.build(col)


def tile(mesh,points,n):
    u=n%2*.5;v=(1-n//2)*.5
    picture(mesh,points,((u+.003,v+.003),(u+.497,v+.003),(u+.497,v+.497),(u+.003,v+.497)))


def scenery(k):
    art=Painted(k);front=pictured(k,'ReformaFronts');people=pictured(k,'CalaveraCrowds');victory=pictured(k,'AngelDorado');flags=pictured(k,'PapelPicado');trees=pictured(k,'ReformaTrees')
    stone=lin(0xC1AF9F);iron=lin(0x55505B);gold=lin(0xE9AD54);light=lin(0xFFDBA4);orange=lin(0xE18A24)
    def building(d,off,w,high,tileid):
        a,h=site(k,d,off);s=1 if off>0 else -1;depth=9 if high<16 else 15
        art.box(a(0,s*depth/2,0),(w,depth,high),h,lin(0x554E67))
        tile(front,(a(s*w/2,-s*.15,0),a(-s*w/2,-s*.15,0),a(-s*w/2,-s*.15,high),a(s*w/2,-s*.15,high)),tileid)
        for side in (-1,1):
            u=side*(w/2+.15);tile(front,(a(u,0,0),a(u,s*depth,0),a(u,s*depth,high),a(u,0,high)),tileid)
        art.box(a(0,s*depth/2,high),(w+.21,depth+.28,.29),h,iron)
    for d in range(-56,8190,21):
        for side in (-1,1):
            if not(3860<d<4110 and side<0):building(d,side*k.rng.uniform(19,25),k.rng.uniform(16,20.8),k.rng.uniform(8,15),2)
            if d%42==-56%42:building(d+9,side*k.rng.uniform(39,59),k.rng.uniform(20,32),k.rng.uniform(33,78),0 if (d+side)%3 else 3)
            a,h=site(k,d,side*13.4);art.tube(a(0,0,0),.13,.085,5.95,iron,iron,8,iron)
            beam(art,a(0,0,5.75),a(0,-side*.91,6.17),.10,.10,iron);art.tube(a(0,-side*.91,6.11),.27,.35,.17,light,light,10,light)
            if d%42==-56%42 and not(3880<d<4060):
                a,h=site(k,d,side*16)
                for ang in (.28,1.84):
                    x=3.7*math.cos(ang);y=3.7*math.sin(ang);picture(trees,(a(-x,-y,.03),a(x,y,.03),a(x,y,8.3),a(-x,-y,8.3)),UV)
            a,h=site(k,d,side*11.6)
            art.box(a(0,0,.05),(15.1,1.25,.38),h,stone)
            tile(front,(a(-7.55,-.63,.44),a(7.55,-.63,.44),a(7.55,.63,.44),a(-7.55,.63,.44)),1)
            for j in range(-6,7,2):
                art.tube(a(j,k.rng.uniform(-.4,.4),.42),.36,.34,.26,orange,gold,8,orange)
            if d%42==-56%42 or any(abs(d-st)<100 for st in (1470,2720,3970,5560,7485)):
                a,h=site(k,d,side*9.2)
                for j in (-5,5):
                    w=4.65;picture(people,(a(j-w,0,.08),a(j+w,0,.08),a(j+w,0,2.20),a(j-w,0,2.20)),UV)
                for z in (.58,.97):beam(art,a(-10.5,-side*.32,z),a(10.5,-side*.32,z),.06,.06,iron)
                for j in (-10,-3,4,10):art.box(a(j,-side*.32,.05),(.08,.08,1.08),h,iron)
        if d%42==-56%42 and (d<260 or 1350<d<1580 or d>7210):
            a,h=site(k,d,0)
            for j in range(-7,7):
                l=j*1.58;r=l+1.58;z=lambda v:5.3+1.18*(v/11)**2
                beam(art,a(0,l,z(l)),a(0,r,z(r)),.022,.022,iron)
                n=(j+7)%4;tile(flags,(a(0,l+.05,z(l)-.83),a(0,r-.05,z(r)-.83),a(0,r-.05,z(r)),a(0,l+.05,z(l))),n)
    # The reservation separates the parade carriageways and opens for the circle and performers.
    for d in range(-30,8090,12):
        if 2620<d<2830 or 3880<d<4110:continue
        a,h=site(k,d,5.85)
        art.box(a(0,0,.05),(11.7,1.58,.35),h,stone)
        tile(front,(a(-5.87,-.81,.43),a(5.87,-.81,.43),a(5.87,.81,.43),a(-5.87,.81,.43)),1)
        tile(front,(a(-5.87,-.82,.14),a(5.87,-.82,.14),a(5.87,-.82,.57),a(-5.87,-.82,.57)),1)
        for j in (-4.6,-2.3,0,2.3,4.6):
            blossom=lin(k.rng.choice((0xE19A25,0xDC7224,0xF0B140)))
            art.tube(a(j,k.rng.uniform(-.45,.45),.42),.39,.36,.21,orange,blossom,8,blossom)
    for d in (120,4019,7495):
        a,h=site(k,d,0)
        for j in range(27):
            t=j*math.pi/26;v=8.15*math.cos(t);z=2.25+4.55*math.sin(t)
            art.tube(a(0,v,z),.40,.37,.53,orange,gold,9,gold)
            if j<26:
                t2=(j+1)*math.pi/26;beam(art,a(0,v,z+.16),a(0,8.15*math.cos(t2),2.41+4.55*math.sin(t2)),.24,.24,orange)
        for side in (-1,1):
            art.tube(a(0,side*8.15,.06),.31,.29,2.48,orange,gold,9,gold)
    a,h=site(k,4014,-10.8)
    for j,(r,high) in enumerate(((7.3,.32),(6.65,.42),(5.9,.49),(5.1,.61))):
        art.tube(a(0,0,j*.40),r,r,high,stone,stone,16,stone)
    art.box(a(0,0,1.85),(5.1,5.1,3.55),h,stone)
    art.tube(a(0,0,5.35),2.34,2.14,1.2,stone,stone,20,stone)
    art.tube(a(0,0,6.55),1.41,1.10,16.9,stone,lin(0xDBCEBE),24,stone)
    for j in range(16):
        t=j*math.tau/16
        beam(art,a(1.42*math.cos(t),1.42*math.sin(t),6.55),a(1.11*math.cos(t),1.11*math.sin(t),23.45),.10,.11,stone)
    art.tube(a(0,0,23.45),1.75,1.84,.95,stone,stone,16,stone)
    picture(victory,(a(-.7,2.55,24.38),a(.7,-2.55,24.38),a(.7,-2.55,30.5),a(-.7,2.55,30.5)),UV)
    for side in (-1,1):
        art.tube(a(-2.75,side*2.6,1.88),.72,.55,1.62,iron,iron,8,iron)
    return {'efforts':0}


THEME={'lay':route,'road_builder':road,'terrain':{'sea':False,'rise':.5},'road_half_width':12.4,'land':{'low':0x695F65,'mid':0x8B7F80,'high':0x8E8583,'rock':0x786E70},'sky':[0xC68481,0xB8859B,0x817C9A,0x605F84,0x494A71],'haze':0x947D91,'light':[0xFFD19D,1.71],'fill':[0xD5C4E1,0x917987],'sun_radius':13,'sun_altitude':.19,'sun_azimuth':.73}
