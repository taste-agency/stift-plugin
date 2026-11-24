// stift for Next.js, dev only: `export default withStift(nextConfig)` in next.config.
// One dependency-free file; /stift:setup copies it into the app. In `next dev` it adds a Turbopack (or webpack)
// loader rule that stamps data-stift-src="file:line:col" on JSX elements and adds a small
// script to the root layout's <body>, which loads the overlay from the stift bridge (the Claude
// Code plugin) when a session runs. Every other phase (`next build`, `next start`) gets the
// config back unchanged.
'use strict'

const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

/**
 * @template T
 * @param {T} config A Next.js config object, or a config function.
 * @param {{ allowOrigins?: string[] }} [stiftOptions] More origins the page may be opened from (a proxy, a tunnel, a
 *   *.localhost name). The dev server's own address is registered by itself.
 * @returns {(phase: string, ctx: any) => Promise<any>}
 */
function withStift(config, stiftOptions = {}) {
  return async (phase, ctx) => {
    const base = typeof config === 'function' ? await config(phase, ctx) : config
    if (phase !== 'phase-development-server') return base
    const root = process.cwd()
    registerOrigin(root, stiftOptions.allowOrigins || [], await rewriteTargets(base))
    const options = { port: bridgePort(gitTop(root)), root }
    const rule = { loader: __filename, options }
    return {
      ...base,
      // `next dev --webpack`
      webpack(cfg, ctx) {
        const out = base?.webpack ? base.webpack(cfg, ctx) : cfg
        if (ctx.dev) out.module.rules.push({ test: /\.[jt]sx$/, exclude: /node_modules/, enforce: 'pre', use: [rule] })
        return out
      },
      turbopack: {
        ...base?.turbopack,
        rules: {
          ...base?.turbopack?.rules,
          '*.{jsx,tsx}': [
            ...[base?.turbopack?.rules?.['*.{jsx,tsx}'] ?? []].flat(),
            { condition: { not: 'foreign' }, loaders: [rule] },
          ],
        },
      },
    }
  }
}

/**
 * The bridge talks only to pages from this dev server, so tell it where the server really listens. Next loads the
 * config after its server is listening and has set PORT and __NEXT_PRIVATE_ORIGIN to the bound address, including a
 * fallback port when the configured one was taken (next/dist/server/lib/start-server.js).
 */
function registerOrigin(root, allowOrigins, targets) {
  const origin = process.env.__NEXT_PRIVATE_ORIGIN || `http://localhost:${process.env.PORT || 3000}`
  try {
    const gitDir = execFileSync('git', ['rev-parse', '--absolute-git-dir'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    const dir = path.join(gitDir, 'stift', 'origins')
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 })
    const file = path.join(dir, `${process.pid}.json`)
    fs.writeFileSync(file, JSON.stringify({ pid: process.pid, origins: [origin, ...allowOrigins], targets }), { mode: 0o600 })
    process.once('exit', () => fs.rmSync(file, { force: true }))
  } catch {}
}

/** The repository's top-level directory: the bridge derives its port from it. */
/**
 * The local services the app forwards to (rewrites to http://localhost:… or 127.0.0.1), so `stift check` can say when
 * one isn't running. Other rewrites, and a rewrites() that throws, are left out.
 */
async function rewriteTargets(config) {
  let r = []
  try {
    r = typeof config?.rewrites === 'function' ? await config.rewrites() : []
  } catch {}
  const all = Array.isArray(r) ? r : [...(r?.beforeFiles || []), ...(r?.afterFiles || []), ...(r?.fallback || [])]
  return all.flatMap((x) => {
    try {
      const u = new URL(x.destination)
      return /^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(u.hostname) ? [{ path: x.source, target: u.origin }] : []
    } catch {
      return []
    }
  })
}

function gitTop(dir) {
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: dir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return dir
  }
}

/** Same as bridgePort() in the stift Claude Code plugin (packages/claude-plugin/src/bridge.ts). */
function bridgePort(top) {
  if (process.env.STIFT_PORT) return Number(process.env.STIFT_PORT)
  let h = 0x811c9dc5
  for (let i = 0; i < top.length; i++) h = Math.imul(h ^ top.charCodeAt(i), 0x01000193) >>> 0
  return 47000 + (h % 1000)
}

/** The Turbopack loader: stamps source locations, and loads the overlay from the root layout. */
function loader(source) {
  const { port, root } = typeof this.getOptions === 'function' ? this.getOptions() : this.query
  const file = this.resourcePath
  const { parse } = babelParser(root)
  let ast
  try {
    ast = parse(source, { sourceType: 'module', plugins: file.endsWith('.tsx') ? ['jsx', 'typescript'] : ['jsx'], errorRecovery: true })
  } catch {
    return source // let Next report the syntax error
  }
  const rel = path.relative(root, file).split(path.sep).join('/')
  /** [offset, text], inserted within lines so line numbers stay put. */
  const inserts = []
  let body = null
  const visit = (node) => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) return node.forEach(visit)
    if (node.type === 'JSXOpeningElement' && node.name.type === 'JSXIdentifier' && /^[a-z]/.test(node.name.name)) {
      if (!node.attributes.some((a) => a.type === 'JSXAttribute' && a.name.name === 'data-stift-src')) {
        const { line, column } = node.loc.start
        inserts.push([node.name.end, ` data-stift-src="${rel}:${line}:${column + 1}"`])
      }
    }
    if (node.type === 'JSXElement' && node.openingElement.name.name === 'body' && node.closingElement) body = node
    for (const key in node) if (key !== 'loc' && key !== 'start' && key !== 'end' && key !== 'extra') visit(node[key])
  }
  visit(ast.program)
  if (body && /^layout\.[jt]sx$/.test(path.basename(file))) {
    const boot = bootstrap(port, root)
    inserts.push([body.closingElement.start, `<script data-stift="" dangerouslySetInnerHTML={{ __html: ${JSON.stringify(boot)} }} />`])
  }
  inserts.sort((a, b) => b[0] - a[0])
  let out = source
  for (const [at, text] of inserts) out = out.slice(0, at) + text + out.slice(at)
  return out
}

/** Next's own copy of the Babel parser, so the app needs no extra dependency (@babel/parser outside Next). */
function babelParser(root) {
  try {
    return require(require.resolve('next/dist/compiled/babel/parser', { paths: [root] }))
  } catch {
    return require('@babel/parser')
  }
}

/**
 * Loads the overlay from the bridge, retrying with backoff until a Claude Code session serves it. On an https page
 * Safari blocks the http://127.0.0.1 script as mixed content: the console says so once.
 */
function bootstrap(port, root) {
  const warn = `[stift] Can't load the overlay from http://127.0.0.1:${port}. Safari blocks it on https pages (mixed content): use Chrome or Firefox, or run next dev over http. Elsewhere, no Claude Code session with stift runs in this repository yet.`
  return `(function(){if(window.__stiftBoot)return;window.__stiftBoot=1;window.__stiftRoot=${JSON.stringify(root)};var d=2000,w=0;function load(){var s=document.createElement('script');s.src='http://127.0.0.1:${port}/overlay.js';s.onerror=function(){s.remove();if(location.protocol==='https:'&&!w++)console.warn(${JSON.stringify(warn)});setTimeout(load,d);d=Math.min(d*2,30000)};document.head.appendChild(s)}load()})()`
}

module.exports = loader
module.exports.withStift = withStift
