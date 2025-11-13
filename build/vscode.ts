import { context as esbuildContext, type BuildOptions, type Plugin } from 'esbuild';
import { cpSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { cp, rm, writeFile } from 'node:fs/promises';
import { basename, join, posix, resolve, win32 } from 'node:path';
import { webfont } from 'webfont';
import { default as packageJSON } from '../package.json' with { type: 'json' };
import { vscodeTaskPlugin } from '../src/npm/esbuild';
import { default as manifestJSON } from '../src/vscode/manifest.json' with { type: 'json' };

const workspaceRoot = join(__dirname, '..');

const srcDir = join(workspaceRoot, 'src/vscode');
const outDir = join(workspaceRoot, 'out/vscode');

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

async function cleanOutputs(): Promise<void> {
  await rm(outDir, {
    recursive: true,
    force: true,
  });
}

async function contributeIcons() {
  const searchDir = join(workspaceRoot, 'src/vscode/icons/brand');
  const svgFiles = readdirSync(searchDir).filter((it) => it.endsWith('.svg')).map((it) => join(searchDir, it).replaceAll(win32.sep, posix.sep));
  const fontResult = await webfont({
    files: svgFiles,
    formats: ['woff'],
    startUnicode: 0xE000,
    fontHeight: 1600,
    verbose: true,
    normalize: true,
    sort: false
  });

  mkdirSync(join(workspaceRoot, 'out/vscode/icons/'), { recursive: true });
  cpSync(join(workspaceRoot, 'src/vscode/icons/brand.html'), join(workspaceRoot, 'out/vscode/icons/brand.html'));
  writeFileSync(join(workspaceRoot, 'out/vscode/icons/brand.woff'), fontResult.woff!, 'binary');

  mkdirSync(join(workspaceRoot, 'examples/icons/.vscode'), { recursive: true });
  writeFileSync(join(workspaceRoot, 'examples/icons/.vscode/tasks.json'), JSON.stringify({
    version: '2.0.0',
    tasks: svgFiles.map((it) => ({
      label: `brand-${basename(it).replace(/\.svg$/, '')}`,
      type: 'shell',
      command: 'pwd',
      icon: {
        id: `brand-${basename(it).replace(/\.svg$/, '')}`,
      },
    })),
  }, null, 2));

  return Object.fromEntries(svgFiles.map((it, i) => [`brand-${basename(it).replace(/\.svg$/, '')}`, {
    description: `Sherluok's brand icon`,
    default: {
      fontPath: './icons/brand.woff',
      fontCharacter: `\\e${i.toString(16).padStart(3, '0')}`,
    },
  }]));
}

async function copyTemplates(): Promise<void> {
  await cp(resolve('LICENSE'), join(outDir, 'LICENSE'));
  await cp(join(srcDir, 'README.md'), join(outDir, 'README.md'));
  await cp(join(srcDir, 'icon.png'), join(outDir, 'icon.png'));

  const contributesIcons = await contributeIcons();

  const extensionPackageJSON = Object.assign({
    version: packageJSON.version,
    repository: packageJSON.repository,
    homepage: packageJSON.homepage,
    license: packageJSON.license,
    engines: {
      vscode: packageJSON.devDependencies['@types/vscode'],
    },
  }, manifestJSON, {
    contributes: {
      ...manifestJSON.contributes,
      icons: contributesIcons,
    },
  });

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
  } else if (process.argv.includes('--fonts')) {
    contributeIcons().then(console.log).catch((error) => {
      console.error(error);
      process.exit(1);
    });
  } else {
    build().catch((error) => {
      console.error(error);
      process.exit(1);
    });
  }
}
