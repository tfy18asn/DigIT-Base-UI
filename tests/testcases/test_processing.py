BaseCase = __import__('base_case').BaseCase
import pytest, os


class ProcessingTest(BaseCase):
    @pytest.mark.slow
    def test_basic_processing_success(self):
        self.open_main(static=False)
        
        self.driver.find_element('id', 'input_images').send_keys('\n'.join([
            "/root/workspace/tests/testcases/assets/test_image0.jpg",
            "/root/workspace/tests/testcases/assets/test_image1.jpg",
            "/root/workspace/tests/testcases/assets/test_image2.tiff",
        ]))

        #open one file
        self.click('label:contains("test_image1.jpg")')
        #click on the processing button
        self.click('[filename="test_image1.jpg"] .play.icon')

        #a dimmer that indicates that processing is in progress should be visible
        self.wait_for_element_visible('[filename="test_image1.jpg"] .dimmer', timeout=2)
        #there should be no error indication
        assert not self.find_visible_elements('.error') + self.find_visible_elements(':contains("failed")') 
        #after processing is done, the dimmer should be gone (can take a while)
        self.wait_for_element_not_visible('[filename="test_image1.jpg"] .dimmer', timeout=6)

        #TODO: check some indication that a file is finished processing (bold font in the file list)
        
        if self.demo_mode:
            self.sleep(1)
        
        #self.save_screenshot(name="screenshot1.png", selector=None)
        #assert 0
    
    def test_basic_upload(self):
        self.open_main(static=False)
        
        self.driver.find_element('id', 'input_images').send_keys('\n'.join([
            "/root/workspace/tests/testcases/assets/test_image1.jpg",
        ]))
        script = '''console.log(arguments);upload_file_to_flask(GLOBAL.files["test_image1.jpg"]).done(arguments[0]())'''
        self.execute_async_script(script)
        self.sleep(1)
        self.assert_link_status_code_is_not_404(f"http://localhost:{self.port}/images/test_image1.jpg")
        self.assert_no_404_errors()

        if self.demo_mode:
            self.sleep(1)


    def test_upload_failed(self):
        self.open_main(static=True)  #static so that upload fails
        
        self.driver.find_element('id', 'input_images').send_keys('\n'.join([
            "/root/workspace/tests/testcases/assets/test_image0.jpg",
            "/root/workspace/tests/testcases/assets/test_image1.jpg",
            "/root/workspace/tests/testcases/assets/test_image2.tiff",
        ]))

        #open one file
        self.click('label:contains("test_image1.jpg")')
        #click on the processing button
        self.click('[filename="test_image1.jpg"] .play.icon')

        #should fail because static file is opened
        self.wait_for_element_visible('.error', timeout=3)

        if self.demo_mode:
            self.sleep(1)
