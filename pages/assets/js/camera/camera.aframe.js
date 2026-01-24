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