


class BaseDownload{
    static on_single_item_download_click(event){
        console.error('Download not implemented')
    }
}

Download = BaseDownload;



//downloads an element from the uri (to the user hard drive)
function downloadURI(filename, uri) {
    var element = document.createElement('a');
    element.setAttribute('href', uri);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
  
function download_text(filename, text){
    return downloadURI(filename, 'data:text/plain;charset=utf-8,'+encodeURIComponent(text))
}
  
function download_blob(filename, blob){
    return downloadURI(filename, URL.createObjectURL(blob));
}

