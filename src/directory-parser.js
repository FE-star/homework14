const fs = require('fs');
const path = require('path');
const { oneLine } = require('common-tags');

function parsePagesDirectory(
  dir,
  { prependName, prependPath } = { prependName: '', prependPath: '/' }
) {
  let routes = []

  let items = fs.readdirSync(path.join(__dirname, `../${dir}`));
  items.forEach((item) => {
    if (!fs.statSync(path.join(__dirname, `../${dir}/${item}`)).isDirectory()) {
      if (item.indexOf('.vue') > -1 && item.indexOf('-ignored') === -1) {
        let fileName = item.replace('.vue', '');
        if (!isChild(fileName, items)) {
          let name = ''
          let path = '';
          if (fileName.startsWith('_')) {
            let temp = fileName.substr(1, fileName.length -1);
            name = prependName ? `${prependName}-${temp}` : temp;
            path = prependPath !== '/' ? `${prependPath}/:${temp}` : `/:${temp}`;
          } else {
            if (fileName === 'index') {
              name = prependName !== '' ? prependName : fileName;
              path = prependPath !== '/' ? `${prependPath}/` : prependPath;
            } else {
              name = prependName ? `${prependName}-${fileName}` : fileName;
              path = prependPath !== '/' ? `${prependPath}/${fileName}` : `/${fileName}`;
            }
          }
          routes.push(
            `{ name: '${name}', path: '${path}', component: () => import('/${dir}/${item}') }`
          )
        } else {
          let tempName = fileName.startsWith('_') ? fileName.substr(1, fileName.length-1) : fileName;
          let str = `{
            name: '${tempName}',
            path: '/${fileName.startsWith('_') ? ':'+fileName.substr(1, fileName.length-1) : fileName}',
            component: () => import('/${dir}/${fileName}.vue'),
            children: [`
          let subItems = fs.readdirSync(path.join(__dirname, `../${dir}/${fileName}`));
          subItems.forEach( (subItem, i) => {
            if (item.indexOf('.vue') > -1 && item.indexOf('-ignored') === -1) {
              let temp = subItem.replace('.vue', '');
              if (i !== subItems.length - 1) {
                if (temp === 'index') {
                  str = `${str} { name: '${tempName}', path: '', component: () => import('/${dir}/${fileName}/index.vue') },`
                } else {
                  str = `${str} { name: '${tempName}-${temp}', path: '${temp}', component: () => import('/${dir}/${fileName}/${temp}.vue') },`
                }
              } else {
                if (temp === 'index') {
                  str = `${str} { name: '${tempName}', path: '', component: () => import('/${dir}/${fileName}/index.vue') }
                          ]
                        }`;
                } else {
                  str = `${str} { name: '${tempName}-${temp}', path: '${temp}', component: () => import('/${dir}/${fileName}/${temp}.vue') }
                          ]
                        }`;
                }
              }
            }
          })
          routes.push(
            oneLine `${str}`
          )
        }
      }
    } else {
      if (!isChild(item, items)) {
        let preName;
        let prePath;
        if (item.startsWith('_')) {
          let temp = item.substr(1, item.length - 1);
          preName = prependName !== '' ? `${prependName}-${temp}` : temp;
          prePath = prependPath !== '/' ? `${prependPath}/:${temp}` : `/:${temp}`
        } else {
          preName = prependName !== '' ? `${prependName}-${item}` : item;
          prePath = prependPath !== '/' ? `${prependPath}/${item}` : `/${item}`
        }
        routes.push(...(
            parsePagesDirectory(`${dir}/${item}`, {
              prependName: preName,
              prependPath: prePath,
            }).routes
          )
        )
      }
    }
  })

  return { routes }
}

function isChild(name, arr) {
  return arr.find(item => name === item) && arr.find(item => `${name}.vue` === item)
}

module.exports = {
  parsePagesDirectory,
}
