import {
  AmbientLight,
  DirectionalLight,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  WebGLRenderer,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { getVehicleOptionById } from '../../../shared/config/assets';
import { prepareVehicleModel } from '../../../entities/car/lib/vehicle-scene';

const THUMBNAIL_WIDTH = 320;
const THUMBNAIL_HEIGHT = 180;
const THUMBNAIL_KEY_SEPARATOR = '::';

let renderer: WebGLRenderer | null = null;
const loader = new GLTFLoader();
const baseSceneCache = new Map<string, Promise<Group>>();
const thumbnailCache = new Map<string, Promise<string | null>>();

function getRenderer() {
  if (renderer) {
    return renderer;
  }

  renderer = new WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: 'low-power',
    preserveDrawingBuffer: true,
  });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(1);
  renderer.setSize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, false);
  renderer.outputColorSpace = 'srgb';
  return renderer;
}

async function loadBaseScene(vehicleId: string) {
  const cachedScene = baseSceneCache.get(vehicleId);

  if (cachedScene) {
    return cachedScene;
  }

  const vehicle = getVehicleOptionById(vehicleId);

  if (!vehicle) {
    return Promise.resolve(new Group());
  }

  const scenePromise = loader.loadAsync(vehicle.assetPath).then((gltf) => gltf.scene as Group);
  baseSceneCache.set(vehicleId, scenePromise);
  return scenePromise;
}

function createFloorGlow() {
  const floor = new Mesh(new PlaneGeometry(10, 10), new MeshBasicMaterial({ color: '#16334a', transparent: true, opacity: 0.32 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.92;
  floor.scale.set(0.9, 0.34, 1);
  return floor;
}

function isSceneMesh(node: unknown): node is Mesh {
  return node instanceof Mesh;
}

function disposeGroup(root: Group) {
  root.traverse((node) => {
    if (!isSceneMesh(node)) {
      return;
    }

    node.geometry.dispose();

    if (Array.isArray(node.material)) {
      node.material.forEach((material) => material.dispose());
      return;
    }

    node.material.dispose();
  });
}

async function renderThumbnail(vehicleId: string, paintColor: string) {
  try {
    const baseScene = await loadBaseScene(vehicleId);
    const preparedVehicle = prepareVehicleModel(baseScene, paintColor);
    const scene = new Scene();
    const camera = new OrthographicCamera(-3.2, 3.2, 1.8, -1.8, 0.1, 30);
    const nextRenderer = getRenderer();

    camera.position.set(4.8, 2.2, 5.8);
    camera.lookAt(0.4, -0.15, 0);

    preparedVehicle.position.set(0.55, -0.9, 0);
    preparedVehicle.rotation.set(-0.05, -0.72, 0);
    preparedVehicle.scale.setScalar(1.02);

    scene.add(new AmbientLight('#dff5ff', 0.8));
    scene.add(new HemisphereLight('#eef8ff', '#14324d', 1.1));

    const keyLight = new DirectionalLight('#ffffff', 1.35);
    keyLight.position.set(4, 5, 6);
    scene.add(keyLight);

    const rimLight = new DirectionalLight('#76dbff', 0.65);
    rimLight.position.set(-3, 4, -2);
    scene.add(rimLight);

    scene.add(createFloorGlow());
    scene.add(preparedVehicle);

    nextRenderer.render(scene, camera);
    const dataUrl = nextRenderer.domElement.toDataURL('image/png');

    scene.remove(preparedVehicle);
    disposeGroup(preparedVehicle);

    return dataUrl;
  } catch {
    return null;
  }
}

export function getVehicleThumbnail(vehicleId: string, paintColor: string) {
  const key = `${vehicleId}${THUMBNAIL_KEY_SEPARATOR}${paintColor}`;
  const cachedThumbnail = thumbnailCache.get(key);

  if (cachedThumbnail) {
    return cachedThumbnail;
  }

  const thumbnailPromise = renderThumbnail(vehicleId, paintColor);
  thumbnailCache.set(key, thumbnailPromise);
  return thumbnailPromise;
}
