// camera.state.js
// 共有されるグローバル状態変数
let model;
let isDrawing        = false;
let points           = [];
let identifiedObject = null;
let lastPrediction   = null;
let currentLocation  = null;
let detectionModel   = null;

// 矩形選択用の変数
let isSelecting = false;
let selectionStart = { x: 0, y: 0 };
let selectionEnd = { x: 0, y: 0 };
let currentSelection = null;
let isResizing = false;
let resizeHandle = null;
let initialSelection = null;
let initialMousePos = { x: 0, y: 0 };

let isArActive = false; // 追加

