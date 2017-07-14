#!/bin/bash

# This script is used to install docker client
set -e

DOCKER_VERSION=${DOCKER_VERSION:-1.13.1}
DOCKER_DOWNLOAD_PATH=${DOCKER_DOWNLOAD_PATH:-/docker}

# Some CI service support cache feature.
# If there are cache, just use it and skip downloading.
if [ ! -e "${DOCKER_DOWNLOAD_PATH}" ]; then
    curl -L -o /tmp/docker-${DOCKER_VERSION}.tgz https://get.docker.com/builds/Linux/x86_64/docker-${DOCKER_VERSION}.tgz
    tar -xz -C /tmp -f /tmp/docker-${DOCKER_VERSION}.tgz
    mv /tmp/docker ${DOCKER_DOWNLOAD_PATH}
fi

cp -rf ${DOCKER_DOWNLOAD_PATH}/* /usr/bin

