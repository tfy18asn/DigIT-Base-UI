

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

