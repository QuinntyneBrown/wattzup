// The street module of each scene built on the shared kit (world-kit.ts), by scene id. The
// renderer builds a scene's street from here in place of its panorama and generic posts.
import type { WorldId } from '@wattzup/api';
import { CaribanaStreet } from './world-caribana';
import { SouthBeachStreet } from './world-southbeach';
import { KnicksStreet } from './world-knicks';
import { VeniceStreet } from './world-venice';
import { KoppenbergStreet } from './world-koppenberg';
import { GoldenGateStreet } from './world-goldengate';
import { StanleyParkStreet } from './world-stanleypark';
import { SerpentineStreet } from './world-serpentine';
import { NapaStreet } from './world-napa';
import { AlpeStreet } from './world-alpe';
import { MontmartreStreet } from './world-montmartre';
import { BonnevilleStreet } from './world-bonneville';
import type { StreetFactory } from './world-kit';
import { GalibierStreet } from './world-galibier';
import { HooverStreet } from './world-hoover';
import { MaunaKeaStreet } from './world-maunakea';
import { GardenaStreet } from './world-gardena';
import { AngkorStreet } from './world-angkor';
import { MiamiStreet } from './world-miami';
import { AtacamaStreet } from './world-atacama';
import { DeathValleyStreet } from './world-deathvalley';
import { TahoeStreet } from './world-tahoe';
import { AntwerpStreet } from './world-antwerp';
import { SantaMonicaStreet } from './world-santamonica';
import { LetrasStreet } from './world-letras';
import { WinterludeStreet } from './world-winterlude';
import { ConeyStreet } from './world-coney';
import { AngelsStreet } from './world-angels';
import { CinqueTerreStreet } from './world-cinqueterre';
import { VelodromeStreet } from './world-velodrome';
import { AngliruStreet } from './world-angliru';
import { RedouteStreet } from './world-redoute';
import { WinnatsStreet } from './world-winnats';
import { AustinStreet } from './world-austin';
import { DubaiStreet } from './world-dubai';
import { HaleakalaStreet } from './world-haleakala';
import { WicklowStreet } from './world-wicklow';
import { StradeStreet } from './world-strade';
import { CalobraStreet } from './world-calobra';
import { ProspectStreet } from './world-prospect';
import { TorontoStreet } from './world-toronto';
import { SkyeStreet } from './world-skye';
import { IbizaStreet } from './world-ibiza';
import { PaineStreet } from './world-paine';
import { TempelhofStreet } from './world-tempelhof';
import { MonacoStreet } from './world-monaco';
import { TeideStreet } from './world-teide';
import { TremolaStreet } from './world-tremola';
import { TimesSquareStreet } from './world-timessquare';
import { EtnaStreet } from './world-etna';
import { YosemiteStreet } from './world-yosemite';
import { ComoStreet } from './world-como';
import { ChichenStreet } from './world-chichen';
import { BrickyardStreet } from './world-brickyard';
import { PoggioStreet } from './world-poggio';
import { TrollstigenStreet } from './world-trollstigen';
import { SaguaroStreet } from './world-saguaro';
import { HardknottStreet } from './world-hardknott';
import { PikePlaceStreet } from './world-pikeplace';
import { GlastonburyStreet } from './world-glastonbury';
import { TourmaletStreet } from './world-tourmalet';
import { TulipsStreet } from './world-tulips';
import { ChampsStreet } from './world-champs';
import { MarinaBayStreet } from './world-marinabay';
import { CampolongoStreet } from './world-campolongo';
import { NorthShoreStreet } from './world-northshore';
import { EdinburghStreet } from './world-edinburgh';
import { StelvioStreet } from './world-stelvio';
import { MontrealStreet } from './world-montreal';
import { SeaPointStreet } from './world-seapoint';
import { HavanaStreet } from './world-havana';
import { ChicagoStreet } from './world-chicago';
import { VentouxStreet } from './world-ventoux';
import { DaytonaStreet } from './world-daytona';
import { GizaStreet } from './world-giza';
import { AmsterdamStreet } from './world-amsterdam';
import { Route66Street } from './world-route66';
import { VegasStreet } from './world-vegas';
import { NottingHillStreet } from './world-nottinghill';
import { SuburbiaStreet } from './world-suburbia';
import { BlackpoolStreet } from './world-blackpool';
import { GhentStreet } from './world-ghent';
import { CentralParkStreet } from './world-centralpark';
import { WestminsterStreet } from './world-westminster';

export const STREETS: Partial<Record<WorldId, StreetFactory>> = {
  caribana: (track, disposables) => new CaribanaStreet(track, disposables),
  southbeach: (track, disposables) => new SouthBeachStreet(track, disposables),
  westminster: (track, disposables) => new WestminsterStreet(track, disposables),
  centralpark: (track, disposables) => new CentralParkStreet(track, disposables),
  ghent: (track, disposables) => new GhentStreet(track, disposables),
  blackpool: (track, disposables) => new BlackpoolStreet(track, disposables),
  suburbia: (track, disposables) => new SuburbiaStreet(track, disposables),
  nottinghill: (track, disposables) => new NottingHillStreet(track, disposables),
  knicks: (track, disposables) => new KnicksStreet(track, disposables),
  vegas: (track, disposables) => new VegasStreet(track, disposables),
  route66: (track, disposables) => new Route66Street(track, disposables),
  venice: (track, disposables) => new VeniceStreet(track, disposables),
  amsterdam: (track, disposables) => new AmsterdamStreet(track, disposables),
  giza: (track, disposables) => new GizaStreet(track, disposables),
  daytona: (track, disposables) => new DaytonaStreet(track, disposables),
  koppenberg: (track, disposables) => new KoppenbergStreet(track, disposables),
  ventoux: (track, disposables) => new VentouxStreet(track, disposables),
  chicago: (track, disposables) => new ChicagoStreet(track, disposables),
  goldengate: (track, disposables) => new GoldenGateStreet(track, disposables),
  havana: (track, disposables) => new HavanaStreet(track, disposables),
  seapoint: (track, disposables) => new SeaPointStreet(track, disposables),
  montreal: (track, disposables) => new MontrealStreet(track, disposables),
  stanleypark: (track, disposables) => new StanleyParkStreet(track, disposables),
  stelvio: (track, disposables) => new StelvioStreet(track, disposables),
  edinburgh: (track, disposables) => new EdinburghStreet(track, disposables),
  northshore: (track, disposables) => new NorthShoreStreet(track, disposables),
  campolongo: (track, disposables) => new CampolongoStreet(track, disposables),
  marinabay: (track, disposables) => new MarinaBayStreet(track, disposables),
  serpentine: (track, disposables) => new SerpentineStreet(track, disposables),
  champs: (track, disposables) => new ChampsStreet(track, disposables),
  tulips: (track, disposables) => new TulipsStreet(track, disposables),
  tourmalet: (track, disposables) => new TourmaletStreet(track, disposables),
  napa: (track, disposables) => new NapaStreet(track, disposables),
  glastonbury: (track, disposables) => new GlastonburyStreet(track, disposables),
  pikeplace: (track, disposables) => new PikePlaceStreet(track, disposables),
  hardknott: (track, disposables) => new HardknottStreet(track, disposables),
  alpe: (track, disposables) => new AlpeStreet(track, disposables),
  saguaro: (track, disposables) => new SaguaroStreet(track, disposables),
  trollstigen: (track, disposables) => new TrollstigenStreet(track, disposables),
  poggio: (track, disposables) => new PoggioStreet(track, disposables),
  montmartre: (track, disposables) => new MontmartreStreet(track, disposables),
  brickyard: (track, disposables) => new BrickyardStreet(track, disposables),
  chichen: (track, disposables) => new ChichenStreet(track, disposables),
  bonneville: (track, disposables) => new BonnevilleStreet(track, disposables),
  como: (track, disposables) => new ComoStreet(track, disposables),
  yosemite: (track, disposables) => new YosemiteStreet(track, disposables),
  etna: (track, disposables) => new EtnaStreet(track, disposables),
  timessquare: (track, disposables) => new TimesSquareStreet(track, disposables),
  tremola: (track, disposables) => new TremolaStreet(track, disposables),
  teide: (track, disposables) => new TeideStreet(track, disposables),
  monaco: (track, disposables) => new MonacoStreet(track, disposables),
  tempelhof: (track, disposables) => new TempelhofStreet(track, disposables),
  paine: (track, disposables) => new PaineStreet(track, disposables),
  ibiza: (track, disposables) => new IbizaStreet(track, disposables),
  skye: (track, disposables) => new SkyeStreet(track, disposables),
  toronto: (track, disposables) => new TorontoStreet(track, disposables),
  prospect: (track, disposables) => new ProspectStreet(track, disposables),
  calobra: (track, disposables) => new CalobraStreet(track, disposables),
  strade: (track, disposables) => new StradeStreet(track, disposables),
  wicklow: (track, disposables) => new WicklowStreet(track, disposables),
  haleakala: (track, disposables) => new HaleakalaStreet(track, disposables),
  dubai: (track, disposables) => new DubaiStreet(track, disposables),
  austin: (track, disposables) => new AustinStreet(track, disposables),
  winnats: (track, disposables) => new WinnatsStreet(track, disposables),
  redoute: (track, disposables) => new RedouteStreet(track, disposables),
  angliru: (track, disposables) => new AngliruStreet(track, disposables),
  velodrome: (track, disposables) => new VelodromeStreet(track, disposables),
  cinqueterre: (track, disposables) => new CinqueTerreStreet(track, disposables),
  angels: (track, disposables) => new AngelsStreet(track, disposables),
  coney: (track, disposables) => new ConeyStreet(track, disposables),
  winterlude: (track, disposables) => new WinterludeStreet(track, disposables),
  letras: (track, disposables) => new LetrasStreet(track, disposables),
  santamonica: (track, disposables) => new SantaMonicaStreet(track, disposables),
  antwerp: (track, disposables) => new AntwerpStreet(track, disposables),
  tahoe: (track, disposables) => new TahoeStreet(track, disposables),
  deathvalley: (track, disposables) => new DeathValleyStreet(track, disposables),
  atacama: (track, disposables) => new AtacamaStreet(track, disposables),
  angkor: (track, disposables) => new AngkorStreet(track, disposables),
  gardena: (track, disposables) => new GardenaStreet(track, disposables),
  maunakea: (track, disposables) => new MaunaKeaStreet(track, disposables),
  galibier: (track, disposables) => new GalibierStreet(track, disposables),
  hoover: (track, disposables) => new HooverStreet(track, disposables),
  miami: (track, disposables) => new MiamiStreet(track, disposables),
};
