#!/bin/bash
# Wrapper script to run expo-modules-autolinking and filter npm lifecycle output
npx expo-modules-autolinking "$@" 2>&1 | grep -v "^>" | grep -v "^$" || cat
