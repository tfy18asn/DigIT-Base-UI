

function init(){
    setup_sse()
    $('.ui.accordion').accordion({duration:0, onOpening:on_accordion_open})
}


//set up server-side events
function setup_sse(){
    GLOBAL.event_source = new EventSource('/stream');
    //GLOBAL.event_source.onerror   = (x) => console.error('SSE Error', x);
}