

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
        this.regenerate_filetable(files);
    }

    //updates the ui accordion table
    static regenerate_filetable(files){
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
};

