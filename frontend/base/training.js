
BaseTraining = class BaseTraining{
    static refresh_table(){
        var $table          = $('#training-filetable')
        $table.find('tbody').html('');

        //refactor
        var processed_files = Object.keys(GLOBAL.files).filter( k => (GLOBAL.files[k].results!=undefined) )
        for(var f of processed_files)
            $('#training-filetable-row').tmpl({filename:f}).appendTo($table.find('tbody#training-selected-files'))
        $table.find('.checkbox').checkbox({onChange: _ => this.update_table_header()})
        this.update_table_header()
    }

    static async on_start_training(){
        var filenames = this.get_selected_files()
        console.log('Training on ', filenames)
        
        this.show_modal()     
        await this.upload_training_data(filenames)

        $(GLOBAL.event_source).on('training', m => this.on_training_progress(m))
        //FIXME: success/fail should not be determined by this request
        $.post('/training', {'filenames':filenames})
            .done( ok => {
                if(!$('#training-modal .ui.progress').progress('is complete'))
                    this.interrupted_modal()
            } )
            .fail( this.fail_modal )
            .always( _ => $(GLOBAL.event_source).off('training', this.on_training_progress) );
    }

    static on_cancel_training(){
        $.get('/stop_training')
            .fail(   _ => $('body').toast({message:'Stopping failed.', class:'error'}) )
            //.always( _ => this.hide_modal() )
        return false; //prevent automatic closing of the modal
    }

    static get_selected_files(){
        var $table          = $('#training-filetable')
        var is_selected     = $table.find('.checkbox').map( (i,c) => $(c).checkbox('is checked')).get()
        var filenames       = $table.find('[filename]').map( (i,x) => x.getAttribute('filename') ).get()
        filenames           = filenames.filter( (f,i) => is_selected[i] )
        return filenames
    }

    static update_table_header(){
        $('#training-filetable').find('thead th').text(`Selected ${this.get_selected_files().length} files for training`)
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
        $('#training-modal').modal({closable:true})
    }

    static interrupted_modal(){
        $('#training-modal .progress').progress('set error', 'Training interrupted');
        $('#training-modal').modal({closable:true})
    }

    static success_modal(){
        $('#training-modal .progress').progress('set success', 'Training finished');
        $('#training-modal #ok-training-button').show()
        $('#training-modal #cancel-training-button').hide()
    }

    static on_training_progress(message){
        var data = JSON.parse(message.originalEvent.data)
        $('#training-modal .progress').progress({percent:data.progress*100, autoSuccess:false})
        if(data.progress >= 1){
            this.success_modal()
            $('#training-new-modelname-field').show()   //TODO: should be shown also when interrupted
        }
    }

    static on_save_model(){
        var new_modelname = $('#training-new-modelname')[0].value
        console.log('Saving new model as:', new_modelname)
        $.get('/save_model', {newname: new_modelname})
            .done( _ => $('#training-new-modelname-field').hide() )
            .fail( _ => $('body').toast({message:'Saving failed.', class:'error', displayTime: 0, closeIcon: true}) )
    }

    static upload_training_data(filenames){
        //TODO: show progress
        var promises      = filenames.map( f => upload_file_to_flask(GLOBAL.files[f]) )
        //TODO: refactor
        var segmentations = filenames.map( f => GLOBAL.files[f].results.segmentation )
                                     .filter( s => s instanceof Blob )
        promises          = promises.concat( segmentations.map( f => upload_file_to_flask(f) ) )
        return Promise.all(promises).catch( this.fail_modal )
    }
}

