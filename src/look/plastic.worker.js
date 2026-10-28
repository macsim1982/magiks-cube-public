import { plasticMaps } from './plastic';

// Les cartes du plastique, calculées hors du fil principal
const maps = plasticMaps();
self.postMessage(maps, Object.values(maps).map((data) => data.buffer));
