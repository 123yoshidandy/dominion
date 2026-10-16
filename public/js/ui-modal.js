/**
 * ドミニオンのUIモーダルダイアログ管理
 * ゲーム内のモーダルダイアログ表示を担当
 */

import { loadOnlineSession } from './online-controller.js';
import NetplayClient from './netplay/netplay-client.mjs';
import { CARD_SETS, CARD_SET_LABELS, LANDSCAPE_KIND_LABELS } from './card-types.js';
import { ALL_CARDS } from './card-data.js';
import { getCardArt, CARD_BACK } from './card-art.js';

// 使うカードのセットの表示名（「基本・海辺」のように並べる）
const cardSetLabel = (sets) => Object.values(CARD_SETS).filter(set => sets.includes(set)).map(set => CARD_SET_LABELS[set]).join('・');

// プルダウンの見出しに出す、選んでいるセットの要約
const cardSetSummary = (sets) => {
    const all = Object.values(CARD_SETS);
    if (all.every(set => sets.includes(set))) return `すべて（${all.length}セット）`;
    if (sets.length === 1 && sets[0] === CARD_SETS.BASE) return '基本のみ';
    return cardSetLabel(sets);
};

// 拡張を選ぶ画面に出す、各セットの難しさ（★1〜3）と、そのセットならではのルールの説明
const CARD_SET_INFO = {
    base: { level: 1, text: '最初の1セット。特別なルールはなく、ドミニオンの基本だけで遊べる' },
    intrigue: { level: 1, text: '選択肢から選ぶカードや、勝利点とアクションを兼ねるカード。新しいルールはほとんどない' },
    seaside: { level: 2, text: '持続カード：次のターンの開始時まで場に残り、もう一度効果がある。島などのマットも使う' },
    prosperity: { level: 2, text: '白金貨と植民地で、大きな額の長めのゲームになる。勝利点トークン、効果のある財宝' },
    hinterlands: { level: 2, text: '獲得したとき・捨て札にしたときなど、プレイ以外のときに起きる効果が多い' },
    cornucopia_guilds: { level: 2, text: '財源（あとで使えるコイン）、超過支払い（多く払うと追加の効果）、褒賞、いろいろなカードを集めると得なカード' },
    alchemy: { level: 2, text: 'コストにポーションが必要なカード。ポーションを買ってから強いカードを狙う' },
    dark_ages: { level: 3, text: '廃棄がテーマ。廃墟・避難所・騎士・略奪品など、決まった中身の山やサプライ外のカードが多い' },
    adventures: { level: 3, text: 'イベント（購入する効果）、酒場マットに置いて後で呼び出すカード、山に置くトークン、上位のカードに変わるトラベラー' },
    empires: { level: 3, text: '負債（あとで返すコスト）、勝利点トークン、得点や獲得に効くランドマーク、2種で1山のカード' },
    nocturne: { level: 3, text: '購入の後の夜フェイズ、ランダムに受ける祝福と呪詛、初期デッキに入る家宝' },
    renaissance: { level: 2, text: '村人（あとで使えるアクション）、1人1回キューブを置くプロジェクト、持ち主が移るアーティファクト' },
    menagerie: { level: 3, text: '追放マット、馬、アクションの代わりに使える習性、イベント' },
    allies: { level: 3, text: '連絡役で恩恵トークンを集めて同盟の効果を使う。4種で1山の山は「回す」と一番上が変わる' }
};

// 利用者が入力した文字をそのまま HTML に入れないようにする
const escapeHtml = (text) => String(text).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

class UIModal {
    constructor(uiController) {
        this.uiController = uiController;
        this.elements = uiController.elements;
        this.kind = null; // 開いている画面の種類（'online-menu' / 'lobby' など）
    }

    // カードのHTML生成は画面表示と共通にする
    get view() {
        return this.uiController.view;
    }

    // ゲームの初期化画面を表示
    showGameSetup() {
        // タイトル画面（左にタイトルと絵、右に設定）として全画面に表示する
        this.elements.modalTitle.textContent = '';
        const cardSets = this.uiController.settings.cardSets.split('+');

        const setupHtml = `
            <div class="title-screen">
                ${this.createTitleHeroHtml()}
                <div class="setup-form title-panel">
                    <div class="setup-row">
                        <label class="field player-count-field">
                            <span>人数</span>
                            <select id="player-count">
                                ${[2, 3, 4].map(count => `<option value="${count}" ${this.uiController.settings.playerCount === count ? 'selected' : ''}>${count}人</option>`).join('')}
                            </select>
                        </label>
                        ${this.createCardSetButtonHtml('card-sets-btn', cardSets)}
                    </div>

                    <div id="player-names"></div>

                    ${this.createStackHandToggleHtml('setup-stack-hand')}

                    <div class="title-buttons">
                        <button id="start-game-btn" class="primary">ゲーム開始</button>
                        <button id="online-btn" class="primary online">オンラインで遊ぶ</button>
                    </div>
                </div>
            </div>
        `;

        this.elements.modalBody.innerHTML = setupHtml;
        this.updatePlayerNameInputs(this.uiController.settings.playerCount);

        // プレイヤー数を変えたら入力欄を作り直し、人数を保存する
        const playerCountSelect = document.getElementById('player-count');
        playerCountSelect.addEventListener('change', () => {
            const count = parseInt(playerCountSelect.value);
            this.updatePlayerNameInputs(count);
            this.uiController.updateSettings({ playerCount: count });
        });

        this.setupStackHandToggle('setup-stack-hand');

        // 拡張は別の画面で選び、決定したらタイトル画面に戻る
        document.getElementById('card-sets-btn').addEventListener('click', () => this.showCardSetPicker({
            selected: cardSets,
            backdrop: 'title',
            onDone: (sets) => {
                this.uiController.updateSettings({ cardSets: sets.join('+') });
                this.showGameSetup();
            }
        }));

        document.getElementById('start-game-btn').addEventListener('click', () => this.uiController.startGame());
        document.getElementById('online-btn').addEventListener('click', () => this.showOnlineMenu());
        document.getElementById('title-help-btn').addEventListener('click', () => this.showHelp({ backdrop: 'title', onClose: () => this.showGameSetup() }));

        // モーダルを表示（閉じると何も操作できなくなるので×は出さない）
        this.openModal({ closable: false, kind: 'setup' });
    }

    // タイトル画面の左側：タイトルと、扇形に広げたカード（既存のカードのイラストを使う）
    createTitleHeroHtml() {
        const cards = ['village', 'gold', 'province'].map((id, index) => `
            <div class="title-card title-card-${index}">
                <span class="title-card-name">${ALL_CARDS[id.toUpperCase()].name}</span>
                <span class="title-card-art">${getCardArt(id)}</span>
            </div>
        `).join('');
        return `
            <div class="title-hero">
                <div class="title-cards" aria-hidden="true">
                    <div class="title-card title-card-back">${CARD_BACK}</div>
                    ${cards}
                </div>
                <h1 class="title-logo">DOMINION</h1>
                <p class="title-sub">デッキ構築型カードゲーム</p>
                <button id="title-help-btn" class="title-help-btn">？ 遊び方</button>
            </div>
        `;
    }

    // 使う拡張を表示し、押すと選ぶ画面を開くボタン（タイトル画面とロビーで共通）
    createCardSetButtonHtml(id, selected) {
        return `
            <div class="field card-set-field">
                <span>拡張</span>
                <button type="button" id="${id}" class="card-set-button">
                    <span class="set-summary">${escapeHtml(cardSetSummary(selected))}</span>
                    <span class="card-set-button-change">変更</span>
                </button>
            </div>
        `;
    }

    // 使う拡張を選ぶ画面。すべて外すことはできない。決定すると onDone に選んだセットを渡す
    // backdrop: 'title' ならタイトル画面と同じ背景にする（後ろのゲーム画面を見せない）
    showCardSetPicker({ selected, onDone, backdrop = null }) {
        this.elements.modalTitle.textContent = '使う拡張';
        this.elements.modalBody.innerHTML = `
            <div class="setup-form card-set-screen">
                <p class="card-set-note">選んだセットから、ランダムに10種の王国カードを使います。★は難しさの目安です。</p>
                <div class="card-set-actions">
                    <button type="button" class="link-button" data-select-sets="all">すべて選ぶ</button>
                    <button type="button" class="link-button" data-select-sets="base">基本のみ</button>
                </div>
                <div class="card-set-list">
                    ${Object.values(CARD_SETS).map(set => `
                        <label class="card-set-check card-set-item">
                            <input type="checkbox" value="${set}" ${selected.includes(set) ? 'checked' : ''}>
                            <span class="card-set-text">
                                <span class="card-set-head">
                                    <b>${CARD_SET_LABELS[set]}</b>
                                    <span class="card-set-level" title="難しさ">${'★'.repeat(CARD_SET_INFO[set].level)}${'☆'.repeat(3 - CARD_SET_INFO[set].level)}</span>
                                </span>
                                <span class="card-set-desc">${CARD_SET_INFO[set].text}</span>
                            </span>
                        </label>
                    `).join('')}
                </div>
                <div class="card-set-footer">
                    <button id="card-sets-done-btn" class="primary">決定（<span class="set-summary"></span>）</button>
                </div>
            </div>
        `;

        const body = this.elements.modalBody;
        const inputs = Array.from(body.querySelectorAll('.card-set-list input'));
        const summary = body.querySelector('#card-sets-done-btn .set-summary');
        const selectedSets = () => inputs.filter(input => input.checked).map(input => input.value);
        const refresh = () => { summary.textContent = cardSetSummary(selectedSets()); };
        inputs.forEach(input => input.addEventListener('change', () => {
            if (selectedSets().length === 0) input.checked = true;
            refresh();
        }));
        body.querySelectorAll('[data-select-sets]').forEach(button => button.addEventListener('click', () => {
            const all = button.dataset.selectSets === 'all';
            inputs.forEach(input => { input.checked = all || input.value === CARD_SETS.BASE; });
            refresh();
        }));
        document.getElementById('card-sets-done-btn').addEventListener('click', () => onDone(selectedSets()));
        refresh();

        this.openModal({ closable: false, kind: 'card-sets', backdrop });
    }

    // ===== 遊び方 =====

    // 遊び方の説明。閉じると onClose を呼ぶ（タイトル画面に戻る・ゲーム画面に戻る）
    showHelp({ onClose, backdrop = null }) {
        this.elements.modalTitle.textContent = '遊び方';
        const section = (title, body, open = false) => `
            <details class="help-section" ${open ? 'open' : ''}>
                <summary>${title}</summary>
                <div class="help-body">${body}</div>
            </details>
        `;
        this.elements.modalBody.innerHTML = `
            <div class="help-content">
                ${section('ゲームの目的', `
                    <p>自分のデッキ（山札・手札・捨て札）を、カードを買って強くしていきます。ゲームが終わったとき、デッキの勝利点がいちばん多い人の勝ちです。</p>
                    <p>最初は銅貨7枚と屋敷3枚の10枚から始め、毎ターン5枚を手札に引きます。</p>
                `, true)}
                ${section('ターンの流れ', `
                    <ol>
                        <li><b>アクション</b>：手札のアクションカードを1枚プレイできます（カードの効果でアクションが増えれば、さらにプレイできます）。</li>
                        <li><b>購入</b>：手札の財宝をプレイしてコインを出し、サプライからカードを1枚買えます（購入が増えれば何枚でも）。「購入へ」を押すと、手札の財宝をまとめてプレイします。</li>
                        <li><b>クリーンアップ</b>：手札と場のカードを捨て札にし、山札から5枚引いて、次の人の番になります。</li>
                    </ol>
                    <p>山札がなくなったら、捨て札をシャッフルして山札にします。買ったカードは捨て札に入るので、何ターンか後に手札に来ます。</p>
                `)}
                ${section('操作のしかた', `
                    <ul>
                        <li>手札・サプライのカードを<b>タップ</b>するとプレイ・購入します。</li>
                        <li><b>長押し</b>（PCでは右クリック）でカードの説明を見られます。</li>
                        <li>購入回数を使い切ると、自動でターンを終えます。買わずに終えるときは「ターン終了」を押します。</li>
                        <li>カードの効果で選ぶものがあるときは、画面に選択が出ます。</li>
                        <li>画面上部の「⌂」でホーム（タイトル）に戻り、「⚙」で表示の設定を変えられます。</li>
                    </ul>
                `)}
                ${section('カードの種類', `
                    <ul>
                        <li><b>財宝</b>（銅貨・銀貨・金貨など）：購入フェーズにプレイしてコインを出します。</li>
                        <li><b>勝利点</b>（屋敷・公領・属州など）：ゲームの終わりに点になります。手札では役に立ちません。</li>
                        <li><b>アクション</b>：アクションフェーズにプレイして効果を使います。毎ゲーム、10種がサプライに並びます。</li>
                        <li><b>呪い</b>：-1点。他のプレイヤーのアタックで押しつけられます。</li>
                    </ul>
                `)}
                ${section('ゲームの終わり', `
                    <p>属州の山がなくなるか、サプライの山が3つなくなったら、そのターンの終わりでゲームが終わります。白金貨・植民地を使うゲームでは、植民地の山がなくなっても終わります。</p>
                `)}
                ${section('拡張のしくみ（用語）', `
                    <dl class="help-terms">
                        <dt>持続</dt><dd>次のターンの開始時まで場に残り、そのときにも効果があります。</dd>
                        <dt>リアクション</dt><dd>他の人のアタックなどのとき、手札から公開・プレイできます。</dd>
                        <dt>トークン・マット</dt><dd>勝利点トークン・財源・村人・恩恵などは、画面上部と各プレイヤーの欄に数が出ます。</dd>
                        <dt>イベントなど</dt><dd>サプライの下に並ぶ横長の札です。イベント・プロジェクトは購入でき、ランドマーク・習性・同盟などはずっと効果があります。長押しで説明を見られます。</dd>
                        <dt>夜</dt><dd>夜のカードが手札にあれば、購入の後に「夜へ」で夜フェイズに移ってプレイできます。</dd>
                    </dl>
                    <p>使う拡張は、タイトル画面の「拡張」で選べます。</p>
                `)}
                ${section('オンライン対戦', `
                    <ol>
                        <li>タイトル画面の「オンラインで遊ぶ」で名前を入れ、「部屋を作る」を押します。</li>
                        <li>「招待URLを共有」で友人にURLを送ります（部屋番号の数字${NetplayClient.ROOM_CODE_LENGTH}桁でも参加できます）。</li>
                        <li>部屋を作った人が、CPUの追加や拡張を選んで「ゲーム開始」を押します。</li>
                    </ol>
                    <p>接続が切れても、同じ席に戻れます。途中で抜けた人の席は、CPUが代わりに続けます。</p>
                `)}
                <button id="help-close-btn" class="primary">閉じる</button>
            </div>
        `;
        const close = () => onClose();
        document.getElementById('help-close-btn').addEventListener('click', close);
        this.openModal({ closable: true, kind: 'help', onClose: close, backdrop });
    }

    // ===== オンライン対戦 =====
    
    // 名前を入れて、部屋を作るか部屋コードで参加する
    showOnlineMenu({ roomCode = '', error = '' } = {}) {
        const session = loadOnlineSession();
        this.elements.modalTitle.textContent = 'オンライン対戦';
        this.elements.modalBody.innerHTML = `
            <div class="setup-form online-form">
                <label class="field">
                    <span>名前</span>
                    <input type="text" id="online-name" maxlength="12" value="${escapeHtml(this.uiController.settings.onlineName || session?.name || '')}" placeholder="表示する名前">
                </label>
                <button id="create-room-btn" class="primary">部屋を作る</button>
                <div class="online-join">
                    <input type="text" id="room-code" maxlength="${NetplayClient.ROOM_CODE_LENGTH}" value="${escapeHtml(roomCode)}" placeholder="部屋番号（数字${NetplayClient.ROOM_CODE_LENGTH}桁）" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
                    <button id="join-room-btn" class="primary secondary">参加する</button>
                </div>
                ${session && !roomCode ? `<button id="resume-room-btn" class="primary secondary">前の部屋（${escapeHtml(session.roomCode)}）に戻る</button>` : ''}
                ${error ? `<p class="online-error">${escapeHtml(error)}</p>` : ''}
                <button id="back-to-local-btn" class="link-button">ひとりで遊ぶ（CPU対戦）に戻る</button>
            </div>
        `;
        
        const nameInput = document.getElementById('online-name');
        const name = () => nameInput.value.trim();
        nameInput.addEventListener('change', () => this.uiController.updateSettings({ onlineName: name() }));
        
        // 部屋番号は数字だけを受け付ける
        const roomCodeInput = document.getElementById('room-code');
        roomCodeInput.addEventListener('input', () => {
            roomCodeInput.value = roomCodeInput.value.replace(/[^0-9]/g, '');
        });
        const requireName = () => {
            if (name()) return true;
            nameInput.focus();
            nameInput.placeholder = '名前を入れてください';
            return false;
        };
        
        document.getElementById('create-room-btn').addEventListener('click', () => {
            if (!requireName()) return;
            this.uiController.updateSettings({ onlineName: name() });
            this.uiController.createOnlineRoom(name());
        });
        document.getElementById('join-room-btn').addEventListener('click', () => {
            const code = roomCodeInput.value.trim();
            if (!requireName() || !code) return;
            this.uiController.updateSettings({ onlineName: name() });
            this.uiController.joinOnlineRoom(code, name());
        });
        document.getElementById('resume-room-btn')?.addEventListener('click', () => this.uiController.resumeOnlineRoom());
        document.getElementById('back-to-local-btn').addEventListener('click', () => this.uiController.leaveOnline());
        
        this.openModal({ closable: false, kind: 'online-menu' });
    }
    
    // ロビー：参加者と使うカードを確認し、部屋を作った人がゲームを始める
    showLobby(lobby, { isHost }) {
        const shareUrl = `${location.origin}${location.pathname}?room=${lobby.roomCode}`;
        
        this.elements.modalTitle.textContent = 'オンライン対戦の部屋';
        this.elements.modalBody.innerHTML = `
            <div class="setup-form lobby">
                <div class="lobby-code">
                    <span>部屋番号</span>
                    <b>${escapeHtml(lobby.roomCode)}</b>
                    <button id="share-room-btn" class="primary secondary">招待URLを共有</button>
                </div>
                <ul class="lobby-players">
                    ${lobby.players.map(player => `
                        <li>
                            <span class="lobby-player-name">${escapeHtml(player.name)}</span>
                            ${player.isCPU ? '<span class="cpu-badge">CPU</span>' : ''}
                            ${player.seat === 0 ? '<span class="host-badge">部屋を作った人</span>' : ''}
                            ${player.connected ? '' : '<span class="offline-badge">切断中</span>'}
                            ${isHost && player.isCPU ? `<button class="link-button" data-remove-seat="${player.seat}">外す</button>` : ''}
                        </li>
                    `).join('')}
                </ul>
                ${isHost ? `
                    ${this.createCardSetButtonHtml('lobby-card-sets-btn', lobby.cardSets)}
                    <button id="add-cpu-btn" class="primary secondary" ${lobby.players.length >= 4 ? 'disabled' : ''}>CPUを追加</button>
                    <button id="start-online-btn" class="primary" ${lobby.players.length < 2 ? 'disabled' : ''}>ゲーム開始</button>
                ` : `
                    <p class="lobby-note">使うカード：${escapeHtml(cardSetLabel(lobby.cardSets))}</p>
                    <p class="lobby-note">部屋を作った人がゲームを始めるのを待っています</p>
                `}
                <button id="leave-room-btn" class="link-button">部屋を出る</button>
            </div>
        `;
        
        const controller = this.uiController.gameController;
        document.getElementById('share-room-btn').addEventListener('click', () => this.shareRoom(shareUrl));
        document.getElementById('leave-room-btn').addEventListener('click', () => this.uiController.leaveOnline());
        if (isHost) {
            // 拡張は別の画面で選ぶ。選んでいる間に届いた部屋の更新は、決定して戻ったときに出す
            document.getElementById('lobby-card-sets-btn').addEventListener('click', () => this.showCardSetPicker({
                selected: lobby.cardSets,
                onDone: (sets) => {
                    controller.setCardSets(sets);
                    this.uiController.showLatestLobby();
                }
            }));
            document.getElementById('add-cpu-btn').addEventListener('click', () => controller.addCpu());
            document.getElementById('start-online-btn').addEventListener('click', () => controller.startGame());
            this.elements.modalBody.querySelectorAll('[data-remove-seat]').forEach(button => {
                button.addEventListener('click', () => controller.removePlayer(Number(button.dataset.removeSeat)));
            });
        }
        
        this.openModal({ closable: false, kind: 'lobby' });
    }
    
    // 招待URLを共有する（スマホでは共有メニュー、使えなければコピー）
    async shareRoom(url) {
        try {
            if (navigator.share) {
                await navigator.share({ title: 'ドミニオンの部屋', url });
                return;
            }
            await navigator.clipboard.writeText(url);
            this.uiController.showToast('招待URLをコピーしました');
        } catch {
            this.uiController.showToast(url);
        }
    }

    // プレイヤー名入力欄を更新（保存した名前とCPUの指定があればそれを入れる）
    updatePlayerNameInputs(count) {
        const playerNamesDiv = document.getElementById('player-names');
        const saved = this.uiController.settings.localPlayers;
        let html = '';

        for (let i = 1; i <= count; i++) {
            const { name, isCPU } = saved[i - 1] ?? { name: i === 1 ? 'プレイヤー1' : `CPU${i - 1}`, isCPU: i !== 1 };
            html += `
                <div class="player-input">
                    <label for="player-${i}">P${i}</label>
                    <input type="text" id="player-${i}" value="${escapeHtml(name)}">
                    <label class="cpu-toggle">
                        <input type="checkbox" id="player-${i}-cpu" ${isCPU ? 'checked' : ''}> CPU
                    </label>
                </div>
            `;
        }

        playerNamesDiv.innerHTML = html;
        
        // 名前やCPUの指定を変えたら保存する（表示していない席の保存内容はそのまま残す）
        playerNamesDiv.querySelectorAll('input').forEach(input => {
            input.addEventListener('change', () => this.saveLocalPlayers(count));
        });
    }
    
    saveLocalPlayers(count) {
        const localPlayers = [...this.uiController.settings.localPlayers];
        for (let i = 1; i <= count; i++) {
            localPlayers[i - 1] = {
                name: document.getElementById(`player-${i}`).value,
                isCPU: document.getElementById(`player-${i}-cpu`).checked
            };
        }
        this.uiController.updateSettings({ localPlayers });
    }

    // 「手札の同じカードを重ねる」設定のチェックボックス
    createStackHandToggleHtml(id) {
        return `
            <label class="setting-toggle" for="${id}">
                <span>手札の同じカードを重ねる</span>
                <input type="checkbox" id="${id}" ${this.uiController.settings.stackHand ? 'checked' : ''}>
            </label>
        `;
    }
    
    // チェックボックスの変更をすぐに設定へ反映する
    setupStackHandToggle(id) {
        document.getElementById(id).addEventListener('change', (event) => {
            this.uiController.updateSettings({ stackHand: event.target.checked });
        });
    }
    
    // 設定画面（ゲーム中でも変更できる）
    showSettings() {
        this.elements.modalTitle.textContent = '設定';
        // オンライン対戦の対戦中は、部屋を出られる（自分の席は以後CPUが代わりに操作する）
        const online = this.uiController.isOnline();
        this.elements.modalBody.innerHTML = this.createStackHandToggleHtml('settings-stack-hand') + (online ? `
            <div class="setup-form">
                <button id="leave-game-btn" class="link-button">部屋を出る（自分の席はCPUが代わりに続けます）</button>
            </div>
        ` : '');
        this.setupStackHandToggle('settings-stack-hand');
        document.getElementById('leave-game-btn')?.addEventListener('click', () => {
            this.closeModal();
            this.uiController.leaveOnline();
        });
        this.openModal({ kind: 'settings' });
    }
    
    // モーダルを開く（closable が false なら×を出さず、答えるまで閉じられないようにする）
    // onClose を渡すと、×を押したときに閉じる代わりにそれを呼ぶ（元の画面に戻すため）
    openModal({ closable = true, kind = null, onClose = null, backdrop = null } = {}) {
        this.kind = kind;
        this.onClose = onClose;
        // 画面の種類ごとに見た目を変える（トップ画面は全画面のタイトル画面にする）
        this.elements.gameModal.dataset.kind = kind ?? '';
        this.elements.gameModal.dataset.backdrop = backdrop ?? '';
        this.elements.modalClose.style.display = closable ? '' : 'none';
        this.elements.gameModal.style.display = 'flex';
    }

    // ×を押したとき：戻り先があればそこに戻り、なければ閉じる
    handleCloseButton() {
        if (this.onClose) {
            this.onClose();
            return;
        }
        this.closeModal();
    }

    // モーダルを閉じる
    closeModal() {
        this.kind = null;
        this.onClose = null;
        this.elements.gameModal.style.display = 'none';
    }
    
    // カードの説明を表示する（count を渡すとサプライの残り枚数も出す）
    showCardDetail(card, { count, cost } = {}) {
        this.elements.modalTitle.textContent = card.name;
        
        this.elements.modalBody.innerHTML = `
            <div class="card-detail">
                ${this.view.createCardHtml(card, '', 'large')}
                <div class="card-detail-info">
                    <p>コスト <b>${card.cost}</b>${card.potionCost ? '＋ポーション' : ''}${cost !== undefined && cost !== card.cost ? `（今は <b>${cost}</b>）` : ''}</p>
                    ${count !== undefined ? `<p>サプライ残り <b>${count}</b>枚</p>` : ''}
                </div>
            </div>
        `;
        
        this.openModal();
    }
    
    // イベントなどの説明を表示する
    showLandscapeDetail(landscape) {
        if (!landscape) return;
        this.elements.modalTitle.textContent = landscape.name;
        this.elements.modalBody.innerHTML = `
            <div class="card-detail">
                <div class="landscape-detail">
                    <p class="landscape-kind">${LANDSCAPE_KIND_LABELS[landscape.kind] ?? ''}</p>
                    <p>${escapeHtml(landscape.description)}</p>
                </div>
                <div class="card-detail-info">
                    ${landscape.cost !== undefined ? `<p>コスト <b>${landscape.cost}</b>${landscape.debtCost ? `＋負債${landscape.debtCost}` : ''}</p>` : ''}
                    ${landscape.oncePerTurn ? '<p>1ターンに1回だけ購入できる</p>' : ''}
                    ${landscape.oncePerGame ? '<p>1ゲームに1回だけ購入できる</p>' : ''}
                </div>
            </div>
        `;
        this.openModal();
    }

    // 選択待ちの画面。必ず答える必要があるので×は出さない
    showPrompt(prompt, view) {
        // 手番ではないプレイヤーが答える選択（民兵の攻撃など）は、誰が答えるのかを明示する
        const who = prompt.playerId !== view.currentPlayerId ? `${prompt.playerName}：` : '';
        this.elements.modalTitle.textContent = `${who}${prompt.title}`;
        this.currentPromptView = view;
        
        if (prompt.type === 'confirm') {
            this.showConfirmPrompt(prompt);
        } else if (prompt.type === 'choose') {
            this.showChoosePrompt(prompt);
        } else {
            this.showSelectPrompt(prompt);
        }
        
        this.openModal({ closable: false, kind: 'prompt' });
    }
    
    // 答えをゲームに渡す。受け付けられなかったときは同じ選択を出し直して、ゲームが止まらないようにする
    answerPrompt(prompt, answer) {
        this.closeModal();
        if (!this.uiController.gameController.send({ type: 'answer', answer })) {
            this.showPrompt(prompt, this.currentPromptView);
        }
    }
    
    // はい／いいえの選択（対象のカードがあれば大きく表示する）
    showConfirmPrompt(prompt) {
        this.elements.modalBody.innerHTML = `
            <p class="prompt-text">${prompt.message}</p>
            ${prompt.card ? `<div class="prompt-card">${this.view.createCardHtml(prompt.card, '', 'large')}</div>` : ''}
            <div class="prompt-footer prompt-buttons">
                <button id="prompt-no" class="primary secondary">${prompt.noLabel}</button>
                <button id="prompt-yes" class="primary">${prompt.yesLabel}</button>
            </div>
        `;
        
        document.getElementById('prompt-yes').addEventListener('click', () => this.answerPrompt(prompt, true));
        document.getElementById('prompt-no').addEventListener('click', () => this.answerPrompt(prompt, false));
    }
    
    // 文字の選択肢から選ぶ選択。1つだけ選ぶならボタンを押すとすぐに答え、複数選ぶなら決定ボタンで答える
    showChoosePrompt(prompt) {
        const { options, min, max } = prompt;
        const single = min === 1 && max === 1;
        
        this.elements.modalBody.innerHTML = `
            <p class="prompt-text">${prompt.message}</p>
            ${prompt.card ? `<div class="prompt-card">${this.view.createCardHtml(prompt.card, '', 'large')}</div>` : ''}
            <div class="prompt-options">
                ${options.map((label, index) => `<button class="prompt-option primary secondary" data-index="${index}">${label}</button>`).join('')}
            </div>
            ${single ? '' : '<div class="prompt-footer"><button id="prompt-confirm" class="primary"></button></div>'}
        `;
        
        const buttons = Array.from(this.elements.modalBody.querySelectorAll('.prompt-option'));
        const selected = () => buttons.filter(button => button.classList.contains('selected')).map(button => Number(button.dataset.index));
        
        if (single) {
            buttons.forEach(button => button.addEventListener('click', () => this.answerPrompt(prompt, [Number(button.dataset.index)])));
            return;
        }
        
        const confirmBtn = document.getElementById('prompt-confirm');
        const range = min === max ? `${min}つ` : `${min}〜${max}つ`;
        const update = () => {
            const count = selected().length;
            confirmBtn.textContent = `${prompt.confirmLabel}（${count} / ${range}）`;
            confirmBtn.disabled = count < min || count > max;
        };
        buttons.forEach(button => button.addEventListener('click', () => {
            if (button.classList.contains('selected')) {
                button.classList.remove('selected');
            } else if (selected().length < max) {
                button.classList.add('selected');
            }
            update();
        }));
        update();
        confirmBtn.addEventListener('click', () => this.answerPrompt(prompt, selected()));
    }
    
    // カードを min〜max 枚選ぶ選択。枚数が条件を満たすまで決定ボタンは押せない
    showSelectPrompt(prompt) {
        const { cards, min, max } = prompt;
        
        // 手札から選ぶときは手札と同じ順に並べる（data-index は元の番号のまま）
        const order = prompt.fromHand
            ? this.view.getSortedHandIndices(cards)
            : cards.map((card, index) => index);
        const range = min === max ? `${min}枚` : (min === 0 ? `最大${max}枚` : `${min}〜${max}枚`);
        
        this.elements.modalBody.innerHTML = `
            <p class="prompt-text">${prompt.message}</p>
            <div class="card-selection">
                ${order.map(index => this.view.createCardHtml(cards[index], `data-index="${index}"`, 'selectable')).join('')}
            </div>
            <div class="prompt-footer">
                <button id="prompt-confirm" class="primary"></button>
            </div>
        `;
        
        const confirmBtn = document.getElementById('prompt-confirm');
        const update = () => {
            const count = this.getSelectedIndices().length;
            confirmBtn.textContent = `${prompt.confirmLabel}（${count}枚 / ${range}）`;
            confirmBtn.disabled = count < min || count > max;
        };
        
        this.setupCardSelection(max, update);
        update();
        
        confirmBtn.addEventListener('click', () => this.answerPrompt(prompt, this.getSelectedIndices()));
    }
    
    // カードのタップで選択を切り替える。1枚だけ選ぶときは、別のカードをタップすると選び直しになる
    setupCardSelection(max, onChange) {
        const cards = Array.from(this.elements.modalBody.querySelectorAll('.card-selection .card'));
        cards.forEach(card => {
            card.addEventListener('click', () => {
                if (card.classList.contains('selected')) {
                    card.classList.remove('selected');
                } else if (max === 1) {
                    cards.forEach(other => other.classList.remove('selected'));
                    card.classList.add('selected');
                } else if (this.getSelectedIndices().length < max) {
                    card.classList.add('selected');
                }
                onChange();
            });
        });
    }
    
    // 選択されたカードのインデックス
    getSelectedIndices() {
        return Array.from(this.elements.modalBody.querySelectorAll('.card-selection .card.selected'))
            .map(card => parseInt(card.getAttribute('data-index')));
    }
    
    // ゲーム結果表示
    // online なら、誰でも部屋（ロビー）に戻せる。部屋を作った人は、同じ顔ぶれでもう一度始めることもできる
    showGameResults(result, { online = false, isHost = false } = {}) {
        this.elements.modalTitle.textContent = 'ゲーム終了';

        let html = '<div class="game-results">';

        result.forEach((score, index) => {
            html += `<div class="result-row ${index === 0 ? 'winner' : ''}">
                <span class="rank">${index + 1}位</span>
                <span class="player-name">${escapeHtml(score.name)}</span>
                <span class="points">${score.points}点</span>
            </div>`;
        });

        if (!online) {
            html += '<button id="new-game-btn" class="primary">新しいゲームを始める</button>';
        } else {
            if (isHost) html += '<button id="rematch-btn" class="primary">同じ顔ぶれでもう一度</button>';
            html += `<button id="back-to-lobby-btn" class="primary ${isHost ? 'secondary' : ''}">部屋に戻る</button>`;
            if (!isHost) html += '<p class="lobby-note">部屋を作った人は、同じ顔ぶれでもう一度始めることもできます</p>';
        }
        if (online) {
            html += '<button id="leave-room-btn" class="link-button">部屋を出る</button>';
        }
        html += '</div>';

        this.elements.modalBody.innerHTML = html;

        document.getElementById('new-game-btn')?.addEventListener('click', () => {
            this.closeModal();
            this.showGameSetup();
        });
        document.getElementById('rematch-btn')?.addEventListener('click', () => {
            this.uiController.gameController.startGame();
        });
        document.getElementById('back-to-lobby-btn')?.addEventListener('click', () => {
            this.uiController.gameController.backToLobby();
        });
        document.getElementById('leave-room-btn')?.addEventListener('click', () => this.uiController.leaveOnline());

        // 閉じると次のゲームを始められなくなるので×は出さない
        this.openModal({ closable: false, kind: 'result' });
    }
}

export default UIModal;
