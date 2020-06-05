### 先把swagger这个文件夹放在你项目的public文件夹下面
### 然后把lib文件夹复制到你项目的根目录

# swagger的使用说明

## 1 在router文件夹里面的使用
1. 首先先建立整个模块的名字和备注
```
const tagName = '测试swagger';
const tagdescription = '测试swagger备注';
module.exports = app => {
  tag: tagName,
  description: tagdescription,
}
```
2. 然后是建立每个router
```
module.exports = app => {
  const rou = app.middleware.routermidd();
  const router = {
    tag: tagName,
    description: tagdescription,
    routers: {
      '/test_swagger': {
        summary: '用户列表',
        description: '',
        tag: tagName,
        method: 'post',
        middleware: rou,
        action: app.controller.home.index,
        data: {
          string: 'string',
          number: 'number',
          array: 'array',
        },
        header: 'token',
        query: {
          token: true,
          token2: false,
        },
      },
    },
  };
  return router;
};
```
### 说明一下路由的每个参数的作用
1. 路由的键代表了它的路由地址
2. summary代表了它在swagger的名字
3. description代表了给这个路由的说明
4. method代表这个路由的访问方式
5. middleware代表了这个路由的中间件，这里既可以是字符串也可以是数组
6. action代表了这个路由的controller
7. data代表了这个路由的data请求参数，每个参数既可以是字符串也可以是object对象，object里面的对象包括type，default，format，description，type代表的是类型。default代表的是默认值，format代表的是只能接受符合这个正则表达是的字符串，description表达的是说明，注意：data只能是在post请求才能够生效的
8. header代表的是请求头,也可以传多个请求头，就是传入数组
9. query代表的是请求的query参数，如果值是true，那就代表它是必填的


## 然后是说明在router.js文件里面的使用
```
const eggSwagger = require('../lib/eggSwagger');
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  const router_1 = require('./router/swagger')(app);
  const router_2 = require('./router/swagger2')(app);
  const routers = [];
  routers.push(router_1, router_2);
  // console.log(routers);
  // console.log(routers);
  new eggSwagger(routers, { host: '127.0.0.1:7002' }, { api_key: 'Authorization', api_key2: 'Authorization' }).initSwagger(app);
};
```

### 说明一下用法
1. 首先就是先得导入模块
```
const eggSwagger = require('../lib/eggSwagger');
```
2. 然后就是获取每个路由文件里面的全部路由
```
const router_1 = require('./router/swagger')(app);
const router_2 = require('./router/swagger2')(app);
```
3. 然后把他们的放在一个数组当中，注意:如果你的路由文件只有一个，可以把它放进数组里面，也可以把这个对象直接传
4. 调用方法，生成swagger
```
new eggSwagger(routers, { host: '127.0.0.1:7002' }, { api_key: 'Authorization', api_key2: 'Authorization' }).initSwagger(app);
```
第一个参数就是那些路由文件，第二个就是对应的ip和端口，第三个就是请求头，这里的请求头是全部路由都存在的请求头