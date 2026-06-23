from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity

from extensions import db
from middleware.rbac import admin_only, superadmin_only, get_current_company_id
from models import Campaign, Company, User, UserRole
from utils.helpers import write_audit_log

companies_bp = Blueprint("companies", __name__, url_prefix="/api/companies")
superadmin_bp = Blueprint("superadmin", __name__, url_prefix="/api/superadmin")


# ═══════════════════════════════════════════════════
# COMPANY PROFILE  (admin manages their own agency)
# ═══════════════════════════════════════════════════

@companies_bp.route("/me", methods=["GET"])
@admin_only
def get_my_company():
    """Return the current admin's company profile."""
    company_id = get_current_company_id()
    company = Company.query.filter_by(id=company_id).first()
    if not company:
        return jsonify({"error": "Company not found"}), 404
    payload = company.to_dict()
    payload["slug"] = company.slug
    return jsonify(payload), 200


@companies_bp.route("/me", methods=["PATCH"])
@admin_only
def update_my_company():
    """Update the current admin's company profile."""
    admin_id   = get_jwt_identity()
    company_id = get_current_company_id()
    data       = request.get_json() or {}

    try:
        company = Company.query.filter_by(id=company_id).first()
        if not company:
            return jsonify({"error": "Company not found"}), 404

        if data.get("name") is not None:
            company.name = data["name"].strip() or company.name
        if data.get("email") is not None:
            company.email = data["email"].strip().lower() or company.email
        if data.get("phone") is not None:
            company.phone = data["phone"].strip() or None
        if data.get("address") is not None:
            company.address = data["address"].strip() or None

        write_audit_log(
            actor_id=admin_id,
            action="update_company",
            entity_type="companies",
            entity_id=company_id,
            new_values={k: v for k, v in data.items() if k in ("name", "email", "phone", "address")},
        )
        db.session.commit()
        return jsonify({"message": "Company updated", "company": company.to_dict()}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════
# PLATFORM SUPERADMIN — cross-company management
# ═══════════════════════════════════════════════════

@superadmin_bp.route("/stats", methods=["GET"])
@superadmin_only
def platform_stats():
    """Platform-wide summary statistics."""
    try:
        return jsonify({
            "total_companies": Company.query.count(),
            "active_companies": Company.query.filter_by(is_active=True).count(),
            "total_users": User.query.filter(User.role != UserRole.SUPERADMIN).count(),
            "total_campaigns": Campaign.query.count(),
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@superadmin_bp.route("/companies", methods=["GET"])
@superadmin_only
def list_companies():
    """List all registered companies with basic stats."""
    try:
        companies = Company.query.order_by(Company.created_at.desc()).all()
        result = []
        for company in companies:
            data = company.to_dict()
            data["user_count"] = User.query.filter_by(company_id=company.id).count()
            data["campaign_count"] = Campaign.query.filter_by(company_id=company.id).count()
            result.append(data)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@superadmin_bp.route("/companies/<company_id>/toggle-active", methods=["PATCH"])
@superadmin_only
def toggle_company_active(company_id):
    """Activate or suspend a company account."""
    actor_id = get_jwt_identity()
    try:
        company = Company.query.filter_by(id=company_id).first()
        if not company:
            return jsonify({"error": "Company not found"}), 404

        company.is_active = not company.is_active
        write_audit_log(
            actor_id=actor_id,
            action="toggle_company_active",
            entity_type="companies",
            entity_id=company_id,
            new_values={"is_active": company.is_active},
        )
        db.session.commit()
        return jsonify({
            "message": f"Company {'activated' if company.is_active else 'suspended'}",
            "company": company.to_dict(),
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
