const Answer = require('../models/answers');

class AnswerCtl {
    async find(ctx) {
        const { page, per_page = 10, q = '' } = ctx.query;
        const qArr = q.split('').filter(r => r).join('.*');
        const pageNum = Math.max(isNaN(page - 0) ? 1 : page - 0, 1) - 1;
        const perPage = Math.max(isNaN(per_page - 0) ? 10 : per_page - 0 - 0, 1);
        const qRegExp = new RegExp(`.*${qArr}.*`);
        ctx.body = await Answer
            .find({ content: qRegExp, questionId: ctx.params.questionId })
            .limit(perPage).skip(perPage * pageNum);
    }

    async checkAnswerExist(ctx, next) {
        const answer = await Answer.findById(ctx.params.id).select('+answerer');
        if (!answer) { ctx.throw(404, '答案不存在'); }
        if (ctx.params.questionId && answer.questionId !== ctx.params.questionId) { ctx.throw(404, '此问题下没有此答案'); }
        ctx.state.answer = answer;
        await next();
    }

    async findById(ctx) {
        const { fields = '' } = ctx.query;
        const selectFields = fields.split(';').filter(f => f).map(item => ' +' + item).join('');
        const answer = await Answer.findById(ctx.params.id).select(selectFields).populate('answerer');
        ctx.body = answer;
    }

    async create(ctx) {
        ctx.verifyParams({
            content: { type: 'string', required: true }
        });
        const answerer = ctx.state.user._id;
        const { questionId } = ctx.params;
        const answer = await new Answer({ ...ctx.request.body, answerer, questionId }).save();
        ctx.body = answer;
    }

    async checkAnswerer(ctx, next) {
        const { answer } = ctx.state;
        if (answer.answerer.toString() !== ctx.state.user._id) { ctx.status = (403, '没有权限') }
        await next();
    }

    async update(ctx) {
        ctx.verifyParams({
            content: { type: 'string', required: false }
        });
        await ctx.state.answer.updateOne(ctx.request.body); // findByID 在 check... 存入 state 
        ctx.body = ctx.state.answer;
    }

    async delete(ctx) {
        await Answer.findByIdAndRemove(ctx.params.id);
        ctx.status = 204;
    }
}

module.exports = new AnswerCtl();