
function deepcopy(x){
    return JSON.parse(JSON.stringify(x))
}


function upload_file_to_flask(file, url='file_upload', async=true){
    var formdata = new FormData();
    formdata.append('files', file);

    return $.post({
        url:         url,
        data:        formdata,
        processData: false,
        cache:       false,
        contentType: false,
        async:       async,
        enctype:     'multipart/form-data'
    })
}


function url_for_image(imagename, cachebuster=true){
    return `/images/${imagename}` + (cachebuster? `?_=${Date.now()}` : '')
}


//parses a string like "matrix(1,0,0,1,0,0)"  //TODO: use DOMMatrix() instead
function parse_css_matrix(maxtrix_str){
    var x      = Number(maxtrix_str.split(')')[0].split(', ')[4])
    var y      = Number(maxtrix_str.split(')')[0].split(', ')[5])
    var scale  = Number(maxtrix_str.split('(')[1].split(',')[0])
    return {x:x, y:y, scale:scale};
}
