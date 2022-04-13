import os, sys, shutil, glob, tempfile, json, webbrowser
import warnings
warnings.simplefilter('ignore')

import flask, jinja2

import argparse
parser = argparse.ArgumentParser()
parser.add_argument('--host',    type=str, default='localhost')
parser.add_argument('--port',    type=int, default=5000)
parser.add_argument('--debug',   default=sys.argv[0].endswith('.py'))

from . import settings
from . import pubsub


def path_to_this_module():
    return os.path.dirname(os.path.realpath(__file__))

def path_to_main_module():
    path = os.environ.get('ROOT_PATH',None)
    path = path or os.path.dirname(os.path.realpath(sys.modules['__main__'].__file__))
    return path

def get_static_path():
    path = os.environ.get('STATIC_PATH',None)
    path = path or os.path.join(path_to_main_module(), 'static')
    return path

def get_cache_path():
    static_path = get_static_path()
    cache_path  = static_path.replace('/static', '/cache')
    return cache_path

def get_template_folders():
    return [
        os.path.join(path_to_main_module(), 'templates'),            #subproject
        os.path.join(path_to_this_module(), '..', 'templates'),      #base
    ]

def get_frontend_folders():
    return [
        os.path.join(path_to_this_module(), '..', 'frontend'),       #base
        os.path.join(path_to_main_module(), 'frontend'),             #subproject
    ]


class App(flask.Flask):
    def __init__(self, **kw):
        is_debug         = sys.argv[0].endswith('.py')
        is_second_start  = (os.environ.get("WERKZEUG_RUN_MAIN") == 'true')
        is_pytest_mode   = (os.environ.get('PYTEST_CURRENT_TEST',None) is not None)
        is_reloader      = (is_debug and not is_second_start) and not is_pytest_mode
        self.is_reloader = is_reloader

        super().__init__(
            'reloader' if is_reloader else __name__,
            root_path          = path_to_main_module(),    #TODO? os.chdir()
            static_folder      = get_static_path(), 
            static_url_path    = '/',
            **kw
        )
        if is_reloader:
            return
        

        self.template_folders = get_template_folders()
        self.frontend_folders = get_frontend_folders()
        self.cache_path       = get_cache_path()
        print('Root path:       ', self.root_path)
        print('Static path:     ', self.static_folder)
        print('Cache path:      ', self.cache_path)
        if is_debug:
            print('Template paths:  ', self.template_folders)
            print('Frontend paths:  ', self.frontend_folders)
        print()

        self.setup_cache()
        self.recompile_static()

        @self.route('/')
        def index():
            self.recompile_static()
            return self.send_static_file('index.html')
        
        @self.route('/images/<path:path>')
        def images(path):
            print(f'Download: {os.path.join(self.cache_path, path)}')
            return flask.send_from_directory(self.cache_path, path)

        @self.route('/file_upload', methods=['POST'])
        def file_upload():
            files = flask.request.files.getlist("files")
            for f in files:
                print('Upload: %s'%f.filename)
                fullpath = os.path.join(self.cache_path, os.path.basename(f.filename) )
                f.save(fullpath)
            return 'OK'

        @self.route('/delete_image/<path:path>')
        def delete_image(path):
            fullpath = os.path.join(self.cache_path, path)
            print('DELETE: %s'%fullpath)
            if os.path.exists(fullpath):
                os.remove(fullpath)
            return 'OK'
        
        self.settings = settings.Settings()
        @self.route('/settings', methods=['GET', 'POST'])
        def get_set_settings():
            if flask.request.method=='POST':
                self.settings.set_settings(flask.request.get_json(force=True))
                return 'OK'
            elif flask.request.method=='GET':
                return flask.jsonify(self.settings.get_settings_as_dict())
        
        @self.route('/stream')
        def stream():
            def generator():
                message_queue = pubsub.PubSub.subscribe()
                while 1:
                    event, message = message_queue.get()
                    #TODO: make sure message does not contain \n
                    yield f'event:{event}\ndata: {json.dumps(message)}\n\n'
            return flask.Response(generator(), mimetype="text/event-stream")
        
        @self.route('/shutdown')
        def shutdown():
            import signal
            os.kill(os.getpid(), signal.SIGINT)
            return 'OK'
        
        self.route('/process_image/<imagename>')(self.process_image)
        self.route('/training', methods=['POST'])(self.training)
        self.route('/save_model')(self.save_model)

        @self.after_request
        def add_header(r):
            """Prevent caching."""
            r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            r.headers["Pragma"]        = "no-cache"
            r.headers["Expires"]       = "0"
            r.headers['Cache-Control'] = 'public, max-age=0'
            return r


        if not is_debug:
            with self.app_context():
                print('Flask started')
                webbrowser.open('http://localhost:5000', new=2)
    
    def process_image(self, imagename):
        '''Mock processing function. Needs to be re-implemented downstream.'''
        full_path = os.path.join(self.cache_path, imagename)
        if not os.path.exists(full_path):
            flask.abort(404)
        
        print(f'Simulating image processing: {full_path}')
        import time
        for p in range(3):
            #indicate progress to ui
            pubsub.PubSub.publish({'progress':p/3, 'image':imagename, 'description':'Processing...'})
            time.sleep(1)
        pubsub.PubSub.publish({'progress':(p+1)/3, 'image':imagename, 'description':'Processing...'})

        import PIL.Image, numpy as np
        image  = PIL.Image.open(full_path)
        result = np.zeros( image.size[::-1], 'uint8' )
        result[::10] = 255
        result_path  = os.path.join(self.cache_path, imagename+'.segmentation.png')
        PIL.Image.fromarray(result).convert('L').save(result_path)

        return {
            'segmentation'   :   os.path.basename(result_path),
        }
    
    def training(self):
        '''Mock training function. Needs to be re-implemented downstream.'''
        imagefiles = dict(flask.request.form.lists())['filenames[]']
        imagefiles = [os.path.join(self.cache_path, fname) for fname in imagefiles]
        if not all([os.path.exists(fname) for fname in imagefiles]):
            flask.abort(404)
        
        print(f'Simulating training')
        import time
        for p in range(3):
            #indicate progress to ui
            pubsub.PubSub.publish({'progress':p/3,  'description':'Training...'}, event='training')
            time.sleep(1)
        pubsub.PubSub.publish({'progress':(p+1)/3,  'description':'Training...'}, event='training')
        return 'OK'
    
    def save_model(self):
        '''Mock function. Needs to be re-implemented downstream.'''
        print('Saving training model as:',request.args['newname'])
        return 'OK'

    def recompile_static(self, force=False):
        '''Compiles templates into a single HTML file and copies JavaScript files
           into the static folder from which flask serves files'''
        is_debug = any([os.path.exists(f) for f in self.template_folders])
        if not is_debug and not force:
            #only in development and during build, not in release
            return
        
        #clear the folder before copying
        shutil.rmtree(self.static_folder, ignore_errors=True)
        os.makedirs(self.static_folder)
        for source in self.frontend_folders:
            if os.path.abspath(source) != os.path.abspath(self.static_folder):
                #shutil.copytree(source, target)
                copytree(source, self.static_folder)
        
        env   = jinja2.Environment(loader=jinja2.FileSystemLoader(self.template_folders))
        tmpl  = env.get_template('index.html')
        outf  = os.path.join(self.static_folder, 'index.html')
        os.makedirs(os.path.dirname(outf), exist_ok=True)
        open(outf,'w').write(tmpl.render(warning='GENERATED FILE. DO NOT EDIT MANUALLY'))
    
    def setup_cache(self):
        if os.path.exists(self.cache_path):
            shutil.rmtree(self.cache_path)
        os.makedirs(self.cache_path)
        import atexit
        atexit.register(lambda: shutil.rmtree(self.cache_path) if os.path.exists(self.cache_path) else None)
    
    def run(self, parse_args=True, **args):
        if parse_args:
            args = parser.parse_args()
            args = dict(host=args.host, port=args.port, debug=args.debug)
        super().run(**args)


def copytree(source, target):
    '''shutil.copytree() that ignores if target folder exists. (python 3.7)'''
    for f in glob.glob(os.path.join(source, '**'), recursive=True):
        if not os.path.isfile(f):
            continue
        destination = f.replace(source, target)
        if os.path.exists(destination) and os.path.samefile(f,destination):
            continue
        os.makedirs(os.path.dirname(destination), exist_ok=True)
        shutil.copy(f, destination)

