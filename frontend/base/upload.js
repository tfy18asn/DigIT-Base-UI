
//loading previously processed results or annotations
BaseUpload = class {
    static setup_drag_and_drop(){
        $('body').on('dragover', e => this.on_dragover(e.originalEvent))
        $('body').on('drop',     e => this.on_drop(e.originalEvent))
    }
    
    static on_dragover(event){
        event.preventDefault();
    }

    static on_drop(event){
        event.preventDefault();
        //TODO: show dimmer/message
        this.upload_list_of_files(event.dataTransfer.files)
    }

    static upload_list_of_files(files){
        var imagefiles = []
        for(var f of Object.values(files)){
            if(["application/zip", "application/x-zip-compressed"].indexOf(f.type)!=-1)
                this.upload_from_zipfile(f);
            else if(f.name.endsWith('.segmentation.png'))
                this.upload_result(f)
            else if(["image/jpeg", "image/png", "image/tiff"].indexOf(f.type)!=-1)
                imagefiles.push(f)
        }

        //FIXME: race condition if `files` contains zipfiles which contain images
        //(or maybe not: they contain no mimetype)
        if(imagefiles.length)
            App.FileInput.set_input_files(imagefiles)
    }

    static upload_from_zipfile(zipfile){
        return JSZip.loadAsync(zipfile).then( 
            (zip) => this.upload_list_of_files(zip.files)
        )
    }

    static async upload_result(file){
        const filename  = file.name.replace(/.segmentation.png/g, '')
        const inputfile = GLOBAL.files[filename]
        if(inputfile != undefined){
            const blob   = await(file.async? file.async('blob') : file)
            file         = new File([blob], file.name, {type:'image/png'})
            await upload_file_to_flask(file)
            const result = {segmentation: file.name}
            App.Detection.process_results(filename, result)
        }
    }
}

