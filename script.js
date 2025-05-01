// Three.jsの基本要素
let scene, camera, renderer, controls;
const cubes = [];
// 立方体のサイズ
const cubeSize = 10;
// APIのベースURL
const API_BASE_URL = 'http://localhost:3000/api';
// WebSocketの接続
let socket;

// CSGモジュールのインポート
let Brush, Evaluator, SUBTRACTION;

// CSGモジュールの読み込み
async function loadCSGModule() {
    const { Brush: BrushModule, Evaluator: EvaluatorModule, SUBTRACTION: SUBTRACTIONModule } = await import('three-bvh-csg');
    Brush = BrushModule;
    Evaluator = EvaluatorModule;
    SUBTRACTION = SUBTRACTIONModule;
    console.log('CSGモジュールが読み込まれました');
}
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


// APIから取得したデータに基づいてオブジェクトを追加する関数
function addCubeFromData(cubeData) {
    let geometry;
    let objectType = "立方体";
    let mesh;
    
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
    } else if (cubeData.type === 'subtracted') {
        // CSGモジュールが読み込まれていることを確認
        if (!Brush || !Evaluator || !SUBTRACTION) {
            console.error('CSGモジュールが読み込まれていません');
            return null;
        }
        
        const fromData = cubeData.fromData;
        const subtractData = cubeData.subtractData;
        
        const fromMesh = createMeshFromData(fromData);
        const subtractMesh = createMeshFromData(subtractData);
        
        // Brushオブジェクトを作成
        const fromBrush = new Brush(fromMesh.geometry);
        fromBrush.position.copy(fromMesh.position);
        fromBrush.rotation.copy(fromMesh.rotation);
        fromBrush.updateMatrixWorld();
        
        const subtractBrush = new Brush(subtractMesh.geometry);
        subtractBrush.position.copy(subtractMesh.position);
        subtractBrush.rotation.copy(subtractMesh.rotation);
        subtractBrush.updateMatrixWorld();
        
        // Evaluatorを作成
        const evaluator = new Evaluator();
        
        // 減算操作を実行
        mesh = evaluator.evaluate(fromBrush, subtractBrush, SUBTRACTION);
        
        // 色の処理
        let color = cubeData.color;
        // 色が数値であることを確認
        if (typeof color !== 'number') {
            console.error('Invalid color format:', color);
            color = 0xffffff; // デフォルトは白
        }
        
        // マテリアルの作成
        const material = new THREE.MeshStandardMaterial({
            color: color,
            metalness: 0.3,
            roughness: 0.4,
        });
        
        mesh.material = material;
        objectType = "減算された立体";
    } else {
        // デフォルトは立方体
        geometry = new THREE.BoxGeometry(cubeData.size, cubeData.size, cubeData.size);
    }
    
    if (!mesh) {
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
        mesh = new THREE.Mesh(geometry, material);
    }
    
    // オブジェクトの位置を設定
    mesh.position.x = cubeData.position.x;
    mesh.position.y = cubeData.position.y;
    mesh.position.z = cubeData.position.z;
    
    // オブジェクトの回転を設定
    mesh.rotation.x = cubeData.rotation.x;
    mesh.rotation.y = cubeData.rotation.y;
    mesh.rotation.z = cubeData.rotation.z;
    
    // APIから取得したIDを保存
    mesh.userData = { id: cubeData.id, type: cubeData.type };
    
    // シーンに追加
    scene.add(mesh);
    
    // 配列に追加
    cubes.push(mesh);
    
    console.log(`${objectType}が追加されました。ID: ${cubeData.id}, 現在のオブジェクト数: ${cubes.length}`);
    
    // 追加したオブジェクトを返す
    return mesh;
}

function createMeshFromData(data) {
    let geometry;
    
    // オブジェクトのタイプに応じてジオメトリを作成
    if (data.type === 'prism') {
        // 正n角柱の場合
        geometry = new THREE.CylinderGeometry(
            data.radius,  // 上面の半径
            data.radius,  // 底面の半径
            data.height,  // 高さ
            data.segments, // 底面の角の数
            1,            // 高さ方向の分割数
            false         // 開いた円柱にするかどうか
        );
    } else if (data.type === 'sphere') {
        // 球体の場合
        geometry = new THREE.SphereGeometry(
            data.radius,         // 半径
            data.widthSegments,  // 横方向の分割数
            data.heightSegments  // 縦方向の分割数
        );
    } else {
        // デフォルトは立方体
        geometry = new THREE.BoxGeometry(data.size, data.size, data.size);
    }
    
    // マテリアルの作成
    const material = new THREE.MeshStandardMaterial({
        color: data.color,
        metalness: 0.3,
        roughness: 0.4,
    });
    
    // メッシュの作成
    const mesh = new THREE.Mesh(geometry, material);
    
    // オブジェクトの位置を設定
    mesh.position.x = data.position.x;
    mesh.position.y = data.position.y;
    mesh.position.z = data.position.z;
    
    // オブジェクトの回転を設定
    mesh.rotation.x = data.rotation.x;
    mesh.rotation.y = data.rotation.y;
    mesh.rotation.z = data.rotation.z;
    
    return mesh;
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

let selectedFromId = null;
let selectedSubtractId = null;

function selectObject(event) {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(cubes);
    
    if (intersects.length > 0) {
        const selectedObject = intersects[0].object;
        
        const selectedId = selectedObject.userData.id;
        
        if (selectedFromId === null) {
            selectedFromId = selectedId;
            console.log(`くりぬかれる立体が選択されました。ID: ${selectedId}`);
            alert(`くりぬかれる立体が選択されました。次にくりぬく立体を選択してください。`);
        } else {
            selectedSubtractId = selectedId;
            console.log(`くりぬく立体が選択されました。ID: ${selectedId}`);
            
            subtractObjects(selectedFromId, selectedSubtractId);
            
            selectedFromId = null;
            selectedSubtractId = null;
        }
    }
}

async function subtractObjects(fromId, subtractId) {
    try {
        // 選択されたオブジェクトを取得
        const fromObject = cubes.find(cube => cube.userData && cube.userData.id === fromId);
        const subtractObject = cubes.find(cube => cube.userData && cube.userData.id === subtractId);
        
        if (!fromObject || !subtractObject) {
            throw new Error('選択されたオブジェクトが見つかりません');
        }
        
        // CSGモジュールが読み込まれていることを確認
        if (!Brush || !Evaluator || !SUBTRACTION) {
            throw new Error('CSGモジュールが読み込まれていません');
        }
        
        // Brushオブジェクトを作成
        const fromBrush = new Brush(fromObject.geometry);
        fromBrush.updateMatrixWorld();
        
        const subtractBrush = new Brush(subtractObject.geometry);
        subtractBrush.position.copy(subtractObject.position);
        subtractBrush.rotation.copy(subtractObject.rotation);
        subtractBrush.updateMatrixWorld();
        
        // Evaluatorを作成
        const evaluator = new Evaluator();
        
        // 減算操作を実行
        const resultMesh = evaluator.evaluate(fromBrush, subtractBrush, SUBTRACTION);
        
        // 結果のメッシュにマテリアルを適用
        resultMesh.material = new THREE.MeshStandardMaterial({
            color: fromObject.material.color,
            metalness: 0.3,
            roughness: 0.4
        });
        
        // 結果のメッシュの位置を設定
        resultMesh.position.copy(fromObject.position);
        resultMesh.rotation.copy(fromObject.rotation);
        
        // 元のオブジェクトをシーンから削除
        scene.remove(fromObject);
        scene.remove(subtractObject);
        
        // 結果のメッシュをシーンに追加
        scene.add(resultMesh);
        
        // cubes配列を更新
        const fromIndex = cubes.indexOf(fromObject);
        const subtractIndex = cubes.indexOf(subtractObject);
        
        if (fromIndex !== -1) {
            cubes.splice(fromIndex, 1);
        }
        
        if (subtractIndex !== -1) {
            cubes.splice(subtractIndex, 1);
        }
        
        // 結果のメッシュにユーザーデータを設定
        resultMesh.userData = { 
            id: Date.now(), 
            type: 'subtracted',
            fromId: fromId,
            subtractId: subtractId
        };
        
        // 結果のメッシュをcubes配列に追加
        cubes.push(resultMesh);
        
        console.log('減算操作が成功しました');
        
        // APIを使用して減算操作を記録（オプション）
        try {
            const response = await fetch(`${API_BASE_URL}/subtract`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fromId: fromId,
                    subtractId: subtractId
                })
            });
            
            if (!response.ok) {
                console.warn(`APIエラー: ${response.status}`);
            }
        } catch (apiError) {
            console.warn('APIを使用した減算操作の記録に失敗しました:', apiError);
        }
        
        return resultMesh;
    } catch (error) {
        console.error('減算操作に失敗しました:', error);
        alert('立体の減算に失敗しました。詳細はコンソールを確認してください。');
        return null;
    }
}

async function addTriangularPrism() {
    try {
        // APIを使用して正三角柱を追加
        const response = await fetch(`${API_BASE_URL}/prisms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                segments: 3, // 三角形の底面
                radius: 5,   // 半径
                height: 10   // 高さ
            })
        });
        
        if (!response.ok) {
            throw new Error(`APIエラー: ${response.status}`);
        }
        
        const prismData = await response.json();
        return addCubeFromData(prismData);
    } catch (error) {
        console.error('APIを使用した正三角柱の追加に失敗しました:', error);
        alert('正三角柱の追加に失敗しました。詳細はコンソールを確認してください。');
    }
}

// DOMが読み込まれたら初期化
document.addEventListener('DOMContentLoaded', async () => {
    init();
    
    // WebSocketの初期化
    initWebSocket();
    
    // CSGモジュールの読み込み
    try {
        await loadCSGModule();
    } catch (error) {
        console.error('CSGモジュールの読み込みに失敗しました:', error);
        alert('CSGモジュールの読み込みに失敗しました。くり抜き機能が使用できません。');
    }
    
    // 立方体追加ボタンのイベントリスナーを設定
    document.getElementById('add-cube-btn').addEventListener('click', addCube);
    
    // 三角柱追加ボタンのイベントリスナーを設定
    document.getElementById('add-prism-btn').addEventListener('click', addTriangularPrism);
    
    // 減算ボタンのイベントリスナーを設定
    document.getElementById('subtract-btn').addEventListener('click', () => {
        alert('くりぬかれる立体を選択してください。その後、くりぬく立体を選択します。');
        renderer.domElement.addEventListener('click', selectObject, { once: false });
    });
    
    // STLエクスポートボタンのイベントリスナーを設定
    document.getElementById('export-stl-btn').addEventListener('click', exportToSTL);
});
