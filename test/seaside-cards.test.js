import { describe, it, expect, beforeEach } from 'vitest';
import { getKingdomCardIds } from '../public/js/card-data.js';
import { runCpuStep } from '../public/js/cpu-player.js';
import { createGame, makeCards } from './helpers.js';

const SEASIDE_CARD_IDS = getKingdomCardIds(['seaside']);
const SEASIDE_KINGDOM = SEASIDE_CARD_IDS.map(id => id.toLowerCase());

const ids = (cards) => cards.map(card => card.id);

describe('海辺の王国カード', () => {
    let game;
    let player;
    let opponent;

    // 手札を決めてアクションカード（手札の先頭）をプレイする
    const play = (hand) => {
        player.hand = makeCards(hand);
        expect(game.playActionCard(0)).toBe(true);
    };

    // 自分のターンを終え、相手のターンも終えて、自分の次のターンを始める
    const toNextTurn = () => {
        game.endTurn();
        game.endTurn();
        expect(game.getCurrentPlayer()).toBe(player);
    };

    beforeEach(() => {
        game = createGame(['A', 'B'], [...SEASIDE_KINGDOM, 'throne_room', 'militia', 'smithy']);
        player = game.getCurrentPlayer();
        opponent = game.players.find(p => p !== player);
        player.deck = makeCards(Array(15).fill('COPPER'));
        player.discard = [];
        opponent.hand = makeCards(['COPPER', 'COPPER', 'COPPER', 'ESTATE', 'ESTATE']);
        opponent.deck = makeCards(Array(15).fill('COPPER'));
        opponent.discard = [];
    });

    describe('持続カード', () => {
        it('漁村は次のターンまで場に残り、次のターンの開始時にアクション+1・財宝+1', () => {
            play(['FISHING_VILLAGE']);
            expect(player.actions).toBe(2);
            expect(player.coins).toBe(1);

            game.endTurn();
            expect(ids(player.playArea)).toEqual(['fishing_village']);

            game.endTurn();
            expect(player.actions).toBe(2);
            expect(player.coins).toBe(1);

            // 効果を終えたら、そのターンの終わりに捨て札になる
            game.endTurn();
            expect(player.playArea).toHaveLength(0);
            expect(ids(player.discard)).toContain('fishing_village');
        });

        it('玉座の間で持続カードをプレイすると、玉座の間も場に残り効果が2回ある', () => {
            play(['THRONE_ROOM', 'CARAVAN']);
            game.resolvePrompt([0]);
            game.endTurn();
            expect(ids(player.playArea).sort()).toEqual(['caravan', 'throne_room']);

            game.endTurn();
            // 5枚 + 隊商2回分
            expect(player.hand).toHaveLength(7);
        });

        it('停泊所で脇に置いたカードは、次のターンに手札に加わる', () => {
            play(['HAVEN', 'GOLD']);
            game.resolvePrompt([player.hand.findIndex(card => card.id === 'gold')]);
            expect(ids(player.setAside)).toEqual(['gold']);

            toNextTurn();
            expect(ids(player.hand)).toContain('gold');
            expect(player.setAside).toHaveLength(0);
        });

        it('商船・波止場は次のターンにも効果がある', () => {
            play(['MERCHANT_SHIP']);
            expect(player.coins).toBe(2);
            toNextTurn();
            expect(player.coins).toBe(2);

            play(['WHARF']);
            expect(player.hand).toHaveLength(2);
            expect(player.buys).toBe(2);
            toNextTurn();
            expect(player.hand).toHaveLength(7);
            expect(player.buys).toBe(2);
        });

        it('アストロラーベは財宝としてプレイし、次のターンも財宝+1・購入+1', () => {
            player.hand = makeCards(['ASTROLABE', 'COPPER']);
            game.enterBuyPhase();
            expect(player.coins).toBe(2);
            expect(player.buys).toBe(2);

            toNextTurn();
            expect(player.coins).toBe(1);
            expect(player.buys).toBe(2);
        });

        it('潮だまりは3枚引き、次のターンの開始時に2枚捨てる', () => {
            play(['TIDE_POOLS']);
            expect(player.hand).toHaveLength(3);

            toNextTurn();
            expect(game.pendingPrompt.purpose).toBe('discard-down');
            expect(game.pendingPrompt.min).toBe(2);
            game.resolvePrompt([0, 1]);
            expect(player.hand).toHaveLength(3);
        });

        it('策士は手札をすべて捨て、次のターンに5枚引いてアクション+1・購入+1', () => {
            play(['TACTICIAN', 'COPPER', 'COPPER']);
            expect(player.hand).toHaveLength(0);
            toNextTurn();
            expect(player.hand).toHaveLength(10);
            expect(player.actions).toBe(2);
            expect(player.buys).toBe(2);
        });

        it('手札がなければ策士は場に残らない', () => {
            play(['TACTICIAN']);
            game.endTurn();
            expect(player.playArea).toHaveLength(0);
        });

        it('海の魔女は相手に呪いを渡し、次のターンに2枚引いて2枚捨てる', () => {
            play(['SEA_WITCH']);
            expect(ids(opponent.discard)).toContain('curse');

            toNextTurn();
            expect(player.hand).toHaveLength(7);
            game.resolvePrompt([0, 1]);
            expect(player.hand).toHaveLength(5);
        });

        it('船乗りは次のターンに財宝+2を得て、手札を1枚廃棄してもよい', () => {
            play(['SAILOR']);
            toNextTurn();
            expect(player.coins).toBe(2);
            expect(game.pendingPrompt.purpose).toBe('sailor-trash');
            game.resolvePrompt([0]);
            expect(game.trash).toHaveLength(1);
        });
    });

    describe('灯台', () => {
        it('場にある間は他のプレイヤーの攻撃を受けない', () => {
            play(['LIGHTHOUSE']);
            expect(player.coins).toBe(1);
            game.endTurn();

            // 相手の民兵は効かない
            opponent.hand = makeCards(['MILITIA']);
            game.playActionCard(0);
            expect(game.pendingPrompt).toBeNull();
            expect(player.hand).toHaveLength(5);
        });
    });

    describe('前哨地', () => {
        it('手札3枚で追加のターンを行い、追加のターン中の前哨地は効果がない', () => {
            play(['OUTPOST']);
            game.endTurn();
            expect(game.getCurrentPlayer()).toBe(player);
            expect(game.isExtraTurn).toBe(true);
            expect(player.hand).toHaveLength(3);

            play(['OUTPOST']);
            game.endTurn();
            expect(game.getCurrentPlayer()).toBe(opponent);
            expect(opponent.hand).toHaveLength(5);
        });
    });

    describe('宝物庫', () => {
        it('勝利点カードを獲得しなければ山札の上に戻り、次の手札に入る', () => {
            play(['TREASURY']);
            game.endTurn();
            expect(ids(player.hand)).toContain('treasury');
        });

        it('購入フェーズに勝利点カードを獲得したら戻らない', () => {
            play(['TREASURY']);
            game.enterBuyPhase();
            player.coins = 2;
            game.buyCard('estate');
            game.endTurn();
            expect(ids(player.hand)).not.toContain('treasury');
            expect(ids(player.discard)).toContain('treasury');
        });
    });

    describe('島', () => {
        it('このカードと手札のカードを島マットに置き、勝利点に数える', () => {
            play(['ISLAND', 'ESTATE']);
            game.resolvePrompt([0]);
            expect(ids(player.mats.island)).toEqual(['island', 'estate']);
            expect(player.playArea).toHaveLength(0);
            // 初期デッキは銅貨だけにしているので、島2点 + 屋敷1点
            expect(player.calculateVictoryPoints()).toBe(3);
        });
    });

    describe('原住民の村', () => {
        it('山札の上をマットに置き、次はマットのカードを手札に加えられる', () => {
            play(['NATIVE_VILLAGE']);
            expect(player.actions).toBe(2);
            expect(player.mats.nativeVillage).toHaveLength(1);

            game.playActionCard(player.hand.push(...makeCards(['NATIVE_VILLAGE'])) - 1);
            expect(game.pendingPrompt.purpose).toBe('native-village');
            game.resolvePrompt(false);
            expect(player.mats.nativeVillage).toHaveLength(0);
            expect(ids(player.hand)).toEqual(['copper']);
        });
    });

    describe('猿', () => {
        it('右隣のプレイヤーが獲得するたびにカードを引き、次のターンにも1枚引く', () => {
            play(['MONKEY']);
            game.endTurn();
            expect(player.hand).toHaveLength(5);

            game.enterBuyPhase();
            opponent.buys = 2;
            opponent.coins = 6;
            game.buyCard('silver');
            game.buyCard('silver');
            expect(player.hand).toHaveLength(7);

            game.endTurn();
            expect(player.hand).toHaveLength(8);
        });
    });

    describe('封鎖', () => {
        it('獲得したカードを次のターンに手札に加え、それまで相手が同じカードを獲得すると呪いを受ける', () => {
            play(['BLOCKADE']);
            game.resolvePrompt([game.pendingPrompt.cards.findIndex(card => card.id === 'silver')]);
            expect(ids(player.setAside)).toEqual(['silver']);
            game.endTurn();

            game.enterBuyPhase();
            opponent.coins = 3;
            game.buyCard('silver');
            expect(ids(opponent.discard)).toContain('curse');

            game.endTurn();
            expect(ids(player.hand)).toContain('silver');
            expect(player.setAside).toHaveLength(0);
        });
    });

    describe('海賊', () => {
        it('誰かが財宝を獲得すると手札から自動でプレイされ、次のターンに財宝を手札に獲得する', () => {
            game.endTurn();
            player.hand = makeCards(['PIRATE', 'COPPER']);

            game.enterBuyPhase();
            opponent.coins = 3;
            game.buyCard('silver');
            expect(ids(player.playArea)).toEqual(['pirate']);

            game.endTurn();
            expect(game.pendingPrompt.purpose).toBe('gain');
            expect(game.pendingPrompt.cards.every(card => card.isType('treasure'))).toBe(true);
            game.resolvePrompt([game.pendingPrompt.cards.findIndex(card => card.id === 'gold')]);
            expect(ids(player.hand)).toContain('gold');
        });
    });

    describe('私掠船', () => {
        it('相手は次のターンに最初にプレイした銀貨か金貨を廃棄する', () => {
            play(['CORSAIR']);
            expect(player.coins).toBe(2);
            game.endTurn();

            opponent.hand = makeCards(['SILVER', 'SILVER', 'COPPER']);
            game.enterBuyPhase();
            // 財宝は得てから廃棄する
            expect(opponent.coins).toBe(5);
            expect(ids(game.trash)).toEqual(['silver']);

            game.endTurn();
            expect(player.hand).toHaveLength(6);
        });
    });

    describe('船乗り', () => {
        it('このターンに獲得した持続カードをプレイできる', () => {
            play(['SAILOR']);
            game.enterBuyPhase();
            player.coins = 4;
            game.buyCard('caravan');
            expect(game.pendingPrompt.purpose).toBe('sailor-play');

            game.resolvePrompt(true);
            expect(ids(player.playArea)).toEqual(['sailor', 'caravan']);
        });
    });

    describe('密輸人', () => {
        it('右隣のプレイヤーが直前のターンに獲得したカードを獲得する', () => {
            game.endTurn();
            game.enterBuyPhase();
            opponent.coins = 7;
            opponent.buys = 2;
            game.buyCard('bazaar');
            game.buyCard('estate');
            game.endTurn();

            play(['SMUGGLERS']);
            expect(ids(game.pendingPrompt.cards).sort()).toEqual(['bazaar', 'estate']);
            game.resolvePrompt([game.pendingPrompt.cards.findIndex(card => card.id === 'bazaar')]);
            expect(ids(player.discard)).toContain('bazaar');
        });
    });

    describe('その他のアクション', () => {
        it('見張りは上3枚から1枚廃棄・1枚捨て札・1枚戻す', () => {
            player.deck = makeCards(['ESTATE', 'COPPER', 'GOLD']);
            play(['LOOKOUT']);
            game.resolvePrompt([0]);
            game.resolvePrompt([0]);
            expect(ids(game.trash)).toEqual(['estate']);
            expect(ids(player.discard)).toEqual(['copper']);
            expect(ids(player.deck)).toEqual(['gold']);
        });

        it('倉庫は3枚引いて3枚捨てる', () => {
            play(['WAREHOUSE', 'ESTATE']);
            expect(game.pendingPrompt.min).toBe(3);
            game.resolvePrompt([0, 1, 2]);
            expect(player.hand).toHaveLength(1);
        });

        it('サルベージャーは購入+1、廃棄したカードのコスト分の財宝を得る', () => {
            play(['SALVAGER', 'GOLD']);
            game.resolvePrompt([0]);
            expect(player.coins).toBe(6);
            expect(player.buys).toBe(2);
        });

        it('宝の地図を2枚廃棄したら金貨4枚を山札の上に獲得する', () => {
            play(['TREASURE_MAP', 'TREASURE_MAP']);
            expect(ids(game.trash)).toEqual(['treasure_map', 'treasure_map']);
            expect(ids(player.deck.slice(0, 4))).toEqual(['gold', 'gold', 'gold', 'gold']);
        });

        it('宝の地図が1枚だけなら金貨は獲得しない', () => {
            play(['TREASURE_MAP']);
            expect(ids(game.trash)).toEqual(['treasure_map']);
            expect(game.supply.gold).toBe(30);
        });

        it('海図は山札の一番上と同じカードが場にあれば手札に加える', () => {
            player.deck = makeCards(['COPPER', 'SEA_CHART']);
            play(['SEA_CHART']);
            expect(ids(player.hand)).toEqual(['copper', 'sea_chart']);
        });

        it('巾着切りは相手の銅貨を1枚捨てさせる', () => {
            play(['CUTPURSE']);
            expect(player.coins).toBe(2);
            expect(ids(opponent.discard)).toEqual(['copper']);
        });

        it('バザーは1枚引いてアクション+2・財宝+1', () => {
            play(['BAZAAR']);
            expect(player.hand).toHaveLength(1);
            expect(player.actions).toBe(2);
            expect(player.coins).toBe(1);
        });
    });
});

describe('海辺のカードでのCPU同士の試合', () => {
    const playOut = (game, maxSteps) => {
        let steps = 0;
        while (game.phase !== 'end' && steps < maxSteps) {
            runCpuStep(game);
            steps++;
        }
        return game;
    };

    const cpuPlayers = [{ name: 'CPU1', isCPU: true }, { name: 'CPU2', isCPU: true }];

    it('海辺の王国カードで最後まで進められる', () => {
        const groups = [SEASIDE_KINGDOM.slice(0, 10), SEASIDE_KINGDOM.slice(10, 20), SEASIDE_KINGDOM.slice(17, 27)];
        groups.forEach(kingdom => {
            for (let round = 0; round < 10; round++) {
                expect(playOut(createGame(cpuPlayers, kingdom), 20000).phase).toBe('end');
            }
        });
    });

    it('海辺の全アクションカードを最初からデッキに入れても、すべてプレイして最後まで進められる', () => {
        const played = new Set();
        const actionIds = SEASIDE_CARD_IDS.filter(id => id !== 'ASTROLABE');

        for (let round = 0; round < 10; round++) {
            const game = createGame(cpuPlayers, SEASIDE_KINGDOM);
            game.players.forEach(p => {
                p.deck.push(...makeCards([...actionIds, 'TREASURE_MAP', 'ASTROLABE']));
                p.shuffleDeck();
            });
            const log = game.log.bind(game);
            game.log = (message) => {
                const match = message.match(/は(.+)をプレイしました$/);
                if (match) played.add(match[1]);
                return log(message);
            };
            expect(playOut(game, 30000).phase).toBe('end');
        }

        const names = makeCards(actionIds).map(card => card.name);
        expect(names.filter(name => !played.has(name))).toEqual([]);
    });

    it('基本と海辺を混ぜたランダムな王国カードで、3人でも最後まで進められる', () => {
        const all = getKingdomCardIds(['base', 'seaside']).map(id => id.toLowerCase());
        for (let round = 0; round < 30; round++) {
            const kingdom = [...all].sort(() => Math.random() - 0.5).slice(0, 10);
            const game = createGame([...cpuPlayers, { name: 'CPU3', isCPU: true }], kingdom);
            expect(playOut(game, 30000).phase).toBe('end');
        }
    });
});
