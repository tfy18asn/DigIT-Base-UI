import os, sys, shutil, glob, tempfile
import flask, jinja2

import argparse
parser = argparse.ArgumentParser()
parser.add_argument('--host',    type=str, default='localhost')
parser.add_argument('--port',    type=int, default=5000)
parser.add_argument('--debug',   default=sys.argv[0].endswith('.py'))

from . import settings


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

        super().__init__(
            'reloader' if is_reloader else __name__,
            root_path          = path_to_main_module(),    #TODO? os.chdir()
            static_folder      = get_static_path(), 
            static_url_path    = '/',
            **kw
        )
        if is_reloader:
            return

        #TODO: make this a cache folder inside the main folder
        TEMPPREFIX = 'DigIT_UI_'
        TEMPFOLDER = tempfile.TemporaryDirectory(prefix=TEMPPREFIX)
        print('Temporary folder: %s'%TEMPFOLDER.name)
        #delete all previous temporary folders if not cleaned up properly
        for tmpdir in glob.glob( os.path.join(os.path.dirname(TEMPFOLDER.name), TEMPPREFIX+'*') ):
            if tmpdir != TEMPFOLDER.name:
                print('Removing ',tmpdir)
                shutil.rmtree(tmpdir)
        

        print('Root path:       ', self.root_path)
        print('Static folder:   ', self.static_folder)
        print()

        self.template_folders = get_template_folders()
        self.frontend_folders = get_frontend_folders()
        print(self.template_folders)
        print(self.frontend_folders)
        self.recompile_static()

        @self.route('/')
        def index():
            self.recompile_static()
            return self.send_static_file('index.html')
        
        @self.route('/images/<path:path>')
        def images(path):
            print(f'Download: {os.path.join(TEMPFOLDER.name, path)}')
            return flask.send_from_directory(TEMPFOLDER.name, path)

        @self.route('/file_upload', methods=['POST'])
        def file_upload():
            files = flask.request.files.getlist("files")
            for f in files:
                print('Upload: %s'%f.filename)
                fullpath = os.path.join(TEMPFOLDER.name, os.path.basename(f.filename) )
                f.save(fullpath)
            return 'OK'

        @self.route('/delete_image/<path:path>')
        def delete_image(path):
            fullpath = os.path.join(TEMPFOLDER.name, path)
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
                return flask.jsonify(self.settings.get_settings())
        
        self.route('/process_image/<image>')(self.process_image)
        
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
    
    def process_image(self, image):
        print(f'Simulating image processing: {image}')
        import time
        time.sleep(3)
        return 'OK'

    def recompile_static(self, force=False):
        is_debug = any([os.path.exists(f) for f in self.template_folders])
        if not is_debug and not force:
            #only in development and during build, not in release
            return
        
        for source in self.frontend_folders:
            if os.path.abspath(source) != os.path.abspath(self.static_folder):
                #shutil.copytree(source, target)
                copytree(source, self.static_folder)
        
        env   = jinja2.Environment(loader=jinja2.FileSystemLoader(self.template_folders))
        tmpl  = env.get_template('index.html')
        outf  = os.path.join(self.static_folder, 'index.html')
        os.makedirs(os.path.dirname(outf), exist_ok=True)
        open(outf,'w').write(tmpl.render(warning='GENERATED FILE. DO NOT EDIT MANUALLY'))
    
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

