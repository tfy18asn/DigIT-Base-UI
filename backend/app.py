import os, sys, shutil, glob, tempfile, json, webbrowser
import warnings
warnings.simplefilter('ignore')

import flask, jinja2

import argparse
parser = argparse.ArgumentParser()
parser.add_argument('--host',    type=str, default='localhost')
parser.add_argument('--port',    type=int, default=5000)
parser.add_argument('--debug',   default=sys.argv[0].endswith('.py'))

import backend

from flask import session # For cookies
import uuid
from apscheduler.schedulers.background import BackgroundScheduler

def path_to_this_module():
    return os.path.dirname(os.path.realpath(__file__))

def path_to_main_module():
    path = os.environ.get('ROOT_PATH',None)
    path = path or os.path.dirname(os.path.realpath(sys.modules['__main__'].__file__))
    return path

def get_instance_path():
    path = os.environ.get('INSTANCE_PATH',None)
    return path or path_to_main_module()

def get_static_path():
    #stores compiled html/javascript/etc files
    return os.path.join(get_instance_path(), 'static')

def get_cache_path(tail=''):
    #stores images and other data used for processing
    return os.path.join( get_instance_path(), 'cache',str(session['user']), tail )

def get_models_path():
    #stores pretrained models
    return os.path.join( get_instance_path(), 'models' )

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

def get_image_path():
    return os.path.join(path_to_main_module(),'frontend','TrainingImages')

def update_user_settings(settings):
    # Updates settings stored for user
    session['settings'] = settings.get_settings_as_dict()


class App(flask.Flask):
    def __init__(self, **kw):
        is_debug         = sys.argv[0].endswith('.py')
        is_second_start  = (os.environ.get("WERKZEUG_RUN_MAIN") == 'true')
        do_not_reload    = (os.environ.get('DO_NOT_RELOAD',None) is not None)
        is_reloader      = (is_debug and not is_second_start) and not do_not_reload
        self.is_reloader = is_reloader

        super().__init__(
            'reloader' if is_reloader else __name__,
            root_path          = path_to_main_module(),
            static_folder      = get_static_path(), 
            instance_path      = get_instance_path(),
            #template_folder   = <multiple>                # handled manually
            static_url_path    = '/',
            **kw
        )
        if is_reloader:
            return
        

        self.template_folders = get_template_folders()
        self.frontend_folders = get_frontend_folders()
        print('Root path:       ', self.root_path)
        print('Models path:     ', get_models_path())
        print('Static path:     ', self.static_folder)

        if is_debug:
            print('Template paths:  ', self.template_folders)
            print('Frontend paths:  ', self.frontend_folders)
        print()

        setup_cache('cache')
        self.recompile_static()


        @self.route('/')
        def index():
            self.add_user()
            self.recompile_static()
            return self.send_static_file('index.html')
        
        @self.route('/images/<path:path>')
        def images(path):
            print(f'Download: {get_cache_path(path)}')
            return flask.send_from_directory(get_cache_path(),path)

        @self.route('/file_upload', methods=['POST'])
        def file_upload():
            files = flask.request.files.getlist("files")
            for f in files:
                print('Upload: %s'%f.filename)
                fullpath = get_cache_path(os.path.basename(f.filename) )
                f.save(fullpath)
            return 'OK'

        @self.route('/delete_image/<path:path>')
        def delete_image(path):
            fullpath = get_cache_path(path)
            print('DELETE: %s'%fullpath)
            if os.path.exists(fullpath):
                os.remove(fullpath)
            return 'OK'
        
        self.settings = dict()
        @self.route('/settings', methods=['GET', 'POST'])
        def get_set_settings():
            if flask.request.method=='POST':
                settings = self.get_settings()
                settings.set_settings(flask.request.get_json(force=True))
                session['settings'] = settings.get_settings_as_dict()
                return 'OK'
            elif flask.request.method=='GET':
                return flask.jsonify(session['settings'])

        # Schedule a frequent clearing of cache and settings
        scheduler = BackgroundScheduler()
        scheduler.add_job(func = self.clear_memory, trigger="interval", hours = 24)
        scheduler.start()
        import atexit
        # Shut down the scheduler when exiting the app
        atexit.register(lambda: scheduler.shutdown())
        
        @self.route('/stream')
        def stream():
            def generator():
                message_queue = backend.pubsub.PubSub.subscribe()
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

        @self.route('/clear_cache')
        def clear_cache():
            setup_cache(get_cache_path())
            return 'OK'
        
        self.route('/process_image/<imagename>')(self.process_image)
        self.route('/training', methods=['POST'])(self.training)
        self.route('/save_model', methods=['POST'])(self.save_model)
        self.route('/stop_training')(self.stop_training)

        self.route('/modelinformation_download')(self.modelinformation_download)

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

    def add_user(self):
        # Only add if new user
        if 'user' not in session:
            # Random unique identifier for each user            
            session['user'] = uuid.uuid4() 
        # Reset user settings
        s = backend.settings.Settings()
        session['settings'] = s.get_settings_as_dict()
        self.settings[session['user']] = s
        # Unique cache path for this user
        setup_cache(get_cache_path()) 

    def get_settings(self):
        # Check if user settings already exists 
        if session['user'] not in self.settings:
            # Required incase settings has been cleared
            # Get the users settings
            s = session['settings']
            # Create instance of the users settings
            settings = backend.settings.Settings()
            settings.set_settings(s['settings'])   
            self.settings[session['user']] =  settings
        return self.settings[session['user']]

        
    def clear_memory(self):
        # Clear all user settings stored on server
        for keys in self.settings:
            self.settings.pop(keys)
        # Create a cleared cache folder
        setup_cache('cache') 

    def process_image(self, imagename):
        settings = self.get_settings()
        full_path = get_cache_path(imagename)
        if not os.path.exists(full_path):
            flask.abort(404)
                
        result = backend.processing.process_image(full_path, settings)
        return flask.jsonify(result)
    
    def training(self):
        imagefiles = dict(flask.request.form.lists())['filenames[]']
        imagefiles = [get_cache_path(fname) for fname in imagefiles]
        if not all([os.path.exists(fname) for fname in imagefiles]):
            flask.abort(404)
        settings = self.get_settings()
        model = settings.models['detection']       
        #indicate that the model is not the same as before
        settings.active_models['detection'] = ''
        update_user_settings(settings)
        def on_progress(p):
            backend.pubsub.PubSub.publish({'progress':p,  'description':'Training...'}, event='training')
        ok = model.start_training(imagefiles=[], targetfiles=[], callback=on_progress)
        return 'OK' if ok else 'INTERRUPTED'
    
    def save_model(self):
        requestform  = flask.request.get_json(force=True)
        print(requestform)
        newname    = requestform['newname']
        print('Saving training model as:', newname)
        modeltype = requestform['options']['training_type']
        path      = f'{get_models_path()}/{modeltype}/{newname}'
        settings = self.get_settings()
        settings.models[modeltype].save(path)
        settings.active_models[modeltype] = newname
        update_user_settings(settings)

        # Retrieve information about the saved model from JS given by user
        # make it look better, does not need to get all info one by one?
        info =  requestform['info']
        info['modelname'] = newname
        info['training_images'] =  []
        # Paths to information-directory and for the information file
        path_info  = f'{get_models_path()}/{modeltype}/information'
        path_model_info  = f'{get_models_path()}/{modeltype}/information/{newname}'
        # Check if information directory exist
        if not os.path.exists(path_info):
            # If not, create it
            os.makedirs(path_info)
        # Extract files related to the training of this model
        imagefiles = requestform['filenames']
        fullpaths = [get_cache_path(fname) for fname in imagefiles]
        if not all([os.path.exists(fname) for fname in fullpaths]):
            flask.abort(404)
        ## Save max 2 images per model
        if len(imagefiles)>2:
            imagefiles = imagefiles[0:2]
        ## Save images in folder
        ## Fixme: tiff files needs to be reformated to be shown in browser. 
        if imagefiles[0].endswith('.tiff'):
            import PIL.Image
            for f in imagefiles:
                original = PIL.Image.open(get_cache_path(f))
                file, extension = os.path.splitext(f)
                original.save(os.path.join(get_image_path(),f'{file}.png'), format = 'PNG')
                info['training_images'].append(f'{file}.png')
        else:
            # Save images in a specified folder
            for f in imagefiles:
                # Copy image to folder where it should be stored
                shutil.copy(get_cache_path(f),get_image_path())
                # Add imagefile to list connecting all images to a soil type
                info['training_images'].append(f)
        # Write information to json-file with correct path
        json.dump(info, open(path_model_info,'w'), indent=2) 
        return 'OK'

    def stop_training(self):
        #XXX: brute-force approach to avoid boilerplate code
        settings = self.get_settings()
        for m in settings.models.values():
            if hasattr(m, 'stop_training'):
                m.stop_training()
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


        ## Extract stored model informations in a list
        mypath = f'{get_models_path()}/detection/information'
        onlyfiles = [os.path.join(mypath, f) for f in os.listdir(mypath) if os.path.isfile(os.path.join(mypath, f))]
        Allinfo = []
        for f in onlyfiles:
            Allinfo.append(json.load(open(f,'r')))
        print(Allinfo) 
        ##       
        
        env   = jinja2.Environment(loader=jinja2.FileSystemLoader(self.template_folders))
        tmpl  = env.get_template('index.html')
        outf  = os.path.join(self.static_folder, 'index.html')
        os.makedirs(os.path.dirname(outf), exist_ok=True)
        open(outf,'w', encoding="utf-8").write(tmpl.render(warning='GENERATED FILE. DO NOT EDIT MANUALLY', Allinfo = Allinfo))
    
    def run(self, parse_args=True, **args):
        if parse_args:
            args = parser.parse_args()
            args = dict(host=args.host, port=args.port, debug=args.debug)
        super().run(**args)

    def modelinformation_download(self):
        modeltype = flask.request.args.get('training_type')
        modelname    = flask.request.args.get('modelname')

        path = f'{get_models_path()}/{modeltype}/information/{modelname}'
        if (os.path.exists(path)):
            
            file = open(path, 'r')
            info_dict = json.load(file)
            return flask.jsonify(info_dict)
        else:    
            return 'OK'
            


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

def setup_cache(cache_path):
    shutil.rmtree(cache_path, ignore_errors=True)
    os.makedirs(cache_path)
    import atexit
    atexit.register(lambda: shutil.rmtree(cache_path, ignore_errors=True))
