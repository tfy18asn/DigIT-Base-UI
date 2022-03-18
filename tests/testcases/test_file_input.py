import os
BaseCase = __import__('base_case').BaseCase


class BasicTest(BaseCase):
    def test_open(self):
        self.open("http://localhost:5001/")

    def test_open_and_display(self):
        #TODO: make option to either run the static file version or to connect to backend
        #self.open("http://localhost:5001/")
        #self.open("file:///root/workspace/static/index.html")
        self.open(f"file://{os.environ['STATIC_PATH']}/index.html")
        
        self.highlight('th:contains("No Files Loaded")')  #assert exists

        self.driver.find_element('id', 'input_images').send_keys('\n'.join([
            "/root/workspace/tests/testcases/assets/test_image0.jpg",
        ]))
        self.highlight('th:contains("1 File Loaded")')  #assert exists

        self.driver.find_element('id', 'input_images').send_keys('\n'.join([
            "/root/workspace/tests/testcases/assets/test_image0.jpg",
            "/root/workspace/tests/testcases/assets/test_image1.jpg"
        ]))
        self.highlight('th:contains(" Files Loaded")')  #FIXME: 2 files in chrome, 3 files in firefox (webdriver issue)

        #open one file
        self.click('label:contains("test_image1.jpg")')
        #wait for the image to display
        self.wait_for_element_not_visible('[filename="test_image1.jpg"]:contains("Loading")', timeout=6)
        assert self.is_element_visible('[filename="test_image1.jpg"] img')
        
        self.save_screenshot_to_logs('screenshot_img1.png', selector='[filename="test_image1.jpg"] img')
        
        if self.demo_mode:
            self.sleep(1)
        
        #self.save_screenshot(name="screenshot1.png", selector=None)
        #assert 0


#TODO: load lots (10k) of files
