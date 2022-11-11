const path = require('path')
const fs = require('fs')


function readFn (dir) {
    let files = fs.readdirSync(dir)
    files = files.filter(item => !item.includes('.') || (!(item.split('.')[0].includes('ignored')) && item.split('.')[1] === 'vue'));
    files = files.filter(item => item.includes('.')).concat(files.filter(item => !item.includes('.')))
    console.log(11, files);
    // files.forEach(file => {
    //     let stat = fs.lstatSync(path.join(dir, file));
    //     console.log(stat.isDirectory())
    // })
}

readFn('scenarios/single-level-multiple-files')


[
    "{ name: 'about', path: '/about', component: () => import('/tests/scenarios/with-some-child-components/about.vue') }",
    "{ path: '/contact', component: () => import('/tests/scenarios/with-some-child-components/contact.vue'), children: { name: 'contact-feedback', path: 'feedback', component: () => import(tests/scenarios/with-some-child-components/contact/feedback.vue) },{ name: 'contact-help', path: 'help', component: () => import(tests/scenarios/with-some-child-components/contact/help.vue) },{ name: 'contact-index', path: 'index', component: () => import(tests/scenarios/with-some-child-components/contact/index.vue) } }"
  ]
