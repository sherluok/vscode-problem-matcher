import { type Plugin } from 'esbuild';
import { logBeginsPattern, logEndsPattern } from './node';

// https://esbuild.github.io/plugins/
export function vscodeTaskPlugin(): Plugin {
  return {
    name: 'vscode-task-problem-matcher',
    setup(build) {
      build.onStart(() => {
        logBeginsPattern();
      });
      build.onEnd(() => {
        logEndsPattern();
      });
    },
  };
}
