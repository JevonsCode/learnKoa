# Node.js の （系统 & 规范）学习

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
