BaseCase = __import__('base_case').BaseCase


class SettingsTests(BaseCase):
    def test_save_settings_failed(self):
        self.open("file:///root/workspace/static/index.html")  #static
        #click on settings to open dialog
        self.click("label#settings-button")
        #click on the ok button
        self.click("div#settings-ok-button")
        
        #button should display that it's loading
        #XXX: no 'loading' is visible only very shortly, cannot really test for that
        #assert 'loading' in self.get_attribute("div#settings-ok-button", 'class')

        #since we have loaded a static file, saving settings should fail
        self.sleep(1)
        #should show some kind of error message
        elements = self.find_visible_elements(':contains("Saving failed")')
        assert len(elements) > 1
        #remove the loading class
        assert 'loading' not in self.get_attribute("div#settings-ok-button", 'class')
        #settings dialog still visible
        assert self.is_element_visible("div#settings-dialog")

        if self.demo_mode:
            self.sleep(1)
        #self.click("div#settings-dialog div")
        #self.click("body div:nth-of-type(3)")
