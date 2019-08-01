const User = require('../models/users');

class UsersCtl {
    async find(ctx) {
        ctx.body = await User.find();
    }

    async findById(ctx) {
        const user = await User.findById(ctx.params.id);
        if(!user) {
            ctx.throw(404, '用户不存在');
        }
        ctx.body = user;
    }

    async create(ctx) {
        ctx.verifyParams({
            name: { 
                type: 'string',
                required: true
            }
        })
        const user = await new User(ctx.request.body).save();
        ctx.body = user;
    }

    update(ctx) {
        if(ctx.params.id - 0 >= db.length) {
            ctx.throw(412);
        }
        ctx.verifyParams({
            name: {
                type: 'string',
                required: true
            },
            age: {
                type: 'number',
                required: false
            }
        })
        db[ctx.params.id - 0] = ctx.request;
        ctx.body = ctx.request.body;
    }

    delete(ctx) {
        if(ctx.params.id - 0 >= db.length) {
            ctx.throw(412);
        }
        db.splice(ctx.params.id - 0, 1);
        ctx.status = 204;
    }
}

module.exports = new UsersCtl();