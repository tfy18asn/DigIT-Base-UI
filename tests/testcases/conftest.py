import os
os.environ['DO_NOT_RELOAD'] = 'true'

from backend.app import App
App().recompile_static(force=True)
