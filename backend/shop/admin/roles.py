from collections import defaultdict
from dataclasses import dataclass
from typing import Protocol, cast

from django import forms
from django.contrib import admin
from django.contrib.auth.admin import GroupAdmin as DjangoGroupAdmin
from django.contrib.auth.models import Group, Permission
from django.utils.html import conditional_escape, format_html
from django.utils.safestring import SafeString, mark_safe
from django.utils.text import capfirst
from django.utils.translation import gettext_lazy as _

from shop.types import DjangoWidgetAttrs


class FormDataWithGetlist(Protocol):
    def getlist(self, key: str) -> list[str]: ...

    def get(self, key: str, default: object = None) -> object: ...


ACTION_LABELS = {
    "view": _("Read"),
    "add": _("Create"),
    "change": _("Edit"),
    "delete": _("Delete"),
}
ACTION_ORDER = {
    "view": 10,
    "add": 20,
    "change": 30,
    "delete": 40,
}
APP_LABELS = {
    "shop": _("Store"),
    "auth": _("Users and access"),
}


@dataclass(frozen=True)
class GroupedPermission:
    action: str
    action_label: str
    description: str
    id: int


@dataclass(frozen=True)
class PermissionGroup:
    app_label: str
    id: str
    title: str
    permissions: list[GroupedPermission]


class GroupedPermissionsWidget(forms.Widget):
    grouped_permissions: list[PermissionGroup]

    def __init__(self, attrs: DjangoWidgetAttrs | None = None):
        super().__init__(attrs)
        self.grouped_permissions = []

    def value_from_datadict(self, data, files, name):
        if hasattr(data, "getlist"):
            return cast(FormDataWithGetlist, data).getlist(name)

        value = cast(FormDataWithGetlist, data).get(name, [])
        return value if isinstance(value, list) else [value]

    def render(self, name, value, attrs=None, renderer=None):
        selected_values = {str(item) for item in value or []}
        groups = [
            self.render_group(name, group, selected_values)
            for group in self.grouped_permissions
        ]

        return mark_safe(
            '<div class="bloomify-permission-matrix">'
            '<p class="bloomify-permission-matrix__hint">'
            + conditional_escape(
                _(
                    "Open a category and choose exactly what this role can do. "
                    "Read is safest; Create/Edit/Delete increase access."
                )
            )
            + "</p>"
            + "".join(groups)
            + "</div>"
        )

    def render_group(
        self,
        name: str,
        group: PermissionGroup,
        selected_values: set[str],
    ) -> SafeString:
        checked_count = sum(
            1
            for permission in group.permissions
            if str(permission.id) in selected_values
        )
        permission_count = len(group.permissions)
        permission_rows = [
            self.render_permission(name, group, permission, selected_values)
            for permission in group.permissions
        ]

        return format_html(
            (
                '<details class="bloomify-permission-group">'
                '<summary class="bloomify-permission-group__summary">'
                "<span>"
                '<span class="bloomify-permission-group__title">{}</span>'
                '<span class="bloomify-permission-group__app">{}</span>'
                "</span>"
                '<span class="bloomify-permission-group__count">{}/{}</span>'
                "</summary>"
                '<label class="bloomify-permission-group__all">'
                '<input type="checkbox" data-bloomify-permission-master="{}">'
                "<span>{}</span>"
                "</label>"
                '<div class="bloomify-permission-grid" data-bloomify-permission-group="{}">'
                "{}"
                "</div>"
                "</details>"
            ),
            group.title,
            group.app_label,
            checked_count,
            permission_count,
            group.id,
            _("Select all in this category"),
            group.id,
            mark_safe("".join(str(row) for row in permission_rows)),
        )

    def render_permission(
        self,
        name: str,
        group: PermissionGroup,
        permission: GroupedPermission,
        selected_values: set[str],
    ) -> SafeString:
        permission_id = f"id_{name}_{permission.id}"

        return format_html(
            (
                '<label class="bloomify-permission-option">'
                '<input id="{}" type="checkbox" name="{}" value="{}" '
                'data-bloomify-permission-child="{}" {}>'
                '<span class="bloomify-permission-option__action">{}</span>'
                '<span class="bloomify-permission-option__description">{}</span>'
                "</label>"
            ),
            permission_id,
            name,
            permission.id,
            group.id,
            mark_safe("checked") if str(permission.id) in selected_values else "",
            permission.action_label,
            permission.description,
        )


class RoleAdminForm(forms.ModelForm):
    permissions = forms.ModelMultipleChoiceField(
        queryset=Permission.objects.none(),
        required=False,
        widget=GroupedPermissionsWidget,
        label=_("Permissions"),
    )

    class Meta:
        model = Group
        fields = ("name", "permissions")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        permissions = Permission.objects.select_related("content_type").order_by(
            "content_type__app_label",
            "content_type__model",
            "codename",
        )
        permissions_field = self.fields["permissions"]
        assert isinstance(permissions_field, forms.ModelMultipleChoiceField)
        permissions_field.queryset = permissions
        permissions_field.widget.grouped_permissions = build_permission_groups(
            permissions
        )


def build_permission_groups(permissions) -> list[PermissionGroup]:
    grouped: dict[tuple[str, str], list[Permission]] = defaultdict(list)

    for permission in permissions:
        grouped[
            (permission.content_type.app_label, permission.content_type.model)
        ].append(permission)

    permission_groups = []

    for (app_label, model_name), model_permissions in grouped.items():
        first_permission = model_permissions[0]
        content_type = first_permission.content_type
        model_class = content_type.model_class()
        model_title = (
            capfirst(model_class._meta.verbose_name_plural)
            if model_class
            else capfirst(content_type.name)
        )
        app_title = APP_LABELS.get(app_label, capfirst(app_label))

        permission_groups.append(
            PermissionGroup(
                app_label=str(app_title),
                id=f"{app_label}-{model_name}",
                title=str(model_title),
                permissions=sorted(
                    [
                        build_grouped_permission(permission, model_name)
                        for permission in model_permissions
                    ],
                    key=lambda item: (
                        ACTION_ORDER.get(item.action, 100),
                        item.action_label,
                    ),
                ),
            )
        )

    return sorted(
        permission_groups,
        key=lambda item: (
            item.app_label != str(APP_LABELS["shop"]),
            item.app_label,
            item.title,
        ),
    )


def build_grouped_permission(
    permission: Permission,
    model_name: str,
) -> GroupedPermission:
    action = permission.codename.removesuffix(f"_{model_name}")
    return GroupedPermission(
        action=action,
        action_label=str(ACTION_LABELS.get(action, capfirst(action))),
        description=permission.name,
        id=int(permission.pk),
    )


if Group in admin.site._registry:
    admin.site.unregister(Group)


@admin.register(Group)
class RoleAdmin(DjangoGroupAdmin):
    form = RoleAdminForm
    list_display = ("name", "permission_count")
    search_fields = ("name",)
    ordering = ("name",)
    filter_horizontal = ()
    fieldsets = (
        (
            None,
            {
                "fields": ("name",),
            },
        ),
        (
            _("Role access"),
            {
                "fields": ("permissions",),
                "description": _(
                    "Use categories to keep roles readable and avoid granting "
                    "broad access by accident."
                ),
            },
        ),
    )

    @admin.display(description=_("Permissions"))
    def permission_count(self, obj: Group) -> str:
        return str(obj.permissions.count())
