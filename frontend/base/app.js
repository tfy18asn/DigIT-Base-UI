


BaseApp = class {
    static Detection       = BaseDetection;
    static Download        = BaseDownload;
    static ViewControls    = ViewControls;
    static Settings        = BaseSettings;
    static FileInput       = BaseFileInput;
    static Training        = BaseTraining;
    static Upload          = BaseUpload;
}


//overwritten downstream
App = BaseApp;
