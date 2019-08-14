const jwt = require('koa-jwt');

const Router = require('koa-router');
const router = new Router({ prefix: '/users' });
const {
    find, findById, create, update, delete: del,
    login, checkOwner, listFollowing, follow, unfollow, listFollowers,
    checkUserExist, followTopic, unfollowTopic, listFollowingTopics,
    listQuestions,
    listLikingAnswers, likeAnswer, unlikeAnswer,
    listDislikingAnswers, dislikeAnswer, undislikeAnswer
} = require('../controllers/users');
const { checkTopicExist } = require('../controllers/topics');
const { checkAnswerExist } = require('../controllers/answers');
const { secret } = require('../config');

const auth = jwt({ secret });

router.get('/', find);

router.post('/', create);

router.get('/:id', findById);

router.patch('/:id', auth, checkOwner, update); // put 是整体替换， patch 是部分替换

router.delete('/:id', auth, checkOwner, del);

router.post('/login', login);

router.get('/:id/following', listFollowing);

router.get('/:id/followers', checkUserExist, listFollowers);

router.put('/following/:id', auth, checkUserExist, follow);

router.delete('/following/:id', auth, checkUserExist, unfollow);

router.get('/:id/followingTopics', listFollowingTopics);

router.put('/followingTopics/:id', auth, checkTopicExist, followTopic);

router.delete('/followingTopics/:id', auth, checkTopicExist, unfollowTopic);

router.get('/:id/questions', listQuestions);

router.get('/:id/likingAnswers', listLikingAnswers);

router.put('/likeAnswers/:id', auth, checkAnswerExist, likeAnswer, undislikeAnswer);

router.delete('/unlikeAnswers/:id', auth, checkAnswerExist, unlikeAnswer);

router.get('/:id/dislikingAnswers', listDislikingAnswers);

router.put('/dislikeAnswers/:id', auth, checkAnswerExist, dislikeAnswer, unlikeAnswer);

router.delete('/undislikeAnswers/:id', auth, checkAnswerExist, undislikeAnswer);

module.exports = router;