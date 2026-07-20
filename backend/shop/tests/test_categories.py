from decimal import Decimal

from django.test import TestCase

from shop.models.category import Category, CategoryContentBlock
from shop.tests.factories import create_product

EXPECTED_CDN_CACHE_CONTROL = (
    "public, s-maxage=300, stale-while-revalidate=600, stale-if-error=86400"
)


def assert_cdn_cacheable(test_case: TestCase, response) -> None:
    test_case.assertEqual(
        response["Cache-Control"],
        "public, max-age=0, must-revalidate",
    )
    test_case.assertEqual(
        response["Vercel-CDN-Cache-Control"],
        EXPECTED_CDN_CACHE_CONTROL,
    )


def create_category(
    *,
    slug: str = "wedding",
    kind: str = Category.KIND_CATALOG,
    name: str = "Весільна флористика",
    is_active: bool = True,
    order: int = 0,
) -> Category:
    category: Category = Category.objects.create(
        slug=slug, kind=kind, is_active=is_active, order=order
    )
    category.set_current_language("uk")
    category.name = name
    category.save()
    return category


class CategoryListViewTest(TestCase):
    def test_list_returns_active_categories_in_order(self):
        create_category(slug="second", order=2, name="Друга")
        create_category(slug="first", order=1, name="Перша")
        create_category(slug="hidden", is_active=False, name="Прихована")

        response = self.client.get("/categories")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual([item["slug"] for item in body], ["first", "second"])
        self.assertEqual(body[0]["name"], "Перша")
        self.assertEqual(body[0]["kind"], "catalog")
        assert_cdn_cacheable(self, response)

    def test_list_returns_localized_name(self):
        category = create_category(slug="wedding", name="Весільна флористика")
        category.set_current_language("en")
        category.name = "Wedding floristry"
        category.save()

        response = self.client.get("/categories?lang=en")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()[0]["name"], "Wedding floristry")
        assert_cdn_cacheable(self, response)


class CategoryDetailViewTest(TestCase):
    def test_catalog_category_returns_active_products_only(self):
        category = create_category(slug="wedding")
        active = create_product(price=Decimal("500.00"))
        inactive = create_product(price=Decimal("700.00"))
        inactive.is_active = False
        inactive.save()
        category.products.add(active, inactive)

        response = self.client.get("/categories/wedding")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["kind"], "catalog")
        self.assertEqual(len(body["items"]), 1)
        self.assertEqual(body["items"][0]["id"], str(active.pk))
        self.assertEqual(body["blocks"], [])
        assert_cdn_cacheable(self, response)

    def test_info_category_returns_ordered_blocks(self):
        category = create_category(slug="delivery", kind=Category.KIND_INFO)
        second = CategoryContentBlock.objects.create(
            category=category,
            block_type=CategoryContentBlock.BLOCK_TEXT,
            order=2,
        )
        second.set_current_language("uk")
        second.body = "Текст блоку"
        second.save()
        first = CategoryContentBlock.objects.create(
            category=category,
            block_type=CategoryContentBlock.BLOCK_HEADING,
            order=1,
        )
        first.set_current_language("uk")
        first.title = "Заголовок"
        first.save()

        response = self.client.get("/categories/delivery")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["kind"], "info")
        self.assertEqual(body["items"], [])
        self.assertEqual(
            [block["blockType"] for block in body["blocks"]],
            ["heading", "text"],
        )
        self.assertEqual(body["blocks"][0]["title"], "Заголовок")
        self.assertEqual(body["blocks"][1]["body"], "Текст блоку")

    def test_inactive_category_returns_404(self):
        create_category(slug="hidden", is_active=False)

        response = self.client.get("/categories/hidden")

        self.assertEqual(response.status_code, 404)
        self.assertNotIn("Vercel-CDN-Cache-Control", response)
