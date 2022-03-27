




function on_accordion_open(){
    var $root    = $(this).closest('[filename]')
    var filename = $root.attr('filename')
    var file     = GLOBAL.files[filename];
    var $img     = $root.find('img.input-image')

    if(is_image_loaded($img)){
        scroll_to_filename(filename)  //won't work the first time
        return;
    }
    $img.on('load', function(){
        var $par = $root.find('.set-aspect-ratio-manually')
        var img  = $img[0]
        $par.css('--imagewidth',  img.naturalWidth)
        $par.css('--imageheight', img.naturalHeight)

        $root.find('.loading-message').remove()
        $root.find('.filetable-content').show()
        scroll_to_filename(filename)  //works on the first time
        URL.revokeObjectURL($img.attr('src'))
    })
    load_image_from_file($img,file);

    //setting the result image as well, only to get the same dimensions
    load_image_from_file($root.find('img.result-image'),file);
}


function load_image_from_file($img, file){
    if(file.type=="image/tiff" || file.name.endsWith('.tif') || file.name.endsWith('.tiff')){
        //TODO: refactor to own function
        var freader = new FileReader()
        freader.onload = function(event){
            var buffer = event.target.result
            var ifds   = UTIF.decode(buffer);
            UTIF.decodeImage(buffer, ifds[0], ifds)
            var rgba   = UTIF.toRGBA8(ifds[0]);
            var canvas = $(`<canvas width="${ifds[0].width}" height="${ifds[0].height}">`)[0]
            var ctx    = canvas.getContext('2d')
            ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba.buffer),ifds[0].width,ifds[0].height),0,0);
            canvas.toBlob(blob =>  {
                $img.attr('src', URL.createObjectURL(blob)); 
            }, 'image/jpeg', 0.92 );
        }
        freader.readAsArrayBuffer(file);
    } else {
        $img.attr('src', URL.createObjectURL(file))
    }
}

function is_image_loaded($img){
    return ($img.attr('src')!=undefined)
}

function scroll_to_filename(filename){
    var $root       = $(`tr.ui.title[filename="${filename}"]`)
    var top         = $root.attr('top')
    setTimeout(() => {
        window.scrollTo( {top:top, behavior:'smooth'} )
    }, 10);
}
