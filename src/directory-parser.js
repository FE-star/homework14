const fs = require('fs')
const path = require('path')
const routeStr = `{ name: '{{NAME}}', path: '{{PATH}}', component: () => import('/{{DIR}}/{{PATHS}}') }`
const routeWithChildrenStr = `{ path: '{{PATH}}', component: () => import('/{{DIR}}/{{PATHS}}'), children: [ {{CHILDREN}} ] }`
const childStr = `{ name: '{{NAME}}', path: '{{PATH}}', component: () => import('/{{DIR}}/{{PATHS}}') }`

function recursivePaths(data) {
  const { filePath = '', hasChildren, paths = [], routes, prependName, prependPath, dir } = data
  const stat = fs.statSync(filePath)
  const fileName = paths[paths.length - 1]

  if (paths.length && stat.isFile() && filePath.endsWith('.vue') && !fileName.startsWith('-')) {
    let name = ''
    let path = ''
    let pathStr = ''

    if (paths.length === 1) {
      name = paths[0].replace(/\.vue$/, '')
      path =
        paths[0] === 'index.vue' ? '/' : `/${name.startsWith('_') ? name.replace(/^_/, ':') : name}`
      pathStr = paths[0]
    } else {
      const names = paths.map((path) => (path.startsWith('_') ? path.replace(/^_/, '') : path))

      if (names[names.length - 1] === 'index.vue') {
        names.pop()
      }

      names[names.length - 1] = names[names.length - 1].replace(/\.vue$/, '')
      name = names.join('-')

      const filePaths = paths.map((path) => (path.startsWith('_') ? path.replace(/^_/, ':') : path))

      if (filePaths[filePaths.length - 1] === 'index.vue') {
        filePaths[filePaths.length - 1] = ''
      }

      filePaths[filePaths.length - 1] = filePaths[filePaths.length - 1].replace(/\.vue$/, '')
      path = `/${filePaths.join('/')}`
      pathStr = paths.join('/')
    }

    if (hasChildren) {
      let route = routeWithChildrenStr
        .replace('{{PATH}}', path)
        .replace('{{DIR}}', dir)
        .replace('{{PATHS}}', pathStr)

      const files = fs.readdirSync(filePath.replace(/\.vue/, ''))
      const children = files.map((fileName) =>
        childStr
          .replace(
            '{{NAME}}',
            fileName === 'index.vue'
              ? name.startsWith('_')
                ? name.replace(/^_/, '')
                : name
              : `${name.startsWith('_') ? name.replace(/^_/, '') : name}-${fileName.replace(
                  /\.vue/,
                  '',
                )}`,
          )
          .replace(
            '{{PATH}}',
            fileName === 'index.vue'
              ? ''
              : fileName.startsWith('_')
              ? fileName.replace(/\.vue/, '').replace(/^_/, ':')
              : fileName.replace(/\.vue/, ''),
          )
          .replace('{{DIR}}', dir)
          .replace('{{PATHS}}', `${name.replace(/\.vue$/, '')}/${fileName}`),
      )
      route = route.replace('{{CHILDREN}}', children.join(', '))
      routes.push(route)
      return
    } else {
      const route = routeStr
        .replace('{{NAME}}', name)
        .replace('{{PATH}}', path)
        .replace('{{DIR}}', dir)
        .replace('{{PATHS}}', pathStr)
      routes.push(route)
      return
    }
  }

  if (stat.isDirectory()) {
    const children = fs.readdirSync(filePath)
    const childrenSet = new Set(children)
    let files = []
    let dirs = []
    let dirSet = new Set()

    children.forEach((child) => {
      const stat = fs.statSync(path.resolve(filePath, child))

      if (stat.isFile()) {
        files.push({
          file: child,
          hasChildren: dirSet.has(child.replace(/\.vue$/, '')),
        })
      } else {
        if (!childrenSet.has(`${child}.vue`)) {
          dirs.push({
            directory: child,
          })
        }
        dirSet.add(child)
      }
    })

    const newChildren = [...files, ...dirs]

    newChildren.forEach(({ file, directory, hasChildren }) => {
      paths.push(file ?? directory)
      recursivePaths({
        filePath: path.resolve(filePath, file ?? directory),
        hasChildren,
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
