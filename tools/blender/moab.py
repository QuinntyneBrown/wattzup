"""The Colorado River corridor and the red sandstone formations of Arches National Park."""
import math
from bondi import beam
from iten_landmarks import picture, pictured, site
from worldkit import Painted, lin, smooth


def heading(distance):
    # scene-bend.ts counts clockwise, while Blender counts anticlockwise from +X.
    return -math.radians(25)*math.sin(distance/100)*math.cos(distance/(2.7*100)+1)


def route(course,theme,bc):
    stages=bc.stages(course['plan']);length=stages[-1]['to']
    mean=sum((s['to']-s['from'])*s['level'] for s in stages)/length
    x=y=0;z=1240.0;rows=[]
    for i in range(math.ceil((length+bc.LEAD_IN+bc.RUN_OUT)/bc.STEP)+1):
        d=i*bc.STEP-bc.LEAD_IN;s=next((s for s in stages if d<s['to']),stages[-1])
        grade=(.012+(s['level']-mean)*.0051) if 0<=d<length else 0
        rows.append(dict(d=d,x=x,y=y,z=z,h=heading(d),k=heading(d+.5)-heading(d-.5),g=100*grade))
        turn=heading(d+bc.STEP/2);x+=bc.STEP*math.cos(turn);y+=bc.STEP*math.sin(turn);z+=bc.STEP*grade
    return rows,stages,length,mean,.51




def pavement(r,st,length,col,bc):
    road=bc.Builder('CanyonRoad','terrain');road.colours=[]
    for i in range(len(r.s)-1):
        for a,b,z,c in ((-5.3,5.3,-.04,0xB47958),(-4,4,0,0x515052),(-3.77,-3.66,.013,0xE7E3D8),(3.66,3.77,.013,0xE7E3D8),(-.19,-.07,.014,0xF0BD4E),(.07,.19,.014,0xF0BD4E)):
            road.quad(r.at(i,a,z),r.at(i+1,a,z),r.at(i+1,b,z),r.at(i,b,z))
            road.colours.extend([lin(c)]*4)
    road.build(col)


def riverbed(d):
    return 38+5*math.cos(d/170)


def land(r,col,theme,bc):
    ground=bc.Builder('DesertSoil','terrain');ground.colours=[]
    water=bc.Builder('ColoradoRiver','terrain');water.colours=[]
    def relief(p,off):
        w=smooth(5,21,abs(off));bank=smooth(10,23,off)*(1-smooth(65,86,off))*(1-smooth(1800,2550,p['d']))
        return p['z']-.12+w*(.48*math.sin(p['d']/77+off/18)+.35*math.sin(off*.19))-4.3*bank
    old=None
    for i in range(0,len(r.s),3):
        p=r.s[i];row=[]
        for off in (-960,-230,-100,-47,-19,-6,0,6,13,22,39,62,76,98,168,420,960):
            x,y,_=r.at(i,off);blend=smooth(65,145,abs(off));x+=(p['x']-x)*blend;y+=(p['y']+off-y)*blend
            row.append(((x,y,relief(p,off)),lin(0xBD8B67 if abs(off)<28 else 0xA77B58)))
        if old:
            for a,b,c,e in zip(old,old[1:],row[1:],row):
                ground.quad(a[0],e[0],c[0],b[0]);ground.colours.extend((a[1],e[1],c[1],b[1]))
        old=row
        if i+3<len(r.s) and p['d']<2180:
            mid=riverbed(p['d']);n=riverbed(r.s[i+3]['d'])
            water.quad(r.at(i,mid-16,-2.42),r.at(i+3,n-16,-2.42),r.at(i+3,n+19,-2.42),r.at(i,mid+19,-2.42));water.colours.extend([lin(0x657767)]*4)
    ground.build(col);water.build(col)
    def height(x,y):
        _,i,_=r.tree.find((x,y,0));p=r.s[i];off=-(x-p['x'])*math.sin(p['h'])+(y-p['y'])*math.cos(p['h']);return relief(p,off)
    return None,height


def rings(art,layers,phase):
    for j,(lo,hi) in enumerate(zip(layers,layers[1:])):
        for n in range(len(lo)):
            m=(n+1)%len(lo);shade=.78+.13*math.cos(n*math.tau/len(lo)+phase)+.07*j/len(layers)
            tint=(shade,shade*.96,shade*.91,1)
            art.face((lo[n],lo[m],hi[m],hi[n]),(tint,)*4)


def butte(art,at,u,v,w,depth,high,phase,rounded=False):
    profile=((-2,1.05),(.07,1),(.30,.85),(.52,.66),(.72,.49),(.88,.29),(.98,.10),(1,.005)) if rounded else ((-2,1.12),(.09,1),(.20,.82),(.31,.71),(.36,.74),(.58,.63),(.61,.66),(.87,.55),(.96,.51),(1,.36),(1.01,.006))
    layers=[]
    for j,(y,r) in enumerate(profile):
        row=[]
        for n in range(24):
            a=n*math.tau/24;noise=1+.071*math.sin(3*a+phase)+.052*math.cos(7*a+phase)
            row.append(at(u+w*r*noise*math.cos(a),v+depth*r*noise*math.sin(a),high*(y+.023*math.sin(a*3+phase))))
        layers.append(row)
    rings(art,layers,phase)


def arch(art,at,spine,phase):
    # Elliptic cross sections along the stone arch leave the sky aperture open on both sides.
    layers=[]
    for j,(u,z,r,deep) in enumerate(spine):
        before=spine[max(0,j-1)];after=spine[min(len(spine)-1,j+1)]
        du,dz=after[0]-before[0],after[1]-before[1];length=math.hypot(du,dz)
        row=[]
        for n in range(20):
            a=n*math.tau/20;wave=1+.066*math.sin(3*a+phase+j*.22)+.035*math.cos(7*a)
            row.append(at(u-r*dz/length*math.cos(a)*wave,deep*math.sin(a)*wave,z+r*du/length*math.cos(a)*wave))
        layers.append(row)
    rings(art,layers,phase)


def scenery(k):
    for name in ('Slickrock','Entrada','Wingate'):k.B[name]=type(k.B['terrain'])(name,'terrain')
    slick=Painted(k,'Slickrock');red=Painted(k,'Entrada');wall=Painted(k,'Wingate')
    far=Painted(k,'peaks');plants=pictured(k,'Juniper')
    for d in range(-75,13190,106):
        for side in (-1,1):
            canyon=d<1730
            off=side*(k.rng.uniform(95,173) if canyon else k.rng.uniform(235,405))
            a,h=site(k,d,off)
            butte(wall,a,0,0,k.rng.uniform(55,98),k.rng.uniform(27,55),k.rng.uniform(51,108) if canyon else k.rng.uniform(26,84),k.rng.random()*7)
    for d in range(1820,12650,113):
        side=k.rng.choice((-1,1));off=side*k.rng.uniform(27,120);a,h=site(k,d,off)
        butte(slick,a,0,0,min(abs(off)*.48,38),k.rng.uniform(11,24),k.rng.uniform(6,19),d*.041,True)
    # Balanced Rock: a lopsided topstone over the eroded Dewey Bridge pedestal.
    a,h=site(k,4370,-31)
    layers=[]
    for z,u,w,deep in ((-3,0,10,8),(2,0,8,6),(6,0,4.9,4.4),(10,.9,3,3.2),(15,1.4,1.9,2.3),(17,1,2.8,2.6),(18.2,-.3,4.3,3.6),(21,-1.2,6.9,5.1),(25.7,-1.9,7.1,5.7),(29,-1.1,5.8,4.8),(31.9,.1,3.3,2.8),(32.8,.4,.12,.18)):
        layers.append([a(u+w*math.cos(t*math.tau/22)*(1+.06*math.sin(t*.82)),deep*math.sin(t*math.tau/22),z+.35*math.cos(t*math.tau/11)) for t in range(22)])
    rings(red,layers,1.1)
    for j in range(5):butte(wall,a,44+j*8,-20,8,7,20+7*math.sin(j*1.2),j*.7)
    a,h=site(k,6580,37)
    arch(red,a,[(-22,-3,7,5),(-19,4,5,5),(-15,10,4.8,5),(-9,14,4,4.8),(-2,15,3.4,4.6),(6,15.8,3.8,4),(14,14,4.1,4.5),(19,8,4,5),(23,-2,6,5)],2)
    a,h=site(k,9288,-30)
    arch(red,a,[(-9,-2,3.4,3.8),(-8.2,3.2,2.35,2.3),(-7.9,8.1,1.61,1.7),(-6.8,12.6,1.2,1.4),(-5.1,15.8,1.3,1.45),(-2,17.3,1.5,1.65),(1.4,16.8,1.7,1.8),(4.5,15,1.9,2.05),(6.5,11.7,2.05,2.1),(7.8,7.8,2.5,2.6),(8.7,3.2,3.3,3.4),(10.4,-2,4.5,4.3)],3.5)
    for d in range(-45,13060,7):
        off=k.rng.choice((-1,1))*k.rng.uniform(6.5,34)
        if d<1960 and off>20:continue
        a,h=site(k,d,off);x,y,z=a(0,0);g=k.height_at(x,y)-z-.055
        tile=0 if k.rng.random()<.19 else k.rng.randrange(1,4);size=k.rng.uniform(2.5,4.3) if tile==0 else k.rng.uniform(.47,1.10)
        u=tile%2*.5;v=(1-tile//2)*.5
        for angle in (.31,1.86):
            dx=size*.72*math.cos(angle);dy=size*.72*math.sin(angle)
            picture(plants,(a(-dx,-dy,g),a(dx,dy,g),a(dx,dy,g+size),a(-dx,-dy,g+size)),((u+.006,v+.006),(u+.494,v+.006),(u+.494,v+.494),(u+.006,v+.494)))
    return {'efforts':0}


THEME={'lay':route,'land_builder':land,'road_builder':pavement,'terrain':{'sea':False},'road_half_width':4,
       'land':{'mid':0xAC7653},'sky':[0xD6C9BB,0xB9D8E8,0x74AADD,0x3F83C0,0x2866A0],'haze':0xBCA79B,
       'light':[0xFFE4BC,1.8],'fill':[0xBED8ED,0xB17F66],'sun_radius':9,'sun_altitude':.39,'sun_azimuth':.66}
