from collections.abc import Callable
from functools import wraps
from typing import ParamSpec

from django.http import HttpResponseBase

VERCEL_CDN_CACHE_CONTROL = (
    "public, s-maxage=300, stale-while-revalidate=600, stale-if-error=86400"
)
ViewParams = ParamSpec("ViewParams")


def cache_public_catalog_response(
    view_func: Callable[ViewParams, HttpResponseBase],
) -> Callable[ViewParams, HttpResponseBase]:
    @wraps(view_func)
    def wrapped(
        *args: ViewParams.args, **kwargs: ViewParams.kwargs
    ) -> HttpResponseBase:
        response = view_func(*args, **kwargs)
        if response.status_code == 200:
            response["Cache-Control"] = "public, max-age=0, must-revalidate"
            response["Vercel-CDN-Cache-Control"] = VERCEL_CDN_CACHE_CONTROL
        return response

    return wrapped
