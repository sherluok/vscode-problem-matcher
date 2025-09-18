export const beginsPattern = 'vscode background task begins';
export const endsPattern = 'vscode background task ends';

export function logBeginsPattern() {
  console.log('\x1b[1;35m%s\x1b[0m', beginsPattern);
}

export function logEndsPattern() {
  console.log('\x1b[1;35m%s\x1b[0m', endsPattern);
}
