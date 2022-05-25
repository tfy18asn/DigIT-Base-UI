

BaseBoxes = class {
    static set_box_drawing_mode(filename, state){
        const $root = $(`[filename="${filename}"]`)
        $root.find(`.item.new-box`).toggleClass('active', state)
        
        const $container  = $root.find('.transform-box')
        $container.css('cursor', state? 'crosshair' : '')

        if(!state)
            return;
        
        //temporary box overlay
        const $selection = $('<div>').css({"background": "transparent", 
                                           "position":   "absolute", 
                                           "border":     "1px dotted #fff"});
        const _this = this;
        $container.one('mousedown', function(mousedown_event) {
            const click_y = mousedown_event.pageY - $container.offset().top;
            const click_x = mousedown_event.pageX - $container.offset().left;
    
            $selection.css({
              'top':    click_y,  'left':   click_x,
              'width':  0,        'height': 0
            });
            $selection.appendTo($container);

            $(document).on('mousemove mouseup', function(mousemove_event) {
                if( (mousemove_event.buttons & 0x01)==0 ){
                    //mouse up
                    
                    $(document).off('mousemove mouseup');
                    _this.set_box_drawing_mode(filename, false);

                    const parent_box  = $container[0].getBoundingClientRect();
                    const topleft     = $selection.position()
                    const bottomright = [topleft.top + $selection.height(), topleft.left + $selection.width()];
                    const bbox        = [topleft.top/parent_box.height,     topleft.left/parent_box.width,
                                         bottomright[0]/parent_box.height,  bottomright[1]/parent_box.width];
                    _this.add_box_overlay(filename, bbox, '???')
                    $selection.remove();
                    return;
                }
    
                const move_y = mousemove_event.pageY - $container.offset().top,
                      move_x = mousemove_event.pageX - $container.offset().left,
                      width  = Math.abs(move_x - click_x),
                      height = Math.abs(move_y - click_y);
    
                const new_x  = (move_x < click_x) ? (click_x - width)  : click_x;
                const new_y  = (move_y < click_y) ? (click_y - height) : click_y;
    
                $selection.css({
                  'width': width,  'height': height,
                  'top':   new_y,  'left':   new_x
                });
            })
        })
    }

    static on_draw_new_box_button(event){
        const $root    = $(event.target).closest('[filename]')
        const filename = $root.attr('filename')
        const active   = $root.find('.item.new-box').hasClass('active');
        this.set_box_drawing_mode(filename, !active);
    }

    static add_box_overlay(filename, yxyx, label){
        console.log('New box:', yxyx)
        const $overlay   = $('#box-overlay-template').tmpl({box:yxyx, label:label})
        const $container = $(`[filename="${filename}"] .boxes.overlay`)
        $overlay.appendTo($container)


        function stop_drag(){
            $(document).off('mousemove mouseup');
    
            const H   = $container.height(), W = $container.width();
            const y0  = Math.max(0, $overlay.position()['top']/H)
            const x0  = Math.max(0, $overlay.position()['left']/W)
            const y1  = Math.min(1, ($overlay.position()['top']  + $overlay.outerHeight())/H );
            const x1  = Math.min(1, ($overlay.position()['left'] + $overlay.outerWidth())/W );
    
            //TODO: global.input_files[filename].results[index].box = [y0,x0,y1,x1];
    
            $overlay.css({
                'width' : '',
                'height': '',
                'top'   : y0*100 + '%',
                'left'  : x0*100 + '%',
                'bottom': 100 - y1*100 + '%',
                'right' : 100 - x1*100 + '%',
            })
        }

        $overlay.find('.move-anchor').on('mousedown', function(mousedown_event){
            const click_y   = mousedown_event.pageY;
            const click_x   = mousedown_event.pageX;
            const overlay_y = $overlay.position()['top'];
            const overlay_x = $overlay.position()['left'];
            //make sure height/width are fixed
            $overlay.css('height', $overlay.css('height'));
            $overlay.css('width',  $overlay.css('width'));
    
            $(document).on('mousemove mouseup', function(mousemove_event) {
                if( (mousemove_event.buttons & 0x01)==0 ){
                    stop_drag();
                    return;
                }
                $overlay.css({
                    'top':  overlay_y + (mousemove_event.pageY - click_y), 
                    'left': overlay_x + (mousemove_event.pageX - click_x), 
                  });
            });
            return false; //stop event propagation
        })
    
        $overlay.find('.resize-anchor').on('mousedown', function(mousedown_event){
            const click_y   = mousedown_event.pageY;
            const click_x   = mousedown_event.pageX;
            const overlay_h = $overlay.outerHeight();
            const overlay_w = $overlay.outerWidth();
    
            $(document).on('mousemove mouseup', function(mousemove_event) {
                if( (mousemove_event.buttons & 0x01)==0 ){
                    stop_drag();
                    return;
                }
                $overlay.css({
                    'height': overlay_h + (mousemove_event.pageY - click_y), 
                    'width':  overlay_w + (mousemove_event.pageX - click_x), 
                  });
            });
            return false; //stop event propagation
        })
    }

    static refresh_boxes(filename){
        const img = $(`[filename="${filename}"] img.input-image`)[0];
        if(img.naturalWidth==0){
            //image not yet loaded, display on load
            $(img).one( 'load', _ => this.refresh_boxes(filename) )
            return;
        }
        const [H,W]   = [img.naturalHeight, img.naturalWidth]  //FIXME: use --imgwidth or better own function
        this.clear_box_overlays(filename)

        const results = GLOBAL.files[filename]?.results;
        const boxes   = results?.boxes;
        const labels  = results?.labels;
        if(!boxes || !labels)
            return;
        
        for(const [i,box] of Object.entries(boxes)){
            const yxyx = [box[1]/H, box[0]/W, box[3]/H, box[2]/W]
            this.add_box_overlay(filename, yxyx, labels[i] )
        }
        
    }

    static on_remove_box_button(event){
        console.error('Not implemented')
    }

    static clear_box_overlays(filename){
        const $container = $(`[filename="${filename}"] .boxes.overlay`)
        $container.find('.box-overlay').remove()
    }


    static convert_boxlabel_into_input(event) {
        const $label = $(event.target)
        //activate dropdown
        $label.closest('.box-overlay').find('select.search').dropdown({
            allowAdditions: true, 
            hideAdditions:  false, 
            forceSelection: false, 
            selectOnKeydown: false,
            fullTextSearch:true,
            action: (t,v,el) => {  save(t); },
            onHide: ()=>{ save(); },
        });
        const $input = $label.closest('.box-overlay').find('.search.dropdown');
        $input.dropdown('setup menu', {
            values: this.get_set_of_all_labels().sort().map( v => {return {name:v};} ),
        });
        $label.hide();
        $input.show();
    
        const save = function(txt=''){
            console.log(`save(${txt})`)
            if(txt.length > 0)
                $label.text(txt)
            $label.show();
            $input.hide();
        }
        /*var save = function(txt=''){
            if(txt.length>0){
                //$label.text( txt );  //done in update_boxlabel via set_custom_label
                var filename = $label.closest('[filename]').attr('filename');
                var index    = $label.closest('[index]').attr('index');
                if(txt.toLowerCase()=='nonpollen')
                    txt = '';
                set_custom_label(filename, index, txt);
            }
            
            $label.show();
            $input.hide();
        };*/
        
        $input.find('input').focus().select();
    }

    static get_set_of_all_labels(){
        return []
    }
}



