// Three.jsの基本要素
let scene, camera, renderer, controls;
// 立方体の配列
const cubes = [];
// 立方体のサイズ
const cubeSize = 10;
// 立方体の色をランダムに生成する関数
const getRandomColor = () => {
    return Math.floor(Math.random() * 16777215);
};

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

// 立方体を追加する関数
function addCube() {
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
document.addEventListener('DOMContentLoaded', () => {
    init();
    
    // 「立方体を追加」ボタンのイベントリスナー
    document.getElementById('add-cube').addEventListener('click', addCube);
});
