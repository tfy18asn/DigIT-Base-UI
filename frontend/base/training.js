

BaseTraining = class BaseTraining{
    static refresh_table(){
        var processed_files = Object.keys(GLOBAL.files).filter( k => (GLOBAL.files[k].results!=undefined) )
        var $table          = $('#training-filetable')
        $table.find('tbody').html('');

        for(var f of processed_files)
            $('#training-filetable-row').tmpl({filename:f}).appendTo($table.find('tbody'))
    }

    static on_start_training(){
        console.error('Not implemented')
    }
}

