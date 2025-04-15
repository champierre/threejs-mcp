const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');

// APIのベースURL
const API_BASE_URL = 'http://localhost:3000/api';

// 自然言語処理サーバーの設定
const app = express();
const port = 3001;

// CORSを有効にする
app.use(cors());

// JSONリクエストを解析する
app.use(bodyParser.json());

// 静的ファイルを提供する
app.use(express.static('./'));

// 立方体の色をランダムに生成する関数
const getRandomColor = () => {
  return Math.floor(Math.random() * 16777215);
};

// 色名を16進数に変換する関数
const colorNameToHex = (colorName) => {
  const colorMap = {
    'red': '#ff0000',
    'green': '#00ff00',
    'blue': '#0000ff',
    'yellow': '#ffff00',
    'purple': '#800080',
    'orange': '#ffa500',
    'pink': '#ffc0cb',
    'brown': '#a52a2a',
    'black': '#000000',
    'white': '#ffffff',
    'gray': '#808080',
    'cyan': '#00ffff',
    'magenta': '#ff00ff',
    'lime': '#00ff00',
    'maroon': '#800000',
    'navy': '#000080',
    'olive': '#808000',
    'teal': '#008080',
    'violet': '#ee82ee',
    'silver': '#c0c0c0',
    'gold': '#ffd700',
  };
  
  return colorMap[colorName.toLowerCase()] || null;
};

// 自然言語から立方体のパラメータを抽出する関数
const extractCubeParameters = (text) => {
  const params = {};
  
  // サイズの抽出
  const sizeMatch = text.match(/サイズ\s*(\d+)/i) || text.match(/(\d+)\s*の大きさ/i);
  if (sizeMatch) {
    params.size = parseInt(sizeMatch[1]);
  }
  
  // 色の抽出
  const colorNames = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'pink', 'brown', 'black', 'white', 'gray', 'cyan', 'magenta', 'lime', 'maroon', 'navy', 'olive', 'teal', 'violet', 'silver', 'gold', '赤', '緑', '青', '黄色', '紫', 'オレンジ', 'ピンク', '茶色', '黒', '白', 'グレー', 'シアン', 'マゼンタ', 'ライム', 'マルーン', 'ネイビー', 'オリーブ', 'ティール', 'バイオレット', 'シルバー', 'ゴールド'];
  
  // 日本語の色名を英語に変換するマッピング
  const colorMapping = {
    '赤': 'red',
    '緑': 'green',
    '青': 'blue',
    '黄色': 'yellow',
    '紫': 'purple',
    'オレンジ': 'orange',
    'ピンク': 'pink',
    '茶色': 'brown',
    '黒': 'black',
    '白': 'white',
    'グレー': 'gray',
    'シアン': 'cyan',
    'マゼンタ': 'magenta',
    'ライム': 'lime',
    'マルーン': 'maroon',
    'ネイビー': 'navy',
    'オリーブ': 'olive',
    'ティール': 'teal',
    'バイオレット': 'violet',
    'シルバー': 'silver',
    'ゴールド': 'gold'
  };
  
  for (const colorName of colorNames) {
    if (text.includes(colorName)) {
      // 日本語の色名を英語に変換
      const englishColorName = colorMapping[colorName] || colorName;
      const hexColor = colorNameToHex(englishColorName);
      if (hexColor) {
        params.color = hexColor;
        break;
      }
    }
  }
  
  // 位置の抽出
  const positionMatch = text.match(/位置\s*\(\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*\)/i) || 
                        text.match(/x\s*(-?\d+\.?\d*)\s*y\s*(-?\d+\.?\d*)\s*z\s*(-?\d+\.?\d*)/i);
  if (positionMatch) {
    params.position = {
      x: parseFloat(positionMatch[1]),
      y: parseFloat(positionMatch[2]),
      z: parseFloat(positionMatch[3])
    };
  } else {
    // 中央、上、下、左、右、前、後ろなどの相対位置
    if (text.includes('中央') || text.includes('中心')) {
      params.position = { x: 0, y: 10, z: 0 };
    } else if (text.includes('上')) {
      params.position = { x: 0, y: 20, z: 0 };
    } else if (text.includes('下')) {
      params.position = { x: 0, y: 5, z: 0 };
    } else if (text.includes('左')) {
      params.position = { x: -20, y: 10, z: 0 };
    } else if (text.includes('右')) {
      params.position = { x: 20, y: 10, z: 0 };
    } else if (text.includes('前') || text.includes('手前')) {
      params.position = { x: 0, y: 10, z: 20 };
    } else if (text.includes('後ろ') || text.includes('奥')) {
      params.position = { x: 0, y: 10, z: -20 };
    }
  }
  
  // 回転の抽出
  const rotationMatch = text.match(/回転\s*\(\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)\s*\)/i);
  if (rotationMatch) {
    params.rotation = {
      x: parseFloat(rotationMatch[1]),
      y: parseFloat(rotationMatch[2]),
      z: parseFloat(rotationMatch[3])
    };
  }
  
  return params;
};

// 立方体を追加するAPIエンドポイント
app.post('/api/nlp/add-cube', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'テキストが指定されていません' });
    }
    
    console.log(`受信したテキスト: ${text}`);
    
    // テキストから立方体のパラメータを抽出
    const params = extractCubeParameters(text);
    console.log('抽出されたパラメータ:', params);
    
    // リクエストデータの準備
    const requestData = {};
    
    // サイズの設定
    if (params.size !== undefined) {
      requestData.size = params.size;
    }
    
    // 色の設定（16進数から10進数に変換）
    if (params.color) {
      // #を削除して16進数を10進数に変換
      const colorHex = params.color.replace('#', '');
      requestData.color = parseInt(colorHex, 16);
    }
    
    // 位置の設定
    if (params.position) {
      requestData.position = params.position;
    }
    
    // 回転の設定
    if (params.rotation) {
      requestData.rotation = params.rotation;
    }
    
    console.log('APIリクエストデータ:', requestData);
    
    // APIリクエストの送信
    const response = await fetch(`${API_BASE_URL}/cubes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });
    
    if (!response.ok) {
      throw new Error(`APIエラー: ${response.status}`);
    }
    
    const cube = await response.json();
    
    // 色を16進数形式に変換して返す
    const colorHex = '#' + cube.color.toString(16).padStart(6, '0');
    
    const result = {
      id: cube.id,
      size: cube.size,
      color: colorHex,
      position: cube.position,
      rotation: cube.rotation,
      message: '立方体が正常に追加されました'
    };
    
    console.log('結果:', result);
    res.status(201).json(result);
  } catch (error) {
    console.error('エラー:', error);
    res.status(500).json({ error: `立方体の追加に失敗しました: ${error.message}` });
  }
});

// 立方体を削除するAPIエンドポイント
app.post('/api/nlp/delete-cube', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'テキストが指定されていません' });
    }
    
    console.log(`受信したテキスト: ${text}`);
    
    // テキストからIDを抽出
    const idMatch = text.match(/ID\s*(\d+)/i) || text.match(/(\d+)\s*の立方体/i);
    if (!idMatch) {
      return res.status(400).json({ error: '立方体IDが見つかりません' });
    }
    
    const id = parseInt(idMatch[1]);
    console.log(`抽出されたID: ${id}`);
    
    // APIリクエストの送信
    const response = await fetch(`${API_BASE_URL}/cubes/${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`APIエラー: ${response.status}`);
    }
    
    const result = await response.json();
    
    console.log('結果:', result);
    res.status(200).json({
      message: result.message || '立方体が正常に削除されました'
    });
  } catch (error) {
    console.error('エラー:', error);
    res.status(500).json({ error: `立方体の削除に失敗しました: ${error.message}` });
  }
});

// すべての立方体を削除するAPIエンドポイント
app.post('/api/nlp/clear-cubes', async (req, res) => {
  try {
    // APIリクエストの送信
    const response = await fetch(`${API_BASE_URL}/cubes`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error(`APIエラー: ${response.status}`);
    }
    
    const result = await response.json();
    
    console.log('結果:', result);
    res.status(200).json({
      message: result.message || 'すべての立方体が正常に削除されました'
    });
  } catch (error) {
    console.error('エラー:', error);
    res.status(500).json({ error: `立方体の削除に失敗しました: ${error.message}` });
  }
});

// すべての立方体を取得するAPIエンドポイント
app.get('/api/nlp/cubes', async (req, res) => {
  try {
    // APIリクエストの送信
    const response = await fetch(`${API_BASE_URL}/cubes`);
    
    if (!response.ok) {
      throw new Error(`APIエラー: ${response.status}`);
    }
    
    const cubes = await response.json();
    
    // 色を16進数形式に変換
    const formattedCubes = cubes.map(cube => ({
      id: cube.id,
      size: cube.size,
      color: '#' + cube.color.toString(16).padStart(6, '0'),
      position: cube.position,
      rotation: cube.rotation
    }));
    
    console.log(`${formattedCubes.length}個の立方体を取得しました`);
    res.status(200).json(formattedCubes);
  } catch (error) {
    console.error('エラー:', error);
    res.status(500).json({ error: `立方体の取得に失敗しました: ${error.message}` });
  }
});

// 特定の立方体を取得するAPIエンドポイント
app.get('/api/nlp/cubes/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // APIリクエストの送信
    const response = await fetch(`${API_BASE_URL}/cubes/${id}`);
    
    if (!response.ok) {
      throw new Error(`APIエラー: ${response.status}`);
    }
    
    const cube = await response.json();
    
    // 色を16進数形式に変換
    const colorHex = '#' + cube.color.toString(16).padStart(6, '0');
    
    const formattedCube = {
      id: cube.id,
      size: cube.size,
      color: colorHex,
      position: cube.position,
      rotation: cube.rotation
    };
    
    console.log(`ID ${id} の立方体を取得しました`);
    res.status(200).json(formattedCube);
  } catch (error) {
    console.error('エラー:', error);
    res.status(500).json({ error: `立方体の取得に失敗しました: ${error.message}` });
  }
});

// 自然言語処理APIエンドポイント
app.post('/api/nlp', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ error: 'テキストが指定されていません' });
    }
    
    console.log(`受信したテキスト: ${text}`);
    
    // テキストの意図を分析
    if (text.includes('追加') || text.includes('作成') || text.includes('生成')) {
      // 立方体を追加
      const params = extractCubeParameters(text);
      console.log('抽出されたパラメータ:', params);
      
      // リクエストデータの準備
      const requestData = {};
      
      // サイズの設定
      if (params.size !== undefined) {
        requestData.size = params.size;
      }
      
      // 色の設定（16進数から10進数に変換）
      if (params.color) {
        // #を削除して16進数を10進数に変換
        const colorHex = params.color.replace('#', '');
        requestData.color = parseInt(colorHex, 16);
      }
      
      // 位置の設定
      if (params.position) {
        requestData.position = params.position;
      }
      
      // 回転の設定
      if (params.rotation) {
        requestData.rotation = params.rotation;
      }
      
      console.log('APIリクエストデータ:', requestData);
      
      // APIリクエストの送信
      const response = await fetch(`${API_BASE_URL}/cubes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (!response.ok) {
        throw new Error(`APIエラー: ${response.status}`);
      }
      
      const cube = await response.json();
      
      // 色を16進数形式に変換して返す
      const colorHex = '#' + cube.color.toString(16).padStart(6, '0');
      
      const result = {
        action: 'add',
        id: cube.id,
        size: cube.size,
        color: colorHex,
        position: cube.position,
        rotation: cube.rotation,
        message: '立方体が正常に追加されました'
      };
      
      console.log('結果:', result);
      res.status(201).json(result);
    } else if (text.includes('削除') || text.includes('消去') || text.includes('消す')) {
      if (text.includes('すべて') || text.includes('全部') || text.includes('クリア')) {
        // すべての立方体を削除
        const response = await fetch(`${API_BASE_URL}/cubes`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`APIエラー: ${response.status}`);
        }
        
        const result = await response.json();
        
        console.log('結果:', result);
        res.status(200).json({
          action: 'clear',
          message: result.message || 'すべての立方体が正常に削除されました'
        });
      } else {
        // 特定の立方体を削除
        const idMatch = text.match(/ID\s*(\d+)/i) || text.match(/(\d+)\s*の立方体/i);
        if (!idMatch) {
          return res.status(400).json({ error: '立方体IDが見つかりません' });
        }
        
        const id = parseInt(idMatch[1]);
        console.log(`抽出されたID: ${id}`);
        
        // APIリクエストの送信
        const response = await fetch(`${API_BASE_URL}/cubes/${id}`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`APIエラー: ${response.status}`);
        }
        
        const result = await response.json();
        
        console.log('結果:', result);
        res.status(200).json({
          action: 'delete',
          id: id,
          message: result.message || '立方体が正常に削除されました'
        });
      }
    } else if (text.includes('取得') || text.includes('教えて') || text.includes('表示') || text.includes('リスト')) {
      const idMatch = text.match(/ID\s*(\d+)/i) || text.match(/(\d+)\s*の立方体/i);
      
      if (idMatch) {
        // 特定の立方体を取得
        const id = parseInt(idMatch[1]);
        console.log(`抽出されたID: ${id}`);
        
        // APIリクエストの送信
        const response = await fetch(`${API_BASE_URL}/cubes/${id}`);
        
        if (!response.ok) {
          throw new Error(`APIエラー: ${response.status}`);
        }
        
        const cube = await response.json();
        
        // 色を16進数形式に変換
        const colorHex = '#' + cube.color.toString(16).padStart(6, '0');
        
        const formattedCube = {
          action: 'get',
          id: cube.id,
          size: cube.size,
          color: colorHex,
          position: cube.position,
          rotation: cube.rotation
        };
        
        console.log(`ID ${id} の立方体を取得しました`);
        res.status(200).json(formattedCube);
      } else {
        // すべての立方体を取得
        const response = await fetch(`${API_BASE_URL}/cubes`);
        
        if (!response.ok) {
          throw new Error(`APIエラー: ${response.status}`);
        }
        
        const cubes = await response.json();
        
        // 色を16進数形式に変換
        const formattedCubes = cubes.map(cube => ({
          id: cube.id,
          size: cube.size,
          color: '#' + cube.color.toString(16).padStart(6, '0'),
          position: cube.position,
          rotation: cube.rotation
        }));
        
        console.log(`${formattedCubes.length}個の立方体を取得しました`);
        res.status(200).json({
          action: 'list',
          cubes: formattedCubes
        });
      }
    } else {
      res.status(400).json({ error: '認識できないコマンドです' });
    }
  } catch (error) {
    console.error('エラー:', error);
    res.status(500).json({ error: `処理に失敗しました: ${error.message}` });
  }
});

// サーバーを起動
app.listen(port, () => {
  console.log(`自然言語処理サーバーが http://localhost:${port} で起動しました`);
});
