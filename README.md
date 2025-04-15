# Three.js 立方体ジェネレーター

このプロジェクトは、Three.jsを使用して、ボタンを押すと10x10x10の立方体オブジェクトが追加されるウェブアプリケーションです。また、JavaScript APIを通じて外部からも立方体を追加できます。

## 機能

- ボタンをクリックすると、シーンに10x10x10の立方体が追加されます
- マウスでカメラを操作して、3Dシーンを自由に見ることができます
- JavaScript APIを使用して、プログラムから立方体を追加・管理できます

## 使用技術

- Three.js - 3Dグラフィックスライブラリ
- HTML/CSS/JavaScript

## 使い方

1. `index.html`をブラウザで開きます
2. 「立方体を追加」ボタンをクリックして、シーンに立方体を追加します
3. マウスでドラッグして視点を変更できます

## JavaScript API

このアプリケーションは、外部のJavaScriptからアクセスできるAPIを提供しています。

### 立方体の追加

```javascript
// デフォルト設定で立方体を追加
const cube = window.CubeAPI.addCube();

// カスタム設定で立方体を追加
const customCube = window.CubeAPI.addCube({
    size: 15,                      // サイズ（デフォルト: 10）
    color: 0xff0000,               // 色（デフォルト: ランダム）
    position: { x: 0, y: 10, z: 0 }, // 位置（デフォルト: ランダム）
    rotation: { x: 0, y: 0, z: 0 }   // 回転（デフォルト: ランダム）
});
```

### 立方体の数の取得

```javascript
const count = window.CubeAPI.getCubeCount();
console.log(`シーン内の立方体数: ${count}`);
```

### すべての立方体の取得

```javascript
const allCubes = window.CubeAPI.getAllCubes();
// 取得した立方体に対して操作を行う
allCubes.forEach(cube => {
    cube.material.color.set(0x00ff00); // すべての立方体を緑色に変更
});
```
