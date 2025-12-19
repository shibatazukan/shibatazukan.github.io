// camera.constants.js
// モデルパスとラベル、ラベル情報
const modelPath   = '../assets/model/model.json';

/*****************モデル変更時更新*********************/
const classLabels 
= [
  "あやめ",
  "さくら",
  "オナガガモ","カラス",
  "カルガモ",
  "カワセミ",
  "キンクロハジロ",
  "サギ",
  "カワラバト",
  "ハクチョウ",
  "スズメ",
  "メジロ",
  "シジュウカラ",
  "ツグミ",
  "アオジ",
  "アオバト",
  "ウミネコ",
  "オナガ",
  "キジ",
  "チョウゲンボウ",
  "ハクセキレイ",
  "ミコアイサ",
  "モズ",
  "ルリビタキ",
  "アリアケスミレ",
  "オオイヌノフグリ",
  "オオバキスミレ",
  "カモガヤ",
  "シャガ",
  "ススキ",
  "セイタカアワダチソウ",
  "タチツボスミレ",
  "チガヤ",
  "ナズナ",
  "ノコンギク",
  "ノジスミレ",
  "ハナニラ",
  "ヒメオドリコソウ",
  "ハルシャギク"
];

const labelInfo = {
  // ===== 植物 =====

};

// Note: labelInfo was redefined below — restore full object
const labelInfo = (function(){
  const info = {
  // ===== 植物 =====  'あやめ': {
    name: 'あやめ',
    category: '植物',
    description: 'むらさき色のきれいな花だよ！\n春から初夏にかけて咲くんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'さくら': {
    name: 'さくら',
    category: '植物',
    description: '春になると日本中で咲く、とても有名な花だよ！\nピンク色の花びらがとってもきれいだね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  // ===== 鳥 =====
  'アオジ': {
    name: 'アオジ',
    category: '鳥',
    description: '黄色っぽいおなかをした小さな鳥だよ！\n冬によく見かけるんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
  'アオバト': {
    name: 'アオバト',
    category: '鳥',
    description: '緑色の体がきれいなハトのなかまだよ！\n海に行ってしお水を飲むことがあるんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
  'ウミネコ': {
    name: 'ウミネコ',
    category: '鳥',
    description: '海の近くにいるカモメのなかまだよ！\n「ミャーオ」とねこのような声でなくんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
  'オナガ': {
    name: 'オナガ',
    category: '鳥',
    description: 'しっぽがとても長い、青い色の鳥だよ！\n群れで行動することが多いんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
  'キジ': {
    name: 'キジ',
    category: '鳥',
    description: '日本の国鳥だよ！\nオスはとてもカラフルでかっこいいんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
  'チョウゲンボウ': {
    name: 'チョウゲンボウ',
    category: '鳥',
    description: '小さなタカのなかまだよ！\n空中で止まるように飛ぶのがとくちょうだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
  'ハクセキレイ': {
    name: 'ハクセキレイ',
    category: '鳥',
    description: '白と黒の体をした鳥だよ！\nしっぽを上下にフリフリするよ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
  'ミコアイサ': {
    name: 'ミコアイサ',
    category: '鳥',
    description: '白黒のもようがかわいいカモだよ！\nオスはパンダみたいな顔をしているんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
  'カルガモ': {
    name: 'カルガモ',
    category: '鳥',
    description: '公園や池でよく見かける、丸っこい体のカモだよ。水辺でのんびりしていることが多いね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
  'モズ': {
    name: 'モズ',
    category: '鳥',
    description: 'いろいろな鳥の声をまねする鳥だよ！\n「はやにえ」をすることで知られているよ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
  'ルリビタキ': {
    name: 'ルリビタキ',
    category: '鳥',
    description: '青い体がとてもきれいな小鳥だよ！\n冬に山からおりてくるんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  // ===== 草花 =====
  'アリアケスミレ': {
    name: 'アリアケスミレ',
    category: '植物',
    description: 'うすむらさき色の小さなスミレだよ！\n春に道ばたで見られるよ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
  'オオイヌノフグリ': {
    name: 'オオイヌノフグリ',
    category: '植物',
    description: '青い小さな花を咲かせるよ！\n春を知らせてくれる花なんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
  'オオバキスミレ': {
    name: 'オオバキスミレ',
    category: '植物',
    description: '大きな葉っぱをもつスミレだよ！\n黄色い花を咲かせるんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
  'カモガヤ': {
    name: 'カモガヤ',
    category: '植物',
    description: '道ばたや草地に生える草だよ！\n細長い花をつけるんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
  'シャガ': {
    name: 'シャガ',
    category: '植物',
    description: '白と青のもようがきれいな花だよ！\n日かげに咲くことが多いよ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
  'ススキ': {
    name: 'ススキ',
    category: '植物',
    description: '秋になるとふわふわした穂を出す草だよ！\nお月見でかざることもあるね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
  'セイタカアワダチソウ': {
    name: 'セイタカアワダチソウ',
    category: '植物',
    description: '秋に黄色い花をたくさん咲かせる草だよ！\nとても背が高くなるんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
  'タチツボスミレ': {
    name: 'タチツボスミレ',
    category: '植物',
    description: '春にさく、むらさき色のスミレだよ！\n林の中でよく見かけるよ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
  'チガヤ': {
    name: 'チガヤ',
    category: '植物',
    description: '春に白いふわふわした穂を出す草だよ！\n河原などで見られるよ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
  'ナズナ': {
    name: 'ナズナ',
    category: '植物',
    description: 'ハートの形をした実がかわいい草だよ！\n春の七草のひとつだね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
  'ノコンギク': {
    name: 'ノコンギク',
    category: '植物',
    description: '秋にむらさき色の花を咲かせるよ！\n野原でよく見られるんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
  'ノジスミレ': {
    name: 'ノジスミレ',
    category: '植物',
    description: '野原に咲くスミレだよ！\n少しこいむらさき色の花がきれいだね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
  'ハナニラ': {
    name: 'ハナニラ',
    category: '植物',
    description: '星の形をした白い花だよ！\n春になるとたくさん咲くんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
  'ヒメオドリコソウ': {
    name: 'ヒメオドリコソウ',
    category: '植物',
    description: 'ピンク色の小さな花を咲かせるよ！\n春の道ばたでよく見られるね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
  'ハルシャギク': {
    name: 'ハルシャギク',
    category: '植物',
    description: '黄色と赤のもようが目立つ花だよ！\n初夏に元気よく咲くんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  }
};

// Sanity check: warn about any labels present in model/classLabels but missing in labelInfo
const missingLabels = classLabels.filter(l => !labelInfo[l]);
if (missingLabels.length > 0) {
  console.warn('labelInfo missing for:', missingLabels);
}

/****************************************************************************/