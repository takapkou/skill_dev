// メインアプリケーション
const App = {
    config: null,
    editingId: null,
    
    /**
     * アプリケーション初期化
     */
    async init() {
        // 設定ファイルを読み込み
        this.config = await Config.loadConfig();
        
        // データマネージャ初期化
        DataManager.init();
        
        // UI初期化
        this.initializeForm();
        this.setupEventListeners();
        this.renderDataList();
    },
    
    /**
     * フォームの初期化
     */
    initializeForm() {
        // 週の開始日をデフォルトで今週の月曜日に設定
        const weekStartDateInput = document.getElementById('weekStartDate');
        weekStartDateInput.value = DataManager.weekStartDate;
        
        // 技術分野のドロップダウンを生成
        const categorySelect = document.getElementById('category');
        const categories = Config.getCategories();
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
        
        // 前回選択した技術分野があれば設定
        const lastCategory = Storage.load('lastCategory');
        if (lastCategory && categories.includes(lastCategory)) {
            categorySelect.value = lastCategory;
            this.updateSubcategoryOptions(lastCategory);
            
            const lastSubcategory = Storage.load('lastSubcategory');
            if (lastSubcategory) {
                const subcategorySelect = document.getElementById('subcategory');
                subcategorySelect.value = lastSubcategory;
            }
        }
    },
    
    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // フォーム送信
        document.getElementById('entryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
        
        // クリアボタン
        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearForm();
        });
        
        // 技術分野変更時に小分類を更新
        document.getElementById('category').addEventListener('change', (e) => {
            this.updateSubcategoryOptions(e.target.value);
        });
        
        // 週の開始日変更時
        document.getElementById('weekStartDate').addEventListener('change', (e) => {
            DataManager.weekStartDate = e.target.value;
            this.renderDataList();
        });
        
        // 今週に設定ボタン
        document.getElementById('setThisWeekBtn').addEventListener('click', () => {
            const weekStartDate = DataManager.getWeekStartDate(new Date());
            document.getElementById('weekStartDate').value = weekStartDate;
            DataManager.weekStartDate = weekStartDate;
            this.renderDataList();
        });
        
        // 設定表示ボタン
        document.getElementById('toggleConfigBtn').addEventListener('click', () => {
            this.toggleConfigDisplay();
        });
        
        // インポートボタン
        document.getElementById('importFile').addEventListener('change', (e) => {
            this.handleImport(e);
        });
        
        // エクスポートボタン
        document.getElementById('exportWeekBtn').addEventListener('click', () => {
            this.exportWeek();
        });
        
        // 全削除ボタン
        document.getElementById('clearAllBtn').addEventListener('click', () => {
            this.clearAllData();
        });
    },
    
    /**
     * 小分類の選択肢を更新
     */
    updateSubcategoryOptions(category) {
        const subcategorySelect = document.getElementById('subcategory');
        subcategorySelect.innerHTML = '';
        
        if (!category) {
            subcategorySelect.disabled = true;
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'まず技術分野を選択してください';
            subcategorySelect.appendChild(option);
            return;
        }
        
        subcategorySelect.disabled = false;
        
        // プレースホルダー
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = '選択してください';
        subcategorySelect.appendChild(placeholder);
        
        // 小分類を追加
        const subcategories = Config.getSubcategories(category);
        subcategories.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub;
            option.textContent = sub;
            subcategorySelect.appendChild(option);
        });
    },
    
    /**
     * フォーム送信処理
     */
    handleSubmit() {
        const formData = {
            category: document.getElementById('category').value,
            subcategory: document.getElementById('subcategory').value,
            hours: document.getElementById('hours').value,
            memo: document.getElementById('memo').value.trim()
        };
        
        // バリデーション
        if (!this.validateForm(formData)) {
            return;
        }
        
        // データ保存
        if (this.editingId) {
            // 更新
            DataManager.update(this.editingId, formData);
            this.showNotification('データを更新しました', 'success');
            this.editingId = null;
            document.getElementById('submitBtnText').textContent = '➕ 追加';
        } else {
            // 新規追加
            DataManager.add(formData);
            this.showNotification('データを追加しました', 'success');
        }
        
        // 前回選択した技術分野を保存
        Storage.save('lastCategory', formData.category);
        Storage.save('lastSubcategory', formData.subcategory);
        
        // UI更新
        this.clearForm();
        this.renderDataList();
    },
    
    /**
     * フォームのバリデーション
     */
    validateForm(formData) {
        if (!formData.date) {
            this.showNotification('日付を選択してください', 'error');
            return false;
        }
        
        if (!formData.category) {
            this.showNotification('技術分野を選択してください', 'error');
            return false;
        }
        
        if (!formData.subcategory) {
            this.showNotification('小分類を選択してください', 'error');
            return false;
        }
        
        if (!formData.hours || parseFloat(formData.hours) <= 0) {
            this.showNotification('作業時間は0より大きい数値を入力してください', 'error');
            return false;
        }
        
        return true;
    },
    
    /**
     * フォームをクリア
     */
    clearForm() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
        document.getElementById('hours').value = '';
        document.getElementById('memo').value = '';
        
        // 編集モードをリセット
        this.editingId = null;
        document.getElementById('submitBtnText').textContent = '➕ 追加';
        
        // 前回選択した技術分野を保持
        const lastCategory = Storage.load('lastCategory');
        if (lastCategory) {
            document.getElementById('category').value = lastCategory;
            this.updateSubcategoryOptions(lastCategory);
            
            const lastSubcategory = Storage.load('lastSubcategory');
            if (lastSubcategory) {
                document.getElementById('subcategory').value = lastSubcategory;
            }
        }
    },
    
    /**
     * データ一覧を描画（今週のデータのみ表示）
     */
    renderDataList() {
        const container = document.getElementById('dataList');
        
        // 今週のデータを取得
        const data = DataManager.getThisWeek();
        
        if (data.length === 0) {
            container.innerHTML = '<p class="placeholder">この週のデータがありません</p>';
            return;
        }
        
        // データ一覧を生成（週単位でグループ化）
        let html = '';
        const totalHours = data.reduce((sum, item) => sum + parseFloat(item.hours), 0);
        
        html += `
            <div class="week-summary">
                <span>合計作業時間:</span>
                <span class="total-hours">${totalHours.toFixed(1)}h</span>
            </div>
        `;
        
        data.forEach(item => {
            const color = Config.getCategoryColor(item.category);
            html += `
                <div class="data-item-compact" data-id="${item.id}">
                    <span class="category-badge-small" style="background-color: ${color}">${item.category}</span>
                    <span class="subcategory-text-small">${item.subcategory}</span>
                    <span class="hours-text">${item.hours}h</span>
                    ${item.memo ? `<span class="compact-memo" title="${this.escapeHTML(item.memo)}">📝</span>` : ''}
                    <div class="compact-actions">
                        <button class="btn-icon-small" onclick="App.editEntry('${item.id}')" title="編集">✏️</button>
                        <button class="btn-icon-small btn-danger" onclick="App.deleteEntry('${item.id}')" title="削除">🗑️</button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },
    
    /**
     * データを編集
     */
    editEntry(id) {
        const data = DataManager.getById(id);
        if (!data) return;
        
        // フォームにデータを設定
        document.getElementById('category').value = data.category;
        this.updateSubcategoryOptions(data.category);
        document.getElementById('subcategory').value = data.subcategory;
        document.getElementById('hours').value = data.hours;
        document.getElementById('memo').value = data.memo;
        
        // 編集モードに設定
        this.editingId = id;
        document.getElementById('submitBtnText').textContent = '💾 更新';
        
        // フォームまでスクロール
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    /**
     * データを削除
     */
    deleteEntry(id) {
        if (!confirm('このデータを削除しますか？')) {
            return;
        }
        
        const success = DataManager.delete(id);
        
        if (success) {
            this.showNotification('データを削除しました', 'success');
            this.renderDataList();
        } else {
            this.showNotification('削除に失敗しました', 'error');
        }
    },
    
    /**
     * 全データを削除
     */
    clearAllData() {
        if (!confirm('すべてのデータを削除しますか？この操作は取り消せません。')) {
            return;
        }
        
        if (!confirm('本当によろしいですか？')) {
            return;
        }
        
        const success = DataManager.deleteAll();
        
        if (success) {
            this.showNotification('すべてのデータを削除しました', 'success');
            this.renderDataList();
        } else {
            this.showNotification('削除に失敗しました', 'error');
        }
    },
    
    /**
     * CSVファイルをインポート
     */
    async handleImport(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.name.endsWith('.csv')) {
            this.showNotification('CSVファイルを選択してください', 'error');
            return;
        }
        
        try {
            const text = await file.text();
            const result = this.parseAndImportCSV(text);
            
            if (result.success) {
                this.showNotification(`${result.count}件のデータをインポートしました`, 'success');
                this.renderDataList();
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Import error:', error);
            this.showNotification('ファイルの読み込みに失敗しました', 'error');
        }
        
        // ファイル選択をリセット
        event.target.value = '';
    },
    
    /**
     * CSV文字列を解析してデータをインポート
     */
    parseAndImportCSV(csvText) {
        try {
            const lines = csvText.trim().split('\n');
            
            if (lines.length < 2) {
                return { success: false, message: 'データが空です' };
            }
            
            // ヘッダーをチェック
            const header = lines[0];
            if (!header.includes('日付') || !header.includes('技術分野') || !header.includes('作業時間')) {
                return { success: false, message: 'CSVフォーマットが正しくありません' };
            }
            
            let importCount = 0;
            let skipCount = 0;
            
            // データ行を処理
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                
                const row = this.parseCSVLine(line);
                
                if (row.length >= 5) {
                    const entry = {
                        date: row[0],
                        category: row[1],
                        subcategory: row[2],
                        hours: row[3],
                        memo: row[4] || ''
                    };
                    
                    // バリデーション
                    if (this.validateImportEntry(entry)) {
                        DataManager.add(entry);
                        importCount++;
                    } else {
                        skipCount++;
                    }
                }
            }
            
            if (importCount === 0) {
                return { success: false, message: '有効なデータがありませんでした' };
            }
            
            return { 
                success: true, 
                count: importCount,
                message: skipCount > 0 ? `${importCount}件をインポート（${skipCount}件スキップ）` : `${importCount}件をインポート`
            };
            
        } catch (error) {
            console.error('Parse error:', error);
            return { success: false, message: 'CSVの解析に失敗しました' };
        }
    },
    
    /**
     * CSV行を解析（カンマ区切り、ダブルクォート対応）
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // エスケープされたクォート
                    current += '"';
                    i++;
                } else {
                    // クォートの開始/終了
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                // フィールドの区切り
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current);
        return result;
    },
    
    /**
     * インポートするデータのバリデーション
     */
    validateImportEntry(entry) {
        // 日付チェック
        if (!entry.date || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
            return false;
        }
        
        // 技術分野チェック
        const categories = Config.getCategories();
        if (!entry.category || !categories.includes(entry.category)) {
            return false;
        }
        
        // 小分類チェック
        const subcategories = Config.getSubcategories(entry.category);
        if (!entry.subcategory || !subcategories.includes(entry.subcategory)) {
            return false;
        }
        
        // 作業時間チェック
        const hours = parseFloat(entry.hours);
        if (isNaN(hours) || hours <= 0) {
            return false;
        }
        
        return true;
    },
    
    /**
     * 設定表示を切り替え
     */
    toggleConfigDisplay() {
        const configDisplay = document.getElementById('configDisplay');
        const toggleBtn = document.getElementById('toggleConfigBtn');
        
        if (configDisplay.style.display === 'none') {
            configDisplay.style.display = 'block';
            toggleBtn.textContent = '非表示';
            this.displayConfig();
        } else {
            configDisplay.style.display = 'none';
            toggleBtn.textContent = '表示';
        }
    },
    
    /**
     * 設定を表示
     */
    displayConfig() {
        const configDisplay = document.getElementById('configDisplay');
        
        if (!this.config) {
            configDisplay.innerHTML = '<p class="placeholder">設定が読み込まれていません</p>';
            return;
        }
        
        let html = '<div class="config-content">';
        
        Object.entries(this.config).forEach(([categoryName, categoryData]) => {
            html += `
                <div class="config-category">
                    <div class="config-category-header">
                        <div class="config-category-color" style="background-color: ${categoryData.color}"></div>
                        <div class="config-category-name">${categoryName}</div>
                        <div class="config-category-count">${categoryData.subcategories.length}個</div>
                    </div>
                    <div class="config-subcategories">
            `;
            
            categoryData.subcategories.forEach(sub => {
                html += `<span class="config-subcategory-tag">${sub}</span>`;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        
        configDisplay.innerHTML = html;
    },
    
    /**
     * 週データをエクスポート
     */
    exportWeek() {
        const result = CSVExporter.exportThisWeek();
        this.showNotification(result.message, result.success ? 'success' : 'error');
    },
    
    /**
     * 通知を表示
     */
    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    },
    
    /**
     * 日付をフォーマット
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
        const dayName = dayNames[date.getDay()];
        
        return `${year}/${month}/${day}(${dayName})`;
    },
    
    /**
     * HTMLエスケープ
     */
    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
};

// アプリケーション起動
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
