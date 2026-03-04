from django.test import TestCase


class ViewsSmokeTest(TestCase):
    def test_views_module_imports(self):
        from shop import views  # noqa: F401

        self.assertTrue(True)
