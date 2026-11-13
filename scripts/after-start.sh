#!/usr/bin/env bash
# Load Vigil into the running IRIS instance, then serve the ward board on port 8000.
# Always exit 0 so a non-fatal session status cannot tear the instance down.
#
# The public Community image also tries, after this hook, to create a USER
# namespace through iris.dbapi. That call can fail and would shut IRIS down on
# first boot. Writing iris.init first tells the image to skip that step. We
# already create IRISAPP in merge.cpf and do not need the USER namespace.
set +e
INSTALLDIR="${ISC_PACKAGE_INSTALLDIR:-/usr/irissys}"
if [ ! -s "$INSTALLDIR/iris.init" ]; then
  date > "$INSTALLDIR/iris.init" 2>/dev/null || true
fi
iris session IRIS < /home/irisowner/dev/iris.script
if command -v python3 >/dev/null 2>&1; then
  if ! pgrep -f "/home/irisowner/dev/web/server.py" >/dev/null 2>&1; then
    nohup python3 /home/irisowner/dev/web/server.py >/tmp/vigil-web.log 2>&1 &
  fi
fi
exit 0
