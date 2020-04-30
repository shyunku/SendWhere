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