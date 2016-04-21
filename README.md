# OSM Nearby Notes Viewer

OpenStreetMap で登録したホーム地点の周辺にある地図メモを閲覧、返信できるウェブアプリケーションです。

## 動作環境
* Firefox 45
* Google Chrome

現在その他のブラウザでの動作に不具合があります

## ビルドの仕方
### ビルド前の準備

- 必須
 - node.js のインストール
 - OpenStreetMap へ OAuth トークンを使用するアプリケーションの登録
- 推奨
 - npm から browsersync のインストール

### ビルド手順
1. `git clone` でレポジトリをローカルの作業ディレクトリに持ってきます
2. `npm install` で必要な npm のパッケージをインストールします
3. config ディレクトリに、default.config.json を元に config.json および、 test.config.json を設置します
4. `npm run build` でビルドします。結果は、build ディレクトリに出力されます