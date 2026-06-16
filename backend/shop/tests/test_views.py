from django.test import TestCase, override_settings

from shop.models.product import Product
from shop.tests.factories import create_product
from shop.views.orders import CheckoutCreateView, LiqPayCallbackView
from shop.views.products import ProductDetailView, ProductFiltersView, ProductListView
from shop.views.site_languages import SiteLanguagesView


def create_translated_product(
    *,
    name: str,
    description: str = "",
    tag: str = "",
    price: str = "100.00",
    language_code: str = "uk",
    is_active: bool = True,
) -> Product:
    product = create_product(price=price, is_active=is_active)
    product.set_current_language(language_code)
    product.name = name
    product.description = description
    product.tag = tag
    product.save()
    return product


class ViewsSmokeTest(TestCase):
    def test_view_classes_import(self):
        self.assertIsNotNone(CheckoutCreateView)
        self.assertIsNotNone(LiqPayCallbackView)
        self.assertIsNotNone(ProductDetailView)
        self.assertIsNotNone(ProductFiltersView)
        self.assertIsNotNone(ProductListView)
        self.assertIsNotNone(SiteLanguagesView)

    def test_favicon_redirects_to_static_asset(self):
        response = self.client.get("/favicon.ico")

        self.assertEqual(response.status_code, 302)
        self.assertEqual(response["Location"], "/static/bloomify/favicon-32.png")

    @override_settings(ENABLE_API_DOCS=True)
    def test_docs_endpoint_available(self):
        response = self.client.get("/docs/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "SwaggerUIBundle")

    @override_settings(ENABLE_API_DOCS=True)
    def test_redoc_endpoint_available(self):
        response = self.client.get("/redoc/")

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "redoc")

    @override_settings(ENABLE_API_DOCS=True)
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


class ProductListApiTest(TestCase):
    def test_products_without_list_params_returns_legacy_array(self):
        create_translated_product(name="Білі троянди", tag="Класика")

        response = self.client.get("/products", {"lang": "uk"})

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertIsInstance(body, list)
        self.assertEqual(body[0]["name"], "Білі троянди")

    def test_products_without_list_params_does_not_duplicate_translated_products(self):
        product = create_translated_product(name="Білі троянди", tag="Класика")
        product.set_current_language("en")
        product.name = "White roses"
        product.description = "White bouquet"
        product.tag = "Classic"
        product.save()

        response = self.client.get("/products", {"lang": "uk"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()), 1)

    def test_products_supports_server_side_pagination_filtering_and_sorting(self):
        create_translated_product(
            name="Білі троянди",
            description="Весільний букет",
            tag="Класика",
            price="300.00",
        )
        create_translated_product(
            name="Червоні троянди",
            description="Романтичний букет",
            tag="Класика",
            price="200.00",
        )
        create_translated_product(
            name="Півонії",
            description="Сезонний букет",
            tag="Сезонні",
            price="100.00",
        )

        response = self.client.get(
            "/products",
            {
                "lang": "uk",
                "page": "1",
                "pageSize": "1",
                "search": "троянди",
                "tag": "Класика",
                "sort": "price-asc",
            },
        )

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["page"], 1)
        self.assertEqual(body["pageSize"], 1)
        self.assertEqual(body["total"], 2)
        self.assertEqual(body["totalPages"], 2)
        self.assertTrue(body["hasNextPage"])
        self.assertEqual(body["nextPage"], 2)
        self.assertEqual(len(body["items"]), 1)
        self.assertEqual(body["items"][0]["name"], "Червоні троянди")

    def test_product_filters_returns_active_tags(self):
        create_translated_product(name="Білі троянди", tag="Класика")
        create_translated_product(name="Червоні троянди", tag="Класика")
        create_translated_product(name="Півонії", tag="Сезонні", is_active=False)

        response = self.client.get("/products/filters", {"lang": "uk"})

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"tags": ["Класика"]},
        )
