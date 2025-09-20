import { type Plugin } from 'rollup';
import { logBeginsPattern, logEndsPattern } from './node';

// https://rollupjs.org/plugin-development
export function vscodeTaskPlugin(): Plugin {
  return {
    name: 'vscode-task-problem-matcher',
    buildStart() {
      logBeginsPattern();
    },
    buildEnd(error) {
      if (!error) {
        logEndsPattern();
      }
    },
  };
}
