import { describe, it, expect, beforeEach } from 'vitest';
import { LANDSCAPES } from '../public/js/card-data.js';
import { createGameView } from '../public/js/game-view.js';
import { createGame, makeCards } from './helpers.js';

const ids = (cards) => cards.map(card => card.id);
const indexIn = (cards, id) => cards.findIndex(card => card.id === id);
const KINGDOM = ['sleigh', 'camel_train', 'snowy_village', 'bounty_hunter', 'cavalry', 'kiln', 'livery', 'gatekeeper', 'destrier', 'smithy'];

describe('移動動物園', () => {
    let game;
    let player;
    let opponent;

    const setupGame = (landscapes = [], kingdom = KINGDOM) => {
        game = createGame(['A', 'B'], kingdom, { colonies: false, shelters: false, landscapes });
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

    const toBuyPhase = (hand) => {
        player.hand = makeCards(hand);
        expect(game.enterBuyPhase()).toBe(true);
    };

    beforeEach(() => setupGame());

    describe('追放と馬', () => {
        it('馬の山を置き、馬はカード+2・アクション+1で山に戻る', () => {
            expect(game.nonSupply.horse).toBe(30);
            play(['HORSE']);
            expect(player.hand).toHaveLength(2);
            expect(game.nonSupply.horse).toBe(31);
        });

        it('追放したカードは得点に数え、同じカードを獲得すると捨て札にしてよい', () => {
            play(['BOUNTY_HUNTER', 'ESTATE']);
            game.resolvePrompt([0]);
            expect(ids(player.mats.exile)).toEqual(['estate']);
            expect(player.coins).toBe(3);
            expect(createGameView(game, player.id).players[player.id].exile).toEqual(['estate']);
            game.gainCardFromSupply(player, 'estate');
            game.processEffects();
            expect(game.pendingPrompt.purpose).toBe('discard-exiled');
            game.resolvePrompt(true);
            expect(player.mats.exile).toHaveLength(0);
            expect(ids(player.discard)).toEqual(['estate', 'estate']);
        });

        it('ラクダの隊列は獲得すると金貨を追放する', () => {
            game.gainCardFromSupply(player, 'camel_train');
            game.processEffects();
            expect(ids(player.mats.exile)).toEqual(['gold']);
            expect(game.supply.gold).toBe(29);
        });
    });

    describe('カード', () => {
        it('雪深い村の後は、このターンのアクション+を受けない', () => {
            play(['SNOWY_VILLAGE']);
            expect(player.actions).toBe(4);
            player.hand = makeCards(['HORSE']);
            game.playActionCard(0);
            expect(player.actions).toBe(3);
        });

        it('騎兵隊を購入すると、カード+2・購入+1でアクションフェーズに戻る', () => {
            toBuyPhase(['GOLD', 'COPPER']);
            game.buyCard('cavalry');
            expect(player.hand).toHaveLength(2);
            expect(game.phase).toBe('action');
        });

        it('窯は次にプレイするカードを先に獲得してよい', () => {
            play(['KILN']);
            player.actions = 1;
            player.hand = makeCards(['SMITHY']);
            game.playActionCard(0);
            expect(game.pendingPrompt.purpose).toBe('kiln');
            game.resolvePrompt(true);
            expect(ids(player.discard)).toEqual(['smithy']);
            expect(player.hand).toHaveLength(3);
        });

        it('馬屋のあと、コスト4以上のカードを獲得するたびに馬を獲得する', () => {
            play(['LIVERY']);
            game.enterBuyPhase();
            player.coins = 5;
            game.buyCard('smithy');
            expect(ids(player.discard)).toEqual(['smithy', 'horse']);
        });

        it('門番は次のターンまで、他のプレイヤーが獲得したアクションと財宝を追放させる', () => {
            play(['GATEKEEPER']);
            game.enterBuyPhase();
            game.endTurn();
            opponent.hand = makeCards(['GOLD']);
            game.enterBuyPhase();
            game.buyCard('silver');
            expect(ids(opponent.mats.exile)).toEqual(['silver']);
            game.endTurn();
            expect(player.coins).toBe(3);
        });

        it('軍馬はこのターンに獲得したカードの数だけ安くなる', () => {
            expect(game.getCost('destrier')).toBe(6);
            game.gainCardFromSupply(player, 'copper');
            game.gainCardFromSupply(player, 'copper');
            expect(game.getCost('destrier')).toBe(4);
        });

        it('そりは獲得したカードを手札に加えられる', () => {
            player.hand = makeCards(['SLEIGH', 'GOLD']);
            game.enterBuyPhase();
            game.buyCard('silver');
            game.resolvePrompt([1]);
            expect(ids(player.hand)).toContain('silver');
            expect(ids(player.discard)).toContain('sleigh');
        });

        it('動物見本市は、コインが足りなければ手札のアクションを廃棄して購入できる', () => {
            setupGame([], ['animal_fair', ...KINGDOM.slice(1)]);
            player.hand = makeCards(['SMITHY', 'COPPER']);
            game.enterBuyPhase();
            expect(game.buyCard('animal_fair')).toBe(true);
            game.resolvePrompt([0]);
            expect(ids(game.trash)).toEqual(['smithy']);
            expect(ids(player.discard)).toContain('animal_fair');
        });

        it('黒猫は他のプレイヤーが勝利点カードを獲得したときにプレイでき、自分のターンでなければ呪いを配る', () => {
            opponent.hand = makeCards(['BLACK_CAT', 'COPPER']);
            toBuyPhase(['GOLD', 'COPPER']);
            game.buyCard('estate');
            expect(game.pendingPrompt.player).toBe(opponent);
            game.resolvePrompt(true);
            expect(ids(player.discard)).toContain('curse');
        });
    });

    describe('習性', () => {
        const WAYS = Object.values(LANDSCAPES).filter(data => data.kind === 'way').map(data => data.id);
        const useWay = (wayId, hand = ['SMITHY', 'COPPER', 'GOLD', 'ESTATE']) => {
            setupGame([wayId]);
            player.hand = makeCards(hand);
            game.playActionCard(0);
            const index = game.pendingPrompt.options.findIndex(option => option.startsWith(game.getLandscape(wayId).name));
            game.resolvePrompt([index]);
        };

        it('習性があるゲームでは、アクションのプレイで本来の効果か習性を選ぶ', () => {
            expect(WAYS).toHaveLength(20);
            setupGame(['way_of_the_ox']);
            play(['SMITHY']);
            expect(game.pendingPrompt.purpose).toBe('way');
            game.resolvePrompt([0]);
            expect(player.hand).toHaveLength(3);
        });

        it('すべての習性の効果', () => {
            useWay('way_of_the_ox');
            expect(player.actions).toBe(2);
            useWay('way_of_the_pig');
            expect([player.hand.length, player.actions]).toEqual([4, 1]);
            useWay('way_of_the_otter');
            expect(player.hand).toHaveLength(5);
            useWay('way_of_the_owl');
            expect(player.hand).toHaveLength(6);
            useWay('way_of_the_mule');
            expect([player.actions, player.coins]).toEqual([1, 1]);
            useWay('way_of_the_monkey');
            expect([player.buys, player.coins]).toEqual([2, 1]);
            useWay('way_of_the_sheep');
            expect(player.coins).toBe(2);
            useWay('way_of_the_seal');
            expect(game.turnState.sealGains).toBe(true);
            useWay('way_of_the_squirrel');
            expect(game.turnState.riverDraw).toBe(2);
            useWay('way_of_the_mole');
            expect([player.hand.length, player.actions]).toEqual([3, 1]);
            useWay('way_of_the_camel');
            expect(ids(player.mats.exile)).toEqual(['gold']);
            useWay('way_of_the_worm');
            expect(ids(player.mats.exile)).toEqual(['estate']);
            useWay('way_of_the_horse');
            expect(game.supply.smithy).toBe(11);
            useWay('way_of_the_frog');
            game.enterBuyPhase();
            game.endTurn();
            expect(ids(player.hand)).toContain('smithy');
            useWay('way_of_the_turtle');
            expect(ids(player.setAside)).toEqual(['smithy']);
            game.endTurn();
            game.endTurn();
            expect(ids(player.playArea)).toContain('smithy');
            useWay('way_of_the_goat');
            game.resolvePrompt([indexIn(player.hand, 'estate')]);
            expect(ids(game.trash)).toEqual(['estate']);
            useWay('way_of_the_rat');
            game.resolvePrompt([0]);
            expect(ids(player.discard)).toContain('smithy');
            useWay('way_of_the_butterfly');
            game.resolvePrompt(true);
            expect(game.pendingPrompt.cards.every(card => card.cost === 5)).toBe(true);
            useWay('way_of_the_chameleon');
            expect(player.coins).toBe(3); // 鍛冶屋のカード+3が財宝+3になる
            useWay('way_of_the_mouse');
            expect(game.landscapeState.mouseCard).toBeTruthy();
        });
    });

    describe('イベント', () => {
        const buy = (id, hand = ['GOLD', 'GOLD', 'GOLD', 'GOLD']) => {
            setupGame([id]);
            toBuyPhase(hand);
            expect(game.buyLandscape(id)).toBe(true);
        };

        it('すべてのイベントの効果', () => {
            buy('ride');
            expect(ids(player.discard)).toEqual(['horse']);
            buy('desperation');
            game.resolvePrompt(true);
            expect(player.buys).toBe(1);
            buy('toil', ['GOLD', 'SMITHY']);
            game.resolvePrompt([0]);
            expect(player.hand).toHaveLength(3);
            buy('delay', ['GOLD', 'SMITHY']);
            game.resolvePrompt([0]);
            expect(ids(player.setAside)).toEqual(['smithy']);
            setupGame(['gamble']);
            player.deck = makeCards(['GOLD', ...Array(10).fill('COPPER')]);
            toBuyPhase(['GOLD', 'GOLD', 'GOLD', 'GOLD']);
            game.buyLandscape('gamble');
            game.resolvePrompt(true);
            expect(player.coins).toBe(12 - 2 + 3);
            buy('pursue');
            game.resolvePrompt([indexIn(game.pendingPrompt.cards, 'copper')]);
            expect(player.deck[0].id).toBe('copper');
            buy('enhance', ['GOLD', 'SMITHY']);
            game.resolvePrompt([0]);
            expect(game.pendingPrompt.cards.every(card => card.cost <= 6)).toBe(true);
            setupGame(['march']);
            toBuyPhase(['GOLD']);
            player.discard = makeCards(['SMITHY']);
            game.buyLandscape('march');
            game.resolvePrompt([0]);
            expect(player.hand).toHaveLength(3);
            buy('transport');
            game.resolvePrompt([0]);
            game.resolvePrompt([indexIn(game.pendingPrompt.cards, 'smithy')]);
            expect(ids(player.mats.exile)).toEqual(['smithy']);
            buy('banish', ['GOLD', 'SILVER', 'ESTATE', 'ESTATE']);
            game.resolvePrompt([0]);
            expect(ids(player.mats.exile)).toEqual(['estate', 'estate']);
            buy('bargain');
            game.resolvePrompt([0]);
            expect(ids(opponent.discard)).toEqual(['horse']);
            buy('invest');
            game.resolvePrompt([0]);
            expect(player.mats.exile).toHaveLength(1);
            buy('seize_the_day');
            game.endTurn();
            expect(game.getCurrentPlayer()).toBe(player);
            buy('commerce');
            expect(ids(player.discard)).toEqual([]);
            buy('demand');
            game.resolvePrompt([0]);
            expect(player.deck[1].id).toBe('horse');
            buy('stampede');
            expect(player.deck.slice(0, 5).every(card => card.id === 'horse')).toBe(true);
            buy('reap', ['GOLD', 'GOLD', 'GOLD']);
            expect(ids(player.setAside)).toEqual(['gold']);
            buy('enclave', ['GOLD', 'GOLD', 'GOLD']);
            expect(ids(player.mats.exile)).toEqual(['duchy']);
            buy('alliance', ['GOLD', 'GOLD', 'GOLD', 'GOLD']);
            expect(ids(player.discard).sort()).toEqual(['copper', 'duchy', 'estate', 'gold', 'province', 'silver']);
            buy('populate', ['GOLD', 'GOLD', 'GOLD', 'GOLD']);
            expect(player.discard.length).toBeGreaterThanOrEqual(10);
        });
    });
});
