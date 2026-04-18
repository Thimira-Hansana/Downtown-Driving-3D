import { useEffect, useState } from 'react';
import { getVehicleThumbnail } from '../lib/vehicle-thumbnail-cache';

interface VehicleCardPreviewProps {
  paintColor: string;
  vehicleId: string;
}

export function VehicleCardPreview({ paintColor, vehicleId }: VehicleCardPreviewProps) {
  const [thumbnailSrc, setThumbnailSrc] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    void getVehicleThumbnail(vehicleId, paintColor).then((nextThumbnail) => {
      if (!isMounted) {
        return;
      }

      setThumbnailSrc(nextThumbnail);
    });

    return () => {
      isMounted = false;
    };
  }, [paintColor, vehicleId]);

  if (!thumbnailSrc) {
    return <div className="garage-panel__card-art-placeholder" />;
  }

  return <img src={thumbnailSrc} alt="" draggable={false} className="garage-panel__card-image" />;
}
