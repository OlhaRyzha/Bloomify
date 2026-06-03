from typing import Protocol, cast

from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin
from django.contrib.auth.forms import UserChangeForm
from django.contrib.auth.models import Group, Permission, User
from django.utils.html import conditional_escape, format_html
from django.utils.safestring import SafeString, mark_safe
from django.utils.translation import gettext_lazy as _

from shop.admin.roles import GroupedPermissionsWidget, build_permission_groups
from shop.types import DjangoWidgetAttrs


class FormDataWithGetlist(Protocol):
    def getlist(self, key: str) -> list[str]: ...

    def get(self, key: str, default: object = None) -> object: ...


if User in admin.site._registry:
    admin.site.unregister(User)


class RoleGroupsWidget(forms.Widget):
    groups: list[Group]

    def __init__(self, attrs: DjangoWidgetAttrs | None = None):
        super().__init__(attrs)
        self.groups = []

    def value_from_datadict(self, data, files, name):
        if hasattr(data, "getlist"):
            return cast(FormDataWithGetlist, data).getlist(name)

        value = cast(FormDataWithGetlist, data).get(name, [])
        return value if isinstance(value, list) else [value]

    def render(self, name, value, attrs=None, renderer=None):
        selected_values = {
            str(item.pk if hasattr(item, "pk") else item) for item in value or []
        }
        options = [
            self.render_group_option(name, group, selected_values)
            for group in self.groups
        ]

        return mark_safe(
            '<div class="bloomify-role-multiselect">'
            '<p class="bloomify-role-multiselect__hint">'
            + conditional_escape(
                _(
                    "Select one or more roles. Roles grant their saved permission "
                    "sets to this user."
                )
            )
            + "</p>"
            '<div class="bloomify-role-grid">'
            + "".join(str(option) for option in options)
            + "</div>"
            "</div>"
        )

    def render_group_option(
        self,
        name: str,
        group: Group,
        selected_values: set[str],
    ) -> SafeString:
        return format_html(
            (
                '<label class="bloomify-role-option">'
                '<input type="checkbox" name="{}" value="{}" {}>'
                '<span class="bloomify-role-option__name">{}</span>'
                '<span class="bloomify-role-option__meta">{}</span>'
                "</label>"
            ),
            name,
            int(group.pk),
            mark_safe("checked") if str(int(group.pk)) in selected_values else "",
            group.name,
            _("{count} permissions").format(count=group.permissions.count()),
        )


class UserAdminForm(UserChangeForm):
    class Meta:
        model = User
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        groups = list(Group.objects.order_by("name"))
        permissions = Permission.objects.select_related("content_type").order_by(
            "content_type__app_label",
            "content_type__model",
            "codename",
        )
        groups_field = self.fields["groups"]
        assert isinstance(groups_field, forms.ModelMultipleChoiceField)
        groups_field.queryset = Group.objects.order_by("name")
        groups_field.widget = RoleGroupsWidget()
        groups_field.widget.groups = groups

        permissions_field = self.fields["user_permissions"]
        assert isinstance(permissions_field, forms.ModelMultipleChoiceField)
        permissions_field.queryset = permissions
        permissions_field.widget = GroupedPermissionsWidget()
        permissions_field.widget.grouped_permissions = build_permission_groups(
            permissions
        )


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    form = UserAdminForm
    list_per_page = 20
    filter_horizontal = ()
    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (_("Personal info"), {"fields": ("first_name", "last_name", "email")}),
        (
            _("Access"),
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                ),
                "description": _(
                    "Use roles for common access. Add direct permissions only for "
                    "narrow exceptions."
                ),
            },
        ),
        (_("Important dates"), {"fields": ("last_login", "date_joined")}),
    )
