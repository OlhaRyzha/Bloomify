import base64
import json
from typing import Any


def encode_json_payload(payload: dict[str, Any]) -> str:
    encoded_json = json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
    return base64.b64encode(encoded_json.encode()).decode()


def decode_json_payload(data: str) -> dict[str, Any]:
    decoded = base64.b64decode(data).decode()
    payload = json.loads(decoded)
    if not isinstance(payload, dict):
        raise ValueError("Encoded payload must be a JSON object")
    return payload
