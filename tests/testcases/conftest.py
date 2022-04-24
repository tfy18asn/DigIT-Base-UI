import os
os.environ['DO_NOT_RELOAD'] = 'true'

from backend.app import App, get_models_path
App().recompile_static(force=True)


#generate dummy models for testing
from training.base import basemodel
models_path = os.path.join(get_models_path(), 'detection')
os.makedirs(models_path, exist_ok=True)
for i in range(3):
    basemodel.Model().save( os.path.join(models_path, f'model_{i}') )

