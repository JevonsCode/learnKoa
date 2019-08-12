const Question = require('../models/questions');

class QuestionCtl {
    async find(ctx) {
        const { page, per_page = 10, q = '' } = ctx.query;
        const qArr = q.split('').filter(r => r).join('.*');
        const pageNum = Math.max(isNaN(page - 0) ? 1 : page - 0, 1) - 1;
        const perPage = Math.max(isNaN(per_page - 0) ? 10 : per_page - 0 - 0, 1);
        const qRegExp = new RegExp(`.*${qArr}.*`);
        ctx.body = await Question
            .find({ $or: [{ title: qRegExp }, { description: qRegExp }] })
            .limit(perPage).skip(perPage * pageNum);
    }

    async checkQuestionExist(ctx, next) {
        const question = await Question.findById(ctx.params.id).select('+questioner');
        if (!question) { ctx.throw(404, '问题不存在'); }
        ctx.state.question = question;
        await next();
    }

    async findById(ctx) {
        const { fields = '' } = ctx.query;
        const selectFields = fields.split(';').filter(f => f).map(item => ' +' + item).join('');
        const question = await Question.findById(ctx.params.id).select(selectFields).populate('questioner');
        ctx.body = question;
    }

    async create(ctx) {
        ctx.verifyParams({
            title: { type: 'string', required: true },
            description: { type: 'string', required: false }
        });
        // const { questioner } = ctx.request.body;
        // const repeatedUser = await Question.findOne({ name });
        // if(repeatedUser) { ctx.throw(409, '话题已经存在') }; // 409 状态码表示冲突
        const question = await new Question({ ...ctx.request.body, questioner: ctx.state.user._id }).save();
        ctx.body = question;
    }

    async checkQuestioner(ctx, next) {
        const { question } = ctx.state;
        if (question.questioner.toString() !== ctx.state.user._id) { ctx.status = (403, '没有权限') }
        await next();
    }

    async update(ctx) {
        ctx.verifyParams({
            name: { type: 'string', required: false },
            description: { type: 'string', required: false }
        });
        await ctx.state.question.update(ctx.request.body); // findByID 在 check... 存入 state 
        ctx.body = ctx.state.question;
    }

    async delete(ctx) {
        await Question.findByIdAndRemove(ctx.params.id);
        ctx.status = 204;
    }
}

module.exports = new QuestionCtl();