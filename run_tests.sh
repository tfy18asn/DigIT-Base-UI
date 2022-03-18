#!/bin/bash




if [[ $@ = '--build-docker' ]]; then
    echo "Building docker";
    sudo docker build --rm -f tests/docker/Dockerfile -t dig_it_test_docker  ./
    sudo docker image prune -f

elif [[ -z "${DIG_IT_TEST_DOCKER}" ]]; then
    echo "Starting docker"
    if [[ $1 = '--start-only' ]]; then 
        entrypoint="echo"  #nop, prevents double-/bin/bash
    else
        entrypoint="/root/workspace/run_tests.sh $@"
    fi;
    docker_image=${DOCKER_IMAGE:-dig_it_test_docker}

    sudo docker run -ti --rm                                \
                -v `pwd`:/root/workspace:ro                 \
                -v `pwd`/tests/logs:/root/latest_logs       \
                --network=host                              \
                -e STATIC_PATH=/root/static                 \
                -e ROOT_PATH=/root/workspace                \
                -e PYTHONPATH=/root/workspace               \
                $docker_image                               \
                $entrypoint

elif [[ $DIG_IT_TEST_DOCKER=1 ]]; then
    echo "Running tests"
    mkdir $STATIC_PATH
    coverage run --include=/root/workspace/backend/* -m pytest  \
                        --tb=native                             \
                        --disable-warnings --show-capture=all   \
                        --html=/root/latest_logs/pytest_report.html --self-contained-html --pdb $@ \
    && coverage html --directory=/root/latest_logs/coverage/           \
    && coverage report | tee /root/latest_logs/coverage_report.txt     \
    && python3 $(dirname ${BASH_SOURCE:-$0})/tests/generate_js_codecoverage_report.py
fi;


