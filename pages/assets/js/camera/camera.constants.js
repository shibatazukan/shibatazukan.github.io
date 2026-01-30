// camera.constants.js
// モデルパスとラベル、ラベル情報
const modelPath = '../assets/model/model.json';

/***************** モデル変更時更新 *********************/
const classLabels = [
  "アオドウガネ","アゲハチョウ","アブラゼミ","ウスバカマキリ","オオハリアリ",
  "オオミズアオ","オニヤンマ","キリギリス","ギンヤンマ","クサギカメムシ",
  "クマバチ","ゲジゲジ","ケラ","コオロギ","コクゾウムシ","コクワガタ",
  "ゴマダラカミキリ","シオカラトンボ","ショウリョウバッタ","スズムシ",
  "チャバネゴキブリ","トノサマバッタ","ナナホシテントウ","ナミテントウ",
  "ノコギリクワガタ","ヒアリ","ヒグラシ","マイコアカネ","ミツバチ",
  "モンシロチョウ","ヤマトカブト","ヤマトシジミ",

  "アオジ","アオバト","ウミネコ","オナガ","オナガガモ","カラス","カルガモ",
  "カワセミ","カワラバト","キジ","キンクロハジロ","サギ","シジュウカラ",
  "スズメ","チョウゲンボウ","ツグミ","ハクセキレイ","コハクチョウ",
  "フクロウ","ミコアイサ","メジロ","モズ","ルリビタキ",

  "アヤメ","アリアケスミレ","イロハモミジ","オオイヌノフグリ",
  "オオバキスミレ","オギ","カモガヤ","キンモクセイ","サクラ","シャガ",
  "シロツメクサ","ススキ","セイタカアワダチソウ","セリ","タチツボスミレ",
  "タンポポ","チューリップ","ナズナ","ノコンギク","ノジスミレ",
  "ハナニラ","ハルジオン","ハルシャギク","ヒマワリ","ヒメオドリコソウ"
];

const labelInfo = {
  // ===== 植物 =====
  'アヤメ': {
    name: 'アヤメ',
    category: '植物',
    description: 'むらさき色のきれいな花だよ！\n春から初夏にかけて咲くんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
  
  'サクラ': {
    name: 'サクラ',
    category: '植物',
    description: '春になると日本中で咲く、とても有名な花だよ！\nピンク色の花びらがとってもきれいだね。',
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

  'カモガヤ': {
    name: 'カモガヤ',
    category: '植物',
    description: '道ばたや草原でよく見かける、細長い穂を持つ草だよ！\n初夏になると緑色の穂をたくさん出すんだ。',
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

  'ヒメオドリコソウ': {
    name: 'ヒメオドリコソウ',
    category: '植物',
    description: 'ピンク色の小さな花を咲かせるよ！\n春の道ばたでよく見られるね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'セリ': {
    name: 'セリ',
    category: '植物',
    description: '冬が旬のシャキシャキとした触感の植物だよ！\n独特なにおいがするんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'アリアケスミレ': {
    name: 'アリアケスミレ',
    category: '植物',
    description: '白やうすいピンク色の花を咲かせるスミレだよ！\n春に田んぼや畑の近くでよく見られるんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'イロハモミジ': {
    name: 'イロハモミジ',
    category: '植物',
    description: '秋になると真っ赤に紅葉する木だよ！\n手のひらのような形の葉っぱが特徴だね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'オオイヌノフグリ': {
    name: 'オオイヌノフグリ',
    category: '植物',
    description: '春に青い小さな花を咲かせるよ！\n道ばたや公園でよく見かける可愛い花だね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'オオバキスミレ': {
    name: 'オオバキスミレ',
    category: '植物',
    description: '大きな葉っぱと白い花が特徴のスミレだよ！\n山の中の湿った場所に咲くんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'オギ': {
    name: 'オギ',
    category: '植物',
    description: 'ススキによく似た背の高い草だよ！\n川辺でよく見られて、秋に白い穂を出すんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'キンモクセイ': {
    name: 'キンモクセイ',
    category: '植物',
    description: '秋になるととってもいい香りがする、オレンジ色の小さな花を咲かせる木だよ！\n香りで秋を感じられるね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'シャガ': {
    name: 'シャガ',
    category: '植物',
    description: '白とむらさきの模様がきれいな花だよ！\n春に林の中の湿った場所で咲くんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'シロツメクサ': {
    name: 'シロツメクサ',
    category: '植物',
    description: '白い丸い花を咲かせるクローバーだよ！\n四つ葉のクローバーを探すのも楽しいね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'セイタカアワダチソウ': {
    name: 'セイタカアワダチソウ',
    category: '植物',
    description: '秋になると黄色い花をたくさんつける、背の高い植物だよ！\n空き地や道ばたでよく見かけるね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'タンポポ': {
    name: 'タンポポ',
    category: '植物',
    description: '黄色い花を咲かせて、後で白いわた毛になる花だよ！\n春の道ばたでよく見かけるね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'チューリップ': {
    name: 'チューリップ',
    category: '植物',
    description: '春に色とりどりのきれいな花を咲かせるよ！\n赤、黄色、ピンク、いろんな色があるんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ナズナ': {
    name: 'ナズナ',
    category: '植物',
    description: '春の七草の一つだよ！\nハート形のかわいい実をつけるんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ノコンギク': {
    name: 'ノコンギク',
    category: '植物',
    description: '秋に咲く、むらさきがかった白い花だよ！\n野原や道ばたでよく見られるんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ノジスミレ': {
    name: 'ノジスミレ',
    category: '植物',
    description: '春に咲く、むらさき色のスミレだよ！\n野原や田んぼの近くでよく見られるね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ハナニラ': {
    name: 'ハナニラ',
    category: '植物',
    description: '春に白や青い星のような形の花を咲かせるよ！\n葉っぱを切るとニラのようなにおいがするんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ハルジオン': {
    name: 'ハルジオン',
    category: '植物',
    description: '春に白やピンクの小さな花をたくさん咲かせるよ！\n道ばたや公園でよく見かけるね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ハルシャギク': {
    name: 'ハルシャギク',
    category: '植物',
    description: '黄色とオレンジ色のきれいな花を咲かせるよ！\n夏に元気に咲くんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ヒマワリ': {
    name: 'ヒマワリ',
    category: '植物',
    description: '夏に大きな黄色い花を咲かせるよ！\n太陽の方を向いて咲く、元気いっぱいの花だね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  // ===== 鳥 =====
  'オナガガモ': {
    name: 'オナガガモ',
    category: '鳥',
    description: '長いしっぽが特徴のカモだよ！\n冬に池や湖で見られるんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'カルガモ': {
    name: 'カルガモ',
    category: '鳥',
    description: '公園や池でよく見かける、丸っこい体のカモだよ。\n水辺でのんびりしていることが多いね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'カワセミ': {
    name: 'カワセミ',
    category: '鳥',
    description: '青くてキラキラした羽がきれいな鳥だよ！\n川で魚をつかまえるのがとくいなんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ハクチョウ': {
    name: 'ハクチョウ',
    category: '鳥',
    description: '白くて大きくて優雅な鳥だよ！\n冬に日本にやってくるんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'スズメ': {
    name: 'スズメ',
    category: '鳥',
    description: '茶色い小さな鳥で、町中どこでも見られるよ！\n「チュンチュン」と元気に鳴くんだ。',
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

  'アオジ': {
    name: 'アオジ',
    category: '鳥',
    description: '黄色と緑がかった羽がきれいな小鳥だよ！\n冬に林の近くでよく見られるんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'アオバト': {
    name: 'アオバト',
    category: '鳥',
    description: '黄緑色の美しいハトだよ！\n山の中に住んでいて、「オーアオー」と鳴くんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ウミネコ': {
    name: 'ウミネコ',
    category: '鳥',
    description: '海辺でよく見かけるカモメの仲間だよ！\n「ミャーミャー」と猫のように鳴くんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'オナガ': {
    name: 'オナガ',
    category: '鳥',
    description: '青と黒の羽と長いしっぽが特徴の鳥だよ！\n「ギーギー」とにぎやかに鳴くんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'カラス': {
    name: 'カラス',
    category: '鳥',
    description: '真っ黒な羽の賢い鳥だよ！\n町中でよく見かけて、「カーカー」と鳴くんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'カワラバト': {
    name: 'カワラバト',
    category: '鳥',
    description: '公園や町中でよく見かける、灰色のハトだよ！\n「クルックー」と優しく鳴くんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'キンクロハジロ': {
    name: 'キンクロハジロ',
    category: '鳥',
    description: '頭に寝癖のような羽があるカモだよ！\n黒と白のコントラストがかっこいいね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'サギ': {
    name: 'サギ',
    category: '鳥',
    description: '白くて首の長い鳥だよ！\n水辺で魚をじっと待って捕まえるんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'シジュウカラ': {
    name: 'シジュウカラ',
    category: '鳥',
    description: '黒いネクタイのような模様が特徴の小鳥だよ！\n「ツツピーツツピー」と元気に鳴くんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'チョウゲンボウ': {
    name: 'チョウゲンボウ',
    category: '鳥',
    description: '小さなタカの仲間だよ！\n空中でホバリングしながら獲物を探すんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ツグミ': {
    name: 'ツグミ',
    category: '鳥',
    description: '冬に日本にやってくる茶色い鳥だよ！\n地面をピョンピョン跳ねながら虫を探すんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ハクセキレイ': {
    name: 'ハクセキレイ',
    category: '鳥',
    description: '白と黒の模様で、長いしっぽをフリフリ振る鳥だよ！\n水辺や駐車場でよく見かけるね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'コハクチョウ': {
    name: 'コハクチョウ',
    category: '鳥',
    description: '白くて大きくて優雅な鳥だよ！\n冬に日本にやってくるハクチョウの仲間なんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'フクロウ': {
    name: 'フクロウ',
    category: '鳥',
    description: '夜に活動する大きな目を持った鳥だよ！\n「ホーホー」と鳴くんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ミコアイサ': {
    name: 'ミコアイサ',
    category: '鳥',
    description: '白と黒の模様がパンダみたいなカモだよ！\n冬に池や湖で見られるんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'メジロ': {
    name: 'メジロ',
    category: '鳥',
    description: '目の周りが白い、黄緑色の小さな鳥だよ！\n花の蜜が大好きで、梅の花によく来るんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'モズ': {
    name: 'モズ',
    category: '鳥',
    description: '「キチキチ」と高い声で鳴く鳥だよ！\n捕まえた獲物を木の枝に刺す習性があるんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ルリビタキ': {
    name: 'ルリビタキ',
    category: '鳥',
    description: '青い羽がとってもきれいな小鳥だよ！\n冬に山から下りてきて、公園でも見られるんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  // ===== 昆虫 =====
  '赤とんぼ': {
    name: '赤とんぼ',
    category: '昆虫',
    description: '秋に見れる赤いとんぼだよ！\n夕暮れになると赤くなるよ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'カブトムシ': {
    name: 'カブトムシ',
    category: '昆虫',
    description: '昆虫の王様カブトムシ！\n夏の夜にクヌギなどの樹液にあつまるよ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ナナホシテントウ': {
    name: 'ナナホシテントウ',
    category: '昆虫',
    description: '赤い体に7つの黒い星があるテントウムシだよ！\nアブラムシを食べてくれる、畑の味方なんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },
    
  'ウスバカマキリ': {
    name: 'ウスバカマキリ',
    category: '昆虫',
    description: '体が細くて葉っぱのように見えるカマキリだよ！\n周りに溶け込んで、獲物をじっと待つのが得意なんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'アオドウガネ': {
    name: 'アオドウガネ',
    category: '昆虫',
    description: '緑色に輝く丸っこい甲虫だよ！\n夜になると光に集まってくるんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'アゲハチョウ': {
    name: 'アゲハチョウ',
    category: '昆虫',
    description: '黒と黄色の大きくてきれいなチョウだよ！\n春から夏にかけて、花畑でよく見られるね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'アブラゼミ': {
    name: 'アブラゼミ',
    category: '昆虫',
    description: '夏に「ジージー」と大きな声で鳴くセミだよ！\n茶色い羽が特徴なんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'オオハリアリ': {
    name: 'オオハリアリ',
    category: '昆虫',
    description: '大きな針を持つアリだよ！\n刺されると痛いから、見つけても触らないでね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'オオミズアオ': {
    name: 'オオミズアオ',
    category: '昆虫',
    description: 'うすい緑色の大きくて美しいガだよ！\n夜に光に集まってくるんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'オニヤンマ': {
    name: 'オニヤンマ',
    category: '昆虫',
    description: '日本最大のトンボだよ！\n黄色と黒のしま模様がかっこいいね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'キリギリス': {
    name: 'キリギリス',
    category: '昆虫',
    description: '緑色の体で「ギースチョン」と鳴く虫だよ！\n夏の草むらでよく聞こえるね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ギンヤンマ': {
    name: 'ギンヤンマ',
    category: '昆虫',
    description: '青と緑の美しい大きなトンボだよ！\n池の上を素早く飛び回るんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'クサギカメムシ': {
    name: 'クサギカメムシ',
    category: '昆虫',
    description: '茶色いカメムシだよ！\n触ると臭いにおいを出すから注意してね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'クマバチ': {
    name: 'クマバチ',
    category: '昆虫',
    description: '大きくて丸っこい黒いハチだよ！\n花の蜜を集めるのが好きで、おとなしい性格なんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ゲジゲジ': {
    name: 'ゲジゲジ',
    category: '昆虫',
    description: 'たくさんの長い足を持つ虫だよ！\n家の中で害虫を食べてくれる益虫なんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ケラ': {
    name: 'ケラ',
    category: '昆虫',
    description: '土の中を掘るのが得意な虫だよ！\n前足がシャベルみたいな形をしているんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'コオロギ': {
    name: 'コオロギ',
    category: '昆虫',
    description: '秋の夜に「リーンリーン」と美しく鳴く虫だよ！\n黒い体が特徴だね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'コクゾウムシ': {
    name: 'コクゾウムシ',
    category: '昆虫',
    description: 'お米につく小さな虫だよ！\n長い鼻のような口が特徴なんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'コクワガタ': {
    name: 'コクワガタ',
    category: '昆虫',
    description: '小さくて黒いクワガタだよ！\n夏の夜、樹液に集まってくるんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ゴマダラカミキリ': {
    name: 'ゴマダラカミキリ',
    category: '昆虫',
    description: '白と黒のしま模様と長い触角が特徴の甲虫だよ！\n「ギーギー」と音を出すんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'シオカラトンボ': {
    name: 'シオカラトンボ',
    category: '昆虫',
    description: '青白い体のオスと、茶色い体のメスがいるトンボだよ！\n池や川辺でよく見かけるね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ショウリョウバッタ': {
    name: 'ショウリョウバッタ',
    category: '昆虫',
    description: '細長い体の大きなバッタだよ！\n草むらでピョンピョン跳ねているんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'スズムシ': {
    name: 'スズムシ',
    category: '昆虫',
    description: '秋の夜に「リーンリーン」と美しく鳴く虫だよ！\n透き通るような鳴き声が特徴なんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'チャバネゴキブリ': {
    name: 'チャバネゴキブリ',
    category: '昆虫',
    description: '茶色い小さなゴキブリだよ！\n暖かい場所が好きで、家の中によくいるんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'トノサマバッタ': {
    name: 'トノサマバッタ',
    category: '昆虫',
    description: '大きくて立派なバッタの王様だよ！\n緑や茶色の体で、力強く跳ぶんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ナミテントウ': {
    name: 'ナミテントウ',
    category: '昆虫',
    description: 'いろんな模様があるテントウムシだよ！\n赤地に黒い星や、黒地に赤い星など、様々なんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ノコギリクワガタ': {
    name: 'ノコギリクワガタ',
    category: '昆虫',
    description: 'ノコギリのようなギザギザの大あごを持つクワガタだよ！\n夏の夜、樹液に集まるんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ヒアリ': {
    name: 'ヒアリ',
    category: '昆虫',
    description: '赤茶色の小さなアリだよ！\n刺されるととても痛いから、見つけても絶対に触らないでね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ヒグラシ': {
    name: 'ヒグラシ',
    category: '昆虫',
    description: '夏の朝と夕方に「カナカナカナ」と鳴くセミだよ！\n涼しげな鳴き声が特徴なんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'マイコアカネ': {
    name: 'マイコアカネ',
    category: '昆虫',
    description: '顔が白くておしろいを塗ったように見えるトンボだよ！\n秋に田んぼや池で見られるんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ミツバチ': {
    name: 'ミツバチ',
    category: '昆虫',
    description: '花の蜜を集めて、はちみつを作るハチだよ！\n黄色と黒のしま模様が特徴なんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'モンシロチョウ': {
    name: 'モンシロチョウ',
    category: '昆虫',
    description: '白い羽に黒い点があるチョウだよ！\n春から秋まで、畑や公園でよく見られるね。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ヤマトカブト': {
    name: 'ヤマトカブト',
    category: '昆虫',
    description: '日本のカブトムシだよ！\n大きな角がかっこいい、昆虫の王様なんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  },

  'ヤマトシジミ': {
    name: 'ヤマトシジミ',
    category: '昆虫',
    description: '小さな青いチョウだよ！\n春から秋まで、道ばたや公園でよく見られるんだ。',
    show3DObject: false,
    model: '../assets/model/model.json'
  }
};

// Sanity check: warn about any labels present in classLabels but missing in labelInfo
const missingLabels = classLabels.filter(l => !labelInfo[l]);
if (missingLabels.length > 0) {
  console.warn('labelInfo missing for:', missingLabels);
}
