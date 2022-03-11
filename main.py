import os
import flask, jinja2
print('Flask:', flask.__version__)
print('Jinja:', jinja2.__version__)




def create_app(template_folders=['templates']):
    app = flask.Flask(__name__, root_path='./')
    print('Root path:       ', app.root_path)
    print('Template folder: ', app.template_folder)
    print('Static folder:   ', app.static_folder)
    print()

    recompile_templates(template_folders)

    @app.route('/')
    def index():
        recompile_templates(template_folders)
        return app.send_static_file('index.html')

    return app


def recompile_templates(template_folders=['templates'], static_folder='static'):
    env   = jinja2.Environment(loader=jinja2.FileSystemLoader(template_folders))
    tmpl  = env.get_template('index.html')
    outf  = os.path.join(static_folder, 'index.html')
    os.makedirs(os.path.dirname(outf), exist_ok=True)
    open(outf,'w').write(tmpl.render())


if __name__ == '__main__':
    create_app().run(port=5001)
