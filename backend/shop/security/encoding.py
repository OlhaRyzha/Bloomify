import base64
import json

from shop.types import JsonMapping, JsonObject, is_json_object


def encode_json_payload(payload: JsonMapping) -> str:
    encoded_json = json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
    return base64.b64encode(encoded_json.encode()).decode()


def decode_json_payload(data: str) -> JsonObject:
    decoded = base64.b64decode(data).decode()
    payload: object = json.loads(decoded)
    if not is_json_object(payload):
        raise ValueError("Encoded payload must be a JSON object")
    return payload
