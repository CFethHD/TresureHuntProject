
import {
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  SessionMode,
  World,
  AssetManager, AssetType, LocomotionEnvironment, EnvironmentType, PlaneGeometry,   // <-------------- more imports
} from '@iwsdk/core';

import {
  Interactable,
  PanelUI,
  ScreenSpace,
} from '@iwsdk/core';

import { PanelSystem } from './panel.js'; // system for displaying "Enter VR" panel on Quest 1

const assets = {
  myPlant: {                                // <----------------------- added plant model
    url: '/gltf/plantSansevieria/plantSansevieria.gltf',
    type: AssetType.GLTF,
    priority: 'critical',
  },
};


World.create(document.getElementById('scene-container'), {
  assets,
  xr: {
    sessionMode: SessionMode.ImmersiveVR,
    offer: 'always',
    features: { }
  },

  features: {locomotion: true },             // <----------------- added locomotion: true

}).then((world) => {

  const { camera } = world;

 
  // Create a green sphere
  const sphereGeometry = new SphereGeometry(0.5, 32, 32);
  const greenMaterial = new MeshStandardMaterial({ color: 0x33ff33 });
  const sphere = new Mesh(sphereGeometry, greenMaterial);
  //sphere.position.set(1, 0, -2);
  const sphereEntity = world.createTransformEntity(sphere);

  // move the sphere in front of user
  sphereEntity.object3D.position.set(0,1,-3);  
 
  // delete the sphere when it gets selected
  sphereEntity.addComponent(Interactable);      
  sphereEntity.object3D.addEventListener("pointerdown", removeCube);
  function removeCube() {
      sphereEntity.destroy();
  }

  // add a floor
  const floorGeometry = new PlaneGeometry(10, 10);
  const floorMaterial = new MeshStandardMaterial( { color: 'green' } );
  const floorMesh = new Mesh(floorGeometry, floorMaterial);
  floorMesh.rotation.x = -Math.PI / 2;
  const floorEntity = world.createTransformEntity(floorMesh);

  // make floor walkable (also see "locomotion" setting and imports above)
  floorEntity.addComponent(LocomotionEnvironment, { type: EnvironmentType.STATIC });

  // import the plant model (also see "assets" section above)
  const plantModel = AssetManager.getGLTF('myPlant').scene;
  const plantEntity = world.createTransformEntity(plantModel);
  plantEntity.object3D.position.set(-1,1,-1);





  // vvvvvvvv EVERYTHING BELOW WAS ADDED TO DISPLAY A BUTTON TO ENTER VR FOR QUEST 1 DEVICES vvvvvv
  //          (for some reason IWSDK doesn't show Enter VR button on Quest 1)
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
    // Skip panel on non-Meta-Quest-1 devices
    // Useful for debugging on desktop or newer headsets.
    console.log('Panel UI skipped: not running on Meta Quest 1 (heuristic).');
  }
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


