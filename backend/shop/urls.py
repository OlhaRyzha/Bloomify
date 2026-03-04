from django.urls import include, path

urlpatterns = [
    path("", include("shop.api.v1.urls")),
]
