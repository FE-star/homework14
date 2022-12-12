const fs = require('fs')
const path = require('path')

/**
 * 目录升序
 * @param {fs.Dirent} a 文件对象1
 * @param {fs.Dirent} b 文件对象2
 * @returns
 */
function compareFiles(a, b) {
  return a.isDirectory() - b.isDirectory()
}

/**
 * 递归遍历目录及文件
 * @param {string} paramPath 调用参数路径
 * @param {string} relativePath 相对路径
 * @param {array} routes 对象路由
 * @param {fs.Dirent} redFile readdir后的文件对象
 * @param {boolean} isChild 是否子组件
 */
function rescursiveTraverse(paramPath, relativePath, routes, redFile, isChild) {
  const fullPath = path.resolve(paramPath)

  const stat = fs.statSync(fullPath)

  if (stat.isDirectory()) {
    fs.readdirSync(fullPath, { withFileTypes: true })
      .sort(compareFiles)
      .reduce((prev, curr) => {
        //去除同名目录并把目录名称存储到文件对象属性ccDir
        if (curr.isDirectory()) {
          const f = prev.find((f) => f.name === curr.name + '.vue')
          if (f) f.ccDir = curr.name
          else prev.push(curr)
        } else prev.push(curr)
        return prev
      }, [])
      .forEach((f) => {
        const file = f.name

        rescursiveTraverse(
          path.join(paramPath, file),
          path.join(relativePath, file),
          routes,
          f,
          isChild,
          file.startsWith('_') ? file.replace('_', '') : '',
        )
      })
  } else if (stat.isFile() && path.extname(paramPath) === '.vue') {
    //拿到文件名
    const bname = path.basename(relativePath, '.vue')
    //获取文件所在目录名
    const dirname = path.dirname(relativePath).replace('.', '').trimStart('/')
    //相对根目录为空时finalDirName为空
    //相对根目录下的index
    const finalDirName = dirname.replaceAll('/', '-')
    if (!bname.startsWith('-')) {
      const finalName = bname === 'index' ? '' : bname

      let children = []
      if (redFile?.ccDir) {
        rescursiveTraverse(
          path.join(path.dirname(paramPath), redFile.ccDir),
          path.join(path.dirname(relativePath), redFile.ccDir),
          children,
          undefined,
          true,
        )
      }

      const tempPath = !isChild ? (dirname ? `${dirname}/${finalName}` : finalName) : finalName
      const tempName = finalDirName
        ? finalName
          ? `${finalDirName}-${bname}`
          : finalDirName
        : bname

      //替换name中的_
      const name = tempName.replaceAll('_', '')

      const item = {
        //替换path中的_
        path: tempPath.replaceAll('_', ':'),
        component: `() => import('/${paramPath}')`,
      }

      if (children.length > 0) Object.assign(item, { children })
      else
        Object.assign(item, {
          name,
        })

      if (children.findIndex((r) => !r.path) < 0)
        Object.assign(item, {
          name,
        })

      routes.push(item)
    }
  }
}

function parsePagesDirectory(
  dir,
  { prependName, prependPath } = { prependName: '', prependPath: '/' },
) {
  let routes = []

  //TODO
  rescursiveTraverse(dir, '', routes)

  /**
   * 路由递归映射成字符串
   * @param {Route[]} array 路由数组
   * @returns
   */
  function deepMap(array, deep = -1) {
    deep++
    return array.map(
      (r) =>
        `{${r.name ? ` name: '${deep > 0 ? '' : prependName}${r.name}',` : ''} path: '${
          deep > 0 ? '' : prependPath
        }${r.path}', component: ${r.component}${
          r.children ? `, children: [ ${deepMap(r.children, deep).join(', ')} ]` : ''
        } }`,
      '',
    )
  }

  return {
    routes: deepMap(routes),
  }
}

module.exports = {
  parsePagesDirectory,
}
