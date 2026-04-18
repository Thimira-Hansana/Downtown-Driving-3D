import { BufferGeometry, Color, Group, Material, Mesh, Object3DEventMap } from 'three';
import { SIMULATOR_CONFIG } from '../../../features/simulator/config/simulator.config';
import { cloneScene, normalizeScene, prepareScene } from '../../../shared/lib/scene-utils';

type ColorableMaterial = Material & { color: Color };
type SceneMesh = Mesh<BufferGeometry, Material | Material[], Object3DEventMap>;

const MATERIAL_NAME_BLOCKLIST = [
  'glass',
  'window',
  'windshield',
  'tire',
  'tyre',
  'wheel',
  'rim',
  'chrome',
  'light',
  'lamp',
  'head',
  'tail',
  'disc',
  'interior',
  'seat',
  'steer',
  'dash',
  'grill',
  'grille',
  'mirror',
  'plate',
  'logo',
  'emblem',
  'exhaust',
  'engine',
] as const;

function cloneMaterials(node: Mesh) {
  if (Array.isArray(node.material)) {
    node.material = node.material.map((material) => material.clone());
    return;
  }

  node.material = node.material.clone();
}

function isSceneMesh(node: unknown): node is SceneMesh {
  return node instanceof Mesh;
}

function isColorableMaterial(material: Material): material is ColorableMaterial {
  return 'color' in material && material.color instanceof Color;
}

function shouldTintMaterial(meshName: string, material: Material) {
  if (!isColorableMaterial(material)) {
    return false;
  }

  const searchableName = `${meshName} ${material.name}`.toLowerCase();

  if (MATERIAL_NAME_BLOCKLIST.some((keyword) => searchableName.includes(keyword))) {
    return false;
  }

  const hsl = { h: 0, s: 0, l: 0 };
  material.color.getHSL(hsl);

  if (hsl.l < 0.08) {
    return false;
  }

  if (hsl.s < 0.06 && hsl.l < 0.22) {
    return false;
  }

  return true;
}

function tintMaterial(material: Material, meshName: string, paintColor: Color) {
  if (!shouldTintMaterial(meshName, material)) {
    return;
  }

  const colorableMaterial = material as ColorableMaterial;
  const baseColor = colorableMaterial.color.clone();
  const tintStrength = baseColor.getHSL({ h: 0, s: 0, l: 0 }).s < 0.1 ? 0.45 : 0.68;
  colorableMaterial.color.copy(baseColor.lerp(paintColor, tintStrength));
}

export function applyVehiclePaint(root: Group, paintHex: string) {
  const paintColor = new Color(paintHex);

  root.traverse((node) => {
    if (!isSceneMesh(node)) {
      return;
    }

    cloneMaterials(node);

    if (Array.isArray(node.material)) {
      node.material.forEach((material) => tintMaterial(material, node.name, paintColor));
      return;
    }

    tintMaterial(node.material, node.name, paintColor);
  });
}

export function prepareVehicleModel(scene: Group, paintHex: string) {
  const nextScene = cloneScene(scene) as Group;
  prepareScene(nextScene, { castShadow: true, receiveShadow: true });
  normalizeScene(nextScene, {
    alignBottom: true,
    centerXZ: true,
    targetFootprint: SIMULATOR_CONFIG.vehicle.visualFootprint,
  });
  applyVehiclePaint(nextScene, paintHex);
  return nextScene;
}
