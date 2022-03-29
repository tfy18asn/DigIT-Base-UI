import json, os


class Settings:
    FILENAME = 'settings.json'   #FIXME: hardcoded

    def __init__(self):
        self.load_settings_from_file()

    @classmethod
    def get_defaults(cls):
        available_models = cls.get_available_models()
        first_or_none    = lambda x: x[0] if len(x) else None 
        return {
            'active_model'          : first_or_none(available_models),
        }

    def load_settings_from_file(self):
        s = self.get_defaults()
        if os.path.exists(self.FILENAME):
            s.update(json.load(open(self.FILENAME)))
            self.set_settings(s)
        else:
            print(f'[WARNING] Settings file {self.FILENAME} not found.')
            self.set_settings(s, save=False)
        return s

    def set_settings(self, s, save=True):
        self.__dict__.update(s)
        if save:
            json.dump( s, open('settings.json','w')) 

    def get_settings_as_dict(self):
        s = self.load_settings_from_file()
        return {
            'settings'         : s,
            'available_models' : self.get_available_models()
        }

    @staticmethod
    def get_available_models():
        '''Mock function. Needs to be re-implemented downstream.'''
        return ['Model A', 'Model D', 'Model B', 'Model C']

