"""A condensed South Coast ride from the waterfall escarpment to the glacier lagoon."""
import math
import random

from worldkit import Painted, lin, smooth

LENGTH = 12000
PROFILE = ((0,28),(780,38),(1380,49),(2420,43),(3010,54),(3720,38),(4310,23),
           (5120,31),(6120,53),(7060,42),(7930,55),(8540,40),(9420,39),
           (10150,52),(10960,46),(12000,49))


def height(d):
    for (a, h), (b, k) in zip(PROFILE, PROFILE[1:]):
        if d <= b:
            return h + (k-h)*max(d-a, 0)/(b-a)
    return PROFILE[-1][1]


def bearing(d):
    return .27*math.sin(d/460)+.15*math.sin(d/190)+.32*math.exp(-((d-4030)/290)**2)


# The strip follows a centreline sampled at one metre. Keep stage distance independent of curvature.
CENTRE=[(-150., 0.)]
for metre in range(-149, LENGTH+401):
    x,y=CENTRE[-1]; a=bearing(metre-.5)
    CENTRE.append((x+math.cos(a),y+math.sin(a)))


def at(d, offset, z):
    j=max(0,min(len(CENTRE)-2,math.floor(d)+150));t=d+150-j
    x,y=CENTRE[j];u,v=CENTRE[j+1];a=bearing(d)
    return x+(u-x)*t-math.sin(a)*offset,y+(v-y)*t+math.cos(a)*offset,z


def lay(course,theme,bc):
    rows=[]
    for j in range(math.ceil((LENGTH+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=j*bc.STEP-bc.LEAD_IN;x,y,z=at(d,0,height(d))
        rows.append(dict(d=d,x=x,y=y,z=z,h=bearing(d),k=bearing(d+.5)-bearing(d-.5),
                         g=100*(height(d+.5)-height(d-.5))))
    st=bc.stages(course['plan'])
    return rows,st,LENGTH,sum(s['level']*(s['to']-s['from']) for s in st)/LENGTH,0


def width(d):
    return 3.58-1.42*smooth(8430,8480,d)*(1-smooth(8590,8640,d))


def road(r,st,length,col,theme,bc):
    asphalt=bc.Builder('Road','asphalt');mark=bc.Builder('WhiteLines','paint')
    for i,p in enumerate(r.s[:-1]):
        w=width(p['d']);v=width(r.s[i+1]['d'])
        def band(batch,l,rgt,ll,rr,h):
            batch.quad(r.at(i,l,h),r.at(i,rgt,h),r.at(i+1,rr,h),r.at(i+1,ll,h))
        band(asphalt,w,-w,v,-v,.012)
        for side in (-1,1):
            band(mark,side*(w-.16)+.05,side*(w-.16)-.05,side*(v-.16)+.05,side*(v-.16)-.05,.032)
        if i%3==0 and (p['d']<8430 or p['d']>8640):band(mark,.065,-.065,.065,-.065,.032)
    for batch in (asphalt,mark):batch.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('IcelandLand','terrain');b.colours=[]
    def face(pts,tone,shade):
        b.quad(*pts)
        rgb=lin(tone)
        b.colours.extend([(rgb[0]*f,rgb[1]*f,rgb[2]*f,1) for f in shade])
    for side in (-1,1):
        last=None
        for d in range(-88,LENGTH+199,12):
            base=height(d);coast=smooth(3470,3860,d)*(1-smooth(4880,5480,d))
            lagoon=smooth(9620,9990,d)*(1-smooth(11630,11950,d))
            river=math.exp(-((d-8535)/187)**2)
            water=max(coast*(side==-1),lagoon*(side==1),river)
            row=[]
            for i,lateral in enumerate((3.56,5.2,9,17,33,62,115,223,412,780,1450)):
                roll=(math.sin(d/139+i*.68)*1.7+math.sin(d/47-i*.23)*.55)*min(lateral/40,2)
                h=base-.12+roll*smooth(5,35,lateral)
                h-=(3.9+2.2*math.sin(d/233))*smooth(16,90,lateral)
                if side==1 and 630<d<3700:
                    rim=smooth(630,950,d)*(1-smooth(3370,3700,d))
                    h+=rim*smooth(100,195,lateral)*(51+16*math.sin(d/160)+7*math.sin(d/39))
                if water:h+=(base-4.4-h)*water*smooth(5,39,lateral)
                if river:h-=river*4.8*(1-smooth(8445,8470,d)*(1-smooth(8600,8620,d)) if lateral<4 else 1)
                row.append(at(d,lateral*side,h))
            if last:
                colors=[0x554D47,0x544F45,0x696449,0x716C4D,0x787653,0x78734F,0x69684E,0x565643,0x676853,0x74715C]
                if coast>.45:colors=[0x545153,0x49484C,0x34363C,0x393B41,0x515054,0x45464A,0x43474D,0x424950,0x55585E,0x635D60]
                if 5340<d<7260:colors=[0x534D49,0x555549,0x697052,0x7C8060,0x797D5E,0x6E7156,0x76785B,0x656D55,0x656B56,0x666850]
                for j,tone in enumerate(colors):
                    shade=.94+.06*math.sin(d/35+j*.35)
                    face((last[j],row[j],row[j+1],last[j+1]),tone,(shade,shade,shade*.97,shade*.97))
            last=row
    b.build(col)
    return None,lambda x,y:r.s[r.tree.find((x,y,0))[1]]['z']-.15


def scenery(k):
    art=Painted(k)
    for d in range(-54,LENGTH+90,46):
        for side in (-1,1):
            if 8470<d<8600:continue
            a=bearing(d);off=side*(width(d)+1.15);z=height(d)-.14
            art.box(at(d,off,z),(.15,.115,1.21),a,lin(0xE7B831))
            art.box(at(d,off,z+.93),(.157,.121,.135),a,lin(0xF6E9BB))
    return {'efforts':0}


THEME={'lay':lay,'land_builder':land,'road_builder':road,'land':{'mid':0x6D6C53},'terrain':{'sea':False},
       'sky':[0xFFE6B7,0xE9BC9F,0xB9B2BD,0x8FADC2,0x7092A8],'haze':0xCABDAF,
       'light':[0xFFE4AF,1.7],'fill':[0xC6D3DE,0x80796A],'sun_altitude':.072,'sun_azimuth':.40,
       'palette':{'asphalt':0x37383D,'paint':0xE2DFD3}}
