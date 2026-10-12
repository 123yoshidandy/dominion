import { describe, it, expect, beforeEach } from 'vitest';
import { getKingdomCardIds } from '../public/js/card-data.js';
import { runCpuStep, hasCpuPrompt } from '../public/js/cpu-player.js';
import { createGame, makeCards, seededShuffle } from './helpers.js';

// 基本セットの26種すべてをサプライに入れたいテスト用（サプライの枚数を見るテストで使う）
const BASE_CARD_IDS = getKingdomCardIds(['base']);
const ALL_KINGDOM = BASE_CARD_IDS.map(id => id.toLowerCase());

const ids = (cards) => cards.map(card => card.id);

describe('基本セット第2版の王国カード', () => {
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

    describe('前駆者', () => {
        it('1枚引いてアクション+1、捨て札から選んだカードを山札の上に置く', () => {
            player.discard = makeCards(['ESTATE', 'GOLD']);
            play(['HARBINGER']);
            expect(player.actions).toBe(1);
            expect(game.pendingPrompt.purpose).toBe('harbinger');

            game.resolvePrompt([1]);
            expect(player.deck[0].id).toBe('gold');
            expect(ids(player.discard)).toEqual(['estate']);
        });

        it('選ばなくてもよい', () => {
            player.discard = makeCards(['ESTATE']);
            play(['HARBINGER']);
            expect(game.resolvePrompt([])).toBe(true);
            expect(ids(player.discard)).toEqual(['estate']);
        });
    });

    describe('商人', () => {
        it('最初の銀貨をプレイしたときだけ財宝+1を得る', () => {
            player.deck = makeCards(['SILVER']);
            play(['MERCHANT', 'SILVER', 'COPPER']);
            expect(player.actions).toBe(1);

            game.enterBuyPhase();
            // 銀貨2枚(4) + 銅貨(1) + 商人(1)
            expect(player.coins).toBe(6);
        });

        it('次のターンには効果が残らない', () => {
            play(['MERCHANT']);
            game.endTurn();
            expect(player.merchantBonus).toBe(0);
            expect(player.hasPlayedSilver).toBe(false);
        });
    });

    describe('家臣', () => {
        it('財宝+2を得て、山札の一番上を捨て札にする', () => {
            play(['VASSAL']);
            expect(player.coins).toBe(2);
            expect(ids(player.discard)).toEqual(['copper']);
            expect(game.pendingPrompt).toBeNull();
        });

        it('捨てたのがアクションカードなら、アクションを使わずにプレイできる', () => {
            player.deck = makeCards(['SMITHY', 'COPPER', 'COPPER', 'COPPER']);
            play(['VASSAL']);
            expect(game.pendingPrompt.purpose).toBe('vassal-play');

            game.resolvePrompt(true);
            expect(ids(player.playArea)).toEqual(['vassal', 'smithy']);
            expect(player.hand).toHaveLength(3);
            expect(player.discard).toHaveLength(0);
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
        it('選べば銅貨を1枚廃棄して財宝+3を得る', () => {
            play(['MONEYLENDER', 'COPPER', 'COPPER']);
            expect(game.pendingPrompt.purpose).toBe('moneylender');
            game.resolvePrompt(true);
            expect(player.coins).toBe(3);
            expect(ids(player.hand)).toEqual(['copper']);
            expect(ids(game.trash)).toEqual(['copper']);
        });

        it('廃棄しないこともできる', () => {
            play(['MONEYLENDER', 'COPPER']);
            game.resolvePrompt(false);
            expect(player.coins).toBe(0);
            expect(ids(player.hand)).toEqual(['copper']);
        });

        it('銅貨がなければ何も起きない', () => {
            play(['MONEYLENDER', 'SILVER']);
            expect(player.coins).toBe(0);
            expect(game.trash).toHaveLength(0);
        });
    });

    describe('密猟者', () => {
        it('1枚引いてアクション+1・財宝+1。空のサプライの山がなければ捨てない', () => {
            play(['POACHER', 'ESTATE']);
            expect(player.coins).toBe(1);
            expect(player.actions).toBe(1);
            expect(player.hand).toHaveLength(2);
            expect(game.pendingPrompt).toBeNull();
        });

        it('空のサプライの山1つにつき手札を1枚捨てる', () => {
            game.supply.curse = 0;
            game.supply.smithy = 0;
            play(['POACHER', 'ESTATE', 'SILVER']);
            expect(game.pendingPrompt.min).toBe(2);

            game.resolvePrompt([0, 2]);
            expect(player.hand).toHaveLength(1);
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

    describe('玉座の間', () => {
        it('選んだアクションカードを2回プレイする', () => {
            player.deck = makeCards(Array(8).fill('COPPER'));
            play(['THRONE_ROOM', 'SMITHY']);
            game.resolvePrompt([0]);
            expect(player.hand).toHaveLength(6);
            expect(ids(player.playArea)).toEqual(['throne_room', 'smithy']);
        });

        it('選ばなくてもよい', () => {
            play(['THRONE_ROOM', 'SMITHY']);
            expect(game.resolvePrompt([])).toBe(true);
            expect(ids(player.hand)).toEqual(['smithy']);
        });

        it('職人なら、獲得と山札に置くのを2回ずつ順番に行う', () => {
            play(['THRONE_ROOM', 'ARTISAN', 'ESTATE']);
            game.resolvePrompt([0]);
            const gain = () => game.resolvePrompt([game.pendingPrompt.cards.findIndex(card => card.id === 'silver')]);

            gain();
            expect(game.pendingPrompt.purpose).toBe('artisan-topdeck');
            game.resolvePrompt([ids(player.hand).indexOf('estate')]);
            gain();
            game.resolvePrompt([ids(player.hand).indexOf('silver')]);
            expect(ids(player.deck).slice(0, 2)).toEqual(['silver', 'estate']);
            expect(ids(player.hand)).toEqual(['silver']);
        });
    });

    describe('山賊', () => {
        it('金貨を獲得し、相手は銅貨以外の財宝を廃棄して残りを捨て札にする', () => {
            play(['BANDIT']);
            expect(ids(player.discard)).toEqual(['gold']);
            // 相手の山札の上2枚は銀貨と屋敷
            expect(ids(game.trash)).toEqual(['silver']);
            expect(ids(opponent.discard)).toEqual(['estate']);
        });

        it('銅貨は廃棄しない', () => {
            opponent.deck = makeCards(['COPPER', 'COPPER']);
            play(['BANDIT']);
            expect(game.trash).toHaveLength(0);
            expect(ids(opponent.discard)).toEqual(['copper', 'copper']);
        });

        it('銅貨以外の財宝が2種類出たら、攻撃を受けた側が廃棄するカードを選ぶ', () => {
            opponent.deck = makeCards(['SILVER', 'GOLD']);
            play(['BANDIT']);
            expect(game.pendingPrompt.player).toBe(opponent);
            expect(game.pendingPrompt.purpose).toBe('bandit-trash');

            game.resolvePrompt([0]);
            expect(ids(game.trash)).toEqual(['silver']);
            expect(ids(opponent.discard)).toEqual(['gold']);
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

        it('廃棄しなくてもよい', () => {
            play(['MINE', 'COPPER']);
            expect(game.resolvePrompt([])).toBe(true);
            expect(game.pendingPrompt).toBeNull();
            expect(ids(player.hand)).toEqual(['copper']);
        });
    });

    describe('衛兵', () => {
        it('上2枚を廃棄・捨て札・山札に戻すに振り分ける', () => {
            player.deck = makeCards(['COPPER', 'ESTATE', 'SILVER', 'GOLD']);
            play(['SENTRY']);
            expect(player.actions).toBe(1);
            // 1枚引いた後の上2枚は屋敷と銀貨
            expect(ids(game.pendingPrompt.cards)).toEqual(['estate', 'silver']);

            game.resolvePrompt([0]);
            expect(ids(game.trash)).toEqual(['estate']);
            expect(game.pendingPrompt.purpose).toBe('sentry-discard');
            game.resolvePrompt([]);
            expect(ids(player.deck)).toEqual(['silver', 'gold']);
        });

        it('2枚とも戻すときは、一番上に置くカードを選ぶ', () => {
            player.deck = makeCards(['COPPER', 'ESTATE', 'SILVER']);
            play(['SENTRY']);
            game.resolvePrompt([]);
            game.resolvePrompt([]);
            expect(game.pendingPrompt.purpose).toBe('sentry-top');

            game.resolvePrompt([1]);
            expect(ids(player.deck)).toEqual(['silver', 'estate']);
        });
    });

    describe('職人', () => {
        it('コスト5以下のカードを手札に獲得し、手札のカードを1枚山札の上に置く', () => {
            play(['ARTISAN', 'ESTATE']);
            const { cards } = game.pendingPrompt;
            expect(cards.every(card => card.cost <= 5)).toBe(true);

            game.resolvePrompt([cards.findIndex(card => card.id === 'laboratory')]);
            expect(ids(player.hand)).toEqual(['estate', 'laboratory']);
            expect(game.pendingPrompt.purpose).toBe('artisan-topdeck');

            game.resolvePrompt([0]);
            expect(player.deck[0].id).toBe('estate');
            expect(ids(player.hand)).toEqual(['laboratory']);
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
    // 26種を3組に分け、どのカードも試合に出るようにする
    const groups = [ALL_KINGDOM.slice(0, 10), ALL_KINGDOM.slice(10, 20), ALL_KINGDOM.slice(16, 26)];

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
        const actionIds = BASE_CARD_IDS.filter(id => id !== 'GARDENS');
        const played = new Set();
        
        for (let round = 0; round < 10; round++) {
            const game = createGame([{ name: 'CPU1', isCPU: true }, { name: 'CPU2', isCPU: true }], ALL_KINGDOM, { seed: 800 + round });
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
                seededShuffle(ALL_KINGDOM, 400 + round).slice(0, 10), { seed: 400 + round });
            let steps = 0;
            while (game.phase !== 'end' && steps < 30000) {
                runCpuStep(game);
                steps++;
            }
            expect(game.phase).toBe('end');
        }
    });
});
