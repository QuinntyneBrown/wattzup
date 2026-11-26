"""The westbound Aurelia, Poggio di Sanremo and the Via Roma finish."""
import math
from worldkit import Painted,lin,smooth
from iten_landmarks import pictured,picture,site
from bondi import beam

PROFILE=((0,9),(820,16),(1440,8),(1890,29),(2520,12),(3100,13),(4000,47),(4820,88),(5600,117),(6500,149),(7150,163),(7500,155),(8380,91),(9100,43),(9700,12),(10600,9),(11550,8))


def route(course,theme,bc):
    st=bc.stages(course['plan']);length=st[-1]['to'];mean=sum((s['to']-s['from'])*s['level'] for s in st)/length
    def height(d):
        d=max(0,min(d,length))
        for (a,z),(b,y) in zip(PROFILE,PROFILE[1:]):
            if d<=b:return z+(y-z)*smooth(a,b,d)
        return 8
    def heading(d):
        gentle=.19*math.sin(d/165)+.095*math.sin(d/82)
        bends=0
        for a,b,sign in ((4230,4510,1),(4858,4998,-1),(5730,6030,1),(6380,6690,-1),(8170,8300,-1),(8410,8600,1),(8890,9080,-1)):
            bends+=sign*2.18*(smooth(a,a+36,d)-smooth(b,b+42,d))
        return gentle+bends
    rows=[];x=y=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;h=heading(d);z=height(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=heading(d+.5)-heading(d-.5),g=100*(height(d+bc.STEP)-z)/bc.STEP))
        x+=bc.STEP*math.cos(heading(d+bc.STEP*.5));y+=bc.STEP*math.sin(heading(d+bc.STEP*.5))
    return rows,st,length,mean,.07


def width(d):return 4.35-1.42*smooth(2980,3370,d)*(1-smooth(9390,9740,d))


def road(r,st,length,col,bc):
    b=bc.Builder('AureliaRoad','terrain');b.colours=[]
    for i,p in enumerate(r.s[:-1]):
        j=i+1;l=width(p['d']);w=width(r.s[j]['d'])
        strips=[(-1.3,1.3,.016,0xA9A79A),(-1,1,.055,0x6A6C69),(-.97,-.945,.067,0xDFDFCB),(.945,.97,.067,0xDFDFCB)]
        if (p['d']<3000 or p['d']>9700) and i%4==0:strips.append((-.012,.012,.069,0xE1DFD2))
        for a,e,z,c in strips:
            b.quad(r.at(i,l*a,z),r.at(j,w*a,z),r.at(j,w*e,z),r.at(i,l*e,z));b.colours.extend([lin(c)]*4)
    b.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('Riviera terraces','terrain');b.colours=[]
    sea=bc.Builder('LigurianSea','terrain');sea.colours=[]
    def height(x,y):
        _,i,dist=r.tree.find((x,y,0));p=r.s[i];rise=p['z'];edge=smooth(5,108,dist)
        if y>p['y']:
            z=rise*(1-edge)-3.1*edge
        else:z=rise+(41+12*math.sin(x/169))*edge
        return z-.22
    xmin=int(min(p['x'] for p in r.s))-190;xmax=int(max(p['x'] for p in r.s))+220
    ymin=int(min(p['y'] for p in r.s))-190;ymax=int(max(p['y'] for p in r.s))+220
    step=14
    for x in range(xmin,xmax,step):
        for y in range(ymin,ymax,step):
            points=[(a,v,height(a,v)) for a,v in ((x,y),(x+step,y),(x+step,y+step),(x,y+step))]
            # Leave clearance below a steep curve. The verge covers the final metres to the road.
            b.quad(*[(a,v,z-2.0) for a,v,z in points])
            for a,v,z in points:b.colours.append(lin((0xA79B7E if z<2.9 else 0x82905F)+int(5*math.sin(a/101+v/58))*0x010101))
        top=ymax+2400
        sea.quad((x,ymin,.06),(x+step,ymin,.06),(x+step,top,.06),(x,top,.06));sea.colours.extend([lin(0x418C9F)]*4)
    for i in range(len(r.s)-1):
        j=i+1;l=width(r.s[i]['d'])*1.3;w=width(r.s[j]['d'])*1.3
        for side in (-1,1):
            a=r.at(i,side*l);e=r.at(j,side*w);f=r.at(j,side*(w+4),-4.0);g=r.at(i,side*(l+4),-4.0)
            b.quad(a,e,f,g);b.colours.extend([lin(0x8C8F71)]*4)
    b.build(col);sea.build(col)
    return None,height


def scenery(k):
    art=Painted(k);names=('RivieraVillas','ViaRomaShops','PoggioStone','FlowerRows','RivieraPalms','PoggioTifosi','RivieraSigns')
    villas,shops,stone,flowers,palms,fans,signs=[pictured(k,n) for n in names]
    ochre,pink,cream,red,green,metal=[lin(c) for c in (0xE6C394,0xD6AE97,0xE8DEBA,0xA76955,0x52775F,0x858E8D)]
    def tile(mesh,points,u=1,v=1):
        picture(mesh,points,((0,0),(u,0),(u,v),(0,v)))
    def panel(at,mesh,x,y,z,w,h,angle,j,n):
        dx=.5*w*math.cos(angle);dy=.5*w*math.sin(angle);u=j/n
        picture(mesh,(at(x-dx,y-dy,z),at(x+dx,y+dy,z),at(x+dx,y+dy,z+h),at(x-dx,y-dy,z+h)),((u+.001,0),(u+1/n-.001,0),(u+1/n-.001,1),(u+.001,1)))
    def wall(d,e,side,high):
        v=side*(width(d)+.58);a,_=site(k,d,v);b,_=site(k,e,v);w=.25
        for n in (-1,1):tile(stone,(a(0,n*w,-1.1),b(0,n*w,-1.1),b(0,n*w,high),a(0,n*w,high)),(e-d)/3.0,(high+1.1)/1.6)
        art.face((a(0,-w,high),b(0,-w,high),b(0,w,high),a(0,w,high)),(cream,)*4)
    for d in range(-60,11600,8):
        if d<2810:wall(d,d+8,1,.68)
        if 3120<d<9630:
            side=1 if 8100<d<8840 else -1
            wall(d,d+8,side,1.45 if side==1 else .91)
    def house(d,v,facades,j):
        at,h=site(k,d,v);side=1 if v>0 else -1;length=8.1+j*.83;height=7.25+j*1.15
        art.box(at(0,side*3.72,-4),(length,7.44,height+4),h,(ochre,pink,cream)[j%3])
        art.roof(at(0,side*3.72,height),length+.25,7.73,1.55,h,red)
        u=j/4;tilepts=(at(-length/2,-side*.018,0),at(length/2,-side*.018,0),at(length/2,-side*.018,height),at(-length/2,-side*.018,height))
        picture(facades,tilepts,((u+.001,0),(u+.249,0),(u+.249,1),(u+.001,1)))
    for d in range(-46,11600,11):
        for side in (-1,1):
            town=d<690 or 6890<d<7390 or d>10930
            if side>0 and (d<690 or 7080<d<7240):continue
            if not town and (side>0 or d%187):continue
            house(d,side*(width(d)+3.4),shops if d>10930 else villas,k.rng.randrange(4))
    for d in range(-33,11590,29):
        if 780<d<10460:continue
        side=1 if d<780 else (-1 if d%2 else 1);at,_=site(k,d,side*(width(d)+2.28))
        high=k.rng.uniform(7.7,11.8);j=k.rng.randrange(4)
        for ang in (1.5,.34):panel(at,palms,0,0,0,high*.8,high,ang,j,4)
    for d in (91,116,11382):
        at,h=site(k,d)
        for j in range(7):art.box(at(0,(j-3)*1.14,.075),(2.05,.59,.022),h,cream)
    # Three fixed promontories with a dark road bore in the near one.
    for d,v,length,reach,up in ((1940,46,63,36,24),(2320,118,244,112,42),(2630,184,369,183,63)):
        at,h=site(k,d,v);base=-k.road.pos(d)[2]
        for j in range(33):
            a=j*math.tau/33;b=(j+1)*math.tau/33
            def ridge(t,scale,z):return at(length*.5*scale*math.cos(t),reach*scale*math.sin(t),base+z)
            pts=(ridge(a,1,-2),ridge(b,1,-2),ridge(b,.62,up*.66),ridge(a,.62,up*.66));art.face(pts,(lin(0x8D8E76),lin(0xA7A18D),lin(0x919672),lin(0x728364)))
            art.face((ridge(a,.62,up*.66),ridge(b,.62,up*.66),at(0,0,base+up)),(green,green,lin(0x8F9B73)))
    at,h=site(k,1888)
    for n in range(20):
        a=math.pi*n/20;b=math.pi*(n+1)/20
        def arch(t,r,x):return at(x,r*math.cos(t),.02+r*math.sin(t))
        tile(stone,(arch(a,5.25,0),arch(b,5.25,0),arch(b,6.55,0),arch(a,6.55,0)),.49,1)
        art.face((arch(a,5.25,0),arch(b,5.25,0),arch(b,5.25,28),arch(a,5.25,28)),(lin(0x73716B),lin(0x73716B),lin(0x444642),lin(0x444642)))
    # Stepped flower beds and glasshouses, each roof divided into individual panes.
    for d in range(3640,6470,74):
        side=1 if d%3 else -1;at,h=site(k,d,side*11.4)
        for j in range(3):
            y=side*j*4.1;z=j*.56
            art.box(at(0,y,z-4.8),(29,3.9,4.8),h,ochre)
            tile(flowers,(at(-14.4,y-1.92,z+.012),at(14.4,y-1.92,z+.012),at(14.4,y+1.92,z+.012),at(-14.4,y+1.92,z+.012)),4.2,1)
        at,h=site(k,d+18,side*15.3);glass=lin(0xB2CFCD);ridge=lin(0xCEE3DA)
        for j in range(8):
            x=-9.6+j*2.4
            for n in (-1,1):
                pts=(at(x,n*3.4,2.51),at(x+2.4,n*3.4,2.51),at(x+2.4,0,4.13),at(x,0,4.13));art.face(pts,(glass,glass,ridge,ridge))
                beam(art,at(x,n*3.4,2.51),at(x,0,4.13),.092,.083,cream)
                beam(art,at(x,n*3.4,-.42),at(x,n*3.4,2.51),.087,.087,metal)
                art.face((at(x,n*3.39,.42),at(x+2.4,n*3.39,.42),at(x+2.4,n*3.39,2.48),at(x,n*3.39,2.48)),(green,green,glass,glass))
    at,h=site(k,4850,-4.23);art.box(at(0,0,0),(.10,.10,2.64),h,metal);panel(at,signs,0,0,1.72,2.59,.86,-math.pi/2,0,3)
    # Summit church front, nave and bell tower.
    at,h=site(k,7183,16)
    art.box(at(9.2,0,-.60),(18.4,10.1,10.1),h,cream);art.roof(at(9.2,0,9.50),18.9,10.7,2.70,h,red)
    for y in (-4.23,-2.68,2.68,4.23):art.box(at(-.21,y,.08),(.39,.50,8.84),h,ochre)
    art.box(at(-.25,0,0),(.38,2.61,3.62),h,lin(0x6C5947))
    art.box(at(-.33,0,7.15),(.30,9.91,.46),h,ochre)
    art.box(at(9.6,7.35,-.34),(3.8,3.8,17.35),h,ochre)
    for side in (-1,1):
        art.box(at(9.6+side*1.91,7.35,13.02),(.08,1.2,2.83),h,lin(0x555A50))
        art.box(at(9.6,7.35+side*1.91,13.02),(1.20,.08,2.83),h,lin(0x555A50))
    art.box(at(9.6,7.35,16.53),(4.34,4.34,.56),h,cream)
    for j in range(4):
        a=j*math.pi/2+math.pi/4;b=a+math.pi/2
        art.face((at(9.6+3.12*math.cos(a),7.35+3.12*math.sin(a),17.04),at(9.6+3.12*math.cos(b),7.35+3.12*math.sin(b),17.04),at(9.6,7.35,21.03)),(red,red,ochre))
    for d in list(range(6980,7280,4))+list(range(11140,11590,4)):
        for side in (-1,1):
            at,h=site(k,d,side*(width(d)+.74))
            for z in (.28,.98):beam(art,at(-2,0,z),at(2,0,z),.065,.065,metal)
            for x in (-1.8,-.5,.8):beam(art,at(x,0,0),at(x,0,1.04),.044,.044,metal)
            panel(at,fans,.1,side*.71,.0,1.93,1.78,k.rng.uniform(.48,1.48),k.rng.randrange(4),4)
    at,h=site(k,11458)
    for v in (-5.38,5.38):
        for x in (-.46,.46):art.box(at(x,v,0),(.20,.25,6),h,metal)
        for j in range(6):beam(art,at(-.46,v,j),at(.46,v,j+1),.09,.09,metal)
    art.box(at(0,0,5.24),(1.2,11.05,1.02),h,red)
    panel(at,signs,-.62,0,5.27,10.58,.95,-math.pi/2,1,3)
    for j in range(22):
        for n in (0,1):
            art.box(at(n*.43,(j-10.5)*.39,.078),(.43,.39,.02),h,cream if (j+n)%2==0 else lin(0x454843))
    return {'efforts':0}

THEME={'lay':route,'land_builder':land,'road_builder':road,'terrain':{'sea':False},'road_half_width':4.35,'land':{'mid':0x839266},'sky':[0xDBEBEA,0xB5D8EB,0x8FC2DE,0x65A3CE,0x4888BC],'haze':0xC6D9DA,'light':[0xFFEBCA,2.15],'fill':[0xC6DFE8,0xA7A18F],'sun_radius':7,'sun_altitude':.78,'sun_azimuth':-.89}
