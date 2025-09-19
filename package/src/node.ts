import { beginsPattern, endsPattern } from './common';

export function isVscodeTerminal() {
  return process.env.TERM_PROGRAM === 'vscode';
}

export function logBeginsPattern() {
  if (isVscodeTerminal()) {
    console.log('\x1b[1;35m%s\x1b[0m', beginsPattern);
  }
}

export function logEndsPattern() {
  if (isVscodeTerminal()) {
    console.log('\x1b[1;35m%s\x1b[0m', endsPattern);
  }
}
