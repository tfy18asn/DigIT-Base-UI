from base.app import App

if __name__ == '__main__':
    #App().run(host='kingeider', port=5001)
    App().run(port=5001)



# directory layout
#
#-RootUI/
#   -main.py
#   -build.py
#   -backend/
#       -__init__.py
#       -root_detection.py
#       -root_tracking.py
#   -frontend/
#       -html/                 #jinja templates folder
#           -index.hmtl
#       -js/
#           -root_detection.js
#           -root_tracking.js
#       -css/
#           -??
#   -UI/                       #flask static folder, recompiled dynamically
#       -index.html
#       -...
#   -tests/
#       run_tests.sh
#       -testcases/
#           -test_basic.py
#           ...
#       -assets/
#           -img0.tiff
#       -logs/
#           -codecoverage/
#       -docker/
#           Dockerfile
#           -scripts/
#               -entrypoint.sh
#   -base/                     #submodule
#       -main.py               #minimal, for standalone usage only
#       -backend/
#           ...
#       -frontend/
#           -thirdparty/
#              -jquery.min.js
#              -fomantic/
#           ...
#       -UI/                   #flask static folder
#