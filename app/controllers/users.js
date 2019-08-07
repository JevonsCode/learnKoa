const jsonwebtoken = require('jsonwebtoken');
const User = require('../models/users');
const { secret } = require('../config');

class UsersCtl {
    async find(ctx) {
        const { page, per_page = 10, q } = ctx.query;
        const qArr = q.split('').filter(r => r).join('.*');
        const pageNum = Math.max(isNaN(page - 0) ? 1 : page - 0, 1) - 1;
        const perPage = Math.max(isNaN(per_page - 0) ? 10 : per_page - 0 - 0, 1);
        ctx.body = await User
        .find({ name: new RegExp(`.*${qArr}.*`) })
        .limit(perPage).skip(perPage * pageNum);
    }

    async findById(ctx) {
        const { fields = '' } = ctx.query;
        const selectFields = fields.split(';').filter(f => f && f!=='password').map(item => ' +' + item).join('');
        const user = await User.findById(ctx.params.id).select(selectFields);
        if(!user) {
            ctx.throw(404, '用户不存在');
        }
        ctx.body = user;
    }

    async create(ctx) {
        ctx.verifyParams({
            name: { type: 'string', required: true },
            password: { type: 'string', required: true }
        });
        const { name } = ctx.request.body;
        const repeatedUser = await User.findOne({ name });
        if(repeatedUser) { ctx.throw(409, '用户已经存在') }; // 409 状态码表示冲突
        const user = await new User(ctx.request.body).save();
        ctx.body = user;
    }

    async checkOwner(ctx, next) {
        if(ctx.params.id !== ctx.state.user._id) { ctx.throw(403, '没有权限') }
        await next();
    }

    async update(ctx) {
        ctx.verifyParams({
            name: { type: 'string', required: false },
            password: { type: 'string', required: false },

            avatar_url: { type: 'string', required: false },
            gender: { type: 'string', required: false },
            headline: { type: 'string', required: false },
            locations: { type: 'array', itemType: 'string', required: false },
            business: { type: 'string', required: false },
            employments: { type: 'array', itemType: 'object', required: false },
            educations: { type: 'array', itemType: 'object', required: false },
        });
        const user = await User.findByIdAndUpdate(ctx.params.id, ctx.request.body);
        if(!user) { ctx.throw(404, '用户不存在'); }
        ctx.body = user;
    }

    async delete(ctx) {
        const user = await User.findByIdAndRemove(ctx.params.id);
        if(!user) { ctx.throw(404, '用户不存在'); }
        ctx.status = 204;
    }

    async login(ctx) {
        ctx.verifyParams({
            name: { type: 'string', required: true },
            password: { type: 'string', required: true }
        });
        const user = await User.findOne(ctx.request.body);
        if(!user) { ctx.throw(401, '用户名或密码不正确'); };
        const { _id, name } = user;
        const token = jsonwebtoken.sign({ _id, name }, secret, { expiresIn: '7d' });
        ctx.body = { token };
    }

    async listFollowing(ctx) {
        const user = await User.findById(ctx.params.id).select('+following').populate('following'); // populate 获取详细信息
        if(!user) { ctx.throw(404); }
        ctx.body = user.following;
    }

    async listFollowers(ctx) {
        const user = await User.find({ following: ctx.params.id });
        ctx.body = user;
    }

    async checkUserExist(ctx, next) {
        const user = await User.findById(ctx.params.id);
        if(!user) { ctx.throw(404, '用户不存在'); }
        await next();
    }

    async follow(ctx) {
        const who = await User.findById(ctx.state.user._id).select('+following');
        // 判断 following 数组中是否有这个 id
        if(!who.following.map(id => id.toString()).includes(ctx.params.id) && ctx.params.id!==who._id.toString()) {
            who.following.push(ctx.params.id);
            who.save();
        }
        ctx.status = 204;
    }

    async unfollow(ctx) {
        const who = await User.findById(ctx.state.user._id).select('+following');
        const index = who.following.map(id => id.toString()).indexOf(ctx.params.id);
        if(index > -1) {
            who.following.splice(index, 1);
            who.save();
        }
        ctx.status = 204;
    }
}

module.exports = new UsersCtl();