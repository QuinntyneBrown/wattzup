# World music

Every World Ride world plays a background track of its own (L2-128). Each is a Pixabay track, used
under the [Pixabay Content License](https://pixabay.com/service/license-summary/), and no two worlds
share one. Soca went to the Caribbean and carnival worlds first; every other world got a genre that
fits its place.

The files in `frontend/public/music/` are the Pixabay MP3s re-encoded as Opus at 96 kbps mono, cut
to at most 3 minutes, with a 1.5-second fade in and a 2-second fade out so the loop does not click.
To replace a world's track, download the new one from Pixabay, encode it the same way
(`ffmpeg -i in.mp3 -t 180 -af "afade=t=in:d=1.5,afade=t=out:st=<length-2>:d=2" -ac 1 -c:a libopus -b:a 96k <world id>.ogg`)
and update its row here.

Downloaded 20 November 2026.

| World | File | Title | Artist | Pixabay |
|---|---|---|---|---|
| Neon Docklands | `music/docklands.ogg` | Synthwave | [Sub_Clair](https://pixabay.com/users/sub_clair-55456531/) | [628003](https://pixabay.com/music/synthwave-synthwave-628003/) |
| Col du Granit | `music/granite.ogg` | Cinematic - Cinematic Music | [NastelBom](https://pixabay.com/users/nastelbom-48128234/) | [623748](https://pixabay.com/music/suspense-cinematic-cinematic-music-623748/) |
| Old Town Criterium | `music/oldtown.ogg` | Folk Upbeat | [The_Mountain](https://pixabay.com/users/the_mountain-3616498/) | [179495](https://pixabay.com/music/happy-childrens-tunes-folk-upbeat-179495/) |
| Prairie Paceline | `music/prairie.ogg` | Country Western Texas Background Music | [ViacheslavStarostin](https://pixabay.com/users/viacheslavstarostin-50153119/) | [361672](https://pixabay.com/music/modern-country-country-western-texas-background-music-361672/) |
| Dolomites | `music/dolomites.ogg` | Mountain | [The_Mountain](https://pixabay.com/users/the_mountain-3616498/) | [159043](https://pixabay.com/music/main-title-mountain-159043/) |
| Cliffside Coast | `music/coast.ogg` | Summer Folk | [StudioKolomna](https://pixabay.com/users/studiokolomna-2073170/) | [632667](https://pixabay.com/music/folk-summer-folk-632667/) |
| Caribana Parade | `music/caribana.ogg` | Midnite Mas (Production Music: Moody, Afrobeat) | [Miyagisama](https://pixabay.com/users/miyagisama-491779/) | [21286](https://pixabay.com/music/upbeat-midnite-mas-production-music-moody-afrobeat-21286/) |
| Westminster Rush Hour | `music/westminster.ogg` | Hot Wind | [AlexGrohl](https://pixabay.com/users/alexgrohl-25289918/) | [293167](https://pixabay.com/music/hard-rock-hot-wind-293167/) |
| Central Park Loop | `music/centralpark.ogg` | Bring Back the Swing (Upbeat Jazz) | [EvolvingVibes](https://pixabay.com/users/evolvingvibes-56407377/) | [617230](https://pixabay.com/music/traditional-jazz-bring-back-the-swing-upbeat-jazz-617230/) |
| South Beach Sunrise | `music/southbeach.ogg` | Latina noche. Dance latin house. Background mexican reggaeton music | [White_Records](https://pixabay.com/users/white_records-32584949/) | [160302](https://pixabay.com/music/urban-latin-latina-noche-dance-latin-house-background-mexican-reggaeton-music-160302/) |
| Ghent Six-Day | `music/ghent.ogg` | Melodic Techno #03 Extended Version - Moogify | [tAUREON](https://pixabay.com/users/taureon-4257870/) | [9867](https://pixabay.com/music/techno-trance-melodic-techno-03-extended-version-moogify-9867/) |
| Blackpool Illuminations | `music/blackpool.ogg` | Disco Instrumental | [Sub_Clair](https://pixabay.com/users/sub_clair-55456531/) | [626296](https://pixabay.com/music/disco-disco-instrumental-626296/) |
| Suburban Sunrise | `music/suburbia.ogg` | Happy Acoustic Guitar | [Tunetank](https://pixabay.com/users/tunetank-50201703/) | [349697](https://pixabay.com/music/acoustic-group-happy-acoustic-guitar-349697/) |
| Notting Hill Carnival | `music/nottinghill.ogg` | Kingstown Carnival Nights | [u_98673jp944](https://pixabay.com/users/u_98673jp944-48995615/) | [335655](https://pixabay.com/music/upbeat-kingstown-carnival-nights-335655/) |
| Knicks Championship Parade | `music/knicks.ogg` | Oldschool Hip-Hop | [Sub_Clair](https://pixabay.com/users/sub_clair-55456531/) | [632388](https://pixabay.com/music/old-school-hip-hop-oldschool-hip-hop-632388/) |
| Las Vegas Strip | `music/vegas.ogg` | Children Electro Swing 2 | [Grand_Project](https://pixabay.com/users/grand_project-19033897/) | [127425](https://pixabay.com/music/christmas-children-electro-swing-2-127425/) |
| Route 66 Desert | `music/route66.ogg` | Country Rock | [Tunetank](https://pixabay.com/users/tunetank-50201703/) | [349183](https://pixabay.com/music/acoustic-group-country-rock-349183/) |
| Venice Beach Boardwalk | `music/venice.ogg` | Funk Happy | [BLESKSOUND](https://pixabay.com/users/blesksound-46694837/) | [634258](https://pixabay.com/music/funk-funk-happy-634258/) |
| Amsterdam Canals | `music/amsterdam.ogg` | Deep House | [NastelBom](https://pixabay.com/users/nastelbom-48128234/) | [351574](https://pixabay.com/music/upbeat-deep-house-351574/) |
| Giza Plateau | `music/giza.ogg` | Arabic | [Kulakovka](https://pixabay.com/users/kulakovka-47183261/) | [295885](https://pixabay.com/music/arabic-arabic-295885/) |
| Daytona Beach Sand | `music/daytona.ogg` | Surf Rock | [AlexGuz](https://pixabay.com/users/alexguz-37772443/) | [155127](https://pixabay.com/music/alternative-surf-rock-155127/) |
| Koppenberg Cobbles | `music/koppenberg.ogg` | Upbeat Folk | [PaulYudin](https://pixabay.com/users/paulyudin-27739282/) | [150300](https://pixabay.com/music/happy-childrens-tunes-upbeat-folk-150300/) |
| Mont Ventoux | `music/ventoux.ogg` | Epic Orchestral | [Kulakovka](https://pixabay.com/users/kulakovka-47183261/) | [274992](https://pixabay.com/music/main-title-epic-orchestral-274992/) |
| Chicago Loop Crit | `music/chicago.ogg` | Design Rock | [The_Mountain](https://pixabay.com/users/the_mountain-3616498/) | [137008](https://pixabay.com/music/rock-design-rock-137008/) |
| Golden Gate Park | `music/goldengate.ogg` | Psychedelic Hypnotic Theme | [TheoJT](https://pixabay.com/users/theojt-11288480/) | [160412](https://pixabay.com/music/ambient-psychedelic-hypnotic-theme-160412/) |
| Havana Malecón | `music/havana.ogg` | Happy Latin Salsa Dance | [kornevmusic](https://pixabay.com/users/kornevmusic-34073243/) | [621026](https://pixabay.com/music/salsa-happy-latin-salsa-dance-621026/) |
| Sea Point, Cape Town | `music/seapoint.ogg` | Afrobeat Instrumental | [Sub_Clair](https://pixabay.com/users/sub_clair-55456531/) | [622493](https://pixabay.com/music/afrobeat-afrobeat-instrumental-622493/) |
| Montreal Jazz Fest | `music/montreal.ogg` | Jazz Upbeat | [StudioKolomna](https://pixabay.com/users/studiokolomna-2073170/) | [632668](https://pixabay.com/music/smooth-jazz-jazz-upbeat-632668/) |
| Stanley Park Seawall | `music/stanleypark.ogg` | The Beat of Nature | [folk_acoustic](https://pixabay.com/users/folk_acoustic-25300778/) | [122841](https://pixabay.com/music/solo-guitar-the-beat-of-nature-122841/) |
| Stelvio Pass | `music/stelvio.ogg` | Trailer | [AtlasAudio](https://pixabay.com/users/atlasaudio-54514918/) | [636760](https://pixabay.com/music/main-title-trailer-636760/) |
| Edinburgh Fringe | `music/edinburgh.ogg` | Call of the Mountains | [geoffharvey](https://pixabay.com/users/geoffharvey-9096471/) | [154530](https://pixabay.com/music/adventure-call-of-the-mountains-154530/) |
| North Shore, Oahu | `music/northshore.ogg` | Romantic Ukulele | [StudioKolomna](https://pixabay.com/users/studiokolomna-2073170/) | [632659](https://pixabay.com/music/acoustic-group-romantic-ukulele-632659/) |
| Passo Campolongo | `music/campolongo.ogg` | Mountain Path | [epic_musictracks](https://pixabay.com/users/epic_musictracks-27466606/) | [125573](https://pixabay.com/music/beautiful-plays-mountain-path-125573/) |
| Marina Bay Night | `music/marinabay.ogg` | Future Bass | [Sub_Clair](https://pixabay.com/users/sub_clair-55456531/) | [628037](https://pixabay.com/music/future-bass-future-bass-628037/) |
| Serpentine, Hyde Park | `music/serpentine.ogg` | Classical - Classical Background | [NastelBom](https://pixabay.com/users/nastelbom-48128234/) | [623749](https://pixabay.com/music/modern-classical-classical-classical-background-623749/) |
| Champs-Élysées Finale | `music/champs.ogg` | Accordion | [The_Mountain](https://pixabay.com/users/the_mountain-3616498/) | [163872](https://pixabay.com/music/folk-accordion-163872/) |
| Dutch Tulip Fields | `music/tulips.ogg` | Kids Folk | [Kulakovka](https://pixabay.com/users/kulakovka-47183261/) | [274985](https://pixabay.com/music/happy-childrens-tunes-kids-folk-274985/) |
| Col du Tourmalet | `music/tourmalet.ogg` | Motivation Epic Rock | [AlexGrohl](https://pixabay.com/users/alexgrohl-25289918/) | [111444](https://pixabay.com/music/rock-motivation-epic-rock-111444/) |
| Napa Vineyards | `music/napa.ogg` | Coniferous forest | [orangery](https://pixabay.com/users/orangery-34071953/) | [142569](https://pixabay.com/music/acoustic-group-coniferous-forest-142569/) |
| Glastonbury Fields | `music/glastonbury.ogg` | Indie Rock | [Kulakovka](https://pixabay.com/users/kulakovka-47183261/) | [274975](https://pixabay.com/music/build-up-scenes-indie-rock-274975/) |
| Pike Place at Dawn | `music/pikeplace.ogg` | Grunge Rock | [SigmaMusicArt](https://pixabay.com/users/sigmamusicart-36860929/) | [203114](https://pixabay.com/music/rock-grunge-rock-203114/) |
| Hardknott Pass | `music/hardknott.ogg` | Celtic (Pop-Rock, Celtic, Instrumental) | [Lyrium-2025](https://pixabay.com/users/lyrium-2025-48518899/) | [343526](https://pixabay.com/music/pop-celtic-pop-rock-celtic-instrumental-343526/) |
| Alpe d'Huez | `music/alpe.ogg` | Party - Party Music | [Tatamusic](https://pixabay.com/users/tatamusic-51344851/) | [632594](https://pixabay.com/music/edm-party-party-music-632594/) |
| Saguaro Desert | `music/saguaro.ogg` | American Western Country | [Tunetank](https://pixabay.com/users/tunetank-50201703/) | [350098](https://pixabay.com/music/folk-american-western-country-350098/) |
| Trollstigen | `music/trollstigen.ogg` | Herr Mannelig - Epic and mystic Nordic Music - Swedish Ballad | [JuliusH](https://pixabay.com/users/juliush-3921568/) | [1949](https://pixabay.com/music/beats-herr-mannelig-epic-and-mystic-nordic-music-swedish-ballad-1949/) |
| The Poggio | `music/poggio.ogg` | Italy Background Music | [SigmaMusicArt](https://pixabay.com/users/sigmamusicart-36860929/) | [627402](https://pixabay.com/music/folk-italy-background-music-627402/) |
| Montmartre | `music/montmartre.ogg` | Soulful French Music | [andriih](https://pixabay.com/users/andriih-56549121/) | [630193](https://pixabay.com/music/france-soulful-french-music-630193/) |
| Indianapolis Brickyard | `music/brickyard.ogg` | Hard Rock (Fireman) | [AlexGrohl](https://pixabay.com/users/alexgrohl-25289918/) | [15041](https://pixabay.com/music/rock-hard-rock-fireman-15041/) |
| Chichén Itzá | `music/chichen.ogg` | Latin Mexican Spanish Music | [STAROSTIN](https://pixabay.com/users/starostin-46826676/) | [630504](https://pixabay.com/music/latin-latin-mexican-spanish-music-630504/) |
| Bonneville Salt Flats | `music/bonneville.ogg` | Harder Rock - Hard Rock | [MrClaps_](https://pixabay.com/users/mrclaps_-54709151/) | [487141](https://pixabay.com/music/hard-rock-harder-rock-hard-rock-487141/) |
| Lake Como | `music/como.ogg` | Romantic - Romantics Music | [andriig](https://pixabay.com/users/andriig-54059306/) | [632907](https://pixabay.com/music/acoustic-group-romantic-romantics-music-632907/) |
| Yosemite Valley | `music/yosemite.ogg` | Acoustic Folk | [PaulYudin](https://pixabay.com/users/paulyudin-27739282/) | [160684](https://pixabay.com/music/upbeat-acoustic-folk-160684/) |
| Mount Etna | `music/etna.ogg` | Tarantella neapolitan. Background music for vlog video. Club dance | [White_Records](https://pixabay.com/users/white_records-32584949/) | [167690](https://pixabay.com/music/techno-trance-tarantella-neapolitan-background-music-for-vlog-video-club-dance-167690/) |
| Times Square New Year's Eve | `music/timessquare.ogg` | Chinese Lunar New Year | [ViacheslavStarostin](https://pixabay.com/users/viacheslavstarostin-50153119/) | [465871](https://pixabay.com/music/china-chinese-lunar-new-year-465871/) |
| Tremola, Gotthard Pass | `music/tremola.ogg` | TVARI - Swiss View | [TVARI](https://pixabay.com/users/tvari-38302100/) | [163808](https://pixabay.com/music/beats-tvari-swiss-view-163808/) |
| Mount Teide | `music/teide.ogg` | Spanish Guitar | [SOUND_GARAGE](https://pixabay.com/users/sound_garage-47313534/) | [382440](https://pixabay.com/music/acoustic-group-spanish-guitar-382440/) |
| Monaco Street Circuit | `music/monaco.ogg` | Sensual Lounge | [StudioKolomna](https://pixabay.com/users/studiokolomna-2073170/) | [632673](https://pixabay.com/music/beats-sensual-lounge-632673/) |
| Tempelhof Field | `music/tempelhof.ogg` | Hard Techno | [Sub_Clair](https://pixabay.com/users/sub_clair-55456531/) | [622404](https://pixabay.com/music/techno-trance-hard-techno-622404/) |
| Torres del Paine | `music/paine.ogg` | Andean Peru Acoustic | [_Music_for_Creators_](https://pixabay.com/users/_music_for_creators_-24430395/) | [126167](https://pixabay.com/music/world-andean-peru-acoustic-126167/) |
| Ibiza Sunset Strip | `music/ibiza.ogg` | Deep House | [PaulYudin](https://pixabay.com/users/paulyudin-27739282/) | [112301](https://pixabay.com/music/deep-house-deep-house-112301/) |
| Isle of Skye Fog | `music/skye.ogg` | Auld Lang Syne - Flute Selection - Scottish Traditional Music | [JuliusH](https://pixabay.com/users/juliush-3921568/) | [1121](https://pixabay.com/music/scotland-auld-lang-syne-flute-selection-scottish-traditional-music-1121/) |
| Toronto Waterfront Trail | `music/toronto.ogg` | Summer Walk | [folk_acoustic](https://pixabay.com/users/folk_acoustic-25300778/) | [152722](https://pixabay.com/music/acoustic-group-summer-walk-152722/) |
| Prospect Park | `music/prospect.ogg` | Lofi Study - Calm Peaceful Chill Hop | [FASSounds](https://pixabay.com/users/fassounds-3433550/) | [112191](https://pixabay.com/music/beats-lofi-study-calm-peaceful-chill-hop-112191/) |
| Sa Calobra, Mallorca | `music/calobra.ogg` | Latin Mexican Flamenco | [Tunetank](https://pixabay.com/users/tunetank-50201703/) | [348464](https://pixabay.com/music/acoustic-group-latin-mexican-flamenco-348464/) |
| Strade Bianche | `music/strade.ogg` | bella ciao Guitar : AhmadMousavipour | [24575281](https://pixabay.com/users/24575281-24575281/) | [11996](https://pixabay.com/music/solo-guitar-bella-ciao-guitar-ahmadmousavipour-11996/) |
| Wicklow Gap | `music/wicklow.ogg` | Irish Jig | [Musictown](https://pixabay.com/users/musictown-25873992/) | [99533](https://pixabay.com/music/ireland-irish-jig-99533/) |
| Haleakalā | `music/haleakala.ogg` | Fun Happy Ukulele | [PaulYudin](https://pixabay.com/users/paulyudin-27739282/) | [113443](https://pixabay.com/music/happy-childrens-tunes-fun-happy-ukulele-113443/) |
| Dubai Marina | `music/dubai.ogg` | Arabic | [Music_For_Videos](https://pixabay.com/users/music_for_videos-26992513/) | [124637](https://pixabay.com/music/world-arabic-124637/) |
| Sixth Street, Austin | `music/austin.ogg` | Summer Blues | [The_Mountain](https://pixabay.com/users/the_mountain-3616498/) | [138614](https://pixabay.com/music/modern-blues-summer-blues-138614/) |
| Winnats Pass | `music/winnats.ogg` | Drum and Bass | [The_Mountain](https://pixabay.com/users/the_mountain-3616498/) | [155574](https://pixabay.com/music/drum-n-bass-drum-and-bass-155574/) |
| La Redoute | `music/redoute.ogg` | Uplifting Trance | [Eliveta](https://pixabay.com/users/eliveta-54138692/) | [472317](https://pixabay.com/music/dance-uplifting-trance-472317/) |
| Angliru | `music/angliru.ogg` | Spanish Spain Latin Music | [STAROSTIN](https://pixabay.com/users/starostin-46826676/) | [260578](https://pixabay.com/music/acoustic-group-spanish-spain-latin-music-260578/) |
| Lee Valley Velodrome | `music/velodrome.ogg` | Energy EDM | [The_Mountain](https://pixabay.com/users/the_mountain-3616498/) | [155588](https://pixabay.com/music/future-bass-energy-edm-155588/) |
| Cinque Terre | `music/cinqueterre.ogg` | Acoustic Waltz Trailer-acoustic version | [MusicLFiles](https://pixabay.com/users/musiclfiles-3826066/) | [123816](https://pixabay.com/music/acoustic-group-acoustic-waltz-trailer-acoustic-version-123816/) |
| Els Àngels, Girona | `music/angels.ogg` | Modern Spanish Pop Rumba - Pop Cello and Flamenco Guitar | [JuliusH](https://pixabay.com/users/juliush-3921568/) | [2469](https://pixabay.com/music/urban-latin-modern-spanish-pop-rumba-pop-cello-and-flamenco-guitar-2469/) |
| Coney Island Boardwalk | `music/coney.ogg` | Country Rock And Roll | [AudioCoffee](https://pixabay.com/users/audiocoffee-27005420/) | [111784](https://pixabay.com/music/rock-country-rock-and-roll-111784/) |
| Winterlude, Ottawa | `music/winterlude.ogg` | Winter - Winter Music | [ViacheslavStarostin](https://pixabay.com/users/viacheslavstarostin-50153119/) | [630844](https://pixabay.com/music/christmas-winter-winter-music-630844/) |
| Alto de Letras | `music/letras.ogg` | CUMBIA A | [KAIRONVOSS](https://pixabay.com/users/kaironvoss-13469736/) | [446533](https://pixabay.com/music/latin-cumbia-a-446533/) |
| Santa Monica Pier | `music/santamonica.ogg` | Retro Surf Rock | [Tunetank](https://pixabay.com/users/tunetank-50201703/) | [348237](https://pixabay.com/music/hard-rock-retro-surf-rock-348237/) |
| Antwerp Port Sprint | `music/antwerp.ogg` | Industrial | [MrClaps_](https://pixabay.com/users/mrclaps_-54709151/) | [487142](https://pixabay.com/music/hard-rock-industrial-487142/) |
| Lake Tahoe | `music/tahoe.ogg` | Chill Beats | [Sub_Clair](https://pixabay.com/users/sub_clair-55456531/) | [627065](https://pixabay.com/music/beats-chill-beats-627065/) |
| Death Valley | `music/deathvalley.ogg` | Desert Road | [SergePavkinMusic](https://pixabay.com/users/sergepavkinmusic-6130722/) | [310409](https://pixabay.com/music/alternative-desert-road-310409/) |
| Atacama Desert | `music/atacama.ogg` | Piano and Guitar Bossa | [JuliusH](https://pixabay.com/users/juliush-3921568/) | [3690](https://pixabay.com/music/bossa-nova-piano-and-guitar-bossa-3690/) |
| Angkor Temples | `music/angkor.ogg` | China Chinese Asian Music | [ikoliks_aj](https://pixabay.com/users/ikoliks_aj-48415707/) | [346568](https://pixabay.com/music/world-china-chinese-asian-music-346568/) |
| Trinidad J'Ouvert | `music/jouvert.ogg` | Port of Spain Carnival Flow | [u_98673jp944](https://pixabay.com/users/u_98673jp944-48995615/) | [330709](https://pixabay.com/music/folk-port-of-spain-carnival-flow-330709/) |
| Rio Sambadrome | `music/sambadrome.ogg` | Bossa Nova - Summer - Instrumental Brazil | [Musicalmix2020](https://pixabay.com/users/musicalmix2020-13595517/) | [7969](https://pixabay.com/music/bossa-nova-bossa-nova-summer-instrumental-brazil-7969/) |
| Lisbon Tram Hills | `music/lisbon.ogg` | Fado da Voz Habitante | [djovan](https://pixabay.com/users/djovan-36764943/) | [486789](https://pixabay.com/music/pop-fado-da-voz-habitante-486789/) |
| Cornish Harbour | `music/cornwall.ogg` | Shanty Spanish Ladies (Acoustic) Loop | [Ebunny](https://pixabay.com/users/ebunny-22480773/) | [629099](https://pixabay.com/music/acoustic-group-shanty-spanish-ladies-acoustic-loop-629099/) |
| Copacabana Promenade | `music/copacabana.ogg` | Bossa Nova Soulful Music | [andriih](https://pixabay.com/users/andriih-56549121/) | [630197](https://pixabay.com/music/bossa-nova-bossa-nova-soulful-music-630197/) |
| Bondi to Bronte | `music/bondi.ogg` | Shake The Ground\|Suno Music Show YouTube | [SunoMusicShowYouTube](https://pixabay.com/users/sunomusicshowyoutube-25121377/) | [210728](https://pixabay.com/music/pop-shake-the-groundsuno-music-show-youtube-210728/) |
| Kīlauea Lava Road | `music/kilauea.ogg` | Tribal Drums Music | [AliveTunesMusic](https://pixabay.com/users/alivetunesmusic-21339672/) | [125773](https://pixabay.com/music/build-up-scenes-tribal-drums-music-125773/) |
| Shibuya Crossing | `music/shibuya.ogg` | Explore Japan - Travel Music Beat | [FASSounds](https://pixabay.com/users/fassounds-3433550/) | [199943](https://pixabay.com/music/trap-explore-japan-travel-music-beat-199943/) |
| Día de Muertos Parade | `music/muertos.ogg` | Tex Mex Delight - Mexican Mariachi | [FreeGroove](https://pixabay.com/users/freegroove-20279938/) | [113044](https://pixabay.com/music/island-tex-mex-delight-mexican-mariachi-113044/) |
| San Fermín, Pamplona | `music/pamplona.ogg` | Spanish Music | [Echobrainz](https://pixabay.com/users/echobrainz-55095840/) | [626123](https://pixabay.com/music/flamenco-spanish-music-626123/) |
| Great Ocean Road | `music/greatocean.ogg` | Electronic Stylish Rock | [AlexGrohl](https://pixabay.com/users/alexgrohl-25289918/) | [15045](https://pixabay.com/music/beats-electronic-stylish-rock-15045/) |
| San Francisco Hills | `music/sfhills.ogg` | Disco | [Sub_Clair](https://pixabay.com/users/sub_clair-55456531/) | [626295](https://pixabay.com/music/disco-disco-626295/) |
| Mardi Gras, New Orleans | `music/mardigras.ogg` | The Best Jazz Club In New Orleans | [PaoloArgento](https://pixabay.com/users/paoloargento-38603296/) | [164472](https://pixabay.com/music/traditional-jazz-the-best-jazz-club-in-new-orleans-164472/) |
| Victoria Harbour | `music/victoria.ogg` | Chinese New Year | [StudioKolomna](https://pixabay.com/users/studiokolomna-2073170/) | [468916](https://pixabay.com/music/china-chinese-new-year-468916/) |
| Holi in Jaipur | `music/jaipur.ogg` | Bollywood | [Kulakovka](https://pixabay.com/users/kulakovka-47183261/) | [295882](https://pixabay.com/music/india-bollywood-295882/) |
| Overseas Highway | `music/overseas.ogg` | Saint Kitts Bay | [u_98673jp944](https://pixabay.com/users/u_98673jp944-48995615/) | [333396](https://pixabay.com/music/cafe-saint-kitts-bay-333396/) |
| Isle of Man Mountain Course | `music/isleofman.ogg` | Biker Metal | [The_Mountain](https://pixabay.com/users/the_mountain-3616498/) | [158055](https://pixabay.com/music/rock-biker-metal-158055/) |
| Philadelphia Art Museum Steps | `music/artmuseum.ogg` | Motivational - Motivational Background | [NastelBom](https://pixabay.com/users/nastelbom-48128234/) | [623747](https://pixabay.com/music/corporate-motivational-motivational-background-623747/) |
| Lake Louise | `music/lakelouise.ogg` | Soft Ambient | [Sub_Clair](https://pixabay.com/users/sub_clair-55456531/) | [634887](https://pixabay.com/music/ambient-soft-ambient-634887/) |
| Bealach na Bà | `music/bealach.ogg` | With a Celtic Heart | [NaturesEye](https://pixabay.com/users/natureseye-18615106/) | [8656](https://pixabay.com/music/ambient-with-a-celtic-heart-8656/) |
| Han River Parks, Seoul | `music/hanriver.ogg` | Colorful | [nomaBeats](https://pixabay.com/users/nomabeats-17085827/) | [146442](https://pixabay.com/music/beats-colorful-146442/) |
| Oktoberfest, Munich | `music/oktoberfest.ogg` | Luna Park - Accordion Music | [JuliusH](https://pixabay.com/users/juliush-3921568/) | [3835](https://pixabay.com/music/amusement-park-luna-park-accordion-music-3835/) |
| Brooklyn Bridge Commute | `music/brooklyn.ogg` | Beautiful Boom Bap | [Music_Unlimited](https://pixabay.com/users/music_unlimited-27600023/) | [113776](https://pixabay.com/music/beats-beautiful-boom-bap-113776/) |
| Strasbourg Christmas Market | `music/strasbourg.ogg` | Christmas Cheerful | [SOULFULJAMTRACKS](https://pixabay.com/users/soulfuljamtracks-46363515/) | [631645](https://pixabay.com/music/christmas-christmas-cheerful-631645/) |
| Kyoto Hanami | `music/kyoto.ogg` | Japan Koto Folk Background Music | [Music_Unlimited](https://pixabay.com/users/music_unlimited-27600023/) | [124876](https://pixabay.com/music/world-japan-koto-folk-background-music-124876/) |
| Bathsheba, Barbados | `music/bathsheba.ogg` | Bridgetown Breeze in Barbados | [u_98673jp944](https://pixabay.com/users/u_98673jp944-48995615/) | [330708](https://pixabay.com/music/island-bridgetown-breeze-in-barbados-330708/) |
| Machu Picchu Road | `music/machupicchu.ogg` | Mountain Reverie | [VifotoFreeSounds](https://pixabay.com/users/vifotofreesounds-47264810/) | [385287](https://pixabay.com/music/folk-mountain-reverie-385287/) |
| Outback Highway | `music/outback.ogg` | Khutulun  \| Fantasy & Battle  Background Music | [OB-LIX](https://pixabay.com/users/ob-lix-17147719/) | [115812](https://pixabay.com/music/main-title-khutulun-fantasy-amp-battle-background-music-115812/) |
| Tel Aviv Promenade | `music/telaviv.ogg` | Meditative Middle Eastern Flute | [Ashot_Danielyan](https://pixabay.com/users/ashot_danielyan-27049680/) | [113656](https://pixabay.com/music/meditationspiritual-meditative-middle-eastern-flute-113656/) |
| Silverstone Track Day | `music/silverstone.ogg` | Action - Action Rock | [Poradovskyi](https://pixabay.com/users/poradovskyi-52868186/) | [628030](https://pixabay.com/music/rock-action-action-rock-628030/) |
| Mur de Huy | `music/murdehuy.ogg` | Motivation Sport Rock Trailer | [AlexGrohl](https://pixabay.com/users/alexgrohl-25289918/) | [478796](https://pixabay.com/music/rock-motivation-sport-rock-trailer-478796/) |
| Arenberg Forest | `music/arenberg.ogg` | Metal (Dark Matter) | [AlexGrohl](https://pixabay.com/users/alexgrohl-25289918/) | [111451](https://pixabay.com/music/metal-metal-dark-matter-111451/) |
| Chicago Lakefront Trail | `music/lakefront.ogg` | Freccero - Light It Up (Chicago) | [86349](https://pixabay.com/users/86349-86349/) | [115242](https://pixabay.com/music/electro-freccero-light-it-up-chicago-115242/) |
| Diwali, Marine Drive | `music/diwali.ogg` | Indian Hindi | [Sub_Clair](https://pixabay.com/users/sub_clair-55456531/) | [632690](https://pixabay.com/music/india-indian-hindi-632690/) |
| Passo Sella | `music/sella.ogg` | Dark Mountain Haze | [DSTechnician](https://pixabay.com/users/dstechnician-26430546/) | [113014](https://pixabay.com/music/ambient-dark-mountain-haze-113014/) |
| Kona Ironman | `music/kona.ogg` | Tropical Island | [The_Mountain](https://pixabay.com/users/the_mountain-3616498/) | [137031](https://pixabay.com/music/soft-house-tropical-island-137031/) |
| Seven Sisters Cliffs | `music/sevensisters.ogg` | Celtic - Irish - Scottish - Tin Whistle Background Music | [JuliusH](https://pixabay.com/users/juliush-3921568/) | [10455](https://pixabay.com/music/folk-celtic-irish-scottish-tin-whistle-background-music-10455/) |
| Brighton Pride | `music/brighton.ogg` | Pop Dance | [Kulakovka](https://pixabay.com/users/kulakovka-47183261/) | [266606](https://pixabay.com/music/upbeat-pop-dance-266606/) |
| Iceland Ring Road | `music/iceland.ogg` | Icelandic Winds - Ambient Soundscape | [Dream-Protocol](https://pixabay.com/users/dream-protocol-9556087/) | [114641](https://pixabay.com/music/ambient-icelandic-winds-ambient-soundscape-114641/) |
| Sydney Harbour Fireworks | `music/sydneyharbour.ogg` | Celebration - Celebration Music | [lNPLUSMUSIC](https://pixabay.com/users/lnplusmusic-47631836/) | [628824](https://pixabay.com/music/pop-celebration-celebration-music-628824/) |
| Monte Zoncolan | `music/zoncolan.ogg` | Epic Motivation | [Kulakovka](https://pixabay.com/users/kulakovka-47183261/) | [618588](https://pixabay.com/music/orchestral-epic-motivation-618588/) |
| Valais Ski Stations | `music/valais.ogg` | Swiss Beautiful | [chill_background](https://pixabay.com/users/chill_background-25283030/) | [130864](https://pixabay.com/music/modern-classical-swiss-beautiful-130864/) |
| Loire Châteaux | `music/loire.ogg` | Medieval - Medieval Music | [SigmaMusicArt](https://pixabay.com/users/sigmamusicart-36860929/) | [152847](https://pixabay.com/music/main-title-medieval-medieval-music-152847/) |
| Copenhagen Cycle Superhighway | `music/copenhagen.ogg` | Ambient Cinematic | [imageaudioteam](https://pixabay.com/users/imageaudioteam-39459211/) | [170256](https://pixabay.com/music/main-title-ambient-cinematic-170256/) |
| Surfers Paradise | `music/surfers.ogg` | Blije Soca Instrumentale Muziek Up-tempo Energieke Zomerse Beat | [RoyaltyFreeBeats](https://pixabay.com/users/royaltyfreebeats-2701284/) | [293286](https://pixabay.com/music/upbeat-blije-soca-instrumentale-muziek-up-tempo-energieke-zomerse-beat-293286/) |
| Moab Slickrock | `music/moab.ogg` | Western Cowboy Duel Background | [Tunetank](https://pixabay.com/users/tunetank-50201703/) | [350113](https://pixabay.com/music/mystery-western-cowboy-duel-background-350113/) |
| Glasgow World Championships | `music/glasgow.ogg` | Way To The Highlands | [SergePavkinMusic](https://pixabay.com/users/sergepavkinmusic-6130722/) | [115956](https://pixabay.com/music/beautiful-plays-way-to-the-highlands-115956/) |
| Mount Washington Auto Road | `music/mountwashington.ogg` | Acoustic - Acoustic Music | [ikoliks_aj](https://pixabay.com/users/ikoliks_aj-48415707/) | [634963](https://pixabay.com/music/folk-acoustic-acoustic-music-634963/) |
| Grand Canyon South Rim | `music/grandcanyon.ogg` | Desert | [The_Mountain](https://pixabay.com/users/the_mountain-3616498/) | [146132](https://pixabay.com/music/modern-classical-desert-146132/) |
| Calgary Stampede | `music/stampede.ogg` | Fried Taters Bluegrass | [Caffeine_Creek_Band](https://pixabay.com/users/caffeine_creek_band-11181297/) | [18547](https://pixabay.com/music/traditional-country-fried-taters-bluegrass-18547/) |
| La Mercè, Barcelona | `music/merce.ogg` | Fashion Upbeat | [BLESKSOUND](https://pixabay.com/users/blesksound-46694837/) | [634256](https://pixabay.com/music/old-school-hip-hop-fashion-upbeat-634256/) |
| St. Patrick's Day, Dublin | `music/stpatricks.ogg` | Irish Bay | [SergePavkinMusic](https://pixabay.com/users/sergepavkinmusic-6130722/) | [213621](https://pixabay.com/music/folk-irish-bay-213621/) |
| Big Sur | `music/bigsur.ogg` | Laguna Beach - Californian Surf Rock-Pop | [JuliusH](https://pixabay.com/users/juliush-3921568/) | [2020](https://pixabay.com/music/alternative-laguna-beach-californian-surf-rock-pop-2020/) |
| Songkran, Bangkok | `music/songkran.ogg` | Jade Twilight | [Tuneful_Tones](https://pixabay.com/users/tuneful_tones-41134202/) | [184920](https://pixabay.com/music/beats-jade-twilight-184920/) |
| Playground Park Loop | `music/playground.ogg` | Fun - Fun Music | [GR0ZA](https://pixabay.com/users/gr0za-54059129/) | [627580](https://pixabay.com/music/pop-fun-fun-music-627580/) |
| Hoover Dam | `music/hoover.ogg` | Ambient Industrial | [Music-for-Videos](https://pixabay.com/users/music-for-videos-24014275/) | [153562](https://pixabay.com/music/corporate-ambient-industrial-153562/) |
| Aguascalientes Velodrome | `music/aguascalientes.ogg` | Latin Instrumental | [Sub_Clair](https://pixabay.com/users/sub_clair-55456531/) | [632595](https://pixabay.com/music/latin-latin-instrumental-632595/) |
| Atlantic Ocean Road | `music/atlanticroad.ogg` | Nordic Epic Adventure Dramatic Heroic Soundtrack | [Denis-Pavlov-Music](https://pixabay.com/users/denis-pavlov-music-35636692/) | [247522](https://pixabay.com/music/main-title-nordic-epic-adventure-dramatic-heroic-soundtrack-247522/) |
| Fish Hill, Cotswolds | `music/fishhill.ogg` | English Waltz - Slow Waltz - Orchestra and Concert Grand Piano | [JuliusH](https://pixabay.com/users/juliush-3921568/) | [8284](https://pixabay.com/music/beautiful-plays-english-waltz-slow-waltz-orchestra-and-concert-grand-piano-8284/) |
| Junkanoo, Nassau | `music/junkanoo.ogg` | Atlas • Trinidad & Tobago | [Vadim_Makes_Sound](https://pixabay.com/users/vadim_makes_sound-54823268/) | [577053](https://pixabay.com/music/funk-atlas-trinidad-amp-tobago-577053/) |
| Old Québec | `music/quebec.ogg` | Far From The City | [Good_B_Music](https://pixabay.com/users/good_b_music-22836301/) | [114444](https://pixabay.com/music/acoustic-group-far-from-the-city-114444/) |
| Mount Fuji Road | `music/fuji.ogg` | Japan Japanese Music | [HitsLab](https://pixabay.com/users/hitslab-47305729/) | [636008](https://pixabay.com/music/world-japan-japanese-music-636008/) |
| The Bund, Shanghai | `music/bund.ogg` | Lunar Chinese New Year Music | [STAROSTIN](https://pixabay.com/users/starostin-46826676/) | [284432](https://pixabay.com/music/adventure-lunar-chinese-new-year-music-284432/) |
| Comuna 13, Medellín | `music/comuna13.ogg` | Latin reggaeton hip hop. Mexican background music. Caliente Flow | [White_Records](https://pixabay.com/users/white_records-32584949/) | [146085](https://pixabay.com/music/urban-latin-latin-reggaeton-hip-hop-mexican-background-music-caliente-flow-146085/) |
| Adelaide Hills | `music/adelaide.ogg` | Indie Rock | [Kulakovka](https://pixabay.com/users/kulakovka-47183261/) | [270437](https://pixabay.com/music/indie-pop-indie-rock-270437/) |
| Sella Ronda | `music/sellaronda.ogg` | Mountain | [Alex_MakeMusic](https://pixabay.com/users/alex_makemusic-24186663/) | [11699](https://pixabay.com/music/main-title-mountain-11699/) |
| Marrakech Medina | `music/marrakech.ogg` | Arabic - Arabic Music | [ViacheslavStarostin](https://pixabay.com/users/viacheslavstarostin-50153119/) | [627656](https://pixabay.com/music/arabic-arabic-arabic-music-627656/) |
| Mount Tamalpais | `music/tamalpais.ogg` | California | [MagpieMusic](https://pixabay.com/users/magpiemusic-40918098/) | [183638](https://pixabay.com/music/rock-california-183638/) |
| Independence Pass | `music/independence.ogg` | Bluegrass Banjo Band | [solarmusic](https://pixabay.com/users/solarmusic-27851065/) | [113420](https://pixabay.com/music/traditional-country-bluegrass-banjo-band-113420/) |
| Fenland Time Trial | `music/fens.ogg` | Minimal | [PaulYudin](https://pixabay.com/users/paulyudin-27739282/) | [164833](https://pixabay.com/music/corporate-minimal-164833/) |
| Vienna Ringstrasse | `music/vienna.ogg` | Royal Majestic Waltz Music | [Tunetank](https://pixabay.com/users/tunetank-50201703/) | [414666](https://pixabay.com/music/main-title-royal-majestic-waltz-music-414666/) |
| Blue Mountains, Jamaica | `music/bluemountains.ogg` | Reggae Reggaeton Jamaican Jamaica Music | [STAROSTIN](https://pixabay.com/users/starostin-46826676/) | [496206](https://pixabay.com/music/reggae-reggae-reggaeton-jamaican-jamaica-music-496206/) |
| Col d'Aubisque | `music/aubisque.ogg` | France French Paris Music | [Tunetank](https://pixabay.com/users/tunetank-50201703/) | [349201](https://pixabay.com/music/happy-childrens-tunes-france-french-paris-music-349201/) |
| Rome Colosseum Loop | `music/rome.ogg` | Vikings Cinematics | [Simoke](https://pixabay.com/users/simoke-18724235/) | [143705](https://pixabay.com/music/main-title-vikings-cinematics-143705/) |
| Great St Bernard Pass | `music/stbernard.ogg` | Zermatt | [DayFox](https://pixabay.com/users/dayfox-29184718/) | [119621](https://pixabay.com/music/upbeat-zermatt-119621/) |
| Avenida 9 de Julio | `music/nuevedejulio.ogg` | Adeline. Background tango dance hip hop. Fun music for video | [White_Records](https://pixabay.com/users/white_records-32584949/) | [150282](https://pixabay.com/music/beats-adeline-background-tango-dance-hip-hop-fun-music-for-video-150282/) |
| Okinawa Coast Road | `music/okinawa.ogg` | Japanese Chinese Korean Music | [MFCC](https://pixabay.com/users/mfcc-28627740/) | [261603](https://pixabay.com/music/world-japanese-chinese-korean-music-261603/) |
| Algarve Cliffs | `music/algarve.ogg` | Acoustic Folk | [Kulakovka](https://pixabay.com/users/kulakovka-47183261/) | [276657](https://pixabay.com/music/acoustic-group-acoustic-folk-276657/) |
| Mulholland Drive | `music/mulholland.ogg` | Dark Bar | [softsuicide](https://pixabay.com/users/softsuicide-22684503/) | [7386](https://pixabay.com/music/traditional-jazz-dark-bar-7386/) |
| Provence Lavender | `music/provence.ogg` | France French Paris Music | [Tunetank](https://pixabay.com/users/tunetank-50201703/) | [348887](https://pixabay.com/music/world-france-french-paris-music-348887/) |
| Cherry Blossom Festival, D.C. | `music/cherryblossom.ogg` | Spring | [The_Mountain](https://pixabay.com/users/the_mountain-3616498/) | [167608](https://pixabay.com/music/modern-classical-spring-167608/) |
| Oude Kwaremont | `music/kwaremont.ogg` | Uplifting Action Sport Energetic Rock | [ikoliks](https://pixabay.com/users/ikoliks-6286177/) | [619094](https://pixabay.com/music/rock-uplifting-action-sport-energetic-rock-619094/) |
| Oregon Coast | `music/oregon.ogg` | A call to the soul | [folk_acoustic_music](https://pixabay.com/users/folk_acoustic_music-34397232/) | [149262](https://pixabay.com/music/acoustic-group-a-call-to-the-soul-149262/) |
| Cypress Mountain | `music/cypress.ogg` | Canadian Mountain - Filmmusik - Horst Rathmann | [Kilofon](https://pixabay.com/users/kilofon-5601292/) | [4916](https://pixabay.com/music/main-title-canadian-mountain-filmmusik-horst-rathmann-4916/) |
| Iten, Kenya | `music/iten.ogg` | African - African Music | [STAROSTIN](https://pixabay.com/users/starostin-46826676/) | [630506](https://pixabay.com/music/world-african-african-music-630506/) |
| The Palouse | `music/palouse.ogg` | Country Music | [Tunetank](https://pixabay.com/users/tunetank-50201703/) | [347561](https://pixabay.com/music/traditional-country-country-music-347561/) |
| Prague Old Town | `music/prague.ogg` | Hard Polka Metal - Upbeat Accordion Folk Metal (Czech Style) | [NickPanek](https://pixabay.com/users/nickpanek-38266323/) | [473878](https://pixabay.com/music/metal-hard-polka-metal-upbeat-accordion-folk-metal-czech-style-473878/) |
| Ffordd Pen Llech | `music/penllech.ogg` | Nelferch/Stitches in Winter | [TokyoRifft](https://pixabay.com/users/tokyorifft-1797/) | [405722](https://pixabay.com/music/upbeat-nelferchstitches-in-winter-405722/) |
| Andalusian White Villages | `music/pueblos.ogg` | 07 Flagstaff Flamenco | [lanecook](https://pixabay.com/users/lanecook-5456994/) | [112412](https://pixabay.com/music/pulses-07-flagstaff-flamenco-112412/) |
| Mongolian Steppe | `music/steppe.ogg` | Voice Of Desert (Medieval Cinematic History Trailer) | [VasilYatsevich](https://pixabay.com/users/vasilyatsevich-601514/) | [146677](https://pixabay.com/music/main-title-voice-of-desert-medieval-cinematic-history-trailer-146677/) |
| Teotihuacán | `music/teotihuacan.ogg` | Magical Ritual Shaman Amazonian Indians | [Denis-Pavlov-Music](https://pixabay.com/users/denis-pavlov-music-35636692/) | [197516](https://pixabay.com/music/world-magical-ritual-shaman-amazonian-indians-197516/) |
| Furka Pass | `music/furka.ogg` | Yodeling Folk | [moodmode](https://pixabay.com/users/moodmode-33139253/) | [248420](https://pixabay.com/music/folk-yodeling-folk-248420/) |
| Beach Road, Melbourne | `music/beachroad.ogg` | Atlas • Guyana | [Vadim_Makes_Sound](https://pixabay.com/users/vadim_makes_sound-54823268/) | [573698](https://pixabay.com/music/world-atlas-guyana-573698/) |
| Blue Ridge Parkway | `music/blueridge.ogg` | Banjo Romp | [Caffeine_Creek_Band](https://pixabay.com/users/caffeine_creek_band-11181297/) | [109570](https://pixabay.com/music/traditional-country-banjo-romp-109570/) |
| Verona Arena Finale | `music/verona.ogg` | _La Mort Ophelia   Saint-Saens  Anneliese Von Koenig  Mezzo | [Anneliese-Von-Koenig](https://pixabay.com/users/anneliese-von-koenig-13046963/) | [125024](https://pixabay.com/music/vocal-la-mort-ophelia-saint-saens-anneliese-von-koenig-mezzo-125024/) |
| Valparaíso Stairways | `music/valparaiso.ogg` | Latin America | [Sub_Clair](https://pixabay.com/users/sub_clair-55456531/) | [632587](https://pixabay.com/music/latin-latin-america-632587/) |
| Passo Gardena | `music/gardena.ogg` | Yamatsumi -mountain spirits- | [HarumachiMusic](https://pixabay.com/users/harumachimusic-13470593/) | [180314](https://pixabay.com/music/modern-classical-yamatsumi-mountain-spirits-180314/) |
| Mauna Kea | `music/maunakea.ogg` | Reggae Island Fun | [Musictown](https://pixabay.com/users/musictown-25873992/) | [109330](https://pixabay.com/music/reggae-reggae-island-fun-109330/) |
| Mont Royal | `music/montroyal.ogg` | French Paris Music | [STAROSTIN](https://pixabay.com/users/starostin-46826676/) | [638414](https://pixabay.com/music/france-french-paris-music-638414/) |
| Utrecht Bike City | `music/utrecht.ogg` | Freccero - Dale (Miami) | [86349](https://pixabay.com/users/86349-86349/) | [115248](https://pixabay.com/music/electro-freccero-dale-miami-115248/) |
| Col du Galibier | `music/galibier.ogg` | French France Paris Music | [Tunetank](https://pixabay.com/users/tunetank-50201703/) | [348927](https://pixabay.com/music/world-french-france-paris-music-348927/) |
| Joshua Tree | `music/joshuatree.ogg` | Desert Skies | [moodmode](https://pixabay.com/users/moodmode-33139253/) | [198929](https://pixabay.com/music/rock-desert-skies-198929/) |
| Cabot Trail | `music/cabot.ogg` | Far From The City (Long 6min.) | [Good_B_Music](https://pixabay.com/users/good_b_music-22836301/) | [114443](https://pixabay.com/music/acoustic-group-far-from-the-city-long-6min-114443/) |
| Pico Veleta | `music/veleta.ogg` | Latin Flamenco | [Tunetank](https://pixabay.com/users/tunetank-50201703/) | [347409](https://pixabay.com/music/solo-guitar-latin-flamenco-347409/) |
| Bay of Islands Group Ride | `music/bayofislands.ogg` | Landscape - Nature Landscape Music | [HitsLab](https://pixabay.com/users/hitslab-47305729/) | [296237](https://pixabay.com/music/corporate-landscape-nature-landscape-music-296237/) |
| Yorkshire Dales | `music/dales.ogg` | Old Story From Scotland | [_Music_for_Creators_](https://pixabay.com/users/_music_for_creators_-24430395/) | [147143](https://pixabay.com/music/folk-old-story-from-scotland-147143/) |
| Engadin Lakes | `music/engadin.ogg` | Swiss Lights | [JoyInSound](https://pixabay.com/users/joyinsound-51634429/) | [403374](https://pixabay.com/music/future-bass-swiss-lights-403374/) |
| Miami Neon Nights | `music/miami.ogg` | Miami | [AlisiaBeats](https://pixabay.com/users/alisiabeats-39461785/) | [177359](https://pixabay.com/music/funk-miami-177359/) |

## Rider feedback

Overseas Highway's track, Saint Kitts Bay, is the best music of any world
([#935](https://github.com/QuinntyneBrown/wattzup/issues/935)), and Brooklyn Bridge Commute's,
Beautiful Boom Bap, the third best
([#938](https://github.com/QuinntyneBrown/wattzup/issues/938)). Keep both tracks, and use them as
the reference when choosing music for other worlds.
