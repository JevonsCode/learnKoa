const Router = require('koa-router');
const router = new Router({ prefix: '/users'});

const auth = async (ctx, next) => {
    if(ctx.url !== '/users') {
        ctx.throw(401)
    }
    await next()
}

router.get('/', auth, (ctx) => {
    ctx.body = '这是用户列表'
});

router.post('/', auth, (ctx) => {
    ctx.body = '创建用户'
});

router.get('/:id', auth, (ctx) => {
    ctx.body = `这是用户: ${ctx.params.id}`
});

module.exports = router;