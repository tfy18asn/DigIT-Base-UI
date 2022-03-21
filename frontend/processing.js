

function on_process_image(event){
    var filename = $(event.target).closest('[filename]').attr('filename')
    process_image(filename)
}


function process_image(filename){
    console.log(`Processing image file ${filename}`)
    show_dimmer(filename)

    var file    = GLOBAL.files[filename].file;
    let promise = upload_file_to_flask(file)
    promise.fail( response => {
        console.log('File upload failed.', response.status)
        $('body').toast({message:'File upload failed.', class:'error'})
    })

    promise = promise.then( function(){
        return $.get(`process_image/${filename}`).fail( response => {
            console.log('Processing failed.', response.status)
            $('body').toast({message:'Processing failed.', class:'error'})
        })
    })
    promise.done(function(){
        console.log('Processing successful.')
    })


    promise.always( _ => {
        hide_dimmer(filename)
        //TODO: delete_image_from_flask(filename)
    })
    return promise;
}



function show_dimmer(filename, message='Processing...'){
    $(`[filename="${filename}"] .input-image-container`).dimmer({                               //FIXME: should be div above .input-image-container
        displayLoader:   true,
        loaderVariation: 'slow orange medium elastic',
        loaderText:      message,
    }).dimmer('show');

    //XXX: function should be called show_dimmer_and_disable_menu()
    $(`[filename="${filename}"] .icon.menu .item`).addClass('disabled')
    //TODO: also disable settings, 'Process All' button, etc
}

function hide_dimmer(filename){
    $(`[filename="${filename}"] .input-image-container`).dimmer('hide')                        //FIXME: should be div above .input-image-container
    $(`[filename="${filename}"] .icon.menu .item`).removeClass('disabled')
}

function update_dimmer(filename, message){
    console.log('TODO: update_dimmer() not implemented')
}

