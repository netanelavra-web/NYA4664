#!/bin/sh
set -e
MADAF_DIRECT_HANDLER=1 node --test server/tests/commands.emulator.mjs
node --test server/tests/rules.emulator.mjs
node --test server/tests/storage.emulator.mjs
