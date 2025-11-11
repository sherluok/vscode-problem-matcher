![](./src/vscode/icon.png)

## VS Code Extension

A vscode extension published under id [`sherluok.problem-matcher`](https://marketplace.visualstudio.com/items?itemName=sherluok.problem-matcher) at marketplace.

```sh
code --install-extension sherluok.problem-matcher
```

[Doc](./src/vscode/README.md)

## NPM Package

A npm package published under id [`@sherluok/vscode-problem-matcher`](https://www.npmjs.com/package/@sherluok/vscode-problem-matcher) at npm registry.

```sh
pnpm add @sherluok/vscode-problem-matcher
```

[Doc](./src/npm/README.md)

## Development

### vscode

```sh
pnpm run vscode:build
cd ./out/vscode
pnpm dlx vsce package
pnpm dlx vsce login sherluok
pnpm dlx vsce publish
```

#### Bundle Extension

```sh
pnpm run vscode:build
cd ./out/vscode
pnpm dlx vsce package
```

#### Install Extension from Bundled

```sh
code --install-extension ./problem-matcher-0.2.0.vsix
```

> or run vscode task: install

#### Install Extension from Marketplace

```sh
code --install-extension sherluok.problem-matcher
```

#### Publish Extension

https://code.visualstudio.com/api/working-with-extensions/publishing-extension

```sh
pnpm exec vsce publish
```

> or run vscode task: publish

Open https://marketplace.visualstudio.com/manage

### npm

```sh
pnpm run npm:build
cd ./out/npm
pnpm publish --dry-run --no-git-checks
npm login --registry https://registry.npmjs.org
pnpm publish --no-git-checks
```
