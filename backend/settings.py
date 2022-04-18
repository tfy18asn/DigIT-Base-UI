import json, os, glob
from . import app

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
        if getattr(self, 'active_model', None) != s['active_model']:
            self.model = self.load_model(s['active_model'])
        
        self.__dict__.update(s)
        if save:
            json.dump( s, open('settings.json','w')) 

    def get_settings_as_dict(self):
        #s = self.load_settings_from_file()
        s = self.get_defaults()
        s = dict([ (k,getattr(self,k,v)) for k,v in s.items() ])
        return {
            'settings'         : s,
            'available_models' : self.get_available_models()
        }

    @staticmethod
    def get_available_models():
        modelsdir  = app.get_models_folder()
        modelfiles = glob.glob(os.path.join(modelsdir, '*.pkl'))
        modelnames = [os.path.splitext(os.path.basename(m))[0] for m in modelfiles]
        return modelnames



def load_model(modelname):
    import pickle
    print(f'Loading model {modelname}')
    path  = os.path.join(app.get_models_folder(), f'{modelname}.pkl')
    model = pickle.load(open(path, 'rb'))
    return model

