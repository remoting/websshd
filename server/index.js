var pty = require('pty.js');
var io = require('socket.io');
var http = require('http');
var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var cookieSession = require('cookie-session');
var crypto = require('crypto');

var base64_encode = function (str) {  // btoa
    return new Buffer(str).toString('base64');
};

var base64_decode = function(str) { // atob
    return new Buffer(str, 'base64').toString(); //('binary');
};

var md5 = function(str) {
    return crypto.createHash("md5").update(str).digest("hex");
};

var des_encrypt = function(key, plaintext) {     
    var cipher = crypto.createCipheriv('des-ede3', new Buffer(key), new Buffer(0));  
    cipher.setAutoPadding(true)
    var ciph = cipher.update(plaintext, 'utf8', 'hex');  
    return ciph += cipher.final('hex'); 
}

var des_decrypt = function(key, plaintext) {  
    var decipher = crypto.createDecipheriv('des-ede3', new Buffer(key), new Buffer(0));  
    decipher.setAutoPadding(true)  
    var txt = decipher.update(plaintext, 'hex', 'utf8');  
    return txt += decipher.final('utf8');      
}

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
        var key = md5(env_key).substr(0, 24);
        var args = des_decrypt(key, term_id).split('§');
        console.log(args.join(','));
        // 验证
        if (args.length!=6) {
            console.log("ERROR args length:", args.length);
            return;
        }

        var md5str=args.pop();
        if ( md5str != md5(args.join('§')) ) {
            args[4] = ''+ (new Date()).valueOf();
            console.log("ERROR params:", des_encrypt(key, args.join('§') + '§' + md5(args.join('§'))));
            return;
        }

        var step = Math.abs((new Date()).valueOf() - Number(args.pop()))
        if ( step > 1000*env_step) {
            console.log("ERROR step:", step);
            return;
        }
        
        var host=process.env['K8S_HOST_'+args[0].toUpperCase()];
        var cmd = ['-s', host, 'exec', '-it', '--namespace', args[1], args[2], args[3]] 
        var term = pty.spawn('kubectl', cmd, {
            name: 'xterm-color',
            cwd: "~/"
        });

        term.setEncoding("utf8");
        term.on('data', function(data) {
            socket.emit('output', data);
        }); 
        term.on('exit', function(){
            socket.emit('exit', {})
        });
        //////////////////////
        socket.on('input', function (data) {
            term.write(data);
        });
        socket.on('resize', function (data) {
            console.log(data.w + "－－－" + data.h);
            term.resize(data.w, data.h);
        });
        socket.on('disconnect', function(){
                term.destroy()
        });
        func(term_id);
    });
});

var host = "0.0.0.0";
var env_port = process.env.WEBSSH_PORT || 50000;
var env_key = process.env.WEBSSH_KEY || "yihecloud";
var env_step = Number(process.env.EXPIRATION_TIME) || 60;

server.listen(env_port, host, function() {
    console.log("Listening on %s:%d in %s mode", host, env_port, app.settings.env);
    console.log("env LIVE:", process.env.K8S_HOST_LIVE);
    console.log("env TEST:", process.env.K8S_HOST_TEST);
    console.log("env EXPIRATION_TIME:",env_step);
    console.log("env KEY:", env_key);
});