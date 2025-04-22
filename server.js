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
const MASKS_FILE = path.join(__dirname, 'masks.json');

// CORSを有効にする
app.use(cors());

// JSONリクエストを解析する
app.use(bodyParser.json());

// 静的ファイルを提供する
app.use(express.static('./'));

// 立体データを保存する配列
let cubes = [];

// マスク情報を保存する配列
let masks = [];

// WebSocketクライアントの接続を管理
const clients = new Set();

// WebSocketの接続イベント
wss.on('connection', (ws) => {
    console.log('クライアントが接続しました');
    
    // クライアントをセットに追加
    clients.add(ws);
    
    // 接続時に現在の立体データとマスクデータを送信
    ws.send(JSON.stringify({
        type: 'init',
        cubes: cubes,
        masks: masks
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

// マスクデータをファイルに保存する
function saveMasksData() {
    try {
        fs.writeFileSync(MASKS_FILE, JSON.stringify(masks, null, 2), 'utf8');
        console.log(`${masks.length}個のマスクデータを保存しました`);
    } catch (error) {
        console.error('マスクデータの保存に失敗しました:', error);
    }
}

// データファイルからマスクデータを読み込む
function loadMasksData() {
    try {
        if (fs.existsSync(MASKS_FILE)) {
            const data = fs.readFileSync(MASKS_FILE, 'utf8');
            masks = JSON.parse(data);
            console.log(`${masks.length}個のマスクデータを読み込みました`);
        } else {
            console.log('マスクデータファイルが存在しません。新しいファイルを作成します。');
            saveMasksData();
        }
    } catch (error) {
        console.error('マスクデータの読み込みに失敗しました:', error);
    }
}

// 起動時にデータを読み込む
loadCubesData();
loadMasksData();

// 立体の色をランダムに生成する関数
const getRandomColor = () => {
    return Math.floor(Math.random() * 16777215);
};

// 立体を追加するAPIエンドポイント
app.post('/api/cubes', (req, res) => {
    console.log('Received request body:', JSON.stringify(req.body, null, 2));
    const options = req.body || {};
    
    // デフォルト値を設定
    const cube = {
        id: Date.now(), // ユニークIDとして現在のタイムスタンプを使用
        type: 'cube', // オブジェクトのタイプを指定
        size: options.size || 10,
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
    
    // 立体を配列に追加
    cubes.push(cube);
    
    // データをファイルに保存
    saveCubesData();
    
    // WebSocketクライアントに通知
    notifyClients({
        type: 'add',
        cube: cube
    });
    
    console.log(`立体が追加されました。ID: ${cube.id}, 現在の立体数: ${cubes.length}`);
    
    // 追加した立体を返す
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

// 立方体マスクを追加するAPIエンドポイント
app.post('/api/cube-masks', (req, res) => {
    console.log('Received cube mask request body:', JSON.stringify(req.body, null, 2));
    const options = req.body || {};
    
    // デフォルト値を設定
    const cubeMask = {
        id: Date.now(), // ユニークIDとして現在のタイムスタンプを使用
        type: 'cube-mask', // オブジェクトのタイプを指定
        size: options.size || 5, // マスクの立方体のサイズ
        targetId: options.targetId, // マスク対象のオブジェクトID
        position: options.position || {
            x: 0,
            y: 0,
            z: 0
        },
        rotation: options.rotation || {
            x: 0,
            y: 0,
            z: 0
        }
    };
    
    // マスク対象のオブジェクトが存在するか確認
    const targetObject = cubes.find(c => c.id === cubeMask.targetId);
    if (!targetObject) {
        return res.status(404).json({ error: 'マスク対象のオブジェクトが見つかりません' });
    }
    
    // マスクを配列に追加
    masks.push(cubeMask);
    
    // データをファイルに保存
    saveMasksData();
    
    // WebSocketクライアントに通知
    notifyClients({
        type: 'add-mask',
        mask: cubeMask
    });
    
    console.log(`立方体マスクが追加されました。ID: ${cubeMask.id}, 対象ID: ${cubeMask.targetId}`);
    
    // 追加したマスクを返す
    res.status(201).json(cubeMask);
});

// すべての立体を取得するAPIエンドポイント
app.get('/api/cubes', (req, res) => {
    res.json(cubes);
});

// すべてのマスクを取得するAPIエンドポイント
app.get('/api/cube-masks', (req, res) => {
    res.json(masks);
});

// 特定の立体を取得するAPIエンドポイント
app.get('/api/cubes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const cube = cubes.find(c => c.id === id);
    
    if (cube) {
        res.json(cube);
    } else {
        res.status(404).json({ error: '立体が見つかりません' });
    }
});

// 特定の立体を削除するAPIエンドポイント
app.delete('/api/cubes/:id', (req, res) => {
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
app.delete('/api/cubes', (req, res) => {
    cubes.length = 0;
    
    // データをファイルに保存
    saveCubesData();
    
    // WebSocketクライアントに通知
    notifyClients({
        type: 'clear'
    });
    
    res.status(200).json({ message: 'すべての立体が削除されました' });
});

// 特定のマスクを削除するAPIエンドポイント
app.delete('/api/cube-masks/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = masks.findIndex(m => m.id === id);
    
    if (index !== -1) {
        const deletedMask = masks[index];
        masks.splice(index, 1);
        
        // データをファイルに保存
        saveMasksData();
        
        // WebSocketクライアントに通知
        notifyClients({
            type: 'delete-mask',
            id: id
        });
        
        res.status(200).json({ message: 'マスクが削除されました' });
    } else {
        res.status(404).json({ error: 'マスクが見つかりません' });
    }
});

// すべてのマスクを削除するAPIエンドポイント
app.delete('/api/cube-masks', (req, res) => {
    masks.length = 0;
    
    // データをファイルに保存
    saveMasksData();
    
    // WebSocketクライアントに通知
    notifyClients({
        type: 'clear-masks'
    });
    
    res.status(200).json({ message: 'すべてのマスクが削除されました' });
});

// サーバーを起動
server.listen(port, () => {
    console.log(`サーバーが http://localhost:${port} で起動しました`);
    console.log(`WebSocketサーバーが ws://localhost:${port} で起動しました`);
});
