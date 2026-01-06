import './main';
import './style.scss';

import { version as pcuiVersion, revision as pcuiRevision } from '@playcanvas/pcui';
import { version as engineVersion, revision as engineRevision } from 'playcanvas';

import { version as textureToolVersion } from '../package.json';

// print out versions of dependent packages
console.log(`Texture Tool v${textureToolVersion} | PCUI v${pcuiVersion} (${pcuiRevision}) | PlayCanvas Engine v${engineVersion} (${engineRevision})`);
