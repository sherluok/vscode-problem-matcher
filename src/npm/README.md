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

esbuild({
  plugins: [
    vscodeTaskPlugin(),
  ],
});
```

### Rollup

```js
import { vscodeTaskPlugin } from '@sherluok/vscode-problem-matcher/rollup';

rollup({
  plugins: [
    vscodeTaskPlugin(),
  ],
});
```
