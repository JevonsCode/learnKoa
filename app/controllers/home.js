class HomeCtl {
    index(ctx) {
        ctx.body = '<b>this is the index page!</b>'
    }
}

module.exports = new HomeCtl();