"""Autumn repeats up Montréal's Camillien-Houde, the lake, cross and stone lookout."""
import math
from bondi import beam
from iten_landmarks import picture,pictured,site
from worldkit import Painted,lin,smooth
UV=((0,0),(1,0),(1,1),(0,1))


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to'];mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    def height(d):
        d=max(0,min(d,length))
        # Repeated efforts up the same mountain, with a descent between visits to the park plateau.
        wave=(1-math.cos(2*math.pi*(d+2550)/6120))*.5
        stage=sum((s['level']-mean)*max(0,min(d,s['to'])-s['from']) for s in stages)
        return 68+124*wave+40*smooth(22000,24560,d)+stage*.0015
    def heading(d):
        main=-math.radians(40)*math.sin(d/60)*math.cos(d/162+1)
        return main+2.71*(smooth(4390,4520,d)-smooth(4690,4860,d))
    rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d);z=height(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=100*(height(d+bc.STEP)-z)/bc.STEP))
        h=heading(d+bc.STEP*.5);x+=bc.STEP*math.cos(h);y+=bc.STEP*math.sin(h)
    return rows,stages,length,mean,.067


def road(r,st,length,col,bc):
    b=bc.Builder('ParkRoad','terrain');b.colours=[]
    for i,p in enumerate(r.s[:-1]):
        for a,e,z,c in ((-8,8,.012,0x928A72),(-5.65,5.65,.027,0x646668),(-4.13,-4.02,.036,0xF1E9D4),(4.02,4.13,.036,0xF1E9D4),(-.095,.095,.039,0xD8AD49)):
            b.quad(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,e,z),r.at(i,e,z));b.colours.extend([lin(c)]*4)
    b.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('Autumn park','terrain');b.colours=[]
    lake=r.pos(13077,45);level=r.pos(13030)[2]-2.65;ax=r.s[r.index(13077)]['h'];cs=math.cos(ax);sn=math.sin(ax)
    def sample(x,y):
        _,i,dist=r.tree.find((x,y,0));p=r.s[i];u=-(x-p['x'])*math.sin(p['h'])+(y-p['y'])*math.cos(p['h'])
        # A single continuous park surface cannot fold over the outside of a hairpin.
        near=r.tree.find_range((x,y,0),26)
        road_z=min((r.s[j]['z'] for _,j,_ in near),default=p['z'])
        z=road_z-.65+max(0,dist-12)*(.095 if u<0 else -.085)
        dx=x-lake[0];dy=y-lake[1];radius=((dx*cs+dy*sn)/74)**2+((-dx*sn+dy*cs)/35)**2
        if radius<1.8:z=min(z,level-1.3+3.5*smooth(.85,1.8,radius))
        return z
    xs=[p['x'] for p in r.s];ys=[p['y'] for p in r.s];seq=range(math.floor(min(ys))-240,math.ceil(max(ys))+248,10);prev=None
    for x in range(math.floor(min(xs))-240,math.ceil(max(xs))+248,10):
        row=[(x,y,sample(x,y)) for y in seq]
        if prev:
            for j in range(len(row)-1):
                face=(prev[j],row[j],row[j+1],prev[j+1]);b.quad(*face)
                for xx,yy,_ in face:
                    tone=math.sin(xx*.039+math.sin(yy*.063))*4+math.cos(yy*.072)*3
                    c=[max(0,min(255,int(v+tone))) for v in (132,132,87)];b.colours.append(lin((c[0]<<16)|(c[1]<<8)|c[2]))
        prev=row
    b.build(col);return None,sample


def scenery(k):
    art=Painted(k);trees=pictured(k,'RoyalWoods');signs=pictured(k,'ParcSigns');skyline=pictured(k,'BelvedereCity')
    k.B['CastorsWater']=type(k.B['terrain'])('CastorsWater','terrain');water=Painted(k,'CastorsWater')
    silver=lin(0xA9ADA9);rock=lin(0x838481);stone=lin(0xC3B9A0);dark=lin(0x44534B);green=lin(0x35644A)
    for d in range(-54,25616,12):
        for side in (-1,1):
            if side>0 and (12920<d<13170 or 24440<d<24750):continue
            if side<0 and 18585<d<18738:continue
            for row in range(2):
                off=side*k.rng.uniform(10+row*13,19+row*21);a,h=site(k,d+k.rng.uniform(-4,4),off)
                r=k.rng.uniform(3.6,6.8);high=k.rng.uniform(8,15);n=k.rng.randrange(3);u=n/3;uv=((u+.002,0),(u+1/3-.002,0),(u+1/3-.002,1),(u+.002,1))
                for angle in (.23,1.80):
                    x=r*math.cos(angle);y=r*math.sin(angle)
                    picture(trees,(a(-x,-y,-.35),a(x,y,-.35),a(x,y,high),a(-x,-y,high)),uv)
        if 4200<d<4785 or 24380<d<24740:
            a,h=site(k,d,6.28);e,_=site(k,d+12,6.28)
            art.box(a(0,0,.02),(.18,.23,1.03),h,silver)
            beam(art,a(0,0,.72),e(0,0,.72),.16,.23,silver)
            if d<4785:
                a,h=site(k,d,-8.55);r=k.rng.uniform(2.2,4);art.tube(a(0,-.5,-.6),r,r*.81,k.rng.uniform(2.1,4.3),rock,lin(0xA0A09A),7,rock)
        if 8000<d<8470:
            a,h=site(k,d,-8.9);e,_=site(k,d+12,-8.9);c=lin(0xC0AB87)
            art.face((a(0,-1.4,.10),e(0,-1.4,.10),e(0,1.4,.10),a(0,1.4,.10)),(c,)*4)
    for d,tile in ((102,0),(4473,1),(8220,2),(13060,3),(18680,0),(24599,2)):
        a,h=site(k,d,-6.52)
        for side in (-.57,.57):art.box(a(0,side,0),(.12,.12,2.48),h,silver)
        u=tile%2*.5;v=(1-tile//2)*.5
        picture(signs,(a(0,1.12,1.55),a(0,-1.12,1.55),a(0,-1.12,2.67),a(0,1.12,2.67)),((u,v),(u+.5,v),(u+.5,v+.5),(u,v+.5)))
    # Stone pavilion and the low modern lake house seen across a curved, fixed waterline.
    a,h=site(k,13077,45);offset=k.road.pos(13030)[2]-2.65-k.road.pos(13077,45)[2];bottom=lin(0x73948A)
    for j in range(56):
        angle=j*math.tau/56;nextangle=(j+1)*math.tau/56
        def shore(t):return a(62*math.cos(t),28*math.sin(t),offset)
        water.face((a(0,0,offset),shore(angle),shore(nextangle)),(bottom,)*3)
    a,h=site(k,13116,65);lakebase=k.road.pos(13030)[2]-2.65+1-k.road.pos(13116,65)[2];raw=a;a=lambda u,v,w=0:raw(u,v,w+lakebase);art.box(a(0,0,-1),(22,9,3.8),h,lin(0x577679))
    art.roof(a(0,0,2.8),24,11,1.23,h,lin(0x494F48))
    for j in range(-10,11,2):art.box(a(j,-4.65,-.9),(.18,.21,3.8),h,stone)
    # An offset shore and a band of reflected trees place the lake house on the waterline.
    for j in range(-6,7):
        a,h=site(k,13077,45);x=j*10.0;y=22+5*math.cos(j*.49);at=a(x,y,offset+.1);radius=6.3
        u=(j%3)/3;picture(trees,((at[0]-radius,at[1],at[2]),(at[0]+radius,at[1],at[2]),(at[0]+radius,at[1],at[2]+12),(at[0]-radius,at[1],at[2]+12)),((u,0),(u+1/3,0),(u+1/3,1),(u,1)))
    a,h=site(k,18696,-21);base=a;a=lambda x,y,z=0:base(x*.46-y*.89,x*.89+y*.46,z)
    for x in (-.84,.84):
        for y in (-.62,.62):beam(art,a(x,y,0),a(x,y,19.6),.16,.16,silver)
    for j in range(10):
        for side in (-.62,.62):beam(art,a(-.84,side,2*j),a(.84,side,min(19.6,2*j+2)),.11,.11,silver)
    glow=lin(0xE8D6AA)
    for z in (13.5,15.15):beam(art,a(-5.35,0,z),a(5.35,0,z),.19,.24,glow)
    for j in range(-5,5):beam(art,a(j,0,13.5),a(j+1,0,15.15),.10,.12,silver)
    for d in range(24558,24630,3):
        a,h=site(k,d,10.55);art.box(a(0,0,0),(.49,.59,1.02),h,stone);art.box(a(0,0,1.0),(3.08,.66,.21),h,stone)
    a,h=site(k,24630,-17);art.box(a(0,0,0),(25,10,4.4),h,lin(0xBCAB8D));art.roof(a(0,0,4.4),28,13.2,3.3,h,lin(0x5E655E))
    for j in range(-10,11,2):art.box(a(j,5.2,.3),(1.22,.14,2.8),h,dark)
    a,h=site(k,24665,113)
    picture(skyline,(a(-91,42,-8),a(91,-42,-8),a(91,-42,35),a(-91,42,35)),UV)
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':5.65,'land':{'mid':0x939060},'sky':[0xE7DBBD,0xC7D7D8,0xABCCDE,0x82AFCE,0x6298BE],'haze':0xC5CFBF,'light':[0xFFE0A9,1.96],'fill':[0xD3E2EB,0xA89A79],'sun_radius':13,'sun_altitude':.46,'sun_azimuth':.62}
