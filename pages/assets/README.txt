ハンバーガーメニューを実装するページのhtmlファイル内には以下を追加します。
ページへのパスは適宜変えてください。

<!-- 必要なライブラリ -->
<!-- まだ読み込んでいない場合は<head>内に以下を追加 -->
<!-- <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Mochiy+Pop+One&display=swap"> -->
<!-- <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css"> -->


<!-- ハンバーガーメニュー - HTML部分 -->
<nav class="side-menu" id="sideMenu">
    <div class="menu-title">
        <i class="fa-solid fa-user"></i> 
        <span id="userNameDisplay">ユーザー名</span>
    </div>
    
    <a href="../home/index.html"><i class="fa-solid fa-house"></i> ホーム</a>
    <a href="../zukan/list.html"><i class="fa-solid fa-scroll"></i> ずかん</a>
    <a href="../camera/index.html"><i class="fa-solid fa-camera"></i> カメラ</a>
    <a href="../map/index.html"><i class="fa-solid fa-map"></i> マップ</a>

    <div class="menu-divider"></div>

    <button class="menu-item" id="shareData">
        <i class="fa-solid fa-share"></i> データを共有/ファイルに保存
    </button>
    <button class="menu-item" id="loadData">
        <i class="fa-solid fa-upload"></i> データをロード
    </button>
    <input type="file" id="fileInput" class="file-input" accept=".json">

    <div class="menu-divider"></div>

    <a href="../settings/index.html"><i class="fa-solid fa-gear"></i> せってい</a>
    <a href="../help/index.html"><i class="fa-solid fa-circle-question"></i> ヘルプ</a>
</nav>

<div class="menu-toggle" id="menuToggle">
    <i class="fa-solid fa-bars"></i>
</div>

<div class="notification" id="notification"></div>
<!-- ハンバーガメニュー部終了 -->
