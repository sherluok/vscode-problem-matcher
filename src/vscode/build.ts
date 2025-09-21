import { context as esbuildContext, type BuildOptions, type Plugin } from 'esbuild';
import { cp, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { default as packageJSON } from '../../package.json' with { type: 'json' };
import { vscodeTaskPlugin } from '../npm/esbuild';
import { default as manifestJSON } from './manifest.json' with { type: 'json' };

const srcDir = resolve('src/vscode');
const outDir = resolve('out/vscode');

const buildOptions: BuildOptions = {
  entryPoints: [
    join(srcDir, 'main.ts'),
  ],
  sourceRoot: srcDir,
  outdir: outDir,
  platform: 'node',
  target: 'node22',
  external: [
    'vscode',
  ],
  bundle: true,
  metafile: true,
  plugins: [
    vscodeTaskPlugin(),
    resultLoggerPlugin(),
  ],
};

async function cleanOutputs() {
  await rm(outDir, {
    recursive: true,
    force: true,
  });
}

async function copyTemplates() {
  await cp(resolve('LICENSE'), join(outDir, 'LICENSE'));
  await cp(join(srcDir, 'README.md'), join(outDir, 'README.md'));
  await cp(join(srcDir, 'icon.png'), join(outDir, 'icon.png'));

  const extensionPackageJSON = Object.assign({
    version: packageJSON.version,
    repository: packageJSON.repository,
    homepage: packageJSON.homepage,
    license: packageJSON.license,
    engines: {
      vscode: packageJSON.devDependencies['@types/vscode'],
    },
  }, manifestJSON);

  await writeFile(join(outDir, 'package.json'), JSON.stringify(extensionPackageJSON, null, 2));
}

// https://esbuild.github.io/plugins/
function resultLoggerPlugin(): Plugin {
  return {
    name: 'result-logger',
    setup(build) {
      build.onStart(() => {
        console.log(new Date().toLocaleString());
      });
      build.onEnd((result) => {
        Object.entries(result.metafile?.outputs ?? {}).forEach(([path, { bytes }]) => {
          console.log('%skb %s', (bytes / 1024).toFixed(0).padStart(4, ' '), path);
        });
      });
    },
  };
}

async function watch() {
  await cleanOutputs();
  await copyTemplates();
  const ctx = await esbuildContext({
    ...buildOptions,
    sourcemap: true,
    packages: 'external',
    define: {
      MODE: JSON.stringify('development'),
    },
  });
  await ctx.watch();
}

async function build() {
  await cleanOutputs();
  await copyTemplates();
  const ctx = await esbuildContext({
    ...buildOptions,
    packages: 'bundle',
    minifySyntax: true,
    define: {
      MODE: JSON.stringify('production'),
    },
  });
  await ctx.rebuild();
  await ctx.dispose();
}

if (require.main === module) {
  if (process.argv.includes('--watch')) {
    watch();
  } else {
    build();
  }
}
