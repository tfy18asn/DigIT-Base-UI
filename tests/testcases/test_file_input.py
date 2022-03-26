import os
BaseCase = __import__('base_case').BaseCase

import pytest
import tempfile
import numpy as np, PIL.Image
            

class TestBasic(BaseCase):
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
        
        if self.demo_mode:
            self.sleep(1)
        
        #self.save_screenshot(name="screenshot1.png", selector=None)
        #assert 0


    def test_load_tiff(self):
        self.open(f"file://{os.environ['STATIC_PATH']}/index.html")
        self.driver.find_element('id', 'input_images').send_keys('\n'.join([
            "/root/workspace/tests/testcases/assets/test_image2.tiff"
        ]))
        #open one file
        self.click('label:contains("test_image2.tiff")')
        #wait for the image to display
        self.wait_for_element_not_visible('[filename="test_image2.tiff"]:contains("Loading")', timeout=6)
        assert self.is_element_visible('[filename="test_image2.tiff"] img')
        
        self.save_screenshot_to_logs('screenshot_img1.png', selector='[filename="test_image2.tiff"] img')

        if self.demo_mode:
            self.sleep(1)


#TODO: load lots (10k) of files


@pytest.mark.parametrize('imagesize', [ (256,256), (4096,4096), (256,4096), (4096,256), (16,64), (64,16) ])  #order: width-height
def test_aspect_ratios(imagesize):
    class AspectRatios(BaseCase):
        def perform_test(self, imagesize):
            print('parameters:     ', imagesize)
            self.open(f"file://{os.environ['STATIC_PATH']}/index.html")
            
            data    = (np.random.random(imagesize[::-1]+(3,))*255).astype('uint8')
            img     = PIL.Image.fromarray(data)
            tmpdir  = tempfile.TemporaryDirectory()
            out     = os.path.join(tmpdir.name, 'test_image.png')
            img.save( out )

            self.driver.find_element('id', 'input_images').send_keys('\n'.join([
                out
            ]))
            #open the file
            self.click('label:contains("test_image.png")')

            screenshot = f'{tmpdir.name}/screenshot.png'
            self.save_screenshot(screenshot, selector='[filename="test_image.png"] img.input-image')
            
            screenshot = PIL.Image.open(screenshot)
            print('screenshot size:', screenshot.size)

            #assert aspect ratio is close to original
            aspect_ratio_input  = np.divide(*imagesize)
            aspect_ratio_screen = np.divide(*screenshot.size)
            assert abs( aspect_ratio_input - aspect_ratio_screen ) < 0.2

            if self.demo_mode:
                self.sleep(1)
            

    t = AspectRatios()
    try:
        t.setUp()
        t.perform_test(imagesize)
    finally:
        t.tearDown()


