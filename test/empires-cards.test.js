import { describe, it, expect, beforeEach } from 'vitest';
import { createGameView } from '../public/js/game-view.js';
import { createGame, makeCards } from './helpers.js';

const ids = (cards) => cards.map(card => card.id);
const indexIn = (cards, id) => cards.findIndex(card => card.id === id);
const KINGDOM = [
    'encampment_plunder', 'patrician_emporium', 'settlers_bustling_village', 'catapult_rocks', 'gladiator_fortune',
    'castles', 'villa', 'temple', 'farmers_market', 'engineer'
];

describe('帝国', () => {
    let game;
    let player;
    let opponent;

    const setupGame = (landscapes = [], kingdom = KINGDOM, players = ['A', 'B']) => {
        game = createGame(players, kingdom, { colonies: false, shelters: false, landscapes });
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

    const passTurns = () => {
        game.endTurn();
        game.endTurn();
    };

    beforeEach(() => setupGame());

    describe('準備と山', () => {
        it('2種で1山のカードは上5枚と下5枚が決まった順に重なり、一番上だけを買える', () => {
            expect(game.pileCards.encampment_plunder).toEqual([...Array(5).fill('encampment'), ...Array(5).fill('plunder')]);
            expect(game.getPileTop('gladiator_fortune')).toBe('gladiator');
        });

        it('城の山は安い順で、2人なら8枚、3人以上なら12枚', () => {
            expect(game.pileCards.castles).toEqual([
                'humble_castle', 'crumbling_castle', 'small_castle', 'haunted_castle',
                'opulent_castle', 'sprawling_castle', 'grand_castle', 'kings_castle'
            ]);
            setupGame([], KINGDOM, ['A', 'B', 'C']);
            expect(game.supply.castles).toBe(12);
        });
    });

    describe('負債', () => {
        it('負債のカードを買うと負債を負い、返すまで購入できない。財宝があれば自動で返す', () => {
            toBuyPhase(['COPPER']);
            player.buys = 2;
            expect(game.buyCard('engineer')).toBe(true);
            expect(player.debt).toBe(4);
            expect(game.buyCard('copper')).toBe(false);
            // 断られた操作は状態を変えない（負債も返さない。返すと操作の記録から再現できなくなる）
            expect(player.debt).toBe(4);
            expect(game.lastError).toContain('負債');
            passTurns();
            toBuyPhase(['GOLD', 'GOLD', 'COPPER']);
            expect(game.buyCard('silver')).toBe(true);
            expect(player.debt).toBe(0);
            expect(player.coins).toBe(7 - 4 - 3); // 負債4を返して、銀貨（3）を買った残り
        });

        it('ビューに負債とコストの負債が入る', () => {
            player.debt = 2;
            const view = createGameView(game, player.id);
            expect(view.players[player.id].debt).toBe(2);
            expect(view.debtCosts.engineer).toBe(4);
        });

        it('「コスト4以下」では負債のあるカードは獲得できない', () => {
            expect(game.getGainableCards({ maxCost: 4 }).map(data => data.id)).not.toContain('engineer');
        });
    });

    describe('カード', () => {
        it('野営地は金貨か戦利品を公開しなければ脇に置き、クリーンアップでサプライに戻す', () => {
            play(['ENCAMPMENT']);
            expect(ids(player.setAside)).toEqual(['encampment']);
            const before = game.supply.encampment_plunder;
            game.enterBuyPhase();
            game.endTurn();
            expect(game.supply.encampment_plunder).toBe(before + 1);
            expect(game.getPileTop('encampment_plunder')).toBe('encampment');
        });

        it('戦利品は財宝+2と勝利点トークン+1', () => {
            toBuyPhase(['PLUNDER']);
            expect(player.coins).toBe(2);
            expect(player.vpTokens).toBe(1);
        });

        it('剣闘士は左隣が同じカードを公開しなければ財宝+1とサプライの剣闘士を廃棄する', () => {
            play(['GLADIATOR', 'GOLD']);
            game.resolvePrompt([0]);
            expect(player.coins).toBe(3);
            expect(game.supply.gladiator_fortune).toBe(9);
            expect(ids(game.trash)).toEqual(['gladiator']);
        });

        it('富は財宝を1ターンに1回だけ2倍にする', () => {
            toBuyPhase(['GOLD', 'FORTUNE', 'FORTUNE']);
            expect(player.coins).toBe(6);
            expect(player.buys).toBe(3);
        });

        it('岩は獲得したとき、購入フェーズなら銀貨を山札の上に獲得する', () => {
            toBuyPhase(['GOLD', 'COPPER']);
            game.pileCards.catapult_rocks.splice(0, 5);
            game.supply.catapult_rocks = 5;
            game.buyCard('catapult_rocks');
            expect(player.deck[0].id).toBe('silver');
        });

        it('投石機は財宝を廃棄すると、他のプレイヤーは手札を3枚まで捨て、コスト3以上なら呪いも獲得する', () => {
            play(['CATAPULT', 'SILVER']);
            game.resolvePrompt([0]);
            expect(ids(opponent.discard)).toContain('curse');
            expect(game.pendingPrompt.player).toBe(opponent);
            game.resolvePrompt([0, 1]);
            expect(opponent.hand).toHaveLength(3);
        });

        it('ヴィラは獲得したら手札に加え、購入フェーズならアクションフェーズに戻る', () => {
            toBuyPhase(['GOLD', 'SILVER']);
            game.buyCard('villa');
            expect(ids(player.hand)).toEqual(['villa']);
            expect(game.phase).toBe('action');
            expect(player.actions).toBe(2);
            expect(game.playActionCard(0)).toBe(true);
            expect(game.enterBuyPhase()).toBe(true);
        });

        it('女魔術師は他のプレイヤーの最初のアクションをカード+1・アクション+1にする', () => {
            play(['ENCHANTRESS']);
            game.enterBuyPhase();
            game.endTurn();
            opponent.hand = makeCards(['ENGINEER', 'COPPER']);
            game.playActionCard(0);
            expect(game.pendingPrompt).toBe(null);
            expect(opponent.hand).toHaveLength(2);
            expect(opponent.actions).toBe(1);
        });

        it('神殿は名前の違うカードを廃棄して山に勝利点を置き、獲得したプレイヤーが山の勝利点を取る', () => {
            play(['TEMPLE', 'ESTATE', 'COPPER', 'COPPER']);
            game.resolvePrompt([0, 1]);
            expect(ids(game.trash).sort()).toEqual(['copper', 'estate']);
            expect(player.vpTokens).toBe(1);
            expect(game.pileVp.temple).toBe(1);
            game.enterBuyPhase();
            player.coins = 4;
            game.buyCard('temple');
            expect(player.vpTokens).toBe(2);
            expect(game.pileVp.temple).toBe(0);
        });

        it('農家の市場は山の勝利点が4以上ならそれを取って廃棄し、そうでなければ山に置いて財宝を得る', () => {
            game.pileVp.farmers_market = 2;
            play(['FARMERS_MARKET']);
            expect(player.coins).toBe(3);
            game.pileVp.farmers_market = 4;
            player.actions = 1;
            player.hand = makeCards(['FARMERS_MARKET']);
            game.playActionCard(0);
            expect(player.vpTokens).toBe(4);
            expect(ids(game.trash)).toEqual(['farmers_market']);
        });

        it('ワイルドハントは3枚引いて山に勝利点を置くか、屋敷を獲得して山の勝利点を取る', () => {
            play(['WILD_HUNT']);
            game.resolvePrompt([0]);
            expect(player.hand).toHaveLength(3);
            expect(game.pileVp.wild_hunt).toBe(1);
            player.actions = 1;
            player.hand = makeCards(['WILD_HUNT']);
            game.playActionCard(0);
            game.resolvePrompt([1]);
            expect(player.vpTokens).toBe(1);
            expect(ids(player.discard)).toContain('estate');
        });

        it('資本は場から捨て札にするとき負債を6負い、財宝で返す', () => {
            toBuyPhase(['CAPITAL']);
            expect(player.coins).toBe(6);
            player.coins = 2;
            game.endTurn();
            expect(player.debt).toBe(4);
        });

        it('記録庫は3枚を脇に置き、今と次の2回のターンに1枚ずつ手札に加える', () => {
            player.deck = makeCards(['GOLD', 'SILVER', 'ESTATE', ...Array(10).fill('COPPER')]);
            play(['ARCHIVE']);
            game.resolvePrompt([0]);
            expect(ids(player.hand)).toEqual(['gold']);
            game.enterBuyPhase();
            game.endTurn();
            game.endTurn();
            game.resolvePrompt([0]);
            expect(ids(player.hand)).toContain('silver');
            passTurns();
            expect(ids(player.hand)).toContain('estate');
            expect(player.setAside).toHaveLength(0);
        });

        it('魔除けは次に獲得したとき、同じコストの別のカードも獲得できる', () => {
            toBuyPhase(['CHARM', 'GOLD']);
            game.resolvePrompt([1]);
            game.buyCard('silver');
            expect(game.pendingPrompt.cards.every(card => card.cost === 3 && card.id !== 'silver')).toBe(true);
        });

        it('王冠は購入フェーズには財宝を2回プレイする', () => {
            toBuyPhase(['CROWN', 'GOLD']);
            game.resolvePrompt([0]);
            expect(player.coins).toBe(6);
        });

        it('大君主はコスト5以下のアクションをサプライに置いたままプレイする', () => {
            setupGame([], [...KINGDOM.slice(0, 9), 'smithy']);
            play(['OVERLORD']);
            const choices = ids(game.pendingPrompt.cards);
            expect(choices).toContain('smithy');
            expect(choices).not.toContain('engineer');
            game.resolvePrompt([choices.indexOf('smithy')]);
            expect(player.hand).toHaveLength(3);
            expect(game.supply.smithy).toBe(10);
        });

        it('庭師が場にある間、勝利点カードを獲得すると勝利点トークン+1', () => {
            play(['GROUNDSKEEPER']);
            game.enterBuyPhase();
            player.coins = 5;
            game.buyCard('duchy');
            expect(player.vpTokens).toBe(1);
        });

        it('エンポリウムは場にアクションが5枚以上あるとき獲得すると勝利点トークン+2', () => {
            player.playArea = makeCards(['VILLA', 'VILLA', 'VILLA', 'VILLA', 'VILLA']);
            game.pileCards.patrician_emporium.splice(0, 5);
            game.gainCardFromSupply(player, 'emporium');
            game.processEffects();
            expect(player.vpTokens).toBe(2);
        });

        it('城：崩れかけの城は獲得で勝利点と銀貨、王の城は城1枚につき勝利点2', () => {
            const before = player.calculateVictoryPoints();
            game.pileCards.castles.shift();
            game.supply.castles--;
            game.gainCardFromSupply(player, 'castles');
            game.processEffects();
            expect(player.vpTokens).toBe(1);
            expect(ids(player.discard)).toEqual(['crumbling_castle', 'silver']);
            player.discard.push(...makeCards(['KINGS_CASTLE']));
            const castles = player.getAllCards().filter(card => card.types.includes('castle')).length;
            expect(castles).toBe(2);
            // 崩れかけの城 1 ＋ 勝利点トークン 1 ＋ 王の城（城2枚で4）
            expect(player.calculateVictoryPoints()).toBe(before + 1 + 1 + 2 * castles);
        });

        it('小さい城はこれを廃棄して城を獲得する', () => {
            play(['SMALL_CASTLE']);
            game.resolvePrompt([0]);
            expect(ids(game.trash)).toEqual(['small_castle']);
            expect(ids(player.discard)).toEqual(['humble_castle']);
        });
    });

    describe('イベント', () => {
        const buy = (id, hand = ['GOLD', 'GOLD', 'GOLD']) => {
            setupGame([id]);
            toBuyPhase(hand);
            expect(game.buyLandscape(id)).toBe(true);
        };

        it('前進はアクションを廃棄してコスト6以下のアクションを獲得する', () => {
            buy('advance', ['VILLA', 'COPPER']);
            game.resolvePrompt([0]);
            expect(game.pendingPrompt.cards.every(card => card.isType('action') && card.cost <= 6)).toBe(true);
        });

        it('併合は捨て札を5枚まで残して山札に混ぜ、公領を獲得する。負債8を負う', () => {
            setupGame(['annex']);
            player.discard = makeCards(['ESTATE', 'GOLD', 'GOLD']);
            toBuyPhase([]);
            game.buyLandscape('annex');
            game.resolvePrompt([0]);
            expect(ids(player.discard)).toEqual(['estate', 'duchy']);
            expect(player.debt).toBe(8);
        });

        it('晩餐会・征服・掘削・制圧・結婚式・棚ぼた', () => {
            buy('banquet');
            game.resolvePrompt([0]);
            expect(ids(player.discard).filter(id => id === 'copper')).toHaveLength(2);

            buy('conquest');
            expect(player.vpTokens).toBe(2);

            buy('delve');
            expect(player.buys).toBe(1);
            expect(ids(player.discard)).toEqual(['silver']);

            setupGame(['dominate']);
            toBuyPhase(['GOLD', 'GOLD', 'GOLD', 'GOLD', 'GOLD']);
            game.buyLandscape('dominate');
            expect(player.vpTokens).toBe(9);

            buy('wedding', ['GOLD', 'SILVER']);
            expect(player.vpTokens).toBe(1);
            expect(player.debt).toBe(3); // 負債は次に購入するときに返す

            setupGame(['windfall']);
            player.deck = [];
            toBuyPhase(['GOLD', 'GOLD']);
            game.buyLandscape('windfall');
            expect(ids(player.discard)).toEqual(['gold', 'gold', 'gold']);
        });

        it('寄付はターンの後に、山札と捨て札を手札に加えて廃棄を選ぶ', () => {
            setupGame(['donate']);
            player.discard = makeCards(['CURSE', 'ESTATE']);
            toBuyPhase([]);
            game.buyLandscape('donate');
            game.endTurn();
            expect(game.pendingPrompt.purpose).toBe('donate');
            game.resolvePrompt([indexIn(game.pendingPrompt.cards, 'curse')]);
            expect(ids(game.trash)).toEqual(['curse']);
            expect(player.hand).toHaveLength(5);
            expect(game.getCurrentPlayer()).toBe(opponent);
        });

        it('儀式は呪いを獲得して、廃棄したカードのコストだけ勝利点を得る', () => {
            buy('ritual', ['GOLD', 'GOLD', 'SILVER']);
            expect(ids(player.discard)).toEqual(['curse']);
            expect(player.hand).toHaveLength(0);
            setupGame(['ritual']);
            toBuyPhase(['GOLD', 'SILVER']);
            player.hand = makeCards(['GOLD']);
            game.buyLandscape('ritual');
            game.resolvePrompt([0]);
            expect(player.vpTokens).toBe(6);
        });

        it('塩まきは勝利点+1とサプライの勝利点カードを廃棄する', () => {
            buy('salt_the_earth');
            game.resolvePrompt([indexIn(game.pendingPrompt.cards, 'province')]);
            expect(game.supply.province).toBe(7);
            expect(player.vpTokens).toBe(1);
        });

        it('徴税は山に負債を置き、その山のカードを購入したプレイヤーが負う', () => {
            buy('tax');
            player.buys = 1;
            expect(game.pileDebt.silver).toBe(1);
            game.resolvePrompt([indexIn(game.pendingPrompt.cards, 'silver')]);
            expect(game.pileDebt.silver).toBe(3);
            game.buyCard('silver');
            expect(player.debt).toBe(3);
        });

        it('凱旋は屋敷を獲得し、このターンに獲得した枚数だけ勝利点を得る', () => {
            setupGame(['triumph']);
            toBuyPhase(['GOLD', 'GOLD']);
            player.buys = 2;
            game.buyCard('silver');
            game.buyLandscape('triumph');
            expect(player.vpTokens).toBe(2);
            expect(player.debt).toBe(5); // 負債は次に購入するときに返す
        });
    });

    describe('ランドマーク', () => {
        const score = (id, cards) => {
            setupGame([id]);
            player.deck = makeCards(cards);
            player.hand = [];
            player.discard = [];
            return game.getLandscape(id).score(game, player);
        };

        it('得点計算のランドマーク', () => {
            expect(score('bandit_fort', ['SILVER', 'GOLD', 'COPPER'])).toBe(-4);
            expect(score('fountain', Array(10).fill('COPPER'))).toBe(15);
            expect(score('museum', ['COPPER', 'SILVER', 'SILVER'])).toBe(4);
            expect(score('orchard', ['VILLA', 'VILLA', 'VILLA', 'TEMPLE'])).toBe(4);
            expect(score('palace', ['COPPER', 'COPPER', 'SILVER', 'SILVER', 'GOLD'])).toBe(3);
            expect(score('triumphal_arch', ['VILLA', 'VILLA', 'VILLA', 'TEMPLE', 'TEMPLE'])).toBe(6);
            expect(score('wall', Array(18).fill('COPPER'))).toBe(-3);
            expect(score('wolf_den', ['COPPER', 'SILVER', 'SILVER', 'GOLD'])).toBe(-6);
            const keep = score('keep', ['GOLD', 'GOLD']);
            expect(keep).toBe(5); // 金貨は相手より多い（銅貨は相手の方が多い）
        });

        it('オベリスクは選ばれたアクションの山のカード1枚につき勝利点2', () => {
            setupGame(['obelisk']);
            const pileId = game.landscapeState.obelisk;
            const topId = game.getPileTop(pileId);
            player.deck = makeCards([topId.toUpperCase(), topId.toUpperCase()]);
            player.hand = [];
            expect(game.getLandscape('obelisk').score(game, player)).toBe(4);
            expect(createGameView(game, 0).obelisk).toBe(pileId);
        });

        it('塔は空になった山の勝利点以外のカード1枚につき勝利点1', () => {
            setupGame(['tower']);
            game.supply.villa = 0;
            player.deck = makeCards(['VILLA', 'VILLA']);
            player.hand = [];
            expect(game.getLandscape('tower').score(game, player)).toBe(2);
        });

        it('得点はゲームの終わりの結果とビューの勝利点に入る', () => {
            setupGame(['fountain']);
            player.deck.push(...makeCards(Array(5).fill('COPPER')));
            expect(game.calculateScore(player)).toBe(player.calculateVictoryPoints() + 15);
            expect(createGameView(game, 0).players[player.id].victoryPoints).toBe(game.calculateScore(player));
        });

        it('水道橋：財宝を獲得するとその山の勝利点を移し、勝利点カードを獲得すると取る', () => {
            setupGame(['aqueduct']);
            toBuyPhase(['GOLD', 'GOLD', 'GOLD']);
            player.buys = 2;
            game.buyCard('silver');
            expect(game.pileVp.silver).toBe(7);
            expect(game.landscapeVp.aqueduct).toBe(1);
            game.buyCard('estate');
            expect(player.vpTokens).toBe(1);
        });

        it('闘技場：購入フェーズの開始時にアクションを捨てて勝利点2', () => {
            setupGame(['arena']);
            toBuyPhase(['VILLA', 'COPPER']);
            game.resolvePrompt([0]);
            expect(player.vpTokens).toBe(2);
            expect(game.landscapeVp.arena).toBe(10);
        });

        it('バシリカ・戦場・列柱・迷宮・墓所', () => {
            setupGame(['basilica', 'battlefield']);
            toBuyPhase(['GOLD', 'GOLD']);
            game.buyCard('estate');
            expect(player.vpTokens).toBe(4); // バシリカ2（残り10）と戦場2

            setupGame(['colonnade', 'labyrinth']);
            play(['VILLA']);
            game.enterBuyPhase();
            player.coins = 8;
            game.buyCard('copper');
            expect(player.vpTokens).toBe(0);
            game.buyCard('villa');
            expect(player.vpTokens).toBe(4); // 列柱（場に同じカード）と迷宮（2枚目の獲得）

            setupGame(['tomb']);
            play(['TEMPLE', 'ESTATE', 'COPPER']);
            game.resolvePrompt([0, 1]);
            expect(player.vpTokens).toBe(1 + 2);
        });

        it('浴場：カードを獲得せずにターンを終えると勝利点2', () => {
            setupGame(['baths']);
            game.endTurn();
            expect(player.vpTokens).toBe(2);
        });

        it('汚された神殿：アクションを獲得すると山の勝利点を移し、呪いを購入すると取る', () => {
            setupGame(['defiled_shrine']);
            expect(game.pileVp.villa).toBe(2);
            expect(game.pileVp.temple).toBeUndefined();
            toBuyPhase(['GOLD', 'GOLD']);
            player.buys = 2;
            game.buyCard('villa');
            game.endTurn(); // ヴィラでアクションフェーズに戻ったので、ターンを終える
            game.endTurn();
            toBuyPhase([]);
            game.buyCard('curse');
            expect(player.vpTokens).toBe(1);
        });

        it('山道：最初に属州を獲得したプレイヤーのターンの後に入札し、最高額のプレイヤーが勝利点8と負債を得る', () => {
            setupGame(['mountain_pass']);
            toBuyPhase(['GOLD', 'GOLD', 'SILVER']);
            game.buyCard('province');
            game.endTurn();
            expect(game.pendingPrompt.player).toBe(opponent);
            game.resolvePrompt([3]); // 負債3で入札
            expect(game.pendingPrompt.player).toBe(player);
            game.resolvePrompt([0]); // 入札しない
            expect(opponent.vpTokens).toBe(8);
            expect(opponent.debt).toBe(3);
        });
    });
});
