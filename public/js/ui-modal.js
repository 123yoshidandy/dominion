/**
 * ドミニオンのUIモーダルダイアログ管理
 * ゲーム内のモーダルダイアログ表示を担当
 */

import { CARD_TYPES } from './card-data.js';

class UIModal {
    constructor(uiController) {
        this.uiController = uiController;
        this.elements = uiController.elements;
    }
    
    // ゲームの初期化画面を表示
    showGameSetup() {
        // モーダルを使ってゲーム設定画面を表示
        this.elements.modalTitle.textContent = 'ドミニオン - ゲーム設定';
        
        const setupHtml = `
            <div class="setup-form">
                <p>プレイヤー数を選択してください：</p>
                <select id="player-count">
                    <option value="2">2人</option>
                    <option value="3">3人</option>
                    <option value="4">4人</option>
                </select>
                
                <div id="player-names"></div>
                
                <button id="start-game-btn">ゲーム開始</button>
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
        this.elements.gameModal.style.display = 'block';
    }
    
    // プレイヤー名入力欄を更新
    updatePlayerNameInputs(count) {
        const playerNamesDiv = document.getElementById('player-names');
        let html = '';
        
        for (let i = 1; i <= count; i++) {
            html += `
                <div class="player-input">
                    <label for="player-${i}">プレイヤー${i}: </label>
                    <input type="text" id="player-${i}" value="${i === 1 ? 'プレイヤー1' : `CPU${i - 1}`}">
                    <label class="cpu-toggle">
                        <input type="checkbox" id="player-${i}-cpu" ${i === 1 ? '' : 'checked'}> CPU
                    </label>
                </div>
            `;
        }
        
        playerNamesDiv.innerHTML = html;
    }
    
    // モーダルを閉じる
    closeModal() {
        this.elements.gameModal.style.display = 'none';
    }
    
    // カード捨て選択モーダル表示
    showDiscardModal(player, cardId, callback) {
        this.elements.modalTitle.textContent = 'カードを捨てる';
        
        let html = `<p>${cardId === 'cellar' ? '捨てるカードを選択してください。選んだ枚数だけカードを引きます。' : '捨てるカードを選択してください。'}</p>`;
        
        html += '<div class="card-selection">';
        player.hand.forEach((card, index) => {
            const cardTypeClass = card.types.map(type => `${type}-card`).join(' ');
            
            html += `
                <div class="card ${cardTypeClass}" data-index="${index}">
                    <div class="card-title">${card.name}</div>
                    <div class="card-cost">${card.cost}</div>
                    <div class="card-type">${this.getCardTypeText(card.types)}</div>
                    <div class="card-description">${card.description}</div>
                    <div class="card-checkbox">
                        <input type="checkbox" id="card-${index}" class="card-select">
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        html += '<button id="confirm-discard">確定</button>';
        
        this.elements.modalBody.innerHTML = html;
        
        // 確定ボタンのイベント
        const confirmBtn = document.getElementById('confirm-discard');
        confirmBtn.addEventListener('click', () => {
            const selectedIndices = [];
            const checkboxes = document.querySelectorAll('.card-select');
            
            checkboxes.forEach((checkbox, index) => {
                if (checkbox.checked) {
                    selectedIndices.push(index);
                }
            });
            
            this.closeModal();
            this.uiController.gameController.resolvePrompt(selectedIndices);
        });
        
        this.elements.gameModal.style.display = 'block';
    }
    
    // カード廃棄選択モーダル表示
    showTrashModal(player, maxCount, callback) {
        this.elements.modalTitle.textContent = 'カードを廃棄する';
        
        let html = `<p>最大${maxCount}枚まで廃棄するカードを選択してください。</p>`;
        
        html += '<div class="card-selection">';
        player.hand.forEach((card, index) => {
            const cardTypeClass = card.types.map(type => `${type}-card`).join(' ');
            
            html += `
                <div class="card ${cardTypeClass}" data-index="${index}">
                    <div class="card-title">${card.name}</div>
                    <div class="card-cost">${card.cost}</div>
                    <div class="card-type">${this.getCardTypeText(card.types)}</div>
                    <div class="card-description">${card.description}</div>
                    <div class="card-checkbox">
                        <input type="checkbox" id="card-${index}" class="card-select">
                    </div>
                </div>
            `;
        });
        html += '</div>';
        
        html += '<button id="confirm-trash">確定</button>';
        
        this.elements.modalBody.innerHTML = html;
        
        // 最大選択数を制限
        const checkboxes = document.querySelectorAll('.card-select');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const selectedCount = document.querySelectorAll('.card-select:checked').length;
                
                if (selectedCount > maxCount) {
                    checkbox.checked = false;
                }
            });
        });
        
        // 確定ボタンのイベント
        const confirmBtn = document.getElementById('confirm-trash');
        confirmBtn.addEventListener('click', () => {
            const selectedIndices = [];
            
            checkboxes.forEach((checkbox, index) => {
                if (checkbox.checked) {
                    selectedIndices.push(index);
                }
            });
            
            this.closeModal();
            this.uiController.gameController.resolvePrompt(selectedIndices);
        });
        
        this.elements.gameModal.style.display = 'block';
    }
    
    // ゲーム結果表示
    showGameResults(scores) {
        this.elements.modalTitle.textContent = 'ゲーム終了';
        
        let html = '<div class="game-results">';
        html += '<h2>最終結果</h2>';
        
        scores.forEach((score, index) => {
            html += `<div class="result-row ${index === 0 ? 'winner' : ''}">
                <span class="rank">${index + 1}位</span>
                <span class="player-name">${score.player.name}</span>
                <span class="points">${score.points}点</span>
            </div>`;
        });
        
        html += '<button id="new-game-btn">新しいゲームを始める</button>';
        html += '</div>';
        
        this.elements.modalBody.innerHTML = html;
        
        // 新しいゲームボタンのイベント
        const newGameBtn = document.getElementById('new-game-btn');
        newGameBtn.addEventListener('click', () => {
            this.closeModal();
            this.showGameSetup();
        });
        
        this.elements.gameModal.style.display = 'block';
    }
    
    // カードタイプの日本語テキスト取得
    getCardTypeText(types) {
        const typeMap = {
            [CARD_TYPES.TREASURE]: '財宝',
            [CARD_TYPES.VICTORY]: '勝利点',
            [CARD_TYPES.ACTION]: 'アクション',
            [CARD_TYPES.CURSE]: '呪い'
        };
        
        return types.map(type => typeMap[type] || type).join(' - ');
    }
}

export default UIModal;