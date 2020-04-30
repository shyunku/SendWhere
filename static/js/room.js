let socket = null;
let partyNum = 0;
let chatNum = 0;

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

    // adjust chatlist height
    let chatList = $('#chat_list');
    let chatTyperWrapper = $('#chat_typer_wrapper');
    let heightDiff = chatTyperWrapper.position().top - chatList.position().top;
    chatList.innerHeight(heightDiff-2);

    let uploadArea = $('#upload_area');
    let uploadParent = uploadArea.parent();
    let diff = uploadParent.position().top + uploadParent.outerHeight(true) - uploadArea.position().top;
    uploadArea.height(diff-2);

    let downloadArea = $('#download_area');
    diff = window.innerHeight - downloadArea.position().top;
    downloadArea.height(diff-3);

    let roomContent = $('#room_content');
    diff = window.innerHeight - roomContent.position().top;
    roomContent.css({'max-height': (diff-3)+"px"});

    // file drag & drop
    uploadArea.on('dragover', function(e){
        e.preventDefault();
        $(this).addClass('drag-overred');
    });

    uploadArea.on('dragleave', function(e){
        $(this).removeClass('drag-overred');
    });

    uploadArea.on('drop', function(e){
        $(this).removeClass('drag-overred');
        if(e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files.length){
            e.preventDefault();
            e.stopPropagation();

            const uploadBody = $('#upload_body');
            let files = e.originalEvent.dataTransfer.files;

            console.log(files);
            
            for(let i=0;i<files.length;i++){
                let file = files[i];
                let formData = new FormData();
                
                if(file.upload == 'disable'){
                    console.log('Cannot upload '+file.name);
                    break;
                }
                formData.append('roomId', $('#room_id').val());
                formData.append('upload-files', file, file.name);
                let fileID = generate_random_str(8);

                // display on upload tab
                uploadBody.append(`
                    <tr id="file_progress_info_${fileID}">
                        <td>${file.name}</td>
                        <td>${file.type}</td>
                        <td>${refineFileSizeStr(file.size)}</td>
                        <td id="file_status_${fileID}">Pending</td>
                        <td>-</td>
                        <td id="file_progress_${fileID}">-</td>
                    </tr>`);

                // ajax upload
                $.ajax({
                    url: '/upload',
                    data: formData,
                    type: 'POST',
                    enctype: 'multipart/form-data',
                    contentType: false,
                    processData: false,
                    xhr: function(){
                        let xhr = $.ajaxSettings.xhr();
                        $(`#file_status_${fileID}`).text('Uploading');
                        xhr.upload.onprogress = function(e){
                            let progress = 100*e.loaded/e.total;
                            $(`#file_progress_${fileID}`).text(
                                numberWithCommas(e.loaded)+"/"+numberWithCommas(e.total) +
                                "("+progress.toFixed(3)+"%)");
                            console.log(e.loaded+"/"+e.total);
                        };
                        return xhr;
                    },
                    success: function(res){
                        $(`#file_status_${fileID}`).text('Done');
                        $(`#file_progress_${fileID}`).text('100%');
                        console.log(res);
                        console.log('upload complete: '+file.name);
                    },
                    error: function(e){
                        console.error(e.statusText);
                    }
                });
            }
        }
    });
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
            $('#chats_num').text(++chatNum);
            break;
    }  
}