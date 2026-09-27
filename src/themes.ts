export type FeelingTheme = {
  id: string;
  label: string;
  caption: string;
  title: string;
  introduction: string;
  concept: string;
  explanation: string;
  practice: string;
  source: { title: string; url: string };
  dishes: { id: string; reason: string }[];
};

export const feelingThemes: FeelingTheme[] = [
  {
    id: 'warmth', label: '冷えが気になる', caption: '湯気のある食卓へ',
    title: '今日は、温かいひと皿から。',
    introduction: '温かい料理が食べたいなら、汁ものを選択肢に。まずは食べたい温度や味から、今日の食卓を考えてみませんか。',
    concept: '冷えを、ひとつの体質に決めつけない',
    explanation: '漢方では、冷えを「気・血・水」など複数の観点から捉えます。同じ冷えの感覚でも、その背景はひとつとは限りません。このアプリでは原因や体質を判定せず、食事の温度や調理方法に目を向けます。',
    practice: '今日の小さな工夫：温かい汁ものを、熱すぎない温度で。生姜の量は香りの好みに合わせて調整しましょう。',
    source: { title: '東京医科大学病院 漢方医学センター「冷え症と漢方」', url: 'https://hospinfo.tokyo-med.ac.jp/shinryo/kampo/pdf/column_202112.pdf' },
    dishes: [
      { id: 'lotus-soup', reason: '温かい汁ものに、生姜の香りを添えた一品。食材の効能ではなく、料理の温度と風味で選んでいます。' },
      { id: 'pumpkin-soup', reason: '温かく、なめらかな口当たりの汁もの。生姜を使わない料理を選びたいときの候補です。' },
    ],
  },
  {
    id: 'appetite', label: '食欲がわかない', caption: '食べたい形を探す',
    title: '量よりも、いま食べたい形を。',
    introduction: 'なめらかなもの、汁もの、少なめの一皿。食べられそうと感じる料理を、ご自身の好みから選びましょう。',
    concept: '「脾胃」という、食を受けとめる視点',
    explanation: '漢方では、食べものを受けとめる胃腸の働きを「脾胃（ひい）」という言葉で重視します。現代医学の臓器名とそのまま同じ意味ではありません。食欲の選択だけで「脾虚」などの体質を判定することはできません。',
    practice: '今日の小さな工夫：レシピの人数を変えて、つくる量を調整できます。無理に食べ切ることを目標にしなくて大丈夫です。',
    source: { title: '日本漢方生薬製剤協会「胃腸と漢方」', url: 'https://www.nikkankyo.org/kampo/colume/009/index.htm' },
    dishes: [
      { id: 'pumpkin-soup', reason: 'なめらかな食感を選びたいときの一品。食欲を回復させる、消化によいといった効果を保証するものではありません。' },
      { id: 'tomato-egg', reason: '10分でつくれる汁もの。料理に時間をかけず、少ない工程で用意したいときの候補です。' },
    ],
  },
  {
    id: 'pause', label: '気持ちが張りつめている', caption: '香りを楽しむひと休み',
    title: '食卓に、小さな余白を。',
    introduction: '料理の香りや味わいに、少し目を向けて。今日は手間をかけない一品でも、ゆっくりつくる一品でも。',
    concept: '「気の巡り」は、伝統的なものの見方',
    explanation: '漢方の「気」は、生命活動や精神面の働きを捉える伝統的な概念です。「気の巡り」という言葉も、この枠組みにあります。気持ちが張りつめているという選択だけで「気滞」と決めたり、料理で気が巡ると約束したりはしません。',
    practice: '今日の小さな工夫：好みの器を選び、ひと口の香りを楽しむ時間を。苦手な香りを無理に取り入れる必要はありません。',
    source: { title: '日本薬学会 薬学用語解説「気血水」', url: 'https://www.pharm.or.jp/words/post-82.html' },
    dishes: [
      { id: 'pear-compote', reason: '梨と生姜の香りを楽しむ小さな甘味。気分への作用ではなく、味わいを楽しむ例として選んでいます。' },
      { id: 'mushroom-rice', reason: 'きのこと三つ葉の香りを楽しむ炊き込みごはん。炊飯時間を含むので、時間に余裕のある日に。' },
    ],
  },
];
