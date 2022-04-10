

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
    })
    set_image_src($img, file);

    //setting the result image as well, only to get the same dimensions
    //if not already loaded from results
    var $result_img = $root.find('img.result-image')
    if(!is_image_loaded($result_img))
        set_image_src($result_img, file);
}


function set_image_src($img, file){
    if( (file instanceof File)
     && (file.type=="image/tiff" || file.name.endsWith('.tif') || file.name.endsWith('.tiff'))) {
        load_tiff_file(file).then( blob => set_image_src($img, blob) )
    } else if( file instanceof Blob) {
        var url = URL.createObjectURL(file)
        $img.attr('src', url)
        $img.one('load', _ => URL.revokeObjectURL(url) )
        console.log('Setting image src of', $img, 'to blob', file)
    } else if (is_string(file)){
        var url = url_for_image(file)
        $img.attr('src', url)
        console.log('Setting image src of', $img, 'to string', file)
    } else {
        throw TypeError(`Cannot set image src to ${file}`)
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

async function load_tiff_file(file){
    var promise = new Promise( (resolve, reject) => {
        var freader = new FileReader()
        freader.onload = function(event){
            var buffer = event.target.result
            var ifds   = UTIF.decode(buffer);
            UTIF.decodeImage(buffer, ifds[0], ifds)
            var rgba   = UTIF.toRGBA8(ifds[0]);
            var canvas = $(`<canvas width="${ifds[0].width}" height="${ifds[0].height}">`)[0]
            var ctx    = canvas.getContext('2d')
            ctx.putImageData(new ImageData(new Uint8ClampedArray(rgba.buffer),ifds[0].width,ifds[0].height),0,0);
            canvas.toBlob(blob =>  resolve(blob), 'image/jpeg', 0.92 );
        }
        freader.readAsArrayBuffer(file);
    } )
    return promise;
}

