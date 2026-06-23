import uuid
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt


def _get_claims():
    return get_jwt()


def get_current_role():
    """Return the role claim from the current JWT."""
    return _get_claims().get("role")


def get_current_company_id():
    """Return the company_id UUID from the current JWT. None for superadmin."""
    company_id = _get_claims().get("company_id")
    if company_id:
        return uuid.UUID(company_id)
    return None


def jwt_required_with_role(*allowed_roles):
    """
    Decorator that verifies a valid JWT is present and that its role claim
    is in the allowed_roles tuple.

    Usage:
        @jwt_required_with_role("admin")
        @jwt_required_with_role("admin", "staff")
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            try:
                verify_jwt_in_request()
            except Exception:
                return jsonify({"error": "Authentication required"}), 401

            role = _get_claims().get("role")
            if role not in allowed_roles:
                return jsonify({
                    "error": "You do not have permission to perform this action"
                }), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator


# Role-specific decorators
superadmin_only  = jwt_required_with_role("superadmin")
admin_only       = jwt_required_with_role("admin")
staff_only       = jwt_required_with_role("staff")
client_only      = jwt_required_with_role("client")
admin_or_staff   = jwt_required_with_role("admin", "staff")
all_roles        = jwt_required_with_role("admin", "staff", "client")
any_authenticated = jwt_required_with_role("superadmin", "admin", "staff", "client")
