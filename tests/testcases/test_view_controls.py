import os
BaseCase = __import__('base_case').BaseCase






class TestViewControls(BaseCase):
    def test_overlay_side_by_side_switch(self):
        self.open_main(static=True)

        self.send_input_files_from_assets([ "test_image0.jpg", "test_image1.jpg" ])
        self.click('label:contains("test_image1.jpg")')

        root_css = '[filename="test_image1.jpg"]'
        menu_css = root_css + ' .view-menu'
        self.assert_element_not_visible(menu_css)
        self.hover_on_element(root_css+' .view-menu-button')
        self.wait_for_element_visible(menu_css)
        
        self.highlight(menu_css+' .overlay-item')
        self.click(menu_css+' .overlay-item')
        self.wait_for_element_not_visible(root_css+' img.result-image') 
        self.wait_for_element_visible(root_css+' img.input.overlay') 

        self.hover_on_element(root_css+' .view-menu-button')
        self.wait_for_element_visible(menu_css)
        self.click(menu_css+' .side-by-side-item')
        self.wait_for_element_visible(root_css+' img.result-image') 
        self.wait_for_element_not_visible(root_css+' img.input.overlay') 
        assert self.find_element(menu_css+' .side-by-side-item.active') 
        assert self.find_element(menu_css+' .overlay-item:not(.active)')

        self.hover_on_element(root_css+' .view-menu-button')
        self.wait_for_element_visible(menu_css)
        self.click(menu_css+' .overlay-item')
        self.wait_for_element_not_visible(root_css+' img.result-image') 
        assert self.find_element(menu_css+' .side-by-side-item:not(.active)') 
        assert self.find_element(menu_css+' .overlay-item.active')
        self.wait_for_element_visible(root_css+' img.input.overlay') 

    def test_brightness(self):
        self.open_main(static=True)

        self.send_input_files_from_assets([ "test_image0.jpg", "test_image1.jpg" ])
        self.click('label:contains("test_image1.jpg")')

        root_css = '[filename="test_image1.jpg"]'
        menu_css = root_css + ' .view-menu'
        self.hover_on_element(root_css+' .view-menu-button')
        self.wait_for_element_visible(menu_css)

        self.hover_on_element(root_css+' .brightness-slider .thumb')
        thumb = self.find_element(root_css+' .brightness-slider .thumb')

        #input image brightness should be simply one at the start
        script = f''' return $('{root_css} .input img').css('filter') '''
        image_filters = self.execute_script(script)
        assert 'brightness(1)' in image_filters
        brightness0   = float(image_filters.split('brightness(')[1].split(')')[0])

        from selenium import webdriver
        #move slider to the right
        webdriver.ActionChains(self.driver).click_and_hold(thumb).move_by_offset(20,0).release().perform()
        self.sleep(0.1)

        #brightness should have increased
        image_filters = self.execute_script(script)
        brightness1   = float(image_filters.split('brightness(')[1].split(')')[0])
        assert brightness1 > brightness0


        #move slider back to the original position
        webdriver.ActionChains(self.driver).click_and_hold(thumb).move_by_offset(-20,0).release().perform()
        self.sleep(0.1)

        #brightness should have decreased, if possible to 1 again
        image_filters = self.execute_script(script)
        brightness2   = float(image_filters.split('brightness(')[1].split(')')[0])
        assert brightness2 < brightness1
        assert abs(brightness2 - brightness0) < 0.05

        if self.demo_mode:
            self.sleep(1)

    def test_panning(self):
        self.open_main(static=True)

        self.send_input_files_from_assets([ "test_image0.jpg", "test_image1.jpg" ])
        self.click('label:contains("test_image1.jpg")')

        root_css = '[filename="test_image1.jpg"]'
        img      = self.find_element(root_css+' .input-image')

        #transform matrix should be simply identity at start
        script = f''' return $('{root_css} .transform-box').css('transform') '''
        xform_matrix0_str = self.execute_script(script)
        assert 'matrix(1, 0, 0, 1, 0, 0)' == xform_matrix0_str
        xform_matrix0     = self.execute_script(f'return new DOMMatrix("{xform_matrix0_str}")')

        self.hover_on_element(root_css+' .input-image')

        from selenium import webdriver
        from selenium.webdriver.common.keys import Keys
        #click and drag with shift
        webdriver.ActionChains(self.driver).key_down(Keys.SHIFT).click_and_hold(img).move_by_offset(20,0).release().perform()
        self.sleep(0.1)

        #transform matrix should have changed
        script = f''' return new DOMMatrix( $('{root_css} .transform-box').css('transform') ) '''
        xform_matrix1 = self.execute_script(script)
        #only the shift coefficient
        assert xform_matrix0['e'] < xform_matrix1['e']
        assert all( [xform_matrix0[k]==xform_matrix1[k] for k in 'abcdf'] )

        #make sure no text has been selected by the mouse dragging (actual small bug)
        assert self.execute_script('return getSelection().type') != 'Range'
        
        #move again, without shift key
        webdriver.ActionChains(self.driver).key_up(Keys.SHIFT).click_and_hold(img).move_by_offset(0,20).release().perform()
        self.sleep(0.1)

        #transform matrix should *not* have changed
        script = f''' return new DOMMatrix( $('{root_css} .transform-box').css('transform') ) '''
        xform_matrix2 = self.execute_script(script)
        assert xform_matrix1 == xform_matrix2

        #double-click with shift key
        webdriver.ActionChains(self.driver).key_down(Keys.SHIFT).double_click(img).perform()
        self.sleep(0.1)

        #transform matrix should be identity again
        script = f''' return new DOMMatrix( $('{root_css} .transform-box').css('transform') ) '''
        xform_matrix3 = self.execute_script(script)
        assert xform_matrix0 == xform_matrix3

        if self.demo_mode:
            self.sleep(1)
