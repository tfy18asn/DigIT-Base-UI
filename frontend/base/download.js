
BaseDownload = class {
    static async on_single_item_download_click(event){
        var $root     = $(event.target).closest('[filename]')
        var filename  = $root.attr('filename')

        var zipdata  = this.zipdata_for_file(filename);
        if(zipdata == undefined){
            $('body').toast({message:'Result download failed.', class:'error'})
            return
        }
        download_zip(`${filename}.results.zip`, zipdata)
    }

    static on_download_all(event){
        var filenames = Object.keys(GLOBAL.files)
        var zipdata   = this.zipdata_for_files(filenames)
        if(Object.keys(zipdata).length==0)
            return
        download_zip('results.zip', zipdata)
    }

    //to be overwritten downstream
    static zipdata_for_file(filename){
        var f            = GLOBAL.files[filename];
        var zipdata      = {};
        var segmentation = f.results.segmentation
        zipdata[`${f.results.segmentation.name}`] = segmentation  //TODO: folders
        return zipdata;
    }

    static zipdata_for_files(filenames){
        var zipdata   = {}
        for(var filename of filenames){
            var fzipdata = this.zipdata_for_file(filename)
            if(fzipdata == undefined)
                continue;
            
            for(var k of Object.keys(fzipdata))
                zipdata[`${filename}/${k}`] = fzipdata[k];
        }
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
