"""The three harbour bridge families and the working Speicherstadt waterfront."""
import math


def member(builder, a, b, width, depth=None, taper=1):
    """An oriented steel section with a rectangular cross section."""
    depth=width if depth is None else depth
    dx,dy,dz=(b[n]-a[n] for n in range(3));h=math.hypot(dx,dy);length=math.hypot(h,dz)
    if length < .001:return
    u=(-dy/h,dx/h,0) if h>.001 else (1,0,0)
    v=(dy*u[2]-dz*u[1],dz*u[0]-dx*u[2],dx*u[1]-dy*u[0])
    v=tuple(q/length for q in v)
    def corners(p,scale):
        return [tuple(p[n]+scale*(wu*width*u[n]+dv*depth*v[n])*.5 for n in range(3)) for wu,dv in ((-1,-1),(1,-1),(1,1),(-1,1))]
    lo,hi=corners(a,1),corners(b,taper)
    for i in range(4):builder.quad(lo[i],lo[(i+1)%4],hi[(i+1)%4],hi[i])
    builder.quad(*hi)


def bridge(k, first, last, number):
    deck=k.kerb+1.8
    colour=('neon-cyan','neon-pink','neon-violet','neon-amber')[number%4]
    steel=k.B['whitewash'];led=k.B[colour];dark=k.B['tower']
    def pos(f,l,z):return k.road.at(round(first+(last-first)*f),l,z)
    if number%4==0:
        # A single inclined shaft joins the two splayed lower legs above the carriageway.
        knee=pos(.49,0,17);head=pos(.56,0,57)
        for side in (-1,1):
            member(steel,pos(.45,side*deck,-1),knee,3.35,2.3,.75)
        member(steel,knee,head,3.55,2.5,.35)
        for j in range(1,14):
            t=j/14
            top=pos(.49+t*.07,0,17+t*40)
            for side in (-1,1):
                member(led,top,pos(.44-.39*t,side*deck,.85),.14)
        for side in (-1,1):
            for share in (.73,.78,.84):member(steel,head,pos(share,side*deck,.85),.22)
        k.halo(head,colour)
    elif number%4 in (1,2):
        # Separate Bolte-like concrete blades, slit down the middle by a continuous LED strip.
        for side in (-1,1):
            for step in (-1,1):
                foot=pos(.49+step*.006,side*(deck+2),-8)
                head=pos(.49+step*.006,side*(deck+2),47)
                member(steel,foot,head,2,1.35,.85)
            member(led,pos(.49,side*(deck+1.24),.45),pos(.49,side*(deck+1.24),46.8),.25)
        for side in (-1,1):
            for k_ in range(0,20):
                member(led,pos(k_/20,side*deck,-.16),pos((k_+1)/20,side*deck,-.16),.16)
    else:
        # Paired curving ribs and a changing lattice of hangers over the deck.
        for side in (-1,1):
            for j in range(34):
                a=j/34;b=(j+1)/34
                za=1.6+24*math.sin(a*math.pi);zb=1.6+24*math.sin(b*math.pi)
                p,q=pos(a,side*(deck+1.1),za),pos(b,side*(deck+1.1),zb)
                member(steel,p,q,.86,1.05);member(led,(p[0],p[1],p[2]+.52),(q[0],q[1],q[2]+.52),.16)
                if j%2==1:
                    member(dark,p,pos(a,side*deck,.64),.19)
                    member(steel,p,pos(b,-side*(deck+1.1),zb),.25)
    for j in range(2,18,2):
        k.light(pos(j/18,0,.12),colour,15,.54)
    return True


def warehouse(k,i,width,floors,off,wall):
    """Small gabled loading lofts, brick piers and warm ground-floor awnings."""
    yaw=k.s[i]['h'];top=3.6*floors+1.0
    n=3
    for j in range(n):
        centre=width*((j+.5)/n-.5)
        for side in (-1,1):
            a=k.P(i,centre+side*width/(2*n),wall+.16,top)
            b=k.P(i,centre,wall+.16,top+2.64)
            c=k.P(i,centre,wall+.16,top)
            k.B['brick'].tri(a,b,c);k.B['brick'].tri(c,b,a)
            member(k.B['wall'],a,b,.23)
        k.B['glow-window'].box(k.P(i,centre,wall+.23,top+.61),(.64,.14,.79),yaw)
        k.B['brick'].box(k.P(i,centre-width/(2*n),wall+.2,0),(.55,.48,top),yaw)
    for f in range(1,floors):
        k.B['wall'].box(k.P(i,0,wall+.13,f*3.6+.27),(width+.28,.37,.19),yaw)
    if i%3!=1:
        k.B['container-0'].box(k.P(i,0,wall+1.05,3.44),(width*.54,2.18,.19),yaw)
        for j in (-1,0,1):
            p=k.P(i,j*width*.17,wall+1.66,2.99)
            k.B['bulb'].box(p,(.19,.18,.26),yaw)
            k.light(k.P(i,j*width*.17,wall+1.91,0),'bulb',5,.52)


def liner(k):
    idx=k.road.index(8315);yaw=k.s[idx]['h'];base=k.s[idx]['z']
    def p(along,off,z):
        # Hull and quay use the same berth all ride.
        return k.P(idx,along,off+32,z-base)
    hull=k.B['dark'];rail=k.B['whitewash'];lit=k.B['glow-window']
    stations=[(-79,1),(-70,7),(-53,10),(44,10),(64,8.4),(81,.6)]
    for (a,wa),(b,wb) in zip(stations,stations[1:]):
        for side in (-1,1):
            quad=(p(a,side*wa,-.9),p(b,side*wb,-.9),p(b,side*(wb+.35),5.4),p(a,side*(wa+.35),5.4))
            hull.quad(*quad);hull.quad(*quad[::-1]);member(rail,p(a,side*wa,4.7),p(b,side*wb,4.7),.22)
    for deck in range(5):
        length=121-deck*7.5;width=17.2-deck*.55;z=5.46+deck*2.54
        rail.box(p(-3,0,z),(length,width,2.38),yaw)
        for side in (-1,1):
            k.B['wall'].box(p(-3,side*(width/2+.18),z+.38),(length-2,.16,1.28),yaw)
            for j in range(int(length/3.8)-1):
                w=-length/2+j*3.8
                lit.box(p(w,side*(width/2+.30),z+.62),(1.45,.11,.66),yaw)
            rail.box(p(-3,side*(width/2+.52),z+.29),(length+.6,.72,.17),yaw)
    for along in (12,26):k.prism(k.B['container-0'],p(along,0,18),1.92,4.9,12)
    # A moored schooner ahead of the terminal, with yards and standing rigging.
    for m in (-126,-110,-95):
        head=p(m,6,20);member(k.B['trunk'],p(m,6,2),head,.32,.31,.42)
        for z,w in ((11,8),(16,5.6)):member(rail,p(m,6-w,z),p(m,6+w,z),.15)
        for off in (-3,3):member(k.B['fence'],head,p(m+6,6+off,3),.054)
    hull.box(p(-109,6,.1),(47,6.9,2.9),yaw)
