import { describe, it, expect, beforeEach } from 'vitest';
import { KINGDOM_CARD_IDS } from '../public/js/card-data.js';
import { runCpuStep, hasCpuPrompt } from '../public/js/cpu-player.js';
import { createGame, makeCards } from './helpers.js';

// 25種すべてをサプライに入れたいテスト用（サプライの枚数を見るテストで使う）
const ALL_KINGDOM = KINGDOM_CARD_IDS.map(id => id.toLowerCase());

const ids = (cards) => cards.map(card => card.id);

describe('基本セットの王国カード', () => {
    let game;
    let player;
    let opponent;

    // 手札を決めてアクションカード（手札の先頭）をプレイする
    const play = (hand) => {
        player.hand = makeCards(hand);
        expect(game.playActionCard(0)).toBe(true);
    };

    beforeEach(() => {
        game = createGame(['A', 'B'], ALL_KINGDOM);
        player = game.getCurrentPlayer();
        opponent = game.players.find(p => p !== player);
        player.deck = makeCards(['COPPER', 'COPPER', 'COPPER', 'COPPER', 'COPPER']);
        player.discard = [];
        opponent.hand = makeCards(['COPPER', 'COPPER', 'COPPER', 'ESTATE', 'ESTATE']);
        opponent.deck = makeCards(['SILVER', 'ESTATE', 'COPPER']);
        opponent.discard = [];
    });

    it('サプライの庭園は公領と同じ枚数になる', () => {
        expect(game.supply.gardens).toBe(game.supply.duchy);
    });

    describe('宰相', () => {
        it('財宝+2を得て、選べば山札をすべて捨て札にする', () => {
            play(['CHANCELLOR']);
            expect(player.coins).toBe(2);
            expect(game.pendingPrompt.purpose).toBe('chancellor');

            game.resolvePrompt(true);
            expect(player.deck).toHaveLength(0);
            expect(player.discard).toHaveLength(5);
        });
    });

    describe('工房', () => {
        it('コスト4以下のカードだけを候補にして、選んだカードを獲得する', () => {
            play(['WORKSHOP']);
            const { cards } = game.pendingPrompt;
            expect(cards.every(card => card.cost <= 4)).toBe(true);

            const smithy = cards.findIndex(card => card.id === 'smithy');
            game.resolvePrompt([smithy]);
            expect(ids(player.discard)).toContain('smithy');
            expect(game.supply.smithy).toBe(9);
        });
    });

    describe('役人', () => {
        it('銀貨を山札の上に獲得し、相手は勝利点カードを山札の上に置く', () => {
            play(['BUREAUCRAT']);
            expect(player.deck[0].id).toBe('silver');
            expect(opponent.deck[0].id).toBe('estate');
            expect(opponent.hand).toHaveLength(4);
        });

        it('勝利点カードがない相手の手札は変わらない', () => {
            opponent.hand = makeCards(['COPPER', 'COPPER']);
            play(['BUREAUCRAT']);
            expect(opponent.hand).toHaveLength(2);
        });
    });

    describe('祝宴', () => {
        it('自身を廃棄して、コスト5以下のカードを獲得する', () => {
            play(['FEAST']);
            expect(ids(game.trash)).toEqual(['feast']);
            expect(game.pendingPrompt.cards.every(card => card.cost <= 5)).toBe(true);

            const lab = game.pendingPrompt.cards.findIndex(card => card.id === 'laboratory');
            game.resolvePrompt([lab]);
            expect(ids(player.discard)).toContain('laboratory');
        });
    });

    describe('庭園', () => {
        it('デッキ10枚につき1点になる', () => {
            player.hand = makeCards(['GARDENS']);
            player.deck = makeCards(Array(24).fill('COPPER'));
            // 庭園1枚 + 銅貨24枚 = 25枚 → 2点
            expect(player.calculateVictoryPoints()).toBe(2);
        });
    });

    describe('民兵', () => {
        it('財宝+2を得て、相手が手札3枚になるまで捨てる選択をする', () => {
            play(['MILITIA']);
            expect(player.coins).toBe(2);

            const prompt = game.pendingPrompt;
            expect(prompt.player).toBe(opponent);
            expect(prompt.min).toBe(2);
            expect(prompt.max).toBe(2);

            // 枚数が足りない答えは受け付けない
            expect(game.resolvePrompt([0])).toBe(false);
            expect(game.resolvePrompt([3, 4])).toBe(true);
            expect(ids(opponent.hand)).toEqual(['copper', 'copper', 'copper']);
        });

        it('お堀を持つ相手には効かない', () => {
            opponent.hand = makeCards(['MOAT', 'COPPER', 'COPPER', 'COPPER', 'COPPER']);
            play(['MILITIA']);
            expect(game.pendingPrompt).toBeNull();
            expect(opponent.hand).toHaveLength(5);
        });
    });

    describe('金貸し', () => {
        it('銅貨を1枚廃棄して財宝+3を得る', () => {
            play(['MONEYLENDER', 'COPPER', 'COPPER']);
            expect(player.coins).toBe(3);
            expect(ids(player.hand)).toEqual(['copper']);
            expect(ids(game.trash)).toEqual(['copper']);
        });

        it('銅貨がなければ何も起きない', () => {
            play(['MONEYLENDER', 'SILVER']);
            expect(player.coins).toBe(0);
            expect(game.trash).toHaveLength(0);
        });
    });

    describe('改築', () => {
        it('廃棄したカードよりコストが2多いカードまでを獲得する', () => {
            play(['REMODEL', 'ESTATE']);
            game.resolvePrompt([0]);
            expect(ids(game.trash)).toEqual(['estate']);

            const { cards } = game.pendingPrompt;
            expect(Math.max(...cards.map(card => card.cost))).toBe(4);
            game.resolvePrompt([cards.findIndex(card => card.id === 'silver')]);
            expect(ids(player.discard)).toContain('silver');
        });
    });

    describe('密偵', () => {
        it('自分、相手の順に山札の一番上を見て、捨て札にするか戻すかを決める', () => {
            play(['SPY']);
            expect(player.actions).toBe(1);

            // 自分の山札（銅貨）は戻す
            expect(game.pendingPrompt.purpose).toBe('spy-self');
            game.resolvePrompt(false);
            expect(player.deck[0].id).toBe('copper');

            // 相手の山札（銀貨）は捨て札にする
            expect(game.pendingPrompt.purpose).toBe('spy-other');
            expect(game.pendingPrompt.card.id).toBe('silver');
            game.resolvePrompt(true);
            expect(ids(opponent.discard)).toEqual(['silver']);
            expect(game.pendingPrompt).toBeNull();
        });
    });

    describe('泥棒', () => {
        it('相手の財宝を廃棄させ、獲得を選べば自分のものにする', () => {
            play(['THIEF']);
            // 相手の山札の上2枚は銀貨と屋敷
            expect(ids(opponent.discard)).toEqual(['estate']);
            expect(game.pendingPrompt.purpose).toBe('thief-gain');

            game.resolvePrompt(true);
            expect(ids(player.discard)).toEqual(['silver']);
            expect(game.trash).toHaveLength(0);
        });

        it('種類の違う財宝が2枚出たら、廃棄させるカードを選ぶ', () => {
            opponent.deck = makeCards(['COPPER', 'GOLD']);
            play(['THIEF']);
            expect(game.pendingPrompt.purpose).toBe('thief-trash');

            const gold = game.pendingPrompt.cards.findIndex(card => card.id === 'gold');
            game.resolvePrompt([gold]);
            game.resolvePrompt(false);
            expect(ids(game.trash)).toEqual(['gold']);
            expect(ids(opponent.discard)).toEqual(['copper']);
        });
    });

    describe('玉座の間', () => {
        it('選んだアクションカードを2回プレイする', () => {
            player.deck = makeCards(Array(8).fill('COPPER'));
            play(['THRONE_ROOM', 'SMITHY']);
            game.resolvePrompt([0]);
            expect(player.hand).toHaveLength(6);
            expect(ids(player.playArea)).toEqual(['throne_room', 'smithy']);
        });

        it('祝宴なら、廃棄は1回だけで2枚獲得する', () => {
            play(['THRONE_ROOM', 'FEAST']);
            game.resolvePrompt([0]);
            game.resolvePrompt([game.pendingPrompt.cards.findIndex(card => card.id === 'silver')]);
            game.resolvePrompt([game.pendingPrompt.cards.findIndex(card => card.id === 'silver')]);
            expect(ids(game.trash)).toEqual(['feast']);
            expect(ids(player.discard).filter(id => id === 'silver')).toHaveLength(2);
        });
    });

    describe('議事堂', () => {
        it('4枚引いて購入+1、相手も1枚引く', () => {
            play(['COUNCIL_ROOM']);
            expect(player.hand).toHaveLength(4);
            expect(player.buys).toBe(2);
            expect(opponent.hand).toHaveLength(6);
        });
    });

    describe('書庫', () => {
        it('手札7枚まで引き、脇に置いたアクションカードは捨て札にする', () => {
            player.deck = makeCards(['VILLAGE', 'COPPER', 'COPPER', 'COPPER', 'COPPER', 'COPPER', 'COPPER', 'COPPER']);
            play(['LIBRARY']);
            expect(game.pendingPrompt.purpose).toBe('library-skip');

            game.resolvePrompt(true);
            expect(player.hand).toHaveLength(7);
            expect(ids(player.hand).every(id => id === 'copper')).toBe(true);
            expect(ids(player.discard)).toEqual(['village']);
        });
    });

    describe('鉱山', () => {
        it('財宝を廃棄して、コストが3多い財宝までを手札に獲得する', () => {
            play(['MINE', 'COPPER', 'ESTATE']);
            game.resolvePrompt([0]);
            const { cards } = game.pendingPrompt;
            expect(cards.every(card => card.isType('treasure') && card.cost <= 3)).toBe(true);

            game.resolvePrompt([cards.findIndex(card => card.id === 'silver')]);
            expect(ids(player.hand).sort()).toEqual(['estate', 'silver']);
        });
    });

    describe('冒険者', () => {
        it('財宝が2枚出るまで公開し、財宝は手札に、それ以外は捨て札にする', () => {
            player.deck = makeCards(['ESTATE', 'COPPER', 'SMITHY', 'SILVER', 'GOLD']);
            play(['ADVENTURER']);
            expect(ids(player.hand)).toEqual(['copper', 'silver']);
            expect(ids(player.discard).sort()).toEqual(['estate', 'smithy']);
            expect(ids(player.deck)).toEqual(['gold']);
        });
    });

    describe('CPUと人間の選択', () => {
        it('CPUの民兵で人間が選ぶときは、CPUが代わりに答えない', () => {
            player.isCPU = true;
            play(['MILITIA']);
            expect(game.pendingPrompt.player).toBe(opponent);
            expect(hasCpuPrompt(game)).toBe(false);

            runCpuStep(game);
            expect(game.pendingPrompt.player).toBe(opponent);
        });
    });
});

describe('全カードでのCPU同士の試合', () => {
    // 25種を3組に分け、どのカードも試合に出るようにする
    const groups = [ALL_KINGDOM.slice(0, 10), ALL_KINGDOM.slice(10, 20), ALL_KINGDOM.slice(15, 25)];

    const playOut = (kingdom) => {
        const game = createGame([{ name: 'CPU1', isCPU: true }, { name: 'CPU2', isCPU: true }], kingdom);
        let steps = 0;
        while (game.phase !== 'end' && steps < 20000) {
            runCpuStep(game);
            steps++;
        }
        return game;
    };

    groups.forEach((kingdom, i) => {
        it(`組${i + 1}（${kingdom.join('・')}）で最後まで進められる`, () => {
            for (let round = 0; round < 15; round++) {
                expect(playOut(kingdom).phase).toBe('end');
            }
        });
    });

    it('全アクションカードを最初からデッキに入れても、すべてプレイして最後まで進められる', () => {
        // CPUは購入戦略にないカードを買わないので、デッキに入れておいて全カードの効果と選択を通す
        const actionIds = KINGDOM_CARD_IDS.filter(id => id !== 'GARDENS');
        const played = new Set();
        
        for (let round = 0; round < 10; round++) {
            const game = createGame([{ name: 'CPU1', isCPU: true }, { name: 'CPU2', isCPU: true }], ALL_KINGDOM);
            game.players.forEach(p => {
                p.deck.push(...makeCards(actionIds));
                p.shuffleDeck();
            });
            const log = game.log.bind(game);
            game.log = (message) => {
                const match = message.match(/は(.+)をプレイしました$/);
                if (match) played.add(match[1]);
                return log(message);
            };
            
            let steps = 0;
            while (game.phase !== 'end' && steps < 30000) {
                runCpuStep(game);
                steps++;
            }
            expect(game.phase).toBe('end');
        }
        
        const names = makeCards(actionIds).map(card => card.name);
        expect(names.filter(name => !played.has(name))).toEqual([]);
    });

    it('ランダムな王国カードで最後まで進められる', () => {
        for (let round = 0; round < 30; round++) {
            const game = createGame([{ name: 'CPU1', isCPU: true }, { name: 'CPU2', isCPU: true }, { name: 'CPU3', isCPU: true }],
                [...ALL_KINGDOM].sort(() => Math.random() - 0.5).slice(0, 10));
            let steps = 0;
            while (game.phase !== 'end' && steps < 30000) {
                runCpuStep(game);
                steps++;
            }
            expect(game.phase).toBe('end');
        }
    });
});
