import fs from "fs";
import * as THREE from "three";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

const dracoLoader = new DRACOLoader();
const loader = new GLTFLoader();

loader.setDRACOLoader(dracoLoader);

const loadGLB = (path) => {
  const data = fs.readFileSync(path);

  loader.parse(data.buffer, '', (gltf) => {
    gltf.scene.traverse((child) => {
      if (child.isMesh && child.morphTargetDictionary) {
        console.log(`Morph Target Dictionary for ${child.name}:`, child.morphTargetDictionary);
      }
    });
  }, (error) => {
    console.error('An error happened:', error);
  });
};

loadGLB('C:\\Users\\arsal\\OneDrive\\Desktop\\Relearn\\3d_chat\\Ai_teacher\\r3f-ai-language-teacher\\public\\models\\animations_Nanami.glb');
