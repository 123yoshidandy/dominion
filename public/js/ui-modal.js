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

    // モーダルを開く
    openModal() {
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
    
    // 手札からカードを選ぶ画面のHTML（カード自体をタップして選択する）
    createCardSelectionHtml(player) {
        const cardsHtml = player.hand.map((card, index) =>
            this.view.createCardHtml(card, `data-index="${index}"`, 'selectable')
        ).join('');

        return `<div class="card-selection">${cardsHtml}</div>`;
    }

    // カードのタップで選択を切り替える（canSelect が false なら追加で選べない）
    setupCardSelection(canSelect = () => true) {
        const cards = this.elements.modalBody.querySelectorAll('.card-selection .card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                if (!card.classList.contains('selected') && !canSelect()) return;
                card.classList.toggle('selected');
            });
        });
    }

    // 選択されたカードのインデックス
    getSelectedIndices() {
        return Array.from(this.elements.modalBody.querySelectorAll('.card-selection .card.selected'))
            .map(card => parseInt(card.getAttribute('data-index')));
    }

    // カード捨て選択モーダル表示
    showDiscardModal(player, cardId, callback) {
        this.elements.modalTitle.textContent = 'カードを捨てる';

        let html = `<p class="prompt-text">${cardId === 'cellar' ? '捨てるカードをタップして選んでください。選んだ枚数だけカードを引きます。' : '捨てるカードをタップして選んでください。'}</p>`;
        html += this.createCardSelectionHtml(player);
        html += '<button id="confirm-discard" class="primary">確定</button>';

        this.elements.modalBody.innerHTML = html;
        this.setupCardSelection();

        // 確定ボタンのイベント
        const confirmBtn = document.getElementById('confirm-discard');
        confirmBtn.addEventListener('click', () => {
            const selectedIndices = this.getSelectedIndices();
            this.closeModal();
            this.uiController.gameController.resolvePrompt(selectedIndices);
        });

        this.openModal();
    }

    // カード廃棄選択モーダル表示
    showTrashModal(player, maxCount, callback) {
        this.elements.modalTitle.textContent = 'カードを廃棄する';

        let html = `<p class="prompt-text">廃棄するカードをタップして選んでください（最大${maxCount}枚）。</p>`;
        html += this.createCardSelectionHtml(player);
        html += '<button id="confirm-trash" class="primary">確定</button>';

        this.elements.modalBody.innerHTML = html;

        // 最大選択数を制限
        this.setupCardSelection(() => this.getSelectedIndices().length < maxCount);

        // 確定ボタンのイベント
        const confirmBtn = document.getElementById('confirm-trash');
        confirmBtn.addEventListener('click', () => {
            const selectedIndices = this.getSelectedIndices();
            this.closeModal();
            this.uiController.gameController.resolvePrompt(selectedIndices);
        });

        this.openModal();
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
