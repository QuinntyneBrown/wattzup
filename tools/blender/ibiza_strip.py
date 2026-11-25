"""Bake the existing party into animated sections, keeping the original random stream."""
import math
import random

class Strip:
    def __init__(self,bc,builders):
        self.bc=bc
        self.batches={}
        for group,mat in (('StripDancers','party-white'),('StripFestoons','bulb'),
                          ('StripBeams','beam-pink'),('StripFleet','sail'),
                          ('CoveFoam','glint'),('StripCloth','awning-white')):
            b=bc.Builder(group,mat);b.colours=[];b.uvs=[]
            self.batches[group]=b
        self.builders=builders
        self.people=[builders[n] for n in ('dark','party-white','skin','skin-1','skin-2','hair-0','hair-1','hair-2','drink-0','drink-1','drink-2',*bc.CROWD)]

    def mark(self,parts):
        return [(b,len(b.verts),len(b.faces)) for b in parts]

    def move(self,marks,name,weights):
        target=self.batches[name]
        for part,v0,f0 in marks:
            if len(part.verts)==v0:continue
            transfer=len(target.verts)-v0
            points=part.verts[v0:]
            rgb=self.bc.srgb(self.bc.MATERIALS[part.mat]['color'])
            target.verts.extend(points)
            target.faces.extend(tuple(i+transfer for i in face) for face in part.faces[f0:])
            target.uvs.extend(weights(p) for p in points)
            def colour(p):
                shade=.76+.24*min(1,max(0,(p[2]-minz)/1.5)) if name=='StripDancers' else 1
                return (rgb[0]*shade,rgb[1]*shade,rgb[2]*shade,1.)
            minz=min(p[2] for p in points)
            target.colours.extend(colour(p) for p in points)
            del part.verts[v0:]
            del part.faces[f0:]

    def face(self,name,pts,tone,uv):
        b=self.batches[name];b.faces.append(tuple(b.v(p) for p in pts))
        b.colours.extend([self.bc.srgb(tone)]*len(pts));b.uvs.extend(uv)

    def furnishings(self,p,yaw,width):
        # Shade cloth hangs in scalloped panels from the pergola. Linen daybeds
        # have rolled cushions and shallow wooden feet.
        for k in range(3):
            u=(k-1)*width*.27;half=width*.108
            for j in range(6):
                t=j/6;s=(j+1)/6
                def shade(x,v):return p(x,-v*3.65,3.45-.54*math.sin(v*math.pi))
                self.face('StripCloth',(shade(u-half,t),shade(u+half,t),shade(u+half,s),shade(u-half,s)),
                          (0xDABD8A,0xE2CA9F,0xE5D3AF)[k],[(0,t),(1,t),(1,s),(0,s)])
            for v in (-.85,-2.45):
                self.builders['wood'].box(p(u,v,.17),(2.1,.76,.19),yaw)
                self.builders['awning-white'].box(p(u,v,.36),(2.04,.74,.15),yaw)
                self.builders['awning'].box(p(u-.81,v,.51),(.34,.63,.19),yaw)

    def boat(self,x,y,yaw,size=1,pink=False):
        c,s=math.cos(yaw),math.sin(yaw)
        def pos(u,v,z):return (x+size*(c*u-s*v),y+size*(s*u+c*v),z*size)
        def pl(pts,tone):
            self.face('StripFleet',[pos(*p) for p in pts],tone,[(p[1]*size,p[2]*size) for p in pts])
        stations=[(-4.5,.60),(-3.5,1.17),(-.6,1.39),(2.6,1.12),(4.8,.07)]
        for (a,v),(b,w) in zip(stations,stations[1:]):
            for side in (-1,1):
                pl(((a,v*.65*side,-.33),(b,w*.65*side,-.33),(b,w*side,.74),(a,v*side,.74)),0xE9DDC6)
                pl(((a,v*side,.39),(b,w*side,.39),(b,w*side,.51),(a,v*side,.51)),0x344B62)
            pl(((a,-v,.75),(b,-w,.75),(b,w,.75),(a,v,.75)),0xB59B78)
        def box(x0,x1,y0,y1,z0,z1,tone):
            corners=[(x0,y0),(x1,y0),(x1,y1),(x0,y1)]
            for j in range(4):
                a,b=corners[j],corners[(j+1)%4];pl(((*a,z0),(*b,z0),(*b,z1),(*a,z1)),tone)
            pl(tuple((*p,z1) for p in corners),tone)
        box(-1.65,1.39,-.66,.66,.75,1.32,0xEAE3D3)
        box(-1.3,.75,-.68,.68,1,1.25,0x586878)
        box(.16,.23,-.04,.04,1.32,10.85,0x6D655C)
        pl(((.13,0,10.5),(-3.85,.1,1.92),(.13,.1,2.12)),0xD992A5 if pink else 0xF3E5CB)
        pl(((.37,0,9.55),(.37,0,2.07),(3.79,.07,2.19)),0xF7E9D3)

    def cove(self,road,height_at):
        rng=random.Random(2138)
        # Make the sunset strip's Caló des Moro pocket beach meet the water.
        for d in range(752,1170,6):
            i=road.index(d)
            off=13
            while off<180 and height_at(*road.at(i,off)[:2])>-.28:off+=2
            if off>=180:continue
            for j in range(2):
                edge=off+rng.uniform(-1.8,.8);xx,yy,_=road.at(i,edge)
                rock = self.builders['rock']
                radius = rng.uniform(1.5, 3.1)
                rotation = rng.uniform(0, math.tau)
                skirt, crest = [], []
                for corner in range(6):
                    angle = rotation + corner * math.tau / 6
                    reach = radius * rng.uniform(.72, 1.18)
                    dx, dy = math.cos(angle)*reach, math.sin(angle)*reach*.72
                    skirt.append((xx+dx, yy+dy, -.38))
                    crest.append((xx+dx*.72, yy+dy*.77, rng.uniform(.15,.72)))
                for corner in range(6):
                    next_corner = (corner+1)%6
                    rock.quad(skirt[corner], skirt[next_corner], crest[next_corner], crest[corner])
                    rock.tri(crest[corner],crest[next_corner],(xx,yy,.78))
            points=[]
            for forward,side in ((0,1),(6,1.7),(6,3.1),(0,2.3)):
                xx,yy,_=road.at(road.index(d+forward),off+side);points.append((xx,yy,.095))
            self.face('CoveFoam',points,0xE7D6BD,[(d/12,0),(d/12+.5,0),(d/12+.5,1),(d/12,1)])
        for d in (950,998,1051,1114):
            i=road.index(d)
            for off in range(27,255,3):
                x,y,_=road.at(i,off)
                if height_at(x,y)<-2:
                    self.boat(x,y,road.s[i]['h']+.44,1.85 if d==1051 else 1.55,d==1051);break

    def build(self,col):
        for batch in self.batches.values():batch.build(col)
