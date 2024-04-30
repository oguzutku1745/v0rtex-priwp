import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import copy from 'rollup-plugin-copy';
import fs from 'fs';
import path from 'path';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import EnvironmentPlugin from 'vite-plugin-environment'

const wasmContentTypePlugin = {
    name: 'wasm-content-type-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url.endsWith('.wasm')) {
          res.setHeader('Content-Type', 'application/wasm');
          const newPath = req.url.replace('deps', 'dist');
          const targetPath = path.join(__dirname, newPath);
          const wasmContent = fs.readFileSync(targetPath);
          return res.end(wasmContent);
        }
        next();
      });
    },
  };
  export default defineConfig(({ command }) => {
    const optimizeDeps = {
        esbuildOptions: {
            define: {
                global: "globalThis", // Polyfill for Node.js globals to browser environment
            },
            plugins: [
                NodeGlobalsPolyfillPlugin({
                    buffer: true, // Enables use of Node.js 'buffer' module in the browser
                }),
            ],
        },
    };

    if (command === 'serve') {
      return {
        define: {
            global: 'window',  // Ensuring global points to window, which includes all TextEncoder and other APIs
        },
        plugins: [
        react(),
          copy({
            targets: [{ src: 'node_modules/**/*.wasm', dest: 'node_modules/.vite/dist' }],
            copySync: true,
            hook: 'buildStart',
          }),
          command === 'serve' ? wasmContentTypePlugin : [],
          EnvironmentPlugin(['COMMENT_VERIFIER_ADDRESS','CHAIN_ID']),
        ],
        optimizeDeps: optimizeDeps
      };
    }
  
    return {};
  });

