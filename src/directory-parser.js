const fs = require('fs')
const path = require('path')

// `{ name: 'level1-about', path: '/level1/about', component: () => import('/${dir}/level1/about.vue') }`,
const template = `{ name: '{0}', path: '{1}', component: () => import('/{2}') }`
const templateWithChildren = `{ path: '{1}', component: () => import('/{2}'), children: [ {3} ] }`

function parsePagesDirectory(
  dir,
  { prependName, prependPath } = { prependName: '', prependPath: '/' },
) {
  let routes = []

  const files = dfsFiles(dir, dir, '.vue')
  for (let f of files) {
    if (!f.children) {
      routes.push(
        template.replace('{0}', f.name).replace('{1}', f.path).replace('{2}', f.currentFilePath)
      )
    } else {
      routes.push(
        templateWithChildren.replace('{1}', f.path)
                            .replace('{2}', f.currentFilePath)
                            .replace('{3}', parse(f.children))
      )
    }
    
  }

  return { routes }
}


function parse(children) {
  let r = []
  
  for (let child of children) {
    if (!child.children) {
      r.push(
        template.replace('{0}', child.name).replace('{1}', child.path).replace('{2}', child.currentFilePath)
      )
    } else {
      routes.push(
        templateWithChildren.replace('{1}', child.path)
                            .replace('{2}', child.currentFilePath)
                            .replace('{3}', parse(child.children))
      )
    }
  }
  return r.join(', ')
}

// 遍历目录，把目录中带suffix后缀, 并且英文字母开头的文件路径返回
function dfsFiles(filePath, baseDir, suffix, isChildren = false) {
  let allFilePaths = []
  if (!fs.existsSync(filePath)) {
    throw new Error(`filepath: ${filePath} not exist`)
  }

  const files = fs.readdirSync(filePath)
  files.sort((f1, f2) => {
    if ((f1.endsWith(suffix) && (f2.endsWith(suffix))) ||
    (!f1.endsWith(suffix) && (!f2.endsWith(suffix)))) {
      if (f1.startsWith('_') && !(f2.startsWith('_'))) {
        return -1
      } else if(!f1.startsWith('_') && (f2.startsWith('_'))) {
        return 1
      } else {
        return 0
      }
    } else if (f1.endsWith(suffix)) {
      return -1
    } else {
      return 1
    }
  })
  for (let file of files) {
    let currentFilePath = filePath + '/' + file
    let stats = fs.lstatSync(currentFilePath)
    if (stats.isDirectory()) {
      let name = currentFilePath.replace(baseDir, '').slice(1).replace(/\//g, '-')
      if (name.includes('_')) {
        name = name.replace(/_/g, '')
      }
      // console.log('n', name, allFilePaths, currentFilePath)
      let t = allFilePaths.findIndex(f => f.name === name)
      if (t !== -1) {
        let ft = {path: allFilePaths[t].path, currentFilePath: allFilePaths[t].currentFilePath}
        ft.children = dfsFiles(currentFilePath, baseDir, suffix, true)
        allFilePaths[t] = ft
        // console.log('f', allFilePaths)
        continue
      }
      allFilePaths = allFilePaths.concat(dfsFiles(currentFilePath, baseDir, suffix, false))
    } else {
      if (file.endsWith(suffix) && /^[_A-Za-z]+/.test(file) ) {
        let path
        if (!isChildren) {
          path = currentFilePath.replace(baseDir, '').replace(suffix, '')
        } else {
          path = file.replace(suffix, '')
        }
        if (path.endsWith('index')) {
          path = path.slice(0, path.length - 5)
        }
        if (path.includes('_')) {
          path = path.replace(/_/g, ':')
        }
        
        let name = currentFilePath.replace(baseDir, '').replace(suffix, '').slice(1).replace(/\//g, '-')
        if (name.endsWith('-index')) {
          name = name.slice(0, name.length - 6)
        }
        if (name.includes('_')) {
          name = name.replace(/_/g, '')
        }
        
        allFilePaths.push({name: name, 
                           path: path, 
                           currentFilePath
                          })
      }
    }
  }

  return allFilePaths
}


module.exports = {
  parsePagesDirectory,
}
