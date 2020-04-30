exports.delete_user_in_room = function(roomBundle, roomId, userId){
    for(let i=0;i<roomBundle.length;i++){
        let room = roomBundle[i];
        if(room.roomId == roomId){
            const index = room.participants.findIndex(function(item){
                return item.userId == userId;
            });
            if(index > -1) room.participants.splice(index, 1);
            break;
        }
    }
}

exports.is_enterable_room = function(roomBundle, roomId){
    for(let i=0;i<roomBundle.length;i++){
        if(roomBundle[i].roomId == roomId){
            return true;
        }
    }
    return false;
}

exports.get_room_by_id = function(roomBundle, roomId){
    for(let i=0;i<roomBundle.length;i++){
        if(roomBundle[i].roomId == roomId){
            return roomBundle[i];
        }
    }
    return null;
}

exports.generate_cookie = function(){
    return generate_random_str(64);
}

exports.generate_room_id = function(){
    return generate_random_alphabet(4) + generate_random_numStr(2);
}

exports.generate_user_id = function(){
    return generate_random_str(16);
}

exports.generate_nickname_tag = function(){
    return generate_random_numStr(4);
}

exports.get_user_id_by_cookie = function(userCookieBundle, cookie){
    for(let i=0;i<userCookieBundle.length;i++){
        let userCookieInfo = userCookieBundle[i];
        if(userCookieInfo.cookie == cookie){
            return userCookieInfo.userId;
        }
    }
    user_id = generate_random_str(16);
    userCookieBundle.push({
        userId: user_id,
        cookie: cookie,
    });
    return user_id;
}

exports.get_ipv4_from_ipstr = function(ip){
    let sp = ip.split(':');
    return sp[sp.length-1];
}

exports.get_current_time_str = function(){
    const now = new Date();
    return now.toLocaleDateString() + " " + now.toLocaleTimeString();
}

function generate_random_str(len){
    let chs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let chslen = chs.length;
    let str = "";
    for(let i=0;i<len;i++)
        str += chs[Math.floor(Math.random() * chslen)];
    return str;
}

function generate_random_numStr(len){
    let chs = '0123456789';
    let chslen = chs.length;
    let str = "";
    for(let i=0;i<len;i++)
        str += chs[Math.floor(Math.random() * chslen)];
    return str;
}

function generate_random_alphabet(len){
    let chs = 'abcdefghijklmnopqrstuvwxyz';
    let chslen = chs.length;
    let str = "";
    for(let i=0;i<len;i++)
        str += chs[Math.floor(Math.random() * chslen)];
    return str;
}