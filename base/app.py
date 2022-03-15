import os, sys, shutil, glob
import flask, jinja2

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
        os.path.join(path_to_main_module(), 'templates'),
        os.path.join(path_to_this_module(), 'templates'),
    ]

def get_frontend_folders():
    return [
        os.path.join(path_to_this_module(), 'frontend'),
        os.path.join(path_to_main_module(), 'frontend'),
    ]


class App(flask.Flask):
    def __init__(self, **kw):
        super().__init__(
            __name__, 
            root_path          = path_to_main_module(), 
            static_folder      = get_static_path(), 
            static_url_path    = '/',
            **kw
        )

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
        
        @self.after_request
        def add_header(r):
            """Prevent hashing."""
            r.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            r.headers["Pragma"]        = "no-cache"
            r.headers["Expires"]       = "0"
            r.headers['Cache-Control'] = 'public, max-age=0'
            return r
    

    def recompile_static(self, force=False):
        is_debug = any([os.path.exists(f) for f in self.template_folders])
        if not is_debug and not force:
            #only in development and during build, not in release
            return
        
        #for source in self.static_folders:
        for source in self.frontend_folders:
            if os.path.abspath(source) != os.path.abspath(self.static_folder):
                #shutil.copytree(source, target)
                copytree(source, self.static_folder)
        
        env   = jinja2.Environment(loader=jinja2.FileSystemLoader(self.template_folders))
        tmpl  = env.get_template('index.html')
        outf  = os.path.join(self.static_folder, 'index.html')
        os.makedirs(os.path.dirname(outf), exist_ok=True)
        open(outf,'w').write(tmpl.render(warning='GENERATED FILE. DO NOT EDIT MANUALLY'))


def copytree(source, target):
    '''shutil.copytree() that ignores if target folder exists. (python 3.7)'''
    for f in glob.glob(os.path.join(source, '**'), recursive=True):
        if not os.path.isfile(f):
            continue
        destination = f.replace(source, target)
        os.makedirs(os.path.dirname(destination), exist_ok=True)
        shutil.copy(f, destination)

