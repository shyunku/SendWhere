$(()=>{
    const createRoomBtn = $('#create_room_btn');
    const joinRoomBtn = $('#join_room_btn');

    createRoomBtn.on('click', function(){
        $.ajax({
            url: '/generate-room-id',
            type: 'POST',
            data: {
                cookie: document.cookie,
            },
            success: function(res){
                console.log(res);
                if(res == "0"){
                    alert('User doesn\'t exist!');
                    return;
                }
                let askNickname = prompt("Please enter your nickname", "");
                if(askNickname.length < 3){
                    alert('You must use at least 3 characters as nickname!');
                }else{
                    location.href = "/room?id="+res+"&nickname="+askNickname;
                }
            }
        });
    });

    joinRoomBtn.on('click', function(){
        let askRoomId = prompt("Please enter room ID", "");
        $.ajax({
            url: '/touch-room',
            type: 'POST',
            data: {
                roomId: askRoomId,
            },
            success: function(res){
                if(res == "NO"){
                    alert('No matches for the room.');
                }else{
                    let askNickname = prompt("Please enter your nickname", "");
                    if(askNickname.length < 3){
                        alert('You must use at least 3 characters as nickname!');
                    }else{
                        location.href = "/room?id="+askRoomId+"&nickname="+askNickname;
                    }
                }
            }
        });
    });
});