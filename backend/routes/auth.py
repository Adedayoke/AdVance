import re
import secrets
import unicodedata

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    get_jwt_identity,
    set_access_cookies,
    unset_jwt_cookies,
)
from extensions import bcrypt, db
from models import Company, User, UserRole, SystemSetting
from middleware.rbac import any_authenticated, admin_only, get_current_company_id
from utils.helpers import save_upload, write_audit_log

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

STAFF_KEY = "staff_registration_key"


# ─── Helpers ────────────────────────────────────────────────────────────────

def _make_token(user):
    return create_access_token(
        identity=str(user.id),
        additional_claims={
            "role": user.role.value if hasattr(user.role, "value") else user.role,
            "company_id": str(user.company_id) if user.company_id else None,
        },
    )


def _user_payload(user):
    return {
        "id": str(user.id),
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role.value if hasattr(user.role, "value") else user.role,
        "phone": user.phone,
        "company_name": user.company_name,
        "profile_picture_url": user.profile_picture_url,
        "company_id": str(user.company_id) if user.company_id else None,
    }


def _generate_slug(name: str) -> str:
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^\w\s-]", "", name.lower())
    slug = re.sub(r"[-\s]+", "-", slug).strip("-")
    return slug[:50] or "agency"


def _unique_slug(name: str) -> str:
    base = _generate_slug(name)
    slug = base
    counter = 1
    while Company.query.filter_by(slug=slug).first():
        slug = f"{base}-{counter}"
        counter += 1
    return slug


def _get_staff_key(company_id):
    row = SystemSetting.query.filter_by(company_id=company_id, key=STAFF_KEY).first()
    return row.value if row and row.value else None


def _set_staff_key(company_id, value: str):
    row = SystemSetting.query.filter_by(company_id=company_id, key=STAFF_KEY).first()
    if row:
        row.value = value
    else:
        db.session.add(SystemSetting(company_id=company_id, key=STAFF_KEY, value=value))


# ─────────────────────────────────────────
# COMPANY / AGENCY REGISTRATION
# Creates the agency company + its first admin user in one step.
# ─────────────────────────────────────────

@auth_bp.route("/register/company", methods=["POST"])
def register_company():
    """Register a new agency and its first admin account. Public endpoint."""
    data = request.get_json() or {}

    company_name   = (data.get("company_name") or "").strip()
    company_email  = (data.get("company_email") or "").strip().lower()
    company_phone  = (data.get("company_phone") or "").strip() or None
    admin_name     = (data.get("admin_name") or "").strip()
    admin_email    = (data.get("admin_email") or "").strip().lower()
    admin_password = data.get("admin_password") or ""

    if not company_name or not company_email or not admin_name or not admin_email or not admin_password:
        return jsonify({"error": "company_name, company_email, admin_name, admin_email and admin_password are required"}), 400

    if len(admin_password) < 8:
        return jsonify({"error": "Admin password must be at least 8 characters"}), 400

    if User.query.filter_by(email=admin_email).first():
        return jsonify({"error": "An account with this admin email already exists"}), 409

    try:
        slug = _unique_slug(company_name)
        company = Company(name=company_name, slug=slug, email=company_email, phone=company_phone)
        db.session.add(company)
        db.session.flush()

        hashed = bcrypt.generate_password_hash(admin_password).decode("utf-8")
        admin = User(
            company_id=company.id,
            full_name=admin_name,
            email=admin_email,
            password_hash=hashed,
            role=UserRole.ADMIN,
        )
        db.session.add(admin)
        db.session.flush()

        write_audit_log(
            actor_id=admin.id,
            action="register_company",
            entity_type="companies",
            entity_id=company.id,
            new_values={"company_name": company_name, "slug": slug, "admin_email": admin_email},
        )
        db.session.commit()

        token = _make_token(admin)
        response = jsonify({
            "message": "Agency registered successfully",
            "company": company.to_dict(),
            "user": _user_payload(admin),
        })
        set_access_cookies(response, token)
        return response, 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────
# CLIENT REGISTRATION (requires agency code / company slug)
# ─────────────────────────────────────────

@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new client under a specific agency. Requires the agency's slug."""
    data = request.get_json() or {}

    full_name    = (data.get("full_name") or "").strip()
    email        = (data.get("email") or "").strip().lower()
    password     = data.get("password") or ""
    phone        = (data.get("phone") or "").strip() or None
    company_name = (data.get("company_name") or "").strip() or None
    company_slug = (data.get("company_slug") or "").strip().lower()

    if not full_name or not email or not password or not company_slug:
        return jsonify({"error": "full_name, email, password and company_slug are required"}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    company = Company.query.filter_by(slug=company_slug).first()
    if not company:
        return jsonify({"error": "Agency not found. Please check the agency code and try again."}), 404

    if not company.is_active:
        return jsonify({"error": "This agency account is currently inactive."}), 403

    hashed = bcrypt.generate_password_hash(password).decode("utf-8")
    try:
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "An account with this email already exists"}), 409

        user = User(
            company_id=company.id,
            full_name=full_name,
            email=email,
            password_hash=hashed,
            role=UserRole.CLIENT,
            phone=phone,
            company_name=company_name,
        )
        db.session.add(user)
        db.session.flush()

        write_audit_log(
            actor_id=user.id,
            action="register",
            entity_type="users",
            entity_id=user.id,
            new_values={"email": email, "role": "client", "company_id": str(company.id)},
        )
        db.session.commit()

        token = _make_token(user)
        response = jsonify({"message": "Registration successful", "user": _user_payload(user)})
        set_access_cookies(response, token)
        return response, 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────
# STAFF SELF-REGISTRATION (via company staff key)
# The staff key implicitly identifies the company — no separate slug needed.
# ─────────────────────────────────────────

@auth_bp.route("/register/staff", methods=["POST"])
def register_staff_with_key():
    """Self-register a staff account using the company's staff onboarding key."""
    data = request.get_json() or {}

    full_name = (data.get("full_name") or "").strip()
    email     = (data.get("email") or "").strip().lower()
    password  = data.get("password") or ""
    phone     = (data.get("phone") or "").strip() or None
    staff_key = (data.get("staff_key") or "").strip()

    if not full_name or not email or not password or not staff_key:
        return jsonify({"error": "full_name, email, password and staff_key are required"}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    # Resolve the company from the key value
    setting = SystemSetting.query.filter_by(key=STAFF_KEY, value=staff_key).first()
    if not setting:
        return jsonify({"error": "Invalid staff onboarding key"}), 401

    company = Company.query.filter_by(id=setting.company_id).first()
    if not company or not company.is_active:
        return jsonify({"error": "This agency account is currently inactive."}), 403

    hashed = bcrypt.generate_password_hash(password).decode("utf-8")
    try:
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "An account with this email already exists"}), 409

        user = User(
            company_id=company.id,
            full_name=full_name,
            email=email,
            password_hash=hashed,
            role=UserRole.STAFF,
            phone=phone,
        )
        db.session.add(user)
        db.session.flush()

        write_audit_log(
            actor_id=user.id,
            action="register_staff_with_key",
            entity_type="users",
            entity_id=user.id,
            new_values={"email": email, "role": "staff", "company_id": str(company.id)},
        )
        db.session.commit()

        token = _make_token(user)
        response = jsonify({"message": "Staff registration successful", "user": _user_payload(user)})
        set_access_cookies(response, token)
        return response, 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────
# INTERNAL REGISTER (admin creates staff/admin within their company)
# ─────────────────────────────────────────

@auth_bp.route("/register/internal", methods=["POST"])
@admin_only
def register_internal():
    """Admin creates a staff or admin account within their own company."""
    admin_id   = get_jwt_identity()
    company_id = get_current_company_id()
    data       = request.get_json() or {}

    full_name = (data.get("full_name") or "").strip()
    email     = (data.get("email") or "").strip().lower()
    password  = data.get("password") or ""
    role      = (data.get("role") or "").strip()
    phone     = (data.get("phone") or "").strip() or None

    if not full_name or not email or not password:
        return jsonify({"error": "full_name, email and password are required"}), 400

    if role not in ("staff", "admin"):
        return jsonify({"error": "Internal registration only supports staff or admin roles"}), 400

    if len(password) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400

    hashed = bcrypt.generate_password_hash(password).decode("utf-8")
    try:
        if User.query.filter_by(email=email).first():
            return jsonify({"error": "An account with this email already exists"}), 409

        user = User(
            company_id=company_id,
            full_name=full_name,
            email=email,
            password_hash=hashed,
            role=UserRole(role),
            phone=phone,
        )
        db.session.add(user)
        db.session.flush()

        write_audit_log(
            actor_id=admin_id,
            action="create_internal_user",
            entity_type="users",
            entity_id=user.id,
            new_values={"email": email, "role": role},
        )
        db.session.commit()

        return jsonify({
            "message": f"{role.capitalize()} account created successfully",
            "user": _user_payload(user),
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────
# STAFF KEY MANAGEMENT (admin-only, scoped to their company)
# ─────────────────────────────────────────

@auth_bp.route("/staff-key", methods=["GET"])
@admin_only
def get_staff_key():
    company_id = get_current_company_id()
    key = _get_staff_key(company_id)
    return jsonify({"staff_key": key, "enabled": bool(key)}), 200


@auth_bp.route("/staff-key/rotate", methods=["POST"])
@admin_only
def rotate_staff_key():
    admin_id   = get_jwt_identity()
    company_id = get_current_company_id()
    new_key    = secrets.token_urlsafe(24)
    try:
        _set_staff_key(company_id, new_key)
        write_audit_log(
            actor_id=admin_id,
            action="rotate_staff_registration_key",
            entity_type="system_settings",
            entity_id=None,
            new_values={"key": STAFF_KEY},
        )
        db.session.commit()
        return jsonify({"staff_key": new_key}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────
# LOGIN
# ─────────────────────────────────────────

@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate a user and set JWT as httpOnly cookie."""
    data     = request.get_json() or {}
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    try:
        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "Invalid email or password"}), 401

        if not user.is_active:
            return jsonify({"error": "This account has been deactivated"}), 403

        if user.company_id:
            company = Company.query.filter_by(id=user.company_id).first()
            if not company or not company.is_active:
                return jsonify({"error": "Your agency account has been suspended. Please contact support."}), 403

        if not bcrypt.check_password_hash(user.password_hash, password):
            return jsonify({"error": "Invalid email or password"}), 401

        token = _make_token(user)
        response = jsonify({"user": _user_payload(user)})
        set_access_cookies(response, token)
        return response, 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────
# LOGOUT
# ─────────────────────────────────────────

@auth_bp.route("/logout", methods=["POST"])
@any_authenticated
def logout():
    response = jsonify({"message": "Logged out successfully"})
    unset_jwt_cookies(response)
    return response, 200


# ─────────────────────────────────────────
# CURRENT USER PROFILE
# ─────────────────────────────────────────

@auth_bp.route("/me", methods=["GET"])
@any_authenticated
def me():
    user_id = get_jwt_identity()
    try:
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify(user.to_dict()), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@auth_bp.route("/me", methods=["PATCH"])
@any_authenticated
def update_profile():
    user_id = get_jwt_identity()
    data    = request.form if request.form else (request.get_json() or {})

    full_name    = (data.get("full_name") or "").strip() or None
    phone        = (data.get("phone") or "").strip() or None
    company_name = (data.get("company_name") or "").strip() or None
    address      = (data.get("address") or "").strip() or None
    department   = (data.get("department") or "").strip() or None
    skills       = (data.get("skills") or "").strip() or None
    staff_about  = (data.get("staff_about") or "").strip() or None
    profile_pic_url = None

    if "profile_picture" in request.files:
        try:
            url, _ = save_upload(request.files["profile_picture"], "profiles")
            profile_pic_url = url
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

    try:
        user = User.query.filter_by(id=user_id).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        if full_name is not None:
            user.full_name = full_name
        if phone is not None:
            user.phone = phone
        if company_name is not None:
            user.company_name = company_name
        if profile_pic_url is not None:
            user.profile_picture_url = profile_pic_url

        if user.role == UserRole.STAFF:
            if address is not None:
                user.address = address
            if department is not None:
                user.department = department
            if skills is not None:
                user.skills = skills
            if staff_about is not None:
                user.staff_about = staff_about

        db.session.commit()
        return jsonify({"message": "Profile updated", "user": user.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
