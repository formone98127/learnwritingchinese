# 筆順學堂

學習繁體字筆順嘅 Expo (SDK 54) App：先睇示範，再逐筆跟寫。

## 玩法

- **首頁**：由初學到高階 8 個關卡 — 基本筆畫五關（橫豎 → 撇捺 → 點提 → 折 → 鉤），
  然後係詩詞關（《靜夜思》《春曉》《登鸛雀樓》）。要完成前一關先解鎖下一關。
- **學習頁**：上半部播放筆順示範動畫，每筆用廣東話讀出筆畫名稱
  （點、橫、豎、撇、捺、提、折、鉤及複合筆畫）；播完後下半部米字格
  俾你逐筆跟寫，寫啱一筆先出下一筆，寫晒成個字有讚賞語音。
- **評分制**：每筆按準繩度計分（偏離中線距離、起錯筆、中途重寫都會扣分），
  每個字一至三星；全關每字攞滿三星就有勳章。首頁卡片顯示進度同星數。
- **測試模式**：學習頁右上角撳「測試」— 冇示範動畫、冇紅點冇虛線導引、
  唔讀筆畫名，得返個字同粵拼（可撳喇叭聽音），靠自己由第 1 筆寫起，
  一樣逐筆驗證同計星。寫錯起筆會扣分，可以撳「重寫此字」重嚟。
- **音效**：完成筆畫叮聲、完成單字雙音、過關琶音、起錯筆低鳴。
- **橫屏／平板**：橫屏時示範同練習格左右分欄；闊屏首頁雙欄卡片。

## 技術要點

- 筆順數據：[Make-Me-A-Hanzi](https://github.com/skishore/makemeahanzi)
  （Arphic Public License），85 字 JSON 放喺 `assets/strokes/`，
  由 `scripts/fetch-strokes.mjs` 下載並生成 `data/characters.ts` registry。
- 渲染：`react-native-svg` 畫字形 outline；`react-native-reanimated`
  用 `strokeDashoffset` 沿 median 做寫字動畫。
- 跟寫驗證：`components/TracePad.tsx` 將當前筆畫 median 重採樣做 24 點，
  要求由起筆紅點開始、順序覆蓋 ≥80% 先算啱，倒轉寫會被拒絕；
  寫到一半偏離中線太遠（>1.4×筆畫半徑）會即時抹走墨跡重寫，
  覆蓋率夠但整體太歪都會被拒收 — 唔標準嘅筆畫唔會留低軌跡；
  同時累積觸點偏離中線嘅平均距離做評分。
- 筆畫名稱：`data/strokeNames.ts` 收錄 73 字嘅 EDB 式標準筆畫名
  （逐字對照數據筆順核實）；冇收錄嘅複雜詩詞字用
  `lib/strokeGeometry.ts` 嘅 `classifyStroke` 幾何 heuristic 補底。
  `node scripts/validate-names.mjs` 校對 override 數目同筆畫數一致。
- 語音：`expo-speech`，`zh-HK`，會優先揀裝置上嘅廣東話聲（如 iOS Sinji）。
  字音粵拼由 `scripts/fetch-jyutping.mjs` 喺 rime-cantonese 擷取。
- 音效：`expo-audio`，四隻 WAV 由 `scripts/gen-sounds.mjs` 用正弦波合成，
  唔使外購素材。
- 進度：`@react-native-async-storage/async-storage`，v2 格式
  （完成字＋每字星數），開 app 自動遷移 v1 紀錄。

## 開發

```bash
npm install
npx expo start
```

加新字：將字加入 `scripts/fetch-strokes.mjs` 嘅 `CHARS`，行
`node scripts/fetch-strokes.mjs`，再喺 `data/curriculum.ts` 編排關卡；
想有標準筆畫名就順手喺 `data/strokeNames.ts` 加 override。
`node scripts/check-names.mjs` 可以 audit 全部字嘅筆畫名分類結果。
`node scripts/smoke-test.mjs` 起無頭 Chrome 做 end-to-end 跟寫測試
（要先 `npx expo export --platform web` 兼 `npx serve -s dist -l 8812`）。
