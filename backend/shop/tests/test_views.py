from django.test import TestCase

from shop.tests.factories import create_product


class ViewsSmokeTest(TestCase):
    def test_view_classes_import(self):
        from shop.views.orders import CheckoutCreateView, LiqPayCallbackView
        from shop.views.products import ProductDetailView, ProductListView
        from shop.views.site_languages import SiteLanguagesView

        self.assertIsNotNone(CheckoutCreateView)
        self.assertIsNotNone(LiqPayCallbackView)
        self.assertIsNotNone(ProductDetailView)
        self.assertIsNotNone(ProductListView)
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


class ProductApiPermissionsTest(TestCase):
    def test_anonymous_cannot_create_product(self):
        response = self.client.post(
            "/products",
            data={"price": "125.00"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 405)

    def test_anonymous_cannot_update_product(self):
        product = create_product()

        response = self.client.patch(
            f"/products/{product.pk}",
            data={"price": "125.00"},
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 405)

    def test_anonymous_cannot_delete_product(self):
        product = create_product()

        response = self.client.delete(f"/products/{product.pk}")

        self.assertEqual(response.status_code, 405)
