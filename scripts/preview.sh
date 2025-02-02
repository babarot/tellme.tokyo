#!/bin/bash

if [[ ${1} == "--old" ]]; then
  arg="-t yrryrr -t hugo-shortcode-gallery"
fi

hugo server ${arg}
