// CSVエクスポートモジュール
const CSVExporter = {
    /**
     * データ配列からCSV文字列を生成
     * @param {Array} data - データ配列
     * @param {string} weekStartDate - 週の開始日（オプション）
     */
    generateCSV(data, weekStartDate = null) {
        if (!data || data.length === 0) {
            return null;
        }
        
        let csv = '';
        
        // 週の開始日を先頭に追加（指定されている場合）
        if (weekStartDate) {
            csv += weekStartDate + '\n';
        }
        
        // ヘッダー（日付列を削除）
        const headers = ['技術分野', '小分類', '作業時間(h)', 'メモ'];
        csv += headers.join(',') + '\n';
        
        // データ行（日付を除く）
        data.forEach(item => {
            const row = [
                this.escapeCSVField(item.category),
                this.escapeCSVField(item.subcategory),
                item.hours,
                this.escapeCSVField(item.memo)
            ];
            csv += row.join(',') + '\n';
        });
        
        return csv;
    },
    
    /**
     * CSVフィールドのエスケープ処理
     */
    escapeCSVField(field) {
        if (field === null || field === undefined) {
            return '';
        }
        
        const stringField = String(field);
        
        // カンマ、改行、ダブルクォートを含む場合はダブルクォートで囲む
        if (stringField.includes(',') || stringField.includes('\n') || stringField.includes('"')) {
            // ダブルクォートを2つに重ねる
            return '"' + stringField.replace(/"/g, '""') + '"';
        }
        
        return stringField;
    },
    
    /**
     * CSVファイルとしてダウンロード
     */
    download(csvContent, filename) {
        if (!csvContent) {
            console.error('CSVコンテンツがありません');
            return false;
        }
        
        // BOMを付けてUTF-8として保存（Excelで文字化けしないように）
        const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
        
        // ダウンロードリンクを作成
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // メモリ解放
        URL.revokeObjectURL(url);
        
        return true;
    },
    
    /**
     * 今週のデータをエクスポート
     */
    exportThisWeek() {
        const data = DataManager.getThisWeek();
        
        if (data.length === 0) {
            return { success: false, message: '今週のデータがありません' };
        }
        
        const now = new Date();
        const { year, week } = DataManager.getWeekNumber(now);
        const weekStartDate = DataManager.getWeekStartDate(now);
        
        // ファイル名: YYYY-MM-DD_week_YYYY_WW.csv
        const filename = `${weekStartDate}_week_${year}_${String(week).padStart(2, '0')}.csv`;
        
        // CSV生成（週の開始日を含める）
        const csv = this.generateCSV(data, weekStartDate);
        const success = this.download(csv, filename);
        
        return {
            success,
            message: success ? `${filename} をダウンロードしました（${data.length}件）` : 'ダウンロードに失敗しました'
        };
    },
    
    /**
     * 今月のデータをエクスポート
     */
    exportThisMonth() {
        const data = DataManager.getThisMonth();
        
        if (data.length === 0) {
            return { success: false, message: '今月のデータがありません' };
        }
        
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const filename = `month_${year}_${month}.csv`;
        
        const csv = this.generateCSV(data);
        const success = this.download(csv, filename);
        
        return {
            success,
            message: success ? `${filename} をダウンロードしました（${data.length}件）` : 'ダウンロードに失敗しました'
        };
    },
    
    /**
     * すべてのデータをエクスポート
     */
    exportAll() {
        const data = DataManager.getAll();
        
        if (data.length === 0) {
            return { success: false, message: 'データがありません' };
        }
        
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const filename = `all_data_${year}_${month}_${day}.csv`;
        
        const csv = this.generateCSV(data);
        const success = this.download(csv, filename);
        
        return {
            success,
            message: success ? `${filename} をダウンロードしました（${data.length}件）` : 'ダウンロードに失敗しました'
        };
    }
};
