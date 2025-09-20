import { default as typescript } from '@rollup/plugin-typescript';
import { cp, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { rollup as rollupBuild, watch as rollupWatch, type InputOptions, type OutputOptions, type Plugin, type RollupBuild } from 'rollup';
import packageJSON from '../package.json';
import manifestJSON from '../src/npm/manifest.json';
import { vscodeTaskPlugin } from '../src/npm/rollup';

const srcDir = resolve('src/npm');
const outDir = resolve('out/npm');

// https://rollupjs.org/javascript-api/
// https://github.com/rollup/plugins/tree/master/packages/typescript

const inputEntries = [
  join(srcDir, 'common.ts'),
  join(srcDir, 'esbuild.ts'),
  join(srcDir, 'node.ts'),
  join(srcDir, 'rollup.ts'),
  join(srcDir, 'webpack.ts'),
];

const inputOptions: InputOptions = {
  input: inputEntries,
  plugins: [
    typescript({
      compilerOptions: {
        noEmit: false,
        emitDeclarationOnly: true,
        target: 'es2022',
        declaration: true,
        rootDir: srcDir,
        declarationDir: outDir,
        declarationMap: true,
      },
    }),
    vscodeTaskPlugin(),
    resultLoggerPlugin(),
  ],
};

const outputOptionsList: OutputOptions[] = [
  {
    dir: outDir,
    format: 'cjs',
    entryFileNames: '[name].cjs',
    sourcemap: true,
  },
  {
    dir: outDir,
    format: 'esm',
    entryFileNames: '[name].mjs',
    sourcemap: true,
  },
];

// https://rollupjs.org/plugin-development
function resultLoggerPlugin(): Plugin {
  return {
    name: 'result-logger',
    buildStart() {
      console.log(new Date().toLocaleString());
    },
    writeBundle(options, bundle) {
      Object.entries(bundle).forEach(([path, info]) => {
        if (info.type === 'asset') {
          const bytes = Buffer.from(info.source).byteLength;
          console.log('%skb %s', (bytes / 1024).toFixed(2).padStart(4, ' '), path);
        }
      });
    },
  };
}

async function cleanOutputs() {
  await rm(outDir, {
    recursive: true,
    force: true,
  });
}

async function writeOutputs(bundle: RollupBuild) {
  for (const outputOptions of outputOptionsList) {
    await bundle.write(outputOptions);
  }
}

async function copyTemplates() {
  await cp(resolve('LICENSE'), join(outDir, 'LICENSE'));
  await cp(join(srcDir, 'README.md'), join(outDir, 'README.md'));

  const npmPackageJSON = Object.assign({
    version: packageJSON.version,
    repository: packageJSON.repository,
    homepage: packageJSON.homepage,
    license: packageJSON.license,
    peerDependencies: packageJSON.peerDependencies,
  }, manifestJSON);

  await writeFile(join(outDir, 'package.json'), JSON.stringify(npmPackageJSON, null, 2));
}

async function watch() {
  await cleanOutputs();
  await copyTemplates();
  await rollupWatch({
    ...inputOptions,
    output: outputOptionsList,
  });
}

async function build() {
  await cleanOutputs();
  await copyTemplates();
  const bundle = await rollupBuild(inputOptions);
  await writeOutputs(bundle);
  await bundle.close();
}

if (require.main === module) {
  if (process.argv.includes('--watch')) {
    watch();
  } else {
    build();
  }
}
