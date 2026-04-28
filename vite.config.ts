import { copyFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { defineConfig, type PluginOption, type ResolvedConfig } from 'vite';
import react from '@vitejs/plugin-react';

function githubPagesSpaFallback(): PluginOption {
  let config: ResolvedConfig;

  return {
    name: 'github-pages-spa-fallback',
    apply: 'build',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    closeBundle() {
      const outDir = resolvePath(config.root, config.build.outDir);

      copyFileSync(resolvePath(outDir, 'index.html'), resolvePath(outDir, '404.html'));
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: '/magister-labs/',
  plugins: [react(), githubPagesSpaFallback()],
  build: {
    minify: 'esbuild',
  },
});
