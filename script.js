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

// APIのベースURL
const API_BASE_URL = 'http://localhost:3000/api';

// HTTP APIクライアント
const CubeAPIClient = {
    // 立方体を追加する
    async addCube(options = {}) {
        try {
            const response = await fetch(`${API_BASE_URL}/cubes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(options)
            });
            
            if (!response.ok) {
                throw new Error(`APIエラー: ${response.status}`);
            }
            
            const cubeData = await response.json();
            const cube = addCubeFromData(cubeData);
            return cube;
        } catch (error) {
            console.error('立方体の追加に失敗しました:', error);
            // APIが失敗した場合はローカルで立方体を追加
            return addCubeWithConfig(options);
        }
    },
    
    // すべての立方体を取得する
    async getAllCubes() {
        try {
            const response = await fetch(`${API_BASE_URL}/cubes`);
            
            if (!response.ok) {
                throw new Error(`APIエラー: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('立方体の取得に失敗しました:', error);
            return [];
        }
    },
    
    // 特定の立方体を取得する
    async getCube(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/cubes/${id}`);
            
            if (!response.ok) {
                throw new Error(`APIエラー: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`立方体 ${id} の取得に失敗しました:`, error);
            return null;
        }
    },
    
    // 特定の立方体を削除する
    async deleteCube(id) {
        try {
            const response = await fetch(`${API_BASE_URL}/cubes/${id}`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`APIエラー: ${response.status}`);
            }
            
            // シーンから立方体を削除
            const index = cubes.findIndex(cube => cube.userData.id === id);
            if (index !== -1) {
                scene.remove(cubes[index]);
                cubes.splice(index, 1);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`立方体 ${id} の削除に失敗しました:`, error);
            return null;
        }
    },
    
    // すべての立方体を削除する
    async deleteAllCubes() {
        try {
            const response = await fetch(`${API_BASE_URL}/cubes`, {
                method: 'DELETE'
            });
            
            if (!response.ok) {
                throw new Error(`APIエラー: ${response.status}`);
            }
            
            // シーンからすべての立方体を削除
            cubes.forEach(cube => scene.remove(cube));
            cubes.length = 0;
            
            return await response.json();
        } catch (error) {
            console.error('すべての立方体の削除に失敗しました:', error);
            return null;
        }
    }
};

// 後方互換性のためのAPIオブジェクト
const CubeAPI = {
    // 立方体を追加する
    addCube: function(options = {}) {
        // 同期的に立方体を追加（非推奨）
        console.warn('CubeAPI.addCube() は非推奨です。代わりに CubeAPIClient.addCube() を使用してください。');
        return addCubeWithConfig({
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
        });
    },
    
    // シーン内の立方体の数を取得
    getCubeCount: function() {
        console.warn('CubeAPI.getCubeCount() は非推奨です。代わりに CubeAPIClient.getAllCubes() を使用してください。');
        return cubes.length;
    },
    
    // すべての立方体を取得
    getAllCubes: function() {
        console.warn('CubeAPI.getAllCubes() は非推奨です。代わりに CubeAPIClient.getAllCubes() を使用してください。');
        return cubes;
    }
};

// グローバルスコープでAPIを公開
window.CubeAPI = CubeAPI;
window.CubeAPIClient = CubeAPIClient;

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
    cube.userData.id = cubeData.id;
    
    // シーンに追加
    scene.add(cube);
    
    // 配列に追加
    cubes.push(cube);
    
    console.log(`立方体が追加されました。ID: ${cubeData.id}, 現在の立方体数: ${cubes.length}`);
    
    // 追加した立方体を返す
    return cube;
}

// 設定に基づいて立方体を追加する内部関数（APIが利用できない場合のフォールバック）
function addCubeWithConfig(config) {
    // デフォルト値を設定
    const cubeConfig = {
        id: Date.now(), // ユニークIDとして現在のタイムスタンプを使用
        size: config.size || cubeSize,
        color: config.color || getRandomColor(),
        position: config.position || {
            x: Math.random() * 50 - 25,
            y: Math.random() * 25 + 5,
            z: Math.random() * 50 - 25
        },
        rotation: config.rotation || {
            x: Math.random() * Math.PI,
            y: Math.random() * Math.PI,
            z: Math.random() * Math.PI
        }
    };
    
    return addCubeFromData(cubeConfig);
}

// UIボタンから呼び出される立方体追加関数
async function addCube() {
    // APIを使用して立方体を追加
    try {
        return await CubeAPIClient.addCube();
    } catch (error) {
        console.error('APIを使用した立方体の追加に失敗しました:', error);
        // APIが失敗した場合はローカルで立方体を追加
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
