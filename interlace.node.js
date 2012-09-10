// InterLace Node.js server component

var http = require('http')
  , app = http.createServer(handle)
  , fs = require('fs')
  , url = require('url');

var resumable = require('resumable');

function handle(req, res) {
    var r_url = url.parse(req.url, false);

    // Force `/' to `index.html'
    if(r_url.path == '/') {
        r_url.path = '/index.html';
    }

    // Return .css, .html, .js, and .png as static files.
    // XXX: security?
    var ext = r_url.path.split('.');
    ext = ext[ext.length-1];
    if(ext in {css:1, html:1, js:1, png:1}) {

        fs.readFile(__dirname + '/static' + r_url.path, function (err, data) {
            if (err) {
                res.writeHead(404);
                return res.end('File not found: ' + r_url.path);
            }
            res.writeHead(200);
            res.end(data);
        });
    }
    else {
        res.writeHead(500);
        res.end('Internal error');
    }
}

app.listen(1111, "127.0.0.1");
console.log('InterLace running at http://localhost:1111/');
