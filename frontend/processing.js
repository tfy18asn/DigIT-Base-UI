

function on_process_image(event){
    var filename = $(event.target).closest('[filename]').attr('filename')
    process_image(filename)
}


function process_image(filename){
    console.log(`Processing image file ${filename}`)
    show_dimmer(filename)
    
    //Called on a server-side event from the server notifying about processing progress
    function on_message(event){
        var data = JSON.parse(event.originalEvent.data);
        if(data.image!=filename)
            return;

        console.log(event)
        //TODO: update dimmer
    }
    $(GLOBAL.event_source).on('message', on_message)

    var file    = GLOBAL.files[filename];
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
    promise.done(results => process_results(filename, results))


    promise.always( _ => {
        hide_dimmer(filename)
        //TODO: delete_image_from_flask(filename)
        $(GLOBAL.event_source).off('message', on_message)
    })
    return promise;
}


function process_results(filename, results){
    console.log(`Processing ${filename} successful.`, results)

    var $container = $(`[filename="${filename}"] .result.view-box`)
    var $image     = $container.find('img.result-image')
    $image.attr('src', url_for_image(results.segmentation)).css('filter','contrast(1)')
    //$container.show()

    var $result_overlay = $(`[filename="${filename}"] .result-image-overlay`)
    $result_overlay.attr('src', url_for_image(results.segmentation))
    show_results_as_overlay(filename);
}




function show_dimmer(filename, message='Processing...'){
    $(`[filename="${filename}"] .view-box`).dimmer({
        displayLoader:   true,
        loaderVariation: 'slow orange medium elastic',
        loaderText:      message,
    }).dimmer('show');

    //XXX: function should be called show_dimmer_and_disable_menu()
    $(`[filename="${filename}"] .icon.menu .item`).addClass('disabled')
    //TODO: also disable settings, 'Process All' button, etc
}

function hide_dimmer(filename){
    $(`[filename="${filename}"] .view-box`).dimmer('hide')
    $(`[filename="${filename}"] .icon.menu .item`).removeClass('disabled')
}

function update_dimmer(filename, message){
    console.log('TODO: update_dimmer() not implemented')
}

