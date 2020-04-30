let socket = null;
let partyNum = 0;

$(()=>{
    socket = io();
    
    const chatTyper =  $('#chat_typer');
    chatTyper.on('keydown', function(e){
        if(e.keyCode == 13 && !e.shiftKey){
            sendMessageToServer({
                type: 'chat',
                content:{
                    roomId: $('#room_id').val(),
                    sender:{
                        nickname: $('#my_nickname').val(),
                        tag: $('#my_tag').val(),
                        userId: $('#my_user_id').val(),
                    },
                    content: chatTyper.val(),
                }
            });
            if(e.preventDefault) e.preventDefault();
            chatTyper.focus().val('');
        }
    });


    socket.on('connect', function(){
        console.log("Server connected!");
        socket.on('message', receiveMessageFromServer);
        socket.emit('handshake', {
            userId: $('#my_user_id').val(),
            roomId: $('#room_id').val(),
            nickname: $('#my_nickname').val(),
            tag: $('#my_tag').val(),
        });
    });

    //adjust chatlist height
    let chatList = $('#chat_list');
    let chatTyperWrapper = $('#chat_typer_wrapper');
    console.log(chatList.position());
    console.log(chatTyperWrapper.position());
    let heightDiff = chatTyperWrapper.position().top - chatList.position().top;
    chatList.innerHeight(heightDiff-2);
});

function sendMessageToServer(data){
    if(socket == null)return;
    socket.emit('message', data);
}

function receiveMessageFromServer(data){
    console.log(data);
    const type = data.type;
    const content = data.content;

    let participantList = $('#participants_list');
    let chatList = $('#chat_list');

    switch(type){
        case 'first-touch-setting':
            let partyList = content.currentParticipantsList;
            partyNum = partyList.length;
            $('#participants_num').text(partyNum);
            partyList.forEach(elem => {
                participantList.append(`<div class="participant-info">
                    <span>${elem.nickname}</span>
                    <span class="nickname-tag">#${elem.tag}</span>
                    <input type="hidden" Name="participant_user_id" value="${elem.userId}">
                    </div>`);
            });
            break;
        case 'join':
            participantList.append(`<div class="participant-info">
                <span>${content.nickname}</span>
                <span class="nickname-tag">#${content.tag}</span>
                <input type="hidden" name="participant_user_id" value="${content.userId}">
                </div>`);
            $('#participants_num').text(++partyNum);
            break;
        case 'leave':
            participantDivs = participantList.children();
            console.log(participantDivs);
            for(let i=0;i<participantDivs.length;i++){
                let elem = $(participantDivs[i]);
                let curId = elem.find('input[name="participant_user_id"]').val();
                if(curId == content.leavingUserId){
                    elem.remove();
                    break;
                }
            }
            $('#participants_num').text(--partyNum);
            break;
        case 'chat-broadcast':
            let isMe = content.sender.userId == $('#my_user_id').val();
            let isOnEnd = chatList.scrollTop() == chatList.prop('scrollHeight') - chatList.prop('offsetHeight');
            if(isMe){
                chatList.append(`<div class="chat-box my-chat">
                        <div class="chatter-info">
                            <span class="chatter-tag">#${content.sender.tag}</span>
                            <span class="chat-nickname">${content.sender.nickname}</span>
                        </div>
                        <div class="chat-content-wrapper">
                            <pre class="chat-content">${content.content}</pre>
                        </div>
                    </div>`);
            }else{
                chatList.append(`<div class="chat-box others-chat">
                        <div class="chatter-info">
                            <span class="chat-nickname">${content.sender.nickname}</span>
                            <span class="chatter-tag">#${content.sender.tag}</span>
                        </div>
                        <div class="chat-content-wrapper">
                            <pre class="chat-content">${content.content}</pre>
                        </div>
                    </div>`);
            }
            // chat 추가
            if(isOnEnd){
                chatList.scrollTop(chatList.prop("scrollHeight"));
            }
            break;
    }  
}