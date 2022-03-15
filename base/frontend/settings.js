


function load_settings(){
    console.log('TODO: load settings')
    $.get('/settings').done(function(settings){
        console.log('Loaded settings: ',settings)
        GLOBAL.settings.active_model   = settings.active_model

        var models_list = []
        for(var modelname of settings.models)
            models_list.push({name:modelname, value:modelname, selected:(modelname==settings.active_model)})
        //TODO: if(settings.active_model=='')
        //    models_list.push({name:'[UNSAVED MODEL]', value:'', selected:true})
        $("#settings-active-model").dropdown({values: models_list, showOnFocus:false })
    })
}


function collect_settings_data(){
    GLOBAL.settings.active_model = $("#settings-active-model").dropdown('get value');
    return {
        active_model : GLOBAL.settings.active_model, 
    }
}


function save_settings(_){
    var settingsdata = collect_settings_data()
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
    $('#settings-dialog').modal({onApprove: save_settings}).modal('show');
}



