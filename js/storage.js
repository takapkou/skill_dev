// localStorageラッパーモジュール
const Storage = {
    /**
     * データを保存
     */
    save(key, data) {
        try {
            const jsonData = JSON.stringify(data);
            localStorage.setItem(key, jsonData);
            return true;
        } catch (error) {
            console.error('データの保存に失敗しました:', error);
            return false;
        }
    },
    
    /**
     * データを読み込み
     */
    load(key) {
        try {
            const jsonData = localStorage.getItem(key);
            return jsonData ? JSON.parse(jsonData) : null;
        } catch (error) {
            console.error('データの読み込みに失敗しました:', error);
            return null;
        }
    },
    
    /**
     * データを削除
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('データの削除に失敗しました:', error);
            return false;
        }
    },
    
    /**
     * すべてのデータをクリア
     */
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('データのクリアに失敗しました:', error);
            return false;
        }
    }
};
