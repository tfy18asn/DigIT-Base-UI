import json, os


def set_settings(s):
    print('New settings:', s)
    json.dump(dict(
        dict( [(k, s.get(k,None)) for k in ['active_model']] )
    ), open('settings.json','w'))  #FIXME: hardcoded settings file


def get_settings():
    #FIXME: hardcoded settings file
    settings_file = 'settings.json'
    if os.path.exists(settings_file):
        settings = json.load(open(settings_file))
    else:
        settings = {'active_model':None}
    #TODO: check if file contains all required keys, check values, make defaults otherwise
    settings.update({
        'models'    : get_available_models(),
    })
    return settings


def get_available_models():
    return ['Model A', 'Model D', 'Model B', 'Model C']  #TODO: scan directory
