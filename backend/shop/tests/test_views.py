from django.test import TestCase


class ViewsSmokeTest(TestCase):
    def test_view_classes_import(self):
        from shop.views.orders import CheckoutCreateView, LiqPayCallbackView
        from shop.views.products import (
            IsAdminOrReadOnly,
            ProductDetailView,
            ProductListCreateView,
        )
        from shop.views.site_languages import SiteLanguagesView

        self.assertIsNotNone(CheckoutCreateView)
        self.assertIsNotNone(IsAdminOrReadOnly)
        self.assertIsNotNone(LiqPayCallbackView)
        self.assertIsNotNone(ProductDetailView)
        self.assertIsNotNone(ProductListCreateView)
        self.assertIsNotNone(SiteLanguagesView)

    def test_favicon_redirects_to_static_asset(self):
        response = self.client.get("/favicon.ico")

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response["Location"], "/static/bloomify/favicon-32.png")

    def test_docs_endpoint_available(self):
        response = self.client.get("/docs/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "SwaggerUIBundle")

    def test_redoc_endpoint_available(self):
        response = self.client.get("/redoc/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "redoc")

    def test_schema_endpoint_available(self):
        response = self.client.get("/schema/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "openapi")
