

BaseTraining = class BaseTraining{
    static refresh_table(){
        var processed_files = Object.keys(GLOBAL.files).filter( k => (GLOBAL.files[k].results!=undefined) )
        var $table          = $('#training-filetable')
        $table.find('tbody').html('');

        for(var f of processed_files)
            $('#training-filetable-row').tmpl({filename:f}).appendTo($table.find('tbody'))
    }

    static async on_start_training(){
        var filenames = this.#get_selected_files()
        console.log('Training on ', filenames)
        
        this.show_modal()     
        await this.upload_training_data(filenames)

        $(GLOBAL.event_source).on('training', this.on_training_progress)
        $.post('/training', {'filenames':filenames})
            .done( this.success_modal )
            .fail( this.fail_modal )
            .always( _ => $(GLOBAL.event_source).off('training', this.on_training_progress) );
    }

    static on_cancel_training(){
        this.hide_modal()
        //return false;
    }

    static #get_selected_files(){
        var $table          = $('#training-filetable')
        var is_selected     = $table.find('.checkbox').checkbox('is checked')
        var filenames       = $table.find('[filename]').map( (i,x) => x.getAttribute('filename') ).get()
        filenames           = filenames.filter( (f,i) => is_selected[i] )
        return filenames
    }

    static show_modal(){
        $('#training-modal .progress')
            .progress('remove error')
            .progress('remove success')
            .progress('set label', 'Training in progress...')
            .progress('reset');
        $('#training-modal #ok-training-button').hide()
        $('#training-modal #cancel-training-button').show()
        
        $('#training-modal').modal({
            closable: false, inverted:true, onDeny: x => this.on_cancel_training(),
        }).modal('show');
    }

    static hide_modal(){
        $('#training-modal').modal('hide');
    }

    static fail_modal(){
        $('#training-modal .progress').progress('set error', 'Training failed');
    }

    static success_modal(){
        $('#training-modal .progress').progress('set success', 'Training finished');
        $('#training-modal #ok-training-button').show()
        $('#training-modal #cancel-training-button').hide()
    }

    static on_training_progress(message){
        var data = JSON.parse(message.originalEvent.data)
        $('#training-modal .progress').progress({percent:data.progress*100})
    }

    static upload_training_data(filenames){
        var promises = filenames.map( f => upload_file_to_flask(GLOBAL.files[f]) )
        return Promise.all(promises).catch( this.fail_modal )
    }
}

