

class BaseFileInput {
    //called when user selects input file(s)
    static on_inputfiles_select(event){
        this.set_input_files(event.target.files);
        event.target.value = ""; //reset the input
    }
    
    //called when user selects an input folder
    static on_inputfolder_select(event){
        console.log(event)
        var files = [];
        for(var f of event.target.files)
            if(f.type.startsWith('image'))
                files.push(f);
        this.set_input_files(files);
        event.target.value = ""; //reset the input
    }

    static set_input_files(files){
        //TODO: send request to flask to clear cache folder
        GLOBAL.files = []
        for(let f of files){
            GLOBAL.files[f.name] = f
        }
        this.refresh_filetable(files);
    }

    //update the ui accordion table
    static refresh_filetable(files){
        var $filetable = $('#filetable');
        $filetable.find('tbody').html('');

        for(var f of Object.values(files)){
            var $trow = $("template#filetable-row-template").tmpl([{filename:f.name}])
            $trow.appendTo($filetable.find('tbody'));
            //get the y-coordinate of the row, as long as all rows are closed
            //would be unreliable later on
            $trow.first().attr('top', $trow.offset().top)
        }
        $filetable.find('thead th').text(`${files.length} File${(files.length==1)?'':'s'} Loaded`)
    }


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
        //but: race condition if dropping images and result zips at the same time
        if(imagefiles.length)
            this.set_input_files(imagefiles)
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
            //FIXME: refactor, ideally without upload_file_to_flask
            await upload_file_to_flask(file)
            const result = {segmentation: file.name}
            App.Detection.process_results(filename, result)
        }
    }
};

