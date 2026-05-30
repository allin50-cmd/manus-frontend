#!/bin/sh
set -e

mkdir -p /data/voice-agent
chown -R appuser:appuser /data/voice-agent

exec gosu appuser "$@"
