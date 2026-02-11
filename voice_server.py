import asyncio
import json
import os
import tempfile
import subprocess

import websockets
from vosk import Model, KaldiRecognizer, SetLogLevel

SetLogLevel(-1)

CONFIG_PATH = os.environ.get("VOICE_CONFIG", "voice_config.json")


def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as handle:
        return json.load(handle)


def build_recognizer(model, sample_rate):
    return KaldiRecognizer(model, sample_rate)


def run_piper(text, config):
    piper_path = config.get("piperPath")
    model_path = config.get("piperModelPath")
    model_config = config.get("piperConfigPath")

    if not piper_path or not model_path:
        raise RuntimeError("Piper path or model path is missing in voice_config.json")

    with tempfile.TemporaryDirectory() as tmpdir:
        out_path = os.path.join(tmpdir, "tts.wav")
        args = [piper_path, "-m", model_path, "-f", out_path]
        if model_config:
            args.extend(["-c", model_config])

        subprocess.run(
            args,
            input=text,
            text=True,
            check=True,
            capture_output=True,
        )

        with open(out_path, "rb") as handle:
            return handle.read()


async def handle_client(websocket, model, config):
    recognizer = None
    sample_rate = config.get("sampleRate", 16000)

    async for message in websocket:
        if isinstance(message, (bytes, bytearray)):
            if not recognizer:
                continue
            recognizer.AcceptWaveform(message)
            partial = json.loads(recognizer.PartialResult()).get("partial", "")
            if partial:
                await websocket.send(json.dumps({"type": "partial", "text": partial}))
            continue

        try:
            data = json.loads(message)
        except json.JSONDecodeError:
            await websocket.send(json.dumps({"type": "error", "message": "Invalid JSON"}))
            continue

        msg_type = data.get("type")

        if msg_type == "start":
            recognizer = build_recognizer(model, sample_rate)
            await websocket.send(json.dumps({"type": "ready"}))
            continue

        if msg_type == "end":
            if recognizer:
                final_text = json.loads(recognizer.FinalResult()).get("text", "").strip()
                await websocket.send(json.dumps({"type": "final", "text": final_text}))
            recognizer = None
            continue

        if msg_type == "tts":
            text = (data.get("text") or "").strip()
            if not text:
                await websocket.send(json.dumps({"type": "error", "message": "No TTS text"}))
                continue
            try:
                audio = await asyncio.to_thread(run_piper, text, config)
                await websocket.send(audio)
            except Exception as exc:
                await websocket.send(json.dumps({"type": "error", "message": str(exc)}))
            continue

        if msg_type == "ping":
            await websocket.send(json.dumps({"type": "pong"}))
            continue

        await websocket.send(json.dumps({"type": "error", "message": "Unknown message type"}))


async def main():
    config = load_config()
    model_path = config.get("voskModelPath")
    if not model_path:
        raise RuntimeError("voskModelPath missing in voice_config.json")

    host = config.get("host", "0.0.0.0")
    port = int(config.get("port", 8765))
    sample_rate = config.get("sampleRate", 16000)

    model = Model(model_path)
    print(f"Voice server listening on ws://{host}:{port} at {sample_rate} Hz")

    async with websockets.serve(lambda ws: handle_client(ws, model, config), host, port):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
