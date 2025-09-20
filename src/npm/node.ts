import { styledBeginsPattern, styledEndsPattern } from './common';

export function isVscodeTerminal() {
  return process.env.TERM_PROGRAM === 'vscode';
}

export function logBeginsPattern() {
  if (isVscodeTerminal()) {
    console.log(styledBeginsPattern);
  }
}

export function logEndsPattern() {
  if (isVscodeTerminal()) {
    console.log(styledEndsPattern);
  }
}
