"""Highway 82 climbs the west approach to the 12,095 ft Continental Divide."""
import math
from worldkit import Painted, lin, smooth

LENGTH = 15200
HAIRPINS = ((7860,44),(8820,-45),(10390,43),(12090,-44),(13910,52),(14560,-47))


def bearing(d):
    heading=.20+.15*math.sin(d/302)+.085*math.sin(d/96)
    for centre,radius in HAIRPINS:
        arc=2.67*abs(radius)
        t=max(0,min(1,(d-centre)/arc+.5))
        heading+=math.copysign(2.67,radius)*t
    return heading


def lay(course,theme,bc):
    st=bc.stages(course['plan']);length=st[-1]['to']
    mean=sum(s['level']*(s['to']-s['from']) for s in st)/length
    base=(3687-2790)/length
    grade_per_level=.49
    stages=[];z=2790
    for s in st:
        g=base+(s['level']-mean)*grade_per_level/100
        stages.append((s['from'],s['to'],z,g))
        z+=(s['to']-s['from'])*g
    x=y=0;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;heading=bearing(d)
        if i:
            mid=bearing(d-bc.STEP*.5)
            x+=bc.STEP*math.cos(mid);y+=bc.STEP*math.sin(mid)
        a,b,z,g=next((r for r in stages if d<r[1]),stages[-1])
        rows.append(dict(d=d,x=x,y=y,z=z+(min(b,max(a,d))-a)*g,h=heading,k=bearing(d+.5)-bearing(d-.5),g=100*g))
    return rows,st,length,mean,grade_per_level


def road(r,st,length,col,theme):
    import sys
    bc=sys.modules[type(r).__module__]
    asphalt=bc.Builder('Road','asphalt');paint=bc.Builder('HighwayPaint','paint');yellow=bc.Builder('CentreLine','yellow')
    for i in range(len(r.s)-1):
        def band(batch,a,b,z):
            batch.quad(r.at(i,a,z),r.at(i,b,z),r.at(i+1,b,z),r.at(i+1,a,z))
        band(asphalt,3.63,-3.63,.012)
        for side in (-1,1):
            band(yellow,side*.133+.052,side*.133-.052,.029)
            band(paint,side*3.36+.055,side*3.36-.055,.029)
    for batch in (asphalt,paint,yellow):batch.build(col)


def land(r,col,theme,bc):
    batch=bc.Builder('SawatchGround','terrain');batch.colours=[]
    rows=r.s
    lookout=r.pos(12080);direction=rows[r.index(12080)]['h']
    east=(math.cos(direction),math.sin(direction));north=(-east[1],east[0])
    def altitude(x,y):
        _,i,dist=r.tree.find((x,y,0));p=rows[i]
        side=(x-p['x'])*-math.sin(p['h'])+(y-p['y'])*math.cos(p['h'])
        # Rise consistently to the north, including on the return traverses.
        north_offset=y-p['y']
        slope=.22*north_offset if p['d']>6900 else .12*north_offset
        undulation=math.sin(x/115+y/172)*11+math.sin(y/52-x/116)*4.6+math.sin(x/24+y/32)*1.8
        z=p['z']-1.2+smooth(5,44,dist)*(slope+undulation)
        if p['d']<5680 and side<0:
            bed=-10-2*math.sin(p['d']/55) if 1940<p['d']<2560 else -(16+8*math.sin(p['d']/130))
            channel=1-smooth(3,12,abs(side-bed))
            z-=channel*4.8*smooth(5,11,dist)
        # The headwall below the eastern overlook opens to both lakes. Keep the other traverses on their beds.
        dx,dy=x-lookout[0],y-lookout[1]
        along=dx*east[0]+dy*east[1];across=dx*north[0]+dy*north[1]
        if -120 < along < 2400:
            # A broad glacial bowl joins the shoulders gradually, including the outside of the bend.
            width = 170 + max(0, along) * .67
            basin = 1 - smooth(width * .60, width * 1.45, abs(across - along * .21))
            taper = smooth(-120, 50, along) * (1 - smooth(1900, 2400, along))
            level = lookout[2] - 4.5 - min(143, max(0, along) * .39)
            z += basin * taper * smooth(5, 44, dist) * (min(z, level) - z)
        return z
    def face(points,tone):
        batch.quad(*points);batch.colours.extend([lin(tone)]*4)
    # The entire hillside shares one terrain surface, including under both arms of each hairpin.
    cell=16
    xs=range(math.floor(min(p['x'] for p in rows))-260,math.ceil(max(p['x'] for p in rows))+290,cell)
    ys=range(math.floor(min(p['y'] for p in rows))-300,math.ceil(max(p['y'] for p in rows))+260,cell)
    last=None
    for y in ys:
        row=[(x,y,altitude(x,y)) for x in xs]
        if last:
            for j,(p,q) in enumerate(zip(row,row[1:])):
                x,_,z=p
                coarse=math.sin(x/59+y/54)+math.cos(y/37-x/83)
                if z<3260:color=0x7D8056 if coarse>0 else 0x74784F
                elif z<3450:color=0x928061 if coarse>.2 else 0x76775D
                else:color=0x9D836B if coarse>.65 else 0x83836E if coarse>-.5 else 0x8D7864
                face((last[j],last[j+1],q,p),color)
        last=row
    for sign in (-1,1):
        last=None
        for i in range(0,len(rows),2):
            row=[]
            for off in (3.6,5,9,16):
                x,y,z=r.at(i,sign*off)
                row.append((x,y,z-.12 if off<6 else altitude(x,y)+.35))
            if last:
                for j,c in enumerate((0x8C8270,0x95856C,0x848061)):
                    face((last[j],row[j],row[j+1],last[j+1]),c)
            last=row
    batch.build(col)
    return None,altitude


def scenery(k):
    art=Painted(k)
    for d in range(7112,LENGTH,4):
        i=k.road.index(d);p=k.road.s[i];side=-1 if math.cos(p['h'])>0 else 1
        if abs(p['k'])<.009 and (d//180)%3:continue
        off=side*4.06
        art.box(k.road.at(i,off,-.28),(.14,.15,.91),p['h'],lin(0x8A837B))
        art.box(k.road.at(i,off,.47),(4.18,.11,.25),p['h'],lin(0xB5B1A2))
    from independence_landmarks import landmarks
    landmarks(k,art)
    return {'efforts':0}


THEME={'lay':lay,'surface_builder':road,'land_builder':land,'land':{'mid':0x8A8066},'terrain':{'sea':False},
       'sky':[0xE3DCCD,0xBDCED6,0x8FB1C8,0x6598BF,0x5288B2],'haze':0xCCD1CD,
       'light':[0xFFE9C6,1.48],'fill':[0xC5D7E6,0x8B806C],'sun_altitude':.50,'sun_azimuth':-.85,
       'palette':{'asphalt':0x44464A,'yellow':0xE8BA3F,'paint':0xE4E0D5}}
