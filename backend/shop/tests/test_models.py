from django.test import TestCase


class ModelsSmokeTest(TestCase):
    def test_models_module_imports(self):
        from shop import models  # noqa: F401

        self.assertTrue(True)
