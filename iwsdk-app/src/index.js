import {
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  SessionMode,
  World,
  AssetManager, AssetType,
  LocomotionEnvironment, EnvironmentType,
  PlaneGeometry,
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

  // --- SIMPLE TREASURE / SCORE SYSTEM (ADDED) ---
  const totalGems = 3;
  let collectedGems = 0;

  function showWinMessage() {
    // You can replace this with the message code from the slides if needed
    alert('You win! All treasures collected!');
  }

  function collectGem(entity) {
    // remove the gem from the world
    entity.destroy();

    // update score
    collectedGems++;
    console.log(`Gems collected: ${collectedGems} / ${totalGems}`);

    // check win condition
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
  // Optional scaling if tree is too big/small:
  // treeEntity.object3D.scale.setScalar(0.5);

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

  // make gem 1 clickable / collectable
  gemEntity.addComponent(Interactable);
  gemEntity.object3D.addEventListener('pointerdown', () => collectGem(gemEntity));

  // adding second gem (found in right tree)
  const gemModel2 = AssetManager.getGLTF('gem').scene.clone();
  const gemEntity2 = world.createTransformEntity(gemModel2);
  gemEntity2.object3D.position.set(2, 3, -5); 
  gemEntity2.object3D.scale.setScalar(3);  

  // make gem 2 clickable / collectable
  gemEntity2.addComponent(Interactable);
  gemEntity2.object3D.addEventListener('pointerdown', () => collectGem(gemEntity2));

  // adding third gem (found in right tree)
  const gemModel3 = AssetManager.getGLTF('gem').scene.clone();
  const gemEntity3 = world.createTransformEntity(gemModel3);
  gemEntity3.object3D.position.set(0, 0, 5); 
  gemEntity3.object3D.scale.setScalar(3);  

  // make gem 3 clickable / collectable
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

});
