// データ管理モジュール
const DataManager = {
    data: [],
    storageKey: 'workTimeData',
    weekStartDate: null, // 現在設定されている週の開始日
    
    /**
     * 初期化 - localStorageからデータを読み込む
     */
    init() {
        const loadedData = Storage.load(this.storageKey);
        this.data = loadedData || [];
        
        // 週の開始日を初期化（今週の月曜日）
        this.weekStartDate = this.getWeekStartDate(new Date());
        
        return this.data;
    },
    
    /**
     * データを保存
     */
    save() {
        return Storage.save(this.storageKey, this.data);
    },
    
    /**
     * 新規データを追加
     */
    add(entry) {
        const newEntry = {
            id: this.generateId(),
            weekStartDate: this.weekStartDate, // 週の開始日を使用
            category: entry.category,
            subcategory: entry.subcategory,
            hours: parseFloat(entry.hours),
            memo: entry.memo || '',
            createdAt: Date.now()
        };
        
        this.data.push(newEntry);
        this.save();
        return newEntry;
    },
    
    /**
     * データを更新
     */
    update(id, entry) {
        const index = this.data.findIndex(item => item.id === id);
        if (index === -1) return null;
        
        this.data[index] = {
            ...this.data[index],
            category: entry.category,
            subcategory: entry.subcategory,
            hours: parseFloat(entry.hours),
            memo: entry.memo || ''
        };
        
        this.save();
        return this.data[index];
    },
    
    /**
     * データを削除
     */
    delete(id) {
        const index = this.data.findIndex(item => item.id === id);
        if (index === -1) return false;
        
        this.data.splice(index, 1);
        this.save();
        return true;
    },
    
    /**
     * すべてのデータを削除
     */
    deleteAll() {
        this.data = [];
        return this.save();
    },
    
    /**
     * すべてのデータを取得（週の開始日降順、同じ週内では作成日時順）
     */
    getAll() {
        return [...this.data].sort((a, b) => {
            // 週の開始日で比較
            const weekCompare = (b.weekStartDate || '').localeCompare(a.weekStartDate || '');
            if (weekCompare !== 0) return weekCompare;
            // 同じ週内では作成日時順
            return (b.createdAt || 0) - (a.createdAt || 0);
        });
    },
    
    /**
     * IDでデータを取得
     */
    getById(id) {
        return this.data.find(item => item.id === id);
    },
    
    /**
     * 期間指定でデータを取得（週の開始日で判定）
     */
    getByDateRange(startDate, endDate) {
        return this.data.filter(item => {
            const itemDate = item.weekStartDate || item.date; // 後方互換性のためdateもチェック
            return itemDate >= startDate && itemDate <= endDate;
        }).sort((a, b) => {
            const dateA = a.weekStartDate || a.date || '';
            const dateB = b.weekStartDate || b.date || '';
            return dateA.localeCompare(dateB);
        });
    },
    
    /**
     * 今週のデータを取得（現在設定されている週の開始日を使用）
     */
    getThisWeek() {
        return this.data.filter(item => {
            return item.weekStartDate === this.weekStartDate;
        }).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    },
    
    /**
     * 今月のデータを取得
     */
    getThisMonth() {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        return this.getByDateRange(firstDay.toISOString().split('T')[0], lastDay.toISOString().split('T')[0]);
    },
    
    /**
     * 統計情報を取得
     */
    getStatistics() {
        const thisWeek = this.getThisWeek();
        const thisMonth = this.getThisMonth();
        
        const weekTotal = thisWeek.reduce((sum, item) => sum + item.hours, 0);
        const monthTotal = thisMonth.reduce((sum, item) => sum + item.hours, 0);
        
        return {
            weekTotal: weekTotal.toFixed(1),
            monthTotal: monthTotal.toFixed(1),
            totalCount: this.data.length
        };
    },
    
    /**
     * ユニークIDを生成（簡易版UUID）
     */
    generateId() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    
    /**
     * 週番号を取得（ISO 8601形式）
     */
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        return { year: d.getUTCFullYear(), week: weekNo };
    },
    
    /**
     * 週の開始日（月曜日）を取得
     * @param {Date} date - 基準日
     * @returns {string} - YYYY-MM-DD形式の週開始日
     */
    getWeekStartDate(date) {
        const d = new Date(date);
        const dayOfWeek = d.getDay();
        // 日曜日の場合は6日戻す、それ以外は曜日-1日戻す
        const monday = new Date(d);
        monday.setDate(d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        
        // YYYY-MM-DD形式で返す
        const year = monday.getFullYear();
        const month = String(monday.getMonth() + 1).padStart(2, '0');
        const day = String(monday.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
};
