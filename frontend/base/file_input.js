

BaseFileInput = class {
    //called when user selects input file(s)
    static on_inputfiles_select(event){
        //this.set_input_files(event.target.files);
        this.load_list_of_files(event.target.files)  //not using set_input_files for tests
        event.target.value = ""; //reset the input
    }
    
    //called when user selects an input folder
    static on_inputfolder_select(event){
        //no using load_list_of_files() to avoid ambiguity
        var files = [];
        for(var f of event.target.files)
            if(f.type.startsWith('image'))
                files.push(f);
        this.set_input_files(files);
        event.target.value = ""; //reset the input
    }

    static on_annotations_select(event){
        this.load_result_files(event.target.files)
        event.target.value = ""; //reset the input
    }

    static set_input_files(files){
        //TODO: send request to flask to clear cache folder
        GLOBAL.files = []
        for(let f of files)
            GLOBAL.files[f.name] = f
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
        console.log('on_drop:', event)
        this.load_list_of_files(event.dataTransfer.files)
    }

    static async load_list_of_files(files){
        var files = Array(...files)
        var inputfiles = files.filter( f => ["image/jpeg", "image/tiff"].indexOf(f.type)!=-1); //no png
        if(inputfiles.length)
            this.set_input_files(inputfiles)
        
        await this.load_result_files()
    }

    static async load_result_files(files){
        var result_files = await this.collect_result_files(files)
        console.log('result_files.length:', Object.keys(result_files).length)
        if(Object.keys(result_files).length==0)
            return;
        
        //show progress
        var $modal = $('#loading-files-modal')
        $modal.modal({closable: false, inverted:true,}).modal('show');
        $modal.find('.progress').progress({
            total: Object.keys(result_files).length,
            value: 0, showActivity:false,
        })
        try{
            for(var filename of Object.keys(result_files)){
                await this.load_result(filename, result_files[filename])
                $modal.find('.progress').progress('increment')
            }
        } catch(error) {
            console.log(error);
            $('body').toast({message:'Failed loading results.', class:'error', displayTime: 0, closeIcon: true})
        } finally {
            $modal.modal('hide');
        }
    }

    static async collect_result_files(files){
        var collected_files = {}
        for(var f of Object.values(files)){
            if(["application/zip", "application/x-zip-compressed"].indexOf(f.type)!=-1)
                Object.assign(collected_files, (await this.collect_results_from_zipfile(f)));
            else{
                var basename = file_basename(f.name)
                for(var filename of Object.keys(GLOBAL.files)){
                    var no_ex_filename = remove_file_extension(filename)
                    var candidate_names = [
                        filename+'.png',       filename+'.segmentation.png', 
                        no_ex_filename+'.png', no_ex_filename+'.segmentation.png'
                    ]
                    if( candidate_names.indexOf(basename) != -1 )
                        collected_files[filename] = f
                }
            }
        }
        return collected_files;
    }

    static async collect_results_from_zipfile(zipfile){
        var zipped_files = (await JSZip.loadAsync(zipfile)).files
        return await this.collect_result_files(zipped_files)
    }

    static async load_result(filename, file){
        const inputfile = GLOBAL.files[filename]
        if(inputfile != undefined){
            const blob   = await(file.async? file.async('blob') : file)
            file         = new File([blob], file.name, {type:'image/png'})
            const result = {segmentation: file}
            App.Detection.set_results(filename, result)
        }
    }
};

