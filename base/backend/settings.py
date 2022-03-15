import json


def set_settings(s):
    print('New settings:', s)
    json.dump(dict(
        dict( [(k, s.get(k,None)) for k in ['active_model']] )
    ), open('settings.json','w'))


def get_settings():
    #TODO: check if file exists
    settings = json.load(open('settings.json'))
    #TODO: check if file contains all required keys, check values, make defaults otherwise
    settings.update({
        'models'    : get_available_models(),
    })
    return settings


def get_available_models():
    return ['Model A', 'Model D', 'Model B', 'Model C']  #TODO: scan directory
