


function load_settings(){
    console.log('TODO: load settings')
}


function collect_settings_data(){
    console.warn('collect_settings_data() not implemented')
    return {}
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



