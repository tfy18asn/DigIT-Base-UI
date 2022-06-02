
BaseApp = class {
    static Detection       = BaseDetection;
    static Download        = BaseDownload;
    static ViewControls    = ViewControls;
    static Settings        = BaseSettings;
    static FileInput       = BaseFileInput;
    static Training        = BaseTraining;
    static Boxes           = BaseBoxes;
    static Sorting         = BaseSorting;
    static ImageLoading    = BaseImageLoading;


    static init(){
        if(!window.location.href.startsWith('file://')){
            this.Settings.load_settings();
            setup_sse()
        }

        $('#filetable.accordion').accordion({
            duration:  0, 
            onOpening: function() { GLOBAL.App.ImageLoading.on_accordion_open(this) },
        })

        $('.tabs.menu .item').tab({onLoad: path => {
            if(path=='training')
                this.Training.refresh_table()
        } });
        this.FileInput.setup_drag_and_drop()
    }
}



GLOBAL = {
    //overwritten downstream
    App: BaseApp,

    settings: {
        active_models: {
            detection : undefined,               //modelname
            //other types downstream
        }
    },
    available_models: [
        /* { name:"Modelname", properties:{} } */
    ],

    files:            [],                        //Array of FILE objects
    event_source:     undefined,                 //EventSource object
    cancel_requested: false,
}




//set up server-side events
function setup_sse(){
    GLOBAL.event_source = new EventSource('/stream');
    //GLOBAL.event_source.onerror   = (x) => console.error('SSE Error', x);
}


