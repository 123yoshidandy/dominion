import { describe, it, expect, beforeEach } from 'vitest';
import Game from '../public/js/game.js';
import { ALL_CARDS, LANDSCAPES } from '../public/js/card-data.js';
import { LOOT_CARD_IDS } from '../public/js/card-data-plunder.js';
import { createGameView } from '../public/js/game-view.js';
import { createGame, makeCards } from './helpers.js';

const ids = (cards) => cards.map(card => card.id);
const KINGDOM = ['sack_of_loot', 'abundance', 'search', 'cage', 'flagship', 'harbor_village', 'landing_party', 'taskmaster', 'trickster', 'kings_cache'];

describe('略奪', () => {
    let game;
    let player;
    let opponent;

    const setupGame = (options = {}, kingdom = KINGDOM) => {
        game = createGame(['A', 'B'], kingdom, { colonies: false, shelters: false, ...options });
        player = game.getCurrentPlayer();
        opponent = game.getPlayerToLeft(player);
        game.players.forEach(p => {
            p.hand = makeCards(['COPPER', 'COPPER', 'COPPER', 'ESTATE', 'ESTATE']);
            p.deck = makeCards(Array(15).fill('COPPER'));
            p.discard = [];
        });
    };

    const play = (hand, index = 0) => {
        player.hand = makeCards(hand);
        expect(game.playActionCard(index)).toBe(true);
    };

    const toBuyPhase = (hand) => {
        player.hand = makeCards(hand);
        expect(game.enterBuyPhase()).toBe(true);
    };

    // 手番のプレイヤーのターンを終える（残った選択には先頭の答えで答える）
    const finishTurn = () => {
        expect(game.endTurn()).toBe(true);
        while (game.pendingPrompt) game.resolvePrompt(game.pendingPrompt.type === 'confirm' ? false : [0]);
    };

    // 自分と相手のターンを終え、自分のターンの開始まで進める
    const passRound = () => {
        finishTurn();
        expect(game.getCurrentPlayer()).toBe(opponent);
        finishTurn();
        expect(game.getCurrentPlayer()).toBe(player);
    };

    beforeEach(() => setupGame());

    describe('分捕り品', () => {
        it('分捕り品を使うカードがあれば、15種を2枚ずつ混ぜたサプライ外の山を置く', () => {
            expect(game.lootPile).toHaveLength(30);
            expect(game.nonSupply.loot).toBe(30);
            expect(new Set(game.lootPile)).toEqual(new Set(LOOT_CARD_IDS));
        });

        it('分捕り品を使うカードがなければ、山を置かない', () => {
            setupGame({}, ['abundance', 'flagship', 'harbor_village', 'landing_party', 'taskmaster', 'trickster', 'kings_cache', 'cage', 'crew', 'longship']);
            expect(game.lootPile).toHaveLength(0);
            expect(game.nonSupply.loot).toBeUndefined();
        });

        it('分捕り品の袋：財宝1、購入 +1、分捕り品を1枚獲得する', () => {
            toBuyPhase(['SACK_OF_LOOT']);
            expect(player.coins).toBe(1);
            expect(player.buys).toBe(2);
            expect(player.discard).toHaveLength(1);
            expect(ALL_CARDS[player.discard[0].id.toUpperCase()].isLoot).toBe(true);
            expect(game.nonSupply.loot).toBe(29);
        });

        it('盾：アタックの影響を受けない', () => {
            opponent.hand = makeCards(['SHIELD', 'COPPER', 'COPPER', 'COPPER', 'COPPER']);
            play(['TRICKSTER']);
            expect(ids(opponent.discard)).not.toContain('curse');
        });
    });

    describe('次に〜したときまで場に残るカード', () => {
        it('豊穣：次にアクションカードを獲得したとき、購入 +1、財宝 +3', () => {
            toBuyPhase(['ABUNDANCE']);
            expect(player.waits).toHaveLength(1);
            player.coins = 5;
            expect(game.buyCard('search')).toBe(true);
            expect(player.coins).toBe(6);
            expect(player.buys).toBe(1);
            expect(player.waits).toHaveLength(0);
            finishTurn();
            expect(player.playArea).toHaveLength(0);
        });

        it('豊穣：きっかけが起きるまで、ターンをまたいで場に残る', () => {
            toBuyPhase(['ABUNDANCE']);
            passRound();
            expect(ids(player.playArea)).toEqual(['abundance']);
            player.coins = 4;
            game.phase = 'buy';
            expect(game.buyCard('flagship')).toBe(true);
            expect(player.coins).toBe(3);
        });

        it('捜索：次にサプライの山が空になったとき、廃棄して分捕り品を獲得する', () => {
            play(['SEARCH']);
            expect(player.coins).toBe(2);
            game.supply.taskmaster = 1;
            game.gainCardFromSupply(opponent, 'taskmaster');
            game.processEffects();
            expect(ids(game.trash)).toContain('search');
            expect(player.discard.some(card => LOOT_CARD_IDS.includes(card.id))).toBe(true);
        });

        it('檻：手札を脇に置き、勝利点カードを獲得したら檻を廃棄して、ターンの終わりに手札に加える', () => {
            toBuyPhase(['CAGE', 'ESTATE', 'DUCHY']);
            expect(game.pendingPrompt.purpose).toBe('cage-set-aside');
            game.resolvePrompt([0, 1]);
            expect(ids(player.setAside)).toEqual(['estate', 'duchy']);
            player.coins = 5;
            expect(game.buyCard('duchy')).toBe(true);
            expect(ids(game.trash)).toContain('cage');
            finishTurn();
            expect(ids(player.hand)).toEqual(expect.arrayContaining(['estate', 'duchy']));
            expect(player.hand).toHaveLength(7);
            expect(player.setAside).toHaveLength(0);
        });

        it('旗艦：次に命令でないアクションをプレイしたとき、もう一度プレイする', () => {
            player.actions = 2;
            play(['FLAGSHIP']);
            expect(player.coins).toBe(2);
            play(['TASKMASTER']);
            expect(player.coins).toBe(4);
            expect(player.actions).toBe(2);
            expect(player.waits).toHaveLength(0);
        });

        it('上陸部隊：次にターンの最初にプレイしたカードが財宝なら、その後で山札の上に置く', () => {
            play(['LANDING_PARTY']);
            passRound();
            toBuyPhase(['COPPER']);
            expect(player.deck[0].id).toBe('landing_party');
            expect(ids(player.playArea)).toEqual(['copper']);
        });

        it('上陸部隊：最初にアクションをプレイしたターンは、そのまま待つ', () => {
            play(['LANDING_PARTY']);
            passRound();
            play(['TASKMASTER']);
            toBuyPhase(['COPPER']);
            expect(ids(player.playArea)).toContain('landing_party');
            expect(player.waits).toHaveLength(1);
        });

        it('悪漢：次に誰かがコスト5以上の財宝を獲得したとき、分捕り品を獲得する', () => {
            setupGame({}, ['cutthroat', ...KINGDOM.slice(1)]);
            opponent.hand = makeCards(['COPPER', 'COPPER', 'COPPER', 'ESTATE', 'ESTATE']);
            play(['CUTTHROAT']);
            game.resolvePrompt([0, 1]);
            expect(opponent.hand).toHaveLength(3);
            game.gainCardFromSupply(opponent, 'silver');
            game.processEffects();
            expect(player.discard.some(card => LOOT_CARD_IDS.includes(card.id))).toBe(false);
            game.gainCardFromSupply(opponent, 'gold');
            game.processEffects();
            expect(player.discard.some(card => LOOT_CARD_IDS.includes(card.id))).toBe(true);
        });
    });

    describe('王国カード', () => {
        it('港村：次にプレイしたアクションで財宝が増えたら、財宝 +1', () => {
            play(['HARBOR_VILLAGE', 'TASKMASTER']);
            const index = player.hand.findIndex(card => card.id === 'taskmaster');
            expect(game.playActionCard(index)).toBe(true);
            expect(player.coins).toBe(2);
        });

        it('港村：次のアクションで財宝が増えなければ、何もない', () => {
            play(['HARBOR_VILLAGE', 'LANDING_PARTY']);
            const index = player.hand.findIndex(card => card.id === 'landing_party');
            expect(game.playActionCard(index)).toBe(true);
            expect(player.coins).toBe(0);
        });

        it('監督：ちょうどコスト5のカードを獲得したら、次のターンの開始時にもう一度効果を使う', () => {
            play(['TASKMASTER']);
            player.coins = 5;
            game.enterBuyPhase();
            expect(game.buyCard('trickster')).toBe(true);
            passRound();
            expect(ids(player.playArea)).toContain('taskmaster');
            expect(player.actions).toBe(2);
            expect(player.coins).toBe(1);
        });

        it('監督：獲得しなければ、場に残らない', () => {
            play(['TASKMASTER']);
            finishTurn();
            expect(player.playArea).toHaveLength(0);
        });

        it('いたずら者：他のプレイヤーは呪いを獲得し、場の財宝を1枚ターンの終わりに手札に加えられる', () => {
            play(['TRICKSTER']);
            expect(ids(opponent.discard)).toContain('curse');
            player.hand = makeCards(['GOLD']);
            game.enterBuyPhase();
            finishTurn();
            expect(ids(player.hand)).toContain('gold');
            expect(player.hand).toHaveLength(6);
        });

        it('王の隠し財宝：手札の財宝を3回プレイする', () => {
            toBuyPhase(['KINGS_CACHE', 'GOLD']);
            expect(game.pendingPrompt.purpose).toBe('kings-cache');
            game.resolvePrompt([0]);
            expect(player.coins).toBe(9);
        });

        it('セイレーン：獲得したとき、手札のアクションを廃棄しなければセイレーンを廃棄する', () => {
            setupGame({}, ['siren', ...KINGDOM.slice(1)]);
            player.hand = makeCards(['COPPER']);
            game.gainCardFromSupply(player, 'siren');
            game.processEffects();
            expect(ids(game.trash)).toContain('siren');

            player.hand = makeCards(['TASKMASTER']);
            game.gainCardFromSupply(player, 'siren');
            game.processEffects();
            expect(game.pendingPrompt.purpose).toBe('siren-trash');
            game.resolvePrompt([0]);
            expect(ids(game.trash)).toContain('taskmaster');
            expect(ids(player.discard)).toContain('siren');
        });

        it('シャーマン：ターンの開始時に、廃棄置き場からコスト6以下のカードを獲得する', () => {
            setupGame({}, ['shaman', ...KINGDOM.slice(1)]);
            game.trash.push(...makeCards(['GOLD', 'PROVINCE']));
            expect(game.endTurn()).toBe(true);
            expect(game.getCurrentPlayer()).toBe(opponent);
            expect(game.pendingPrompt.purpose).toBe('gain-from-trash');
            expect(ids(game.pendingPrompt.cards)).toEqual(['gold']);
            game.resolvePrompt([0]);
            expect(ids(opponent.discard)).toContain('gold');
        });

        it('フリゲート艦：攻撃を受けたプレイヤーは、アクションをプレイした後で手札が4枚になるまで捨てる', () => {
            setupGame({}, ['frigate', ...KINGDOM.slice(1)]);
            play(['FRIGATE']);
            expect(player.coins).toBe(3);
            finishTurn();
            opponent.hand = makeCards(['HARBOR_VILLAGE', 'COPPER', 'COPPER', 'COPPER', 'ESTATE', 'ESTATE']);
            expect(game.playActionCard(0)).toBe(true);
            expect(game.pendingPrompt.purpose).toBe('discard-down');
            game.resolvePrompt([0, 1]);
            expect(opponent.hand).toHaveLength(4);
        });

        it('密航者：誰かが持続カードを獲得したとき、手札からプレイしてもよい', () => {
            setupGame({}, ['stowaway', ...KINGDOM.slice(1)]);
            opponent.hand = makeCards(['STOWAWAY', 'COPPER']);
            game.gainCardFromSupply(player, 'search');
            game.processEffects();
            expect(game.pendingPrompt.player).toBe(opponent);
            game.resolvePrompt(true);
            expect(ids(opponent.playArea)).toEqual(['stowaway']);
        });

        it('補給係：ターンの開始時に、カードを獲得して上に置くか、上のカードを手札に加える', () => {
            setupGame({}, ['quartermaster', ...KINGDOM.slice(1)]);
            // 相手のターンを終えたところで、自分のターンの開始時の選択が出る
            const toMyTurnStart = () => {
                finishTurn();
                expect(game.endTurn()).toBe(true);
                expect(game.getCurrentPlayer()).toBe(player);
                expect(game.pendingPrompt.purpose).toBe('quartermaster');
            };
            play(['QUARTERMASTER']);
            toMyTurnStart();
            game.resolvePrompt([0]);
            const silverIndex = game.pendingPrompt.cards.findIndex(card => card.id === 'silver');
            game.resolvePrompt([silverIndex]);
            expect(ids(player.setAside)).toEqual(['silver']);
            toMyTurnStart();
            game.resolvePrompt([1]);
            game.resolvePrompt([0]);
            expect(ids(player.hand)).toContain('silver');
            expect(ids(player.playArea)).toContain('quartermaster');
        });
    });

    describe('特性', () => {
        it('特性を置いた山をビューに入れる', () => {
            setupGame({ landscapes: ['cheap'], traitPiles: { cheap: 'harbor_village' } });
            expect(createGameView(game, player.id).traits).toEqual({ cheap: 'harbor_village' });
        });

        it('特性を山を指定しなければ、アクションか財宝の王国カードの山に置く', () => {
            setupGame({ landscapes: ['rich', 'nearby'] });
            expect(Object.keys(game.traits)).toEqual(['rich', 'nearby']);
            expect(game.traits.rich).not.toBe(game.traits.nearby);
            Object.values(game.traits).forEach(pileId => expect(KINGDOM).toContain(pileId));
        });

        it('安価：コストが1少ない', () => {
            setupGame({ landscapes: ['cheap'], traitPiles: { cheap: 'harbor_village' } });
            expect(game.getCost('harbor_village')).toBe(3);
        });

        it('裕福な・手近な：獲得したとき、銀貨を獲得し、購入 +1', () => {
            setupGame({ landscapes: ['rich', 'nearby'], traitPiles: { rich: 'taskmaster', nearby: 'taskmaster' } });
            game.gainCardFromSupply(player, 'taskmaster');
            game.processEffects();
            expect(ids(player.discard)).toEqual(expect.arrayContaining(['taskmaster', 'silver']));
            expect(player.buys).toBe(2);
        });

        it('呪われた：獲得したとき、廃墟と呪いを獲得する', () => {
            setupGame({ landscapes: ['cursed'], traitPiles: { cursed: 'taskmaster' } });
            game.gainCardFromSupply(player, 'taskmaster');
            game.processEffects();
            expect(ids(player.discard)).toContain('curse');
            expect(player.discard.some(card => card.isType('ruins'))).toBe(true);
        });

        it('へつらう：属州を獲得したとき、この山のカードを獲得する', () => {
            setupGame({ landscapes: ['fawning'], traitPiles: { fawning: 'taskmaster' } });
            game.gainCardFromSupply(player, 'province');
            game.processEffects();
            expect(ids(player.discard)).toEqual(['province', 'taskmaster']);
        });

        it('無謀な：指示を2回行い、場から捨て札にするとき山に戻す', () => {
            setupGame({ landscapes: ['reckless'], traitPiles: { reckless: 'taskmaster' } });
            const before = game.supply.taskmaster;
            play(['TASKMASTER']);
            expect(player.actions).toBe(2);
            expect(player.coins).toBe(2);
            finishTurn();
            expect(game.supply.taskmaster).toBe(before + 1);
            expect(ids(player.discard)).not.toContain('taskmaster');
        });

        it('無謀な：財宝は2倍の財宝を得る', () => {
            setupGame({ landscapes: ['reckless'], traitPiles: { reckless: 'sack_of_loot' } });
            toBuyPhase(['SACK_OF_LOOT']);
            expect(player.coins).toBe(2);
            expect(player.buys).toBe(3);
            expect(game.nonSupply.loot).toBe(28);
        });

        it('疲れ知らずの：場から捨て札にするとき、ターンの終わりに山札の上に置く', () => {
            setupGame({ landscapes: ['tireless'], traitPiles: { tireless: 'taskmaster' } });
            play(['TASKMASTER']);
            finishTurn();
            expect(player.deck[0].id).toBe('taskmaster');
        });

        it('性急な：獲得したら脇に置き、次のターンの開始時にプレイする', () => {
            setupGame({ landscapes: ['hasty'], traitPiles: { hasty: 'taskmaster' } });
            game.gainCardFromSupply(player, 'taskmaster');
            game.processEffects();
            expect(ids(player.setAside)).toEqual(['taskmaster']);
            passRound();
            expect(ids(player.playArea)).toEqual(['taskmaster']);
            expect(player.actions).toBe(2);
        });

        it('受け継がれた：初期デッキの屋敷1枚がこの山のカードになる', () => {
            game = createGame(['A', 'B'], KINGDOM, { colonies: false, shelters: false, landscapes: ['inherited'], traitPiles: { inherited: 'harbor_village' } });
            game.players.forEach(p => {
                const all = ids(p.getAllCards());
                expect(all.filter(id => id === 'estate')).toHaveLength(2);
                expect(all).toContain('harbor_village');
            });
            expect(game.supply.harbor_village).toBe(8);
        });

        it('宿命の：シャッフルしたとき、この山のカードを一番上に置く', () => {
            game = createGame(['A', 'B'], KINGDOM, { colonies: false, shelters: false, landscapes: ['fated'], traitPiles: { fated: 'taskmaster' } });
            player = game.getCurrentPlayer();
            player.deck = [];
            player.discard = makeCards(['COPPER', 'COPPER', 'TASKMASTER', 'COPPER', 'ESTATE']);
            player.drawCards(1);
            expect(ids(player.hand).slice(-1)).toEqual(['taskmaster']);
        });

        it('内気な：ターンの開始時に、この山のカードを捨て札にしてカード +2', () => {
            setupGame({ landscapes: ['shy'], traitPiles: { shy: 'taskmaster' } });
            finishTurn();
            opponent.hand = makeCards(['TASKMASTER', 'COPPER']);
            finishTurn();
            player.hand = makeCards(['TASKMASTER', 'COPPER']);
            game.startTurn(player);
            expect(game.pendingPrompt.purpose).toBe('shy');
            game.resolvePrompt([0]);
            expect(ids(player.hand)).toEqual(['copper', 'copper', 'copper']);
        });

        it('忍耐強い：クリーンアップの開始時に脇に置き、次のターンの開始時にプレイする', () => {
            setupGame({ landscapes: ['patient'], traitPiles: { patient: 'taskmaster' } });
            player.hand = makeCards(['TASKMASTER', 'COPPER']);
            expect(game.endTurn()).toBe(true);
            expect(game.pendingPrompt.purpose).toBe('patient');
            game.resolvePrompt([0]);
            while (game.pendingPrompt) game.resolvePrompt([0]);
            finishTurn();
            expect(ids(player.playArea)).toEqual(['taskmaster']);
        });

        it('友好的：クリーンアップの開始時に、この山のカードを捨てて同じ山のカードを獲得する', () => {
            setupGame({ landscapes: ['friendly'], traitPiles: { friendly: 'taskmaster' } });
            player.hand = makeCards(['TASKMASTER']);
            expect(game.endTurn()).toBe(true);
            expect(game.pendingPrompt.purpose).toBe('friendly');
            game.resolvePrompt([0]);
            expect(ids(player.discard).filter(id => id === 'taskmaster').length + ids(player.hand).filter(id => id === 'taskmaster').length +
                ids(player.deck).filter(id => id === 'taskmaster').length).toBe(2);
        });

        it('鼓舞する：プレイした後、場にない名前のアクションを手札からプレイしてもよい', () => {
            setupGame({ landscapes: ['inspiring'], traitPiles: { inspiring: 'taskmaster' } });
            play(['TASKMASTER', 'LANDING_PARTY', 'TASKMASTER']);
            expect(game.pendingPrompt.purpose).toBe('play-new-action');
            expect(ids(game.pendingPrompt.cards)).toEqual(['landing_party']);
            game.resolvePrompt([0]);
            expect(ids(player.playArea)).toEqual(['taskmaster', 'landing_party']);
        });

        it('敬虔な：獲得したとき、手札を1枚廃棄してもよい', () => {
            setupGame({ landscapes: ['pious'], traitPiles: { pious: 'taskmaster' } });
            player.hand = makeCards(['ESTATE']);
            game.gainCardFromSupply(player, 'taskmaster');
            game.processEffects();
            expect(game.pendingPrompt.purpose).toBe('optional-trash');
            game.resolvePrompt([0]);
            expect(ids(game.trash)).toEqual(['estate']);
        });
    });

    describe('イベント', () => {
        const buyEvent = (id, coins = 10) => {
            game.enterBuyPhase();
            player.coins = coins;
            expect(game.buyLandscape(id)).toBe(true);
        };

        beforeEach(() => setupGame({
            landscapes: ['launch', 'journey', 'deliver', 'mirror', 'rush', 'prepare', 'bury', 'looting', 'maelstrom', 'scrounge', 'peril', 'prosper', 'foray', 'invasion', 'avoid']
        }));

        it('出航：アクションフェーズに戻り、カード +1、アクション +1、購入 +1（1ターンに1回）', () => {
            player.hand = makeCards(['COPPER']);
            buyEvent('launch', 3);
            expect(game.phase).toBe('action');
            expect(player.actions).toBe(2);
            expect(player.buys).toBe(1);
            expect(player.hand).toHaveLength(1);
            game.enterBuyPhase();
            player.coins = 3;
            expect(game.buyLandscape('launch')).toBe(false);
        });

        it('旅程：場のカードを捨て札にせず、追加のターンを行う', () => {
            player.hand = makeCards(['COPPER']);
            buyEvent('journey', 4);
            finishTurn();
            expect(game.getCurrentPlayer()).toBe(player);
            expect(ids(player.playArea)).toEqual(['copper']);
        });

        it('配達：このターン獲得したカードを、ターンの終わりに手札に加える', () => {
            buyEvent('deliver', 5);
            expect(game.buyCard('silver')).toBe(true);
            expect(ids(player.setAside)).toEqual(['silver']);
            finishTurn();
            expect(ids(player.hand)).toContain('silver');
            expect(player.hand).toHaveLength(6);
        });

        it('鏡：次に獲得したアクションと同じカードをもう1枚獲得する', () => {
            buyEvent('mirror', 6);
            expect(game.buyCard('taskmaster')).toBe(true);
            expect(ids(player.discard)).toEqual(['taskmaster', 'taskmaster']);
        });

        it('突進：次に獲得したアクションをプレイする', () => {
            buyEvent('rush', 5);
            expect(game.buyCard('taskmaster')).toBe(true);
            expect(ids(player.playArea)).toContain('taskmaster');
            expect(player.coins).toBe(1);
        });

        it('準備：手札を脇に置き、次のターンの開始時にアクションと財宝をプレイして残りを捨てる', () => {
            game.enterBuyPhase();
            player.hand = makeCards(['TASKMASTER', 'GOLD', 'ESTATE']);
            player.coins = 3;
            expect(game.buyLandscape('prepare')).toBe(true);
            expect(ids(player.setAside)).toEqual(['taskmaster', 'gold', 'estate']);
            passRound();
            expect(ids(player.playArea)).toEqual(['taskmaster', 'gold']);
            expect(player.coins).toBe(4);
            expect(ids(player.discard)).toContain('estate');
        });

        it('埋葬：捨て札のカードを山札の一番下に置く', () => {
            player.discard = makeCards(['GOLD']);
            buyEvent('bury', 1);
            game.resolvePrompt([0]);
            expect(player.deck[player.deck.length - 1].id).toBe('gold');
        });

        it('分捕り：分捕り品を1枚獲得する', () => {
            buyEvent('looting', 6);
            expect(player.discard.some(card => LOOT_CARD_IDS.includes(card.id))).toBe(true);
        });

        it('大渦：手札を3枚廃棄し、手札が5枚以上の他のプレイヤーは1枚廃棄する', () => {
            player.hand = makeCards(['ESTATE', 'ESTATE', 'CURSE', 'COPPER']);
            game.enterBuyPhase();
            player.coins = 4;
            expect(game.buyLandscape('maelstrom')).toBe(true);
            expect(game.pendingPrompt.purpose).toBe('maelstrom-trash');
            game.resolvePrompt([0, 1, 2]);
            expect(game.pendingPrompt.player).toBe(opponent);
            game.resolvePrompt([0]);
            expect(game.trash).toHaveLength(4);
            expect(opponent.hand).toHaveLength(4);
        });

        it('あさる：廃棄置き場の屋敷を獲得し、コスト5以下のカードを獲得する', () => {
            game.trash.push(...makeCards(['ESTATE']));
            buyEvent('scrounge', 3);
            game.resolvePrompt([1]);
            expect(game.pendingPrompt.purpose).toBe('gain');
            game.resolvePrompt([0]);
            expect(ids(player.discard)).toContain('estate');
            expect(player.discard).toHaveLength(2);
        });

        it('侵略：公領、山札の上にアクション、分捕り品を獲得し、分捕り品をプレイする', () => {
            buyEvent('invasion', 10);
            game.resolvePrompt([game.pendingPrompt.cards.findIndex(card => card.id === 'taskmaster')]);
            while (game.pendingPrompt) game.resolvePrompt(game.pendingPrompt.type === 'confirm' ? false : [0]);
            expect(ids(player.discard)).toContain('duchy');
            expect(player.deck[0].id).toBe('taskmaster');
            expect(player.getAllCards().some(card => LOOT_CARD_IDS.includes(card.id))).toBe(true);
        });

        it('回避：このターン次にシャッフルしたとき、勝利点・呪いを3枚まで捨て札に置く', () => {
            buyEvent('avoid', 2);
            player.deck = [];
            player.discard = makeCards(['ESTATE', 'ESTATE', 'CURSE', 'DUCHY', 'COPPER']);
            player.drawCards(1);
            expect(ids(player.hand).slice(-1)).toEqual(['copper']);
            expect(player.discard).toHaveLength(3);
        });

        it('栄華：分捕り品と、名前の違う財宝を好きな枚数獲得する', () => {
            buyEvent('prosper', 10);
            const silver = game.pendingPrompt.cards.findIndex(card => card.id === 'silver');
            const gold = game.pendingPrompt.cards.findIndex(card => card.id === 'gold');
            game.resolvePrompt([silver, gold]);
            expect(ids(player.discard)).toEqual(expect.arrayContaining(['silver', 'gold']));
            expect(player.discard).toHaveLength(3);
        });
    });

    describe('準備のときに選ぶ札', () => {
        it('セットから選ぶ札に、略奪のイベントと特性が入る', () => {
            const kinds = new Set();
            for (let seed = 1; seed <= 40; seed++) {
                const g = new Game(['A', 'B'], { cardSets: ['plunder'], seed });
                g.setup();
                g.landscapes.forEach(id => kinds.add(LANDSCAPES[id.toUpperCase()].kind));
                expect(Object.keys(g.traits).every(id => g.landscapes.includes(id))).toBe(true);
            }
            expect(kinds).toEqual(new Set(['event', 'trait']));
        });
    });
});
