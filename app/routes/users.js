const jwt = require('koa-jwt');

const Router = require('koa-router');
const router = new Router({ prefix: '/users'});
const { find, findById, create, update, delete: del, login, checkOwner, listFollowing, follow, unfollow, listFollowers, checkUserExist } = require('../controllers/users');

const { secret } = require('../config');

const auth = jwt({ secret });

router.get('/', find);

router.post('/', create);

router.get('/:id', findById);

router.patch('/:id', auth, checkOwner, update); // put 是整体替换， patch 是部分替换

router.delete('/:id', auth, checkOwner, del);

router.post('/login', login);

router.get('/:id/following', listFollowing);

router.get('/:id/followers', listFollowers);

router.put('/following/:id', auth, checkUserExist, follow);

router.delete('/following/:id', auth, checkUserExist, unfollow);

module.exports = router;