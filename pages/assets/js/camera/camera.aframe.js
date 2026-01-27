// camera.aframe.js
// A-Frame コンポーネント定義
/*
AFRAME.registerComponent('face-camera-full', {
  tick: function () {
    const camera = document.querySelector('#mainCamera');
    if (camera) {
      const cameraPosition = new THREE.Vector3();
      camera.object3D.getWorldPosition(cameraPosition);
      
      const thisPosition = new THREE.Vector3();
      this.el.object3D.getWorldPosition(thisPosition);
      
      this.el.object3D.lookAt(cameraPosition);
      
      const euler = new THREE.Euler();
      euler.setFromQuaternion(this.el.object3D.quaternion);
      euler.z = 0;
      this.el.object3D.quaternion.setFromEuler(euler);
    }
  }
});
*/

/*
AFRAME.registerComponent('face-camera-full', {
  init: function () {
    // DOM参照は一度だけ
    this.cameraEl = document.querySelector('#mainCamera');

    // Vector3は使い回す
    this.cameraPosition = new THREE.Vector3();
    this.thisPosition   = new THREE.Vector3();
    this.euler          = new THREE.Euler();
  },

  tick: function () {
    if (!isArActive) return;   // 追加
    if (!this.cameraEl) return;

    this.cameraEl.object3D.getWorldPosition(this.cameraPosition);
    this.el.object3D.getWorldPosition(this.thisPosition);

    this.el.object3D.lookAt(this.cameraPosition);

    this.euler.setFromQuaternion(this.el.object3D.quaternion);
    this.euler.z = 0; // Z回転を殺す
    this.el.object3D.quaternion.setFromEuler(this.euler);
  }
});
*/

/*
AFRAME.registerComponent('face-camera-full', {
  init: function () {
    this.cameraEl = document.querySelector('#mainCamera');

    this.cameraPos = new THREE.Vector3();
    this.thisPos   = new THREE.Vector3();

    this.dir       = new THREE.Vector3();
    this.target    = new THREE.Vector3();

    // 世界の上方向を固定
    this.up = new THREE.Vector3(0, 1, 0);
  },

  tick: function () {
    if (!isArActive) return;
    if (!this.cameraEl) return;

    // カメラ位置
    this.cameraEl.object3D.getWorldPosition(this.cameraPos);
    this.el.object3D.getWorldPosition(this.thisPos);

    // カメラ → オブジェクト方向
    this.dir.subVectors(this.cameraPos, this.thisPos);

    // Y成分を無視（上下の傾き禁止）
    this.dir.y = 0;

    if (this.dir.lengthSq() < 0.0001) return;
    this.dir.normalize();

    // ターゲット位置を作る
    this.target.copy(this.thisPos).add(this.dir);

    // lookAt するが up を固定
    this.el.object3D.up.copy(this.up);
    this.el.object3D.lookAt(this.target);
  }
});
*/

/*
AFRAME.registerComponent('face-camera-full', {
  init: function () {
    this.cameraEl = document.querySelector('#mainCamera');

    this.cameraPos = new THREE.Vector3();
    this.thisPos   = new THREE.Vector3();
    this.dir       = new THREE.Vector3();

    this.up = new THREE.Vector3(0, 1, 0);
  },

  tick: function () {
    if (!isArActive) return;
    if (!this.cameraEl) return;

    // ワールド座標取得
    this.cameraEl.object3D.getWorldPosition(this.cameraPos);
    this.el.object3D.getWorldPosition(this.thisPos);

    // オブジェクト → カメラ方向
    this.dir.subVectors(this.cameraPos, this.thisPos);

    // 上下の傾きを禁止（AR感維持）
    this.dir.y = 0;

    if (this.dir.lengthSq() < 0.0001) return;
    this.dir.normalize();

    // lookAt するが up を固定
    this.el.object3D.up.copy(this.up);
    this.el.object3D.lookAt(
      this.thisPos.clone().add(this.dir)
    );
  }
});
*/

AFRAME.registerComponent('face-camera-full', {
  init: function () {
    this.cameraEl = document.querySelector('#mainCamera');

    this.cameraPos = new THREE.Vector3();
    this.thisPos   = new THREE.Vector3();
    this.dir       = new THREE.Vector3();
    this.right     = new THREE.Vector3();
    this.up        = new THREE.Vector3();

    this.targetQuat = new THREE.Quaternion();
    this.tmpQuat    = new THREE.Quaternion();
    this.mat        = new THREE.Matrix4();
  },

  tick: function () {
    if (!isArActive) return;
    if (!this.cameraEl) return;

    // カメラ/自分の位置取得
    this.cameraEl.object3D.getWorldPosition(this.cameraPos);
    this.el.object3D.getWorldPosition(this.thisPos);

    // 方向ベクトル
    this.dir.subVectors(this.cameraPos, this.thisPos);

    if (this.dir.lengthSq() < 0.0001) return;
    this.dir.normalize();

    // カメラの姿勢から up を取得
    this.cameraEl.object3D.getWorldQuaternion(this.tmpQuat);
    this.up.set(0, 1, 0).applyQuaternion(this.tmpQuat).normalize();

    // 右方向
    this.right.crossVectors(this.up, this.dir).normalize();

    // 正規直交化された上方向
    const fixedUp = new THREE.Vector3().crossVectors(this.dir, this.right).normalize();

    // 回転行列作成
    this.mat.makeBasis(this.right, fixedUp, this.dir);

    // 目標クォータニオン作成
    this.targetQuat.setFromRotationMatrix(this.mat);

    // 0.1 が補間率
    // 小さいほど遅く追従
    this.el.object3D.quaternion.slerp(this.targetQuat, 0.1);
  }
});

/*
AFRAME.registerComponent('soft-follow', {
  init() {
    this.cam = document.querySelector('#mainCamera');
    this.targetPos = new THREE.Vector3();
    this.tmp = new THREE.Vector3();
    this.forward = new THREE.Vector3(0, 0, -1);
  },

  tick() {
    const cam = this.cam.object3D;

    // 目標位置カメラ前方2m
    this.forward.set(0, 0, -1).applyQuaternion(cam.quaternion);
    this.targetPos.copy(cam.position).add(this.forward.multiplyScalar(2));

    // 位置を追従
    this.el.object3D.position.lerp(this.targetPos, 0.1);

    // 向きはカメラに追従
    this.el.object3D.quaternion.slerp(cam.quaternion, 0.1);
  }
});
*/

/*
AFRAME.registerComponent('tail-update', {
  init: function () {
    this.tailBlack = this.el.querySelector('#tailBlack');
    this.tailWhite = this.el.querySelector('#tailWhite');
  },
  tick: function () {
    const camera = document.querySelector('#mainCamera');
    if (!camera || !this.tailBlack || !this.tailWhite) return;

    const bubblePos = new THREE.Vector3();
    this.el.object3D.getWorldPosition(bubblePos);
    
    const cameraPos = new THREE.Vector3();
    camera.object3D.getWorldPosition(cameraPos);

    const dy = cameraPos.y - bubblePos.y;
    
    if (dy > 0.5) {
      this.tailBlack.setAttribute('position', '0 0.575 0');
      this.tailWhite.setAttribute('position', '0 0.525 0');
    } else if (dy < -0.5) {
      this.tailBlack.setAttribute('position', '0 -0.575 0');
      this.tailWhite.setAttribute('position', '0 -0.525 0');
    } else {
      this.tailBlack.setAttribute('visible', false);
      this.tailWhite.setAttribute('visible', false);
      return;
    }
    
    this.tailBlack.setAttribute('visible', true);
    this.tailWhite.setAttribute('visible', true);
  }
});
*/

/*
AFRAME.registerComponent('tail-update', {
  init: function () {
    this.camera = document.querySelector('#mainCamera');

    this.bubblePos = new THREE.Vector3();
    this.cameraPos = new THREE.Vector3();

    this.tailBlack = this.el.querySelector('#tailBlack');
    this.tailWhite = this.el.querySelector('#tailWhite');

    this.lastState = null; // 'up' | 'down' | 'hide'
  },

  tick: function () {
    if (!isArActive) return;   // 追加
    if (!this.camera || !this.tailBlack || !this.tailWhite) return;

    this.el.object3D.getWorldPosition(this.bubblePos);
    this.camera.object3D.getWorldPosition(this.cameraPos);

    const dy = this.cameraPos.y - this.bubblePos.y;

    let state;
    if (dy > 0.5) state = 'up';
    else if (dy < -0.5) state = 'down';
    else state = 'hide';

    // 状態変わったときだけDOM更新
    if (state === this.lastState) return;
    this.lastState = state;

    if (state === 'up') {
      this.tailBlack.setAttribute('visible', true);
      this.tailWhite.setAttribute('visible', true);
      this.tailBlack.setAttribute('position', '0 0.575 0');
      this.tailWhite.setAttribute('position', '0 0.525 0');
    } else if (state === 'down') {
      this.tailBlack.setAttribute('visible', true);
      this.tailWhite.setAttribute('visible', true);
      this.tailBlack.setAttribute('position', '0 -0.575 0');
      this.tailWhite.setAttribute('position', '0 -0.525 0');
    } else {
      this.tailBlack.setAttribute('visible', false);
      this.tailWhite.setAttribute('visible', false);
    }
  }
});
*/
