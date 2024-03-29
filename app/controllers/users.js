const jsonwebtoken = require('jsonwebtoken');
const User = require('../models/users');
const Question = require('../models/questions');
const Answer = require('../models/answers');
const { secret } = require('../config');

class UsersCtl {
    async find(ctx) {
        const { page, per_page = 10, q = '' } = ctx.query;
        const qArr = q.split('').filter(r => r).join('.*');
        const pageNum = Math.max(isNaN(page - 0) ? 1 : page - 0, 1) - 1;
        const perPage = Math.max(isNaN(per_page - 0) ? 10 : per_page - 0 - 0, 1);
        ctx.body = await User
            .find({ name: new RegExp(`.*${qArr}.*`) })
            .limit(perPage).skip(perPage * pageNum);
    }

    async findById(ctx) {
        const { fields = '' } = ctx.query;
        const excludes = ['password'];
        const filterStr = fields.split(';').filter(f => f && !(excludes.indexOf(f) > -1));
        const selectFields = filterStr.map(item => ' +' + item).join('');
        const populateStr = filterStr.map(item => {
            if(item === 'employments') {
                return 'employments.company employments.job'
            }
            if(item === 'employments') {
                return 'educations.school educations.major'
            }
            return item
        }).join(' ');
        const user = await User.findById(ctx.params.id).select(selectFields)
            .populate(populateStr);
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
        if(!user) { ctx.throw(404, '用户不存在'); }
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
        const me = await User.findById(ctx.state.user._id).select('+following');
        // 判断 following 数组中是否有这个 id
        if(!me.following.map(id => id.toString()).includes(ctx.params.id) && ctx.params.id!==me._id.toString()) {
            me.following.push(ctx.params.id);
            me.save();
        }
        ctx.status = 204;
    }

    async unfollow(ctx) {
        const me = await User.findById(ctx.state.user._id).select('+following');
        const index = me.following.map(id => id.toString()).indexOf(ctx.params.id);
        if(index > -1) {
            me.following.splice(index, 1);
            me.save();
        }
        ctx.status = 204;
    }

    async listFollowingTopics(ctx) {
        const user = await User.findById(ctx.params.id).select('+followingTopics').populate('followingTopics'); // populate 获取详细信息
        if(!user) { ctx.throw(404, '用户不存在'); }
        ctx.body = user.followingTopics;
    }

    async followTopic(ctx) {
        const me = await User.findById(ctx.state.user._id).select('+followingTopics');
        // 判断 followingTopics 数组中是否有这个 id
        if(!me.followingTopics.map(id => id.toString()).includes(ctx.params.id) && ctx.params.id!==me._id.toString()) {
            me.followingTopics.push(ctx.params.id);
            me.save();
        }
        ctx.status = 204;
    }

    async unfollowTopic(ctx) {
        const me = await User.findById(ctx.state.user._id).select('+followingTopics');
        const index = me.followingTopics.map(id => id.toString()).indexOf(ctx.params.id);
        if(index > -1) {
            me.followingTopics.splice(index, 1);
            me.save();
        }
        ctx.status = 204;
    }

    async listQuestions(ctx) {
        const questions = await Question.find({ questioner: ctx.params.id });
        ctx.body = questions;
    }

    async listLikingAnswers(ctx) {
        const user = await User.findById(ctx.params.id).select('+likingAnswers').populate('likingAnswers'); // populate 获取详细信息
        if(!user) { ctx.throw(404, '用户不存在'); }
        ctx.body = user.likingAnswers;
    }

    async likeAnswer(ctx, next) {
        const me = await User.findById(ctx.state.user._id).select('+likingAnswers');
        if(!me.likingAnswers.map(id => id.toString()).includes(ctx.params.id) && ctx.params.id!==me._id.toString()) {
            me.likingAnswers.push(ctx.params.id);
            me.save();
            await Answer.findByIdAndUpdate(ctx.params.id, { $inc: { voteCount: 1 } });
        }
        ctx.status = 204;
        await next()
    }

    async unlikeAnswer(ctx) {
        const me = await User.findById(ctx.state.user._id).select('+likingAnswers');
        const index = me.likingAnswers.map(id => id.toString()).indexOf(ctx.params.id);
        if(index > -1) {
            me.likingAnswers.splice(index, 1);
            me.save();
            await Answer.findByIdAndUpdate(ctx.params.id, { $inc: { voteCount: -1 } });
        }
        ctx.status = 204;
    }

    async listDislikingAnswers(ctx) {
        const user = await User.findById(ctx.params.id).select('+dislikingAnswers').populate('dislikingAnswers'); // populate 获取详细信息
        if(!user) { ctx.throw(404, '用户不存在'); }
        ctx.body = user.dislikingAnswers;
    }

    async dislikeAnswer(ctx, next) {
        const me = await User.findById(ctx.state.user._id).select('+dislikingAnswers');
        if(!me.dislikingAnswers.map(id => id.toString()).includes(ctx.params.id) && ctx.params.id!==me._id.toString()) {
            me.dislikingAnswers.push(ctx.params.id);
            me.save();
        }
        ctx.status = 204;
        await next()
    }

    async undislikeAnswer(ctx) {
        const me = await User.findById(ctx.state.user._id).select('+dislikingAnswers');
        const index = me.dislikingAnswers.map(id => id.toString()).indexOf(ctx.params.id);
        if(index > -1) {
            me.dislikingAnswers.splice(index, 1);
            me.save();
        }
        ctx.status = 204;
    }

    async listCollectingAnswers(ctx) {
        const user = await User.findById(ctx.params.id).select('+collectingAnswers').populate('collectingAnswers'); // populate 获取详细信息
        if(!user) { ctx.throw(404, '用户不存在'); }
        ctx.body = user.collectingAnswers;
    }

    async collectAnswer(ctx, next) {
        const me = await User.findById(ctx.state.user._id).select('+collectingAnswers');
        if(!me.collectingAnswers.map(id => id.toString()).includes(ctx.params.id) && ctx.params.id!==me._id.toString()) {
            me.collectingAnswers.push(ctx.params.id);
            me.save();
        }
        ctx.status = 204;
        await next()
    }

    async uncollectAnswer(ctx) {
        const me = await User.findById(ctx.state.user._id).select('+collectingAnswers');
        const index = me.collectingAnswers.map(id => id.toString()).indexOf(ctx.params.id);
        if(index > -1) {
            me.collectingAnswers.splice(index, 1);
            me.save();
        }
        ctx.status = 204;
    }
}

module.exports = new UsersCtl();