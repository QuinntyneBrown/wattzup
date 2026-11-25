"""The Great Ocean Road, from the Memorial Arch to the surviving offshore span."""
import math
from worldkit import Painted,lin

LENGTH=8450
PROFILE=((0,12),(460,18),(980,35),(1670,17),(2180,11),(3120,51),(3760,64),
         (4390,39),(5050,47),(5720,36),(6550,44),(7080,25),(7710,38),(8450,34))
VIEWS=(1670,5050,6550,8240)

def elevation(d):
    for (a,z),(b,h) in zip(PROFILE,PROFILE[1:]):
        if d<=b:return z+(h-z)*max(0,d-a)/(b-a)
    return PROFILE[-1][1]

def heading(d):
    h=.17*math.sin(d/122)+.22*math.sin(d/233)+.13*math.sin(d/79)
    for view in VIEWS:
        t=d-view
        if -190<t<220:
            f=min(1,(t+190)/110,(220-t)/100)
            target=.93-.99*max(0,min(1,(t-18)/87))
            h=h*(1-f)+target*f
    return h

points=[(-140.,0.)]
for d in range(-139,LENGTH+321):
    x,y=points[-1];h=heading(d-.5);points.append((x+math.cos(h),y+math.sin(h)))

def pos(d,off=0):
    i=max(0,min(len(points)-2,math.floor(d)+140));t=d+140-i
    x,y=points[i];a,b=points[i+1];h=heading(d)
    return x+(a-x)*t-math.sin(h)*off,y+(b-y)*t+math.cos(h)*off

def lay(course,theme,bc):
    stages=bc.stages(course['plan']);rows=[]
    for i in range(math.ceil((LENGTH+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;x,y=pos(d);rows.append(dict(x=x,y=y,z=elevation(d),d=d,h=heading(d),
                  k=(heading(d+1)-heading(d-1))/2,g=100*(elevation(d+.5)-elevation(d-.5))))
    return rows,stages,LENGTH,sum(s['level']*(s['to']-s['from']) for s in stages)/LENGTH,0

def lip(d):
    nearest=min(abs(d-v) for v in VIEWS)
    return 7.5+min(48,nearest*.13)+205*math.exp(-((d-3380)/610)**4)

def surface(d,lane):
    if lane>0:return elevation(d)-.22+.024*max(0,lane-6)
    rise=max(0,-lane-7)
    return elevation(d)-.22+rise*(.23+.12*math.sin(d/131))+.08*rise*math.sin(d/57+lane/24)

def road(road,st,length,col,theme,bc):
    asphalt=bc.Builder('Road','asphalt');yellow=bc.Builder('CentreLine','yellow');paint=bc.Builder('RoadPaint','paint')
    for i in range(len(road.s)-1):
        def band(batch,a,b,up):batch.quad(road.at(i,a,up),road.at(i,b,up),road.at(i+1,b,up),road.at(i+1,a,up))
        band(asphalt,4.5,-4.5,.006)
        for side in (-1,1):
            band(yellow,*sorted((side*.055,side*.16),reverse=True),.028)
            band(paint,*sorted((side*4.28,side*4.40),reverse=True),.027)
    for b in (asphalt,yellow,paint):b.build(col)

def land(r,col,theme,bc):
    def builder(name):
        b=bc.Builder(name,'terrain');b.colours=[];b.uvs=[];return b
    headland=builder('Clifftop');cliff=builder('PortLimestone');sea=builder('SouthernOcean');beach=builder('Beach')
    signature=builder('Apostle');arch=builder('LondonArch')
    def quad(batch,pts,col,uv=None):
        batch.quad(*pts);batch.colours.extend([lin(col)]*4)
        batch.uvs.extend(uv or [(x/52+.26*y/52,z/31) for x,y,z in pts])
    def edge(d):return (*pos(d,lip(d)),surface(d,lip(d)))
    def cap(d):
        return [(*pos(d,l),surface(d,l)) for l in (-390,-180,-75,-33,-13,-7,-4.5,4.5,6,lip(d))]
    def coast(d):
        x,y,z=edge(d)
        return [(x+f*2.6*math.sin(d/31), y+v+f*(9*math.sin(d/120)+3*math.sin(d/37)),h)
                for f,v,h in ((0,0,z),(0.1,1.4,z-1.1),(.25,2.1,z*.79),(.45,2.95,z*.69),
                               (.65,4.7,z*.48),(.82,5.5,z*.32),(1,7.4,z*.11),(1,9,1.55),(1,13,-1.6))]
    for i,d in enumerate(range(-96,LENGTH+145,8)):
        top=cap(d);wall=coast(d);x,y,z=edge(d)
        sandwidth=9+38*math.exp(-((d-6550)/95)**2)+13*(1+math.sin(d/205))
        foot=wall[-1];strand=[(foot[0],foot[1]+v,level) for v,level in ((-4,2.5),(sandwidth*.52,.94),(sandwidth,.1),(sandwidth+10,-1.6))]
        offshore=(0,5,12,20,29,40,52,67,84,103,130,165,220,300,430,660,1050,1950,5200)
        tide=[(x,y+14+off,-.03) for off in offshore]
        if i:
            for j in range(len(top)-1):
                if j==6:continue
                shade=(0x637D64,0x6F805F,0x788967,0x81916A,0x788463,0x94977A,0x86866B,0x9B9980,0x83906A)[j]
                quad(headland,(prevtop[j],top[j],top[j+1],prevtop[j+1]),shade,[(q[0]/16,q[1]/17) for q in (prevtop[j],top[j],top[j+1],prevtop[j+1])])
            for j in range(len(wall)-1):
                quad(cliff,(prevwall[j+1],wall[j+1],wall[j],prevwall[j]),(0xDEC495,0xD8AB76,0xC99866,0xD0A16A,0xC58C58,0xD0A672,0x9D7758,0x846C57)[j])
            for j in range(3):quad(beach,(prevsand[j],strand[j],strand[j+1],prevsand[j+1]),0xE9CC9B)
            for j in range(len(tide)-1):
                quad(sea,(prevtide[j],tide[j],tide[j+1],prevtide[j+1]),0xffffff,[(d-8,offshore[j]),(d,offshore[j]),(d,offshore[j+1]),(d-8,offshore[j+1])])
        prevtop=top;prevwall=wall;prevtide=tide;prevsand=strand
    def viewpoint(d,along,across):
        u,v=pos(d);h=heading(d+8)
        return u+along*math.cos(h)-across*math.sin(h),v+along*math.sin(h)+across*math.cos(h)
    def stack(batch,x,y,height,radius,seed):
        last=None
        for j,(f,scale) in enumerate(((0,1.18),(.07,1.05),(.13,1.12),(.29,.93),(.38,.98),(.48,.82),(.61,.87),(.73,.78),(.81,.79),(.96,.65),(1,.46))):
            ring=[]
            for i in range(35):
                a=i*math.tau/35;rad=radius*scale*(1+.15*math.sin(3*a+seed)+.08*math.sin(7*a-seed)+.04*math.cos(11*a+.21*j))
                ring.append((x+math.cos(a)*rad*1.17+f*2,y+math.sin(a)*rad*.86, -.8+height*f+f*(.8*math.sin(3*a+seed)+.45*math.cos(5*a))))
            if last:
                for n in range(35):
                    m=(n+1)%35
                    quad(batch,(last[n],last[m],ring[m],ring[n]),0xE9C69C if f>.25 else 0x978978)
            last=ring
        for n in range(1,34):
            pts=(last[0],last[n],last[n+1]);batch.tri(*pts);batch.colours.extend([lin(0xB1A573)]*3);batch.uvs.extend([(px/57,py/42) for px,py,pz in pts])
    for i,(along,across,height,rad) in enumerate(((187,21,42,14),(275,85,51,24),(397,-20,57,28),(491,90,44,22),(662,31,63,27),(819,145,46,18))):
        x,y=viewpoint(5050,along,across);stack(signature if i==0 else cliff,x,y,height,rad,i+.8)
    # Loch Ard has a sheltered strand and two enclosing headlands, with a narrow mouth between.
    for j,(along,across,rad) in enumerate(((165,-45,46),(191,65,38),(253,147,22))):
        x,y=viewpoint(6550,along,across);stack(cliff,x,y,34+j*3,rad,3+j)
    # Two massive abutments and a rock roof spanning a genuine through opening.
    x,y=viewpoint(8240,199,13);h=heading(8240)+math.pi/2
    def archpoint(u,v,z):return x+u*math.cos(h)-v*math.sin(h),y+u*math.sin(h)+v*math.cos(h),z
    for i in range(-28,28):
        a,b=i*1.9,(i+1)*1.9
        def profile(u):
            crown=31+1.5*math.cos(u/11)+.8*math.sin(u/4)
            opening=18*math.sqrt(max(0,1-(u/28)**2)) if abs(u)<28 else -.8
            return opening,crown
        lo,hi=profile(a);ll,hh=profile(b)
        for v in (-13,13):
            quad(arch,(archpoint(a,v,lo),archpoint(b,v,ll),archpoint(b,v,hh),archpoint(a,v,hi)),0xE5B47B,[(a/41,lo/35),(b/41,ll/35),(b/41,hh/35),(a/41,hi/35)])
        quad(arch,(archpoint(a,-13,hi),archpoint(b,-13,hh),archpoint(b,13,hh),archpoint(a,13,hi)),0xAEAA7B)
        quad(arch,(archpoint(a,13,lo),archpoint(b,13,ll),archpoint(b,-13,ll),archpoint(a,-13,lo)),0xAF8760)
    for u in (-53.2,53.2):
        low,high=profile(u);quad(arch,(archpoint(u,-13,low),archpoint(u,13,low),archpoint(u,13,high),archpoint(u,-13,high)),0xCFA57B)
    for batch in (headland,cliff,sea,beach,signature,arch):batch.build(col)
    return None,lambda x,y:r.s[r.tree.find((x,y,0))[1]]['z']-.2

def scenery(k):
    art=Painted(k);rng=k.rng
    boards=k.B['paint'];boards.name='CoastSigns';boards.uvs=[]
    beam=Painted(k,'wood');beam.b.name='MemorialArch'
    def at(d,l):
        x,y=pos(d,l);z=surface(d,l);h=heading(d)
        def pt(u,v,w):return x+u*math.cos(h)-v*math.sin(h),y+u*math.sin(h)+v*math.cos(h),z+w
        return pt,h
    def sign(q,offset,width,base,high,tile):
        a=tile/4;b=(tile+1)/4
        boards.quad(q(offset,width/2,base),q(offset,-width/2,base),q(offset,-width/2,high),q(offset,width/2,high))
        boards.uvs.extend([(a+.001,.002),(b-.001,.002),(b-.001,.998),(a+.001,.998)])
    # Paired timber posts, steel straps and a lintel above both lanes.
    q,h=at(125,0)
    for side in (-1,1):
        for u in (-.7,.70):
            beam.box(q(u,side*6.28,-.35),(.62,.62,7.82),h,lin(0x77563E))
            for high in (.95,5.68,6.72):
                beam.box(q(u,side*6.28,high),(.65,.65,.13),h,lin(0x5F6261))
            for j in range(8):
                beam.box(q(u,side*(6.13-.21*j),5.12+.213*j),(.42,.38,.48),h,lin(0x775B43))
        beam.box(q(0,side*6.28,6.39),(2.5,.75,.65),h,lin(0x72533B))
    for u in (-.7,.7):beam.box(q(u,0,6.56),(.65,14.7,.98),h,lin(0x755138))
    sign(q,-1.05,9.8,6.67,7.42,0)
    for d in range(440,8420,24):
        if 2670<d<4110:continue
        q,h=at(d,5.25)
        for j in range(4):
            t,_=at(d+j*6,5.25);art.box(t(0,0,-.15),(.15,.15,.89),h,lin(0x82776A))
            art.box(t(2.8,0,.57),(6.03,.115,.21),heading(d+j*6),lin(0xB7BDBB))
        if d%168==104:
            q,h=at(d,-5.8);art.box(q(0,0,-.1),(.11,.11,2.4),h,lin(0x929A97));sign(q,-.09,1.03,1.45,2.47,1)
    for d,t in ((338,2),(1697,1),(4570,2),(5124,3),(6597,3),(8278,3)):
        q,h=at(d,-6.1);art.box(q(0,0,-.1),(.14,.14,2.72),h,lin(0x939593));sign(q,-.09,1.86,1.48,2.67,t)
    # The Otways enclose the road with tall, peeling gum trunks and low tree ferns.
    leaves=(0x476752,0x587C60,0x709078,0x849C7B)
    for d in range(-45,8500,7):
        for side in (-1,1):
            l=side*rng.uniform(6.2,38)
            if l>lip(d)-.8:continue
            q,h=at(d,l);height=rng.uniform(13,24)
            if 2610<d<3990:
                if rng.random()<.45:
                    art.tube(q(0,0,0),.39,.22,height*.81,lin(0x8D8878),lin(0xD2CABB),9)
                    for j in range(5):
                        u=math.cos(j*2.41+d)*1.62;v=math.sin(j*2.41+d)*2.02;z=height*(.54+.074*j)
                        art.tube(q(u,v,z),1.6,2.5,1.32,lin(leaves[j%4]),lin(leaves[(j+1)%4]),8)
                        art.tube(q(u,v,z+1.32),2.5,.31,2.18,lin(leaves[j%4]),lin(leaves[(j+1)%4]),8)
                else:
                    art.tube(q(0,0,0),.22,.17,2.5,lin(0x55483B),lin(0x786954),8)
                    for j in range(9):
                        a=j*math.tau/9;rnglen=rng.uniform(1.4,2.1)
                        def leaf(f,v,z):return q(f*rnglen*math.cos(a)-v*math.sin(a),f*rnglen*math.sin(a)+v*math.cos(a),z)
                        for b in range(6):
                            f=.14*b;w=.2*(1-f)
                            for s in (-1,1):
                                art.face((leaf(f,0,2.48+.6*math.sin(f*3)),leaf(f+.16,s*w,2.55),leaf(f+.26,0,2.51)),(lin(leaves[j%4]),)*3)
            else:
                ht=rng.uniform(.42,1.6)
                if rng.random()<.19:
                    art.tube(q(0,0,0),.16,.115,ht*1.5,lin(0x725C47),lin(0x87715C),7)
                    for j in range(4):
                        u=.63*math.sin(j*2.4);v=.63*math.cos(j*2.4)
                        art.tube(q(u,v,ht*(.68+.14*j)),1.12,.48,.91,lin(0x58654B),lin(0x869177),8)
                else:
                    for j in range(6):
                        u=.13*math.sin(j*1.3);v=.16*math.cos(j*.91)
                        art.face((q(u-.15,v,0),q(u+.12,v+.07,.01),q(u+.29,v+.18*math.sin(j),ht)),(lin(0x768061),lin(0x757C60),lin(0xA9A681)))
    for view in (5050,6550,8240):
        q,h=at(view+86,-10)
        art.box(q(0,0,-.75),(25,10,.80),h,lin(0x777679))
        for j in range(3):
            art.box(q(-8+j*7,-.6,.35),(4.1,1.8,.78),h,lin((0xA56153,0x72858D,0x968E81)[j]))
            art.box(q(-8+j*7,-.6,1.13),(2.1,1.55,.68),h,lin(0x54656E))
        q,h=at(view+25,6.6);art.box(q(0,0,-.41),(8.2,2.7,.5),h,lin(0xA1937B))
        for j in range(5):art.box(q(j*2-4,1.22,0),(.12,.12,1.09),h,lin(0x665B4B))
        art.box(q(0,1.22,1.04),(8.1,.13,.13),h,lin(0x75695B))
    return {'efforts':0}

THEME={'lay':lay,'land_builder':land,'road_builder':road,'land':{'mid':0x788467},'terrain':{'sea':True},
       'haze':0xBFC8CA,'sky':[0x6992B0,0x9FC7D7,0xD1D6CA,0xB7C8DB,0x789AB7],
       'light':[0xFFF0C9,1.52],'fill':[0xCEDFE6,0x948D75],'sun_altitude':.25,'sun_azimuth':2.9,
       'palette':{'asphalt':0x535453,'yellow':0xE1B343,'paint':0xEBE8D7}}
