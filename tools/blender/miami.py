"""Ocean Drive after rain, with Lummus Park and the Atlantic on the left."""
import math
from bondi import beam
from iten_landmarks import picture, pictured, site
from worldkit import Painted, lin, smooth


def heading(distance):
    # scene-bend.ts counts clockwise, while Blender counts anticlockwise from +X.
    return -math.radians(5)*math.sin(distance/250)*math.cos(distance/(2.7*250)+1)


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    x=y=0;z=4.4;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;s=next((s for s in stages if d<s['to']),stages[-1])
        grade=(s['level']-mean)*.00055 if 0<=d<length else 0
        rows.append(dict(d=d,x=x,y=y,z=z,h=heading(d),k=heading(d+.5)-heading(d-.5),g=100*grade))
        turn=heading(d+bc.STEP/2);x+=bc.STEP*math.cos(turn);y+=bc.STEP*math.sin(turn);z+=bc.STEP*grade
    return rows,stages,length,mean,.055



def pavement(r,st,length,col,bc):
    b=bc.Builder('OceanDrive','terrain');b.colours=[]
    for i,p in enumerate(r.s[:-1]):
        bands=[(-18,-6,.17,0x51435B),(-6,-5.8,.16,0xAB8E9E),(-5.8,5.8,0,0x282730),(5.8,6.0,.15,0x9FA1AD),(6,15,.15,0x51465F),(-.14,-.05,.016,0xCD9859),(.05,.14,.016,0xCD9859),(-4.64,-4.51,.014,0xB4B3C2)]
        if 1<=i%48<=2:
            for j in range(-5,6):bands.append((j-.24,j+.24,.023,0xC8BFD3))
        for a,e,z,t in bands:
            b.quad(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,e,z),r.at(i,e,z));b.colours.extend([lin(t)]*4)
    b.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('Oceanfront land','terrain');b.colours=[]
    sea=bc.Builder('AtlanticSurf','terrain');sea.colours=[]
    for i in range(0,len(r.s)-4,4):
        for a,e,y,shade in ((-530,-6,-.11,0x352944),(6,15,.10,0x415047),(15,25,-.38,0x65586B),(25,52,-.73,0x9B8490)):
            b.quad(r.at(i,a,y),r.at(i+4,a,y),r.at(i+4,e,y),r.at(i,e,y));b.colours.extend([lin(shade)]*4)
        for a,e,c in ((51,58,0x63768F),(58,83,0x283A58),(83,240,0x20334F),(240,2800,0x17223C)):
            sea.quad(r.at(i,a,-.80),r.at(i+4,a,-.80),r.at(i+4,e,-.80),r.at(i,e,-.80));sea.colours.extend([lin(c)]*4)
    def height(x,y):
        _,i,_=r.tree.find((x,y,0));return r.s[i]['z']-.12
    b.build(col);sea.build(col);return None,height


def panel(mesh,at,u,v,z,w,h,tile,angle=0):
    dx=math.cos(angle)*w/2;dy=math.sin(angle)*w/2;a,b=tile%2*.5,(1-tile//2)*.5
    picture(mesh,(at(u-dx,v-dy,z),at(u+dx,v+dy,z),at(u+dx,v+dy,z+h),at(u-dx,v-dy,z+h)),((a+.007,b+.007),(a+.493,b+.007),(a+.493,b+.493),(a+.007,b+.493)))


def car(art,a,h,colour):
    chrome=lin(0xB9C1CF);dark=lin(0x211D30)
    old=None
    for u,width,top in ((-2.53,.65,.84),(-2.32,.89,1.14),(-1.60,.96,1.05),(-.6,.99,1.02),(1.08,.96,1.05),(1.96,.9,.93),(2.43,.69,.82)):
        loop=[a(u,-width*.83,.43),a(u,-width,.64),a(u,-width,top-.12),a(u,-width*.83,top),a(u,width*.83,top),a(u,width,top-.12),a(u,width,.64),a(u,width*.83,.43)]
        if old:
            for j in range(8):
                q=(j+1)%8;shade=colour if j in (2,3,4) else tuple(x*.74 for x in colour[:3])+(1,)
                art.face((old[j],loop[j],loop[q],old[q]),(shade,)*4)
        else:art.face(tuple(reversed(loop)),(colour,)*8)
        old=loop
    art.face(tuple(old),(colour,)*8)
    art.box(a(-.23,0,.98),(1.55,1.55,.11),h,dark)
    for u in (-.74,.17):art.box(a(u,0,1.07),(.20,1.39,.38),h,lin(0xB6ACAA))
    glass=lin(0x7296A9)
    art.face((a(.86,-.82,1.03),a(.86,.82,1.03),a(.60,.76,1.62),a(.60,-.76,1.62)),(glass,)*4)
    for v in (-.82,.82):beam(art,a(.86,v,1.04),a(.60,v*.92,1.64),.052,.047,chrome)
    beam(art,a(.60,-.77,1.63),a(.60,.77,1.63),.052,.065,chrome)
    for side in (-1,1):
        art.box(a(0,side*.965,.69),(4.35,.04,.073),h,chrome)
        for u in (-1.46,1.39):
            for r,v,tint in ((.407,.978,dark),(.314,.986,lin(0xBFB8BD)),(.206,.989,chrome)):
                for j in range(12):
                    lo=j*math.tau/12;hi=(j+1)*math.tau/12
                    art.face((a(u,side*v,.44),a(u+r*math.cos(lo),side*v,.44+r*math.sin(lo)),a(u+r*math.cos(hi),side*v,.44+r*math.sin(hi))),(tint,)*3)
        art.box(a(-2.46,side*.65,.79),(.07,.28,.16),h,lin(0xFA3862))
        art.box(a(2.41,side*.62,.78),(.07,.31,.18),h,lin(0xE7CDA6))
    for u in (-2.49,2.48):art.box(a(u,0,.48),(.12,1.84,.12),h,chrome)



def lifeguard(art,tubes,k,d):
    a,h=site(k,d,28);mint=lin(0x489FA0);pink=lin(0xC85882);yellow=lin(0xDBAA4A)
    for u in (-2.3,2.3):
        for v in (-1.6,1.6):art.box(a(u,v,-1),(0.22,.23,3.45),h,pink)
    art.box(a(0,0,2.38),(6.6,5.5,.25),h,mint);art.box(a(0,.25,2.62),(4.8,3.0,2.47),h,pink)
    art.box(a(0,-1.27,3.48),(4.45,.12,1.05),h,lin(0x394D63));art.roof(a(0,0,5.22),6.5,4.85,1.17,h,yellow)
    for j in range(8):art.box(a(-2.8,-2.7-j*.32,2.4-j*.43),(1.05,.38,.12),h,mint)
    for u in (-3,-1.5,0,1.5,3):art.box(a(u,-2.44,2.56),(.10,.1,.87),h,yellow)
    art.box(a(0,-2.44,3.4),(6.25,.13,.09),h,yellow)


def scenery(k):
    art=Painted(k);facades=pictured(k,'DecoFronts');foliage=pictured(k,'LummusPalms');blades=pictured(k,'DecoBlades')
    for name in ('NeonTubes','WetNeon','BeachGlow'):k.B[name]=type(k.B['terrain'])(name,'terrain')
    tubes=Painted(k,'NeonTubes');wet=pictured(k,'WetNeon');glow=Painted(k,'BeachGlow')
    neon=[lin(c) for c in (0x3DDBFF,0xF153B1,0xD98AFF,0x5CE5A6)]
    for d in range(-61,8550,26):
        a,h=site(k,d,-12.25);tile=(d//26)%4
        if abs(d-114)<60:tile=0
        elif abs(d-1476)<43:tile=2
        elif abs(d-6078)<52:tile=1
        high=(12,16,10.5,12.9)[tile];w=25.5;c=neon[tile]
        art.box(a(0,-4.8,-.1),(w,9.6,high+.1),h,lin((0x8E829D,0x7C7195,0x91A0A1,0xBE94A1)[tile]))
        panel(facades,a,0,.065,.13,w,high,tile)
        for z in (high*.62,high-.12):
            art.box(a(0,.16,z-.14),(w,.93,.24),h,lin(0x7F8299))
            tubes.box(a(0,.66,z),(w,.083,.085),h,c)
        tubes.box(a(-w*.32,.70,high*.53),(.24,.19,high*.55),h,c)
        blade=a
        panel(blades,blade,-4.85,1.04,high*.34,2.00,high*.70,tile,math.pi/2)
        if tile in (0,1):
            for j in range(3):
                span=(6.2 if tile==0 else 9.6)-2*j
                art.box(a(0,-.7,high+j*.73),(span,2.0,.77),h,lin(0x8B879E))
                tubes.box(a(0,.32,high+.69+j*.73),(span,.12,.095),h,c)
        panel(foliage,a,0,3.5,.18,8.5,3.6,2);panel(foliage,a,-8,4.78,.18,3.9,2.25,3,.4)
        if d%3:
            ca,ch=site(k,d+6,-4.53);car(art,ca,ch,lin((0xE87561,0x579BAF,0xB04F85)[d%3]))
        # A grazing-angle view stretches streaks along the direction of travel. Leave gaps in the surface.
        for j in range(13):
            p,yaw=site(k,d,0);u=k.rng.uniform(-11,9);v=k.rng.uniform(-5.75,1.5);span=k.rng.uniform(5.4,15.2);w=k.rng.uniform(.19,1.0)
            tone=tuple(t*.72 for t in c[:3])+(1,);end=tuple(t*.10 for t in c[:3])+(1,)
            picture(wet,(p(u,v,.032),p(u+span,v+w*.14,.032),p(u+span,v+w,.032),p(u,v+w*.94,.032)),((0,0),(1,0),(1,1),(0,1)))
            wet.colours[-4:]=(tone,end,end,tone)
        for side in (-1,1):
            off=(-7.6 if side<0 else 10.8)+k.rng.uniform(-.75,.75);a,h=site(k,d-9.5,off)
            height=k.rng.uniform(8.2,12.3);tile=0 if (side>0)==(d%3==0) else 1
            for angle in (.28,1.64):panel(foliage,a,0,0,.14,height*.78,height,tile,angle)
        a,h=site(k,d+10,6.5)
        art.tube(a(0,0,0),.12,.075,6.4,lin(0x484454),lin(0x635E72),7)
        glow.tube(a(0,0,6.34),.22,.19,.27,lin(0xE5B875),lin(0xFFDAA3),8)
    for d in (4402,4495,7080):lifeguard(art,tubes,k,d)
    far=Painted(k,'peaks')
    for i in range(36):
        a,h=site(k,8420,240+i*14);high=k.rng.uniform(20,110);wide=k.rng.uniform(9,22)
        far.box(a(0,0,-5),(wide,wide*.86,high),h,lin(0x333749))
        for j in range(2,int(high/3),2):
            lit=lin(0xCBAB8F if (j+i)%3 else 0x849AB9)
            far.box(a(-wide*.51,0,j*3),(.15,wide*.68,.36),h,lit)
            far.box(a(0,-wide*.435,j*3),(wide*.73,.15,.36),h,lit)
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':pavement,'terrain':{'sea':False},'road_half_width':5.8,
       'land':{'mid':0x303147},'sky':[0x362843,0x262240,0x151B39,0x10152F,0x090E21],'haze':0x3A344C,
       'light':[0xC2C7E8,1.1],'fill':[0xAAA5CD,0x785F80],'sun_radius':10,'sun_altitude':.16,'sun_azimuth':.46}
