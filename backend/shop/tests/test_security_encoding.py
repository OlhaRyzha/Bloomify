import base64

from django.test import SimpleTestCase

from shop.security.encoding import decode_json_payload, encode_json_payload


class JsonPayloadEncodingTest(SimpleTestCase):
    def test_round_trip_preserves_payload(self):
        payload = {
            "sub": "user-1",
            "email": "olha@example.com",
            "scope": "checkout",
        }

        encoded = encode_json_payload(payload)

        self.assertEqual(decode_json_payload(encoded), payload)

    def test_decode_requires_json_object(self):
        encoded_list_payload = base64.b64encode(b"[]").decode()

        with self.assertRaises(ValueError):
            decode_json_payload(encoded_list_payload)
