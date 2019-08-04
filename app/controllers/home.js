const path = require('path');

class HomeCtl {
    index(ctx) {
        ctx.body = '<b>this is the index page!</b>'
    }

    upload(ctx) {
        const file = ctx.request.files.file;
        const basename = path.basename(file.path);
        ctx.body = { url: `${ctx.origin}/uploads/${basename}` }
    }
}

module.exports = new HomeCtl();