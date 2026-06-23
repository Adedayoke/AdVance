from datetime import date, datetime, timezone

from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from extensions import db
from middleware.rbac import admin_only, client_only, all_roles, get_current_company_id
from models import (
    Campaign,
    CampaignLocation,
    CampaignStatus,
    Location,
    User,
    UserRole,
)
from utils.helpers import save_upload, create_notification, write_audit_log

campaigns_bp = Blueprint("campaigns", __name__, url_prefix="/api/campaigns")


def _parse_campaign_date(value):
    if isinstance(value, date):
        return value
    return date.fromisoformat(str(value))


def _find_location_conflicts(company_id, location_ids, start_date, end_date):
    """Check for date-overlapping campaigns on the given locations within the same company."""
    return (
        db.session.query(
            Location.id,
            Location.name,
            Campaign.id.label("campaign_id"),
            Campaign.title,
            Campaign.start_date,
            Campaign.end_date,
            Campaign.status,
        )
        .join(CampaignLocation, CampaignLocation.location_id == Location.id)
        .join(Campaign, CampaignLocation.campaign_id == Campaign.id)
        .filter(Campaign.company_id == company_id)
        .filter(Location.id.in_(location_ids))
        .filter(Campaign.status.in_([CampaignStatus.SUBMITTED, CampaignStatus.APPROVED, CampaignStatus.ACTIVE]))
        .filter(Campaign.start_date <= end_date)
        .filter(Campaign.end_date >= start_date)
        .all()
    )


# ─────────────────────────────────────────
# CLIENT: SUBMIT A CAMPAIGN
# ─────────────────────────────────────────

@campaigns_bp.route("/", methods=["POST"])
@client_only
def submit_campaign():
    """Submit a new campaign request with creative upload and location booking."""
    client_id  = get_jwt_identity()
    company_id = get_current_company_id()
    data       = request.form if request.form else (request.get_json() or {})

    title        = (data.get("title") or "").strip()
    description  = (data.get("description") or "").strip()
    start_date   = data.get("start_date")
    end_date     = data.get("end_date")
    location_ids = request.form.getlist("location_ids") or data.get("location_ids", [])

    if not title or not start_date or not end_date:
        return jsonify({"error": "title, start_date and end_date are required"}), 400

    if not location_ids:
        return jsonify({"error": "At least one billboard location must be selected"}), 400

    try:
        start_date = _parse_campaign_date(start_date)
        end_date   = _parse_campaign_date(end_date)
    except ValueError:
        return jsonify({"error": "start_date and end_date must be valid ISO dates (YYYY-MM-DD)"}), 400

    if end_date < start_date:
        return jsonify({"error": "end_date must be on or after start_date"}), 400

    # Verify all selected locations belong to this company
    locations_check = Location.query.filter(
        Location.id.in_(location_ids),
        Location.company_id == company_id,
    ).count()
    if locations_check != len(location_ids):
        return jsonify({"error": "One or more selected locations are invalid"}), 400

    conflicting = _find_location_conflicts(company_id, location_ids, start_date, end_date)
    if conflicting:
        return jsonify({
            "error": "One or more selected locations are already booked for overlapping campaign dates",
            "conflicts": [
                {
                    "location_id": str(c.id),
                    "location_name": c.name,
                    "campaign_id": str(c.campaign_id),
                    "campaign_title": c.title,
                    "campaign_status": c.status.value if hasattr(c.status, "value") else c.status,
                    "start_date": c.start_date.isoformat(),
                    "end_date": c.end_date.isoformat(),
                }
                for c in conflicting
            ],
        }), 409

    creative_url      = None
    creative_filename = None
    if "creative" in request.files:
        try:
            creative_url, creative_filename = save_upload(request.files["creative"], "creatives")
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

    try:
        campaign = Campaign(
            company_id=company_id,
            client_id=client_id,
            title=title,
            description=description,
            start_date=start_date,
            end_date=end_date,
            status=CampaignStatus.SUBMITTED,
            creative_url=creative_url,
            creative_filename=creative_filename,
        )
        db.session.add(campaign)
        db.session.flush()

        for loc_id in location_ids:
            db.session.add(CampaignLocation(campaign_id=campaign.id, location_id=loc_id))

        admins = User.query.filter_by(company_id=company_id, role=UserRole.ADMIN, is_active=True).all()
        for admin in admins:
            create_notification(
                user_id=admin.id,
                title="New Campaign Submitted",
                message=f"A new campaign '{title}' has been submitted and is awaiting review.",
                notif_type="campaign_submitted",
                reference_id=campaign.id,
                reference_type="campaign",
            )

        write_audit_log(
            actor_id=client_id,
            action="submit_campaign",
            entity_type="campaigns",
            entity_id=campaign.id,
            new_values={"title": title, "status": "submitted"},
        )
        db.session.commit()

        return jsonify({"message": "Campaign submitted successfully", "campaign": campaign.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────
# ADMIN: LIST ALL CAMPAIGNS (company-scoped)
# ─────────────────────────────────────────

@campaigns_bp.route("/", methods=["GET"])
@admin_only
def list_all_campaigns():
    """List all campaigns for the admin's company."""
    company_id = get_current_company_id()
    status = request.args.get("status")
    try:
        query = (
            db.session.query(Campaign, User.full_name, User.email)
            .join(User, Campaign.client_id == User.id)
            .filter(Campaign.company_id == company_id)
        )
        if status:
            query = query.filter(Campaign.status == status)

        campaigns = []
        for campaign, client_name, client_email in query.order_by(Campaign.submitted_at.desc()).all():
            payload = campaign.to_dict()
            payload["client_name"] = client_name
            payload["client_email"] = client_email
            campaigns.append(payload)
        return jsonify(campaigns), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────
# CLIENT: LIST OWN CAMPAIGNS
# ─────────────────────────────────────────

@campaigns_bp.route("/my", methods=["GET"])
@client_only
def my_campaigns():
    """List the authenticated client's own campaigns."""
    client_id = get_jwt_identity()
    try:
        campaigns = (
            Campaign.query
            .filter_by(client_id=client_id)
            .order_by(Campaign.submitted_at.desc())
            .all()
        )
        return jsonify([c.to_dict() for c in campaigns]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────
# ADMIN: APPROVE
# ─────────────────────────────────────────

@campaigns_bp.route("/<campaign_id>/approve", methods=["PATCH"])
@admin_only
def approve_campaign(campaign_id):
    admin_id   = get_jwt_identity()
    company_id = get_current_company_id()
    try:
        campaign = Campaign.query.filter_by(id=campaign_id, company_id=company_id).first()
        if not campaign:
            return jsonify({"error": "Campaign not found"}), 404

        if campaign.status != CampaignStatus.SUBMITTED:
            return jsonify({"error": "Only submitted campaigns can be approved"}), 400

        campaign.status     = CampaignStatus.APPROVED
        campaign.approved_at = datetime.now(timezone.utc)

        create_notification(
            user_id=campaign.client_id,
            title="Campaign Approved",
            message=f"Your campaign '{campaign.title}' has been approved and is being scheduled.",
            notif_type="campaign_approved",
            reference_id=campaign.id,
            reference_type="campaign",
        )
        write_audit_log(
            actor_id=admin_id,
            action="approve_campaign",
            entity_type="campaigns",
            entity_id=campaign.id,
            old_values={"status": "submitted"},
            new_values={"status": "approved"},
        )
        db.session.commit()
        return jsonify({"message": "Campaign approved successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────
# ADMIN: REJECT
# ─────────────────────────────────────────

@campaigns_bp.route("/<campaign_id>/reject", methods=["PATCH"])
@admin_only
def reject_campaign(campaign_id):
    admin_id   = get_jwt_identity()
    company_id = get_current_company_id()
    data       = request.get_json() or {}
    reason     = (data.get("reason") or "").strip()

    if not reason:
        return jsonify({"error": "A rejection reason is required"}), 400

    try:
        campaign = Campaign.query.filter_by(id=campaign_id, company_id=company_id).first()
        if not campaign:
            return jsonify({"error": "Campaign not found"}), 404

        if campaign.status != CampaignStatus.SUBMITTED:
            return jsonify({"error": "Only submitted campaigns can be rejected"}), 400

        campaign.status           = CampaignStatus.REJECTED
        campaign.rejection_reason = reason

        create_notification(
            user_id=campaign.client_id,
            title="Campaign Rejected",
            message=f"Your campaign '{campaign.title}' was not approved. Reason: {reason}",
            notif_type="campaign_rejected",
            reference_id=campaign.id,
            reference_type="campaign",
        )
        write_audit_log(
            actor_id=admin_id,
            action="reject_campaign",
            entity_type="campaigns",
            entity_id=campaign.id,
            old_values={"status": "submitted"},
            new_values={"status": "rejected", "rejection_reason": reason},
        )
        db.session.commit()
        return jsonify({"message": "Campaign rejected"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────
# ADMIN: MARK COMPLETE
# ─────────────────────────────────────────

@campaigns_bp.route("/<campaign_id>/complete", methods=["PATCH"])
@admin_only
def complete_campaign(campaign_id):
    admin_id   = get_jwt_identity()
    company_id = get_current_company_id()
    try:
        campaign = Campaign.query.filter_by(id=campaign_id, company_id=company_id).first()
        if not campaign:
            return jsonify({"error": "Campaign not found"}), 404

        if campaign.status != CampaignStatus.PENDING_COMPLETION:
            return jsonify({"error": "Only campaigns pending completion can be marked complete"}), 400

        campaign.status = CampaignStatus.COMPLETED

        create_notification(
            user_id=campaign.client_id,
            title="Campaign Completed",
            message=f"Your campaign '{campaign.title}' has been reviewed and marked as completed.",
            notif_type="campaign_completed",
            reference_id=campaign.id,
            reference_type="campaign",
        )
        write_audit_log(
            actor_id=admin_id,
            action="complete_campaign",
            entity_type="campaigns",
            entity_id=campaign.id,
            old_values={"status": "pending_completion"},
            new_values={"status": "completed"},
        )
        db.session.commit()
        return jsonify({"message": "Campaign marked as completed"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────
# CLIENT: CONFIRM COMPLETION
# ─────────────────────────────────────────

@campaigns_bp.route("/<campaign_id>/confirm", methods=["PATCH"])
@client_only
def client_confirm_campaign(campaign_id):
    client_id = get_jwt_identity()
    try:
        campaign = Campaign.query.filter_by(id=campaign_id).first()
        if not campaign:
            return jsonify({"error": "Campaign not found"}), 404

        if str(campaign.client_id) != str(client_id):
            return jsonify({"error": "You are not the owner of this campaign"}), 403

        if campaign.status != CampaignStatus.PENDING_COMPLETION:
            return jsonify({"error": "Only campaigns pending completion can be confirmed"}), 400

        campaign.status = CampaignStatus.COMPLETED

        create_notification(
            user_id=campaign.client_id,
            title="Campaign Completed",
            message=f"You have confirmed completion for campaign '{campaign.title}'.",
            notif_type="campaign_completed",
            reference_id=campaign.id,
            reference_type="campaign",
        )
        write_audit_log(
            actor_id=client_id,
            action="client_confirm_campaign",
            entity_type="campaigns",
            entity_id=campaign.id,
            old_values={"status": "pending_completion"},
            new_values={"status": "completed"},
        )
        db.session.commit()
        return jsonify({"message": "Campaign confirmed as completed"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ─────────────────────────────────────────
# ALL ROLES: GET SINGLE CAMPAIGN DETAIL
# ─────────────────────────────────────────

@campaigns_bp.route("/<campaign_id>", methods=["GET"])
@all_roles
def get_campaign(campaign_id):
    """Return a detailed campaign record. Clients can only see their own campaigns."""
    from middleware.rbac import get_current_role
    user_id    = get_jwt_identity()
    company_id = get_current_company_id()
    try:
        campaign = (
            db.session.query(Campaign, User.full_name, User.email)
            .join(User, Campaign.client_id == User.id)
            .filter(Campaign.id == campaign_id, Campaign.company_id == company_id)
            .first()
        )
        if not campaign:
            return jsonify({"error": "Campaign not found"}), 404

        campaign_obj, client_name, client_email = campaign

        if get_current_role() == "client" and str(campaign_obj.client_id) != str(user_id):
            return jsonify({"error": "Campaign not found"}), 404
        payload = campaign_obj.to_dict()
        payload["client_name"]  = client_name
        payload["client_email"] = client_email

        locations = (
            db.session.query(CampaignLocation, Location)
            .join(Location, CampaignLocation.location_id == Location.id)
            .filter(CampaignLocation.campaign_id == campaign_obj.id)
            .all()
        )
        payload["locations"] = []
        for campaign_location, location in locations:
            loc_payload = location.to_dict()
            loc_payload["campaign_location_id"] = str(campaign_location.id)
            loc_payload["status"] = campaign_location.status.value if hasattr(campaign_location.status, "value") else campaign_location.status
            payload["locations"].append(loc_payload)

        return jsonify(payload), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
