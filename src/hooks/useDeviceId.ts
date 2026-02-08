import { useState, useEffect } from 'react';

export const useDeviceId = () => {
  const [deviceId, setDeviceId] = useState<string>('');

  useEffect(() => {
    let id = localStorage.getItem('scene_device_id');
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem('scene_device_id', id);
    }
    setDeviceId(id);
  }, []);

  return deviceId;
};
