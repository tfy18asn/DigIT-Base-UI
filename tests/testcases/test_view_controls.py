import os
BaseCase = __import__('base_case').BaseCase






class TestViewControls(BaseCase):
    def test_overlay_side_by_side_switch(self):
        #TODO: make option to either run the static file version or to connect to backend
        #self.open("http://localhost:5001/")
        #self.open("file:///root/workspace/static/index.html")
        self.open(f"file://{os.environ['STATIC_PATH']}/index.html")

        self.driver.find_element('id', 'input_images').send_keys('\n'.join([
            "/root/workspace/tests/testcases/assets/test_image0.jpg",
            "/root/workspace/tests/testcases/assets/test_image1.jpg"
        ]))
        self.click('label:contains("test_image1.jpg")')

        root_css = '[filename="test_image1.jpg"]'
        menu_css = root_css + ' .view-menu'
        self.assert_element_not_visible(menu_css)
        self.hover_on_element(root_css+' .view-menu-button')
        self.wait_for_element_visible(menu_css)
        
        self.highlight(menu_css+' .overlay-item')
        self.click(menu_css+' .overlay-item')
        self.wait_for_element_not_visible(root_css+' img.result-image') 
        self.wait_for_element_visible(root_css+' img.result-image-overlay') 

        self.hover_on_element(root_css+' .view-menu-button')
        self.wait_for_element_visible(menu_css)
        self.click(menu_css+' .side-by-side-item')
        self.wait_for_element_visible(root_css+' img.result-image') 
        self.wait_for_element_not_visible(root_css+' img.result-image-overlay') 
        assert self.find_element(menu_css+' .side-by-side-item.active') 
        assert self.find_element(menu_css+' .overlay-item:not(.active)')

        self.hover_on_element(root_css+' .view-menu-button')
        self.wait_for_element_visible(menu_css)
        self.click(menu_css+' .overlay-item')
        self.wait_for_element_not_visible(root_css+' img.result-image') 
        assert self.find_element(menu_css+' .side-by-side-item:not(.active)') 
        assert self.find_element(menu_css+' .overlay-item.active')
        self.wait_for_element_visible(root_css+' img.result-image-overlay') 
