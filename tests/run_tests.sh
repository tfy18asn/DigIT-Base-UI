#!/bin/sh



sudo docker run -ti --rm                             \
                -v `pwd`:/root/workspace:ro          \
                -v `pwd`/tests/logs:/root/logs       \
                --network=host                       \
                myseleniumbase                       \
                /root/workspace/tests/docker/entrypoint.sh



