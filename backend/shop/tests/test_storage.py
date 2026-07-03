from io import BytesIO
from unittest.mock import MagicMock, patch

from django.test import TestCase, override_settings

from shop.storage import VercelBlobError, VercelBlobStorage

TEST_TOKEN = "vercel_blob_rw_store123_secretpart"
BLOB_URL = (
    "https://examplestore.public.blob.vercel-storage.com/categories/photo-abc123.png"
)


@override_settings(BLOB_READ_WRITE_TOKEN=TEST_TOKEN)
class VercelBlobStorageTest(TestCase):
    def setUp(self):
        self.storage = VercelBlobStorage()

    @patch("shop.storage.requests.put")
    def test_save_uploads_and_returns_absolute_url(self, mock_put):
        response = MagicMock()
        response.ok = True
        response.json.return_value = {
            "pathname": "categories/photo-abc123.png",
            "url": BLOB_URL,
        }
        mock_put.return_value = response

        name = self.storage.save("categories/photo.png", BytesIO(b"img-bytes"))

        self.assertEqual(name, BLOB_URL)
        call = mock_put.call_args
        self.assertIn("categories/photo.png", call.args[0])
        self.assertEqual(
            call.kwargs["headers"]["authorization"], f"Bearer {TEST_TOKEN}"
        )
        self.assertEqual(call.kwargs["headers"]["x-add-random-suffix"], "1")

    @patch("shop.storage.requests.put")
    def test_save_raises_on_http_error(self, mock_put):
        response = MagicMock()
        response.ok = False
        response.status_code = 403
        mock_put.return_value = response

        with self.assertRaises(VercelBlobError):
            self.storage.save("categories/photo.png", BytesIO(b"img"))

    @patch("shop.storage.requests.put")
    def test_save_raises_when_response_has_no_url(self, mock_put):
        response = MagicMock()
        response.ok = True
        response.json.return_value = {"pathname": "categories/photo.png"}
        mock_put.return_value = response

        with self.assertRaises(VercelBlobError):
            self.storage.save("categories/photo.png", BytesIO(b"img"))

    def test_url_passes_through_absolute_urls(self):
        self.assertEqual(self.storage.url(BLOB_URL), BLOB_URL)

    def test_url_returns_relative_path_for_legacy_names(self):
        # Pre-fix records stored only the pathname; the public host is
        # unknowable, so a dead relative path is returned instead of a crash.
        self.assertEqual(self.storage.url("categories/old.png"), "/categories/old.png")

    @patch("shop.storage.requests.post")
    def test_delete_calls_api_with_stored_url(self, mock_post):
        response = MagicMock()
        response.ok = True
        mock_post.return_value = response

        self.storage.delete(BLOB_URL)

        call = mock_post.call_args
        self.assertIn("delete", call.args[0])
        self.assertEqual(call.kwargs["json"]["urls"], [BLOB_URL])

    def test_exists_is_false_because_of_random_suffix(self):
        self.assertFalse(self.storage.exists("anything.png"))

    @override_settings(BLOB_READ_WRITE_TOKEN="")
    def test_missing_token_raises_on_save(self):
        with self.assertRaises(VercelBlobError):
            self.storage.save("categories/photo.png", BytesIO(b"img"))
