// InterLace Node.js server component

var express = require('express');

var UPLOAD_DIR = '/tmp/InterLace_uploads'
  , MEDIA_DIR = __dirname + '/static/media/'
  , resumable = require('resumable')(UPLOAD_DIR)
  , encode = require('encode')(UPLOAD_DIR, MEDIA_DIR);

var app = express();//.createServer();

// Static
app.use(express.static(__dirname + '/static'));

app.use(express.bodyParser());


// FILE UPLOADS
// (copied from lib/resumable/samples/Node.js/app.js)

// Handle uploads through Resumable.js
app.post('/upload', function(req, res){

    // console.log(req);

    resumable.post(req, function(status, filename, original_filename, identifier){
        console.log('POST', status, original_filename, identifier);

        res.send(status, {
            // NOTE: Uncomment this funciton to enable cross-domain request.
            //'Access-Control-Allow-Origin': '*'
        });

        if(status === 'done') {
            encode.onupload(identifier, filename);
        }
    });
});

// Handle cross-domain requests
// NOTE: Uncomment this funciton to enable cross-domain request.
/*
  app.options('/upload', function(req, res){
  console.log('OPTIONS');
  res.send(true, {
  'Access-Control-Allow-Origin': '*'
  }, 200);
  });
*/

// Handle status checks on chunks through Resumable.js
app.get('/upload', function(req, res){
    resumable.get(req, function(status, filename, original_filename, identifier){
        console.log('GET', status);
        res.send(status, (status == 'found' ? 200 : 404));
    });
});


// --

app.listen(1111);
console.log('InterLace running at http://localhost:1111/');
