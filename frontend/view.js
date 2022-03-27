
function on_show_results_as_overlay(event){
    var $root    = $(event.target).closest('[filename]')
    var filename = $root.attr('filename')

    $root.find('.result-image-container').hide()
    $root.find('.view-menu .side-by-side-item').removeClass('active')
    $root.find('.view-menu .overlay-item').addClass('active')
}

function on_show_results_side_by_side(event){
    var $root    = $(event.target).closest('[filename]')
    var filename = $root.attr('filename')

    $root.find('.result-image-container').show()
    $root.find('.view-menu .side-by-side-item').addClass('active')
    $root.find('.view-menu .overlay-item').removeClass('active')
}

