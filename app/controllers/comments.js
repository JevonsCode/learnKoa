const Comment = require('../models/comments');

class CommentCtl {
    async find(ctx) {
        const { page, per_page = 10, q = '', rootCommentId } = ctx.query;
        const qArr = q.split('').filter(r => r).join('.*');
        const pageNum = Math.max(isNaN(page - 0) ? 1 : page - 0, 1) - 1;
        const perPage = Math.max(isNaN(per_page - 0) ? 10 : per_page - 0 - 0, 1);
        const qRegExp = new RegExp(`.*${qArr}.*`);
        const { questionId, answerId} = ctx.params;
        ctx.body = await Comment
            .find({ content: qRegExp, questionId, answerId, rootCommentId })
            .limit(perPage).skip(perPage * pageNum)
            .populate('commentator replyTo');
    }

    async checkCommentExist(ctx, next) {
        const comment = await Comment.findById(ctx.params.id).select('+commentator');
        if (!comment) { ctx.throw(404, '评论不存在'); }
        if (ctx.params.questionId && comment.questionId !== ctx.params.questionId) { ctx.throw(404, '此问题下没有此评论'); }
        if (ctx.params.answerId && comment.answerId !== ctx.params.answerId) { ctx.throw(404, '此答案下没有此评论'); }
        ctx.state.comment = comment;
        await next();
    }

    async findById(ctx) {
        const { fields = '' } = ctx.query;
        const filterFields = fields.split(';').filter(f => f);
        const selectFields = filterFields.map(item => ' +' + item).join('');
        const populateStr = filterFields.map(item => {
            if(item === 'commentator') {
                return 'commentator'
            }
            return item
        }).join(' ');
        const comment = await Comment.findById(ctx.params.id).select(selectFields).populate(populateStr);
        ctx.body = comment;
    }

    async create(ctx) {
        ctx.verifyParams({
            content: { type: 'string', required: true },
            rootCommentId: { type: 'string', required: false },
            replyTo: { type: 'string', required: false }
        });
        const commentator = ctx.state.user._id;
        const { questionId, answerId } = ctx.params;
        const comment = await new Comment({ ...ctx.request.body, commentator, questionId, answerId }).save();
        ctx.body = comment;
    }

    async checkCommentator(ctx, next) {
        const { comment } = ctx.state;
        if (comment.commentator.toString() !== ctx.state.user._id) { ctx.status = (403, '没有权限') }
        await next();
    }

    async update(ctx) {
        ctx.verifyParams({
            content: { type: 'string', required: false },
            
        });
        const { content } = ctx.request.body;
        await ctx.state.comment.updateOne({ content }); // findByID 在 check... 存入 state 
        ctx.body = ctx.state.comment;
    }

    async delete(ctx) {
        await Comment.findByIdAndRemove(ctx.params.id);
        ctx.status = 204;
    }
}

module.exports = new CommentCtl();