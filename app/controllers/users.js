const db = [
    { name: "Jevons" }
];

class UsersCtl {
    find(ctx) {
        ctx.body = db
    }

    findById(ctx) {
        if(ctx.params.id - 0 >= db.length) {
            ctx.throw(412);
        }
        ctx.body = db[ctx.params.id - 0];
    }

    create(ctx) {
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
        db.push(ctx.request.body);
        ctx.body = ctx.request.body;
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