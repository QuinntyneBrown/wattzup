"""Ruta 50, from the coffee slopes and painted towns into the frailejón páramo."""
import math
import sys
from bondi import words
from iten_landmarks import picture, pictured, site
from worldkit import Painted, lin, smooth


def bearing(d):
    return 1.23*math.sin(d/792)+.61*math.sin(d/352)+.22*math.sin(d/167)


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    rows=[];x=y=z=0
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=bc.STEP*i-bc.LEAD_IN;s=next((s for s in stages if d<s['to']),stages[-1])
        grade=max(-.013,.052+(s['level']-mean)*.007) if 0<=d<length else 0
        h=bearing(d)
        rows.append(dict(d=d,x=x,y=y,z=z,h=h,k=bearing(d+.5)-bearing(d-.5),g=grade*100))
        z+=bc.STEP*grade;x+=bc.STEP*math.cos(bearing(d+bc.STEP/2));y+=bc.STEP*math.sin(bearing(d+bc.STEP/2))
    for p in rows:p['z']+=3679-z
    return rows,stages,length,mean,.7


def road(r,st,length,col,theme):
    bc=sys.modules[type(r).__module__];b=bc.Builder('Ruta50','terrain');b.colours=[]
    mark=bc.Builder('RoadPaint','paint');mark.colours=[]
    for i,p in enumerate(r.s[:-1]):
        for a,c,h,t,out in ((-4.1,4.1,0,0x676668,b),(-.19,-.07,.018,0xDFB637,mark),(.07,.19,.018,0xE8BC3F,mark),(-3.84,-3.73,.018,0xE8E2C7,mark),(3.73,3.84,.018,0xE8E2C7,mark)):
            out.quad(r.at(i,a,h),r.at(i+1,a,h),r.at(i+1,c,h),r.at(i,c,h));out.colours.extend([lin(t)]*4)
    b.build(col);mark.build(col)


def land(r,col,theme,bc):
    b=bc.Builder('AndesBank','terrain');b.colours=[]
    def height(p,off):
        span=max(0,abs(off)-5)
        amp=(.44+.20*math.sin(p['d']/370)+.08*math.cos(p['d']/82))
        return p['z']-.18+(-1 if off>0 else 1)*span*amp+smooth(8,180,span)*9*math.sin(p['d']/160+off/50)
    prev=None
    for i in range(0,len(r.s),3):
        p=r.s[i];row=[]
        cold=smooth(16400,19900,p['d'])
        for j,off in enumerate((-295,-125,-45,-18,-7,-3,3,7,20,56,127,255)):
            x,y,_=r.at(i,off);z=height(p,off)
            warm=lin((0x536C41,0x5F7E44,0x789046,0x738544)[j%4]);cool=lin((0x746E50,0x868056,0x77805A,0x777B55)[j%4]);color=tuple(a+(c-a)*cold for a,c in zip(warm,cool))
            row.append(((x,y,z),color))
        if prev:
            for a,b0,c,e in zip(prev,prev[1:],row[1:],row):
                b.quad(a[0],e[0],c[0],b0[0]);b.colours.extend((a[1],e[1],c[1],b0[1]))
        prev=row
    b.build(col)
    def sample(x,y):
        _,i,_=r.tree.find((x,y,0));p=r.s[i];off=-(x-p['x'])*math.sin(p['h'])+(y-p['y'])*math.cos(p['h']);return height(p,off)
    return None,sample


def villages(k,art):
    facades=pictured(k,'FresnoWalls')
    for centre in (3665,11890):
        for side in (-1,1):
            for i in range(10):
                d=centre-58+i*14+(6 if side==1 else 0);off=side*k.rng.uniform(10,14)
                at,h=site(k,d,off);width=k.rng.uniform(9,13);high=k.rng.uniform(5.8,8);depth=7.5
                art.box(at(0,0,-2.1),(width,depth,high+2.1),h,lin((0xEED19C,0xDDD6C2,0xA8C4AF)[i%3]))
                art.roof(at(0,0,high),width+.45,depth+.45,1.4,h,lin(0x8B5846))
                y=-side*(depth/2+.08);w=width*.5;u=(i%2)*.5
                picture(facades,(at(-w,y,-.65),at(w,y,-.65),at(w,y,high),at(-w,y,high)),((u+.004,.004),(u+.496,.004),(u+.496,.496),(u+.004,.496)))
        for j,name in enumerate(('AREPAS','FRUTAS','AGUAPANELA')):
            d=centre-27+j*23;at,h=site(k,d,-6.5)
            for a in (-1.65,1.65):
                for b in (-.88,.88):art.box(at(a,b,-.4),(.085,.085,2.86),h,lin(0x755337))
            art.roof(at(0,0,2.34),3.65,2.05,.34,h,lin((0xAF5039,0xE4B94F,0x55886B)[j]))
            art.box(at(0,0,.48),(3.45,1.55,.46),h,lin(0x947450))
            art.box(at(0,1.04,1.91),(3.47,.08,.47),h,lin(0xEFE1A6))
            words(art,name,at(0,1.09,2.05),(-math.cos(h),-math.sin(h),0),(0,0,1),.37,2.87,0x65412D)
            for n in range(14):
                u=-1.25+.39*(n%7);v=-.37+.55*(n//7)
                art.tube(at(u,v,.94),.12,.095,.10 if j==0 else .21,lin(0xAD7431),lin(0xE7AC44 if n%3 else 0xB95A35),7)
    for d,name in ((3605,'FRESNO'),(11863,'PADUA'),(21520,'ALTO DE LETRAS'),(22113,'3679 m')):
        at,h=site(k,d,-5.3)
        for j in (-1.44,1.44):art.box(at(0,j,-.45),(.11,.11,2.23),h,lin(0x959C94))
        art.box(at(0,0,1.38),(.12,3.55,.94),h,lin(0x34734F))
        words(art,name,at(-.075,0,1.70),(math.sin(h),-math.cos(h),0),(0,0,1),.48,3.12,0xF3F1DF)


def scenery(k):
    art=Painted(k);villages(k,art);plants=pictured(k,'LetrasFlora');forest=pictured(k,'CloudForest');sky=pictured(k,'Cordillera')
    for j in range(36):
        def at(n,h):
            th=math.tau*n/36
            return (5800+13700*math.cos(th),13800*math.sin(th),-520+h)
        u=j%9/9;v=(j%9+1)/9
        if (j//9)%2:u,v=1-u,1-v
        picture(sky,(at(j,0),at(j+1,0),at(j+1,6350),at(j,6350)),((u,0),(v,0),(v,1),(u,1)))
    # A wide, low folded valley fills the distance beneath the three skyline sectors.
    foothills=Painted(k,'peaks')
    for ix in range(-8,25):
        for iy in range(-12,13):
            def fold(dx,dy):
                x=(ix+dx)*880;y=(iy+dy)*850
                z=1370+135*math.cos(x/861+y/603)+86*math.sin(y/491)+112*math.cos(x/1081-y/560)
                return (x,y,z)
            c=lin((0x688367,0x65836C,0x718B72)[(ix+2*iy)%3])
            foothills.face((fold(0,0),fold(1,0),fold(1,1),fold(0,1)),(c,)*4)
    def plant(d,off,height,aspect,kind):
        x,y,_=k.road.pos(d,off);z=k.height_at(x,y)-.13
        if kind==0:
            art.tube((x,y,z),height*.0085,height*.0057,height*.85,lin(0x8C8E76),lin(0xBDBCA6),7)
        yaw=bearing(d)+k.rng.uniform(-.70,.70);half=height*aspect*.5
        dx=math.sin(yaw)*half;dy=math.cos(yaw)*half
        u=(kind%2)*.5;v=.5 if kind<2 else 0
        target=plants if kind<4 else forest
        if kind>=4:u=(kind%2)*.5;v=0
        top=v+(.5 if kind<4 else 1)
        picture(target,((x-dx,y-dy,z),(x+dx,y+dy,z),(x+dx,y+dy,z+height),(x-dx,y-dy,z+height)),((u,v),(u+.5,v),(u+.5,top),(u,top)))
    for d in range(-60,22400,15):
        if abs(d-3670)<100 or abs(d-11888)<100:continue
        if d<8400:
            for j in range(8):
                off=(-1 if j%2 else 1)*(8.8+(j//2)*5.1)
                plant(d+.6*(j%3),off,k.rng.uniform(1.25,2.05),1.18,2)
            if d%45==0:plant(d,-26,k.rng.uniform(4.2,7.5),.88,1)
        if 4750<d<17000 and d%45==0:
            for j in range(2):plant(d+8*j,k.rng.choice((-1,1))*k.rng.uniform(12,68),k.rng.uniform(19,36),.75,0)
        if d<8700 and d%60==0:
            plant(d+4,-26,k.rng.uniform(9,15),.94,4)
        if 9900<d<18000:
            for j in range(3):
                off=(-1 if j%2 else 1)*k.rng.uniform(10,35)
                plant(d+j*2,off,k.rng.uniform(10,21) if j!=1 else k.rng.uniform(4.2,7.7),1.05,4+j%2)
        if d>16600:
            for j in range(5):
                off=k.rng.choice((-1,1))*k.rng.uniform(6.5,44)
                plant(d+k.rng.uniform(-6,6),off,k.rng.uniform(.86,2.35),.68,3)
            for j in range(2):
                at,h=site(k,d+j*4,7+j*5)
                x,y,_=at(0,0);z=k.height_at(x,y)
                art.tube((x,y,z),.29,.025,.58,lin(0x878157),lin(0xA99A65),5)
    for d,off in ((7719,17),(7738,24),(7756,12),(7781,-18),(7805,24)):
        plant(d,off,24+(d%9),.74,0)
    for i in range(20):
        plant(21464+i*4.3,(-1 if i%3 else 1)*(5.5+(i%4)*1.4),1.49+(i%5)*.24,.96,3)
    for d in range(21380,21644,6):
        off=k.rng.choice((-1,1))*k.rng.uniform(5.3,10)
        x,y,_=k.road.pos(d,off);z=k.height_at(x,y);h=k.rng.uniform(.55,1.45)
        art.tube((x,y,z-.12),.20,.16,h,lin(0x615446),lin(0x8B7753),7)
        for j in range(12):
            a=j*2.4;cs,sn=math.cos(a),math.sin(a);L=.48+.11*(j%3)
            base=(x,y,z+h-.12);tip=(x+L*cs,y+L*sn,z+h+.25+(j%4)*.13)
            mid=(x+L*.56*cs,y+L*.56*sn,z+h+.27)
            art.face((base,(mid[0]-.087*sn,mid[1]+.087*cs,mid[2]),tip,(mid[0]+.087*sn,mid[1]-.087*cs,mid[2])),(lin(0x68715B),lin(0xA7A88C),lin(0xD3CDB0),lin(0xABB79A)))
    return {'efforts':0}


THEME={'lay':route,'surface_builder':road,'land_builder':land,'terrain':{'sea':False},'land':{'mid':0x748553},
       'road_half_width':4.1,'sky':[0xDBE3D1,0xBBD9DE,0x92C5DE,0x70A8D3,0x5588BD],
       'haze':0xC5D3C1,'light':[0xFFF0CB,1.68],'fill':[0xC1D9E4,0xA89975],'sun_radius':16,'sun_altitude':.80,'sun_azimuth':.76}
