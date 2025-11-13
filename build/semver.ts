/**
 * Semantic Versioning 2.0.0
 * https://semver.org/
 */

export function increaseVersion(version: string, update: (major: number, minor: number, patch: number) => [major: number, minor: number, patch: number]) {
  const [major, minor, patch] = version.split('.').map((it) => parseInt(it));
  return update(major, minor, patch).join('.');
}
