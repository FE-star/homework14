const fs = require('fs')
const path = require('path')

// 判断是否是: 文件
function isFileFn (filePath) {
    let stat = fs.lstatSync(filePath);
    return stat.isFile()
}

// 判断是否是: 文件夹
function isDirFn (filePath) {
    let stat = fs.lstatSync(filePath);
    return stat.isDirectory();
}

// 排序: 文件名 + 文件夹， 过滤: 非.vue后缀的文件, 非ignored
function sortAll (files) {
    files = files.filter(item => !item.includes('.') || (!(item.split('.')[0].includes('ignored')) && item.split('.')[1] === 'vue'));
    files = files.filter(item => item.includes('.')).concat(files.filter(item => !item.includes('.')))
    return files;
}

// 获取 name
function getNameFn (relativePath, fileName) {
    // 带参数的去掉 _
    relativePath = relativePath.startsWith('_') ? relativePath.slice(1) : relativePath;
    fileName = fileName.startsWith('_') ? fileName.slice(1) : fileName;
    // 相对路径存在的时候，name 里面的index 去掉
    if (relativePath) {
        if (fileName === 'index') {
            fileName = '';
        }
        let name = relativePath.split('/').join('-');
        return fileName ? `${name}-${fileName}` : name;
    } else { // 相对路径不存在的时候，保留原本的
        return fileName;
    }
}

// 文件夹和文件是否有重名
function hasRepeatToDelete (f, routes) {
    f = f.startsWith('_') ? f.slice(1) : f;
    let hasChildren = false;
    const newRoutes = routes.filter(item => {
        const isRepeat = item.includes(`name: '${f}'`);
        if (isRepeat) {
            hasChildren = true
        }
        return !item.includes(`name: '${f}'`);
    });
    return { hasChildren, newRoutes };

}


// 获取children
function gainChildren (rootDir, dir) {
    let children = [];
    let relativePath = path.relative(rootDir, dir); // contact
    relativePath = relativePath.startsWith('_') ? relativePath.slice(1) : relativePath
    let files = fs.readdirSync(dir);
    files = sortAll(files)
    files.forEach(f => {
        let fileName = path.basename(f, '.vue');
        fileName = fileName.startsWith('_') ? fileName.slice(1) : fileName;
        let name = fileName === 'index' ? relativePath : `${relativePath}-${fileName}`

        children.push(` { name: '${name}', path: '${fileName === 'index' ? '' : fileName}', component: () => import('/${dir}/${f}') }`)
    })
    return children;
}

// path :参数
function isParams (name) {
    if (name.startsWith('_')) {
        return `:${name.slice(1)}`
    } else {
        return `${name}`;
    }
}

// 
function isIndex (name) {
    return name === 'index' ? '' : isParams(name);
}

// 是文件： dir + 文件名, 
// 文件夹： dir: dir + level1, relative: level1
function readRecursion (rootDir, dir, routes) {
    const relativePath = path.relative(rootDir, dir); // level1  level1/level2
    let files = fs.readdirSync(dir);
    files = sortAll(files) // [ '_product.vue', 'about.vue','contact.vue','index.vue','_product','contact']
    files.forEach(f => {
        const isFile = isFileFn(path.join(dir, f));
        let fileName = path.basename(f, '.vue');
        let compImport = `/${dir}/${f}`;
        if (isFile) {
            let name = getNameFn(relativePath, fileName);
            let compPath = relativePath ? `/${isParams(relativePath)}/${isIndex(fileName)}` : `/${isIndex(fileName)}`;
            routes.push(`{ name: '${name}', path: '${compPath}', component: () => import('${compImport}') }`)
        }
        const isDir = isDirFn(path.join(dir, f))
        if (isDir) {
            let { hasChildren, newRoutes } = hasRepeatToDelete(f, routes);
            if (hasChildren) {
                let newDir = path.join(dir, f)
                routes = newRoutes;
                newRoutes.push(`{ path: '/${isIndex(fileName)}', component: () => import('${compImport}.vue'), children: [${gainChildren(rootDir, newDir)} ] }`)
            } else {
                let newDir = path.join(dir, f)
                readRecursion(rootDir, newDir, routes);
            }
        }
    })
    return routes;
}

function parsePagesDirectory (
    dir,
    { prependName, prependPath } = { prependName: '', prependPath: '/' },
) {
    let routes = []

    //TODO
    routes = readRecursion(dir, dir, routes);
    console.log(9999888, routes)
    return { routes }
}

module.exports = {
    parsePagesDirectory,
}



