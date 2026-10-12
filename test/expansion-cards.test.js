import { describe, it, expect, beforeEach } from 'vitest';
import Game from '../public/js/game.js';
import { getKingdomCardIds } from '../public/js/card-data.js';
import { createGame, makeCards } from './helpers.js';

const ids = (cards) => cards.map(card => card.id);
const kingdomOf = (set) => getKingdomCardIds([set]).map(id => id.toLowerCase());
const indexIn = (cards, id) => cards.findIndex(card => card.id === id);

// 選択肢の文字から選択肢の番号を探す
const option = (game, text) => {
    const index = game.pendingPrompt.options.findIndex(label => label.includes(text));
    expect(index).toBeGreaterThanOrEqual(0);
    return index;
};

describe('拡張の王国カード', () => {
    let game;
    let player;
    let opponent;

    const setupGame = (kingdom, options = {}) => {
        game = createGame(['A', 'B'], kingdom, { colonies: false, ...options });
        player = game.getCurrentPlayer();
        opponent = game.players.find(p => p !== player);
        player.deck = makeCards(Array(15).fill('COPPER'));
        player.discard = [];
        opponent.hand = makeCards(['COPPER', 'COPPER', 'COPPER', 'ESTATE', 'ESTATE']);
        opponent.deck = makeCards(Array(15).fill('COPPER'));
        opponent.discard = [];
    };

    // 手札を決めてアクションカード（手札の先頭）をプレイする
    const play = (hand) => {
        player.hand = makeCards(hand);
        expect(game.playActionCard(0)).toBe(true);
    };

    // 手札を決めて購入フェーズに入る（財宝をすべてプレイする）
    const toBuyPhase = (hand) => {
        player.hand = makeCards(hand);
        expect(game.enterBuyPhase()).toBe(true);
    };

    describe('陰謀', () => {
        beforeEach(() => setupGame([...kingdomOf('intrigue').slice(0, 20), 'moat']));

        it('手先は異なる2つを選ぶ', () => {
            play(['PAWN']);
            expect(game.resolvePrompt([0, 0])).toBe(false);
            game.resolvePrompt([option(game, 'カード'), option(game, '財宝')]);
            expect(player.hand).toHaveLength(1);
            expect(player.coins).toBe(1);
            expect(player.actions).toBe(0);
        });

        it('橋はこのターンのカードのコストを1下げ、購入でもそのコストで払う', () => {
            play(['BRIDGE', 'SILVER', 'COPPER']);
            expect(game.getCost('duchy')).toBe(4);
            game.enterBuyPhase();
            expect(player.coins).toBe(4);
            expect(game.buyCard('duchy')).toBe(true);
            expect(player.coins).toBe(0);
            // 次のターンには元に戻る
            game.endTurn();
            expect(game.getCost('duchy')).toBe(5);
        });

        it('共謀者はアクションを3回以上プレイしていればカードを引きアクション+1', () => {
            player.actions = 3;
            play(['SHANTY_TOWN', 'MINING_VILLAGE', 'CONSPIRATOR', 'GOLD']);
            game.resolvePrompt(false); // 鉱山の村は廃棄しない
            game.playActionCard(indexIn(player.hand, 'mining_village'));
            game.resolvePrompt(false);
            const before = player.hand.length;
            game.playActionCard(indexIn(player.hand, 'conspirator'));
            expect(player.hand.length).toBe(before); // 1枚出して1枚引く
            expect(player.coins).toBe(2);
        });

        it('仮面舞踏会は手札のあるプレイヤーが左隣にカードを1枚ずつ同時に渡す', () => {
            play(['MASQUERADE', 'CURSE']);
            // 自分 → 相手の順に渡すカードを選ぶ
            expect(game.pendingPrompt.player).toBe(player);
            game.resolvePrompt([indexIn(player.hand, 'curse')]);
            expect(game.pendingPrompt.player).toBe(opponent);
            game.resolvePrompt([indexIn(opponent.hand, 'estate')]);
            expect(ids(opponent.hand)).toContain('curse');
            expect(ids(player.hand)).toContain('estate');
            expect(ids(player.hand)).not.toContain('curse');
            // 最後に自分は廃棄してもよい
            game.resolvePrompt([indexIn(player.hand, 'estate')]);
            expect(ids(game.trash)).toEqual(['estate']);
        });

        it('詐欺師は相手の山札の一番上を廃棄させ、同じコストのカードを選んで獲得させる', () => {
            opponent.deck = makeCards(['SILVER', 'COPPER']);
            play(['SWINDLER']);
            expect(ids(game.trash)).toEqual(['silver']);
            const { cards } = game.pendingPrompt;
            expect(cards.every(card => card.cost === 3)).toBe(true);
            game.resolvePrompt([indexIn(cards, 'swindler')]);
            expect(ids(opponent.discard)).toContain('swindler');
        });

        it('男爵は屋敷を捨てると財宝+4、捨てなければ屋敷を獲得する', () => {
            play(['BARON', 'ESTATE']);
            game.resolvePrompt(true);
            expect(player.coins).toBe(4);
            expect(player.buys).toBe(2);

            game.endTurn();
            game.endTurn();
            play(['BARON']);
            expect(ids(player.discard)).toContain('estate');
        });

        it('外交官は手札5枚以上のときアタックに反応して2枚引き3枚捨てられる', () => {
            opponent.hand = makeCards(['DIPLOMAT', 'COPPER', 'COPPER', 'ESTATE', 'ESTATE']);
            play(['TORTURER']);
            expect(game.pendingPrompt.purpose).toBe('diplomat-react');
            game.resolvePrompt(true);
            expect(opponent.hand).toHaveLength(7);
            game.resolvePrompt([0, 1, 2]);
            expect(opponent.hand).toHaveLength(4);
            // その後で拷問人の攻撃を受ける
            expect(game.pendingPrompt.purpose).toBe('torturer');
            game.resolvePrompt([1]);
            expect(ids(opponent.hand)).toContain('curse');
        });

        it('廷臣は公開したカードの種類の数だけ異なる効果を選ぶ', () => {
            play(['COURTIER', 'MILL']);
            game.resolvePrompt([0]); // 風車（アクション・勝利点）
            expect(game.pendingPrompt.min).toBe(2);
            game.resolvePrompt([option(game, '財宝'), option(game, '金貨')]);
            expect(player.coins).toBe(3);
            expect(ids(player.discard)).toContain('gold');
        });

        it('寵臣の攻撃は手札5枚以上の他のプレイヤーに手札を捨てて4枚引かせる', () => {
            play(['MINION', 'COPPER']);
            game.resolvePrompt([1]);
            expect(player.hand).toHaveLength(4);
            expect(opponent.hand).toHaveLength(4);
            expect(opponent.discard).toHaveLength(5);
        });

        it('改良はコストがちょうど1多いカードだけを獲得できる', () => {
            play(['UPGRADE', 'ESTATE']);
            game.resolvePrompt([indexIn(player.hand, 'estate')]);
            expect(game.pendingPrompt.cards.every(card => game.getCost(card) === 3)).toBe(true);
        });

        it('公爵は公領1枚につき1点、農場は財宝+2で2点', () => {
            player.hand = [];
            player.deck = [];
            player.discard = makeCards(['DUKE', 'DUCHY', 'DUCHY', 'FARM']);
            expect(player.calculateVictoryPoints()).toBe(2 + 6 + 2);
            toBuyPhase(['FARM']);
            expect(player.coins).toBe(2);
        });

        it('秘密の通路は手札のカードを山札の好きな位置に置く', () => {
            play(['SECRET_PASSAGE', 'GOLD']);
            game.resolvePrompt([indexIn(player.hand, 'gold')]);
            game.resolvePrompt([option(game, '上から2枚目')]);
            expect(player.deck[1].id).toBe('gold');
        });
    });

    describe('繁栄', () => {
        beforeEach(() => setupGame(kingdomOf('prosperity'), { colonies: true }));

        it('白金貨と植民地を使い、植民地がなくなるとゲームが終わる', () => {
            expect(game.supply.platinum).toBe(12);
            expect(game.supply.colony).toBe(8);
            game.supply.colony = 0;
            game.endTurn();
            expect(game.phase).toBe('end');
        });

        it('司教と記念碑で得た勝利点トークンは点数に入る', () => {
            play(['MONUMENT']);
            expect(player.vpTokens).toBe(1);
            player.actions = 1;
            player.hand = makeCards(['BISHOP', 'GOLD']);
            game.playActionCard(0);
            game.resolvePrompt([0]); // 金貨（コスト6）を廃棄して3点
            expect(player.vpTokens).toBe(1 + 1 + 3);
            const cardPoints = player.getAllCards().reduce((sum, card) => sum + card.getVictoryPoints(player.getAllCards()), 0);
            expect(player.calculateVictoryPoints()).toBe(cardPoints + 5);
        });

        it('石切場があるとアクションカードのコストが2下がる', () => {
            toBuyPhase(['QUARRY']);
            expect(game.getCost('kings_court')).toBe(5);
            expect(game.getCost('gold')).toBe(6);
        });

        it('行商人は購入フェーズに場のアクション1枚につきコストが2下がる', () => {
            play(['WORKERS_VILLAGE', 'WORKERS_VILLAGE']);
            game.playActionCard(indexIn(player.hand, 'workers_village'));
            expect(game.getCost('peddler')).toBe(8);
            game.enterBuyPhase();
            expect(game.getCost('peddler')).toBe(4);
        });

        it('大市場は場に銅貨があると購入できない', () => {
            toBuyPhase(['COPPER', 'GOLD', 'GOLD']);
            expect(game.buyCard('grand_market')).toBe(false);
        });

        it('ティアラで財宝を2回プレイでき、獲得したカードを山札の上に置ける', () => {
            toBuyPhase(['TIARA', 'GOLD']);
            game.resolvePrompt([0]);
            expect(player.coins).toBe(6);
            expect(player.buys).toBe(2);
            game.buyCard('silver');
            expect(game.pendingPrompt.purpose).toBe('tiara-topdeck');
            game.resolvePrompt(true);
            expect(player.deck[0].id).toBe('silver');
        });

        it('銀行は場の財宝の数だけ財宝を得る', () => {
            toBuyPhase(['BANK', 'COPPER', 'SILVER']);
            expect(player.coins).toBe(1 + 2 + 3);
        });

        it('隠し財産は勝利点カードを購入すると金貨を獲得する', () => {
            toBuyPhase(['HOARD', 'GOLD']);
            game.buyCard('duchy');
            expect(ids(player.discard)).toEqual(expect.arrayContaining(['duchy', 'gold']));
        });

        it('造幣所を購入すると場の財宝を廃棄する', () => {
            toBuyPhase(['GOLD', 'SILVER']);
            game.buyCard('mint');
            expect(ids(game.trash).sort()).toEqual(['gold', 'silver']);
            expect(ids(player.discard)).toContain('mint');
        });

        it('宮廷はアクションを3回プレイする', () => {
            play(['KINGS_COURT', 'MONUMENT']);
            game.resolvePrompt([0]);
            expect(player.coins).toBe(6);
            expect(player.vpTokens).toBe(3);
        });

        it('物見やぐらで獲得したカードを廃棄できる', () => {
            player.hand = makeCards(['WATCHTOWER', 'GOLD']);
            game.enterBuyPhase();
            game.buyCard('silver');
            expect(game.pendingPrompt.purpose).toBe('watchtower');
            game.resolvePrompt([option(game, '廃棄')]);
            expect(ids(game.trash)).toEqual(['silver']);
            expect(ids(player.discard)).not.toContain('silver');
        });

        it('ペテン師のあるゲームでは呪いが財宝+1になる', () => {
            play(['CHARLATAN']);
            expect(ids(opponent.discard)).toContain('curse');
            player.hand = makeCards(['CURSE', 'COPPER']);
            game.enterBuyPhase();
            expect(player.coins).toBe(3 + 1 + 1);
        });

        it('書記はターンの開始時に手札からプレイでき、アクションを使わない', () => {
            game.endTurn();
            // 相手のターン中に、自分の次の手札を決めておく
            player.hand = makeCards(['CLERK', 'COPPER', 'COPPER', 'COPPER', 'COPPER']);
            opponent.hand = makeCards(['COPPER', 'COPPER', 'COPPER', 'ESTATE', 'ESTATE']);
            game.endTurn();
            expect(game.pendingPrompt.purpose).toBe('clerk-start');
            game.resolvePrompt(true);
            expect(player.coins).toBe(2);
            expect(player.actions).toBe(1);
            expect(game.pendingPrompt.purpose).toBe('topdeck-from-hand');
            expect(game.pendingPrompt.player).toBe(opponent);
        });

        it('軍資金は左隣のプレイヤーが指定したカードを獲得できない', () => {
            toBuyPhase(['WAR_CHEST']);
            expect(game.pendingPrompt.player).toBe(opponent);
            const named = game.pendingPrompt.cards;
            game.resolvePrompt([indexIn(named, 'laboratory') >= 0 ? indexIn(named, 'laboratory') : indexIn(named, 'city')]);
            expect(game.pendingPrompt.player).toBe(player);
            expect(game.pendingPrompt.cards.some(card => card.id === 'city')).toBe(false);
        });
    });

    describe('異郷', () => {
        beforeEach(() => setupGame(kingdomOf('hinterlands')));

        it('岐路は最初の1枚だけアクション+3', () => {
            play(['CROSSROADS', 'CROSSROADS', 'ESTATE']);
            expect(player.actions).toBe(3);
            game.playActionCard(indexIn(player.hand, 'crossroads'));
            expect(player.actions).toBe(2);
        });

        it('愚者の黄金は2枚目から財宝+4、他のプレイヤーが属州を獲得したら金貨に替えられる', () => {
            toBuyPhase(['FOOLS_GOLD', 'FOOLS_GOLD', 'GOLD']);
            expect(player.coins).toBe(1 + 4 + 3);
            opponent.hand = makeCards(['FOOLS_GOLD']);
            game.buyCard('province');
            expect(game.pendingPrompt.player).toBe(opponent);
            game.resolvePrompt(true);
            expect(opponent.deck[0].id).toBe('gold');
            expect(ids(game.trash)).toContain('fools_gold');
        });

        it('坑道をクリーンアップ以外で捨てると金貨を獲得できる', () => {
            play(['OASIS', 'TUNNEL']);
            game.resolvePrompt([indexIn(player.hand, 'tunnel')]);
            expect(game.pendingPrompt.purpose).toBe('tunnel');
            game.resolvePrompt(true);
            expect(ids(player.discard)).toContain('gold');
        });

        it('坑道をクリーンアップで捨てても何もない', () => {
            player.hand = makeCards(['TUNNEL']);
            game.endTurn();
            expect(game.pendingPrompt).toBeNull();
        });

        it('遊牧民は獲得したときと廃棄したときに財宝+2', () => {
            toBuyPhase(['GOLD', 'COPPER']);
            game.buyCard('nomads');
            expect(player.coins).toBe(2);
        });

        it('策略で選んだアクションは次のターンの手札に入る', () => {
            play(['SCHEME', 'MARGRAVE']);
            game.playActionCard(indexIn(player.hand, 'margrave'));
            game.resolvePrompt([0, 1, 2]); // 辺境伯の攻撃で相手が捨てる
            game.endTurn();
            expect(game.pendingPrompt.purpose).toBe('scheme');
            const index = indexIn(game.pendingPrompt.cards, 'margrave');
            game.resolvePrompt([index]);
            expect(ids(player.hand)).toContain('margrave');
        });

        it('交易商で獲得したカードを銀貨と交換できる', () => {
            player.hand = makeCards(['TRADER', 'GOLD', 'GOLD']);
            game.enterBuyPhase();
            game.buyCard('duchy');
            expect(game.pendingPrompt.purpose).toBe('trader-react');
            const duchies = game.supply.duchy;
            game.resolvePrompt(true);
            expect(ids(player.discard)).toEqual(['silver']);
            expect(game.supply.duchy).toBe(duchies + 1);
        });

        it('国境の村を獲得すると、それより安いカードも獲得する', () => {
            toBuyPhase(['GOLD', 'GOLD']);
            game.buyCard('border_village');
            expect(game.pendingPrompt.cards.every(card => game.getCost(card) <= 5)).toBe(true);
        });

        it('肥沃な土地を購入すると手札を1枚廃棄し、コストがちょうど2多いカードを獲得する', () => {
            player.hand = makeCards(['GOLD', 'GOLD', 'ESTATE']);
            game.enterBuyPhase();
            game.buyCard('farmland');
            game.resolvePrompt([indexIn(player.hand, 'estate')]);
            expect(game.pendingPrompt.cards.every(card => game.getCost(card) === 4)).toBe(true);
        });

        it('街道があるとカードのコストが1下がる', () => {
            play(['HIGHWAY']);
            expect(game.getCost('province')).toBe(7);
        });

        it('番犬はアタックを受ける前にプレイできる', () => {
            opponent.hand = makeCards(['GUARD_DOG', 'COPPER', 'COPPER', 'COPPER', 'ESTATE']);
            play(['MARGRAVE']);
            expect(game.pendingPrompt.purpose).toBe('reaction-play');
            game.resolvePrompt(true);
            // 番犬で2枚引き（手札が6枚なので追加では引かない）、辺境伯で1枚引いてから3枚まで捨てる
            expect(game.pendingPrompt.purpose).toBe('discard-down');
            expect(opponent.hand).toHaveLength(7);
        });

        it('大釜は3回目にアクションを獲得したとき他のプレイヤーに呪いを渡す', () => {
            toBuyPhase(['CAULDRON', 'GOLD', 'GOLD', 'GOLD']);
            player.buys = 3;
            game.buyCard('oasis');
            game.buyCard('oasis');
            expect(ids(opponent.discard)).not.toContain('curse');
            game.buyCard('oasis');
            expect(ids(opponent.discard)).toContain('curse');
        });
    });

    describe('収穫祭＆ギルド', () => {
        beforeEach(() => setupGame(kingdomOf('cornucopia_guilds'), { bane: 'pawn', ferryman: 'smithy' }));

        it('パン屋があると各プレイヤーは財源1つで始め、財源は購入フェーズに財宝として使える', () => {
            expect(player.coffers).toBe(1);
            toBuyPhase(['COPPER']);
            expect(game.applyCommand(player.id, { type: 'coffers', amount: 1 })).toBe(true);
            expect(player.coins).toBe(2);
            expect(player.coffers).toBe(0);
            expect(game.applyCommand(player.id, { type: 'coffers', amount: 1 })).toBe(false);
        });

        it('魔女娘の災いカードを公開した相手は呪いを受けない', () => {
            expect(game.supply.pawn).toBe(10);
            play(['YOUNG_WITCH', 'ESTATE', 'ESTATE']);
            game.resolvePrompt([1, 2]);
            expect(ids(opponent.discard)).toContain('curse');

            game.endTurn();
            game.endTurn();
            opponent.hand = makeCards(['PAWN', 'COPPER']);
            opponent.discard = [];
            play(['YOUNG_WITCH', 'ESTATE', 'ESTATE']);
            game.resolvePrompt([1, 2]);
            expect(ids(opponent.discard)).not.toContain('curse');
        });

        it('渡し守を獲得すると、準備で選んだカードも獲得する', () => {
            toBuyPhase(['GOLD', 'GOLD']);
            game.buyCard('ferryman');
            expect(ids(player.discard)).toEqual(expect.arrayContaining(['ferryman', 'smithy']));
            expect(game.nonSupply.smithy).toBe(9);
        });

        it('蹄鉄工の超過支払いで、ターンの終わりにカードを多く引く', () => {
            toBuyPhase(['GOLD', 'COPPER']);
            game.buyCard('farrier');
            expect(game.pendingPrompt.purpose).toBe('overpay');
            game.resolvePrompt([option(game, '2を払う')]);
            game.endTurn();
            expect(player.hand).toHaveLength(7);
        });

        it('診療所の超過支払いで、獲得した診療所をプレイする', () => {
            player.hand = makeCards(['GOLD', 'COPPER', 'ESTATE']);
            game.enterBuyPhase();
            game.buyCard('infirmary');
            game.resolvePrompt([option(game, '1を払う')]);
            expect(ids(player.playArea)).toContain('infirmary');
            expect(game.pendingPrompt.purpose).toBe('optional-trash');
        });

        it('馬上槍試合で属州を脇に置いて褒賞を手札に獲得し、属州はクリーンアップで捨て札になる', () => {
            play(['JOUST', 'PROVINCE']);
            const rewards = game.pendingPrompt.cards;
            game.resolvePrompt([indexIn(rewards, 'renown')]);
            expect(ids(player.hand)).toContain('renown');
            expect(ids(player.setAside)).toEqual(['province']);
            game.endTurn();
            expect(player.setAside).toHaveLength(0);
            expect(ids([...player.discard, ...player.hand])).toContain('province');
        });

        it('名声はこのターンのコストを2下げる', () => {
            play(['JOUST', 'PROVINCE']);
            game.resolvePrompt([indexIn(game.pendingPrompt.cards, 'renown')]);
            game.playActionCard(indexIn(player.hand, 'renown'));
            expect(game.getCost('province')).toBe(6);
        });

        it('追い剥ぎのあるゲームではアクションフェーズにカードを獲得するたびに1枚引く', () => {
            play(['FOOTPAD']);
            expect(player.coffers).toBe(3);
            game.resolvePrompt([0, 1]); // 相手は手札を3枚まで捨てる
            const before = player.hand.length;
            player.actions = 1;
            player.hand.push(...makeCards(['REMAKE', 'ESTATE', 'ESTATE']));
            game.playActionCard(indexIn(player.hand, 'remake'));
            game.resolvePrompt([indexIn(player.hand, 'estate')]);
            game.resolvePrompt([0]);
            expect(player.hand.length).toBe(before + 3 - 1 - 1 + 1);
        });

        it('品評会は異なる名前のカード5種につき2点', () => {
            player.deck = makeCards(['FAIRGROUNDS', 'GOLD', 'SILVER', 'DUCHY']);
            player.hand = [];
            player.discard = [];
            // 品評会・金貨・銀貨・公領・銅貨・屋敷 の6種で2点、公領3点、屋敷3点
            player.discard = makeCards(['COPPER', 'ESTATE', 'ESTATE', 'ESTATE']);
            expect(player.calculateVictoryPoints()).toBe(2 + 3 + 3);
        });

        it('道化師は相手の山札の一番上が勝利点なら呪いを渡し、それ以外なら誰が獲得するかを選ぶ', () => {
            opponent.deck = makeCards(['ESTATE', 'SILVER']);
            play(['JESTER']);
            expect(ids(opponent.discard)).toEqual(expect.arrayContaining(['estate', 'curse']));

            game.endTurn();
            game.endTurn();
            opponent.deck = makeCards(['SILVER']);
            play(['JESTER']);
            game.resolvePrompt([option(game, '自分')]);
            expect(ids(player.discard)).toContain('silver');
        });

        it('農場労働者を獲得したとき脇に置いたカードを、次のターンの開始時にプレイする', () => {
            player.hand = makeCards(['GOLD', 'SILVER', 'MERCHANT_GUILD']);
            game.enterBuyPhase();
            game.buyCard('farmhands');
            game.resolvePrompt([indexIn(player.hand, 'merchant_guild')]);
            expect(ids(player.setAside)).toEqual(['merchant_guild']);
            game.endTurn();
            game.endTurn();
            expect(ids(player.playArea)).toContain('merchant_guild');
            expect(player.coins).toBe(1);
        });
    });
});

describe('ゲームの準備', () => {
    it('繁栄のカードが多いほど白金貨と植民地を使いやすく、繁栄がなければ使わない', () => {
        const withProsperity = new Game(['A', 'B'], { kingdom: kingdomOf('prosperity').slice(0, 10), seed: 1 });
        withProsperity.setup();
        expect(withProsperity.supply.colony).toBe(8);

        const without = new Game(['A', 'B'], { kingdom: kingdomOf('intrigue').slice(0, 10), seed: 1 });
        without.setup();
        expect(without.supply.colony).toBeUndefined();
    });

    it('魔女娘があると、コスト2か3の災いカードの山がサプライに加わる', () => {
        const game = new Game(['A', 'B'], { kingdom: ['young_witch', 'smithy', 'village'], seed: 3 });
        game.setup();
        expect(game.bane).toBeTruthy();
        expect([2, 3]).toContain(game.getCost(game.bane));
        expect(game.supply[game.bane]).toBeGreaterThan(0);
    });
});
