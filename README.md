![](./src/vscode/icon.png)

## VS Code Extension

```sh
pnpm run vscode:build
cd ./out/vscode
pnpm dlx vsce package
pnpm dlx vsce login sherluok
pnpm dlx vsce publish
```

### Bundle Extension

```sh
pnpm run build
pnpm exec vsce package
```

### Install Extension from Bundled

```sh
code --install-extension ./problem-matcher-0.2.0.vsix
```

> or run vscode task: install

### Install Extension from Marketplace

```sh
code --install-extension sherluok.problem-matcher
```

### Publish Extension

https://code.visualstudio.com/api/working-with-extensions/publishing-extension

```sh
pnpm exec vsce publish
```

> or run vscode task: publish

Open https://marketplace.visualstudio.com/manage


## NPM Package

```sh
pnpm run npm:build
cd ./out/npm
pnpm publish --dry-run --no-git-checks
npm login --registry https://registry.npmjs.org
pnpm publish --no-git-checks
```
