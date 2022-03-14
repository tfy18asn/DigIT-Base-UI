from seleniumbase import BaseCase, config


#TODO: refactor: move codecoverage code in own file
#TODO: add assertions



class BasicTest(BaseCase):
    def setUp(self):
        config.remote_debug = True #enable chrome remote debugging port 9222
        super().setUp()
        if self.is_chromium():
            self._pyppeteer_page = start_codecoverage()

    def test_open(self):
        self.open("http://localhost:5001/")

    def test_open_and_display(self):
        self.open("http://localhost:5001/")
        
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

    def tearDown(self):
        if self.is_chromium():
            coverage   = retrieve_codecoverage(self._pyppeteer_page)
            import json, os
            outputfile = os.path.join(self.log_abspath, 'coverage_js/raw', f'{self.test_id}.codecoverage.json')
            os.makedirs(os.path.dirname(outputfile), exist_ok=True)
            open(outputfile,'w').write(json.dumps(coverage))
            import subprocess
            subprocess.call('killall chrome', shell=True)
        self.driver.quit()


def start_codecoverage():
    import asyncio
    import pyppeteer as pyp

    async def request_coverage_recording():
        browser    = await pyp.connect(browserURL="http://localhost:9222")
        pages      = await browser.pages()
        assert len(pages) == 1, NotImplemented
        page       = pages[0]
        await page.coverage.startJSCoverage()
        return page
    return asyncio.get_event_loop().run_until_complete(request_coverage_recording())

def retrieve_codecoverage(pyppeteer_page):
    import asyncio

    async def retrieve():
        return await pyppeteer_page.coverage.stopJSCoverage()
    return asyncio.get_event_loop().run_until_complete(retrieve())
