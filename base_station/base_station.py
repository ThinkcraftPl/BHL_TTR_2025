#!/usr/bin/env python3
"""
base_station.py

Bridges a WebSocket connection and a serial port so messages received
over the WebSocket are written to serial, and bytes/lines read from
serial are forwarded to the WebSocket.

Usage:
  python3 base_station.py --ws-uri ws://host:port --serial-port /dev/ttyUSB0 --baud 115200

Dependencies: websockets, pyserial
"""
import argparse
import asyncio
import logging
import signal
import sys
from typing import Optional

import serial
import websockets

LOG = logging.getLogger("base_station")


async def serial_writer_task(ser: serial.Serial, q: asyncio.Queue):
    loop = asyncio.get_running_loop()
    while True:
        data = await q.get()
        if data is None:
            LOG.debug("serial_writer_task received shutdown signal")
            return
        if isinstance(data, str):
            payload = data.encode()
        else:
            payload = data
        try:
            # run blocking write in threadpool
            await loop.run_in_executor(None, ser.write, payload)
            LOG.debug("Wrote to serial: %r", payload)
        except Exception:
            LOG.exception("Error writing to serial")


def serial_reader_loop(ser: serial.Serial, q: asyncio.Queue, stop_event: "threading.Event", loop: asyncio.AbstractEventLoop):
    # Blocking loop intended to run in a background thread
    try:
        while not stop_event.is_set():
            try:
                line = ser.readline()
            except Exception:
                LOG.exception("Error reading from serial")
                break
            if not line:
                continue
            data = line.strip('\r\n')
            # Check if it begins with MESSAGE:
            if not data.startswith(b'MESSAGE:'):
                LOG.debug("Ignoring non-message line: %r", data)
                continue
            # Send the data to the queue without MESSAGE: prefix
            text = data[len(b'MESSAGE:'):].decode('utf-8', errors='replace').strip()
            LOG.debug("Read from serial: %r", text)
            if not text:
                LOG.debug("Empty message after stripping, skipping")
                continue
            # Put into asyncio queue in a thread-safe manner
            loop.call_soon_threadsafe(q.put_nowait, text)
    finally:
        LOG.debug("serial_reader_loop exiting")


async def websocket_handler(ws_uri: str, serial_to_ws_q: asyncio.Queue, ws_to_serial_q: asyncio.Queue, stop_event: asyncio.Event):
    backoff = 1.0
    while not stop_event.is_set():
        try:
            LOG.info("Connecting to WebSocket %s", ws_uri)
            async with websockets.connect(ws_uri) as ws:
                LOG.info("WebSocket connected")
                backoff = 1.0

                async def ws_recv_loop():
                    try:
                        async for msg in ws:
                            LOG.debug("Received from ws: %r", msg)
                            await ws_to_serial_q.put(msg)
                    except websockets.ConnectionClosed:
                        LOG.info("WebSocket connection closed (recv)")
                    except Exception:
                        LOG.exception("WebSocket recv error")

                async def ws_send_loop():
                    try:
                        while True:
                            msg = await serial_to_ws_q.get()
                            if msg is None:
                                LOG.debug("ws_send_loop received shutdown")
                                return
                            await ws.send(msg)
                            LOG.debug("Sent to ws: %r", msg)
                    except websockets.ConnectionClosed:
                        LOG.info("WebSocket connection closed (send)")
                    except Exception:
                        LOG.exception("WebSocket send error")

                recv_task = asyncio.create_task(ws_recv_loop())
                send_task = asyncio.create_task(ws_send_loop())

                done, pending = await asyncio.wait([recv_task, send_task], return_when=asyncio.FIRST_COMPLETED)
                for t in pending:
                    t.cancel()
        except Exception:
            LOG.exception("WebSocket connection failed; reconnecting in %s sec", backoff)
            await asyncio.sleep(backoff)
            backoff = min(backoff * 2, 30.0)


import threading


async def main(argv: Optional[list] = None):
    parser = argparse.ArgumentParser(description="Bridge WebSocket and serial port")
    parser.add_argument("--ws-uri", default="ws://localhost:8765", help="WebSocket URI to connect to")
    parser.add_argument("--serial-port", default="/dev/ttyUSB0", help="Serial device path")
    parser.add_argument("--baud", type=int, default=115200, help="Serial baud rate")
    parser.add_argument("--log-level", default="INFO", help="Logging level")
    args = parser.parse_args(argv)

    logging.basicConfig(level=getattr(logging, args.log_level.upper(), logging.INFO), format="%(asctime)s %(levelname)s %(message)s")

    # Queues for cross-task messaging
    serial_to_ws_q = asyncio.Queue()
    ws_to_serial_q = asyncio.Queue()

    # Open serial
    try:
        ser = serial.Serial(args.serial_port, args.baud, timeout=1)
        LOG.info("Opened serial %s @ %s", args.serial_port, args.baud)
    except Exception:
        LOG.exception("Failed to open serial port %s", args.serial_port)
        raise

    # Events to control shutdown
    stop_event = asyncio.Event()
    reader_stop = threading.Event()

    loop = asyncio.get_running_loop()

    # Start blocking serial reader in a background thread
    reader_thread = threading.Thread(target=serial_reader_loop, args=(ser, serial_to_ws_q, reader_stop, loop), daemon=True)
    reader_thread.start()

    # Serial writer task (async)
    writer_task = asyncio.create_task(serial_writer_task(ser, ws_to_serial_q))

    # WebSocket handler
    ws_task = asyncio.create_task(websocket_handler(args.ws_uri, serial_to_ws_q, ws_to_serial_q, stop_event))

    # Graceful shutdown handlers
    def _signal_handler(signame):
        LOG.info("Received signal %s: shutting down", signame)
        reader_stop.set()
        stop_event.set()
        # put None into queues so loops can exit
        loop.call_soon_threadsafe(lambda: serial_to_ws_q.put_nowait(None))
        loop.call_soon_threadsafe(lambda: ws_to_serial_q.put_nowait(None))

    for s in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(s, lambda s=s: _signal_handler(s))
        except NotImplementedError:
            # Some platforms/loop implementations may not support add_signal_handler
            pass

    # Wait for tasks to finish
    await asyncio.wait([writer_task, ws_task], return_when=asyncio.ALL_COMPLETED)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception:
        LOG.exception("Base station exited with error")
        sys.exit(1)
