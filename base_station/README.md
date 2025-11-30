# base_station bridge

This repository contains `base_station.py`, a small asyncio program that bridges a WebSocket and a serial port.

Quick start

1. Create a virtual environment and install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. Run the bridge (example):

```bash
python3 base_station.py --ws-uri ws://localhost:8765 --serial-port /dev/ttyUSB0 --baud 115200
```

Behavior

- Messages received from the WebSocket are sent to the serial port as bytes (UTF-8 encoded).
- Lines read from the serial port (terminated by LF/CRLF) are forwarded as text messages to the WebSocket.

Notes

- Adjust `--serial-port` and `--baud` for your hardware.
- The script attempts to reconnect the WebSocket with exponential backoff.
