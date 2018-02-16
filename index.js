"use strict";

var express = require('express')
  , kf = require('kf-getticket')
  , rp= require('request-promise');

var app = express();

app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  console.log('get /');
  res.sendFile(__dirname + "/public/index.html", function (err) {
    if (err) {
      console.log(err);
      res.status(404).end();
    }
    else {
      console.log('Sent: index.html');
    }
  });
});

app.get('/getticket', function (req, res, next) { 
  kf.getTicket(usr,pw).then((ticket) => {
    res.status(200).send(ticket);
  })
  .catch((err) => {
    res.status(400).send('Ukendt username og password: ' + err);
  });
}); 

app.get('/oisbygninger', function (req, res, next) {
  if (!req.query.format ||  !req.query.x || !req.query.y || !req.query.medtagugyldige) {
    res.status(400).send('mangler queryparametre');
    return;
  } 
  var options= {};
  options.url='https://dawa.aws.dk/ois/bygninger';
  options.qs= {};
  options.qs.format= req.query.format;
  options.qs .x= req.query.x;
  options.qs.y= req.query.y;
  options.qs.medtagugyldige= req.query.medtagugyldige;
  //options.resolveWithFullResponse= true; 
  rp(options).then((body) => {    
    console.log('oisbygninger: %s, %d', body, body.length);
    res.writeHead(200, {'content-type': 'application/json; charset=UTF-8'});
    res.end(body);
  })
  .catch((err) => {
    res.status(500).send('fejl i request af OIS bygninger: ' + err);
  });
}); 

var usr= process.argv[2]
  , pw= process.argv[3]
  , port= process.argv[4];

if (!port) port= 3000;

kf.getTicket(usr,pw).then(ticket => {
  var server = app.listen(port, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log('URL http://%s:%s', host, port);
  });
})
.catch(err => {
  console.log("Ukendt username og password (%s)",err);
});