from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from shop.models import SiteLanguageSettings
from shop.serializers import SiteLanguageSettingsSerializer


class SiteLanguagesView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        settings_obj, _ = SiteLanguageSettings.objects.get_or_create(pk=1)
        serializer = SiteLanguageSettingsSerializer(settings_obj)
        return Response(serializer.data)
