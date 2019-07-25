const fs = require('fs');

module.exports = (app) => {
    fs.readdir(__dirname).forEach(file => {
        if(file === 'index.js') { return }
        const route = require(`./${file}`);
        app.use(route.routes()).use(route.allowedMethods());
    });
}