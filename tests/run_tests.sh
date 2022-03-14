#!/bin/sh



sudo docker run -ti --rm                             \
                -v `pwd`:/root/workspace:ro          \
                -v `pwd`/tests/logs:/root/latest_logs       \
                --network=host                       \
                myseleniumbase                       \
                "source /root/workspace/tests/docker/entrypoint.sh"



