const withBase = (path: string) => `${import.meta.env.BASE_URL}${path}`;

export const ASSET_PATHS = {
  audio: {
    acceleration: withBase('assets/audio/car-acceleration.mp3'),
    brake: withBase('assets/audio/_A_sudden_hard_car_brake_.mp3'),
    city: withBase('assets/audio/city-sounds.mp3'),
    crash: withBase('assets/audio/car-crash-sound.mp3'),
    drift: withBase('assets/audio/drift.mp3'),
    horn: withBase('assets/audio/double-car-horn.mp3'),
  },
  car: withBase('assets/car/free_porsche_911_carrera_4s.glb'),
  map: withBase('assets/map/nfs_undercover_ds_-_metropolis.glb'),
} as const;
