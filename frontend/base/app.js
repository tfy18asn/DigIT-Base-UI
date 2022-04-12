
BaseApp = class {
    static Detection       = BaseDetection;
    static Download        = BaseDownload;
    static ViewControls    = ViewControls;
    static Settings        = BaseSettings;
    static FileInput       = BaseFileInput;
    static Training        = BaseTraining;


    static init(){
        setup_sse()
        $('#filetable.accordion').accordion({duration:0, onOpening:on_accordion_open})
        $('.tabs.menu .item').tab({onLoad: x => BaseTraining.refresh_table() });
        this.FileInput.setup_drag_and_drop()
    }
}


//overwritten downstream
App = BaseApp;



//set up server-side events
function setup_sse(){
    GLOBAL.event_source = new EventSource('/stream');
    //GLOBAL.event_source.onerror   = (x) => console.error('SSE Error', x);
}


