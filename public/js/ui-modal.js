/**
 * ドミニオンのUIモーダルダイアログ管理
 * ゲーム内のモーダルダイアログ表示を担当
 */

class UIModal {
    constructor(uiController) {
        this.uiController = uiController;
        this.elements = uiController.elements;
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
                        <option value="2">2人</option>
                        <option value="3">3人</option>
                        <option value="4">4人</option>
                    </select>
                </label>

                <div id="player-names"></div>

                <label class="field">
                    <span>使うカード</span>
                    <select id="card-sets">
                        ${[['base', '基本'], ['seaside', '海辺'], ['base+seaside', '基本＋海辺']]
                            .map(([value, label]) => `<option value="${value}" ${this.uiController.settings.cardSets === value ? 'selected' : ''}>${label}</option>`)
                            .join('')}
                    </select>
                </label>

                ${this.createStackHandToggleHtml('setup-stack-hand')}

                <button id="start-game-btn" class="primary">ゲーム開始</button>
            </div>
        `;

        this.elements.modalBody.innerHTML = setupHtml;
        this.updatePlayerNameInputs(2);

        // プレイヤー数変更時のイベント
        const playerCountSelect = document.getElementById('player-count');
        playerCountSelect.addEventListener('change', () => {
            const count = parseInt(playerCountSelect.value);
            this.updatePlayerNameInputs(count);
        });

        this.setupStackHandToggle('setup-stack-hand');
        
        document.getElementById('card-sets').addEventListener('change', (event) => {
            this.uiController.updateSettings({ cardSets: event.target.value });
        });
        
        // ゲーム開始ボタンのイベント
        const startGameBtn = document.getElementById('start-game-btn');
        startGameBtn.addEventListener('click', () => {
            this.uiController.startGame();
        });

        // モーダルを表示
        this.openModal();
    }

    // プレイヤー名入力欄を更新
    updatePlayerNameInputs(count) {
        const playerNamesDiv = document.getElementById('player-names');
        let html = '';

        for (let i = 1; i <= count; i++) {
            html += `
                <div class="player-input">
                    <label for="player-${i}">P${i}</label>
                    <input type="text" id="player-${i}" value="${i === 1 ? 'プレイヤー1' : `CPU${i - 1}`}">
                    <label class="cpu-toggle">
                        <input type="checkbox" id="player-${i}-cpu" ${i === 1 ? '' : 'checked'}> CPU
                    </label>
                </div>
            `;
        }

        playerNamesDiv.innerHTML = html;
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
        this.openModal();
    }
    
    // モーダルを開く（closable が false なら×を出さず、答えるまで閉じられないようにする）
    openModal({ closable = true } = {}) {
        this.elements.modalClose.style.display = closable ? '' : 'none';
        this.elements.gameModal.style.display = 'flex';
    }
    
    // モーダルを閉じる
    closeModal() {
        this.elements.gameModal.style.display = 'none';
    }
    
    // カードの説明を表示する（count を渡すとサプライの残り枚数も出す）
    showCardDetail(card, { count } = {}) {
        this.elements.modalTitle.textContent = card.name;
        
        this.elements.modalBody.innerHTML = `
            <div class="card-detail">
                ${this.view.createCardHtml(card, '', 'large')}
                <div class="card-detail-info">
                    <p>コスト <b>${card.cost}</b></p>
                    ${count !== undefined ? `<p>サプライ残り <b>${count}</b>枚</p>` : ''}
                </div>
            </div>
        `;
        
        this.openModal();
    }
    
    // 選択待ちの画面。必ず答える必要があるので×は出さない
    showPrompt(prompt) {
        // 手番ではないプレイヤーが答える選択（民兵の攻撃など）は、誰が答えるのかを明示する
        const current = this.uiController.gameController.getCurrentPlayer();
        const who = prompt.player !== current ? `${prompt.player.name}：` : '';
        this.elements.modalTitle.textContent = `${who}${prompt.title}`;
        
        if (prompt.type === 'confirm') {
            this.showConfirmPrompt(prompt);
        } else {
            this.showSelectPrompt(prompt);
        }
        
        this.openModal({ closable: false });
    }
    
    // 答えをゲームに渡す。受け付けられなかったときは同じ選択を出し直して、ゲームが止まらないようにする
    answerPrompt(prompt, answer) {
        this.closeModal();
        if (!this.uiController.gameController.resolvePrompt(answer)) {
            this.showPrompt(prompt);
            return;
        }
        // 購入で起きた選択（船乗り）に答えた後、購入回数がなければターンを終える
        this.uiController.eventHandler.endTurnIfNoBuysLeft();
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
    
    // カードを min〜max 枚選ぶ選択。枚数が条件を満たすまで決定ボタンは押せない
    showSelectPrompt(prompt) {
        const { cards, min, max } = prompt;
        
        // 手札から選ぶときは手札と同じ順に並べる（data-index は元の番号のまま）
        const order = cards === prompt.player.hand
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
    showGameResults(scores) {
        this.elements.modalTitle.textContent = 'ゲーム終了';

        let html = '<div class="game-results">';

        scores.forEach((score, index) => {
            html += `<div class="result-row ${index === 0 ? 'winner' : ''}">
                <span class="rank">${index + 1}位</span>
                <span class="player-name">${score.player.name}</span>
                <span class="points">${score.points}点</span>
            </div>`;
        });

        html += '<button id="new-game-btn" class="primary">新しいゲームを始める</button>';
        html += '</div>';

        this.elements.modalBody.innerHTML = html;

        // 新しいゲームボタンのイベント
        const newGameBtn = document.getElementById('new-game-btn');
        newGameBtn.addEventListener('click', () => {
            this.closeModal();
            this.showGameSetup();
        });

        this.openModal();
    }
}

export default UIModal;
