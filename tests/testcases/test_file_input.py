BaseCase = __import__('base_case').BaseCase


class BasicTest(BaseCase):
    def test_open(self):
        self.open("http://localhost:5001/")

    def test_open_and_display(self):
        #TODO: make option to either run the static file version or to connect to backend
        #self.open("http://localhost:5001/")
        self.open("file:///root/workspace/static/index.html")
        
        self.click('th:contains("No Files Loaded")')  #assert exists

        self.driver.find_element('id', 'input_images').send_keys('\n'.join([
            "/root/workspace/tests/testcases/assets/test_image0.jpg",
        ]))
        self.click('th:contains("1 File Loaded")')  #assert exists

        self.driver.find_element('id', 'input_images').send_keys('\n'.join([
            "/root/workspace/tests/testcases/assets/test_image0.jpg",
            "/root/workspace/tests/testcases/assets/test_image1.jpg"
        ]))
        self.click('th:contains(" Files Loaded")')  #FIXME: 2 files in chrome, 3 files in firefox (webdriver issue)
        
        if self.demo_mode:
            self.sleep(1)
        
        #self.save_screenshot(name="screenshot1.png", selector=None)
        #assert 0

