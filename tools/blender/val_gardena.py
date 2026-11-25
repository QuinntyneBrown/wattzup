"""Val Gardena's villages, meadows and lifts beside the shipped SS242 centre line."""
import math

from sellaronda_kit.lifts import _cable_segment
from worldkit import Painted, lin


def crossing(k):
    """A summer gondola rides a sagging cable across the SS242 above Santa Cristina."""
    station = k.road.index(15145)
    heading = k.s[station]['h']
    anchors = []
    for along, off, clearance in ((-39, -76, 15), (58, 126, 40)):
        x, y, road_z = k.P(station, along, off)
        floor = k.height_at(x, y)
        top = max(floor + clearance, road_z + clearance)
        k.B['stone'].box((x,y,floor-1),(9,7,4.1),heading)
        k.B['whitewash'].box((x,y,floor+3),(9.4,7.4,2.8),heading)
        k.gable(k.B['roof-slate'],(x,y,floor+5.8),10.3,8.2,1.5,heading)
        k.prism(k.B['steel'],(x,y,floor+3),.63,top-floor-3,8,.42)
        k.B['steel'].box((x,y,top-.4),(4.0,2.8,.45),heading)
        anchors.append((x,y,top))
    a,b=anchors
    roll = math.atan2(b[1]-a[1], b[0]-a[0])
    for side in (0,2.0):
        dx,dy=-side*math.sin(roll),side*math.cos(roll)
        _cable_segment(k.B,(a[0]+dx,a[1]+dy,a[2]),(b[0]+dx,b[1]+dy,b[2]),.13,4,26)
    # The cabin hangs below local zero, the attachment point sampled along the cable.
    cabin=Painted(k,'funivia')
    def box(x,y,z,sx,sy,sz,tint):
        cabin.box((x,y,z),(sx,sy,sz),0,lin(tint))
    box(0,0,-.18,1.02,.39,.29,0x404952)
    box(0,0,-1.25,.12,.13,1.12,0xadb6ba)
    box(0,0,-1.43,2.14,1.86,.20,0xf0e6ce)
    box(0,0,-2.76,2.06,1.74,1.37,0x456879)
    box(0,0,-3.25,2.03,1.72,.68,0xae372f)
    box(0,0,-3.33,1.91,1.62,.12,0x374046)
    for side in (-1,1):
        for x in (-.95,0,.95):
            box(x,side*.88,-2.67,.065,.048,1.18,0xd9d3bc)
        box(0,side*.895,-2.78,2.06,.045,.065,0xe2d5b8)
        box(side*1.04,0,-2.62,.05,.07,1.12,0xd9d3bc)
    def point(p):return [round(p[0],2),round(p[2],2),round(-p[1],2)]
    return dict(start=point(a), end=point(b), yaw=roll)


def cableways(k):
    c=crossing(k)
    return [{'from':c['start'],'to':c['end'],'yaw':round(c['yaw'],4),
             'sag':4.0,'traverseSeconds':32.0,'dwellSeconds':3.0}]


def valley(k):
    """Fixed churches distinguish the three village approaches. Meadow furniture follows the ground."""
    import random
    from sellaronda_kit.villages import _onion_dome_church, _village_chalet

    rng = random.Random(2114)
    art = Painted(k)
    villages = ((156, -1, 'copper-patina'), (8485, 1, 'roof-slate'), (32680, -1, 'copper-patina'))
    for station, side, metal in villages:
        idx = k.road.index(station)
        x,y,_ = k.road.at(idx, side*(k.kerb+15))
        _onion_dome_church(k.B,k,x,y,k.height_at(x,y),k.s[idx]['h'],metal)
        # Warm stone voussoirs, deep-set nave windows and contrasting pilasters above the yard.
        yaw=k.s[idx]['h']
        base=k.height_at(x,y)
        def church_box(along, across, up, dims, tint):
            xx=x+math.cos(yaw)*along-math.sin(yaw)*across
            yy=y+math.sin(yaw)*along+math.cos(yaw)*across
            art.box((xx,yy,base+up),dims,yaw,lin(tint))
        for bank in (-1,1):
            for arch in (-5.6,-1.9,1.9,5.6):
                church_box(arch,bank*4.66,3.42,(1.35,.15,2.57),0x827763)
                church_box(arch,bank*4.76,3.56,(.99,.13,2.23),0x4c5758)
                church_box(arch,bank*4.84,3.54,(.075,.07,2.28),0xd3c7ae)
                church_box(arch,bank*4.85,4.66,(1.06,.065,.085),0xe2d7b9)
                church_box(arch,bank*4.83,3.37,(1.52,.30,.16),0xd3c7ae)
            for along in (-7.8,-3.74,0,3.74,7.8):
                church_box(along,bank*4.58,1.2,(.28,.32,6.5),0xd3c6a5)
            church_box(0,bank*4.67,7.45,(16.4,.28,.32),0xc3b394)
        for distance in ({156:110,8485:8430,32680:32630}[station],):
            i=k.road.index(distance)
            for step in (-.94,.94):
                art.box(k.P(i,step,-7.35,.06),(.09,.13,1.62),k.s[i]['h'],lin(0x858b86))
        for along in (-200,-151,-98,-46,24,76,130,200,275):
            i=k.road.index(station+along)
            for bank in (-1,1):
                if bank==side and abs(along)<49:continue
                extra=rng.uniform(8.5,18)
                width=rng.uniform(11,17)
                if not k.room(i,bank*(k.kerb+extra+4.5),width):continue
                _village_chalet(k.B,k,k.road,i,bank,extra,width,9,2+(i%2),k.height_at)
    for station in range(1100,37950,383):
        if any(abs(station-town)<280 for town,_,_ in villages):continue
        i=k.road.index(station)
        side=1 if i%3 else -1
        offset=side*(k.kerb+26+i%29)
        x,y,_=k.road.at(i,offset)
        if not k.room(i,offset,13):continue
        z=k.height_at(x,y)
        yaw=k.s[i]['h']+.18*math.sin(i)
        # Weatherboard hay loft, pitched overhanging roof and small stacked woodpile.
        art.box((x,y,z-.8),(7.4,5.3,1.9),yaw,lin(0x827569))
        art.box((x,y,z+1),(7.8,5.6,2.7),yaw,lin(0x745039))
        art.roof((x,y,z+3.7),8.9,6.7,2.1,yaw,lin(0x534638))
        for beam in range(-3,4):
            for bank in (-1,1):
                xx=x+math.cos(yaw)*beam-math.sin(yaw)*bank*2.86
                yy=y+math.sin(yaw)*beam+math.cos(yaw)*bank*2.86
                art.box((xx,yy,z+1),(.12,.14,2.68),yaw,lin(0x4f3728))
        for j in range(9):
            at=k.road.index(station-16+j*4)
            xx,yy,_=k.road.at(at,side*(k.kerb+3.2));zz=k.height_at(xx,yy)
            art.box((xx,yy,zz-.1),(.17,.17,1.33),k.s[at]['h'],lin(0x8f7550))
            if j<8:
                nx,ny,_=k.road.at(at+1,side*(k.kerb+3.2));nz=k.height_at(nx,ny)
                for rail in (.49,.96):
                    art.box(((xx+nx)/2,(yy+ny)/2,(zz+nz)/2+rail),(math.hypot(nx-xx,ny-yy),.1,.13),math.atan2(ny-yy,nx-xx),lin(0xa28b62))
        for j in range(6):
            at=k.road.index(station+rng.uniform(-85,85))
            xx,yy,_=k.road.at(at,side*rng.uniform(35,84))
            if not k.road.clear_of_road(xx,yy,14,at):continue
            zz=k.height_at(xx,yy)
            height=rng.uniform(8.9,16.2)
            if j%3:
                art.tube((xx,yy,zz-.25),.23,.10,height*.85,lin(0x5c5342),lin(0x77664c),6)
                for crown in range(6):
                    h=height*(.20+.115*crown)
                    radius=height*(.181-.022*crown)
                    art.tube((xx,yy,zz+h),radius,.09,height*.32,lin(0x587841),lin(0x9daf61),9)
            else:
                k.pine(xx,yy,zz,height/11)
    # Low mortared retaining walls along the outside of selected sweeping bends.
    for station in (1930,8090,14940,23270,32160):
        for d in range(station,station+210,3):
            i=k.road.index(d)
            x,y,z=k.road.at(i,-(k.kerb+1.85));yaw=k.s[i]['h']
            if d%4==0:continue
            art.box((x,y,z-.55),(4.2,.66,1.29),yaw,lin(rng.choice((0xa89e88,0x968e7c,0xb4aa94))))
            art.box((x,y,z+.73),(4.22,.78,.16),yaw,lin(0xc3b9a0))


def forest(k):
    """Trees are grounded against the same mesh interpolation as the villages."""
    import random
    rng=random.Random(52311)
    trees=[]
    for station in range(-35,38550,13):
        if any(abs(station-centre)<155 for centre in (156,8485,32680)):continue
        meadow=math.cos(station/295)>.52
        for j in range(4 if meadow else 7):
            side=rng.choice((-1,1))
            lane=side*(rng.uniform(51,190) if meadow else rng.uniform(14,148))
            x,y,_=k.road.pos(station+rng.uniform(-11,11),lane)
            nearest=k.road.tree.find((x,y,0))[2]
            if nearest<13:continue
            tile=rng.choice((0,1)) if nearest>60 else rng.choice((1,2,3))
            trees.append([round(x,1),round(k.height_at(x,y)-.25,1),round(-y,1),round(rng.uniform(9,19),1),tile])
    return trees
