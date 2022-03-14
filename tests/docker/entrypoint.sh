#!/bin/sh

#MEANT TO BE RUN IN DOCKER

pip install flask coverage

export STATIC_PATH=/root/static
mkdir $STATIC_PATH
export PYTHONPATH=/root/workspace
export ROOT_PATH=/root/workspace/base
coverage run --include=/root/workspace/base/* -m pytest --tb=native --show-capture=all --html=/root/logs/pytest_report.html --self-contained-html
coverage report > /root/logs/coverage_report.txt
coverage html --directory=/root/logs/coverage/

chmod -R a+w logs/*
