import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { default as packageJSON } from '../package.json' with { type: 'json' };
import { increaseVersion } from './semver';

const prevVersion = packageJSON.version;
const nextVersion = increaseVersion(prevVersion, (major, minor, patch) => [major, minor, patch + 1]);

console.log('Update package.json version from \x1b[32m%s\x1b[0m to \x1b[33m%s\x1b[0m', prevVersion, nextVersion);

writeFileSync(join(__dirname, '../package.json'), JSON.stringify(Object.assign({}, packageJSON, { version: nextVersion }), null, 2));
