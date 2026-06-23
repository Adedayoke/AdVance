from datetime import datetime, timezone

from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import func

from extensions import db
from middleware.rbac import admin_only, staff_only, all_roles, admin_or_staff, get_current_company_id, get_current_role
from models import (
    Campaign,
    CampaignLocation,
    CampaignLocationStatus,
    CampaignStatus,
    Deployment,
    Location,
    Notification,
    Task,
    TaskStatus,
    User,
    UserRole,
    serialize_value,
)
from utils.helpers import save_upload, create_notification, write_audit_log


locations_bp     = Blueprint("locations",     __name__, url_prefix="/api/locations")
tasks_bp         = Blueprint("tasks",         __name__, url_prefix="/api/tasks")
deployments_bp   = Blueprint("deployments",   __name__, url_prefix="/api/deployments")
notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")
analytics_bp     = Blueprint("analytics",     __name__, url_prefix="/api/analytics")
users_bp         = Blueprint("users",         __name__, url_prefix="/api/users")


# ═══════════════════════════════════════════════════
# LOCATIONS
# ═══════════════════════════════════════════════════

@locations_bp.route("/", methods=["GET"])
@all_roles
def list_locations():
    """List all billboard locations for the current user's company."""
    company_id = get_current_company_id()
    locations = (
        Location.query
        .filter_by(company_id=company_id)
        .order_by(Location.state, Location.name)
        .all()
    )
    return jsonify([loc.to_dict() for loc in locations]), 200


@locations_bp.route("/", methods=["POST"])
@admin_only
def create_location():
    """Create a new billboard location for the admin's company."""
    company_id = get_current_company_id()
    data = request.form if request.form else (request.get_json() or {})

    name        = (data.get("name") or "").strip()
    address     = (data.get("address") or "").strip()
    state       = (data.get("state") or "").strip()
    lga         = (data.get("lga") or "").strip()
    format_type = (data.get("format_type") or "").strip()
    daily_rate  = data.get("daily_rate")
    latitude    = data.get("latitude")
    longitude   = data.get("longitude")

    if not name or not address or not state or not lga or not format_type:
        return jsonify({"error": "name, address, state, lga and format_type are required"}), 400

    photo_url = None
    if "photo" in request.files:
        try:
            photo_url, _ = save_upload(request.files["photo"], "locations")
        except ValueError as e:
            return jsonify({"error": str(e)}), 400

    try:
        location = Location(
            company_id=company_id,
            name=name,
            address=address,
            state=state,
            lga=lga,
            format_type=format_type,
            latitude=latitude or None,
            longitude=longitude or None,
            photo_url=photo_url,
            daily_rate=daily_rate or None,
        )
        db.session.add(location)
        db.session.commit()
        return jsonify({"message": "Location created", "location": location.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@locations_bp.route("/<location_id>", methods=["PATCH"])
@admin_only
def update_location(location_id):
    """Update a billboard location belonging to the admin's company."""
    company_id = get_current_company_id()
    data = request.get_json() or {}

    try:
        location = Location.query.filter_by(id=location_id, company_id=company_id).first()
        if not location:
            return jsonify({"error": "Location not found"}), 404

        if data.get("name") is not None:
            location.name = data["name"]
        if data.get("address") is not None:
            location.address = data["address"]
        if data.get("is_available") is not None:
            location.is_available = bool(data["is_available"])
        if data.get("daily_rate") is not None:
            location.daily_rate = data["daily_rate"]

        db.session.commit()
        return jsonify({"message": "Location updated", "location": location.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════
# TASKS
# ═══════════════════════════════════════════════════

@tasks_bp.route("/", methods=["POST"])
@admin_only
def assign_task():
    """Assign a deployment task to a staff member within the admin's company."""
    admin_id   = get_jwt_identity()
    company_id = get_current_company_id()
    data       = request.get_json() or {}

    campaign_location_id = data.get("campaign_location_id")
    assigned_to          = data.get("assigned_to")
    instructions         = (data.get("instructions") or "").strip()

    if not campaign_location_id or not assigned_to:
        return jsonify({"error": "campaign_location_id and assigned_to are required"}), 400

    try:
        staff = User.query.filter_by(id=assigned_to, role=UserRole.STAFF, company_id=company_id).first()
        if not staff:
            return jsonify({"error": "Assigned user must be an active staff member of your company"}), 400

        campaign_location = (
            db.session.query(CampaignLocation)
            .join(Campaign, CampaignLocation.campaign_id == Campaign.id)
            .filter(CampaignLocation.id == campaign_location_id, Campaign.company_id == company_id)
            .first()
        )
        if not campaign_location:
            return jsonify({"error": "Campaign location not found"}), 404

        task = Task(
            campaign_location_id=campaign_location_id,
            assigned_to=assigned_to,
            assigned_by=admin_id,
            instructions=instructions or None,
        )
        db.session.add(task)
        campaign_location.status = CampaignLocationStatus.ASSIGNED

        create_notification(
            user_id=assigned_to,
            title="New Task Assigned",
            message="You have been assigned a new deployment task. Check your dashboard for details.",
            notif_type="task_assigned",
            reference_id=task.id,
            reference_type="task",
        )
        write_audit_log(
            actor_id=admin_id,
            action="assign_task",
            entity_type="tasks",
            entity_id=task.id,
            new_values={"assigned_to": assigned_to, "campaign_location_id": campaign_location_id},
        )
        db.session.commit()
        return jsonify({"message": "Task assigned successfully", "task": task.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@tasks_bp.route("/my", methods=["GET"])
@staff_only
def my_tasks():
    """List tasks assigned to the current staff member."""
    staff_id = get_jwt_identity()
    try:
        rows = (
            db.session.query(Task, Location, Campaign)
            .join(CampaignLocation, Task.campaign_location_id == CampaignLocation.id)
            .join(Location, CampaignLocation.location_id == Location.id)
            .join(Campaign, CampaignLocation.campaign_id == Campaign.id)
            .filter(Task.assigned_to == staff_id)
            .order_by(Task.assigned_at.desc())
            .all()
        )

        tasks = []
        for task, location, campaign in rows:
            payload = task.to_dict()
            payload.update({
                "location_name":    location.name,
                "location_address": location.address,
                "latitude":         serialize_value(location.latitude),
                "longitude":        serialize_value(location.longitude),
                "campaign_title":   campaign.title,
                "start_date":       serialize_value(campaign.start_date),
                "end_date":         serialize_value(campaign.end_date),
                "creative_url":     campaign.creative_url,
            })
            tasks.append(payload)
        return jsonify(tasks), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@tasks_bp.route("/", methods=["GET"])
@admin_only
def list_all_tasks():
    """List all deployment tasks for the admin's company."""
    company_id = get_current_company_id()
    try:
        rows = (
            db.session.query(Task, User, Location, Campaign)
            .join(User, Task.assigned_to == User.id)
            .join(CampaignLocation, Task.campaign_location_id == CampaignLocation.id)
            .join(Location, CampaignLocation.location_id == Location.id)
            .join(Campaign, CampaignLocation.campaign_id == Campaign.id)
            .filter(Campaign.company_id == company_id)
            .order_by(Task.assigned_at.desc())
            .all()
        )

        tasks = []
        for task, staff, location, campaign in rows:
            payload = task.to_dict()
            payload.update({
                "staff_name":     staff.full_name,
                "location_name":  location.name,
                "campaign_title": campaign.title,
            })
            tasks.append(payload)
        return jsonify(tasks), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@tasks_bp.route("/<task_id>/status", methods=["PATCH"])
@admin_or_staff
def update_task_status(task_id):
    """Update the status of a deployment task."""
    data   = request.get_json() or {}
    status = data.get("status")

    if status not in ("pending", "in_progress", "completed"):
        return jsonify({"error": "status must be pending, in_progress, or completed"}), 400

    role    = get_current_role()
    user_id = get_jwt_identity()
    company_id = get_current_company_id()

    try:
        if role == "admin":
            # Admin: task must belong to a campaign in their company
            task = (
                db.session.query(Task)
                .join(CampaignLocation, Task.campaign_location_id == CampaignLocation.id)
                .join(Campaign, CampaignLocation.campaign_id == Campaign.id)
                .filter(Task.id == task_id, Campaign.company_id == company_id)
                .first()
            )
        else:
            # Staff: task must be assigned to them
            task = Task.query.filter_by(id=task_id, assigned_to=user_id).first()

        if not task:
            return jsonify({"error": "Task not found"}), 404

        task.status       = TaskStatus(status)
        task.completed_at = datetime.now(timezone.utc) if status == "completed" else None
        db.session.commit()
        return jsonify({"message": "Task status updated"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════
# DEPLOYMENTS
# ═══════════════════════════════════════════════════

@deployments_bp.route("/", methods=["POST"])
@staff_only
def upload_deployment():
    """Upload proof-of-deployment evidence for an assigned task."""
    staff_id  = get_jwt_identity()
    task_id   = request.form.get("task_id")
    notes     = (request.form.get("notes") or "").strip()
    latitude  = request.form.get("latitude")
    longitude = request.form.get("longitude")

    if not task_id:
        return jsonify({"error": "task_id is required"}), 400

    files = []
    if "photos" in request.files:
        files = request.files.getlist("photos")
    elif "photo" in request.files:
        files = [request.files["photo"]]
    else:
        return jsonify({"error": "At least one deployment photo is required"}), 400

    saved = []
    try:
        for f in files:
            url, filename = save_upload(f, "deployments")
            saved.append({"url": url, "filename": filename})
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    try:
        task_row = (
            db.session.query(Task, Campaign, CampaignLocation)
            .join(CampaignLocation, Task.campaign_location_id == CampaignLocation.id)
            .join(Campaign, CampaignLocation.campaign_id == Campaign.id)
            .filter(Task.id == task_id)
            .first()
        )
        if not task_row:
            return jsonify({"error": "Task not found"}), 404

        task_obj, campaign, campaign_location = task_row

        if str(task_obj.assigned_to) != str(staff_id):
            return jsonify({"error": "You can only upload evidence for tasks assigned to you"}), 403

        first = saved[0] if saved else {"url": None, "filename": None}
        deployment = Deployment(
            task_id=task_obj.id,
            uploaded_by=staff_id,
            photo_url=first.get("url"),
            photo_filename=first.get("filename"),
            evidence=saved,
            latitude=latitude or None,
            longitude=longitude or None,
            notes=notes or None,
        )
        db.session.add(deployment)
        db.session.flush()

        task_obj.status       = TaskStatus.COMPLETED
        task_obj.completed_at = datetime.now(timezone.utc)
        campaign_location.status = CampaignLocationStatus.DEPLOYED

        all_locations = CampaignLocation.query.filter_by(campaign_id=campaign.id).all()
        all_deployed  = all(loc.status == CampaignLocationStatus.DEPLOYED for loc in all_locations)

        if all_deployed and campaign.status not in (CampaignStatus.PENDING_COMPLETION, CampaignStatus.COMPLETED):
            campaign.status = CampaignStatus.PENDING_COMPLETION
            admins = User.query.filter_by(company_id=campaign.company_id, role=UserRole.ADMIN, is_active=True).all()
            for admin in admins:
                create_notification(
                    user_id=admin.id,
                    title="Campaign Ready for Completion Review",
                    message=f"All locations for '{campaign.title}' have been deployed. Review and mark as completed.",
                    notif_type="campaign_submitted",
                    reference_id=campaign.id,
                    reference_type="campaign",
                )

        create_notification(
            user_id=campaign.client_id,
            title="Billboard Deployed",
            message=f"Your campaign '{campaign.title}' has been deployed at one of your selected locations.",
            notif_type="deployment_uploaded",
            reference_id=deployment.id,
            reference_type="deployment",
        )

        uploader = User.query.filter_by(id=staff_id).first()
        if uploader and getattr(uploader, "is_prime_staff", False):
            deployment.confirmed    = True
            deployment.confirmed_by = staff_id
            deployment.confirmed_at = datetime.now(timezone.utc)

            campaign_deployments = (
                db.session.query(Deployment)
                .join(Task, Deployment.task_id == Task.id)
                .join(CampaignLocation, Task.campaign_location_id == CampaignLocation.id)
                .filter(CampaignLocation.campaign_id == campaign.id)
                .all()
            )
            all_confirmed = bool(campaign_deployments) and all(d.confirmed for d in campaign_deployments)
            if all_confirmed:
                campaign.status = CampaignStatus.COMPLETED
                create_notification(
                    user_id=campaign.client_id,
                    title="Campaign Completed",
                    message=f"Your campaign '{campaign.title}' has been auto-confirmed complete by prime staff.",
                    notif_type="campaign_completed",
                    reference_id=campaign.id,
                    reference_type="campaign",
                )
                write_audit_log(
                    actor_id=staff_id,
                    action="auto_complete_campaign",
                    entity_type="campaigns",
                    entity_id=campaign.id,
                    old_values={"status": "pending_completion"},
                    new_values={"status": "completed"},
                )

        write_audit_log(
            actor_id=staff_id,
            action="upload_deployment",
            entity_type="deployments",
            entity_id=deployment.id,
            new_values={"task_id": task_id, "photo_url": first.get("url")},
        )
        db.session.commit()
        return jsonify({"message": "Deployment evidence uploaded successfully", "deployment": deployment.to_dict()}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@deployments_bp.route("/campaign/<campaign_id>", methods=["GET"])
@all_roles
def campaign_deployments(campaign_id):
    """List deployment evidence for a campaign."""
    company_id = get_current_company_id()
    user_id = get_jwt_identity()
    try:
        # Verify campaign belongs to this company first
        campaign = Campaign.query.filter_by(id=campaign_id, company_id=company_id).first()
        if not campaign:
            return jsonify({"error": "Campaign not found"}), 404

        if get_current_role() == "client" and str(campaign.client_id) != str(user_id):
            return jsonify({"error": "Campaign not found"}), 404

        rows = (
            db.session.query(Deployment, User, Location)
            .join(Task, Deployment.task_id == Task.id)
            .join(User, Deployment.uploaded_by == User.id)
            .join(CampaignLocation, Task.campaign_location_id == CampaignLocation.id)
            .join(Location, CampaignLocation.location_id == Location.id)
            .filter(CampaignLocation.campaign_id == campaign_id)
            .order_by(Deployment.deployed_at.desc())
            .all()
        )

        deployments = []
        for deployment, uploader, location in rows:
            payload = deployment.to_dict()
            payload.update({
                "uploaded_by":      uploader.full_name,
                "location_name":    location.name,
                "location_address": location.address,
            })
            deployments.append(payload)
        return jsonify(deployments), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════
# NOTIFICATIONS
# ═══════════════════════════════════════════════════

@notifications_bp.route("/", methods=["GET"])
@all_roles
def get_notifications():
    user_id = get_jwt_identity()
    try:
        notifs = (
            Notification.query
            .filter_by(user_id=user_id)
            .order_by(Notification.created_at.desc())
            .limit(50)
            .all()
        )
        return jsonify([n.to_dict() for n in notifs]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@notifications_bp.route("/<notif_id>/read", methods=["PATCH"])
@all_roles
def mark_read(notif_id):
    user_id = get_jwt_identity()
    try:
        notif = Notification.query.filter_by(id=notif_id, user_id=user_id).first()
        if not notif:
            return jsonify({"error": "Notification not found"}), 404
        notif.is_read = True
        db.session.commit()
        return jsonify({"message": "Notification marked as read"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@notifications_bp.route("/read-all", methods=["PATCH"])
@all_roles
def mark_all_read():
    user_id = get_jwt_identity()
    try:
        Notification.query.filter_by(user_id=user_id).update(
            {Notification.is_read: True}, synchronize_session=False
        )
        db.session.commit()
        return jsonify({"message": "All notifications marked as read"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════
# ANALYTICS
# ═══════════════════════════════════════════════════

@analytics_bp.route("/overview", methods=["GET"])
@admin_only
def overview():
    """Return summary analytics scoped to the admin's company."""
    company_id = get_current_company_id()
    try:
        campaign_stats = db.session.query(
            func.count(Campaign.id).label("total_campaigns"),
            func.count(Campaign.id).filter(Campaign.status == CampaignStatus.SUBMITTED).label("pending_review"),
            func.count(Campaign.id).filter(Campaign.status == CampaignStatus.APPROVED).label("approved"),
            func.count(Campaign.id).filter(Campaign.status == CampaignStatus.ACTIVE).label("active"),
            func.count(Campaign.id).filter(Campaign.status == CampaignStatus.COMPLETED).label("completed"),
            func.count(Campaign.id).filter(Campaign.status == CampaignStatus.REJECTED).label("rejected"),
        ).filter(Campaign.company_id == company_id).one()._mapping

        location_ids_sub = (
            db.session.query(Location.id)
            .filter(Location.company_id == company_id)
            .subquery()
        )
        campaign_ids_sub = (
            db.session.query(Campaign.id)
            .filter(Campaign.company_id == company_id)
            .subquery()
        )
        campaign_location_ids_sub = (
            db.session.query(CampaignLocation.id)
            .filter(CampaignLocation.campaign_id.in_(campaign_ids_sub))
            .subquery()
        )
        task_ids_sub = (
            db.session.query(Task.id)
            .filter(Task.campaign_location_id.in_(campaign_location_ids_sub))
            .subquery()
        )

        task_stats = db.session.query(
            func.count(Task.id).label("total_tasks"),
            func.count(Task.id).filter(Task.status == TaskStatus.PENDING).label("pending_tasks"),
            func.count(Task.id).filter(Task.status == TaskStatus.IN_PROGRESS).label("in_progress_tasks"),
            func.count(Task.id).filter(Task.status == TaskStatus.COMPLETED).label("completed_tasks"),
        ).filter(Task.id.in_(task_ids_sub)).one()._mapping

        location_stats = db.session.query(
            func.count(Location.id).label("total_locations"),
            func.count(Location.id).filter(Location.is_available.is_(True)).label("available_locations"),
            func.count(Location.id).filter(Location.is_available.is_(False)).label("unavailable_locations"),
        ).filter(Location.company_id == company_id).one()._mapping

        user_stats = db.session.query(
            func.count(User.id).filter(User.role == UserRole.CLIENT).label("total_clients"),
            func.count(User.id).filter(User.role == UserRole.STAFF).label("total_staff"),
        ).filter(User.company_id == company_id, User.is_active.is_(True)).one()._mapping

        return jsonify({
            "campaigns": dict(campaign_stats),
            "tasks":     dict(task_stats),
            "locations": dict(location_stats),
            "users":     dict(user_stats),
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ═══════════════════════════════════════════════════
# USER MANAGEMENT
# ═══════════════════════════════════════════════════

@users_bp.route("/", methods=["GET"])
@admin_only
def list_users():
    """List users in the admin's company with optional role filtering."""
    company_id = get_current_company_id()
    role = request.args.get("role")
    try:
        query = User.query.filter_by(company_id=company_id)
        if role:
            query = query.filter(User.role == UserRole(role))
        users = query.order_by(User.created_at.desc()).all()
        return jsonify([u.to_dict() for u in users]), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@users_bp.route("/<user_id>/prime-staff", methods=["PATCH"])
@admin_only
def set_prime_staff(user_id):
    """Set or unset prime staff status for a staff member in the admin's company."""
    admin_id   = get_jwt_identity()
    company_id = get_current_company_id()
    data       = request.get_json(silent=True) or {}

    if "is_prime_staff" not in data:
        return jsonify({"error": "is_prime_staff is required"}), 400

    try:
        user = User.query.filter_by(id=user_id, company_id=company_id).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        if user.role != UserRole.STAFF:
            return jsonify({"error": "Only staff users can be marked as prime staff"}), 400

        old_value     = bool(getattr(user, "is_prime_staff", False))
        new_value     = bool(data.get("is_prime_staff"))
        user.is_prime_staff = new_value

        write_audit_log(
            actor_id=admin_id,
            action="set_prime_staff",
            entity_type="users",
            entity_id=user_id,
            old_values={"is_prime_staff": old_value},
            new_values={"is_prime_staff": new_value},
        )
        db.session.commit()
        return jsonify({
            "message": "Prime staff status updated",
            "user": {"id": str(user.id), "is_prime_staff": user.is_prime_staff},
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@users_bp.route("/<user_id>/toggle-active", methods=["PATCH"])
@admin_only
def toggle_active(user_id):
    """Activate or deactivate a user in the admin's company."""
    admin_id   = get_jwt_identity()
    company_id = get_current_company_id()
    try:
        user = User.query.filter_by(id=user_id, company_id=company_id).first()
        if not user:
            return jsonify({"error": "User not found"}), 404

        user.is_active = not user.is_active
        write_audit_log(
            actor_id=admin_id,
            action="toggle_user_active",
            entity_type="users",
            entity_id=user_id,
            new_values={"is_active": user.is_active},
        )
        db.session.commit()
        return jsonify({
            "message": f"User {'activated' if user.is_active else 'deactivated'}",
            "user": {"id": str(user.id), "full_name": user.full_name, "is_active": user.is_active},
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
