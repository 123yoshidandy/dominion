import { describe, it, expect, beforeEach } from 'vitest';
import { createGameView } from '../public/js/game-view.js';
import { createGame, makeCards } from './helpers.js';

const ids = (cards) => cards.map(card => card.id);
const indexIn = (cards, id) => cards.findIndex(card => card.id === id);
const KINGDOM = ['border_guard', 'lackeys', 'experiment', 'flag_bearer', 'patron', 'priest', 'silk_merchant', 'swashbuckler', 'treasurer', 'smithy'];

describe('ルネサンス', () => {
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

    const passTurns = () => {
        game.endTurn();
        game.endTurn();
    };

    // プロジェクトをゲームの札に加え、キューブを置いた状態にする
    const own = (id) => {
        if (!game.landscapes.includes(id)) game.landscapes.push(id);
        player.projects.add(id);
    };

    beforeEach(() => setupGame());

    describe('村人とアーティファクト', () => {
        it('村人はアクションフェーズに使うとアクション+1', () => {
            player.villagers = 2;
            expect(game.applyCommand(player.id, { type: 'villager', amount: 1 })).toBe(true);
            expect(player.actions).toBe(2);
            expect(player.villagers).toBe(1);
            expect(game.applyCommand(player.id, { type: 'villager', amount: 5 })).toBe(false);
            expect(createGameView(game, player.id).players[player.id].villagers).toBe(1);
        });

        it('従僕を獲得すると村人+2、劇団は村人+4して廃棄する', () => {
            game.gainCardFromSupply(player, 'lackeys');
            game.processEffects();
            expect(player.villagers).toBe(2);
            play(['ACTING_TROUPE']);
            expect(player.villagers).toBe(6);
            expect(ids(game.trash)).toEqual(['acting_troupe']);
        });

        it('旗手を獲得すると旗を受け取り、手札を1枚多く引く', () => {
            expect(game.artifacts).toHaveProperty('flag', null);
            game.gainCardFromSupply(player, 'flag_bearer');
            game.processEffects();
            expect(game.hasArtifact(player, 'flag')).toBe(true);
            game.endTurn();
            expect(player.hand).toHaveLength(6);
            expect(createGameView(game, 0).artifacts.flag).toBe(player.id);
        });

        it('国境警備隊は2枚とも公開したアクションならランタンか角笛を受け取る。ランタンなら3枚公開する', () => {
            player.deck = makeCards(['SMITHY', 'PATRON', 'COPPER', 'COPPER']);
            play(['BORDER_GUARD']);
            game.resolvePrompt([0]);
            expect(ids(player.hand)).toEqual(['smithy']);
            expect(player.coffers).toBe(1); // 公開された後援者で財源+1
            game.resolvePrompt([0]);
            expect(game.hasArtifact(player, 'lantern')).toBe(true);
            player.deck = makeCards(['SMITHY', 'SMITHY', 'COPPER']);
            player.actions = 1;
            player.hand = makeCards(['BORDER_GUARD']);
            game.playActionCard(0);
            expect(game.pendingPrompt.cards).toHaveLength(3);
        });

        it('角笛を持っていれば、場から捨て札にするとき国境警備隊を山札の上に置ける', () => {
            game.takeArtifact(player, 'horn');
            play(['BORDER_GUARD']);
            game.resolvePrompt([0]);
            game.enterBuyPhase();
            game.endTurn();
            expect(game.pendingPrompt.purpose).toBe('horn');
            game.resolvePrompt(true);
            expect(ids(player.hand)).toContain('border_guard');
        });

        it('剣客は財源が4以上になると宝箱を受け取り、宝箱で購入フェーズの開始時に金貨を獲得する', () => {
            player.coffers = 3;
            player.discard = makeCards(['COPPER']);
            play(['SWASHBUCKLER']);
            expect(game.hasArtifact(player, 'treasure_chest')).toBe(true);
            game.enterBuyPhase();
            expect(ids(player.discard)).toContain('gold');
        });

        it('会計係で鍵を受け取ると、ターンの開始時に財宝+1', () => {
            play(['TREASURER']);
            game.resolvePrompt([2]);
            expect(player.coins).toBe(3);
            passTurns();
            expect(player.coins).toBe(1);
        });
    });

    describe('カード', () => {
        it('実験を獲得するともう1枚獲得し、プレイするとサプライに戻る', () => {
            game.gainCardFromSupply(player, 'experiment');
            game.processEffects();
            expect(ids(player.discard)).toEqual(['experiment', 'experiment']);
            play(['EXPERIMENT']);
            expect(game.supply.experiment).toBe(9);
            expect(player.actions).toBe(1);
        });

        it('司祭のあと、このターンにカードを廃棄するたびに財宝+2', () => {
            play(['PRIEST', 'ESTATE', 'CURSE']);
            game.resolvePrompt([0]);
            expect(player.coins).toBe(2);
            game.trashCard(player, game.trash.pop());
            expect(player.coins).toBe(4);
        });

        it('絹商人は獲得したときと廃棄したとき、財源+1と村人+1', () => {
            game.gainCardFromSupply(player, 'silk_merchant');
            game.processEffects();
            expect([player.coffers, player.villagers]).toEqual([1, 1]);
        });

        it('貨物船は獲得したカードを脇に置き、次のターンに手札に加える', () => {
            setupGame([], ['cargo_ship', ...KINGDOM.slice(1)]);
            play(['CARGO_SHIP']);
            game.enterBuyPhase();
            game.buyCard('copper');
            expect(game.pendingPrompt.purpose).toBe('cargo-ship');
            game.resolvePrompt(true);
            expect(ids(player.setAside)).toEqual(['copper']);
            passTurns();
            expect(player.hand).toHaveLength(6);
            expect(player.coins).toBe(0);
        });

        it('改善はクリーンアップの開始時に、場のアクションを廃棄してコストが1多いカードを獲得できる', () => {
            setupGame([], ['improve', ...KINGDOM.slice(1)]);
            play(['IMPROVE']);
            game.enterBuyPhase();
            game.endTurn();
            expect(game.pendingPrompt.purpose).toBe('improve');
            game.resolvePrompt([0]);
            expect(game.pendingPrompt.cards.every(card => card.cost === 4)).toBe(true);
        });

        it('隠れ家で勝利点カードを廃棄すると呪いを獲得する', () => {
            play(['HIDEOUT', 'ESTATE']);
            game.resolvePrompt([0]);
            expect(ids(player.discard)).toEqual(['curse']);
        });

        it('発明家のあと、このターンのコストが1少なくなる', () => {
            play(['INVENTOR']);
            game.resolvePrompt([0]);
            expect(game.getCost('smithy')).toBe(3);
        });

        it('笏は場のアクションをもう一度プレイできる', () => {
            play(['SMITHY']);
            player.hand = makeCards(['SCEPTER']);
            game.enterBuyPhase();
            game.resolvePrompt([1]);
            game.resolvePrompt([0]);
            // 笏をプレイして手札は0枚、鍛冶屋をもう一度プレイして3枚
            expect(player.hand).toHaveLength(3);
        });

        it('悪党は手札が5枚以上の他のプレイヤーに、コスト2以上のカードを捨てさせる', () => {
            play(['VILLAIN']);
            expect(player.coffers).toBe(2);
            game.resolvePrompt([0]);
            expect(opponent.hand).toHaveLength(4);
        });

        it('老魔女は他のプレイヤーに呪いを獲得させ、手札の呪いを廃棄させてよい', () => {
            opponent.hand = makeCards(['CURSE', 'COPPER']);
            play(['OLD_WITCH']);
            game.resolvePrompt([0]);
            expect(ids(game.trash)).toEqual(['curse']);
            expect(ids(opponent.discard)).toEqual(['curse']);
        });

        it('ドゥカート金貨は財源+1と購入+1、香辛料は獲得すると財源+2', () => {
            setupGame([], ['spices', ...KINGDOM.slice(1)]);
            player.hand = makeCards(['DUCAT']);
            game.enterBuyPhase();
            expect([player.coffers, player.buys]).toEqual([1, 2]);
            game.gainCardFromSupply(player, 'spices');
            game.processEffects();
            expect(player.coffers).toBe(3);
        });
    });

    describe('プロジェクト', () => {
        it('プロジェクトは1人1回だけ購入でき、キューブを置く', () => {
            setupGame(['fair']);
            player.hand = makeCards(['GOLD', 'GOLD']);
            game.enterBuyPhase();
            player.buys = 2;
            expect(game.buyLandscape('fair')).toBe(true);
            expect(player.projects.has('fair')).toBe(true);
            expect(game.buyLandscape('fair')).toBe(false);
            passTurns();
            expect(player.buys).toBe(2);
        });

        it('ターンの開始時のプロジェクト', () => {
            own('barracks');
            own('cathedral');
            passTurns();
            expect(player.actions).toBe(2);
            expect(game.pendingPrompt.purpose).toBe('cathedral-trash');
            game.resolvePrompt([0]);

            setupGame();
            own('city_gate');
            passTurns();
            expect(player.hand).toHaveLength(6);
            game.resolvePrompt([0]);
            expect(player.hand).toHaveLength(5);

            setupGame();
            own('silos');
            passTurns();
            const coppers = game.pendingPrompt.cards.length;
            game.resolvePrompt(game.pendingPrompt.cards.map((card, i) => i));
            expect(player.hand).toHaveLength(5);
            expect(coppers).toBeGreaterThan(0);

            setupGame();
            own('sinister_plot');
            passTurns();
            game.resolvePrompt([0]);
            passTurns();
            game.resolvePrompt([1]);
            expect(player.hand).toHaveLength(6);

            setupGame();
            own('piazza');
            player.deck = makeCards(['COPPER', 'COPPER', 'COPPER', 'COPPER', 'COPPER', 'SMITHY', 'COPPER', 'COPPER', 'COPPER']);
            game.endTurn();
            game.endTurn();
            expect(ids(player.playArea)).toContain('smithy');

            setupGame();
            own('crop_rotation');
            player.deck = makeCards(['ESTATE', 'COPPER', 'COPPER', 'COPPER', 'COPPER', ...Array(5).fill('COPPER')]);
            game.endTurn();
            game.endTurn();
            game.resolvePrompt([0]);
            expect(player.hand).toHaveLength(6);
        });

        it('獲得・廃棄のプロジェクト（アカデミー・ギルドホール・下水道・道路網・革新）', () => {
            own('academy');
            own('guildhall');
            game.gainCardFromSupply(player, 'smithy');
            game.gainCardFromSupply(player, 'silver');
            game.processEffects();
            expect([player.villagers, player.coffers]).toEqual([1, 1]);

            game.landscapes.push('road_network');
            opponent.projects.add('road_network');
            const before = opponent.hand.length;
            game.gainCardFromSupply(player, 'estate');
            game.processEffects();
            expect(opponent.hand).toHaveLength(before + 1);

            setupGame();
            own('sewers');
            player.hand = makeCards(['ESTATE', 'CURSE']);
            game.trashFromHand(player, [0]);
            game.processEffects();
            expect(game.pendingPrompt.purpose).toBe('optional-trash');
            game.resolvePrompt([0]);
            expect(ids(game.trash)).toEqual(['estate', 'curse']);

            setupGame();
            own('innovation');
            player.hand = makeCards(['GOLD', 'GOLD']);
            game.enterBuyPhase();
            game.buyCard('smithy');
            expect(game.pendingPrompt.purpose).toBe('innovation');
            game.resolvePrompt(true);
            expect(player.hand).toHaveLength(3);
        });

        it('購入フェーズの終わりのプロジェクト（探検・野外劇）', () => {
            own('exploration');
            own('pageant');
            player.hand = makeCards(['COPPER']);
            game.enterBuyPhase();
            game.endTurn();
            expect(game.pendingPrompt.purpose).toBe('pageant');
            game.resolvePrompt(true);
            expect([player.coffers, player.villagers]).toEqual([2, 1]);
        });

        it('運河・資本主義・城塞・星図・艦隊', () => {
            own('canal');
            expect(game.getCost('smithy')).toBe(3);

            own('capitalism');
            player.hand = makeCards(['PATRON']);
            game.enterBuyPhase();
            expect(player.coins).toBe(2); // 後援者（財宝 +2）は財宝としてプレイされる

            setupGame();
            own('citadel');
            play(['SMITHY']);
            expect(player.hand).toHaveLength(6);

            setupGame();
            own('star_chart');
            player.deck = [];
            player.discard = makeCards(['COPPER', 'COPPER', 'GOLD', 'ESTATE']);
            player.drawCards(1);
            expect(ids(player.hand).at(-1)).toBe('gold');

            setupGame();
            player.projects.add('fleet');
            game.supply.province = 0;
            game.endTurn();
            expect(game.phase).not.toBe('end');
            expect(game.getCurrentPlayer()).toBe(player);
            game.endTurn();
            expect(game.phase).toBe('end');
        });
    });
});
