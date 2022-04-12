
BaseDownload = class {
    static async on_single_item_download_click(event){
        var $root     = $(event.target).closest('[filename]')
        var filename  = $root.attr('filename')

        if(!GLOBAL.files[filename].results){
            //should not happen because download icon is disabled
            $('body').toast({message:'Result download failed.', class:'error'})
            return
        }
        var zipdata  = this.zipdata_for_file(filename);
        download_zip(`${filename}.results.zip`, zipdata)
    }

    static on_download_all(event){
        var zipdata   = {}
        var filenames = Object.keys(GLOBAL.files)
        for(var filename of filenames){
            if(!GLOBAL.files[filename].results)
                continue;
            
            Object.assign(zipdata, this.zipdata_for_file(filename, filename+'/'))
        }
        download_zip('results.zip', zipdata)
    }

    static zipdata_for_file(filename){
        var f            = GLOBAL.files[filename];
        var zipdata      = {};
        var segmentation = f.results.segmentation
        zipdata[`${f.results.segmentation.name}`] = segmentation
        return zipdata;
    }
}


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

async function download_zip(filename, zipdata){
    var zip = new JSZip();
    for(var fname in zipdata)
        zip.file(fname, await zipdata[fname], {binary:true});
    
    zip.generateAsync({type:"blob"}).then( blob => {
        download_blob(filename, blob  );
    } );
}
