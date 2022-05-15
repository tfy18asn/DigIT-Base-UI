import threading

class GLOBALS:
    processing_lock = threading.RLock()

