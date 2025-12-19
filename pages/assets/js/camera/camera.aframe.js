// camera.aframe.js
// A-Frame コンポーネント定義
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