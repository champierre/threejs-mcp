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

// 立方体データを保存する配列
let cubes = [];

// WebSocketクライアントの接続を管理
const clients = new Set();

// WebSocketの接続イベント
wss.on('connection', (ws) => {
    console.log('クライアントが接続しました');
    
    // クライアントをセットに追加
    clients.add(ws);
    
    // 接続時に現在の立方体データを送信
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

// データファイルから立方体データを読み込む
function loadCubesData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            cubes = JSON.parse(data);
            console.log(`${cubes.length}個の立方体データを読み込みました`);
        } else {
            console.log('データファイルが存在しません。新しいファイルを作成します。');
            saveCubesData();
        }
    } catch (error) {
        console.error('データの読み込みに失敗しました:', error);
    }
}

// 立方体データをファイルに保存する
function saveCubesData() {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(cubes, null, 2), 'utf8');
        console.log(`${cubes.length}個の立方体データを保存しました`);
    } catch (error) {
        console.error('データの保存に失敗しました:', error);
    }
}

// 起動時にデータを読み込む
loadCubesData();

// 立方体の色をランダムに生成する関数
const getRandomColor = () => {
    return Math.floor(Math.random() * 16777215);
};

// 立方体を追加するAPIエンドポイント
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
    
    // 立方体を配列に追加
    cubes.push(cube);
    
    // データをファイルに保存
    saveCubesData();
    
    // WebSocketクライアントに通知
    notifyClients({
        type: 'add',
        cube: cube
    });
    
    console.log(`立方体が追加されました。ID: ${cube.id}, 現在の立方体数: ${cubes.length}`);
    
    // 追加した立方体を返す
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

// すべての立方体を取得するAPIエンドポイント
app.get('/api/cubes', (req, res) => {
    res.json(cubes);
});

// 特定の立方体を取得するAPIエンドポイント
app.get('/api/cubes/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const cube = cubes.find(c => c.id === id);
    
    if (cube) {
        res.json(cube);
    } else {
        res.status(404).json({ error: '立方体が見つかりません' });
    }
});

// 特定の立方体を削除するAPIエンドポイント
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
        
        res.status(200).json({ message: '立方体が削除されました' });
    } else {
        res.status(404).json({ error: '立方体が見つかりません' });
    }
});

// すべての立方体を削除するAPIエンドポイント
app.delete('/api/cubes', (req, res) => {
    cubes.length = 0;
    
    // データをファイルに保存
    saveCubesData();
    
    // WebSocketクライアントに通知
    notifyClients({
        type: 'clear'
    });
    
    res.status(200).json({ message: 'すべての立方体が削除されました' });
});

// サーバーを起動
server.listen(port, () => {
    console.log(`サーバーが http://localhost:${port} で起動しました`);
    console.log(`WebSocketサーバーが ws://localhost:${port} で起動しました`);
});
