import { describe, it, expect, beforeEach } from 'vitest';
import Game from '../public/js/game.js';
import Card from '../public/js/card.js';
import { ALL_CARDS, LANDSCAPES } from '../public/js/card-data.js';
import { runCpuStep } from '../public/js/cpu-player.js';
import { createGameView } from '../public/js/game-view.js';
import { createGame, makeCards, DEFAULT_KINGDOM } from './helpers.js';

const ids = (cards) => cards.map(card => card.id);
const KINGDOM = ['underling', 'sycophant', 'town', 'galleria', 'hunter', 'marquis', 'townsfolk', 'wizards', 'forts', 'clashes'];

describe('同盟', () => {
    let game;
    let player;
    let opponent;

    const setupGame = (ally = 'league_of_bankers', kingdom = KINGDOM) => {
        game = createGame(['A', 'B'], kingdom, { colonies: false, shelters: false, ally });
        player = game.getCurrentPlayer();
        opponent = game.getPlayerToLeft(player);
        game.players.forEach(p => {
            if (p !== player) p.hand = makeCards(['COPPER', 'COPPER', 'COPPER', 'ESTATE', 'ESTATE']);
            p.deck = makeCards(Array(15).fill('COPPER'));
            p.discard = [];
            p.favors = 0;
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

    // 手番のプレイヤーのターンを終える（残った選択には先頭の答えで答える）
    const finishTurn = () => {
        expect(game.endTurn()).toBe(true);
        while (game.pendingPrompt) game.resolvePrompt(game.pendingPrompt.type === 'confirm' ? false : [0]);
    };

    beforeEach(() => setupGame());

    describe('準備', () => {
        it('連絡役が王国にあれば同盟の札を1枚使い、各プレイヤーは恩恵を1つ持って始める', () => {
            const g = createGame(['A', 'B'], KINGDOM, { colonies: false, shelters: false });
            const allies = g.landscapes.filter(id => LANDSCAPES[id.toUpperCase()].kind === 'ally');
            expect(allies).toHaveLength(1);
            g.players.forEach(p => expect(p.favors).toBe(1));
        });

        it('連絡役がなければ同盟の札を使わない', () => {
            const g = createGame(['A', 'B'], DEFAULT_KINGDOM, { colonies: false, shelters: false });
            expect(g.landscapes).toHaveLength(0);
            g.players.forEach(p => expect(p.favors).toBe(0));
        });

        it('輸入業者があれば、準備で各プレイヤーは恩恵 +4', () => {
            const g = createGame(['A', 'B'], ['importer', ...DEFAULT_KINGDOM.slice(1)], { colonies: false, shelters: false, ally: null });
            expect(g.landscapes).toHaveLength(0);
            g.players.forEach(p => expect(p.favors).toBe(4));
        });

        it('セットから選ぶイベントなどに、同盟の札は入らない', () => {
            for (let seed = 1; seed <= 30; seed++) {
                const g = new Game(['A', 'B'], { cardSets: ['allies', 'menagerie'], seed, ally: null });
                g.setup();
                expect(g.landscapes.every(id => LANDSCAPES[id.toUpperCase()].kind !== 'ally')).toBe(true);
            }
        });

        it('ビューに恩恵の数を入れる', () => {
            player.favors = 3;
            expect(createGameView(game, player.id).players[player.id].favors).toBe(3);
        });
    });

    describe('4種で1山の山', () => {
        it('4枚ずつ決まった順に重ね、一番上だけを購入できる', () => {
            expect(game.supply.townsfolk).toBe(16);
            expect(game.getPileTop('townsfolk')).toBe('town_crier');
            toBuyPhase(['GOLD', 'GOLD']);
            expect(game.buyCard('blacksmith')).toBe(false);
            expect(game.buyCard('townsfolk')).toBe(true);
            expect(ids(player.discard)).toEqual(['town_crier']);
        });

        it('触れ役で町民の山を回すと、一番上の4枚が一番下に移る', () => {
            play(['TOWN_CRIER']);
            expect(game.pendingPrompt.purpose).toBe('town-crier');
            game.resolvePrompt([0]);
            expect(player.coins).toBe(2);
            expect(game.pendingPrompt.purpose).toBe('rotate');
            game.resolvePrompt(true);
            expect(game.getPileTop('townsfolk')).toBe('blacksmith');
            expect(game.pileCards.townsfolk.slice(-4)).toEqual(Array(4).fill('town_crier'));
        });
    });

    describe('カード', () => {
        it('装身具は違うものを2つ選び、獲得したカードを山札の上に置ける', () => {
            toBuyPhase(['BAUBLE', 'GOLD']);
            expect(game.pendingPrompt.purpose).toBe('bauble');
            expect(game.resolvePrompt([0])).toBe(false);
            game.resolvePrompt([0, 3]);
            expect(player.buys).toBe(2);
            game.buyCard('silver');
            expect(game.pendingPrompt.title).toBe('装身具');
            game.resolvePrompt(true);
            expect(player.deck[0].id).toBe('silver');
        });

        it('おべっか使いは獲得したとき恩恵 +2、プレイすると3枚捨てて財宝 +3', () => {
            game.gainCardFromSupply(player, 'sycophant');
            game.processEffects();
            expect(player.favors).toBe(2);
            play(['SYCOPHANT', 'ESTATE', 'ESTATE', 'COPPER', 'COPPER']);
            game.resolvePrompt([0, 1, 2]);
            expect(player.coins).toBe(3);
            expect(player.hand).toHaveLength(1);
        });

        it('密使は、引くときにシャッフルしたらアクション +1 と恩恵 +2', () => {
            player.deck = makeCards(['COPPER']);
            player.discard = makeCards(Array(5).fill('COPPER'));
            play(['EMISSARY']);
            expect(player.hand).toHaveLength(3);
            expect(player.actions).toBe(1);
            expect(player.favors).toBe(2);
        });

        it('ガレリアはコスト3か4のカードを獲得するたびに購入 +1、ギルドの親方は恩恵 +1', () => {
            play(['GALLERIA']);
            game.gainCardFromSupply(player, 'silver');
            game.gainCardFromSupply(player, 'gold');
            game.processEffects();
            expect(player.buys).toBe(2);
            player.actions = 1;
            player.hand = makeCards(['GUILDMASTER']);
            game.playActionCard(0);
            game.gainCardFromSupply(player, 'copper');
            game.processEffects();
            expect(player.favors).toBe(1);
        });

        it('辻強盗の攻撃を受けると、毎ターン最初にプレイする財宝は何もしない', () => {
            play(['HIGHWAYMAN']);
            finishTurn();
            expect(game.getCurrentPlayer()).toBe(opponent);
            opponent.hand = makeCards(['SILVER', 'COPPER']);
            game.enterBuyPhase();
            expect(opponent.coins).toBe(1);
            finishTurn();
            // 次のターンの開始時に、辻強盗を捨て札にしてカードを3枚引く
            expect(player.hand).toHaveLength(8);
            expect(player.playArea).toHaveLength(0);
            expect(ids(player.discard)).toContain('highwayman');
        });

        it('将軍の攻撃を受けると、場に2枚以上あるアクションを手札からプレイできない', () => {
            play(['WARLORD']);
            finishTurn();
            opponent.hand = makeCards(['UNDERLING', 'UNDERLING', 'UNDERLING']);
            expect(game.playActionCard(0)).toBe(true);
            expect(game.playActionCard(0)).toBe(true);
            expect(game.playActionCard(0)).toBe(false);
            expect(game.lastError).toContain('将軍');
            finishTurn();
            expect(player.hand).toHaveLength(7);
        });

        it('航海は追加のターンを行い、そのターンは手札から3枚までしかプレイできない', () => {
            play(['VOYAGE']);
            finishTurn();
            expect(game.getCurrentPlayer()).toBe(player);
            expect(game.turnState.handPlayLimit).toBe(3);
            player.hand = makeCards(['UNDERLING', 'UNDERLING', 'VOYAGE', 'UNDERLING', 'SILVER']);
            expect(game.playActionCard(0)).toBe(true);
            expect(game.playActionCard(0)).toBe(true);
            // 直前のターンが自分のターンなので、もう追加のターンはない
            expect(game.playActionCard(0)).toBe(true);
            expect(game.extraTurns).toHaveLength(0);
            expect(game.playActionCard(0)).toBe(false);
            // 財宝も手札からプレイできない
            game.enterBuyPhase();
            expect(player.coins).toBe(0);
            finishTurn();
            expect(game.getCurrentPlayer()).toBe(opponent);
        });

        it('リッチは次の自分のターンを飛ばし、廃棄すると捨て札にして廃棄置き場から安いカードを獲得する', () => {
            play(['LICH']);
            expect(player.hand).toHaveLength(6);
            expect(player.actions).toBe(2);
            finishTurn();
            expect(game.getCurrentPlayer()).toBe(opponent);
            finishTurn();
            expect(game.getCurrentPlayer()).toBe(opponent);
            expect(game.logs.some(entry => entry.message.includes('ターンを飛ばしました'))).toBe(true);

            player.discard = [];
            const lich = new Card(ALL_CARDS.LICH);
            game.trash.push(new Card(ALL_CARDS.SILVER));
            game.trashCard(player, lich);
            game.processEffects();
            expect(game.pendingPrompt.purpose).toBe('gain-from-trash');
            game.resolvePrompt([0]);
            expect(ids(player.discard)).toEqual(['lich', 'silver']);
            expect(game.trash).toHaveLength(0);
        });

        it('長老でプレイしたカードは、「1つを選ぶ」でもう1つ選べる', () => {
            play(['ELDER', 'TOWN']);
            expect(player.coins).toBe(2);
            game.resolvePrompt([0]);
            expect(game.pendingPrompt.purpose).toBe('town');
            expect(game.pendingPrompt.max).toBe(2);
            game.resolvePrompt([0, 1]);
            expect(player.actions).toBe(2);
            expect(player.buys).toBe(2);
            expect(player.coins).toBe(4);
        });

        it('歩哨は山札の上から5枚を見て、2枚まで廃棄する', () => {
            player.deck = makeCards(['CURSE', 'ESTATE', 'GOLD', 'GOLD', 'GOLD', 'COPPER']);
            play(['SENTINEL']);
            game.resolvePrompt([0, 1]);
            expect(ids(game.trash)).toEqual(['curse', 'estate']);
            expect(ids(player.deck)).toEqual(['gold', 'gold', 'gold', 'copper']);
        });

        it('狩人は山札の上から3枚のうち、アクション・財宝・勝利点を1枚ずつ手札に加える', () => {
            player.deck = makeCards(['UNDERLING', 'COPPER', 'GOLD', 'ESTATE']);
            play(['HUNTER']);
            expect(ids(player.hand).sort()).toEqual(['gold', 'underling']);
            expect(ids(player.discard)).toEqual(['copper']);
        });

        it('侯爵は手札1枚につき1枚引き、10枚になるまで捨てる', () => {
            play(['MARQUIS', ...Array(7).fill('ESTATE')]);
            expect(player.hand).toHaveLength(14);
            expect(game.pendingPrompt.purpose).toBe('discard-down');
            game.resolvePrompt([0, 1, 2, 3]);
            expect(player.hand).toHaveLength(10);
            expect(player.buys).toBe(2);
        });

        it('領土は勝利点カードの名前の種類だけ勝利点があり、獲得すると空の山1つにつき金貨を獲得する', () => {
            const territory = new Card(ALL_CARDS.TERRITORY);
            expect(territory.getVictoryPoints(makeCards(['ESTATE', 'ESTATE', 'DUCHY', 'TERRITORY']))).toBe(3);
            game.supply.curse = 0;
            game.supply.estate = 0;
            game.gainCardInstance(player, territory);
            game.processEffects();
            expect(ids(player.discard)).toEqual(['territory', 'gold', 'gold']);
        });

        it('守備隊は獲得するたびにトークンを置き、次のターンにその枚数を引く', () => {
            play(['GARRISON']);
            game.gainCardFromSupply(player, 'silver');
            game.gainCardFromSupply(player, 'silver');
            game.processEffects();
            finishTurn();
            finishTurn();
            expect(player.hand).toHaveLength(7);
        });

        it('王家のガレー船でプレイしたカードを脇に置き、次のターンの開始時にもう一度プレイする', () => {
            play(['ROYAL_GALLEY', 'UNDERLING']);
            game.resolvePrompt([0]);
            expect(player.favors).toBe(1);
            expect(ids(player.setAside)).toEqual(['underling']);
            finishTurn();
            finishTurn();
            expect(player.favors).toBe(2);
            expect(ids(player.playArea)).toEqual(['royal_galley', 'underling']);
        });

        it('蛮族：コスト3以上なら共通の種類の安いカード、そうでなければ呪いを獲得させる', () => {
            opponent.deck = makeCards(['SILVER', 'COPPER']);
            play(['BARBARIAN']);
            expect(ids(game.trash)).toEqual(['silver']);
            expect(game.pendingPrompt.player).toBe(opponent);
            expect(ids(game.pendingPrompt.cards)).toEqual(['copper']);
            game.resolvePrompt([0]);
            player.actions = 1;
            player.hand = makeCards(['BARBARIAN']);
            game.playActionCard(0);
            expect(ids(opponent.discard)).toEqual(['copper', 'curse']);
        });

        it('専門家はプレイしたカードと同じカードを獲得できる', () => {
            play(['SPECIALIST', 'UNDERLING']);
            game.resolvePrompt([0]);
            expect(game.pendingPrompt.purpose).toBe('specialist-choice');
            game.resolvePrompt([1]);
            expect(ids(player.discard)).toEqual(['underling']);
            expect(game.supply.underling).toBe(9);
        });

        it('すり替えは手札のアクションを山に戻し、別のアクションを手札に獲得する', () => {
            play(['SWAP', 'UNDERLING']);
            game.resolvePrompt([0]);
            expect(game.supply.underling).toBe(11);
            const townIndex = game.pendingPrompt.cards.findIndex(card => card.id === 'town');
            game.resolvePrompt([townIndex]);
            expect(ids(player.hand)).toContain('town');
        });
    });

    describe('同盟の札', () => {
        it('発明家の一族：購入フェーズの開始時に山に恩恵トークンを置き、その山のコストが1下がる', () => {
            setupGame('family_of_inventors');
            player.favors = 1;
            toBuyPhase(['COPPER']);
            const index = game.pendingPrompt.cards.findIndex(card => card.id === 'galleria');
            game.resolvePrompt([index]);
            expect(game.getCost('galleria')).toBe(4);
            expect(player.favors).toBe(0);
            expect(player.coins).toBe(1);
            expect(createGameView(game, player.id).inventorTokens.galleria).toBe(1);
        });

        it('銀行家連盟：購入フェーズの開始時に、恩恵4つにつき財宝 +1', () => {
            player.favors = 9;
            toBuyPhase([]);
            expect(player.coins).toBe(2);
        });

        it('高原の羊飼い：恩恵とコスト2のカードの組1つにつき2勝利点', () => {
            setupGame('plateau_shepherds');
            player.hand = makeCards(['ESTATE', 'ESTATE']);
            player.favors = 3;
            expect(game.calculateScore(player)).toBe(6);
        });

        it('沿岸の避難港：恩恵を使った枚数の手札を次のターンまで残す', () => {
            setupGame('coastal_haven');
            player.favors = 2;
            player.hand = makeCards(['GOLD', 'SILVER', 'COPPER']);
            game.endTurn();
            expect(game.pendingPrompt.purpose).toBe('coastal-haven');
            game.resolvePrompt([0, 1]);
            expect(player.hand).toHaveLength(7);
            expect(ids(player.hand)).toEqual(expect.arrayContaining(['gold', 'silver']));
            expect(player.favors).toBe(0);
        });

        it('石工団：シャッフルしたとき、恩恵1つにつき2枚まで勝利点カードを捨て札に置く', () => {
            setupGame('order_of_masons');
            player.favors = 1;
            player.deck = [];
            player.discard = makeCards(['ESTATE', 'ESTATE', 'COPPER', 'COPPER', 'COPPER']);
            player.drawCards(1);
            expect(ids(player.discard)).toEqual(['estate', 'estate']);
            expect(player.favors).toBe(0);
            expect(player.hand[player.hand.length - 1].id).toBe('copper');
        });

        it('都市国家：自分のターンに獲得したアクションを、恩恵を2つ使ってプレイする', () => {
            setupGame('city_state');
            player.favors = 2;
            game.gainCardFromSupply(player, 'town');
            game.processEffects();
            expect(game.pendingPrompt.purpose).toBe('city-state');
            game.resolvePrompt(true);
            game.resolvePrompt([1]);
            expect(player.coins).toBe(2);
            expect(player.favors).toBe(0);
            expect(ids(player.playArea)).toEqual(['town']);
        });

        it('猟師の小屋：獲得したカードを、恩恵を1つ使って山札の上に置く', () => {
            setupGame('trappers_lodge');
            player.favors = 1;
            game.gainCardFromSupply(player, 'silver');
            game.processEffects();
            game.resolvePrompt(true);
            expect(player.deck[0].id).toBe('silver');
            expect(player.favors).toBe(0);
        });

        it('商店主連盟：連絡役をプレイした後、恩恵が5つ以上なら財宝 +1', () => {
            setupGame('league_of_shopkeepers');
            player.favors = 4;
            play(['UNDERLING']);
            expect(player.favors).toBe(5);
            expect(player.coins).toBe(1);
        });

        it('島の民：恩恵を5つ使って追加のターンを行う', () => {
            setupGame('island_folk');
            player.favors = 5;
            game.endTurn();
            expect(game.pendingPrompt.purpose).toBe('island-folk');
            game.resolvePrompt(true);
            expect(game.getCurrentPlayer()).toBe(player);
            expect(player.favors).toBe(0);
        });
    });

    describe('CPU', () => {
        it('同盟のカードだけでCPU同士が最後まで遊び、操作の記録から再現できる', () => {
            for (let seed = 1; seed <= 8; seed++) {
                const players = [{ name: 'A', isCPU: true }, { name: 'B', isCPU: true }, { name: 'C', isCPU: true }];
                const options = { cardSets: ['allies'], seed };
                const g = new Game(players, options);
                g.setup();
                let steps = 0;
                while (g.phase !== 'end' && steps < 20000) {
                    runCpuStep(g);
                    steps++;
                }
                expect(g.phase).toBe('end');
                const replayed = Game.replay(players, options, g.commands);
                expect(replayed.result).toEqual(g.result);
            }
        });
    });
});
