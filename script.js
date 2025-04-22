// Three.jsの基本要素
let scene, camera, renderer, controls;
// 立方体の配列
const cubes = [];
// マスクの配列
const masks = [];
// 立方体のサイズ
const cubeSize = 10;
// APIのベースURL
const API_BASE_URL = 'http://localhost:3000/api';
// WebSocketの接続
let socket;
// CSG操作用のオブジェクト
let csgEvaluator;
// 立方体の色をランダムに生成する関数
const getRandomColor = () => {
    return Math.floor(Math.random() * 16777215);
};

// WebSocketの初期化
function initWebSocket() {
    // WebSocketの接続
    socket = new WebSocket(`ws://${window.location.hostname}:3000`);
    
    // 接続イベント
    socket.addEventListener('open', (event) => {
        console.log('WebSocketサーバーに接続しました');
    });
    
    // メッセージ受信イベント
    socket.addEventListener('message', (event) => {
        const message = JSON.parse(event.data);
        
        switch (message.type) {
            case 'init':
                // 初期データを受信した場合、すべての立方体とマスクを表示
                handleInitMessage(message);
                break;
            case 'add':
                // 新しい立方体が追加された場合
                handleAddMessage(message);
                break;
            case 'add-mask':
                // 新しいマスクが追加された場合
                handleAddMaskMessage(message);
                break;
            case 'delete':
                // 立方体が削除された場合
                handleDeleteMessage(message);
                break;
            case 'delete-mask':
                // マスクが削除された場合
                handleDeleteMaskMessage(message);
                break;
            case 'clear':
                // すべての立方体が削除された場合
                handleClearMessage();
                break;
            case 'clear-masks':
                // すべてのマスクが削除された場合
                handleClearMasksMessage();
                break;
        }
    });
    
    // エラーイベント
    socket.addEventListener('error', (event) => {
        console.error('WebSocketエラー:', event);
    });
    
    // 切断イベント
    socket.addEventListener('close', (event) => {
        console.log('WebSocketサーバーから切断されました');
        // 再接続を試みる
        setTimeout(initWebSocket, 3000);
    });
}

// 初期データを処理する関数
function handleInitMessage(message) {
    // シーンから既存の立方体をすべて削除
    cubes.forEach(cube => scene.remove(cube));
    cubes.length = 0;
    
    // シーンから既存のマスクをすべて削除
    masks.forEach(mask => {
        if (mask.mesh) {
            scene.remove(mask.mesh);
        }
    });
    masks.length = 0;
    
    // 受信したすべての立方体を追加
    message.cubes.forEach(cubeData => {
        addCubeFromData(cubeData);
    });
    
    console.log(`${message.cubes.length}個の立方体を初期化しました`);
    
    // 受信したすべてのマスクを追加
    if (message.masks && message.masks.length > 0) {
        message.masks.forEach(maskData => {
            addMaskFromData(maskData);
        });
        console.log(`${message.masks.length}個のマスクを初期化しました`);
    }
}

// 立方体追加メッセージを処理する関数
function handleAddMessage(message) {
    // すでに表示されている立方体はスキップ
    if (cubes.some(cube => cube.userData && cube.userData.id === message.cube.id)) {
        return;
    }
    
    // 立方体を作成して表示
    addCubeFromData(message.cube);
    console.log(`新しい立方体が追加されました。ID: ${message.cube.id}`);
}

// 立方体削除メッセージを処理する関数
function handleDeleteMessage(message) {
    const index = cubes.findIndex(cube => cube.userData && cube.userData.id === message.id);
    if (index !== -1) {
        // シーンから立方体を削除
        scene.remove(cubes[index]);
        cubes.splice(index, 1);
        console.log(`立方体が削除されました。ID: ${message.id}`);
    }
}

// すべての立方体削除メッセージを処理する関数
function handleClearMessage() {
    // シーンから既存の立方体をすべて削除
    cubes.forEach(cube => scene.remove(cube));
    cubes.length = 0;
    console.log('すべての立方体が削除されました');
}

// マスク追加メッセージを処理する関数
function handleAddMaskMessage(message) {
    // すでに表示されているマスクはスキップ
    if (masks.some(mask => mask.id === message.mask.id)) {
        return;
    }
    
    // マスクを作成して表示
    addMaskFromData(message.mask);
    console.log(`新しいマスクが追加されました。ID: ${message.mask.id}`);
}

// マスク削除メッセージを処理する関数
function handleDeleteMaskMessage(message) {
    const index = masks.findIndex(mask => mask.id === message.id);
    if (index !== -1) {
        // マスクを削除
        removeMask(masks[index]);
        masks.splice(index, 1);
        console.log(`マスクが削除されました。ID: ${message.id}`);
    }
}

// すべてのマスク削除メッセージを処理する関数
function handleClearMasksMessage() {
    // すべてのマスクを削除
    masks.forEach(mask => {
        removeMask(mask);
    });
    masks.length = 0;
    console.log('すべてのマスクが削除されました');
}

// APIから取得したデータに基づいてマスクを追加する関数
function addMaskFromData(maskData) {
    // マスク対象のオブジェクトを検索
    const targetObject = cubes.find(cube => cube.userData && cube.userData.id === maskData.targetId);
    if (!targetObject) {
        console.error(`マスク対象のオブジェクトが見つかりません。ID: ${maskData.targetId}`);
        return null;
    }
    
    // マスク用の立方体ジオメトリを作成
    const maskGeometry = new THREE.BoxGeometry(maskData.size, maskData.size, maskData.size);
    
    // マスク用のメッシュを作成（表示用）
    const maskMaterial = new THREE.MeshStandardMaterial({
        color: 0xff0000,
        opacity: 0.5,
        transparent: true,
        wireframe: true
    });
    
    // マスクメッシュの作成
    const maskMesh = new THREE.Mesh(maskGeometry, maskMaterial);
    
    // マスクの位置を設定
    maskMesh.position.x = maskData.position.x;
    maskMesh.position.y = maskData.position.y;
    maskMesh.position.z = maskData.position.z;
    
    // マスクの回転を設定
    maskMesh.rotation.x = maskData.rotation.x;
    maskMesh.rotation.y = maskData.rotation.y;
    maskMesh.rotation.z = maskData.rotation.z;
    
    // マスクメッシュをシーンに追加（視覚的な表示のみ）
    scene.add(maskMesh);
    
    // マスク情報を保存
    const mask = {
        id: maskData.id,
        targetId: maskData.targetId,
        size: maskData.size,
        position: maskData.position,
        rotation: maskData.rotation,
        mesh: maskMesh
    };
    
    // マスク配列に追加
    masks.push(mask);
    
    console.log(`マスクが追加されました。ID: ${maskData.id}, 対象ID: ${maskData.targetId}`);
    
    return mask;
}

// マスクを削除する関数
function removeMask(mask) {
    // マスクメッシュがある場合は削除
    if (mask.mesh) {
        scene.remove(mask.mesh);
    }
}


// APIから取得したデータに基づいてオブジェクトを追加する関数
function addCubeFromData(cubeData) {
    let geometry;
    let objectType = "立方体";
    
    // オブジェクトのタイプに応じてジオメトリを作成
    if (cubeData.type === 'prism') {
        // 正n角柱の場合
        geometry = new THREE.CylinderGeometry(
            cubeData.radius,  // 上面の半径
            cubeData.radius,  // 底面の半径
            cubeData.height,  // 高さ
            cubeData.segments, // 底面の角の数
            1,                // 高さ方向の分割数
            false             // 開いた円柱にするかどうか
        );
        objectType = `正${cubeData.segments}角柱`;
    } else if (cubeData.type === 'sphere') {
        // 球体の場合
        geometry = new THREE.SphereGeometry(
            cubeData.radius,         // 半径
            cubeData.widthSegments,  // 横方向の分割数
            cubeData.heightSegments  // 縦方向の分割数
        );
        objectType = `球体`;
    } else {
        // デフォルトは立方体
        geometry = new THREE.BoxGeometry(cubeData.size, cubeData.size, cubeData.size);
    }
    
    // 色の処理
    let color = cubeData.color;
    // 色が数値であることを確認
    if (typeof color !== 'number') {
        console.error('Invalid color format:', color);
        color = 0xffffff; // デフォルトは白
    }
    
    // 色の値を16進数で表示（デバッグ用）
    const hexColor = color.toString(16).padStart(6, '0');
    console.log(`Creating ${objectType} with color: 0x${hexColor} (R:${parseInt(hexColor.substr(0,2), 16)}, G:${parseInt(hexColor.substr(2,2), 16)}, B:${parseInt(hexColor.substr(4,2), 16)})`);
    
    // マテリアルの作成
    const material = new THREE.MeshStandardMaterial({
        color: color,
        metalness: 0.3,
        roughness: 0.4,
    });
    
    // メッシュの作成
    const cube = new THREE.Mesh(geometry, material);
    
    // オブジェクトの位置を設定
    cube.position.x = cubeData.position.x;
    cube.position.y = cubeData.position.y;
    cube.position.z = cubeData.position.z;
    
    // オブジェクトの回転を設定
    cube.rotation.x = cubeData.rotation.x;
    cube.rotation.y = cubeData.rotation.y;
    cube.rotation.z = cubeData.rotation.z;
    
    // APIから取得したIDを保存
    cube.userData = { id: cubeData.id, type: cubeData.type };
    
    // シーンに追加
    scene.add(cube);
    
    // 配列に追加
    cubes.push(cube);
    
    console.log(`${objectType}が追加されました。ID: ${cubeData.id}, 現在のオブジェクト数: ${cubes.length}`);
    
    // 追加したオブジェクトを返す
    return cube;
}

// シーンの初期化
function init() {
    // シーンの作成
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    // カメラの設定
    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 1000;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(30, 30, 30);
    camera.lookAt(0, 0, 0);

    // レンダラーの設定
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('scene-container').appendChild(renderer.domElement);

    // OrbitControlsの設定
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // CSG操作は使用しない
    // csgEvaluator = new ThreeBVHCSG.CSGEvaluator();

    // 光源の追加
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // グリッドヘルパーの追加
    const gridHelper = new THREE.GridHelper(100, 10);
    scene.add(gridHelper);

    // 座標軸ヘルパーの追加
    const axesHelper = new THREE.AxesHelper(20);
    scene.add(axesHelper);

    // ウィンドウリサイズ時の処理
    window.addEventListener('resize', onWindowResize);

    // アニメーションループの開始
    animate();
}

// ウィンドウリサイズ時の処理
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// UIボタンから呼び出される立方体追加関数
async function addCube() {
    try {
        // APIを使用して立方体を追加
        const response = await fetch(`${API_BASE_URL}/cubes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });
        
        if (!response.ok) {
            throw new Error(`APIエラー: ${response.status}`);
        }
        
        const cubeData = await response.json();
        return addCubeFromData(cubeData);
    } catch (error) {
        console.error('APIを使用した立方体の追加に失敗しました:', error);
        
        // APIが失敗した場合はローカルで立方体を追加
        // ジオメトリの作成
        const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        
        // マテリアルの作成（ランダムな色）
        const material = new THREE.MeshStandardMaterial({
            color: getRandomColor(),
            metalness: 0.3,
            roughness: 0.4,
        });
        
        // メッシュの作成
        const cube = new THREE.Mesh(geometry, material);
        
        // 立方体の位置をランダムに設定
        const range = 50;
        cube.position.x = Math.random() * range - range / 2;
        cube.position.y = Math.random() * range / 2 + cubeSize / 2; // 地面より上に配置
        cube.position.z = Math.random() * range - range / 2;
        
        // 立方体を少し回転させる
        cube.rotation.x = Math.random() * Math.PI;
        cube.rotation.y = Math.random() * Math.PI;
        cube.rotation.z = Math.random() * Math.PI;
        
        // シーンに追加
        scene.add(cube);
        
        // 配列に追加
        cubes.push(cube);
        
        console.log(`立方体が追加されました。現在の立方体数: ${cubes.length}`);
        
        // 追加した立方体を返す
        return cube;
    }
}


// アニメーションループ
function animate() {
    requestAnimationFrame(animate);
    
    // コントロールの更新
    controls.update();
    
    // シーンのレンダリング
    renderer.render(scene, camera);
}

// STLファイルとしてエクスポートする関数
function exportToSTL() {
    // STLExporterのインスタンスを作成
    const exporter = new THREE.STLExporter();
    
    // シーン内のオブジェクトをSTL形式にエクスポート（バイナリ形式）
    const result = exporter.parse(scene, { binary: true });
    
    // Blobオブジェクトを作成
    const blob = new Blob([result], { type: 'application/octet-stream' });
    
    // ダウンロードリンクを作成
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'scene.stl';
    link.click();
    
    // URLオブジェクトを解放
    URL.revokeObjectURL(link.href);
    
    console.log('シーンがSTLファイルとしてエクスポートされました');
}

// DOMが読み込まれたら初期化
document.addEventListener('DOMContentLoaded', () => {
    init();
    
    // WebSocketの初期化
    initWebSocket();
    
    // STLエクスポートボタンのイベントリスナーを設定
    document.getElementById('export-stl-btn').addEventListener('click', exportToSTL);
});
