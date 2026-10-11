/**
 * ドミニオンのカードデータ
 */

// カードタイプの定義
export const CARD_TYPES = {
    TREASURE: 'treasure',
    VICTORY: 'victory',
    ACTION: 'action',
    CURSE: 'curse'
};

// 基本カードデータ
export const BASIC_CARDS = {
    // 財宝カード
    COPPER: {
        id: 'copper',
        name: '銅貨',
        cost: 0,
        types: [CARD_TYPES.TREASURE],
        value: 1,
        description: '財宝 +1',
        count: 60
    },
    SILVER: {
        id: 'silver',
        name: '銀貨',
        cost: 3,
        types: [CARD_TYPES.TREASURE],
        value: 2,
        description: '財宝 +2',
        count: 40
    },
    GOLD: {
        id: 'gold',
        name: '金貨',
        cost: 6,
        types: [CARD_TYPES.TREASURE],
        value: 3,
        description: '財宝 +3',
        count: 30
    },
    
    // 勝利点カード
    ESTATE: {
        id: 'estate',
        name: '屋敷',
        cost: 2,
        types: [CARD_TYPES.VICTORY],
        points: 1,
        description: '勝利点 +1',
        count: 24
    },
    DUCHY: {
        id: 'duchy',
        name: '公領',
        cost: 5,
        types: [CARD_TYPES.VICTORY],
        points: 3,
        description: '勝利点 +3',
        count: 12
    },
    PROVINCE: {
        id: 'province',
        name: '属州',
        cost: 8,
        types: [CARD_TYPES.VICTORY],
        points: 6,
        description: '勝利点 +6',
        count: 12
    },
    
    // 呪いカード
    CURSE: {
        id: 'curse',
        name: '呪い',
        cost: 0,
        types: [CARD_TYPES.CURSE],
        points: -1,
        description: '勝利点 -1',
        count: 30
    }
};

// 王国カードデータ（基本セット初版の25種）
// onPlay(player, game, card) の中で選択が必要なときは game.promptSelect / promptConfirm / promptGain を使い、
// 続きの処理はそのコールバックに書く。攻撃や繰り返しは game.attackOtherPlayers / game.runNext で手順として積む
const isAction = (card) => card.isType(CARD_TYPES.ACTION);
const isTreasure = (card) => card.isType(CARD_TYPES.TREASURE);

export const KINGDOM_CARDS = {
    // ===== コスト2 =====
    CELLAR: {
        id: 'cellar',
        name: '地下室',
        cost: 2,
        types: [CARD_TYPES.ACTION],
        description: 'アクション +1。任意の枚数のカードを捨て、捨てた枚数分カードを引く',
        count: 10,
        onPlay: (player, game) => {
            player.actions += 1;
            game.log(`${player.name}はアクション+1を得ました`);
            game.promptSelect({
                player,
                cards: player.hand,
                title: '地下室',
                message: '捨てるカードを選んでください。捨てた枚数だけカードを引きます。',
                confirmLabel: '捨てて引く',
                purpose: 'cellar-discard',
                callback: (indices) => {
                    game.discardFromHand(player, indices);
                    player.drawCards(indices.length);
                    game.log(`${player.name}は${indices.length}枚のカードを捨て、${indices.length}枚のカードを引きました`);
                }
            });
        }
    },
    CHAPEL: {
        id: 'chapel',
        name: '礼拝堂',
        cost: 2,
        types: [CARD_TYPES.ACTION],
        description: '手札から最大4枚までのカードを廃棄する',
        count: 10,
        onPlay: (player, game) => {
            game.promptSelect({
                player,
                cards: player.hand,
                max: 4,
                title: '礼拝堂',
                message: '廃棄するカードを選んでください（最大4枚）。',
                confirmLabel: '廃棄する',
                purpose: 'chapel-trash',
                callback: (indices) => {
                    game.trashFromHand(player, indices);
                    game.log(`${player.name}はカードを${indices.length}枚廃棄しました`);
                }
            });
        }
    },
    MOAT: {
        id: 'moat',
        name: 'お堀',
        cost: 2,
        types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。攻撃を受けたとき、手札のこのカードを公開すれば攻撃を受けない',
        isReaction: true,
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(2);
            game.log(`${player.name}はカードを2枚引きました`);
        },
        onReact: (player, game, attacker) => {
            game.log(`${player.name}はお堀を公開し、${attacker.name}の攻撃を防ぎました`);
            return true; // 攻撃を防いだことを示す
        }
    },

    // ===== コスト3 =====
    CHANCELLOR: {
        id: 'chancellor',
        name: '宰相',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: '財宝 +2。山札をすべて捨て札にしてもよい',
        count: 10,
        onPlay: (player, game) => {
            player.coins += 2;
            game.log(`${player.name}は財宝+2を得ました`);
            if (player.deck.length === 0) return;
            
            game.promptConfirm({
                player,
                title: '宰相',
                message: `山札（${player.deck.length}枚）をすべて捨て札にしますか？`,
                yesLabel: '捨て札にする',
                noLabel: 'そのまま',
                purpose: 'chancellor',
                callback: (yes) => {
                    if (!yes) return;
                    player.discard.push(...player.deck);
                    player.deck = [];
                    game.log(`${player.name}は山札をすべて捨て札にしました`);
                }
            });
        }
    },
    VILLAGE: {
        id: 'village',
        name: '村',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +2',
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(1);
            player.actions += 2;
            game.log(`${player.name}はカードを1枚引き、アクション+2を得ました`);
        }
    },
    WOODCUTTER: {
        id: 'woodcutter',
        name: '木こり',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: '購入 +1。財宝 +2',
        count: 10,
        onPlay: (player, game) => {
            player.buys += 1;
            player.coins += 2;
            game.log(`${player.name}は購入+1、財宝+2を得ました`);
        }
    },
    WORKSHOP: {
        id: 'workshop',
        name: '工房',
        cost: 3,
        types: [CARD_TYPES.ACTION],
        description: 'コスト4以下のカードを1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            game.promptGain({
                player,
                maxCost: 4,
                title: '工房',
                message: 'コスト4以下のカードを1枚獲得してください。'
            });
        }
    },

    // ===== コスト4 =====
    BUREAUCRAT: {
        id: 'bureaucrat',
        name: '役人',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: '銀貨を1枚獲得し、山札の上に置く。他のプレイヤーは手札の勝利点カードを1枚、山札の上に置く（なければ手札を公開する）',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            if (game.gainCardFromSupply(player, 'silver', 'deck')) {
                game.log(`${player.name}は銀貨を獲得し、山札の上に置きました`);
            }
            game.attackOtherPlayers(player, (target) => {
                const index = target.hand.findIndex(card => card.isType(CARD_TYPES.VICTORY));
                if (index < 0) {
                    game.log(`${target.name}は手札を公開しました（勝利点カードはありません）`);
                    return;
                }
                const [card] = target.hand.splice(index, 1);
                target.deck.unshift(card);
                game.log(`${target.name}は${card.name}を公開し、山札の上に置きました`);
            });
        }
    },
    FEAST: {
        id: 'feast',
        name: '祝宴',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: 'このカードを廃棄する。コスト5以下のカードを1枚獲得する',
        count: 10,
        onPlay: (player, game, card) => {
            // 玉座の間で2回目にプレイしたときは、すでに廃棄済みなので獲得だけ行う
            const index = player.playArea.indexOf(card);
            if (index >= 0) {
                player.playArea.splice(index, 1);
                game.trash.push(card);
                game.log(`${player.name}は祝宴を廃棄しました`);
            }
            game.promptGain({
                player,
                maxCost: 5,
                title: '祝宴',
                message: 'コスト5以下のカードを1枚獲得してください。'
            });
        }
    },
    GARDENS: {
        id: 'gardens',
        name: '庭園',
        cost: 4,
        types: [CARD_TYPES.VICTORY],
        description: 'デッキのカード10枚につき勝利点 +1（端数切り捨て）',
        pointsFor: (allCards) => Math.floor(allCards.length / 10)
    },
    MILITIA: {
        id: 'militia',
        name: '民兵',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: '財宝 +2。他のプレイヤーは手札が3枚になるまで捨てる',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            player.coins += 2;
            game.log(`${player.name}は財宝+2を得ました`);
            game.attackOtherPlayers(player, (target) => {
                const discardCount = target.hand.length - 3;
                if (discardCount <= 0) return;
                
                game.promptSelect({
                    player: target,
                    cards: target.hand,
                    min: discardCount,
                    max: discardCount,
                    title: '民兵',
                    message: `手札が3枚になるように、捨てるカードを${discardCount}枚選んでください。`,
                    confirmLabel: '捨てる',
                    purpose: 'discard-down',
                    callback: (indices) => {
                        game.discardFromHand(target, indices);
                        game.log(`${target.name}は手札を${indices.length}枚捨てました`);
                    }
                });
            });
        }
    },
    MONEYLENDER: {
        id: 'moneylender',
        name: '金貸し',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: '手札の銅貨を1枚廃棄する。廃棄したら財宝 +3',
        count: 10,
        onPlay: (player, game) => {
            const index = player.hand.findIndex(card => card.id === 'copper');
            if (index < 0) {
                game.log(`${player.name}の手札に銅貨がありませんでした`);
                return;
            }
            game.trashFromHand(player, [index]);
            player.coins += 3;
            game.log(`${player.name}は銅貨を廃棄し、財宝+3を得ました`);
        }
    },
    REMODEL: {
        id: 'remodel',
        name: '改築',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: '手札のカードを1枚廃棄する。廃棄したカードよりコストが最大2多いカードを1枚獲得する',
        count: 10,
        onPlay: (player, game) => {
            if (player.hand.length === 0) {
                game.log(`${player.name}の手札にカードがありませんでした`);
                return;
            }
            game.promptSelect({
                player,
                cards: player.hand,
                min: 1,
                max: 1,
                title: '改築',
                message: '廃棄するカードを1枚選んでください。',
                confirmLabel: '廃棄する',
                purpose: 'remodel-trash',
                callback: ([index]) => {
                    const [trashed] = game.trashFromHand(player, [index]);
                    game.log(`${player.name}は${trashed.name}を廃棄しました`);
                    game.promptGain({
                        player,
                        maxCost: trashed.cost + 2,
                        title: '改築',
                        message: `コスト${trashed.cost + 2}以下のカードを1枚獲得してください。`
                    });
                }
            });
        }
    },
    SMITHY: {
        id: 'smithy',
        name: '鍛冶屋',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: 'カードを3枚引く',
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(3);
            game.log(`${player.name}はカードを3枚引きました`);
        }
    },
    SPY: {
        id: 'spy',
        name: '密偵',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。各プレイヤー（自分も含む）は山札の一番上を公開し、あなたが捨て札にするか戻すかを決める',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(1);
            player.actions += 1;
            game.log(`${player.name}はカードを1枚引き、アクション+1を得ました`);
            
            const revealTop = (target) => {
                const card = target.takeTopCard();
                if (!card) {
                    game.log(`${target.name}の山札にはカードがありませんでした`);
                    return;
                }
                game.log(`${target.name}の山札の一番上は${card.name}でした`);
                game.promptConfirm({
                    player,
                    card,
                    title: '密偵',
                    message: `${target.name}の山札の一番上は${card.name}です。捨て札にしますか？`,
                    yesLabel: '捨て札にする',
                    noLabel: '山札に戻す',
                    purpose: target === player ? 'spy-self' : 'spy-other',
                    callback: (discard) => {
                        if (discard) {
                            target.discard.push(card);
                            game.log(`${target.name}の${card.name}は捨て札になりました`);
                        } else {
                            target.deck.unshift(card);
                            game.log(`${target.name}の${card.name}は山札に戻されました`);
                        }
                    }
                });
            };
            
            // 自分の山札を先に見てから、他のプレイヤー（お堀で防げる）を席順に見る
            game.runNext(
                () => revealTop(player),
                ...game.getOtherPlayers(player).map(target => () => {
                    if (!game.isProtectedFromAttack(target, player)) {
                        revealTop(target);
                    }
                })
            );
        }
    },
    THIEF: {
        id: 'thief',
        name: '泥棒',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: '他のプレイヤーは山札の上から2枚を公開する。その中の財宝1枚をあなたが選んで廃棄させ、廃棄したカードを獲得してもよい。残りは捨て札にする',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            game.attackOtherPlayers(player, (target) => {
                const revealed = [target.takeTopCard(), target.takeTopCard()].filter(Boolean);
                if (revealed.length === 0) {
                    game.log(`${target.name}の山札にはカードがありませんでした`);
                    return;
                }
                game.log(`${target.name}は${revealed.map(card => card.name).join('と')}を公開しました`);
                
                const treasures = revealed.filter(isTreasure);
                const discardOthers = (stolen) => {
                    revealed.filter(card => card !== stolen).forEach(card => target.discard.push(card));
                };
                
                if (treasures.length === 0) {
                    discardOthers(null);
                    return;
                }
                
                // 選んだ財宝を廃棄し、獲得するかを決めさせる
                const steal = (stolen) => {
                    discardOthers(stolen);
                    game.trash.push(stolen);
                    game.log(`${target.name}の${stolen.name}を廃棄しました`);
                    game.promptConfirm({
                        player,
                        card: stolen,
                        title: '泥棒',
                        message: `廃棄した${stolen.name}を獲得しますか？`,
                        yesLabel: '獲得する',
                        noLabel: '獲得しない',
                        purpose: 'thief-gain',
                        callback: (gain) => {
                            if (!gain) return;
                            game.trash.splice(game.trash.indexOf(stolen), 1);
                            player.discard.push(stolen);
                            game.log(`${player.name}は${stolen.name}を獲得しました`);
                        }
                    });
                };
                
                if (treasures.length === 1 || treasures[0].id === treasures[1].id) {
                    steal(treasures[0]);
                    return;
                }
                game.promptSelect({
                    player,
                    cards: treasures,
                    min: 1,
                    max: 1,
                    title: '泥棒',
                    message: `${target.name}の財宝から、廃棄させるカードを選んでください。`,
                    confirmLabel: '廃棄させる',
                    purpose: 'thief-trash',
                    callback: ([index]) => steal(treasures[index])
                });
            });
        }
    },
    THRONE_ROOM: {
        id: 'throne_room',
        name: '玉座の間',
        cost: 4,
        types: [CARD_TYPES.ACTION],
        description: '手札のアクションカードを1枚選び、2回プレイする',
        count: 10,
        onPlay: (player, game) => {
            const actionCards = player.hand.filter(isAction);
            if (actionCards.length === 0) {
                game.log(`${player.name}の手札にアクションカードがありませんでした`);
                return;
            }
            game.promptSelect({
                player,
                cards: actionCards,
                min: 1,
                max: 1,
                title: '玉座の間',
                message: '2回プレイするアクションカードを選んでください。',
                confirmLabel: '2回プレイする',
                purpose: 'throne-room',
                callback: ([index]) => {
                    const chosen = actionCards[index];
                    player.hand.splice(player.hand.indexOf(chosen), 1);
                    player.playArea.push(chosen);
                    game.log(`${player.name}は玉座の間で${chosen.name}を2回プレイします`);
                    game.runNext(
                        () => chosen.play(player, game),
                        () => {
                            game.log(`${player.name}は${chosen.name}をもう一度プレイしました`);
                            chosen.play(player, game);
                        }
                    );
                }
            });
        }
    },

    // ===== コスト5 =====
    COUNCIL_ROOM: {
        id: 'council_room',
        name: '議事堂',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを4枚引く。購入 +1。他のプレイヤーはカードを1枚引く',
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(4);
            player.buys += 1;
            game.log(`${player.name}はカードを4枚引き、購入+1を得ました`);
            game.getOtherPlayers(player).forEach(other => {
                other.drawCards(1);
                game.log(`${other.name}はカードを1枚引きました`);
            });
        }
    },
    FESTIVAL: {
        id: 'festival',
        name: '祝祭',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'アクション +2。購入 +1。財宝 +2',
        count: 10,
        onPlay: (player, game) => {
            player.actions += 2;
            player.buys += 1;
            player.coins += 2;
            game.log(`${player.name}はアクション+2、購入+1、財宝+2を得ました`);
        }
    },
    LABORATORY: {
        id: 'laboratory',
        name: '研究所',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。アクション +1',
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(2);
            player.actions += 1;
            game.log(`${player.name}はカードを2枚引き、アクション+1を得ました`);
        }
    },
    LIBRARY: {
        id: 'library',
        name: '書庫',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: '手札が7枚になるまでカードを引く。引いたアクションカードは脇に置いてもよく、最後に捨て札にする',
        count: 10,
        onPlay: (player, game) => {
            const setAside = [];
            
            const finish = () => {
                if (setAside.length > 0) {
                    player.discard.push(...setAside);
                    game.log(`${player.name}は脇に置いた${setAside.map(card => card.name).join('・')}を捨て札にしました`);
                }
                game.log(`${player.name}は手札が${player.hand.length}枚になるまで引きました`);
            };
            
            // 1枚ずつ引き、アクションカードなら脇に置くかを決めてから次を引く
            const drawStep = () => {
                if (player.hand.length >= 7) return finish();
                const card = player.takeTopCard();
                if (!card) return finish();
                
                if (!isAction(card)) {
                    player.hand.push(card);
                    game.runNext(drawStep);
                    return;
                }
                game.promptConfirm({
                    player,
                    card,
                    title: '書庫',
                    message: `${card.name}を引きました。脇に置きますか？（脇に置くと手札に加えず、代わりに次のカードを引きます）`,
                    yesLabel: '脇に置く',
                    noLabel: '手札に加える',
                    purpose: 'library-skip',
                    callback: (skip) => {
                        if (skip) {
                            setAside.push(card);
                        } else {
                            player.hand.push(card);
                        }
                        game.runNext(drawStep);
                    }
                });
            };
            
            game.runNext(drawStep);
        }
    },
    MARKET: {
        id: 'market',
        name: '市場',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを1枚引く。アクション +1。購入 +1。財宝 +1',
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(1);
            player.actions += 1;
            player.buys += 1;
            player.coins += 1;
            game.log(`${player.name}はカードを1枚引き、アクション+1、購入+1、財宝+1を得ました`);
        }
    },
    MINE: {
        id: 'mine',
        name: '鉱山',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: '手札の財宝を1枚廃棄する。廃棄した財宝よりコストが最大3多い財宝を1枚獲得し、手札に加える',
        count: 10,
        onPlay: (player, game) => {
            const treasures = player.hand.filter(isTreasure);
            if (treasures.length === 0) {
                game.log(`${player.name}の手札に財宝がありませんでした`);
                return;
            }
            game.promptSelect({
                player,
                cards: treasures,
                min: 1,
                max: 1,
                title: '鉱山',
                message: '廃棄する財宝を1枚選んでください。',
                confirmLabel: '廃棄する',
                purpose: 'mine-trash',
                callback: ([index]) => {
                    const trashed = treasures[index];
                    game.trashFromHand(player, [player.hand.indexOf(trashed)]);
                    game.log(`${player.name}は${trashed.name}を廃棄しました`);
                    game.promptGain({
                        player,
                        maxCost: trashed.cost + 3,
                        filter: (data) => data.types.includes(CARD_TYPES.TREASURE),
                        destination: 'hand',
                        title: '鉱山',
                        message: `コスト${trashed.cost + 3}以下の財宝を1枚選んでください。手札に加えます。`
                    });
                }
            });
        }
    },
    WITCH: {
        id: 'witch',
        name: '魔女',
        cost: 5,
        types: [CARD_TYPES.ACTION],
        description: 'カードを2枚引く。他のプレイヤーは呪いカードを1枚獲得する',
        isAttack: true,
        count: 10,
        onPlay: (player, game) => {
            player.drawCards(2);
            game.log(`${player.name}はカードを2枚引きました`);
            game.attackOtherPlayers(player, (target) => {
                if (game.gainCardFromSupply(target, BASIC_CARDS.CURSE.id)) {
                    game.log(`${target.name}は呪いカードを獲得しました`);
                } else {
                    game.log(`呪いカードの山札がないため、${target.name}は呪いカードを獲得しませんでした`);
                }
            });
        }
    },

    // ===== コスト6 =====
    ADVENTURER: {
        id: 'adventurer',
        name: '冒険者',
        cost: 6,
        types: [CARD_TYPES.ACTION],
        description: '財宝が2枚出るまで山札を公開し、その財宝を手札に加える。他の公開したカードは捨て札にする',
        count: 10,
        onPlay: (player, game) => {
            const found = [];
            const others = [];
            while (found.length < 2) {
                const card = player.takeTopCard();
                if (!card) break;
                (isTreasure(card) ? found : others).push(card);
            }
            player.hand.push(...found);
            player.discard.push(...others);
            game.log(found.length > 0
                ? `${player.name}は${found.map(card => card.name).join('と')}を手札に加えました`
                : `${player.name}は財宝を見つけられませんでした`);
        }
    }
};

// 全カードデータの結合
export const ALL_CARDS = { ...BASIC_CARDS, ...KINGDOM_CARDS };

// カードIDの配列を生成
export const ALL_CARD_IDS = Object.keys(ALL_CARDS);
export const BASIC_CARD_IDS = Object.keys(BASIC_CARDS);
export const KINGDOM_CARD_IDS = Object.keys(KINGDOM_CARDS);