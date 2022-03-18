




function on_accordion_open(){
    var $root    = $(this).closest('[filename]')
    var filename = $root.attr('filename')
    var file     = GLOBAL.files[filename];
    var img      = $root.find('img.input-image')
    load_image_from_file(img,file);
}


//TODO: maybe
function load_image_from_file(img_element, file){
    var url = URL.createObjectURL(file)
    $(img_element).attr('src', url).on('load', function(){
        var $root    = $(img_element).closest('[filename]')
        $root.find('.loading-message').remove()
    })
}
