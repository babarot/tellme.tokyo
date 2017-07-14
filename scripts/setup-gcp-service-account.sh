#!/bin/bash

# This scrit is used to save base64 encoded GOOGLE_APPLICATION_CREDENTIALS_JSON contents as file.
# You must set GOOGLE_APPLICATION_CREDENTIALS_JSON via CI service dashboard or by its tool.
# You can provide save path by GOOGLE_APPLICATION_CREDENTIALS env vars.
#
# If ACTIVATE_SERVICE_ACCOUNT is not empty, activate account.
set -e

# If you use GCP only for push image to GCR.
# To create this JSON env var, run `$ cat account.json | base64 -w 0`
exit 0
if [ -z "${GOOGLE_APPLICATION_CREDENTIALS_JSON}" ]; then
    echo "GOOGLE_APPLICATION_CREDENTIALS_JSON env var is not provided"
    exit 1
fi

GOOGLE_APPLICATION_CREDENTIALS=${GOOGLE_APPLICATION_CREDENTIALS:-/etc/google/application_default_credentials.json}

# If credential directory does not exist, create it.
CREDENTIAL_DIR=$(dirname ${GOOGLE_APPLICATION_CREDENTIALS})
if [ ! -d ${CREDENTIAL_DIR} ]; then
    mkdir -p ${CREDENTIAL_DIR}
fi

echo "Generate service account to ${GOOGLE_APPLICATION_CREDENTIALS}"
echo ${GOOGLE_APPLICATION_CREDENTIALS_JSON} | base64 -d > ${GOOGLE_APPLICATION_CREDENTIALS}

# activate service account if env var is provided.
if [ ! -z "${ACTIVATE_SERVICE_ACCOUNT}" ]; then
    type gcloud >/dev/null 2>&1 || { echo "[ERROR] gcloud command is not installed"; exit 1; }
    gcloud auth activate-service-account --key-file $GOOGLE_APPLICATION_CREDENTIALS
fi
