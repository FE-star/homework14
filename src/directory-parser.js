const fs = require('fs')
const path = require('path');

let _ignored = { prefix: [] };
let sourcePath = '';
let _routeLabel = { prefix: [] };
let _type = ['vue'];
let hasIndex = false;

function parsePagesDirectory(
  dir,
  { prependName, prependPath } = { prependName: '', prependPath: '/' },
  ignored = { prefix: ['-'] },
  routeLabel = { prefix: ['_'] },
  type = ['vue']
) {
  _ignored = { ..._ignored, ...ignored };
  _routeLabel = { ..._routeLabel, ...routeLabel };
  sourcePath = dir;
  _type = [..._type, ...type];
  const rawRoutes = getRawRoutes(dir, ['vue']);
  const routes = routesAdapter(rawRoutes);
  return { routes };
}

function getRawRoutes(dir, type = ['vue']) {
  const rawRoutes = [];
  const getAllFiles = (curDir, father) => {
    const res = dirReader(curDir);
    for (let i = 0; i < res.length; ++i) {
      const path = `${curDir}/${res[i]}`;
      !dirOrFileIsVaild(path) || fileHandle(rawRoutes, path, father) || dirHandle(rawRoutes, path, getAllFiles.bind(this));
    }
  }
  getAllFiles(dir, null);
  return rawRoutes;
}
function dirReader(curDir) {
  return fs.readdirSync(curDir).sort((a, b) => {
    const vueSuffix = '.vue';
    if (a.indexOf(vueSuffix) !== -1 && b.indexOf(vueSuffix) !== -1) {
      return 0;
    }
    if (a.indexOf(vueSuffix) === -1 && b.indexOf(vueSuffix) === -1) {
      return 0;
    }
    return a.indexOf(vueSuffix) !== -1 ? -1 : 1;
  })
}
function fileHandle(rawRoutes = [], path, father) {
  if (!fs.statSync(path).isFile()) {
    return false;
  }
  if (father) {
    father.children.push(
      {
        name: nameAdapter(path),
        importPath: importPathAdapter(path),
        urlPath: urlPathAdapter(path, father.importPath)
      }
    );
  } else {
    rawRoutes.push({
      name: nameAdapter(path),
      importPath: importPathAdapter(path),
      urlPath: urlPathAdapter(path, null)
    })
  }
  return true;
}
function dirHandle(rawRoutes = [], path, getAllFiles) {
  if (!fs.statSync(path).isDirectory()) {
    return false;
  }
  const fatherComponent = getFatherComponent(rawRoutes, path);
  if (fatherComponent) {
    delete fatherComponent.name;
    fatherComponent.children = [];
    getAllFiles(path, fatherComponent);
  } else {
    getAllFiles(path);
  }
  return true;
}
function getFatherComponent(rawRoutes = [], path) {
  path = path.split('/');
  const name = path[path.length - 1];
  return rawRoutes.find(item => {
    return item.name === name;
  });
}
/**
 * 
 * @param {string} path 
 * @param {{prefix:string, suffix:string}[]} inValid 
 * @returns 
 */
function dirOrFileIsVaild(path) {
  let needTrapIgnorePath = path;
  if (path.indexOf('/') !== -1) {
    const splitPath = path.split('/');
    needTrapIgnorePath = splitPath[splitPath.length - 1];
  }
  const prefix = needTrapIgnorePath[0];
  const name = needTrapIgnorePath.split('.')[0];
  const fileType = needTrapIgnorePath.split('.')[1];
  if (fileType && _type.indexOf(fileType) === -1) {
    return false;
  }
  return _ignored.prefix.every(item => prefix.indexOf(item) === -1);

}
function importPathAdapter(path) {
  return path;
}
function urlPathAdapter(path = '', fatherImportPath) {
  let cutIndex = 0;
  const prefix = fatherImportPath || sourcePath;
  while (prefix[cutIndex] === path[cutIndex]) {
    ++cutIndex;
  }
  fatherImportPath ? (++cutIndex) : '';
  path = path.slice(cutIndex);
  path = path.replace(/[\.]{1}[a-zA-Z]*/, '');
  // if (path.slice(1) === 'index') {
  //   path = '/';
  // }
  return path.replace(/\_/g, ':').replace(/(?:\/)index$/g, '/');
}
function nameAdapter(path, prefixName) {
  let cutIndex = 0;
  const prefix = sourcePath;
  while (prefix[cutIndex] === path[cutIndex]) {
    ++cutIndex;
  }
  cutIndex++;
  path = path.slice(cutIndex);
  path = path.replace(/[\.]{1}[a-zA-Z]*/, '').replace(/(?:\/)index$/g, '');
  return path.replace(/\//g, '-');
}
function routesAdapter(rawRoutes = []) {
  const handler = (routes) => {
    for (let i = 0; i < routes.length; ++i) {
      if (routes[i].children && routes[i].children.length > 0) {
        routes[i].export = `{ path: '${routes[i].urlPath}', component: () => import('/${routes[i].importPath}'), children: [ ${handler(routes[i].children).map(item => item.export).join(', ')} ] }`
        continue;
      }
      routes[i].export = `{ name: '${routes[i].name}', path: '${routes[i].urlPath}', component: () => import('/${routes[i].importPath}') }`;
    }
    return routes;
  }
  handler(rawRoutes);
  return rawRoutes.map(item => item.export);;
}

// const res = parsePagesDirectory('./tests/scenarios/with-some-child-components')
// console.log(res);
module.exports = {
  parsePagesDirectory,
}
