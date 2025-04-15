# Three.js 立方体ジェネレーター

このプロジェクトは、Three.jsを使用して、ボタンを押すと10x10x10の立方体オブジェクトが追加されるウェブアプリケーションです。また、HTTP APIを通じて外部からも立方体を追加・管理できます。追加されたオブジェクトの情報はJSONファイルに永続化されるため、サーバーを再起動しても保持されます。

## 機能

- ボタンをクリックすると、シーンに10x10x10の立方体が追加されます
- マウスでカメラを操作して、3Dシーンを自由に見ることができます
- HTTP APIを使用して、外部から立方体を追加・管理できます
- 追加されたオブジェクトの情報はJSONファイルに永続化されます

## 使用技術

- Three.js - 3Dグラフィックスライブラリ
- Node.js - サーバーサイドJavaScript
- Express - Webアプリケーションフレームワーク
- HTML/CSS/JavaScript
- ファイルシステム - データの永続化

## セットアップ

1. 必要なパッケージをインストールします
   ```
   npm install express cors body-parser
   ```

2. サーバーを起動します
   ```
   node server.js
   ```

3. ブラウザで `http://localhost:3000/index.html` にアクセスします

## 使い方

1. 「立方体を追加」ボタンをクリックして、シーンに立方体を追加します
2. マウスでドラッグして視点を変更できます

## データの永続化

このアプリケーションでは、追加された立方体のデータは`cubes-data.json`ファイルに保存されます。これにより、サーバーを再起動しても立方体のデータが保持されます。データファイルは自動的に作成・更新されるため、特別な設定は必要ありません。

## HTTP API

このアプリケーションは、外部からアクセスできるHTTP APIを提供しています。すべてのAPI操作はデータファイルに永続化されます。

### 立方体の追加

```
POST /api/cubes
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

レスポンス例:
```json
{
  "message": "すべての立方体が削除されました"
}
```
