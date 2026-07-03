"""Vercel Blob storage backend for media uploads.

Vercel serverless functions have a read-only filesystem, so ImageField
uploads crash with OSError errno 30 when using FileSystemStorage. This
backend sends files to Vercel Blob over its REST API instead.

Activated via STORAGES in settings when BLOB_READ_WRITE_TOKEN is set
(Vercel injects it automatically once a Blob store is connected to the
project). Local development keeps the default filesystem storage.
"""

import mimetypes
from io import BytesIO
from typing import IO
from urllib.parse import quote

import requests
from django.conf import settings
from django.core.files.base import File
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible

BLOB_API_BASE = "https://blob.vercel-storage.com"
BLOB_API_VERSION = "7"
REQUEST_TIMEOUT_SECONDS = 30


class VercelBlobError(OSError):
    pass


def _get_token() -> str:
    token = settings.BLOB_READ_WRITE_TOKEN
    if not token:
        raise VercelBlobError("BLOB_READ_WRITE_TOKEN is not configured")
    return str(token)


@deconstructible
class VercelBlobStorage(Storage):
    def _headers(self, extra: dict[str, str] | None = None) -> dict[str, str]:
        headers = {
            "authorization": f"Bearer {_get_token()}",
            "x-api-version": BLOB_API_VERSION,
        }
        if extra:
            headers.update(extra)
        return headers

    def _save(self, name: str, content: IO[bytes]) -> str:
        content_type = mimetypes.guess_type(name)[0] or "application/octet-stream"
        body = content.read()

        response = requests.put(
            f"{BLOB_API_BASE}/{quote(name)}",
            data=body,
            headers=self._headers(
                {
                    "x-content-type": content_type,
                    # Random suffix avoids overwrites without an exists() check.
                    "x-add-random-suffix": "1",
                }
            ),
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        if not response.ok:
            raise VercelBlobError(
                f"Vercel Blob upload failed with HTTP {response.status_code}"
            )

        payload = response.json()
        # Store the absolute URL returned by the API as the file name: the
        # public hostname is store-specific and cannot be derived reliably
        # (token segments do not match the public URL host).
        url = payload.get("url")
        if not isinstance(url, str) or not url.startswith("https://"):
            raise VercelBlobError("Vercel Blob response is missing url")
        return url

    def _open(self, name: str, mode: str = "rb") -> File:
        response = requests.get(self.url(name), timeout=REQUEST_TIMEOUT_SECONDS)
        if not response.ok:
            raise VercelBlobError(
                f"Vercel Blob download failed with HTTP {response.status_code}"
            )
        return File(BytesIO(response.content), name=name)

    def delete(self, name: str) -> None:
        response = requests.post(
            f"{BLOB_API_BASE}/delete",
            json={"urls": [self.url(name)]},
            headers=self._headers({"content-type": "application/json"}),
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        if not response.ok:
            raise VercelBlobError(
                f"Vercel Blob delete failed with HTTP {response.status_code}"
            )

    def exists(self, name: str) -> bool:
        # Uploads use a random suffix, so requested names never collide.
        return False

    def url(self, name: str | None) -> str:
        if not name:
            return ""
        if name.startswith("http://") or name.startswith("https://"):
            return name
        # Legacy records saved before absolute URLs were stored: the public
        # host cannot be derived, so return a dead relative path instead of
        # crashing the API. Re-uploading the file fixes the record.
        return f"/{name}"

    def size(self, name: str) -> int:
        response = requests.head(self.url(name), timeout=REQUEST_TIMEOUT_SECONDS)
        if not response.ok:
            raise VercelBlobError(
                f"Vercel Blob head failed with HTTP {response.status_code}"
            )
        return int(response.headers.get("content-length", "0"))
