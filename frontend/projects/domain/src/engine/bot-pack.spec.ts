// Unit test
// Traces to: L2-067 AC1
// Description: the bot pack rides each bot at the virtual speed of its pace, second by second, and the same race
// replays the same way however its seconds arrive.
import { BotPaceModel } from './bot-pace-model';
import { BotPack } from './bot-pack';
import { VirtualSpeedModel } from './virtual-speed-model';

describe('BotPack', () => {
  it('starts the nine bots level, in jerseys of their names', () => {
    const field = new BotPack('old-town-criterium', 'medium').advance(0);
    expect(field.map((bot) => bot.name)).toEqual(
      ['Nova', 'Rook', 'Juno', 'Atlas', 'Kite', 'Vale', 'Moss', 'Flint', 'Echo'].map(
        (name) => `Pacer ${name}`,
      ),
    );
    expect(field.every((bot) => bot.metres === 0 && bot.bot && bot.jersey === bot.id)).toBe(true);
  });

  it('rides each bot the sum of its speed second by second', () => {
    const pace = BotPaceModel.paces('old-town-criterium', 'medium')[0]!;
    let metres = 0;
    for (let t = 0; t < 3; t++) metres += VirtualSpeedModel.speedMs(BotPaceModel.watts(pace, t));
    expect(new BotPack('old-town-criterium', 'medium').advance(3)[0]!.metres).toBeCloseTo(
      metres,
      9,
    );
  });

  it('replays the same race, second by second or in one jump', () => {
    const stepped = new BotPack('dolomites', 'hard');
    for (let t = 1; t <= 120; t++) stepped.advance(t);
    expect(new BotPack('dolomites', 'hard').advance(120)).toEqual(stepped.advance(120));
  });

  it('rides the hard pack further than the easy one', () => {
    const far = (pack: 'easy' | 'hard') =>
      new BotPack('prairie-paceline', pack).advance(300).reduce((sum, bot) => sum + bot.metres, 0);
    expect(far('hard')).toBeGreaterThan(far('easy'));
  });
});
