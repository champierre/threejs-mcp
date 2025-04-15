// Three.jsの基本要素
let scene, camera, renderer, controls;
// 立方体の配列
const cubes = [];
// 立方体のサイズ
const cubeSize = 10;
// APIのベースURL
const API_BASE_URL = 'http://localhost:3000/api';
// 最後に取得した立方体のID
let lastFetchedCubeId = 0;
// 立方体の色をランダムに生成する関数
const getRandomColor = () => {
    return Math.floor(Math.random() * 16777215);
};

// サーバーからすべての立方体データを取得して表示する
async function fetchAndDisplayCubes() {
    try {
        const response = await fetch(`${API_BASE_URL}/cubes`);
        if (!response.ok) {
            throw new Error(`APIエラー: ${response.status}`);
        }
        
        const cubesData = await response.json();
        
        // 新しい立方体のみを追加
        cubesData.forEach(cubeData => {
            // すでに表示されている立方体はスキップ
            if (cubes.some(cube => cube.userData && cube.userData.id === cubeData.id)) {
                return;
            }
            
            // 立方体を作成して表示
            addCubeFromData(cubeData);
            
            // 最後に取得した立方体のIDを更新
            if (cubeData.id > lastFetchedCubeId) {
                lastFetchedCubeId = cubeData.id;
            }
        });
        
        console.log(`${cubesData.length}個の立方体データを取得しました`);
    } catch (error) {
        console.error('立方体データの取得に失敗しました:', error);
    }
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
    // メニューバーの高さを考慮してサイズを設定
    const menuBarHeight = document.querySelector('.menu-bar').offsetHeight;
    renderer.setSize(window.innerWidth, window.innerHeight - menuBarHeight);
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
    const menuBarHeight = document.querySelector('.menu-bar').offsetHeight;
    camera.aspect = window.innerWidth / (window.innerHeight - menuBarHeight);
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight - menuBarHeight);
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
    
    // 立方体を回転
    cubes.forEach(cube => {
        cube.rotation.x += 0.005;
        cube.rotation.y += 0.01;
    });
    
    // コントロールの更新
    controls.update();
    
    // シーンのレンダリング
    renderer.render(scene, camera);
}

// DOMが読み込まれたら初期化
document.addEventListener('DOMContentLoaded', async () => {
    init();
    
    // サーバーからすべての立方体データを取得して表示
    await fetchAndDisplayCubes();
    
    // 「立方体を追加」ボタンのイベントリスナー
    document.getElementById('add-cube').addEventListener('click', addCube);
    
    // 定期的にサーバーから新しい立方体データを取得（5秒ごと）
    setInterval(fetchAndDisplayCubes, 5000);
});
