const fs = require('fs')
const path = require('path')
const routeStr = `{ name: '{{NAME}}', path: '{{PATH}}', component: () => import('/{{DIR}}/{{PATHS}}') }`

function resolveFile() {}

function resolveDir() {}

function recursivePaths(data) {
  const { filePath = '', paths = [], routes, prependName, prependPath, dir } = data
  const stat = fs.statSync(filePath)
  const fileName = paths[paths.length - 1]

  if (paths.length && stat.isFile() && filePath.endsWith('.vue') && !fileName.startsWith('-')) {
    // console.log(filePath, paths, dir)
    let name = ''
    let path = ''
    let pathStr = ''

    if (paths.length === 1) {
      name = paths[0].replace(/\.vue$/, '')
      path = paths[0] === 'index.vue' ? '/' : `/${name}`
      pathStr = paths[0]
    } else {
      const names = paths.map((path) => (path.startsWith('_') ? path.replace(/^_/, '') : path))

      if (names[names.length - 1] === 'index.vue') {
        names.pop()
      }

      names[names.length - 1] = names[names.length - 1].replace(/\.vue$/, '')
      name = names.join('-')
      // console.log('name', name)

      const filePaths = paths.map((path) => (path.startsWith('_') ? path.replace(/^_/, ':') : path))

      if (filePaths[filePaths.length - 1] === 'index.vue') {
        filePaths[filePaths.length - 1] = ''
      }

      filePaths[filePaths.length - 1] = filePaths[filePaths.length - 1].replace(/\.vue$/, '')
      path = `/${filePaths.join('/')}`
      // console.log('path', path)
      pathStr = paths.join('/')
    }

    const route = routeStr
      .replace('{{NAME}}', name)
      .replace('{{PATH}}', path)
      .replace('{{DIR}}', dir)
      .replace('{{PATHS}}', pathStr)
    // console.log(route)
    routes.push(route)
    return
  }

  if (stat.isDirectory()) {
    const children = fs.readdirSync(filePath)
    let files = []
    let dirs = []

    children.forEach((child) => {
      const stat = fs.statSync(path.resolve(filePath, child))

      if (stat.isFile()) {
        files.push(child)
      } else {
        dirs.push(child)
      }
    })

    const newChildren = [...files, ...dirs]

    newChildren.forEach((file) => {
      paths.push(file)
      recursivePaths({
        filePath: path.resolve(filePath, file),
        routes,
        paths,
        prependName,
        prependPath,
        dir,
      })
      paths.pop()
    })
  }
}

function parsePagesDirectory(
  dir,
  { prependName, prependPath } = { prependName: '', prependPath: '/' },
) {
  let routes = []

  //TODO
  // let paths = []
  const root = path.resolve(process.cwd(), dir)
  recursivePaths({
    filePath: root,
    routes,
    prependName,
    prependPath,
    dir,
  })

  return { routes }
}

module.exports = {
  parsePagesDirectory,
}
