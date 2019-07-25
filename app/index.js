const Koa = require('koa');
const bodyparser = require('koa-bodyparser')
const app = new Koa();


app.use(router.routes());

app.listen(3000);