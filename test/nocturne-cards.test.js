import { describe, it, expect, beforeEach } from 'vitest';
import { BOONS, HEXES } from '../public/js/card-data.js';
import { createGameView } from '../public/js/game-view.js';
import { createGame, makeCards } from './helpers.js';

const ids = (cards) => cards.map(card => card.id);
const indexIn = (cards, id) => cards.findIndex(card => card.id === id);
// 祝福と呪詛を使うカードを入れた王国
// 取り替え子は獲得のたびに交換の確認が出るので、取り替え子のテストでだけ使う
const KINGDOM = ['bard', 'skulk', 'druid', 'cemetery', 'faithful_hound', 'necromancer', 'guardian', 'den_of_sin', 'monastery', 'vampire'];

describe('夜想曲', () => {
    let game;
    let player;
    let opponent;

    const setupGame = (kingdom = KINGDOM) => {
        game = createGame(['A', 'B'], kingdom, { colonies: false, shelters: false });
        player = game.getCurrentPlayer();
        opponent = game.getPlayerToLeft(player);
        game.players.forEach(p => {
            if (p !== player) p.hand = makeCards(['COPPER', 'COPPER', 'COPPER', 'ESTATE', 'ESTATE']);
            p.deck = makeCards(Array(15).fill('COPPER'));
            p.discard = [];
        });
    };

    const play = (hand) => {
        player.hand = makeCards(hand);
        expect(game.playActionCard(0)).toBe(true);
    };

    // 祝福・呪詛の山の一番上を決める
    const topBoon = (id) => game.boonDeck.unshift(id);
    const topHex = (id) => game.hexDeck.unshift(id);

    beforeEach(() => setupGame());

    describe('準備', () => {
        it('運命があれば祝福の山とウィル・オ・ウィスプ、ドルイドの3枚、呪いがあれば呪詛の山を用意する', () => {
            expect(game.boonDeck.length + game.druidBoons.length).toBe(12);
            expect(game.druidBoons).toHaveLength(3);
            expect(game.hexDeck).toHaveLength(12);
            expect(game.nonSupply.will_o_wisp).toBe(12);
            expect(game.nonSupply.ghost).toBe(6);
            expect(game.nonSupply.bat).toBe(10);
            expect(createGameView(game, 0).druidBoons).toEqual(game.druidBoons);
        });

        it('家宝は初期デッキの銅貨の代わりに入り、死霊術師があればゾンビを廃棄置き場に置く', () => {
            const fresh = createGame(['A', 'B'], KINGDOM);
            const cards = ids(fresh.players[1].getAllCards());
            expect(cards.filter(id => id === 'haunted_mirror')).toHaveLength(1);
            expect(cards.filter(id => id === 'copper')).toHaveLength(6);
            expect(ids(game.trash).sort()).toEqual(['zombie_apprentice', 'zombie_mason', 'zombie_spy']);
        });
    });

    describe('夜フェイズ', () => {
        it('購入フェーズの後に夜フェイズに移り、夜のカードをアクションを使わずにプレイする', () => {
            player.hand = makeCards(['MONASTERY', 'GOLD', 'COPPER']);
            game.enterBuyPhase();
            game.buyCard('silver');
            expect(game.playActionCard(0)).toBe(false); // 購入フェーズには夜のカードをプレイできない
            expect(game.applyCommand(player.id, { type: 'night' })).toBe(true);
            expect(game.phase).toBe('night');
            player.actions = 0;
            expect(game.playActionCard(0)).toBe(true);
            // 修道院：獲得した1枚につき廃棄できる（場の銅貨も選べる）
            expect(game.pendingPrompt.max).toBe(1);
            game.resolvePrompt([]);
            expect(game.endTurn()).toBe(true);
        });

        it('手札に獲得するカード（悪の巣）は、購入すると手札に入り、夜にプレイすると次のターンにカードを2枚引く', () => {
            player.hand = makeCards(['GOLD', 'SILVER']);
            game.enterBuyPhase();
            game.buyCard('den_of_sin');
            expect(ids(player.hand)).toEqual(['den_of_sin']);
            game.applyCommand(player.id, { type: 'night' });
            game.playActionCard(0);
            game.endTurn();
            game.endTurn();
            expect(player.hand).toHaveLength(7);
        });

        it('守護者は次のターンまでアタックを防ぎ、次のターンに財宝+1', () => {
            player.hand = makeCards(['GUARDIAN']);
            game.applyCommand(player.id, { type: 'night' });
            game.playActionCard(0);
            game.endTurn();
            opponent.hand = makeCards(['SKULK']);
            game.playActionCard(0);
            expect(game.logs.some(entry => entry.message.includes('守護者で'))).toBe(true);
            game.endTurn();
            expect(player.coins).toBe(1);
        });

        it('人狼は夜フェイズなら呪詛を、そうでなければカードを3枚引く', () => {
            setupGame(['werewolf', 'skulk', ...KINGDOM.slice(2)]);
            play(['WEREWOLF']);
            expect(player.hand).toHaveLength(3);
            topHex('greed');
            player.hand = makeCards(['WEREWOLF']);
            game.applyCommand(player.id, { type: 'night' });
            game.playActionCard(0);
            expect(opponent.deck[0].id).toBe('copper');
            expect(ids(opponent.discard)).toEqual([]);
        });
    });

    describe('祝福', () => {
        const receive = (boonId, hand = ['GOLD', 'ESTATE', 'COPPER']) => {
            player.hand = makeCards(hand);
            game.receiveBoon(player, boonId);
            game.processEffects();
        };

        it('すべての祝福の効果', () => {
            receive('the_fields_gift');
            expect([player.actions, player.coins]).toEqual([2, 1]);
            expect(player.keptBoons).toEqual(['the_fields_gift']);
            receive('the_forests_gift');
            expect([player.buys, player.coins]).toEqual([2, 2]);
            receive('the_sea_gift'.replace('sea_', 'seas_'));
            expect(player.hand).toHaveLength(4);
            receive('the_mountains_gift');
            expect(ids(player.discard)).toContain('silver');
            receive('the_swamps_gift');
            expect(ids(player.discard)).toContain('will_o_wisp');
            receive('the_rivers_gift');
            expect(game.turnState.riverDraw).toBe(1);

            receive('the_flames_gift');
            game.resolvePrompt([indexIn(player.hand, 'estate')]);
            expect(ids(game.trash)).toContain('estate');

            receive('the_earths_gift');
            game.resolvePrompt([indexIn(player.hand, 'gold')]);
            expect(game.pendingPrompt.cards.every(card => card.cost <= 4)).toBe(true);
            game.resolvePrompt([0]);

            player.discard = makeCards(['GOLD']);
            receive('the_moons_gift');
            game.resolvePrompt([0]);
            expect(player.deck[0].id).toBe('gold');

            receive('the_skys_gift', ['ESTATE', 'ESTATE', 'CURSE']);
            game.resolvePrompt([0, 1, 2]);
            expect(ids(player.discard)).toContain('gold');

            player.deck = makeCards(['ESTATE', 'GOLD', 'CURSE', 'SILVER']);
            receive('the_suns_gift');
            game.resolvePrompt([0, 2]);
            game.resolvePrompt([0]);
            expect(ids(player.deck).sort()).toEqual(['gold', 'silver']);

            receive('the_winds_gift', ['ESTATE']);
            game.resolvePrompt([0, 1]);
            expect(player.hand).toHaveLength(1);
            expect(Object.keys(BOONS)).toHaveLength(12);
        });

        it('詩人は祝福を受け、ドルイドは脇の祝福を受ける（捨て札にならない）', () => {
            topBoon('the_seas_gift');
            play(['BARD']);
            expect(player.coins).toBe(2);
            expect(player.hand).toHaveLength(1);
            expect(game.boonDiscard).toContain('the_seas_gift');

            const druidBoons = [...game.druidBoons];
            player.actions = 1;
            player.hand = makeCards(['DRUID']);
            game.playActionCard(0);
            game.resolvePrompt([0]);
            expect(game.druidBoons).toEqual(druidBoons);
        });

        it('愚か者は森で迷うを受け取り、祝福を3枚好きな順で受ける。森で迷うはターンの開始時に使える', () => {
            setupGame(['fool', ...KINGDOM.slice(1)]);
            ['the_seas_gift', 'the_mountains_gift', 'the_forests_gift'].forEach(id => game.boonDeck.unshift(id));
            play(['FOOL']);
            expect(game.lostInTheWoods).toBe(player);
            game.resolvePrompt([0]);
            game.resolvePrompt([0]);
            expect(player.buys).toBe(2);
            expect(ids(player.discard)).toContain('silver');
            game.enterBuyPhase();
            game.endTurn();
            game.endTurn();
            expect(game.pendingPrompt.purpose).toBe('lost-in-the-woods');
        });
    });

    describe('呪詛', () => {
        const receive = (hexId, hand = ['GOLD', 'SILVER', 'COPPER', 'ESTATE', 'VAMPIRE']) => {
            player.hand = makeCards(hand);
            game.receiveHex(player, hexId);
            game.processEffects();
        };

        it('すべての呪詛の効果', () => {
            player.discard = makeCards(['COPPER', 'COPPER', 'COPPER']);
            receive('bad_omens');
            expect(ids(player.deck)).toEqual(['copper', 'copper']);

            receive('delusion');
            expect(player.states.deluded).toBe(true);
            receive('envy');
            expect(player.states.envious).toBe(false); // 妄想を持っているので受け取らない

            player.deck = makeCards(['BARD', 'GOLD', 'ESTATE', 'COPPER']);
            receive('famine');
            expect(ids(player.discard)).toContain('bard');

            receive('fear');
            game.resolvePrompt([0]);
            expect(player.hand).toHaveLength(4);

            receive('greed');
            expect(player.deck[0].id).toBe('copper');

            receive('haunting');
            game.resolvePrompt([indexIn(player.hand, 'estate')]);
            expect(player.deck[0].id).toBe('estate');

            player.deck = makeCards(['SILVER']);
            receive('locusts');
            expect(game.pendingPrompt.cards.every(card => card.isType('treasure') && card.cost < 3)).toBe(true);
            game.resolvePrompt([0]);

            const before = player.calculateVictoryPoints();
            receive('misery');
            receive('misery');
            expect(player.calculateVictoryPoints()).toBe(before - 4);

            receive('plague');
            expect(ids(player.hand)).toContain('curse');

            receive('poverty');
            game.resolvePrompt([0, 1]);
            expect(player.hand).toHaveLength(3);

            player.deck = makeCards(['COPPER', 'SILVER', 'GOLD']);
            receive('war');
            expect(ids(game.trash)).toContain('silver');
            expect(Object.keys(HEXES)).toHaveLength(12);
        });

        it('妄想は次の購入フェーズにアクションを購入できなくし、羨望は銀貨と金貨を財宝1にする', () => {
            player.states.deluded = true;
            player.hand = makeCards(['GOLD', 'GOLD']);
            game.enterBuyPhase();
            expect(game.buyCard('bard')).toBe(false);
            expect(player.states.deluded).toBe(false);
            game.endTurn();
            game.endTurn();
            player.states.envious = true;
            player.hand = makeCards(['GOLD', 'SILVER', 'COPPER']);
            game.enterBuyPhase();
            expect(player.coins).toBe(3);
        });

        it('忍び寄る者は他のプレイヤーに次の呪詛を受けさせ、獲得すると金貨を獲得する', () => {
            topHex('plague');
            play(['SKULK']);
            expect(ids(opponent.hand)).toContain('curse');
            game.enterBuyPhase();
            player.coins = 4;
            game.buyCard('skulk');
            expect(ids(player.discard)).toEqual(['skulk', 'gold']);
        });
    });

    describe('カード', () => {
        it('ヴァンパイアは呪詛と獲得のあと、コウモリと交換する。コウモリは廃棄するとヴァンパイアに戻る', () => {
            topHex('greed');
            player.hand = makeCards(['VAMPIRE', 'ESTATE']);
            game.applyCommand(player.id, { type: 'night' });
            game.playActionCard(0);
            game.resolvePrompt([0]);
            expect(ids(player.discard)).toContain('bat');
            expect(game.supply.vampire).toBe(11);
            expect(game.nonSupply.bat).toBe(9);
        });

        it('取り替え子：コスト3以上のカードを獲得したら、取り替え子と交換できる', () => {
            setupGame(['changeling', ...KINGDOM.slice(1)]);
            player.hand = makeCards(['GOLD']);
            game.enterBuyPhase();
            game.buyCard('silver');
            expect(game.pendingPrompt.purpose).toBe('changeling-exchange');
            game.resolvePrompt(true);
            expect(ids(player.discard)).toEqual(['changeling']);
            expect(game.supply.silver).toBe(40);
        });

        it('死霊術師は廃棄置き場のアクションをプレイし、同じターンには同じカードを使えない', () => {
            play(['NECROMANCER']);
            game.resolvePrompt([indexIn(game.pendingPrompt.cards, 'zombie_spy')]);
            expect(player.actions).toBe(1);
            game.resolvePrompt(false);
            expect(game.trash).toHaveLength(3);
            player.hand = makeCards(['NECROMANCER']);
            game.playActionCard(0);
            expect(ids(game.pendingPrompt.cards)).not.toContain('zombie_spy');
        });

        it('墓地を獲得すると手札を4枚まで廃棄し、呪いの鏡は廃棄されるとアクションを捨てて幽霊を獲得できる', () => {
            player.hand = makeCards(['GOLD', 'GOLD', 'HAUNTED_MIRROR', 'BARD']);
            game.gainCardFromSupply(player, 'cemetery');
            game.processEffects();
            game.resolvePrompt([indexIn(game.pendingPrompt.cards, 'haunted_mirror')]);
            expect(game.pendingPrompt.purpose).toBe('haunted-mirror');
            game.resolvePrompt([0]);
            expect(ids(player.discard)).toContain('ghost');
        });

        it('幽霊は次のターンに脇に置いたアクションを2回プレイする', () => {
            player.deck = makeCards(['ESTATE', 'BARD', ...Array(10).fill('COPPER')]);
            game.boonDeck.unshift('the_seas_gift', 'the_seas_gift');
            player.hand = makeCards(['GHOST']);
            game.applyCommand(player.id, { type: 'night' });
            game.playActionCard(0);
            expect(ids(player.setAside)).toEqual(['bard']);
            game.endTurn();
            game.endTurn();
            expect(player.coins).toBe(4);
        });

        it('忠犬はクリーンアップ以外で捨てたとき、脇に置いてターンの終わりに手札に戻せる', () => {
            opponent.hand = makeCards(['FAITHFUL_HOUND', 'COPPER', 'COPPER', 'COPPER', 'ESTATE']);
            player.hand = makeCards([]);
            game.discardFromHand(opponent, [0]);
            game.processEffects();
            game.resolvePrompt(true);
            expect(ids(opponent.setAside)).toEqual(['faithful_hound']);
            game.endTurn();
            expect(ids(opponent.hand)).toContain('faithful_hound');
        });

        it('レプラコーンは金貨を獲得し、場が7枚でなければ呪詛を受ける', () => {
            setupGame(['leprechaun', ...KINGDOM.slice(1)]);
            topHex('greed');
            play(['LEPRECHAUN']);
            expect(ids(player.discard)).toEqual(['gold']);
            expect(player.deck[0].id).toBe('copper');
        });

        it('偶像は場の偶像が奇数なら祝福、偶数なら他のプレイヤーに呪いを獲得させる', () => {
            setupGame(['idol', ...KINGDOM.slice(1)]);
            topBoon('the_forests_gift');
            player.hand = makeCards(['IDOL', 'IDOL']);
            game.enterBuyPhase();
            expect(player.buys).toBe(2);
            expect(ids(opponent.discard)).toEqual(['curse']);
        });

        it('悪魔の工房はこのターンに獲得した枚数で獲得するものが変わる', () => {
            setupGame(['devils_workshop', ...KINGDOM.slice(1)]);
            player.hand = makeCards(['DEVILS_WORKSHOP']);
            game.applyCommand(player.id, { type: 'night' });
            game.playActionCard(0);
            expect(ids(player.discard)).toEqual(['gold']);
        });

        it('祝福の村は獲得したとき祝福を取り、次のターンに受けることもできる', () => {
            setupGame(['blessed_village', ...KINGDOM.slice(1)]);
            topBoon('the_forests_gift');
            game.gainCardFromSupply(player, 'blessed_village');
            game.processEffects();
            game.resolvePrompt(false);
            game.endTurn();
            game.endTurn();
            expect(player.buys).toBe(2);
        });
    });
});
