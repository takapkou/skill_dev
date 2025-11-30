// 設定管理モジュール
const Config = {
    config: null,
    
    /**
     * 設定ファイルを読み込む
     */
    async loadConfig() {
        try {
            const response = await fetch('config.json');
            if (response.ok) {
                this.config = await response.json();
            } else {
                console.warn('config.jsonが見つかりません。デフォルト設定を使用します。');
                this.config = this.getDefaultConfig();
            }
        } catch (error) {
            console.warn('設定ファイルの読み込みに失敗しました。デフォルト設定を使用します。', error);
            this.config = this.getDefaultConfig();
        }
        return this.config;
    },
    
    /**
     * デフォルト設定を取得
     */
    getDefaultConfig() {
        return {
            "Linuxアプリ": {
                "color": "#4CAF50",
                "subcategories": [
                    "プロセス間通信",
                    "チップ間通信",
                    "機器間通信",
                    "オーディオ処理"
                ]
            },
            "Linuxカーネル": {
                "color": "#2196F3",
                "subcategories": [
                    "デバイス制御",
                    "デバイス設定"
                ]
            },
            "Linux uboot": {
                "color": "#FF9800",
                "subcategories": [
                    "デバイス制御",
                    "デバイス設定"
                ]
            },
            "Linux rootfs": {
                "color": "#9C27B0",
                "subcategories": [
                    "デバイス制御",
                    "デバイス設定"
                ]
            },
            "RTOS DSPソフト": {
                "color": "#F44336",
                "subcategories": [
                    "デバイス制御",
                    "デバイス設定"
                ]
            }
        };
    },
    
    /**
     * 技術分野一覧を取得
     */
    getCategories() {
        return Object.keys(this.config);
    },
    
    /**
     * 指定した技術分野の小分類を取得
     */
    getSubcategories(category) {
        return this.config[category]?.subcategories || [];
    },
    
    /**
     * 技術分野の色を取得
     */
    getCategoryColor(category) {
        return this.config[category]?.color || '#999999';
    }
};
