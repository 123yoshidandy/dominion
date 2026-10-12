import { describe, it, expect, beforeEach } from 'vitest';
import { LANDSCAPES } from '../public/js/card-data.js';
import { createGameView } from '../public/js/game-view.js';
import Game from '../public/js/game.js';
import { createGame, makeCards } from './helpers.js';

const ids = (cards) => cards.map(card => card.id);
const indexIn = (cards, id) => cards.findIndex(card => card.id === id);
const EVENTS = Object.values(LANDSCAPES).filter(data => data.set === 'adventures').map(data => data.id);
const KINGDOM = ['page', 'peasant', 'coin_of_the_realm', 'ratcatcher', 'port', 'magpie', 'messenger', 'royal_carriage', 'lost_city', 'smithy'];

describe('冒険', () => {
    let game;
    let player;
    let opponent;

    const setupGame = (kingdom = KINGDOM, landscapes = EVENTS) => {
        game = createGame(['A', 'B'], kingdom, { colonies: false, shelters: false, landscapes });
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

    const toBuyPhase = (hand) => {
        player.hand = makeCards(hand);
        expect(game.enterBuyPhase()).toBe(true);
    };

    // 次のプレイヤーのターンを終えて、もとのプレイヤーのターンに戻す
    const passTurns = () => {
        game.endTurn();
        game.endTurn();
    };

    beforeEach(() => setupGame());

    describe('準備', () => {
        it('ランダムな王国では、イベントを2つまで選ぶ', () => {
            for (let seed = 1; seed <= 30; seed++) {
                const random = new Game(['A', 'B'], { cardSets: ['adventures'], seed });
                random.setup();
                expect(random.landscapes.length).toBeLessThanOrEqual(2);
                random.landscapes.forEach(id => expect(EVENTS).toContain(id));
            }
        });

        it('トラベラーの上位カードをサプライ外に置き、ビューにイベントのコストが入る', () => {
            expect(game.nonSupply).toMatchObject({ treasure_hunter: 5, warrior: 5, hero: 5, champion: 5, soldier: 5, fugitive: 5, disciple: 5, teacher: 5 });
            expect(game.supply.port).toBe(12);
            const view = createGameView(game, 0);
            expect(view.landscapes.find(item => item.id === 'pathfinding').cost).toBe(8);
        });
    });

    describe('イベント', () => {
        it('購入回数とコインを使い、1ターンに1回のものは2回買えない', () => {
            toBuyPhase(['GOLD', 'GOLD']);
            player.buys = 3;
            expect(game.buyLandscape('expedition')).toBe(true);
            expect(player.coins).toBe(3);
            expect(game.buyLandscape('mission')).toBe(false); // コイン不足
            expect(game.buyLandscape('save')).toBe(true);
            game.resolvePrompt([]); // 手札がないので選択は出ない
            expect(game.buyLandscape('save')).toBe(false);
            expect(game.lastError).toContain('1ターンに1回');
            expect(game.buyLandscape('nothing')).toBe(false);
        });

        it('施しは場に財宝がなければコスト4以下を獲得する', () => {
            player.hand = makeCards(['ESTATE']);
            game.enterBuyPhase();
            game.buyLandscape('alms');
            expect(game.pendingPrompt.cards.every(card => card.cost <= 4)).toBe(true);
        });

        it('借入は購入+1と、-1 カードのトークンで財宝+1', () => {
            toBuyPhase(['COPPER']);
            game.buyLandscape('borrow');
            expect(player.buys).toBe(1);
            expect(player.coins).toBe(2);
            expect(player.minusCardToken).toBe(true);
            game.endTurn();
            expect(player.hand).toHaveLength(4);
            expect(player.minusCardToken).toBe(false);
        });

        it('探求で呪い2枚を捨てると金貨を獲得する', () => {
            toBuyPhase(['CURSE', 'CURSE', 'ESTATE']);
            game.buyLandscape('quest');
            game.resolvePrompt([game.pendingPrompt.options.findIndex(option => option.includes('呪い'))]);
            expect(ids(player.discard)).toEqual(['curse', 'curse', 'gold']);
        });

        it('保存は脇に置いたカードを、ターンの終わりに引いた後で手札に加える', () => {
            toBuyPhase(['COPPER', 'SMITHY']);
            game.buyLandscape('save');
            game.resolvePrompt([0]);
            game.endTurn();
            expect(player.hand).toHaveLength(6);
            expect(ids(player.hand)).toContain('smithy');
        });

        it('偵察隊は山札の上5枚から3枚を捨てる', () => {
            player.deck = makeCards(['ESTATE', 'GOLD', 'CURSE', 'SILVER', 'COPPER', 'GOLD']);
            toBuyPhase(['COPPER', 'COPPER']);
            game.buyLandscape('scouting_party');
            game.resolvePrompt([0, 2, 4]);
            expect(ids(player.discard)).toEqual(['estate', 'curse', 'copper']);
            game.resolvePrompt([0]);
            expect(ids(player.deck).slice(0, 3).sort()).toEqual(['gold', 'gold', 'silver']);
        });

        it('旅の祭りは購入+2と、獲得したカードを山札の上に置ける', () => {
            toBuyPhase(['GOLD', 'GOLD']);
            game.buyLandscape('travelling_fair');
            expect(player.buys).toBe(2);
            game.buyCard('silver');
            expect(game.pendingPrompt.purpose).toBe('tiara-topdeck');
            game.resolvePrompt(true);
            expect(player.deck[0].id).toBe('silver');
        });

        it('焚き火は場のカードを2枚まで廃棄する', () => {
            toBuyPhase(['COPPER', 'COPPER', 'GOLD']);
            game.buyLandscape('bonfire');
            game.resolvePrompt([0, 1]);
            expect(ids(game.trash)).toEqual(['copper', 'copper']);
        });

        it('遠征で次の手札が2枚多くなる', () => {
            toBuyPhase(['GOLD']);
            game.buyLandscape('expedition');
            game.endTurn();
            expect(player.hand).toHaveLength(7);
        });

        it('渡し船・計画・失われた技術・鍛錬・道の開拓・海路でトークンを山に置く', () => {
            const pileIndex = (pileId) => ids(game.pendingPrompt.cards).indexOf(pileId);
            toBuyPhase(['GOLD', 'GOLD', 'GOLD', 'GOLD', 'GOLD', 'GOLD', 'GOLD', 'GOLD', 'GOLD', 'GOLD', 'GOLD', 'GOLD']);
            player.buys = 10;
            game.buyLandscape('ferry');
            game.resolvePrompt([pileIndex('smithy')]);
            expect(game.getCost('smithy')).toBe(2);
            game.buyLandscape('lost_arts');
            game.resolvePrompt([pileIndex('smithy')]);
            game.buyLandscape('training');
            game.resolvePrompt([pileIndex('smithy')]);
            game.buyLandscape('pathfinding');
            game.resolvePrompt([pileIndex('smithy')]);
            game.buyLandscape('plan');
            game.resolvePrompt([pileIndex('port')]);
            expect(player.pileTokens).toMatchObject({ minusCost: 'smithy', plusAction: 'smithy', plusCoin: 'smithy', plusCard: 'smithy', trashing: 'port' });

            // 次のターンに鍛冶屋をプレイすると、トークンのボーナスを先に得る
            passTurns();
            player.hand = makeCards(['SMITHY']);
            player.actions = 1;
            game.playActionCard(0);
            expect(player.actions).toBe(1);
            expect(player.coins).toBe(1);
            expect(player.hand).toHaveLength(4);
        });

        it('計画の廃棄のトークンの山のカードを購入したら、手札を1枚廃棄できる', () => {
            player.pileTokens.trashing = 'port';
            toBuyPhase(['GOLD', 'SILVER', 'ESTATE']);
            game.buyCard('port');
            expect(game.pendingPrompt.purpose).toBe('optional-trash');
            game.resolvePrompt([0]);
            expect(ids(game.trash)).toEqual(['estate']);
        });

        it('海路はアクションを獲得し、その山に +1 購入のトークンを置く', () => {
            toBuyPhase(['GOLD', 'GOLD']);
            game.buyLandscape('seaway');
            game.resolvePrompt([indexIn(game.pendingPrompt.cards, 'port')]);
            expect(player.pileTokens.plusBuy).toBe('port');
            expect(ids(player.discard)).toContain('port');
        });

        it('伝道はカードを購入できない追加のターンを行う', () => {
            toBuyPhase(['GOLD', 'COPPER']);
            game.buyLandscape('mission');
            game.endTurn();
            expect(game.getCurrentPlayer()).toBe(player);
            expect(game.missionTurn).toBe(true);
            toBuyPhase(['GOLD', 'GOLD', 'GOLD']);
            player.buys = 2;
            expect(game.buyCard('silver')).toBe(false);
            expect(game.buyLandscape('expedition')).toBe(true);
            // 直前のターンが自分なので、伝道を買っても追加のターンはない
            expect(game.buyLandscape('mission')).toBe(true);
            game.endTurn();
            expect(game.getCurrentPlayer()).toBe(opponent);
            expect(game.missionTurn).toBe(false);
        });

        it('巡礼は旅のトークンが表になったら、場の名前の違うカードを3枚まで獲得する', () => {
            toBuyPhase(['GOLD', 'GOLD', 'SILVER']);
            game.buyLandscape('pilgrimage');
            expect(player.journeyFaceUp).toBe(false);
            expect(game.pendingPrompt).toBe(null);
            passTurns();
            toBuyPhase(['GOLD', 'SILVER']);
            player.discard = [];
            game.buyLandscape('pilgrimage');
            expect(player.journeyFaceUp).toBe(true);
            game.resolvePrompt([0, 1]);
            expect(ids(player.discard).sort()).toEqual(['gold', 'silver']);
        });

        it('舞踏会は -1 財宝のトークンを受け取り、コスト4以下を2枚獲得する', () => {
            toBuyPhase(['GOLD', 'SILVER']);
            game.buyLandscape('ball');
            game.resolvePrompt([0]);
            game.resolvePrompt([0]);
            expect(player.discard).toHaveLength(2);
            passTurns();
            toBuyPhase(['GOLD']);
            expect(player.coins).toBe(2);
            expect(player.minusCoinToken).toBe(false);
        });

        it('襲撃は場の銀貨の数だけ銀貨を獲得し、他のプレイヤーは -1 カードのトークンを置く', () => {
            toBuyPhase(['SILVER', 'SILVER', 'COPPER']);
            game.buyLandscape('raid');
            expect(ids(player.discard)).toEqual(['silver', 'silver']);
            expect(opponent.minusCardToken).toBe(true);
        });

        it('交易は手札を2枚まで廃棄して銀貨を獲得する', () => {
            toBuyPhase(['GOLD', 'GOLD', 'ESTATE', 'CURSE']);
            game.buyLandscape('trade');
            game.resolvePrompt([0, 1]);
            expect(ids(game.trash).sort()).toEqual(['curse', 'estate']);
            expect(ids(player.discard)).toEqual(['silver', 'silver']);
        });

        it('相続は1ゲームに1回、屋敷をそのカードとしてプレイできるようにする', () => {
            toBuyPhase(['GOLD', 'GOLD', 'COPPER']);
            player.buys = 2;
            game.buyLandscape('inheritance');
            game.resolvePrompt([indexIn(game.pendingPrompt.cards, 'smithy')]);
            expect(player.inheritance).toBe('smithy');
            expect(game.supply.smithy).toBe(9);
            expect(player.discard).toHaveLength(0);
            expect(game.buyLandscape('inheritance')).toBe(false);

            passTurns();
            player.hand = makeCards(['ESTATE']);
            expect(game.playActionCard(0)).toBe(true);
            expect(player.hand).toHaveLength(3);
            expect(ids(player.playArea)).toEqual(['estate']);
        });
    });

    describe('カード', () => {
        it('王国の硬貨は酒場マットに置き、アクションの後に呼び出してアクション+2を得られる', () => {
            toBuyPhase(['COIN_OF_THE_REALM']);
            expect(ids(player.mats.tavern)).toEqual(['coin_of_the_realm']);
            expect(player.coins).toBe(1);
            passTurns();
            play(['SMITHY']);
            expect(game.pendingPrompt.purpose).toBe('call-coin-of-the-realm');
            game.resolvePrompt(true);
            expect(player.actions).toBe(2);
            expect(ids(player.playArea)).toEqual(['smithy', 'coin_of_the_realm']);
        });

        it('王家の馬車は、解決したアクションをもう一度プレイする', () => {
            play(['ROYAL_CARRIAGE']);
            expect(ids(player.mats.tavern)).toEqual(['royal_carriage']);
            play(['SMITHY']);
            game.resolvePrompt(true);
            expect(player.hand).toHaveLength(6);
        });

        it('小姓はトレジャーハンターと交換でき、さらに戦士・英雄・チャンピオンと交換できる', () => {
            play(['PAGE']);
            game.enterBuyPhase();
            game.endTurn();
            expect(game.pendingPrompt.purpose).toBe('traveller-exchange');
            game.resolvePrompt(true);
            expect(game.supply.page).toBe(11);
            expect(game.nonSupply.treasure_hunter).toBe(4);
            expect(player.getAllCards().map(card => card.id)).toContain('treasure_hunter');
        });

        it('トレジャーハンターは右隣が直前のターンに獲得した枚数だけ銀貨を獲得する', () => {
            opponent.gainedLastTurn = ['silver', 'estate'];
            play(['TREASURE_HUNTER']);
            expect(ids(player.discard)).toEqual(['silver', 'silver']);
        });

        it('チャンピオンはずっと場に残り、アタックを防ぎ、アクションのたびにアクション+1', () => {
            play(['CHAMPION']);
            passTurns();
            expect(ids(player.playArea)).toEqual(['champion']);
            play(['SMITHY']);
            expect(player.actions).toBe(1);
            game.endTurn();
            const attacker = game.getCurrentPlayer();
            attacker.hand = makeCards(['WARRIOR']);
            player.deck = makeCards(['SILVER', 'SILVER']);
            game.playActionCard(0);
            expect(ids(player.deck)).toEqual(['silver', 'silver']);
        });

        it('雇人はずっと場に残り、毎ターンの開始時にカードを1枚引く', () => {
            play(['HIRELING']);
            passTurns();
            expect(player.hand).toHaveLength(6);
            passTurns();
            expect(player.hand).toHaveLength(6);
            expect(ids(player.playArea)).toEqual(['hireling']);
        });

        it('沼の妖婆は次のターンまで、他のプレイヤーが購入するたびに呪いを獲得させる', () => {
            play(['SWAMP_HAG']);
            game.endTurn();
            opponent.hand = makeCards(['GOLD']);
            game.enterBuyPhase();
            game.buyCard('silver');
            expect(ids(opponent.discard)).toEqual(expect.arrayContaining(['silver', 'curse']));
            game.endTurn();
            expect(player.coins).toBe(3);
        });

        it('幽霊の森は次のターンまで、他のプレイヤーが購入すると手札を山札の上に置かせる', () => {
            play(['HAUNTED_WOODS']);
            game.endTurn();
            opponent.hand = makeCards(['GOLD', 'ESTATE']);
            game.enterBuyPhase();
            opponent.hand = makeCards(['ESTATE']);
            game.buyCard('silver');
            expect(opponent.deck[0].id).toBe('estate');
            expect(opponent.hand).toHaveLength(0);
        });

        it('トロルの橋は他のプレイヤーに -1 財宝のトークンを渡し、場にある間コストを1下げる', () => {
            play(['BRIDGE_TROLL']);
            expect(opponent.minusCoinToken).toBe(true);
            expect(game.getCost('port')).toBe(3);
            expect(player.buys).toBe(2);
        });

        it('聖遺物は他のプレイヤーに -1 カードのトークンを置かせる', () => {
            toBuyPhase(['RELIC']);
            expect(player.coins).toBe(2);
            expect(opponent.minusCardToken).toBe(true);
        });

        it('遠隔地は酒場マットにあれば勝利点4', () => {
            play(['DISTANT_LANDS']);
            const base = player.calculateVictoryPoints();
            expect(ids(player.mats.tavern)).toEqual(['distant_lands']);
            player.mats.tavern = [];
            player.discard.push(...makeCards(['DISTANT_LANDS']));
            expect(player.calculateVictoryPoints()).toBe(base - 4);
        });

        it('巨人は旅のトークンが表になると財宝+5と攻撃、裏なら財宝+1', () => {
            play(['GIANT']);
            expect(player.coins).toBe(1);
            passTurns();
            opponent.deck = makeCards(['ESTATE']);
            opponent.discard = [];
            play(['GIANT']);
            expect(player.coins).toBe(5);
            expect(ids(opponent.discard)).toEqual(['estate', 'curse']);
        });

        it('港町を購入すると、もう1枚獲得する', () => {
            toBuyPhase(['SILVER', 'SILVER']);
            game.buyCard('port');
            expect(ids(player.discard)).toEqual(['port', 'port']);
        });

        it('使者を最初の購入で買うと、全員がコスト4以下のカードを獲得する', () => {
            toBuyPhase(['GOLD', 'COPPER']);
            game.buyCard('messenger');
            game.resolvePrompt([indexIn(game.pendingPrompt.cards, 'silver')]);
            // 購入したときの効果は、購入したカードを獲得する前に起きる
            expect(ids(player.discard)).toEqual(['silver', 'messenger']);
            expect(ids(opponent.discard)).toEqual(['silver']);
        });

        it('失われし都市を獲得すると、他のプレイヤーはカードを1枚引く', () => {
            toBuyPhase(['GOLD', 'SILVER']);
            game.buyCard('lost_city');
            expect(opponent.hand).toHaveLength(6);
        });

        it('守銭奴は銅貨を酒場マットに置き、マットの銅貨1枚につき財宝+1', () => {
            play(['MISER', 'COPPER']);
            game.resolvePrompt([0]);
            expect(ids(player.mats.tavern)).toEqual(['copper']);
            passTurns();
            play(['MISER']);
            game.resolvePrompt([1]);
            expect(player.coins).toBe(1);
        });

        it('ネズミ捕りはターンの開始時に呼び出して手札を廃棄できる', () => {
            play(['RATCATCHER']);
            passTurns();
            expect(game.pendingPrompt.purpose).toBe('call-ratcatcher');
            game.resolvePrompt(true);
            game.resolvePrompt([0]);
            expect(game.trash).toHaveLength(1);
            expect(ids(player.playArea)).toContain('ratcatcher');
        });

        it('語り部は財宝をプレイし、財宝をすべて払って同じ枚数引く', () => {
            play(['STORYTELLER', 'SILVER', 'COPPER']);
            game.resolvePrompt([0, 1]);
            expect(player.coins).toBe(0);
            expect(player.hand).toHaveLength(4);
        });

        it('宝物は金貨と銅貨を獲得する', () => {
            toBuyPhase(['TREASURE_TROVE']);
            expect(ids(player.discard)).toEqual(['gold', 'copper']);
        });

        it('ワイン商は財宝が2以上残っていれば、購入フェーズの終わりに酒場マットから捨て札にできる', () => {
            play(['WINE_MERCHANT']);
            game.enterBuyPhase();
            game.endTurn();
            expect(game.pendingPrompt.purpose).toBe('wine-merchant');
            game.resolvePrompt(true);
            expect(player.mats.tavern).toHaveLength(0);
        });

        it('複製は、獲得したカードをもう1枚獲得する', () => {
            play(['DUPLICATE']);
            game.enterBuyPhase();
            player.coins = 3;
            game.buyCard('silver');
            expect(game.pendingPrompt.purpose).toBe('call-duplicate');
            game.resolvePrompt(true);
            expect(ids(player.discard)).toEqual(['silver', 'silver']);
        });

        it('隊商の護衛は他のプレイヤーのアタックに反応してプレイでき、次のターンに財宝+1', () => {
            opponent.hand = makeCards(['CARAVAN_GUARD', 'COPPER']);
            play(['WARRIOR']);
            expect(game.pendingPrompt.purpose).toBe('reaction-play');
            game.resolvePrompt(true);
            expect(ids(opponent.playArea)).toEqual(['caravan_guard']);
            game.endTurn();
            game.resolvePrompt(false); // 戦士は英雄と交換しない
            expect(opponent.coins).toBe(1);
        });
    });
});
