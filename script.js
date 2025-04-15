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

// APIオブジェクト - 外部からアクセス可能な関数を提供
const CubeAPI = {
    // 立方体を追加するAPIメソッド
    addCube: function(options = {}) {
        // オプションのデフォルト値を設定
        const config = {
            size: options.size || cubeSize,
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
        
        return addCubeWithConfig(config);
    },
    
    // シーン内の立方体の数を取得
    getCubeCount: function() {
        return cubes.length;
    },
    
    // すべての立方体を取得
    getAllCubes: function() {
        return cubes;
    }
};

// グローバルスコープでAPIを公開
window.CubeAPI = CubeAPI;

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

// 設定に基づいて立方体を追加する内部関数
function addCubeWithConfig(config) {
    // ジオメトリの作成
    const geometry = new THREE.BoxGeometry(config.size, config.size, config.size);
    
    // マテリアルの作成
    const material = new THREE.MeshStandardMaterial({
        color: config.color,
        metalness: 0.3,
        roughness: 0.4,
    });
    
    // メッシュの作成
    const cube = new THREE.Mesh(geometry, material);
    
    // 立方体の位置を設定
    cube.position.x = config.position.x;
    cube.position.y = config.position.y;
    cube.position.z = config.position.z;
    
    // 立方体の回転を設定
    cube.rotation.x = config.rotation.x;
    cube.rotation.y = config.rotation.y;
    cube.rotation.z = config.rotation.z;
    
    // シーンに追加
    scene.add(cube);
    
    // 配列に追加
    cubes.push(cube);
    
    console.log(`立方体が追加されました。現在の立方体数: ${cubes.length}`);
    
    // 追加した立方体を返す
    return cube;
}

// UIボタンから呼び出される立方体追加関数
function addCube() {
    // デフォルト設定で立方体を追加
    return addCubeWithConfig({
        size: cubeSize,
        color: getRandomColor(),
        position: {
            x: Math.random() * 50 - 25,
            y: Math.random() * 25 + 5,
            z: Math.random() * 50 - 25
        },
        rotation: {
            x: Math.random() * Math.PI,
            y: Math.random() * Math.PI,
            z: Math.random() * Math.PI
        }
    });
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
