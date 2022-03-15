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
        elements = self.find_visible_elements('.error:contains("Saving failed")')
        assert len(elements) > 0
        #remove the loading class
        assert 'loading' not in self.get_attribute("div#settings-ok-button", 'class')
        #settings dialog still visible
        assert self.is_element_visible("div#settings-dialog")

        if self.demo_mode:
            self.sleep(1)
    

    def test_save_settings_basic(self):
        self.open("http://localhost:5001/")  #dynamic

        #click on settings to open dialog
        self.click("label#settings-button")
        #click on the ok button
        self.click("div#settings-ok-button")

        #button should display that it's loading
        #XXX: too fast
        #assert 'loading' in self.get_attribute("div#settings-ok-button", 'class')

        #saving should not take long
        self.sleep(1)
        #should NOT show some kind of error message
        elements = self.find_visible_elements(':contains("Saving failed")')
        assert len(elements) == 0
        #remove the loading class
        assert 'loading' not in self.get_attribute("div#settings-ok-button", 'class')
        #settings dialog closed
        assert not self.is_element_visible("div#settings-dialog")

        if self.demo_mode:
            self.sleep(1)
    
    def test_save_settings_keep_values(self):
        self.open("http://localhost:5001/")  #dynamic

        #click on settings to open dialog
        self.click("label#settings-button")
        
        #click on the active model selection dropdown
        self.click('div#settings-active-model')
        #assert there are some items in the dropdown list and they are now visible
        self.wait_for_element_visible('div#settings-active-model .item', timeout=0.5)
        elements = self.find_visible_elements('div#settings-active-model .item')
        assert len(elements) > 0

        #TODO: assert elements are sorted

        element      = elements[0]
        element_text = element.text
        element.click()

        #click on the ok button
        self.click("div#settings-ok-button")


        #refresh page and make sure the selected element is still selected
        self.refresh_page()

        #click on settings to open dialog
        self.click("label#settings-button")
        selected = self.get_attribute('div#settings-active-model input', 'value')
        assert selected == element_text
