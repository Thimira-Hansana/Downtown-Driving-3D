export const CAMERA_MODES = ['chase', 'driver', 'overview'] as const;

export type CameraMode = (typeof CAMERA_MODES)[number];

export const SIMULATOR_CONFIG = {
  world: {
    background: '#92c7f4',
    fogColor: '#92c7f4',
    fogNear: 65,
    fogFar: 320,
  },
  vehicle: {
    acceleration: 19,
    aerodynamicDrag: 0.016,
    bodyLean: 0.18,
    brakeStrength: 34,
    maxForwardSpeed: 40,
    maxReverseSpeed: 12,
    collisionProbeHeight: 0.9,
    collisionProbeLength: 1.5,
    collisionRadius: 1.05,
    modelYawOffset: 0,
    orientationLerp: 9,
    reverseAcceleration: 10,
    rideHeight: 0.62,
    rollingResistance: 2.4,
    steerResponse: 11,
    trackWidth: 1.72,
    turnGrip: 0.052,
    visualFootprint: 4.65,
    wheelBase: 2.8,
    maxSteerAngle: 0.88,
    boostMultiplier: 1.22,
  },
  camera: {
    chase: {
      baseFov: 56,
      followDamping: 7.2,
      localLookOffset: [0, 1.05, 4.9] as const,
      localPositionOffset: [0, 2.45, -6.6] as const,
    },
    driver: {
      baseFov: 72,
      followDamping: 8.5,
      localLookOffset: [0, 1.2, 14] as const,
      localPositionOffset: [0, 1.32, 0.48] as const,
    },
    overview: {
      baseFov: 52,
      followDamping: 4.5,
      localLookOffset: [0, 0.8, 4] as const,
      localPositionOffset: [0, 17, -15] as const,
    },
  },
} as const;
