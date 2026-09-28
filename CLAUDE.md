# CLAUDE.md

季の膳（KI NO ZEN）— 季節と暮らしに合わせて「今日のひと皿」を選ぶ、スマホ中心の薬膳・食文化Webアプリ。公開プレビューとしてGitHub Pagesで配信中（https://hirohgxx.github.io/yakuzen-app/）。

これまでCodexで開発してきた。作業を再開するときは、まず `docs/HANDOFF.md` の「最新」節を読む。

## 構成

- React 19 + TypeScript + Vite 6。Node.js 22以上。ルーターなしで `#today` / `#recipes` / `#learn` / `#notebook` のハッシュ遷移。
- `vite.config.ts` は `base: './'`。画像は `asset()`（`src/data.ts`）経由で `import.meta.env.BASE_URL` から参照し、`/yakuzen-app/` のサブディレクトリ配信で壊れないようにする。
- バックエンド・ログイン・解析・広告なし。外部通信は、利用者が天気を開いたときのOpen-Meteoだけ。

| ファイル | 役割 |
|---|---|
| `src/App.tsx` | 画面の骨格・ナビ・モーダル・「つくる」「学ぶ」画面 |
| `src/Today.tsx` / `src/themes.ts` | ホーム（いまの自分→3テーマ→料理） |
| `src/RecipeDetail.tsx` / `src/KitchenTimer.tsx` | 料理詳細・調理モード・タイマー |
| `src/TableExperience.tsx` | 献立づくり・手持ち食材・四季の特集・食卓カレンダー |
| `src/LearningExperience.tsx` / `src/academy.ts` | 基礎教室6レッスン・自分チェック・食材の学び |
| `src/NotebookPage.tsx` / `src/Journal.tsx` | 手帖（お気に入り・記録・買い物・バックアップ） |
| `src/notebook.ts` | 手帖データの検証・移行・集計（UIから分離） |
| `src/data.ts` | 24レシピ・16食材・記事・クイズ |
| `src/lib.ts` | 検索・分量換算・節気・localStorage読み込み |
| CSS | `styles.css`（全体）に加え、機能ごとに `today` / `recipe-detail` / `notebook` / `experience` .css |

既存コードは1行が長い密な書き方。周辺に合わせる。

## デザインの土台（2026-09-28 金継ぎ診断で整えた）

- 色は `src/styles.css` 冒頭の `:root` トークン（`--paper` `--white` `--soft` `--ink` `--muted` `--olive` など）で指定する。直書きの16進は影・重ねの半透明色だけ。薄い文字色は `--muted`（#586444、どの地でも比4.8以上）より明るくしない。
- 文字は12px以上（`tests/browser/design.spec.ts` が4画面で検査）。スマホの入力欄は16px（iOS Safariのフォーカス時拡大を防ぐ）。
- 角丸は 6px（部品）／10px（面）／999px（丸）の3系統。
- 節の小見出し（`.eyebrow`）は日本語。英字はロゴの「KI NO ZEN」とナビの副題だけ。
- 診断書・前後比較の証書はリポジトリ外（金継ぎスキルの `field/kinozen/`）。

## 手帖データ（壊さないこと）

- localStorageキーは `kinozen-notebook-v1` のまま継続。項目を増やすときは読み込み時に旧形式を補完する。
- バックアップJSONは `app: kinozen / version: 3`。version 2も読み込める。形式を変えるときは `tests/notebook.test.ts` に移行テストを足す。
- 自分チェックの回答は保存も送信もしない（メモリのみ）。

## コマンド

```sh
npm run dev -- --port 4173   # ブラウザテストは4173を使う
npm test                     # Node標準テスト（tests/*.test.ts）
npm run build                # tsc -b && vite build
npx playwright test          # tests/browser/ をPC・スマホ(iPhone 13エミュ)で
npx playwright test --config playwright.pages.config.ts   # dist を /yakuzen-app/ で配信して実行
node scripts/check-publication.mjs   # push前の公開前走査
```

スクリーンショットなどローカル成果物は `.local/`（Git対象外）に置く。

## 公開の流れ

- `main` へのpushで `.github/workflows/pages.yml` が `npm test` → build → Pages配信を行う。ブラウザテストはCIで走らないので、ローカルで回す。
- **このリポジトリは公開**。push前に必ず `node scripts/check-publication.mjs` を通す（ホームフォルダ名・秘密・20MB超・画像メタデータ・ignore漏れを走査）。コミットの作者はnoreplyメールを使う。
- 公開後はActionsの成功と公開サイトの表示を確かめ、`docs/VERIFICATION.md` と `docs/HANDOFF.md` に記録してきた（実装コミットと「公開検証を記録する」コミットを分ける慣習）。
- ユーザーの方針：完成物はPagesで見せる。人の確認はスマホのみ。

## ユーザーテスト（目付）

設定は `ut.config.yaml`、シナリオ・実施記録・分析は `docs/ut/`。サーバー側のデータは無いので、テストデータの片づけは手帖のデータ削除か別プロファイルで行う。

## 内容の制約

- 監修前の公開プレビュー。架空の監修者・資格を書かない。体質判定・症状への個別指導・効能の断定はしない。
- 食材の五性・帰経などの個別分類は、照合済みの食材以外は載せない。根拠と確認方針は `docs/CONTENT-REVIEW.md`、設計判断と出典は `docs/REDESIGN.md`。
- 料理写真は生成画像。追加したらプロンプトを `docs/image-prompts*.json` に残し、`scripts/optimize-images.mjs` でWebP化・メタデータ除去する。

## 注意

- `docs/HANDOFF.md` 後半のファイル表は古い（`data.ts` を12レシピと書いている）。最新の状態は冒頭の節とREADMEを見る。
- 監修・調理試作・実機Safariでの確認は未実施。
