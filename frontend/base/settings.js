

class BaseSettings{
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

        var models_list = []
        for(var modelname of models)
            models_list.push({name:modelname, value:modelname, selected:(modelname==settings.active_model)})
        if(settings.active_model=='')
            models_list.push({name:'[UNSAVED MODEL]', value:'', selected:true})
        $("#settings-active-model").dropdown({values: models_list, showOnFocus:false })
    }

    static apply_settings_from_modal(){
        GLOBAL.settings.active_model = $("#settings-active-model").dropdown('get value');
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


