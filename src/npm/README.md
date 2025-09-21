```js
import { beginsPattern, endsPattern } from '@sherluok/vscode-problem-matcher/common';

console.log(beginsPattern);
console.log(endsPattern);
```

```js
import { logBeginsPattern, logEndsPattern } from '@sherluok/vscode-problem-matcher/node';

logBeginsPattern();
logEndsPattern();
```

## Integrations

Use bundler plugins to integrate with [sherluok.problem-matcher](https://marketplace.visualstudio.com/items?itemName=sherluok.problem-matcher) VS Code extension's `$common` problem matcher.

### Webpack

```js
import { VscodeTaskPlugin } from '@sherluok/vscode-problem-matcher/webpack';

webpack({
  plugins: [
    new VscodeTaskPlugin(),
  ],
});
```

### esbuild

```js
import { vscodeTaskPlugin } from '@sherluok/vscode-problem-matcher/esbuild';

esbuild.build({
  plugins: [
    vscodeTaskPlugin(),
  ],
});
```

### Rollup

```js
import { vscodeTaskPlugin } from '@sherluok/vscode-problem-matcher/rollup';

rollup.rollup({
  plugins: [
    vscodeTaskPlugin(),
  ],
});
```

For multiple Rollup config, `vscodeTaskPlugin()` will print to console multiple times each build. In this case, use `SharedVscodeTaskPluginFactory`, it will only print one time each build.

```js
import { SharedVscodeTaskPluginFactory } from '@sherluok/vscode-problem-matcher/rollup';

const vscodeTask = new SharedVscodeTaskPluginFactory();

rollup.watch([
  {
    plugins: [
      vscodeTask.buildPlugin(),
    ],
    output: [
      {
        format: 'cjs',
        entryFileNames: '[name].cjs',
        plugins: [vscodeTask.outputPlugin()],
      },
      {
        format: 'esm',
        entryFileNames: '[name].mjs',
        plugins: [vscodeTask.outputPlugin()],
      },
    ],
  },
  {
    plugins: [
      dts(),
      vscodeTask.buildPlugin(),
    ],
    output: [
      {
        format: 'esm',
        entryFileNames: '[name].d.ts',
        plugins: [vscodeTask.outputPlugin()],
      },
    ],
  }
]);
```
