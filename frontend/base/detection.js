
BaseDetection = class {

    static on_process_image(event){
        var filename = $(event.target).closest('[filename]').attr('filename')
        this.process_image(filename)
    }


    static process_image(filename){
        //TODO: states: unprocessed, processing, processed, annotation loaded
        console.log(`Processing image file ${filename}`)
        this.show_dimmer(filename)
        
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
            //$('body').toast({message:'File upload failed.', class:'error'})
            this.update_dimmer(filename, true)
        })

        promise = promise.then( function(){
            return $.get(`process_image/${filename}`).fail( response => {
                console.log('Processing failed.', response.status)
                //$('body').toast({message:'Processing failed.', class:'error'})
                this.update_dimmer(filename, true)
            })
        })
        promise.done(results => this.set_results(filename, results))


        promise.always( _ => {
            //TODO: delete_image_from_flask(filename)
            $(GLOBAL.event_source).off('message', on_message)
        })
        return promise;
    }

    static async set_results(filename, results){
        console.log(`Setting ${filename} result to: `, results)
        this.hide_dimmer(filename)

        if(is_string(results.segmentation))
            results.segmentation = await fetch_as_file(url_for_image(results.segmentation))
        
        var $root      = $(`[filename="${filename}"]`)
        
        //TODO: result should be loaded only if (1) it's a url or (2) the accordion item is open
        //      otherwise load when accordion is opened
        var $image     = $root.find('img.result-image')
        set_image_src($image, results.segmentation)
        $image.css('filter','contrast(1)')

        var $result_overlay = $root.find(`img.overlay`)  //FIXME: this affects the root tracking tab as well!
        set_image_src($result_overlay, results.segmentation)

        GLOBAL.files[filename].results = results;  //TODO: call it detection_results
        $root.find('a.download').removeClass('disabled')
        
        //indicate in the file table that this file is processed
        $(`.table-row[filename="${filename}"] label`).css('font-weight', 'bold')
    }

    static show_dimmer(filename, message='Processing...'){
        this.update_dimmer(filename, false)
        $(`[filename="${filename}"] .dimmer`).dimmer({closable:false}).dimmer('show')

        //XXX: function should be called show_dimmer_and_disable_menu()
        $(`[filename="${filename}"] .icon.menu .item`).addClass('disabled')
        //TODO: also disable settings, 'Process All' button, etc
    }

    static hide_dimmer(filename){
        $(`[filename="${filename}"] .dimmer`).dimmer('hide')
        $(`[filename="${filename}"] .icon.menu .item`).removeClass('disabled')
    }

    static update_dimmer(filename, failed){
        var $dimmer = $(`[filename="${filename}"] .dimmer`)
        if(failed){
            $dimmer.find('.content.processing').hide()
            $dimmer.find('.content.failed').show()
            $dimmer.dimmer({closable: true})
        } else {
            $dimmer.find('.content.processing').show()
            $dimmer.find('.content.failed').hide()
            $dimmer.dimmer({closable: false})
        }
    }

}