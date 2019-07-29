# Node.js の（系统 & 规范）学习

## [Koa](https://koa.bootcss.com/) の 学习

### Koa の 安装

```npm i koa -S```

### Koa の 使用

```
const Koa = require('koa');
const app = new Koa();

...
app.listen(3000);
```

### Koa-router の 安装

```npm i koa-router -S```

### Koa-router の 使用

和 [Express](http://www.expressjs.com.cn/) 一样的语法，新学到了 Koa 的 prefix 写法，以前中间件只知道放中间用，原来封装原理是这样（```"auth"```）~

```
const Koa = require('koa');
const Router = require('koa-router');
const app = new Koa();
const router = new Router();
const userRouter = new Router({ prefix: '/users'});

const auth = async (ctx, next) => {
    if(ctx.url !== '/users') {
        ctx.throw(401)
    }
    await next()
}

userRouter.get('/:id', auth, (ctx) => {
    ctx.body = `这是用户: ${ctx.params.id}`
});
...
app.use(router.routes());
app.use(userRouter.routes());

app.listen(3000);
```
*注意：记得要把`router`和自己定义的前置路由在后面挂载上*

### HTTP 操作
TODO

### 良好的目录结构

- 将路由单独放一个目录
- 将控制器单独放一个目录
- 使用“类 + 类方法”的方式组织控制器

*tip:（循环读取路由）*

```
module.exports = (app) => {
    fs.readdirSync(__dirname).forEach(file => {
        if(file === 'index.js') { return }
        const route = require(`./${file}`);
        app.use(route.routes()).use(route.allowedMethods());
    });
}
```

*让不同的目录做不同的事情，`controllers`中就是业务代码*

### 异常状况 & 错误处理

- 运行时错误，都返回 500
- 逻辑错误，如找不到（404）、先决条件失败（412）、无法处理的实体（参数格式不对，412）etc

Koa 对错误会有自己的处理
如404`Not Found`
500`Internal Server Error`

**EX:**412错误可以写成```ctx.throw(412)```*默认错误信息`Precondition Failed`*

需要自己**自定义错误信息**时，写成```ctx.throw(412, "先决条件出错！")```

### 自己编写错误处理中间件

```
app.use(async (ctx, next) => {
    try {
        await next();
    } catch(err) {
        ctx.status = err.status || err.statusCode || 500;
        ctx.body = {
            message: err.message
        }
    }
});
```
Koa 自定义中间件可以捕获404外的所有异常，
`status`和`statusCode`拿不到的时候就是运行异常了，在最后或一个500

### Koa-json-error

*直接用轮子*

安装： `npm i koa-json-error -S` || `yarn add koa-json-error -S`

使用：

```
const error = require('koa-json-error');
app.use(error());
```

这个中间件会返回一个 JSON 字段，包含`name`, `message`, `stack`, `status`

`stack`是会返回错误原因，只能用于开发环境

定制返回格式：`postFormat`

```
app.use(error({
    postFormat: (e, {stack, ...others}) => process.env.NODE_ENV === 'production' ? others : {stack, ...others}
}));
```

*在Windows电脑上要安装cross-env来模拟环境，mac直接写`NODE_ENV=production`*

```
"start": "cross-env NODE_ENV=production node app",
"dev": "nodemon app"
```