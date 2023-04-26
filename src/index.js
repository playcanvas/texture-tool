import './main.js';
import './style.scss';

import { version as textureToolVersion } from '../package.json';
import { version as pcuiVersion, revision as pcuiRevision } from 'pcui';
import { version as engineVersion, revision as engineRevision } from 'playcanvas';

// print out versions of dependent packages
console.log(`Texture Tool v${textureToolVersion} | PCUI v${pcuiVersion} (${pcuiRevision}) | PlayCanvas Engine v${engineVersion} (${engineRevision})`);
