const Koa = require('koa');
const bodyparser = require('koa-bodyparser');
const error = require('koa-json-error');
const app = new Koa();
const routing = require('./routes');

app.use(error({
    postFormat: (e, {stack, ...others}) => process.env.NODE_ENV === 'production' ? others : {stack, ...others}
}));

app.use(bodyparser());
routing(app);

app.listen(3000, () => console.log(
    ' 🍊 🍊 🍊 🍊 🍊 🍊 - POST: 3000 - 🍊 🍊 🍊 🍊 🍊 🍊 '
));