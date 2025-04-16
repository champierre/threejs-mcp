// Three.jsの基本要素
let scene, camera, renderer, controls;
// 立方体の配列
const cubes = [];
// 立方体のサイズ
const cubeSize = 10;
// APIのベースURL
const API_BASE_URL = 'http://localhost:3000/api';
// WebSocketの接続
let socket;
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
                // 初期データを受信した場合、すべての立方体を表示
                handleInitMessage(message);
                break;
            case 'add':
                // 新しい立方体が追加された場合
                handleAddMessage(message);
                break;
            case 'delete':
                // 立方体が削除された場合
                handleDeleteMessage(message);
                break;
            case 'clear':
                // すべての立方体が削除された場合
                handleClearMessage();
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
    
    // 受信したすべての立方体を追加
    message.cubes.forEach(cubeData => {
        addCubeFromData(cubeData);
    });
    
    console.log(`${message.cubes.length}個の立方体を初期化しました`);
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


// APIから取得したデータに基づいて立方体を追加する関数
function addCubeFromData(cubeData) {
    // ジオメトリの作成
    const geometry = new THREE.BoxGeometry(cubeData.size, cubeData.size, cubeData.size);
    
    // マテリアルの作成
    const material = new THREE.MeshStandardMaterial({
        color: cubeData.color,
        metalness: 0.3,
        roughness: 0.4,
    });
    
    // メッシュの作成
    const cube = new THREE.Mesh(geometry, material);
    
    // 立方体の位置を設定
    cube.position.x = cubeData.position.x;
    cube.position.y = cubeData.position.y;
    cube.position.z = cubeData.position.z;
    
    // 立方体の回転を設定
    cube.rotation.x = cubeData.rotation.x;
    cube.rotation.y = cubeData.rotation.y;
    cube.rotation.z = cubeData.rotation.z;
    
    // APIから取得したIDを保存
    cube.userData = { id: cubeData.id };
    
    // シーンに追加
    scene.add(cube);
    
    // 配列に追加
    cubes.push(cube);
    
    console.log(`立方体が追加されました。ID: ${cubeData.id}, 現在の立方体数: ${cubes.length}`);
    
    // 追加した立方体を返す
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

// DOMが読み込まれたら初期化
document.addEventListener('DOMContentLoaded', () => {
    init();
    
    // WebSocketの初期化
    initWebSocket();
});
