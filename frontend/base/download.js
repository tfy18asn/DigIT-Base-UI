


class BaseDownload{
    static async on_single_item_download_click(event){
        var $root     = $(event.target).closest('[filename]')
        var filename  = $root.attr('filename')

        if(!GLOBAL.files[filename].results){
            //should not happen because download icon is disabled
            $('body').toast({message:'Result download failed.', class:'error'})
            return
        }
        var zipdata  = this.zipdata_for_file(filename);

        var zip = new JSZip();
        for(var fname in zipdata)
            zip.file(fname, await zipdata[fname], {binary:true});
        
        zip.generateAsync({type:"blob"}).then( blob => {
            download_blob( `${filename}.results.zip`, blob  );
        } );
    }

    static zipdata_for_file(filename){
        var f            = GLOBAL.files[filename];
        var zipdata      = {};
        var segmentation = fetch_as_blob(url_for_image(f.results.segmentation))
        zipdata[`${f.results.segmentation}`] = segmentation
        return zipdata;
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

//fetch request that returns a blob
function fetch_as_blob(uri){
    return fetch(uri).then(r => r.ok? r.blob() : undefined);
}
