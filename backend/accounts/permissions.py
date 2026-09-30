from rest_framework.permissions import BasePermission


class IsSuperAdmin(BasePermission):
    """
    Permission untuk Super Admin sahaja.
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "super_admin"
        )


class IsAdmin(BasePermission):
    """
    Permission untuk Admin dan Super Admin.
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ["super_admin", "admin"]
        )


class IsParent(BasePermission):
    """
    Permission untuk Parent sahaja.
    """

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "parent"
        )