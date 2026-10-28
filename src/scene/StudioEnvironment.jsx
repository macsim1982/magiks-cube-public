// @ts-check
import { Environment } from '@react-three/drei';
// « Empty Warehouse 01 » (Poly Haven, CC0), l’HDR du preset `warehouse` de
// drei, réencodé en JPEG à gain map : 160 ko servis par le site au lieu de
// 1,7 Mo pris sur un CDN tiers. Même résolution (1k), même rendu.
import warehouse from './assets/warehouse-1k.jpg';

export default function StudioEnvironment() {
  return <Environment files={warehouse} environmentIntensity={0.9} />;
}
