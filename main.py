print('Base.')


import flask, jinja2
print('Flask:', flask.__version__)
print('Jinja:', jinja2.__version__)




def create_app():
    app = flask.Flask(__name__)
    print('Instance path:', app.instance_path)


    @app.route('/')
    def index():
        return "Hi, I'm Base."

    return app


if __name__ == '__main__':
    create_app().run(port=5001)
