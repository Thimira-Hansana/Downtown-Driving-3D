import { useMemo } from 'react';
import { Group } from 'three';
import { useGLTF } from '@react-three/drei';
import { ASSET_PATHS } from '../../shared/config/assets';
import { cloneScene, normalizeScene, prepareScene } from '../../shared/lib/scene-utils';
import { SIMULATOR_CONFIG } from '../../features/simulator/config/simulator.config';

interface CarModelProps {
  bodyLean: number;
}

export function CarModel({ bodyLean }: CarModelProps) {
  const { scene } = useGLTF(ASSET_PATHS.car);

  const model = useMemo(() => {
    const nextScene = cloneScene(scene) as Group;
    prepareScene(nextScene, { castShadow: true, receiveShadow: true });
    normalizeScene(nextScene, {
      alignBottom: true,
      centerXZ: true,
      targetFootprint: SIMULATOR_CONFIG.vehicle.visualFootprint,
    });
    return nextScene;
  }, [scene]);

  return (
    <group rotation={[0, SIMULATOR_CONFIG.vehicle.modelYawOffset, bodyLean]}>
      <primitive object={model} />
    </group>
  );
}

useGLTF.preload(ASSET_PATHS.car);
