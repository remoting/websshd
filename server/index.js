var pty = require('pty.js');
var io = require('socket.io');
var http = require('http');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');

var btoa = function(s) {
    return (new Buffer(s)).toString('base64');
};

var atob = function(s) {
    return (new Buffer(s, 'base64')).toString('binary');
};

var app = express();
app.use(express.static(path.join(__dirname, '../public')));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cookieSession({
    name: 'session',
    httpOnly: false,
    keys: ['key1', 'key2']
}));
 
var server = http.createServer(app);
var sio = io.listen(server);
  
sio.sockets.on('connection', function (socket) {

    console.log('A socket connected!');

    socket.on('createTerminal', function(term_id, func){
        var args = term_id.split('§');

        console.log(args);

        var term = pty.spawn('bash', [], {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: "./",
            env: process.env
        });

        term.on('data', function(data) {
            socket.emit('output', btoa(data));
        }); 
        term.on('exit', function(){
                socket.emit('exit', {})
        });
        //////////////////////
        socket.on('input', function (data) {
            term.write(atob(data));
        });
        socket.on('resize', function (data) {
            term.resize(data.w, data.h);
        });
        socket.on('disconnect', function(){
                term.destroy()
        });
        func(term_id);
    });
});

var port = 50000;
var host = "0.0.0.0";

server.listen(port, host, function() {
    console.log("Listening on %s:%d in %s mode", host, port, app.settings.env);
});