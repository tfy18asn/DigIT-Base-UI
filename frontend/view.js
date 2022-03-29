
function show_results_as_overlay(filename){
    var $root    = $(`[filename="${filename}"]`)

    $root.find('.result.view-box').hide()
    $root.find('.result-image-overlay').show()
    $root.find('.view-menu .side-by-side-item').removeClass('active')
    $root.find('.view-menu .overlay-item').addClass('active')
}

function show_results_side_by_side(filename){
    var $root    = $(`[filename="${filename}"]`)

    //$root.find('.result.view-box').show()
    $root.find('.result.view-box').css('display', 'inherit')  //FIXME: ugly; .show() makes display:block
    $root.find('.result-image-overlay').hide()
    $root.find('.view-menu .side-by-side-item').addClass('active')
    $root.find('.view-menu .overlay-item').removeClass('active')
}


function on_brightness_slider(){
    var $root      = $(this).closest('[filename]')
    var brightness = $root.find('.brightness-slider').slider('get value')/10
    $root.find('.input-image').css('filter', `brightness(${brightness})`)
    //var contrast   = $root.find('.contrast-slider').slider('get value')  /10
    //$root.find('.input-image').css('filter', `brightness(${brightness}) contrast(${contrast})`)
}


//callback for panning
function on_transformbox_mousedown(event){
    if(event.shiftKey)
        start_move_image(event)
}

function on_transformbox_mousemove(event){
    //empty
}

//callback for zooming
function on_transformbox_wheel(event){
    if(!event.shiftKey)
        return;
        
    event.preventDefault();
    var $el    = $(event.target).closest('.transform-box');
    var xform   = parse_css_matrix($el.css('transform'));
    var x      = xform.x * (1 - 0.1*Math.sign(event.deltaY))
    var y      = xform.y * (1 - 0.1*Math.sign(event.deltaY))
    var scale  = Math.max(1.0, xform.scale * (1 - 0.1*Math.sign(event.deltaY)));
    var matrix = `matrix(${scale}, 0, 0, ${scale}, ${x}, ${y})`
    $el.css('transform', matrix);
    //$el.find('svg').find('circle.cursor').attr('r', 5/scale)
}

//reset view
this.on_viewbox_dblclick = function(e){
    if(!e.shiftKey)
        return;
    console.log('dblclick:', e.target)
    var $el   = $(e.target).closest('.view-box').find('.transform-box');
    $el.css('transform', "matrix(1,0,0,1,0,0)");
}


function start_move_image(mousedown_event){
    var $el     = $(mousedown_event.target).closest('.transform-box');
    var click_y = mousedown_event.pageY;
    var click_x = mousedown_event.pageX;

    $(document).on('mousemove', function(mousemove_event) {
        if( (mousemove_event.buttons & 0x01)==0 ){
            $(document).off('mousemove');
            return;
        }

        var delta_y = mousemove_event.pageY - click_y;
        var delta_x = mousemove_event.pageX - click_x;
            click_y = mousemove_event.pageY;
            click_x = mousemove_event.pageX;
        mousemove_event.stopPropagation();
        
        var xform  = parse_css_matrix($el.css('transform'));
        var x      = xform.x + delta_x;
        var y      = xform.y + delta_y;
        var matrix = `matrix(${xform.scale}, 0, 0, ${xform.scale}, ${x}, ${y})`
        $el.css('transform', matrix);
    })
}

