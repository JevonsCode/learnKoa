const PWD = require('./pwd.json')
console.log(PWD)
module.exports = {
    secret: PWD.SECRET,
    connectionStr: `mongodb+srv://jevons:${PWD.PASSWD}@learn-h3neu.mongodb.net/test?retryWrites=true&w=majority`
}