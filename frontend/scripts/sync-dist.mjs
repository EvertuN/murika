/**
 * sync-dist.mjs
 * Copy Next.js static export (out/) to public/dist/ and sync public assets
 * for PHP/Apache runtime.
 */
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const projectRoot = resolve(process.cwd(), '..')
const buildDir = resolve(process.cwd(), '.next-build')
const outDir = resolve(buildDir, '..', 'out')
const targetDir = resolve(projectRoot, 'public', 'dist')
const publicNextDir = resolve(projectRoot, 'public', '_next')

if (!existsSync(outDir)) {
  console.error('Next build did not produce "out/". Check output: "export" config.')
  process.exit(1)
}

rmSync(targetDir, { recursive: true, force: true })
mkdirSync(targetDir, { recursive: true })
cpSync(outDir, targetDir, { recursive: true })

const nextAssetsFromDist = resolve(targetDir, '_next')
if (existsSync(nextAssetsFromDist)) {
  rmSync(publicNextDir, { recursive: true, force: true })
  mkdirSync(publicNextDir, { recursive: true })
  cpSync(nextAssetsFromDist, publicNextDir, { recursive: true })
}
console.log('Frontend build copied to public/dist.')
