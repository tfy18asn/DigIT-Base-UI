




function on_accordion_open(){
    var $root    = $(this).closest('[filename]')
    var filename = $root.attr('filename')
    var file     = GLOBAL.files[filename];
    var $img     = $root.find('img.input-image')
    $img.on('load', function(){
        $root.find('.loading-message').remove()
    })
    load_image_from_file($img,file);
}


//TODO: maybe
function load_image_from_file($img, file){
    if(file.type=="image/tiff" || file.name.endsWith('.tif') || file.name.endsWith('.tiff')){
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
