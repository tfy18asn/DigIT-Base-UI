


function load_settings(){
    $.get('/settings').done(function(data){
        var settings = data.settings
        var models   = data.available_models
        console.log('Loaded settings:  ',settings)
        console.log('Available models: ',models)
        GLOBAL.settings   = settings
        update_settings_modal(models)
    })
}


function update_settings_modal(models){
    const settings = GLOBAL.settings;

    var models_list = []
    for(var modelname of models)
        models_list.push({name:modelname, value:modelname, selected:(modelname==settings.active_model)})
    //TODO: if(settings.active_model=='')
    //    models_list.push({name:'[UNSAVED MODEL]', value:'', selected:true})
    $("#settings-active-model").dropdown({values: models_list, showOnFocus:false })
}


function apply_settings_from_modal(){
    GLOBAL.settings.active_model = $("#settings-active-model").dropdown('get value');
}


function on_save_settings(_){
    apply_settings_from_modal()
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



function on_settings(){
    load_settings();
    $('#settings-dialog').modal({onApprove: on_save_settings}).modal('show');
}



