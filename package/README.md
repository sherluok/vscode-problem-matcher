```js
import {
  beginsPattern,
  endsPattern,
  logBeginsPattern,
  logEndsPattern,
} from '@sherluok/vscode-problem-matcher/common';

console.log(beginsPattern);
console.log(endsPattern);

logBeginsPattern();
logEndsPattern();
```

配置 Webpack 以支持 [VS Code 扩展](https://marketplace.visualstudio.com/items?itemName=sherluok.problem-matcher)：

```js
import { VscodeTaskPlugin } from '@sherluok/vscode-problem-matcher/webpack';

webpack({
  plugins: [
    new VscodeTaskPlugin(),
  ],
});
```
