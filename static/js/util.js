function refineFileSizeStr(sizeStr){
    let size = parseFloat(sizeStr);
    if(size < 1000){
        return parseInt(size) + "B";
    }
    if(size < 1000000){
        size /= 1000;
        return size.toFixed(1) + "KB";
    }
    if(size < 1000000000){
        size /= 1000000;
        return size.toFixed(1) + "MB";
    }
    size /= 1000000000;
    return size.toFixed(1) + "GB";
}

function generate_random_str(len){
    let chs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let chslen = chs.length;
    let str = "";
    for(let i=0;i<len;i++)
        str += chs[Math.floor(Math.random() * chslen)];
    return str;
}

function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function extractExtension(filename) {
    let seg = filename.split('.');
    if(seg.length == 1)return "-";
    return seg[seg.length-1];
}

function getRefinedRemainTime(remain){
    let h = parseInt(remain / 3600);
    let m = parseInt((remain % 3600)/60);
    let s = remain %60;
    if(h!=0){
        return h+":"+zeroPad(m,2)+":"+zeroPad(s,2);
    }else{
        return m+":"+zeroPad(s,2);
    }
}

function zeroPad(str, len){
    str = String(str);
    for(let i=0;i<len-str.length;i++)
        str = "0" + str;
    return str;
}