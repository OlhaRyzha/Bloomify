from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.models import User

if User in admin.site._registry:
    admin.site.unregister(User)


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_per_page = 20
    filter_horizontal = ("groups", "user_permissions")
