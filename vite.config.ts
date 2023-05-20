import reactPlugin from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import logseqDevPlugin from "vite-plugin-logseq";
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import * as path from "path";
import * as fs from "fs";
const { parseSync, traverse } = require('@babel/core');
const generate = require('@babel/generator').default;
// https://vitejs.dev/config/

function staticFileSyncPlugin() {
    return {
        name: 'static-readFileSync',
        transform(code, id) {

            if (/\.(js|ts|tsx|jsx|mjs)(\?.*)?$/.test(id) && code.includes('readFileSync')) {
                let curDir = path.dirname(id);
                if (curDir.includes('node_modules/.vite')) {    // We are in a vite cache folder. We need original path.
                    curDir = path.join(__dirname, '/node_modules/', path.parse(path.basename(id)).name);
                }
                let modified = false, ast;

                ast = parseSync(code, { sourceType: 'module' });
                traverse(ast, {
                    Identifier(nodePath) {
                        if (nodePath.node.name === '__dirname') {
                            nodePath.replaceWithSourceString(JSON.stringify(curDir));
                        }
                    },
                });
                code = generate(ast, { retainLines: true }).code;

                ast = parseSync(code, { sourceType: 'module' });
                traverse(ast, {
                    CallExpression(nodePath) {
                        const { callee, arguments: args } = nodePath.node;
                        if (
                            callee.type === 'MemberExpression' &&
                            callee.object.name === 'path' &&
                            callee.property.name === 'join'
                        ) {
                            nodePath.replaceWithSourceString(JSON.stringify(path.join(...args.map(arg => arg.value))));
                        }
                    },
                });
                code = generate(ast, { retainLines: true }).code;

                ast = parseSync(code, { sourceType: 'module' });
                traverse(ast, {
                    CallExpression(nodePath) {
                        const { callee, arguments: args } = nodePath.node;
                        if (
                            callee.type === 'MemberExpression' &&
                            callee.object.name === 'fs' &&
                            callee.property.name === 'readFileSync'
                        ) {
                            const filePath = args[0].value;
                            try {
                                const fileContents = fs.readFileSync(filePath, 'utf-8');
                                nodePath.replaceWithSourceString(JSON.stringify(fileContents));
                            }
                            catch (e) {
                                console.error(e);
                            }
                        }
                    },
                });
                code = generate(ast, { retainLines: true }).code;
                const map = generate(ast, { retainLines: true }).map;

                return { code, map };
            }
        },
    };
}
export default defineConfig({
    base: './',
    plugins: [logseqDevPlugin(), reactPlugin(),
        nodePolyfills(), staticFileSyncPlugin()
    ],
    build: {
        sourcemap: true,
        target: "modules",
        minify: "esbuild"
    }
});