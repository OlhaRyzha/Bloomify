from django.test import TestCase


class SerializersSmokeTest(TestCase):
    def test_serializers_module_imports(self):
        from shop import serializers  # noqa: F401

        self.assertTrue(True)
