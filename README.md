# Node.js の（系统 & 规范）学习

## [Koa](https://koa.bootcss.com/) の 学习

### Koa の 安装

```npm i koa -S```

### Koa の 使用

```
const Koa = require('koa');
const app = new Koa();

...
app.listen(3000);
```

### Koa-router の 安装

```npm i koa-router -S```

### Koa-router の 使用

和 [Express](http://www.expressjs.com.cn/) 一样的语法，新学到了 Koa 的 prefix 写法，以前中间件只知道放中间用，原来封装原理是这样（```"auth"```）~

```
const Koa = require('koa');
const Router = require('koa-router');
const app = new Koa();
const router = new Router();
const userRouter = new Router({ prefix: '/users'});

const auth = async (ctx, next) => {
    if(ctx.url !== '/users') {
        ctx.throw(401)
    }
    await next()
}

userRouter.get('/:id', auth, (ctx) => {
    ctx.body = `这是用户: ${ctx.params.id}`
});
...
app.use(router.routes());
app.use(userRouter.routes());

app.listen(3000);
```
*注意：记得要把`router`和自己定义的前置路由在后面挂载上*

### HTTP 操作
TODO

### 良好的目录结构

- 将路由单独放一个目录
- 将控制器单独放一个目录
- 使用“类 + 类方法”的方式组织控制器

*tip:（循环读取路由）*

```
module.exports = (app) => {
    fs.readdirSync(__dirname).forEach(file => {
        if(file === 'index.js') { return }
        const route = require(`./${file}`);
        app.use(route.routes()).use(route.allowedMethods());
    });
}
```

*让不同的目录做不同的事情，`controllers`中就是业务代码*

### 异常状况 & 错误处理

- 运行时错误，都返回 500
- 逻辑错误，如找不到（404）、先决条件失败（412）、无法处理的实体（参数格式不对，412）etc

Koa 对错误会有自己的处理
如404`Not Found`
500`Internal Server Error`

**EX:** 412错误可以写成```ctx.throw(412)```*默认错误信息`Precondition Failed`*

需要自己**自定义错误信息**时，写成```ctx.throw(412, "先决条件出错！")```

### 自己编写错误处理中间件

```
app.use(async (ctx, next) => {
    try {
        await next();
    } catch(err) {
        ctx.status = err.status || err.statusCode || 500;
        ctx.body = {
            message: err.message
        }
    }
});
```
Koa 自定义中间件可以捕获404外的所有异常，
`status`和`statusCode`拿不到的时候就是运行异常了，在最后或一个500

### Koa-json-error

*直接用轮子*

安装： `npm i koa-json-error -S` || `yarn add koa-json-error -S`

使用：

```
const error = require('koa-json-error');
app.use(error());
```

这个中间件会返回一个 JSON 字段，包含`name`, `message`, `stack`, `status`

`stack`是会返回错误原因，只能用于开发环境

定制返回格式：`postFormat`

**EX:**

```
app.use(error({
    postFormat: (e, {stack, ...others}) => process.env.NODE_ENV === 'production' ? others : {stack, ...others}
}));
```

*在Windows电脑上要安装cross-env来模拟环境，mac直接写`NODE_ENV=production`*

```
"start": "cross-env NODE_ENV=production node app",
"dev": "nodemon app"
```

### 使用 Koa-parameter 校验参数

安装：`npm i koa-parameter -S` || `yarn add koa-parameter -S`

使用：

```
const parameter = require('koa-parameter');
app.use(parameter(app));
```
**EX:**

```
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
```

## NoSQL

### 什么是 NoSQL

- 列存储（HBase）
- **文档存储（MongoDB）**
- Key-value 存储（Redis）
- 图存储（FlockDB）
- 对象存储（db4o）
- XML 存储（BaseX）

### WHY

- 简单 （没有很多复杂的规范）
- 便于横向拓展
- 适合超大规模的数据存储
- 很灵活地存储复杂结构的数据（Schema Free）

### MongoDB

**Introduction**
- 来源 "Humongous"（庞大）
- 面向文档存储的开源数据库
- Written by C++

**WHY**
- 性能好（内存计算）
- 大规模数据存储（可拓展性）
- 可靠安全（本地复制、自动故障转移）
- 方便存储复杂数据结构（Schema Free）

### Mongoose

安装：`npm i mongoose -S` || `yarn add mongoose -S`
使用：

```
mongoose.connect(*连接信息*, { useNewUrlParser: true }, *连接成功回调*);
mongoose.connection.on('error', console.error);
```

### 设计用户模块的 Schema

写代码前要对这些模块的规范进行统一的设计

用`mongoose`中的`Schema`来规范

```
const mongoose = require('mongoose');
const { Schema, model } = mongoose;
const userSchema = new Schema({
    name: { type: String, required: true }
});
module.exports = model('User', userSchema);
```
*'User' 相当于集合的名字*

### 用 Mongoose 的 CURD

```
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

    async update(ctx) {
        ctx.verifyParams({
            name: {
                type: 'string',
                required: true
            }
        })
        const user = await User.findByIdAndUpdate(ctx.params.id, ctx.request.body);
        if(!user) { ctx.throw(404, '用户不存在'); }
        ctx.body = user;
    }

    async delete(ctx) {
        const user = await User.findByIdAndRemove(ctx.params.id);
        if(!user) { ctx.throw(404, '用户不存在'); }
        ctx.status = 204;
    }
}
```

*mongoose 的增删改查是真的比原生方便很多 QAQ*

## [JWT](https://jwt.io/)

### WHAT

**JSON WEB TOKEN 是一个开放标准(RFC 7519)**

构成：
- Header    (头部)
    - typ token 的类型，这里固定为 JWT
    - alg 使用的 hash 算法，例如：HMAC SHA256 或者 RSA
- Payload   (有效载荷)
    - 存储需要传递的信息，如用户ID、用户名等
    - 还包含元数据，如过期时间、发布人等
    - 与 Header 不同，Payload 可以加密
- Signature (签名)
    - 将header与payload组合一起，生成一个字符串header.payload，然后再添加一个秘钥

### 使用

安装：`npm i jsonwebtoken -S` || `yarn add jsonwebtoken`

```
jwt = require('jsonwebtoken')
token = jwt.sign({name: jevons}, 'secret')
jwt.verify(token, 'secret')
```

### 实现用户注册

- 设计用户 Schema  

```
const userSchema = new Schema({
    __v: { type: Number, select: false },
    name: { type: String, required: true },
    password: { type: String, required: true, select: false }
});
```

`select: false` 是 mongoose 自带的查询排除字段
> if excluding, apply schematype select:false fields

- 编写保证唯一性的逻辑  

```
const { name } = ctx.request.body;
const repeatedUser = await User.findOne({ name });
if(repeatedUser) { ctx.throw(409, '用户已经存在') }; // 409 状态码表示冲突
```

Tip: `router.patch('/:id', update); // put 是整体替换， patch 是部分替换`

### 实现登录

- 登录接口设计  
- 用 jsonwebtoken 生成 token  

```
router.post('/login', login);
...
async login(ctx) {
    ctx.verifyParams({
        name: { type: 'string', required: true },
        password: { type: 'string', required: true }
    });
    const user = await User.findOne(ctx.request.body);
    if(!user) { ctx.throw(401, '用户名或密码不正确'); };
    const { _id, name } = ctx.request.body;
    const token = jsonwebtoken.sign({ _id, name }, secret, { expiresIn: '7d' });
    ctx.body = { token };
}
```

### 自己编写 Koa 中间件实现用户认证与授权

**检查 token 中间件**

```
const auth = async (ctx, next) => {
    const { authorization = '' } = ctx.request.header;
    const token = authorization.replace('Bearer ', '');
    try {
        const user = jsonwebtoken.verify(token, secret);
        ctx.state.user = user;
    } catch(err) {
        ctx.throw(401, err.message);
    }
    await next();
}
```

**独立权限**

```
async checkOwner(ctx, next) {
    if(ctx.params.id !== ctx.state.user._id) { ctx.throw(403, '没有权限') }
    await next();
}
```

### koa-jwt 中间件，不自己写轮子

安装：`npm i koa-jwt -S` || `yarn add koa-jwt`

- 使用中间件保护接口

- 使用中间件获取用户信息

```
const jwt = require('koa-jwt');
...
const auth = jwt({ ... });
```

## 上传头像的需求场景

### 需求分析

用户头像、封面图片等等

- 基础功能：上传图片、生成图片链接

- 附加功能：限制图片大小与类型、生成分辨率不同的图片链接、生成CDN

### 使用 koa-body 中间件获取上传的文件

- 安装 koa-body 替换 koa-bodyparser
    `npm i koa-body -S` || `yarn add koa-body`

- 设置图片上传目录  
    ```
    upload(ctx) {
        const file = ctx.request.files.file;
        ctx.body = { path: file.path }
    }
    ...
    router.post('/upload', upload);
    ```

- 使用 Postman 上传测试
    用 form-data 格式

### 使用 koa-static 中间件生成图片链接

- 安装 koa-static
    `npm i koa-static -S` || `yarn add koa-static`

- 设置静态文件目录  
    ```
    const koaStatic = require('koa-static');
    app.use(koaStatic(path.join(__dirname, 'public')));
    ```

- 生成图片链接
    ```
    upload(ctx) {
        const file = ctx.request.files.file;
        const basename = path.basename(file.path);
        ctx.body = { url: `${ctx.origin}/uploads/${basename}` }
    }
    ```

### 用前端页面上传文件  

*静态文件都写在`/public`中*

```
<form action="/upload" enctype="multipart/form-data" method="POST">
    <!-- image/png || .png, .jpg || image/* -->
    <input type="file" name="file" accept="image/*">
    <button type="submit">UPLOAD</button>
</form>
```

## 个人资料模块

### 需求分析  

- 不同类型（如字符串、数组）的属性

- 字段过滤

### 个人资料的 schema 设计  

- 分析数据结构  

- 设计个人资料的 schema  
    gender: { type: String, enum: ['male', 'female'], default: 'male', required: true },
    枚举、默认值的写法

    ```
    const userSchema = new Schema({
        __v: { type: Number, select: false },
        name: { type: String, required: true },
        password: { type: String, required: true, select: false },

        avatar_url: { type: String },
        gender: { type: String, enum: ['male', 'female'], default: 'male', required: true },
        headline: { type: String },
        locations: { type: [{ type: String }] },
        business: { type: String },
        employments: {
            type: [{
                company: { type: String },
                job: { type: String }
            }]
        },
        educations: {
            type: [{
                school: { type: String },
                major: { type: String },
                diploma: { type: Number, enum: [1, 2, 3, 4, 5] },
                entrance_year: { type: Number },
                graduation_year: { type: Number }
            }]
        }
    });
    ```
 
### 参数校验

- 分析个人资料的数据结构

- 编写代码校验个人资料参数
    ```
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
    ```

### 字段过滤 

- 重新设计 schema 的隐藏字段
    给详细信息设置`select: false`

- 通过查询字符串显示隐藏字段
    通过`.select(字段)`打开
    ```
    const { fields } = ctx.query;
    const selectFields = fields ? fields.split(';').filter(f => f).map(f => ' +' + f).join('') : '';
    const user = await User.findById(ctx.params.id).select(selectFields);
    ```

## 关注与粉丝模块

### 细化功能点

- 关注、取消关注

- 获取关注人、粉丝列表（用户-用户多对多关系）

### 关注与粉丝的 schema 设计

- 分析关注与粉丝的数据结构

- 设计关注与粉丝的 schema  
    ```
    following: {
        type: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        select: false
    }
    ```

### RESTful 风格的关注与粉丝接口

 - 实现获取关注人和粉丝列表接口
    ```
    router.get('/:id/following', listFollowing);
    ...
    async listFollowing(ctx) {
        const user = await User.findById(ctx.params.id).select('+following').populate('following'); // populate 获取详细信息
        if(!user) { ctx.throw(404); }
        ctx.body = user.following;
    }

    // 查找条件是 following 中有‘自己’ id 的用户
    async listFollowers(ctx) {
        const user = await User.find({ following: ctx.params.id });
        ctx.body = user;
    }
    ```

 - 实现关注和取消接口
    ```
    router.put('/following/:id', auth, follow)
    ...
    async follow(ctx) {
        const who = await User.findById(ctx.state.user._id).select('+following');
        // 判断 following 数组中是否有这个 id && 是不是自己
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
    ```

### 编写校验用户存在与否的中间件

*防止关注不存在的用户*

```
async checkUserExist(ctx, next) {
    const user = await User.findById(ctx.params.id);
    if(!user) { ctx.throw(404, '用户不存在'); }
    next();
}
```

## 话题模块

- 话题的增改查

- 分页、模糊搜索

- 用户属性中的话题引用

- 关注/取消关注话题、用户关注的话题列表

### RESTful 风格的话题增改查接口

- 设计 Schema

- 实现 RESTful 风格的增改查接口