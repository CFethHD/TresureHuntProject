import {
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  SessionMode,
  World,
  AssetManager, AssetType,
  LocomotionEnvironment, EnvironmentType,
  PlaneGeometry,
  CanvasTexture,          // <<< ADDED
} from '@iwsdk/core';

import {
  Interactable,
  PanelUI,
  ScreenSpace,
} from '@iwsdk/core';

import { PanelSystem } from './panel.js'; // system for displaying "Enter VR" panel on Quest 1

// ASSETS
const assets = {
  myPlant: {
    url: '/gltf/plantSansevieria/plantSansevieria.gltf',
    type: AssetType.GLTF,
    priority: 'critical',
  },
  tree: {
    url: new URL('./tree.glb', import.meta.url).href,
    type: AssetType.GLTF,
    priority: 'normal',
  },
  gem: { 
    url: new URL('./gem.glb', import.meta.url).href,
    type: AssetType.GLTF,
    priority: 'normal',
  },
};


// world setup
World.create(document.getElementById('scene-container'), {
  assets,
  xr: {
    sessionMode: SessionMode.ImmersiveVR,
    offer: 'always',
    features: {}
  },
  features: { locomotion: true },             
}).then((world) => {

  const { camera } = world;

  // score system
  const totalGems = 3;
  let collectedGems = 0;

  function showWinMessage() {
    // use the message-board helper from below
    showTemporaryMessage('You have found all 3 treasures!!!', 7000);
  }

  function collectGem(entity) {
    entity.destroy();
    collectedGems++;
    console.log(`Gems collected: ${collectedGems} / ${totalGems}`);
    if (collectedGems === totalGems) {
      showWinMessage();
    }
  }
  // --- END SCORE SYSTEM ---

  // adding floor
  const floorGeometry = new PlaneGeometry(20, 20);
  const floorMaterial = new MeshStandardMaterial({ color: 'green' });
  const floorMesh = new Mesh(floorGeometry, floorMaterial);
  floorMesh.rotation.x = -Math.PI / 2;
  const floorEntity = world.createTransformEntity(floorMesh);

  floorEntity.addComponent(LocomotionEnvironment, { type: EnvironmentType.STATIC });

  // adding tree
  const treeModel = AssetManager.getGLTF('tree').scene;
  const treeEntity = world.createTransformEntity(treeModel);
  treeEntity.object3D.position.set(-10, -0.5, -2); 

  // adding second tree
  const treeModel2 = AssetManager.getGLTF('tree').scene.clone(); 
  const treeEntity2 = world.createTransformEntity(treeModel2);
  treeEntity2.object3D.position.set(-3, -0.5, -4); 
  treeEntity2.object3D.scale.setScalar(0.8);   

  // adding gem (found in left tree)
  const gemModel = AssetManager.getGLTF('gem').scene;
  const gemEntity = world.createTransformEntity(gemModel);
  gemEntity.object3D.position.set(-3, 3, -2); 
  gemEntity.object3D.scale.setScalar(3);  
  gemEntity.addComponent(Interactable);
  gemEntity.object3D.addEventListener('pointerdown', () => collectGem(gemEntity));

  // adding second gem (found in right tree)
  const gemModel2 = AssetManager.getGLTF('gem').scene.clone();
  const gemEntity2 = world.createTransformEntity(gemModel2);
  gemEntity2.object3D.position.set(2, 3, -5); 
  gemEntity2.object3D.scale.setScalar(3);  
  gemEntity2.addComponent(Interactable);
  gemEntity2.object3D.addEventListener('pointerdown', () => collectGem(gemEntity2));

  // adding third gem
  const gemModel3 = AssetManager.getGLTF('gem').scene.clone();
  const gemEntity3 = world.createTransformEntity(gemModel3);
  gemEntity3.object3D.position.set(0, 0, 5); 
  gemEntity3.object3D.scale.setScalar(3);  
  gemEntity3.addComponent(Interactable);
  gemEntity3.object3D.addEventListener('pointerdown', () => collectGem(gemEntity3));

  // Quest panel
  world.registerSystem(PanelSystem);
 
  if (isMetaQuest1()) {
    const panelEntity = world
      .createTransformEntity()
      .addComponent(PanelUI, {
        config: '/ui/welcome.json',
        maxHeight: 0.8,
        maxWidth: 1.6
      })
      .addComponent(Interactable)
      .addComponent(ScreenSpace, {
        top: '20px',
        left: '20px',
        height: '40%'
      });
    panelEntity.object3D.position.set(0, 1.29, -1.9);
  } else {
    console.log('Panel UI skipped: not running on Meta Quest 1 (heuristic).');
  }

  // Quest Detection
  function isMetaQuest1() {
    try {
      const ua = (navigator && (navigator.userAgent || '')) || '';
      const hasOculus = /Oculus|Quest|Meta Quest/i.test(ua);
      const isQuest2or3 = /Quest\s?2|Quest\s?3|Quest2|Quest3|MetaQuest2|Meta Quest 2/i.test(ua);
      return hasOculus && !isQuest2or3;
    } catch (e) {
      return false;
    }
  }


  // scoreboard code
  let messageBoard; // { canvas, ctx, texture, entity }

  function showMessage(message) {
    const { canvas, ctx, texture, entity } = initMessageBoard();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 120px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#111100';
    ctx.fillText(message, canvas.width / 2, canvas.height / 2);

    texture.needsUpdate = true;
    entity.object3D.visible = true;
  }

  function hideMessage() {
    if (!messageBoard) return;
    const { canvas, ctx, texture, entity } = messageBoard;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    texture.needsUpdate = true;
    entity.object3D.visible = false;
  }

  function showTemporaryMessage(message, duration = 2000) {
    showMessage(message);
    setTimeout(hideMessage, duration);
  }

  function initMessageBoard() {
    if (messageBoard) return messageBoard;

    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;

    const ctx = canvas.getContext('2d');
    const texture = new CanvasTexture(canvas);

    const aspect = canvas.width / canvas.height;
    const boardHeight = 1;
    const boardWidth = boardHeight * aspect;

    const boardMaterial = new MeshStandardMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });

    const boardGeometry = new PlaneGeometry(boardWidth, boardHeight);
    const boardMesh = new Mesh(boardGeometry, boardMaterial);

    const entity = world.createTransformEntity(boardMesh);
    entity.object3D.position.set(0, 1.5, -5.5);
    entity.object3D.visible = false;

    messageBoard = { canvas, ctx, texture, entity };
    return messageBoard;
  }

});
