const express = require('express');
const app = express();
const ejs = require('ejs');
const path = require('path');
const pbip = require('public-ip');
const util = require('./server_side/util');
const multer = require('multer');
const upload = multer({dest: 'saved_files/'});
const Map = require('./server_side/map');

const port = 6400;
let publicIpAddress = null;

const server = app.listen(port, async() => {
    publicIpAddress = await pbip.v4();
    console.log("Browser Opened at { "+publicIpAddress+":6400 }");
});
const io = require('socket.io')(server);

let userCookieBundle = [];
let roomBundle = [];
let socketMap = new Map();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, './views'));
app.use(express.static(path.join(__dirname, 'static')));
app.use(express.json());
app.use(express.urlencoded({extended: true}));
// app.use(function(req, res, next){
//     const cip = req.headers['x-forwarded-for'] ||  req.connection.remoteAddress;
//     const cipv4 = util.get_ipv4_from_ipstr(cip);
//     console.log("REQUEST: " + util.get_current_time_str()+" | "+cipv4+" > "+req.url);
//     next();
// });

app.get('/', (req, res)=>{
    let client_cookie = req.headers.cookie;
    let user_id = null;
    
    if(client_cookie == undefined){
        client_cookie = util.generate_cookie();
        user_id = util.generate_user_id();
        res.append('Set-Cookie', client_cookie+"; Max-Age=360000;");   // 100 hours: 360000
        userCookieBundle.push({
            userId: user_id,
            cookie: client_cookie,
        });
    }else{
        let user_id = util.get_user_id_by_cookie(userCookieBundle, client_cookie); // null check
        if(user_id == null){
            console.log('fatal error!');
        }
    }
    res.render('home');
});

app.get('/room', (req, res)=>{
    let client_cookie = req.headers.cookie;
    let requested_room_id = req.query.id;
    let user_nickname = req.query.nickname;
    let nickname_tag = util.generate_nickname_tag();
    let user_id = util.get_user_id_by_cookie(userCookieBundle, client_cookie);
    let total_nickname = user_nickname + "#" + nickname_tag;

    let room = util.get_room_by_id(roomBundle, requested_room_id);
    if(room != null){
        if(room.generatedUserInfo.id == user_id){
            room.generatedUserInfo.totalNickname = total_nickname;
        }
        //room participants 중복검사
        room.participants.push({
            userId: user_id,
            nickname: user_nickname,
            tag: nickname_tag,
        });
        res.render('room',{
            roomBossName: room.generatedUserInfo.totalNickname,
            myUserId: user_id,
            myNickname: user_nickname,
            myTag: nickname_tag,
            roomId: room.roomId,
        });
    }else{
        // room doesn't exist
        res.render('room',{
            roomBossName: "sample#2516",
            myUserId: user_id,
            myNickname: user_nickname,
            myTag: nickname_tag,
            roomId: "none",
        });
    }

});

app.get('/join-room', (req, res)=>{
    res.render('join_room');
});

app.post('/generate-room-id', (req, res)=>{
    let client_cookie = req.headers.cookie;
    let new_room_id = util.generate_room_id();
    let user_id = util.get_user_id_by_cookie(userCookieBundle, client_cookie);

    roomBundle.push({
        roomId: new_room_id,
        generatedUserInfo:{
            id: user_id,
        },
        participants: [],
        fileLibrary:[],
    });

    if(user_id == null){
        res.send("0");
    }else{
        res.send(new_room_id);
    }
});

app.post('/touch-room', (req, res)=>{
    let request_room_id = req.body.roomId;
    if(util.is_enterable_room(roomBundle, request_room_id)){
        res.send("OK");
    }else{
        res.send("NO");
    }
});

app.post('/upload', upload.any(), (req, res)=>{
    let roomId = req.body.roomId;
    let room = util.get_room_by_id(roomId);
    if(room != null){
        broadcastToAll(roomId, 'shared', req.files);
        res.send('uploaded!: '+req.files);
    }else{
        console.log("Fatal Error");
        res.send('Failed: room is null');
    }
});


/* server io socket listener */

io.on('connection', function(socket){
    //First touch
    console.log("Client connected: "+socket.id);

    socket.on('handshake', function(data){
        let roomInfo = util.get_room_by_id(roomBundle, data.roomId);
        if(roomInfo != null){
            broadcast(socket, 'first-touch-setting', {
                currentParticipantsList: roomInfo.participants,
            });
            broadcastExceptForInRoom(roomInfo.roomId, socket, 'join', {
                nickname: data.nickname,
                tag: data.tag,
                userId: data.userId,
            });
        }
        socketMap.put(socket.id, {
            userId: data.userId,
            roomId: data.roomId,
            clientSocket: socket,
        });
    });

    socket.on('message', function(data){
        switch(data.type){
            case 'chat':
                broadcastToAll(data.content.roomId, 'chat-broadcast', data.content);
                break;
        }
    });

    socket.on('disconnect', ()=>{
        console.log('Client disconnected: '+socket.id);
        let leavingSocket = socketMap.get(socket.id);
        if(leavingSocket == undefined){
            // 디버깅 후 적용 시 이전 버전의 룸에서 disconnect되는 경우
            console.log("Previous?");
            return;
        }

        let leavingUserId = leavingSocket.userId;
        let leavingRoomId = leavingSocket.roomId;

        socketMap.remove(socket.id);
        util.delete_user_in_room(roomBundle, leavingRoomId, leavingUserId);
        broadcastExceptForInRoom(leavingRoomId, socket, 'leave', {
            leavingUserId: leavingUserId,
        });
    });
});


/* internal functions */
function broadcastToAll(roomId, type, content){
    socketInfoBundle = socketMap.values();
    socketInfoBundle.forEach(elem => {
        if(roomId != elem.roomId) return;
        elem.clientSocket.emit('message', {
            type: type,
            content: content,
        });
    });
}

function broadcastExceptForInRoom(roomId, socket, type, content){
    socketInfoBundle = socketMap.values();
    socketInfoBundle.forEach(elem => {
        if(roomId != elem.roomId) return;
        let clientSocket = elem.clientSocket;
        if(clientSocket.id == socket.id) return;
        clientSocket.emit('message', {
            type: type,
            content: content,
        });
    });
}

function broadcast(socket, type, content){
    socket.emit('message', {
        type: type,
        content: content,
    });
}