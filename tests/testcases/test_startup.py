import pytest
from base.app import App



@pytest.fixture()
def app():
    app = App()
    app.config.update({
        'TESTING':True,
    })

    yield app
    #clean up here


@pytest.fixture()
def client(app):
    return app.test_client()


def test_request_example(client):
    response = client.get("/")
    assert '200' in response.status
    assert b"<html>" in response.data
    #assert 0




