import { describe, it, expect, beforeEach } from 'vitest';
import { RUINS_CARD_IDS } from '../public/js/card-data.js';
import { createGameView } from '../public/js/game-view.js';
import { createGame, makeCards } from './helpers.js';

const ids = (cards) => cards.map(card => card.id);
const indexIn = (cards, id) => cards.findIndex(card => card.id === id);

describe('暗黒時代', () => {
    let game;
    let player;
    let opponent;

    const setupGame = (kingdom, options = {}) => {
        game = createGame(['A', 'B'], kingdom, { colonies: false, shelters: false, ...options });
        player = game.getCurrentPlayer();
        opponent = game.players.find(p => p !== player);
        player.deck = makeCards(Array(15).fill('COPPER'));
        player.discard = [];
        opponent.hand = makeCards(['COPPER', 'COPPER', 'COPPER', 'ESTATE', 'ESTATE']);
        opponent.deck = makeCards(Array(15).fill('COPPER'));
        opponent.discard = [];
    };

    const play = (hand) => {
        player.hand = makeCards(hand);
        expect(game.playActionCard(0)).toBe(true);
    };

    const KINGDOM = ['knights', 'marauder', 'hermit', 'urchin', 'market_square', 'band_of_misfits', 'procession', 'death_cart', 'rogue', 'squire'];

    beforeEach(() => setupGame(KINGDOM));

    describe('準備', () => {
        it('騎士は10種を混ぜた山で、一番上のカードだけを購入できる', () => {
            expect(game.supply.knights).toBe(10);
            expect(new Set(game.pileCards.knights).size).toBe(10);
            const top = game.getPileTop('knights');
            const second = game.pileCards.knights[1];
            expect(game.getCost('knights')).toBe(top === 'sir_martin' ? 4 : 5);
            expect(createGameView(game, 0).pileTops.knights).toBe(top);

            player.hand = makeCards(['GOLD', 'GOLD']);
            game.enterBuyPhase();
            expect(game.buyCard(second)).toBe(false);
            expect(game.buyCard('knights')).toBe(true);
            expect(ids(player.discard)).toEqual([top]);
            expect(game.supply.knights).toBe(9);
            expect(game.getPileTop('knights')).toBe(second);
        });

        it('略奪者があると、廃墟の山（プレイヤー数-1 の10倍）と略奪品の山を置く', () => {
            expect(game.supply.ruins).toBe(10);
            expect(game.pileCards.ruins.every(id => RUINS_CARD_IDS.includes(id))).toBe(true);
            expect(game.nonSupply.spoils).toBe(15);
            expect(game.nonSupply.madman).toBe(10);
            expect(game.nonSupply.mercenary).toBe(10);
            const four = createGame(['A', 'B', 'C', 'D'], KINGDOM);
            expect(four.supply.ruins).toBe(30);
        });

        it('避難所を使うと、初期デッキの屋敷の代わりに納屋・共同墓地・草茂る屋敷が入る', () => {
            const sheltered = createGame(['A', 'B'], KINGDOM, { shelters: true });
            const cards = ids(sheltered.players[0].getAllCards()).sort();
            expect(cards.filter(id => id !== 'copper')).toEqual(['hovel', 'necropolis', 'overgrown_estate']);
        });
    });

    it('略奪者は略奪品を獲得し、他のプレイヤーは廃墟を獲得する。略奪品はプレイすると山に戻る', () => {
        const topRuins = game.getPileTop('ruins');
        play(['MARAUDER']);
        expect(ids(player.discard)).toEqual(['spoils']);
        expect(ids(opponent.discard)).toEqual([topRuins]);
        expect(game.supply.ruins).toBe(9);

        player.hand = makeCards(['SPOILS']);
        game.enterBuyPhase();
        expect(player.coins).toBe(3);
        expect(game.nonSupply.spoils).toBe(14 + 1);
        expect(ids(player.playArea)).toEqual(['marauder']);
    });

    describe('騎士', () => {
        it('他のプレイヤーの山札の上からコスト3〜6のカードを廃棄させ、残りを捨て札にする', () => {
            opponent.deck = makeCards(['ESTATE', 'SILVER', 'COPPER']);
            play(['DAME_SYLVIA']);
            expect(player.coins).toBe(2);
            expect(ids(game.trash)).toEqual(['silver']);
            expect(ids(opponent.discard)).toEqual(['estate']);
        });

        it('騎士で騎士を廃棄させたら、攻撃した騎士も廃棄する', () => {
            opponent.deck = makeCards(['SIR_BAILEY', 'COPPER']);
            play(['SIR_DESTRY']);
            expect(ids(game.trash).sort()).toEqual(['sir_bailey', 'sir_destry']);
            expect(ids(player.playArea)).toEqual([]);
        });

        it('候補が2枚なら、攻撃を受けたプレイヤーが廃棄するカードを選ぶ', () => {
            opponent.deck = makeCards(['SILVER', 'GOLD']);
            play(['DAME_MOLLY']);
            expect(game.pendingPrompt.player).toBe(opponent);
            game.resolvePrompt([0]);
            expect(ids(game.trash)).toEqual(['silver']);
            expect(ids(opponent.discard)).toEqual(['gold']);
        });

        it('ヴァンデル卿は廃棄されたとき金貨を獲得する', () => {
            opponent.deck = makeCards(['SIR_VANDER', 'COPPER']);
            play(['DAME_SYLVIA']);
            expect(ids(opponent.discard)).toContain('gold');
        });
    });

    it('隠遁者は購入フェーズにカードを獲得しなければ、廃棄して狂人を獲得する。狂人は山に戻して手札の枚数だけ引く', () => {
        player.discard = makeCards(['ESTATE']);
        play(['HERMIT', 'COPPER']);
        game.resolvePrompt([0]); // 捨て札の屋敷を廃棄する
        expect(ids(game.trash)).toEqual(['estate']);
        game.resolvePrompt([0]); // コスト3以下のカードを獲得する（行動フェーズの獲得なので数えない）
        game.enterBuyPhase();
        game.endTurn();
        expect(ids(game.trash)).toContain('hermit');
        expect(game.nonSupply.madman).toBe(9);
        expect(player.getAllCards().map(card => card.id)).toContain('madman');

        game.endTurn();
        player.hand = makeCards(['MADMAN', 'COPPER', 'COPPER']);
        game.playActionCard(0);
        expect(game.nonSupply.madman).toBe(10);
        expect(player.hand).toHaveLength(4);
        expect(player.actions).toBe(2);
    });

    it('浮浪児が場にあるときに他のアタックをプレイすると、浮浪児を廃棄して傭兵を獲得できる', () => {
        player.actions = 2;
        play(['URCHIN', 'MARAUDER']);
        game.resolvePrompt([0, 1, 2, 3].slice(0, game.pendingPrompt?.min ?? 0)); // 相手は手札を4枚に
        game.playActionCard(indexIn(player.hand, 'marauder'));
        expect(game.pendingPrompt.purpose).toBe('urchin');
        game.resolvePrompt(true);
        expect(ids(game.trash)).toContain('urchin');
        expect(ids(player.discard)).toEqual(expect.arrayContaining(['mercenary', 'spoils']));
    });

    it('市場広場は自分のカードが廃棄されたとき、捨て札にして金貨を獲得できる', () => {
        play(['DEATH_CART', 'MARKET_SQUARE']);
        game.resolvePrompt([0]); // 死の荷車を廃棄して財宝+5
        expect(player.coins).toBe(5);
        expect(game.pendingPrompt.purpose).toBe('market-square');
        game.resolvePrompt(true);
        expect(ids(player.discard)).toEqual(['market_square', 'gold']);
    });

    it('死の荷車を獲得すると廃墟を2枚獲得する', () => {
        player.hand = makeCards(['GOLD', 'COPPER']);
        game.enterBuyPhase();
        game.buyCard('death_cart');
        expect(player.discard.filter(card => card.isType('ruins'))).toHaveLength(2);
    });

    it('城砦は廃棄されると手札に戻る', () => {
        setupGame(['fortress', 'chapel', ...KINGDOM.slice(2)]);
        play(['CHAPEL', 'FORTRESS']);
        game.resolvePrompt([0]);
        expect(ids(player.hand)).toEqual(['fortress']);
        expect(game.trash).toHaveLength(0);
    });

    it('はみだし者はより安いアクションカードを、サプライに置いたままプレイする', () => {
        play(['BAND_OF_MISFITS']);
        const choices = ids(game.pendingPrompt.cards);
        expect(choices).toContain('marauder');
        expect(choices).not.toContain('rogue');
        expect(choices).not.toContain('band_of_misfits');
        const before = game.supply.marauder;
        game.resolvePrompt([choices.indexOf('marauder')]);
        expect(game.supply.marauder).toBe(before);
        expect(ids(player.discard)).toEqual(['spoils']);
        expect(ids(player.playArea)).toEqual(['band_of_misfits']);
    });

    it('行進はアクションを2回プレイして廃棄し、コストがちょうど1多いアクションを獲得する', () => {
        play(['PROCESSION', 'SQUIRE']);
        game.resolvePrompt([0]);
        game.resolvePrompt([0]); // 従者：アクション +2
        game.resolvePrompt([0]); // 従者：アクション +2
        expect(player.actions).toBe(4);
        expect(player.coins).toBe(2);
        // 従者は廃棄されたとき、アタックカードを獲得する
        expect(game.pendingPrompt.cards.every(card => card.isType('attack'))).toBe(true);
        game.resolvePrompt([0]);
        // 行進：コスト3のアクション（浮浪児・隠遁者・市場広場）
        expect(ids(game.pendingPrompt.cards).sort()).toEqual(['hermit', 'market_square', 'urchin']);
    });

    it('偽造通貨は手札の財宝を2回プレイして、その財宝を廃棄する', () => {
        player.hand = makeCards(['COUNTERFEIT', 'SILVER']);
        game.enterBuyPhase();
        game.resolvePrompt([0]);
        expect(player.coins).toBe(1 + 2 * 2);
        expect(player.buys).toBe(2);
        expect(ids(game.trash)).toEqual(['silver']);
    });

    it('物乞いは他のプレイヤーのアタックに反応して、銀貨を2枚獲得し1枚を山札の上に置く', () => {
        opponent.hand = makeCards(['BEGGAR', 'COPPER']);
        play(['MARAUDER']);
        expect(game.pendingPrompt.purpose).toBe('beggar-react');
        game.resolvePrompt(true);
        expect(opponent.deck[0].id).toBe('silver');
        expect(ids(opponent.discard)).toEqual(expect.arrayContaining(['beggar', 'silver']));
    });

    it('ならず者は廃棄置き場のコスト3〜6のカードを獲得し、なければ攻撃する', () => {
        game.trash.push(...makeCards(['GOLD', 'COPPER']));
        play(['ROGUE']);
        game.resolvePrompt([0]);
        expect(ids(player.discard)).toEqual(['gold']);
        expect(ids(game.trash)).toEqual(['copper']);
    });

    it('地下墓所は廃棄されたとき、それより安いカードを獲得する', () => {
        setupGame(['catacombs', 'chapel', ...KINGDOM.slice(2)]);
        play(['CHAPEL', 'CATACOMBS']);
        game.resolvePrompt([0]);
        const choices = game.pendingPrompt.cards;
        expect(choices.every(card => game.getCost(card) < 5)).toBe(true);
    });

    it('納屋は勝利点カードを獲得したとき廃棄できる', () => {
        player.hand = makeCards(['HOVEL', 'GOLD', 'SILVER']);
        game.enterBuyPhase();
        game.buyCard('duchy');
        expect(game.pendingPrompt.purpose).toBe('hovel');
        game.resolvePrompt(true);
        expect(ids(game.trash)).toEqual(['hovel']);
    });

    it('救貧院は手札の財宝の数だけ財宝が減る', () => {
        play(['POOR_HOUSE', 'COPPER', 'ESTATE']);
        expect(player.coins).toBe(3);
    });

    it('伯爵は2つの効果を選ぶ', () => {
        play(['COUNT', 'ESTATE', 'COPPER']);
        game.resolvePrompt([2]); // 銅貨を獲得
        game.resolvePrompt([2]); // 公領を獲得
        expect(ids(player.discard)).toEqual(['copper', 'duchy']);
    });
});
