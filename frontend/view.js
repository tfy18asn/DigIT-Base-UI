
function show_results_as_overlay(filename){
    var $root    = $(`[filename="${filename}"]`)

    $root.find('.result-image-container').hide()
    $root.find('.result-image-overlay').show()
    $root.find('.view-menu .side-by-side-item').removeClass('active')
    $root.find('.view-menu .overlay-item').addClass('active')
}

function show_results_side_by_side(filename){
    var $root    = $(`[filename="${filename}"]`)

    $root.find('.result-image-container').show()
    $root.find('.result-image-overlay').hide()
    $root.find('.view-menu .side-by-side-item').addClass('active')
    $root.find('.view-menu .overlay-item').removeClass('active')
}

