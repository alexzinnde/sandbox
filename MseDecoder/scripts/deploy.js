import path from 'path'
import fs from 'fs'
import {execSync, spawn, spawnSync} from 'child_process'
import {rimrafSync} from 'rimraf'

const rootPath = path.resolve('.')
const distPath = path.resolve('dist')

rimrafSync(distPath)

const packageJsonPath = path.resolve('package.json')
const origPackageJson = JSON.parse(fs.readFileSync(packageJsonPath).toString())

// release tmp folder
const releaseTempDirPath = path.resolve(`release-${origPackageJson.version}-tmp-${new Date().toISOString()}`)

fs.mkdirSync(releaseTempDirPath)

// release package json
const releasePackageJson = Object.assign({}, origPackageJson)
delete releasePackageJson['devDependencies']
delete releasePackageJson['scripts']
fs.writeFileSync(path.join(releaseTempDirPath, 'package.json'), JSON.stringify(releasePackageJson))

// build
execSync('npm run build:release', {cwd: rootPath, stdio: 'inherit'})
fs.cpSync(path.resolve('dist'), path.join(releaseTempDirPath, 'dist'), {recursive: true})
fs.cpSync(path.resolve('.npmrc'), path.join(releaseTempDirPath, '.npmrc'))

// deploy
execSync('npm publish --production', {cwd: releaseTempDirPath, stdio: 'inherit'})
