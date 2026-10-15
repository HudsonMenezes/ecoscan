import { useEffect, useState } from 'react';

// Descobre se existe alguma câmera sem pedir permissão (enumerateDevices não
// abre a câmera). `null` enquanto verifica ou quando o navegador não informa.
export function useHasCamera(): boolean | null {
  const [hasCamera, setHasCamera] = useState<boolean | null>(null);

  useEffect(() => {
    const devices = navigator.mediaDevices;
    if (!devices?.enumerateDevices) return;
    let active = true;
    devices
      .enumerateDevices()
      .then((list) => {
        if (active) setHasCamera(list.some((device) => device.kind === 'videoinput'));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  return hasCamera;
}
