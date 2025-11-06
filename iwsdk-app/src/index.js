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

  // test sphere
  //const sphereGeometry = new SphereGeometry(0.5, 32, 32);
  //const greenMaterial = new MeshStandardMaterial({ color: 0x33ff33 });
  //const sphere = new Mesh(sphereGeometry, greenMaterial);
  //const sphereEntity = world.createTransformEntity(sphere);

  //sphereEntity.object3D.position.set(0, 1, -3);  
  //sphereEntity.addComponent(Interactable);      
  //sphereEntity.object3D.addEventListener("pointerdown", removeSphere);
  //function removeSphere() {
    //sphereEntity.destroy();
  //}

  // adding floor
  const floorGeometry = new PlaneGeometry(20, 20);
  const floorMaterial = new MeshStandardMaterial({ color: 'green' });
  const floorMesh = new Mesh(floorGeometry, floorMaterial);
  floorMesh.rotation.x = -Math.PI / 2;
  const floorEntity = world.createTransformEntity(floorMesh);

  floorEntity.addComponent(LocomotionEnvironment, { type: EnvironmentType.STATIC });

  // adding plant
  //const plantModel = AssetManager.getGLTF('myPlant').scene;
  //const plantEntity = world.createTransformEntity(plantModel);
  //plantEntity.object3D.position.set(-1, 1, -1);

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
