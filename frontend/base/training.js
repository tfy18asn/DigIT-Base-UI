
BaseTraining = class BaseTraining{
    static refresh_table(){
        var $table          = $('#training-filetable')
        $table.find('tbody').html('');

        //refactor
        if($('tbody#training-selected-files').length>0){    
            var processed_files = Object.keys(GLOBAL.files).filter( k => (GLOBAL.files[k].results!=undefined) )
            for(var f of processed_files)
                $('#training-filetable-row').tmpl({filename:f}).appendTo($table.find('tbody#training-selected-files'))
            $table.find('.checkbox').checkbox({onChange: _ => this.update_table_header()})
        }
        
        this.update_table_header()
        this.update_model_info()
    }

    static async on_start_training(){
        var filenames = this.get_selected_files()
        console.log('Training on ', filenames)
        
        const progress_cb = (m => this.on_training_progress(m))
        try {
            this.show_modal()
            await this.upload_training_data(filenames)

            $(GLOBAL.event_source).on('training', progress_cb)
            //FIXME: success/fail should not be determined by this request
            await $.post('/training', {filenames:filenames, options:this.get_training_options()})
            if(!$('#training-modal .ui.progress').progress('is complete'))
                this.interrupted_modal()
            
            GLOBAL.App.Settings.load_settings()
        } catch (e) {
            console.error(e)
            this.fail_modal()
        } finally {
            $(GLOBAL.event_source).off('training', progress_cb)
        }
    }

    static get_training_options(){
        return undefined;
    }

    static on_cancel_training(){
        $.get('/stop_training')
            .fail(   _ => $('body').toast({message:'Stopping failed.', class:'error'}) )
            //.always( _ => this.hide_modal() )
        $('#training-modal #cancel-training-button').addClass('disabled')
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

    static update_model_info(model_type='detection'){
        let model_name    = GLOBAL.settings.active_models[model_type]
        const unsaved     = (model_name=='')
        if(unsaved)
            model_name    = '[UNSAVED MODEL]';
        $('#training-new-modelname-field').toggle(unsaved)        //TODO: should be shown also when interrupted
        $('#training-model-info-label').text(model_name)
        $('#training-model-info-message').removeClass('hidden')
    }

    static show_modal(){
        $('#training-modal .progress')
            .progress('remove error')
            .progress('remove success')
            .progress('set label', 'Training in progress...')
            .progress('reset');
        $('#training-modal #ok-training-button').hide()
        $('#training-modal #cancel-training-button').removeClass('disabled').show()
        
        $('#training-modal').modal({
            closable: false, inverted:true, onDeny: x => this.on_cancel_training(),
        }).modal('show');
    }

    static hide_modal(){
        $('#training-modal').modal('hide');
    }

    static fail_modal(){
        $('#training-modal .progress').progress('set error', 'Training failed');
        $('#training-modal #cancel-training-button').removeClass('disabled')
        $('#training-modal').modal({closable:true})
    }

    static interrupted_modal(){
        $('#training-modal .progress').progress('set error', 'Training interrupted');
        $('#training-modal #cancel-training-button').removeClass('disabled')
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
        $('#training-modal .label').text(data.description)
        if(data.progress >= 1){
            this.success_modal()
            //this.update_model_info()
        }
    }

    static on_save_model(){
        const new_modelname = $('#training-new-modelname')[0].value
        console.log('Saving new model as:', new_modelname)
        $.get('/save_model', {newname: new_modelname, options:this.get_training_options()})
            .done( _ => $('#training-new-modelname-field').hide() )
            .fail( _ => $('body').toast({message:'Saving failed.', class:'error', displayTime: 0, closeIcon: true}) )
        $('#training-new-modelname')[0].value = ''
    }

    static upload_training_data(filenames){
        //TODO: show progress
        var promises      = filenames.map( f => upload_file_to_flask(GLOBAL.files[f]) )
        //TODO: refactor
        //TODO: standardize file name
        var segmentations = filenames.map(    f => GLOBAL.files[f].results.segmentation )
                                     .filter( s => s instanceof Blob )
        promises          = promises.concat( segmentations.map( f => upload_file_to_flask(f) ) )
        return Promise.all(promises).catch( this.fail_modal )  //FIXME: dont catch, handle in calling function
    }
}

window.addEventListener(BaseSettings.SETTINGS_CHANGED, () => GLOBAL.App.Training.refresh_table() )
