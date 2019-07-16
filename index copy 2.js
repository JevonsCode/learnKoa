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

router.get('/', (ctx) => {
    ctx.body = '这是主页'
});

userRouter.get('/', auth, (ctx) => {
    ctx.body = '这是用户列表'
});

userRouter.post('/', auth, (ctx) => {
    ctx.body = '创建用户'
});

userRouter.get('/:id', auth, (ctx) => {
    ctx.body = `这是用户: ${ctx.params.id}`
});

app.use(router.routes());
app.use(userRouter.routes());

app.listen(3000);