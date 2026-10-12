/**
 * ドミニオンのUIモーダルダイアログ管理
 * ゲーム内のモーダルダイアログ表示を担当
 */

import { loadOnlineSession } from './online-controller.js';
import { CARD_SETS, CARD_SET_LABELS } from './card-types.js';

// 使うカードのセットの表示名（「基本・海辺」のように並べる）
const cardSetLabel = (sets) => Object.values(CARD_SETS).filter(set => sets.includes(set)).map(set => CARD_SET_LABELS[set]).join('・');

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
        // モーダルを使ってゲーム設定画面を表示
        this.elements.modalTitle.textContent = 'ゲーム設定';

        const setupHtml = `
            <div class="setup-form">
                <label class="field">
                    <span>プレイヤー数</span>
                    <select id="player-count">
                        ${[2, 3, 4].map(count => `<option value="${count}" ${this.uiController.settings.playerCount === count ? 'selected' : ''}>${count}人</option>`).join('')}
                    </select>
                </label>

                <div id="player-names"></div>

                ${this.createCardSetChecksHtml('card-sets', this.uiController.settings.cardSets.split('+'))}

                ${this.createStackHandToggleHtml('setup-stack-hand')}

                <button id="start-game-btn" class="primary">ゲーム開始</button>
                <button id="online-btn" class="primary secondary">オンラインで遊ぶ</button>
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
        
        this.setupCardSetChecks('card-sets', (sets) => this.uiController.updateSettings({ cardSets: sets.join('+') }));
        
        // ゲーム開始ボタンのイベント
        const startGameBtn = document.getElementById('start-game-btn');
        startGameBtn.addEventListener('click', () => {
            this.uiController.startGame();
        });
        document.getElementById('online-btn').addEventListener('click', () => this.showOnlineMenu());

        // モーダルを表示（閉じると何も操作できなくなるので×は出さない）
        this.openModal({ closable: false, kind: 'setup' });
    }
    
    // 使うカードのセットのチェックボックス（設定とオンラインのロビーで共通）
    createCardSetChecksHtml(id, selected) {
        return `
            <fieldset class="field card-set-checks" id="${id}">
                <legend>使うカード（選んだセットからランダムに10種）</legend>
                ${Object.values(CARD_SETS).map(set => `
                    <label class="card-set-check">
                        <input type="checkbox" value="${set}" ${selected.includes(set) ? 'checked' : ''}>
                        <span>${CARD_SET_LABELS[set]}</span>
                    </label>
                `).join('')}
            </fieldset>
        `;
    }
    
    // チェックが変わったら、選ばれているセットを渡す。すべて外すことはできない（最後の1つは外せない）
    setupCardSetChecks(id, onChange) {
        const inputs = Array.from(document.querySelectorAll(`#${id} input`));
        inputs.forEach(input => input.addEventListener('change', () => {
            const sets = inputs.filter(other => other.checked).map(other => other.value);
            if (sets.length === 0) {
                input.checked = true;
                return;
            }
            onChange(sets);
        }));
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
                    <input type="text" id="room-code" maxlength="5" value="${escapeHtml(roomCode)}" placeholder="部屋番号（数字5桁）" inputmode="numeric" pattern="[0-9]*" autocomplete="off">
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
                    ${this.createCardSetChecksHtml('lobby-card-sets', lobby.cardSets)}
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
            this.setupCardSetChecks('lobby-card-sets', (sets) => controller.setCardSets(sets));
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
        this.elements.modalBody.innerHTML = this.createStackHandToggleHtml('settings-stack-hand');
        this.setupStackHandToggle('settings-stack-hand');
        this.openModal({ kind: 'settings' });
    }
    
    // モーダルを開く（closable が false なら×を出さず、答えるまで閉じられないようにする）
    openModal({ closable = true, kind = null } = {}) {
        this.kind = kind;
        this.elements.modalClose.style.display = closable ? '' : 'none';
        this.elements.gameModal.style.display = 'flex';
    }
    
    // モーダルを閉じる
    closeModal() {
        this.kind = null;
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
    // online なら、部屋を作った人はロビーに戻せる（他の人はそれを待つ）
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
        } else if (isHost) {
            html += '<button id="back-to-lobby-btn" class="primary">部屋に戻る（もう一度遊ぶ）</button>';
        } else {
            html += '<p class="lobby-note">部屋を作った人が部屋に戻るのを待っています</p>';
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
        document.getElementById('back-to-lobby-btn')?.addEventListener('click', () => {
            this.uiController.gameController.backToLobby();
        });
        document.getElementById('leave-room-btn')?.addEventListener('click', () => this.uiController.leaveOnline());

        // 閉じると次のゲームを始められなくなるので×は出さない
        this.openModal({ closable: false, kind: 'result' });
    }
}

export default UIModal;
