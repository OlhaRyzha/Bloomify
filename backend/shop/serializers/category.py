from django.utils.translation import get_language
from rest_framework import serializers

from shop.models.category import (
    Category,
    CategoryContentBlock,
    get_category_translation_text,
)
from shop.serializers.product import ProductSerializer


class CategoryListItemSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="pk", read_only=True)
    name = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ("id", "slug", "kind", "name")

    def _language(self) -> str | None:
        request = self.context.get("request")
        if request:
            return request.query_params.get("lang") or get_language()
        return get_language()

    def get_name(self, obj: Category) -> str:
        return get_category_translation_text(
            obj, "name", language_code=self._language()
        )


class CategoryContentBlockSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="pk", read_only=True)
    blockType = serializers.CharField(source="block_type", read_only=True)
    title = serializers.SerializerMethodField()
    body = serializers.SerializerMethodField()
    imageUrl = serializers.SerializerMethodField()

    class Meta:
        model = CategoryContentBlock
        fields = ("id", "blockType", "title", "body", "imageUrl", "order")

    def _language(self) -> str | None:
        request = self.context.get("request")
        if request:
            return request.query_params.get("lang") or get_language()
        return get_language()

    def get_title(self, obj: CategoryContentBlock) -> str:
        return get_category_translation_text(
            obj, "title", language_code=self._language()
        )

    def get_body(self, obj: CategoryContentBlock) -> str:
        return get_category_translation_text(
            obj, "body", language_code=self._language()
        )

    def get_imageUrl(self, obj: CategoryContentBlock) -> str | None:
        if not obj.image:
            return None
        request = self.context.get("request")
        if request:
            return str(request.build_absolute_uri(obj.image.url))
        return str(obj.image.url)


class CategoryDetailSerializer(CategoryListItemSerializer):
    blocks = serializers.SerializerMethodField()
    items = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ("id", "slug", "kind", "name", "blocks", "items")

    def get_blocks(self, obj: Category) -> list[dict]:
        if obj.kind != Category.KIND_INFO:
            return []
        serializer = CategoryContentBlockSerializer(
            obj.blocks.all(), many=True, context=self.context
        )
        return list(serializer.data)

    def get_items(self, obj: Category) -> list[dict]:
        if obj.kind != Category.KIND_CATALOG:
            return []
        products = obj.products.filter(is_active=True)
        serializer = ProductSerializer(products, many=True, context=self.context)
        return list(serializer.data)
