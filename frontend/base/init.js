

function init(){
    setup_sse()
    $('#filetable.accordion').accordion({duration:0, onOpening:on_accordion_open})
    $('.menu.tabular .item').tab({onLoad:BaseTraining.refresh_table});
}


//set up server-side events
function setup_sse(){
    GLOBAL.event_source = new EventSource('/stream');
    //GLOBAL.event_source.onerror   = (x) => console.error('SSE Error', x);
}
