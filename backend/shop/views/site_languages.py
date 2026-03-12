from drf_spectacular.utils import extend_schema
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from shop.serializers import SiteLanguageSettingsSerializer
from shop.services import get_site_languages_settings


class SiteLanguagesView(APIView):
    permission_classes = [permissions.AllowAny]

    @extend_schema(
        operation_id="site_languages", responses=SiteLanguageSettingsSerializer
    )
    def get(self, request):
        serializer = SiteLanguageSettingsSerializer(get_site_languages_settings())
        return Response(serializer.data)
