from django.test import TestCase

from shop.services.site_languages import get_site_languages_settings


class ServicesTest(TestCase):
    def test_get_site_languages_settings_returns_singleton(self):
        first = get_site_languages_settings()
        second = get_site_languages_settings()

        self.assertEqual(first.pk, second.pk)
