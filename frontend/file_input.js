

//called when user selects input file(s)
function on_inputfiles_select(event){
    set_input_files(event.target.files);
    event.target.value = ""; //reset the input
}
  
//called when user selects an input folder
function on_inputfolder_select(event){
    console.log(event)
    var files = [];
    for(var f of event.target.files)
        if(f.type.startsWith('image'))
            files.push(f);
    set_input_files(files);
    event.target.value = ""; //reset the input
}

function set_input_files(files){
    GLOBAL.files = []
    for(let f of files){
        GLOBAL.files[f.name] = f
    }
    regenerate_filetable(files);
    $('#filetable thead th').text(`${files.length} File${(files.length==1)?'':'s'} Loaded`)
}


//updates the ui accordion table
function regenerate_filetable(files){
    var $filetable = $('#filetable');
    $filetable.find('tbody').html('');

    for(var f of Object.values(files)){
        var $trow = $("template#filetable-row-template").tmpl([{filename:f.name}])
        $trow.appendTo($filetable.find('tbody'));
        //get the y-coordinate of the row, as long as all rows are closed
        //would be unreliable later unreliable
        $trow.first().attr('top', $trow.offset().top)
    }
}
