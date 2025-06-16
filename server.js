const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const port = 3000;

// HTTPサーバーの作成
const server = http.createServer(app);

// WebSocketサーバーの作成
const wss = new WebSocket.Server({ server });

// データファイルのパス
const DATA_FILE = path.join(__dirname, 'data.json');

// CORSを有効にする
app.use(cors());

// JSONリクエストを解析する
app.use(bodyParser.json());

// 静的ファイルを提供する
app.use(express.static('./'));

// 立体データを保存する配列
let cubes = [];

// WebSocketクライアントの接続を管理
const clients = new Set();

// WebSocketの接続イベント
wss.on('connection', (ws) => {
    console.log('クライアントが接続しました');
    
    // クライアントをセットに追加
    clients.add(ws);
    
    // 接続時に現在の立体データを送信
    ws.send(JSON.stringify({
        type: 'init',
        cubes: cubes
    }));
    
    // 切断イベント
    ws.on('close', () => {
        console.log('クライアントが切断しました');
        clients.delete(ws);
    });
});

// すべてのクライアントに通知を送信する関数
function notifyClients(message) {
    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
}

// データファイルから立体データを読み込む
function loadCubesData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            cubes = JSON.parse(data);
            console.log(`${cubes.length}個の立体データを読み込みました`);
        } else {
            console.log('データファイルが存在しません。新しいファイルを作成します。');
            saveCubesData();
        }
    } catch (error) {
        console.error('データの読み込みに失敗しました:', error);
    }
}

// 立体データをファイルに保存する
function saveCubesData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(cubes, null, 2), 'utf8');
        console.log(`${cubes.length}個の立体データを保存しました`);
    } catch (error) {
        console.error('データの保存に失敗しました:', error);
    }
}

// 起動時にデータを読み込む
loadCubesData();

// 立体の色をランダムに生成する関数
const getRandomColor = () => {
    return Math.floor(Math.random() * 16777215);
};

// 直方体を追加するAPIエンドポイント
app.post('/api/boxes', (req, res) => {
    console.log('Received request body:', JSON.stringify(req.body, null, 2));
    const options = req.body || {};
    
    // 色の処理
    let color;
    if (options.color) {
        if (typeof options.color === 'string' && options.color.startsWith('#')) {
            // 16進数形式の色コードを10進数に変換
            color = parseInt(options.color.substring(1), 16);
        } else if (typeof options.color === 'object' && 'r' in options.color) {
            // RGB形式の色を10進数に変換
            const { r, g, b } = options.color;
            color = (r << 16) | (g << 8) | b;
        } else {
            // 数値として扱う
            color = options.color;
        }
    } else {
        color = getRandomColor();
    }
    
    // デフォルト値を設定
    const cube = {
        id: Date.now(), // ユニークIDとして現在のタイムスタンプを使用
        type: 'box', // オブジェクトのタイプを指定
        width: options.width || 10,
        height: options.height || 10,
        depth: options.depth || 10,
        color: color,
        position: options.position || {
            x: Math.random() * 50 - 25,
            y: Math.random() * 25 + 5,
            z: Math.random() * 50 - 25
        },
        rotation: options.rotation || {
            x: Math.random() * Math.PI,
            y: Math.random() * Math.PI,
            z: Math.random() * Math.PI
        }
    };
    
    // 立体を配列に追加
    cubes.push(cube);
    
    // データをファイルに保存
    saveCubesData();
    
    // WebSocketクライアントに通知
    notifyClients({
        type: 'add',
        cube: cube
    });
    
    console.log(`直方体が追加されました。ID: ${cube.id}, 現在の立体数: ${cubes.length}`);
    
    // 追加した直方体を返す
    res.status(201).json(cube);
});

// 正n角柱を追加するAPIエンドポイント
app.post('/api/prisms', (req, res) => {
    console.log('Received prism request body:', JSON.stringify(req.body, null, 2));
    const options = req.body || {};
    
    // デフォルト値を設定
    const prism = {
        id: Date.now(), // ユニークIDとして現在のタイムスタンプを使用
        type: 'prism', // オブジェクトのタイプを指定
        radius: options.radius || 5, // 底面の半径
        height: options.height || 10, // 高さ
        segments: options.segments || 6, // 底面の角の数（デフォルトは6角形）
        color: options.color || getRandomColor(),
        position: options.position || {
            x: Math.random() * 50 - 25,
            y: Math.random() * 25 + 5,
            z: Math.random() * 50 - 25
        },
        rotation: options.rotation || {
            x: Math.random() * Math.PI,
            y: Math.random() * Math.PI,
            z: Math.random() * Math.PI
        }
    };
    
    // 正n角柱を配列に追加（同じcubes配列を使用）
    cubes.push(prism);
    
    // データをファイルに保存
    saveCubesData();
    
    // WebSocketクライアントに通知
    notifyClients({
        type: 'add',
        cube: prism
    });
    
    console.log(`正${prism.segments}角柱が追加されました。ID: ${prism.id}, 現在のオブジェクト数: ${cubes.length}`);
    
    // 追加した正n角柱を返す
    res.status(201).json(prism);
});

// 球体を追加するAPIエンドポイント
app.post('/api/spheres', (req, res) => {
    console.log('Received sphere request body:', JSON.stringify(req.body, null, 2));
    const options = req.body || {};
    
    // デフォルト値を設定
    const sphere = {
        id: Date.now(), // ユニークIDとして現在のタイムスタンプを使用
        type: 'sphere', // オブジェクトのタイプを指定
        radius: options.radius || 5, // 球体の半径
        widthSegments: options.widthSegments || 32, // 横方向の分割数
        heightSegments: options.heightSegments || 16, // 縦方向の分割数
        color: options.color || getRandomColor(),
        position: options.position || {
            x: Math.random() * 50 - 25,
            y: Math.random() * 25 + 5,
            z: Math.random() * 50 - 25
        },
        rotation: options.rotation || {
            x: Math.random() * Math.PI,
            y: Math.random() * Math.PI,
            z: Math.random() * Math.PI
        }
    };
    
    // 球体を配列に追加（同じcubes配列を使用）
    cubes.push(sphere);
    
    // データをファイルに保存
    saveCubesData();
    
    // WebSocketクライアントに通知
    notifyClients({
        type: 'add',
        cube: sphere
    });
    
    console.log(`球体が追加されました。ID: ${sphere.id}, 現在のオブジェクト数: ${cubes.length}`);
    
    // 追加した球体を返す
    res.status(201).json(sphere);
});

// 正n角錐を追加するAPIエンドポイント
app.post('/api/pyramids', (req, res) => {
    console.log('Received pyramid request body:', JSON.stringify(req.body, null, 2));
    const options = req.body || {};
    
    // デフォルト値を設定
    const pyramid = {
        id: Date.now(), // ユニークIDとして現在のタイムスタンプを使用
        type: 'pyramid', // オブジェクトのタイプを指定
        radius: options.radius || 5, // 底面の半径
        height: options.height || 10, // 高さ
        segments: options.segments || 4, // 底面の角の数（デフォルトは4角錐）
        color: options.color || getRandomColor(),
        position: options.position || {
            x: Math.random() * 50 - 25,
            y: Math.random() * 25 + 5,
            z: Math.random() * 50 - 25
        },
        rotation: options.rotation || {
            x: Math.random() * Math.PI,
            y: Math.random() * Math.PI,
            z: Math.random() * Math.PI
        }
    };
    
    // 正n角錐を配列に追加（同じcubes配列を使用）
    cubes.push(pyramid);
    
    // データをファイルに保存
    saveCubesData();
    
    // WebSocketクライアントに通知
    notifyClients({
        type: 'add',
        cube: pyramid
    });
    
    console.log(`正${pyramid.segments}角錐が追加されました。ID: ${pyramid.id}, 現在のオブジェクト数: ${cubes.length}`);
    
    // 追加した正n角錐を返す
    res.status(201).json(pyramid);
});

// すべての立体を取得するAPIエンドポイント
app.get('/api/boxes', (req, res) => {
    res.json(cubes);
});

// 特定の立体を取得するAPIエンドポイント
app.get('/api/boxes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const cube = cubes.find(c => c.id === id);
    
    if (cube) {
        res.json(cube);
    } else {
        res.status(404).json({ error: '立体が見つかりません' });
    }
});

// 特定の立体を削除するAPIエンドポイント
app.delete('/api/boxes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = cubes.findIndex(c => c.id === id);
    
    if (index !== -1) {
        const deletedCube = cubes[index];
        cubes.splice(index, 1);
        
        // データをファイルに保存
        saveCubesData();
        
        // WebSocketクライアントに通知
        notifyClients({
            type: 'delete',
            id: id
        });
        
        res.status(200).json({ message: '立体が削除されました' });
    } else {
        res.status(404).json({ error: '立体が見つかりません' });
    }
});

// すべての立体を削除するAPIエンドポイント
app.delete('/api/boxes', (req, res) => {
    cubes.length = 0;
    
    // データをファイルに保存
    saveCubesData();
    
    // WebSocketクライアントに通知
    notifyClients({
        type: 'clear'
    });
    
    res.status(200).json({ message: 'すべての立体が削除されました' });
});

// CSG減算操作を行うAPIエンドポイント
app.post('/api/subtract', (req, res) => {
    console.log('Received subtraction request body:', JSON.stringify(req.body, null, 2));
    const options = req.body || {};
    
    if (!options.fromId || !options.subtractId) {
        return res.status(400).json({ error: '必須パラメータが不足しています。fromIdとsubtractIdが必要です。' });
    }
    
    const fromId = parseInt(options.fromId);
    const subtractId = parseInt(options.subtractId);
    
    const fromObject = cubes.find(c => c.id === fromId);
    const subtractObject = cubes.find(c => c.id === subtractId);
    
    if (!fromObject || !subtractObject) {
        return res.status(404).json({ error: '指定されたIDの立体が見つかりません' });
    }
    
    console.log(`削除前の立体数: ${cubes.length}`);
    console.log(`deleteOriginalsフラグ: ${options.deleteOriginals}`);
    
    // 色の処理
    let color = options.color || fromObject.color;
    if (typeof color === 'object' && 'r' in color) {
        // RGB形式の色を10進数に変換
        const { r, g, b } = color;
        color = (r << 16) | (g << 8) | b;
    }
    
    const subtractedObject = {
        id: Date.now(),
        type: 'subtracted',
        fromId: fromId,
        subtractId: subtractId,
        fromType: fromObject.type,
        subtractType: subtractObject.type,
        fromData: { ...fromObject },
        subtractData: { ...subtractObject },
        color: color,
        position: options.position || fromObject.position,
        rotation: options.rotation || fromObject.rotation
    };
    
    // まず元の立体を削除（deleteOriginalsフラグに関係なく常に削除）
    const fromIndex = cubes.findIndex(c => c.id === fromId);
    const subtractIndex = cubes.findIndex(c => c.id === subtractId);
    
    console.log(`fromIndex: ${fromIndex}, subtractIndex: ${subtractIndex}`);
    
    // 削除対象のIDを記録
    const deletedIds = [];
    
    // 削除インデックスを降順でソートして、配列のインデックスがずれないようにする
    const indicesToDelete = [fromIndex, subtractIndex].filter(index => index !== -1).sort((a, b) => b - a);
    
    console.log(`削除するインデックス: ${indicesToDelete}`);
    
    indicesToDelete.forEach(index => {
        const deletedCube = cubes[index];
        deletedIds.push(deletedCube.id);
        cubes.splice(index, 1);
        console.log(`元の立体が削除されました。ID: ${deletedCube.id}`);
    });
    
    // 立体を配列に追加
    cubes.push(subtractedObject);
    
    console.log(`削除後の立体数: ${cubes.length}`);
    
    // データをファイルに保存
    saveCubesData();
    
    // WebSocketクライアントに削除通知を送信
    deletedIds.forEach(id => {
        notifyClients({
            type: 'delete',
            id: id
        });
    });
    
    // WebSocketクライアントに追加通知を送信
    notifyClients({
        type: 'add',
        cube: subtractedObject
    });
    
    console.log(`減算された立体が追加されました。ID: ${subtractedObject.id}, 現在の立体数: ${cubes.length}`);
    
    // 削除されたIDと追加された立体の情報を返す
    res.status(201).json({
        subtractedObject: subtractedObject,
        deletedIds: deletedIds
    });
});

// スクリーンショットを取得するAPIエンドポイント
app.get('/api/screenshot', async (req, res) => {
    try {
        // クライアントからキャンバスデータを取得するために、
        // WebSocketで特別なメッセージを送信
        const screenshotPromise = new Promise((resolve, reject) => {
            const screenshotId = Date.now();
            
            // タイムアウト設定
            const timeout = setTimeout(() => {
                reject(new Error('スクリーンショット取得タイムアウト'));
            }, 5000);
            
            // 一時的なメッセージハンドラー
            const messageHandler = (ws, data) => {
                try {
                    const msg = JSON.parse(data);
                    if (msg.type === 'screenshot' && msg.screenshotId === screenshotId) {
                        clearTimeout(timeout);
                        resolve(msg.data);
                    }
                } catch (err) {
                    // JSONパースエラーは無視
                }
            };
            
            // すべてのクライアントにスクリーンショット要求を送信
            let responsiveClient = null;
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    // メッセージハンドラーを設定
                    client.once('message', (data) => messageHandler(client, data));
                    
                    // スクリーンショット要求を送信
                    client.send(JSON.stringify({
                        type: 'screenshot_request',
                        screenshotId: screenshotId
                    }));
                    
                    if (!responsiveClient) {
                        responsiveClient = client;
                    }
                }
            });
            
            if (!responsiveClient) {
                clearTimeout(timeout);
                reject(new Error('接続されているクライアントがありません'));
            }
        });
        
        const screenshotData = await screenshotPromise;
        
        // Base64データURLからバイナリデータに変換
        const base64Data = screenshotData.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // ファイルとして保存（オプション）
        const screenshotPath = path.join(__dirname, 'screenshots', `screenshot_${Date.now()}.png`);
        
        // スクリーンショットディレクトリがなければ作成
        const screenshotDir = path.join(__dirname, 'screenshots');
        if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir);
        }
        
        fs.writeFileSync(screenshotPath, buffer);
        
        res.json({ 
            success: true, 
            message: 'スクリーンショットが取得されました',
            path: screenshotPath,
            dataUrl: screenshotData
        });
        
    } catch (error) {
        console.error('スクリーンショット取得エラー:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});


// サーバーを起動
server.listen(port, () => {
    console.log(`サーバーが http://localhost:${port} で起動しました`);
    console.log(`WebSocketサーバーが ws://localhost:${port} で起動しました`);
});
