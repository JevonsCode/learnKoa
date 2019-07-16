const Koa = require('koa');
const Router = require('koa-router');
const app = new Koa();
const router = new Router();


app.use((ctx) => {
    if(ctx.url === '/') {
        ctx.body = 'this is index page'
    } else if(ctx.url === '/users') {

        if(ctx.method === 'GET') {
            ctx.body = 'this is users page'
        } else if(ctx.method === 'POST') {
            ctx.body = 'create a user'
        } else {
            ctx.status = 405
        }
       
    } else if(ctx.url.match(/\/users\/\w+/)) {
        const userId = ctx.url.match(/\/users\/(\w+)/)[1];
        ctx.body = `this is user: ${userId}`
    } else {
        ctx.status = 404
    }
});

app.listen(3000);