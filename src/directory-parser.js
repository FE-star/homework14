const fs = require('fs')
const path = require('path')

function parsePagesDirectory(
  dir,
  { prependName, prependPath } = { prependName: '', prependPath: '/' },
) {
  let routes = []

  //TODO
  let filesList = []
  const dirList = readFileList(path.join(dir, '/'), filesList)
  console.log("============xxxxxx=============filesList=", filesList);

  let name, rPath, component,hasChildren
  const rIndex = new RegExp('index')
  const rDash = new RegExp('/', 'g')
  const rUnderLine = new RegExp('_') 
  const rColons = new RegExp(':')
  const routeMap = filesList
    .filter(elm => elm.filename.indexOf('ignored') == -1)
    .map((elm) => {
      name = getFileName(elm.filename)
      rPath = getFileName(path.relative(dir, elm.fullPath))
      component = elm.fullPath
      hasChildren = existSameNameDir(name, elm, dirList)
      // index文件的特殊处理
      if (name == 'index') rPath = rPath.replace(rIndex, '')
      //参数的特殊处理
      if (name.startsWith('_'))  name = name.substring(1)
      if (rPath.indexOf('_') != -1) rPath = rPath.replace(rUnderLine, ':')    
      //子目录的特殊处理
      if (rPath.indexOf('/') != -1) {
        name = rPath.replace(rDash, '-')
        if (name.indexOf(':') != -1)  name = name.replace(rColons,'')
      }
      if (name.endsWith('-')) name = name.substring(0, name.length - 1)      

      console.log(`old name == ${getFileName(elm.filename)}, new name = ${name}}`)

      if (hasChildren)
        return {
          name: name,
          rPath: rPath,
          component: component,
          hasChildren: true,
          fullPath: elm.fullPath,
          path: path.join(getFileName(elm.fullPath), '/'),
        }
      else
        return {
          name: name,
          rPath: rPath,
          component: component,
          hasChildren: false,
          path: elm.path,
          fullPath: elm.fullPath,
          parentDir: elm.dirName,
        }

    })
    .map((elm) => {
      if (elm.hasChildren == false && dirList.find((elmDir) => elmDir.hasChildren && elmDir.dirName == elm.parentDir )){
        elm.isChildComponent = true
        elm.rPath = elm.rPath.substring(elm.rPath.lastIndexOf('/')+1)
        if (path.basename(elm.fullPath) == 'index.vue')  elm.rPath = ''
      }
      else {
        elm.isChildComponent = false
        if (elm.hasChildren == false)   //没有子组件的文件，也不是子组件的文件
           elm.path = elm.fullPath
      }
      return elm
    })
    .reduce((result, elm, index, arr) => {
      if (result.has(elm.path) == false) {
        if (elm.hasChildren)
          result.set(elm.path, {
            name: elm.name,
            rPath: elm.rPath,
            component: elm.component,
            hasChildren: elm.hasChildren,
            children: [],
          })
        else if (elm.isChildComponent) result.set(elm.path, { children: [elm] })
        else
          result.set(elm.path, {
            name: elm.name,
            rPath: elm.rPath,
            component: elm.component,
            hasChildren: false,
          })
      } else {
        value = result.get(elm.path)
        if (elm.hasChildren){
          value = {
            name: elm.name,
            rPath: elm.rPath,
            component: elm.component,
            hasChildren: elm.hasChildren,
            ...value,
          }
          result.set(elm.path, value)
        }
        else value.children.push(elm)
      }
      return result
    }, new Map())

  
  console.log("=========================routeMap=", routeMap, routes);
  // return { routeMap }
  // routes = routeList.filter(elm => elm.isDirectory == false)
  
  for (const [_, elm] of routeMap) {
      if (elm.hasChildren)
          routes.push(`{ path: '/${elm.rPath}', component: () => import('/${elm.component}'), children: [ ${printChildren(elm.children)} ] }`)
      else
          routes.push(`{ name: '${elm.name}', path: '/${elm.rPath}', component: () => import('/${elm.component}') }`)
  }
  console.log("=========================routes=", routes);

  return { routes }
}

function printChildren(children){
  let str = ''
  for (elm of children)
      str = str.concat(`{ name: '${elm.name}', path: '${elm.rPath}', component: () => import('/${elm.component}') }, `)
  return str.substring(0, str.length-2)  //截取尾部逗号
}

// 判断某个文件是否有子目录，有子目录则表示有children组件
function existSameNameDir(fileBaseName, fileInfo, dirList){
  result = dirList.find(elm => (elm.dirName == fileBaseName && elm.path == (path.join(fileInfo.path, fileBaseName, '/')) ))
  if (result)
      result.hasChildren = true
  return result? true : false
}

function getFileName(data) {
  return data.substring(0, data.indexOf('.'))
}

function readFileList(path, filesList) {
  var dirList = []
  var files = fs.readdirSync(path)
  files.forEach(function (itm, index) {
    var stat = fs.statSync(path + itm)
    var obj = {}
    if (stat.isDirectory()) {
      obj.dirName = itm
      obj.path = path + itm + '/'
      dirList.push(obj)
      readFileList(obj.path, filesList)
    } else {
      obj.dirName= path.substring(path.lastIndexOf('/', path.length-2)+1, path.length-1) //所在目录
      obj.path = path //路径
      obj.filename = itm //名字
      obj.fullPath = path + itm //全路径
      filesList.push(obj)
    }
  }
  )
  return dirList
}

module.exports = {
  parsePagesDirectory,
}
