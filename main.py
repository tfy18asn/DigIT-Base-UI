import os, sys, shutil, glob
import flask, jinja2
print('Flask:', flask.__version__)
print('Jinja:', jinja2.__version__)


def path_to_this_module():
    return os.path.dirname(os.path.realpath(__file__))

def path_to_main_module():
    return os.path.dirname(os.path.realpath(sys.modules['__main__'].__file__))

def get_template_folders():
    return [
        os.path.join(path_to_main_module(), 'templates'),
        os.path.join(path_to_this_module(), 'templates'),
    ]

def get_static_folders():
    return [
        os.path.join(path_to_main_module(), 'static'),
        os.path.join(path_to_this_module(), 'static'),
    ]

class App(flask.Flask):
    def __init__(self):
        super().__init__(__name__, root_path=path_to_main_module())

        print('Root path:       ', self.root_path)
        print('Static folder:   ', self.static_folder)
        print()

        self.template_folders = get_template_folders()
        self.static_folders   = get_static_folders()
        print(self.template_folders)
        print(self.static_folders)
        self.recompile_static()

        @self.route('/')
        def index():
            self.recompile_static()
            return self.send_static_file('index.html')
    

    def recompile_static(self):
        #TODO: only in development and during build, not in release
        #TODO: clear folder?
        
        for source in self.static_folders:
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
        shutil.copy(f, f.replace(source, target))


if __name__ == '__main__':
    App().run(host='kingeider', port=5001)

