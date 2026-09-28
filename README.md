# EC Builder

既存の EC サイト（Cloudflare Worker / D1 / R2）とは独立した、ブラウザ上の EC サイト作成ツールです。

## ローカル起動

```bash
cd EC-Builder
cp .env.example .env.local
# .env.local に OPENAI_API_KEY を入れる
npm install
npm run dev
```

AI は Vite の `/api/ai` プロキシ経由です。キーはフロントエンドに出ません。`npm run dev` が必要です。

## いまできること

- テンプレート選択（コスメ・ビューティー = EC04 の画像・商品データ）
- 6ステップの作成フロー
- ChatGPT による文章生成・チャット編集
- 左チャット / 右 Live Preview
- localStorage 保存
