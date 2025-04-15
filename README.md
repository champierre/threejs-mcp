# Three.js 立方体ジェネレーター

このプロジェクトは、Three.jsを使用して、ボタンを押すと10x10x10の立方体オブジェクトが追加されるウェブアプリケーションです。また、HTTP APIを通じて外部からも立方体を追加・管理できます。追加されたオブジェクトの情報はJSONファイルに永続化されるため、サーバーを再起動しても保持されます。WebSocketを使用してリアルタイムに変更が反映されます。

## 機能

- ボタンをクリックすると、シーンに10x10x10の立方体が追加されます
- マウスでカメラを操作して、3Dシーンを自由に見ることができます
- HTTP APIを使用して、外部から立方体を追加・管理できます
- 追加されたオブジェクトの情報はJSONファイルに永続化されます
- WebSocketを使用してリアルタイムに変更が反映されます

## 使用技術

- Three.js - 3Dグラフィックスライブラリ
- Node.js - サーバーサイドJavaScript
- Express - Webアプリケーションフレームワーク
- WebSocket - リアルタイム通信
- HTML/CSS/JavaScript
- ファイルシステム - データの永続化

## セットアップ

1. 必要なパッケージをインストールします
   ```
   npm install express cors body-parser ws
   ```

2. サーバーを起動します
   ```
   node server.js
   ```

3. ブラウザで `http://localhost:3000/index.html` にアクセスします
4. APIテストページは `http://localhost:3000/test.html` でアクセス可能

## 使い方

1. 「立方体を追加」ボタンをクリックして、シーンに立方体を追加します
2. マウスでドラッグして視点を変更できます

## データの永続化

このアプリケーションでは、追加された立方体のデータは`data.json`ファイルに保存されます。これにより、サーバーを再起動しても立方体のデータが保持されます。データファイルは自動的に作成・更新されるため、特別な設定は必要ありません。

## リアルタイム更新

このアプリケーションでは、WebSocketを使用してリアルタイムに変更を反映します。立方体が追加・削除されると、接続されているすべてのクライアントに通知が送信され、自動的に画面が更新されます。これにより、複数のクライアントから同時にアクセスしても、すべてのクライアントで同じ立方体が表示されます。

## HTTP API

このアプリケーションは、外部からアクセスできるHTTP APIを提供しています。すべてのAPI操作はデータファイルに永続化され、WebSocketを通じてリアルタイムに通知されます。

### 立方体の追加

```
POST /api/cubes
```

curlコマンド例:
```bash
curl -X POST http://localhost:3000/api/cubes \
  -H "Content-Type: application/json" \
  -d '{
    "size": 15,
    "color": 16711680,
    "position": { "x": 0, "y": 10, "z": 0 },
    "rotation": { "x": 0, "y": 0, "z": 0 }
  }'
```

リクエスト例:
```json
{
  "size": 15,
  "color": 16711680,
  "position": { "x": 0, "y": 10, "z": 0 },
  "rotation": { "x": 0, "y": 0, "z": 0 }
}
```

レスポンス例:
```json
{
  "id": 1618456789012,
  "size": 15,
  "color": 16711680,
  "position": { "x": 0, "y": 10, "z": 0 },
  "rotation": { "x": 0, "y": 0, "z": 0 }
}
```

### すべての立方体を取得

```
GET /api/cubes
```

curlコマンド例:
```bash
curl -X GET http://localhost:3000/api/cubes
```

レスポンス例:
```json
[
  {
    "id": 1618456789012,
    "size": 15,
    "color": 16711680,
    "position": { "x": 0, "y": 10, "z": 0 },
    "rotation": { "x": 0, "y": 0, "z": 0 }
  },
  {
    "id": 1618456789013,
    "size": 10,
    "color": 65280,
    "position": { "x": 10, "y": 5, "z": -5 },
    "rotation": { "x": 0.5, "y": 0.3, "z": 0.1 }
  }
]
```

### 特定の立方体を取得

```
GET /api/cubes/:id
```

curlコマンド例:
```bash
curl -X GET http://localhost:3000/api/cubes/1618456789012
```

レスポンス例:
```json
{
  "id": 1618456789012,
  "size": 15,
  "color": 16711680,
  "position": { "x": 0, "y": 10, "z": 0 },
  "rotation": { "x": 0, "y": 0, "z": 0 }
}
```

### 特定の立方体を削除

```
DELETE /api/cubes/:id
```

curlコマンド例:
```bash
curl -X DELETE http://localhost:3000/api/cubes/1618456789012
```

レスポンス例:
```json
{
  "message": "立方体が削除されました"
}
```

### すべての立方体を削除

```
DELETE /api/cubes
```

curlコマンド例:
```bash
curl -X DELETE http://localhost:3000/api/cubes
```

レスポンス例:
```json
{
  "message": "すべての立方体が削除されました"
}
```
