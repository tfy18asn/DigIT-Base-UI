

//called when user selects input file(s)
function on_inputfiles_select(input){
    set_input_files(input.target.files);
    input.value = ""; //reset the input
}
  
//called when user selects an input folder
function on_inputfolder_select(input){
    var files = [];
    for(var f of input.files)
        if(f.type.startsWith('image'))
            files.push(f);
    set_input_files(files);
    input.value = ""; //reset the input
}

function set_input_files(files){
    for(let f of files){
        console.log(f.name);
    }
    $('#filetable thead th').text(`${files.length} File${(files.length==1)?'':'s'} Loaded`)
}
