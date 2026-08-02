#!/bin/bash -eu

npm install
npm install --save-dev @jazzer.js/core
npm run build

compile_javascript_fuzzer i18n fuzz_index.cjs
