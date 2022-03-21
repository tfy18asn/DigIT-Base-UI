import os
os.environ['PYTEST_CURRENT_TEST'] = ''

from backend.app import App
App().recompile_static(force=True)
