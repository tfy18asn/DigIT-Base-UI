from . import GLOBALS


def process_image(imagepath, settings):
    with GLOBALS.processing_lock:
        model    = settings.models['detection']
        result   = model.process_image(imagepath)
    return result
