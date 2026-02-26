from rest_framework import serializers

from shop.models import Product


class ProductSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="pk", read_only=True)
    price = serializers.FloatField()
    imageUrl = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ("id", "name", "description", "price", "imageUrl", "tag")

    def get_imageUrl(self, obj: Product) -> str | None:
        if not obj.image:
            return None
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url
