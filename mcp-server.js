const { MCPServer, MCPTool, MCPResource } = require('@modelcontextprotocol/server');
const fetch = require('node-fetch');

// APIのベースURL
const API_BASE_URL = 'http://localhost:3000/api';

// MCPサーバーの作成
const server = new MCPServer({
  name: 'threejs-cube-server',
  description: 'Three.jsの立方体を操作するためのMCPサーバー',
  version: '1.0.0'
});

// 立方体を追加するツール
const addCubeTool = new MCPTool({
  name: 'add_cube',
  description: '指定されたパラメータで立方体を追加します',
  inputSchema: {
    type: 'object',
    properties: {
      size: {
        type: 'number',
        description: '立方体のサイズ（デフォルト: 10）',
      },
      color: {
        type: 'string',
        description: '立方体の色（16進数形式、例: "#ff0000"）。指定しない場合はランダムな色になります。',
      },
      position: {
        type: 'object',
        description: '立方体の位置（指定しない場合はランダムな位置になります）',
        properties: {
          x: { type: 'number', description: 'X座標' },
          y: { type: 'number', description: 'Y座標' },
          z: { type: 'number', description: 'Z座標' }
        }
      },
      rotation: {
        type: 'object',
        description: '立方体の回転（ラジアン単位、指定しない場合はランダムな回転になります）',
        properties: {
          x: { type: 'number', description: 'X軸周りの回転' },
          y: { type: 'number', description: 'Y軸周りの回転' },
          z: { type: 'number', description: 'Z軸周りの回転' }
        }
      }
    }
  },
  async execute(inputs) {
    try {
      // リクエストデータの準備
      const requestData = {};
      
      // サイズの設定
      if (inputs.size !== undefined) {
        requestData.size = inputs.size;
      }
      
      // 色の設定（16進数から10進数に変換）
      if (inputs.color) {
        // #を削除して16進数を10進数に変換
        const colorHex = inputs.color.replace('#', '');
        requestData.color = parseInt(colorHex, 16);
      }
      
      // 位置の設定
      if (inputs.position) {
        requestData.position = {
          x: inputs.position.x !== undefined ? inputs.position.x : 0,
          y: inputs.position.y !== undefined ? inputs.position.y : 10,
          z: inputs.position.z !== undefined ? inputs.position.z : 0
        };
      }
      
      // 回転の設定
      if (inputs.rotation) {
        requestData.rotation = {
          x: inputs.rotation.x !== undefined ? inputs.rotation.x : 0,
          y: inputs.rotation.y !== undefined ? inputs.rotation.y : 0,
          z: inputs.rotation.z !== undefined ? inputs.rotation.z : 0
        };
      }
      
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
      
      return {
        id: cube.id,
        size: cube.size,
        color: colorHex,
        position: cube.position,
        rotation: cube.rotation,
        message: '立方体が正常に追加されました'
      };
    } catch (error) {
      throw new Error(`立方体の追加に失敗しました: ${error.message}`);
    }
  }
});

// 立方体を削除するツール
const deleteCubeTool = new MCPTool({
  name: 'delete_cube',
  description: '指定されたIDの立方体を削除します',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'number',
        description: '削除する立方体のID',
        required: true
      }
    },
    required: ['id']
  },
  async execute(inputs) {
    try {
      const response = await fetch(`${API_BASE_URL}/cubes/${inputs.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`APIエラー: ${response.status}`);
      }
      
      const result = await response.json();
      
      return {
        message: result.message || '立方体が正常に削除されました'
      };
    } catch (error) {
      throw new Error(`立方体の削除に失敗しました: ${error.message}`);
    }
  }
});

// すべての立方体を削除するツール
const clearCubesTool = new MCPTool({
  name: 'clear_cubes',
  description: 'すべての立方体を削除します',
  inputSchema: {
    type: 'object',
    properties: {}
  },
  async execute() {
    try {
      const response = await fetch(`${API_BASE_URL}/cubes`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`APIエラー: ${response.status}`);
      }
      
      const result = await response.json();
      
      return {
        message: result.message || 'すべての立方体が正常に削除されました'
      };
    } catch (error) {
      throw new Error(`立方体の削除に失敗しました: ${error.message}`);
    }
  }
});

// すべての立方体を取得するリソース
const allCubesResource = new MCPResource({
  name: 'all_cubes',
  description: 'すべての立方体の情報を取得します',
  async fetch() {
    try {
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
      
      return formattedCubes;
    } catch (error) {
      throw new Error(`立方体の取得に失敗しました: ${error.message}`);
    }
  }
});

// 特定の立方体を取得するリソース
const cubeResource = new MCPResource({
  name: 'cube',
  description: '指定されたIDの立方体の情報を取得します',
  uriParameters: {
    id: {
      type: 'number',
      description: '取得する立方体のID'
    }
  },
  async fetch(uri) {
    try {
      const id = uri.parameters.id;
      
      if (!id) {
        throw new Error('立方体IDが指定されていません');
      }
      
      const response = await fetch(`${API_BASE_URL}/cubes/${id}`);
      
      if (!response.ok) {
        throw new Error(`APIエラー: ${response.status}`);
      }
      
      const cube = await response.json();
      
      // 色を16進数形式に変換
      const colorHex = '#' + cube.color.toString(16).padStart(6, '0');
      
      return {
        id: cube.id,
        size: cube.size,
        color: colorHex,
        position: cube.position,
        rotation: cube.rotation
      };
    } catch (error) {
      throw new Error(`立方体の取得に失敗しました: ${error.message}`);
    }
  }
});

// ツールとリソースをサーバーに登録
server.registerTool(addCubeTool);
server.registerTool(deleteCubeTool);
server.registerTool(clearCubesTool);
server.registerResource(allCubesResource);
server.registerResource(cubeResource);

// サーバーの起動
server.start();

console.log('MCPサーバーが起動しました');
