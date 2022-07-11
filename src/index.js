import './main.js';

import { version as textureToolVersion } from '../package.json';
import { version as pcuiVersion } from '@playcanvas/pcui/package.json';
import { version as engineVersion } from 'playcanvas/package.json';

const versions = [
    ['TextureTool', textureToolVersion],
    ['Engine', engineVersion],
    ['Pcui', pcuiVersion]
];

console.log(versions.map(entry => `${entry[0]} v${entry[1]}`).join(' '));