#!/usr/bin/env bash
# Load Vigil into the running IRIS instance, then serve the ward board on port 8000.
# Always exit 0: the public Community image can return a non-fatal session status
# after "halt", and a non-zero hook would otherwise shut IRIS down on first boot.
set +e
iris session IRIS < /home/irisowner/dev/iris.script
if command -v python3 >/dev/null 2>&1; then
  if ! pgrep -f "/home/irisowner/dev/web/server.py" >/dev/null 2>&1; then
    nohup python3 /home/irisowner/dev/web/server.py >/tmp/vigil-web.log 2>&1 &
  fi
fi
exit 0
