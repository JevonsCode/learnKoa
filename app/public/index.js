const http = require('http');
const fs = require('fs');
http.createServer((req, res) => {
        const html = fs.readFileSync('index.html', 'utf8');
        res.writeHead(200, {
            'Content-Type': 'text-html',
            // 'Content-Security-Policy': 'none' 
        });
        res.end(html);
}).listen(9000);

console.log('server listening on 9000');