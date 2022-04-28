

BaseSettings = class{
    static load_settings(){
        var _this = this;
        $.get('/settings').done(function(data){
            var settings = data.settings
            var models   = data.available_models
            console.log('Loaded settings:  ',settings)
            console.log('Available models: ',models)
            GLOBAL.settings   = settings
            _this.update_settings_modal(models)
        })
    }

    static update_settings_modal(models){
        const settings = GLOBAL.settings;

        this.update_model_selection_dropdown(
            models.detection, settings.active_models.detection, $("#settings-active-model")
        )
    }

    
    static update_model_selection_dropdown(models, active_model, $dropdown){
        var dropdown_items = models.map(x => {
            return {name:x, value:x, selected:(x == active_model)};
        })
        if(active_model == '')
            dropwdown_items.push({name:'[UNSAVED MODEL]', value:'', selected:true})
        $dropdown.dropdown({values: dropdown_items, showOnFocus:false })
    }

    static apply_settings_from_modal(){
        GLOBAL.settings.active_models.detection = $("#settings-active-model").dropdown('get value');
    }

    static on_save_settings(_){
        this.apply_settings_from_modal()
        var settingsdata = deepcopy(GLOBAL.settings);
        var postdata     = JSON.stringify(settingsdata);
        $('#settings-ok-button').addClass('loading');

        $.post(`/settings`, postdata,).done( x => {
            $('#settings-dialog').modal('hide');
            console.log('Settings saved successfully:',x)
        }).fail( x => {
            console.error('Saving settings failed', x)
            $('body').toast({message:'Saving failed', class:'error'})
        }).always( _ => {
            $('#settings-ok-button').removeClass('loading');
        } );

        //do not close the dialog, doing this manually in the .post() callback
        return false;
    }

    static on_settings(){
        this.load_settings();
        $('#settings-dialog').modal({onApprove: _ => this.on_save_settings()}).modal('show');
    }

}


