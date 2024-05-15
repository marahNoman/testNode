#!/bin/bash -x

SABYPATH=/${HOME}/SabyDemo

echo 'Pull Code From Remote'
git -C ${SABYPATH} pull --no-commit --no-edit

