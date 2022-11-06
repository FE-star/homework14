const fs = require('fs')
const path = require('path')

function parsePagesDirectory(
  dir,
  { prependName, prependPath } = { prependName: '', prependPath: '/' },
) {
  let routes = []
  // prependPath = prependPath.replace(/\:/g, "_")
  let pathAddress = path.resolve(__dirname, '../', dir, prependPath.substring(1).replace(/\:/g, "_"))
  // 当前路径的文件夹下有哪些文件和子文件夹
  let subFileorDir = fs.readdirSync(pathAddress)
  // 用来记录拥有子组件的元素的索引
  let hasChildren = []
  routes = subFileorDir.reduce((arr, curr) => {
    let { name, base } = path.parse(curr)
    name = name.replace(/^_/, ':')
    if (fs.statSync(path.resolve(pathAddress, curr)).isFile()) {
      if (name.indexOf('ignored') !== -1) {
        return arr
      }
      if (subFileorDir.includes(name.replace(/\:/, '_'))) {
        hasChildren.push({ valIdx: arr.length, name: name })
      }
      if (name === 'index') {
        arr.push(`{ name: '${prependName ? `${prependName}` : `${name.replace(/\:/g, '')}`}', path: '${prependPath}', component: () => import('/${dir}${prependPath.replace(/\:/g, "_")}${base}') }`)
        return arr
      }
      arr.push(`{ name: '${prependName ? `${prependName}-${name.replace(/\:/g, '')}` : `${name.replace(/\:/g, '')}`}', path: '${prependPath}${name}', component: () => import('/${dir}${prependPath.replace(/\:/g, "_")}${base}') }`)
      return arr
    } else if (fs.statSync(path.resolve(pathAddress, curr)).isDirectory()) {
      let { routes: routesTemp } = parsePagesDirectory(dir, { prependName: `${prependName ? prependName+'-' : ''}${name.replace(/\:/g, '')}`, prependPath: `${prependPath}${name}/` })
      arr.push(...routesTemp)
      return arr
    }
  }, [])
  // 处理存在子组件的情况
  hasChildren.forEach(({ valIdx, name }) => {
    let tempStr = ''
    // 遍历 routes 找到子组件，进行处理
    routes.forEach((item, index) => {
      if (item && item.indexOf(`${name.replace(/\:/, '')}-`) !== -1) {
        item = item.replace(new RegExp(`path: '/:?${name}/`), `path: '`)
        tempStr += `${item}, `
        delete routes[index]
        return
      }
      if (item && item.indexOf(`name: '${name.replace(/\:/, '')}'`) !== -1 && index !== valIdx) {
        item = item.replace(new RegExp(`path: '/:?${name}/`), `path: '`)
        tempStr += `${item}, `
        delete routes[index]
        return
      }
    })
    tempStr = tempStr.replace(/, $/, '')
    routes[valIdx] = routes[valIdx].replace(`name: '${name.replace(/\:/, '')}', `, '')
    routes[valIdx] = routes[valIdx].replace(' }', `, children: [ ${tempStr} ] }`)
  })
  routes = routes.filter(val => val)
  return { routes }
}

module.exports = {
  parsePagesDirectory,
}
