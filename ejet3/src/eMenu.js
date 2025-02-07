const { Menu } = require('electron')
const process = require('process')
const isMac = (process.platform === 'darwin')

const build = (name, menuEmitter) => {
    const template = [
        ...(isMac ? [{
            label: name,
            submenu: [
                { role: 'about', label: `${name} について` },
                { type: 'separator' },
                { role: 'services', label: 'サービス' },
                { type: 'separator' },
                { role: 'hide', label: `${name} を非表示にする` },
                { role: 'hideothers', label: 'その他を非表示にする' },
                { role: 'unhide', label: 'すべて表示' },
                { type: 'separator' },
                { role: 'quit', label: `${name} を終了` }
            ]
        }] : []),
        {
            label: 'ファイル',
            submenu: [
                isMac ? { role: 'close', label: 'ウィンドウを閉じる' } : { role: 'quit', label: '終了' }
            ]
        },
        {
            label: '編集',
            submenu: [
                { role: 'undo', label: '元に戻す' },
                { role: 'redo', label: 'やり直す' },
                { type: 'separator' },
                { role: 'cut', label: '切り取り' },
                { role: 'copy', label: 'コピー' },
                { role: 'paste', label: '貼り付け' },
                ...(isMac ? [
                    { role: 'pasteAndMatchStyle', label: 'ペーストしてスタイルを合わせる' },
                    { role: 'delete', label: '削除' },
                    { role: 'selectAll', label: 'すべてを選択' },
                    { type: 'separator' },
                    {
                        label: 'スピーチ',
                        submenu: [
                            { role: 'startSpeaking', label: '読み上げを開始' },
                            { role: 'stopSpeaking', label: '読み上げを停止' }
                        ]
                    }
                ] : [
                    { role: 'delete', label: '削除' },
                    { type: 'separator' },
                    { role: 'selectAll', label: 'すべてを選択' }
                ])
            ]
        },
        {
            label: '表示',
            submenu: [
                { role: 'reload', label: '再読み込み' },
                { role: 'forceReload', label: '強制的に再読み込み' },
                { role: 'toggleDevTools', label: '開発者ツールを表示' },
                { type: 'separator' },
                { role: 'resetZoom', label: '実際のサイズ' },
                { role: 'zoomIn', label: '拡大' },
                { role: 'zoomOut', label: '縮小' },
                { type: 'separator' },
                { role: 'togglefullscreen', label: 'フルスクリーン' }
            ]
        },
        {
            label: '資格確認',
            submenu: [
                {
                    label: '連携開始',
                    click: () => {
                        menuEmitter.emit('start-watching-res')
                    }
                },
                { type: 'separator' },
                {  
                    label: '連携停止',
                    click: () => {
                        menuEmitter.emit('stop-watching-res')
                    }
                }
            ]
        },
        {
            label: 'ウィンドウ',
            submenu: [
                { role: 'minimize', label: '最小化' },
                { role: 'zoom', label: 'ズーム' },
                ...(isMac ? [
                    { type: 'separator' },
                    { role: 'front', label: 'ウィンドウを手前に表示' },
                    { type: 'separator' },
                    { role: 'window', label: 'ウィンドウ' }
                ] : [
                    { role: 'close', label: '閉じる' }
                ])
            ]
        },
        {
            label: 'ヘルプ',
            submenu: [
                { label: `${name} ヘルプ` },    // ToDo
                ...(isMac ? [] : [
                    { type: 'separator' },
                    { role: 'about', label: `${name} について` }
                ])
            ]
        }
    ]
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
}

module.exports = {
    build
}
