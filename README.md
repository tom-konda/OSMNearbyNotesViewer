# OSM Nearby Notes Viewer

OpenStreetMap で登録したホーム地点の周辺にある地図メモを閲覧、返信できるウェブアプリケーションです。

## 動作環境
* Firefox 46.0a2
* Google Chrome 50.0.2661.86

現在その他のブラウザでの動作に不具合があります

## ビルドの仕方
### ビルド前の準備

- 必須
 - node.js のインストール
 - OpenStreetMap で OAuth トークンを使用するアプリケーションの登録
- 推奨
 - npm から browsersync のインストール
 - api06.openstreetmap.org で OAuth トークンを使用するアプリケーションの登録

### ビルド手順
1. `git clone` でレポジトリをローカルの作業ディレクトリに持ってきます
2. `npm install` で必要な npm のパッケージをインストールします
3. config ディレクトリに、default.config.json を元に config.json および、 test.config.json を設置します
4. `npm run build` でビルドします。結果は、build ディレクトリに出力されます
5. *ローカルでウェブサーバを立てて*、出力された index.html にブラウザでアクセスします

## 動作デモ
http://tom-konda.github.io/OSMNearbyNotesViewer/