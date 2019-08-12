const Topic = require('../models/topics');

class TopicCtl {
    async find(ctx) {
        const { page, per_page = 10, q = '' } = ctx.query;
        const qArr = q.split('').filter(r => r).join('.*');
        const pageNum = Math.max(isNaN(page - 0) ? 1 : page - 0, 1) - 1;
        const perPage = Math.max(isNaN(per_page - 0) ? 10 : per_page - 0 - 0, 1);
        ctx.body = await Topic
            .find({ name: new RegExp(`.*${qArr}.*`) })
            .limit(perPage).skip(perPage * pageNum);
    }

    async checkTopicExist(ctx, next) {
        const topic = await Topic.findById(ctx.params.id);
        if(!topic) { ctx.throw(404, '话题不存在'); }
        await next();
    }

    async findById(ctx) {
        const { fields = '' } = ctx.query;
        const selectFields = fields.split(';').filter(f => f).map(item => ' +' + item).join('');
        const topic = await Topic.findById(ctx.params.id).select(selectFields);
        ctx.body = topic;
    }

    async create(ctx) {
        ctx.verifyParams({
            name: { type: 'string', required: true },
            avatar_url: { type: 'string', required: false },
            introduction: { type: 'string', required: false }
        });
        const { name } = ctx.request.body;
        const repeatedUser = await Topic.findOne({ name });
        if(repeatedUser) { ctx.throw(409, '话题已经存在') }; // 409 状态码表示冲突
        const topic = await new Topic(ctx.request.body).save();
        ctx.body = topic;
    }

    async update(ctx) {
        ctx.verifyParams({
            name: { type: 'string', required: false },
            avatar_url: { type: 'string', required: false },
            introduction: { type: 'string', required: false }
        });
        const topic = await Topic.findByIdAndUpdate(ctx.params.id, ctx.request.body);
        if(!topic) { throw(404, '话题不存在'); }
        ctx.body = topic;
    }
}

module.exports = new TopicCtl();