import os
import uuid
import cloudinary
import cloudinary.uploader
from flask import current_app
from werkzeug.utils import secure_filename
from extensions import db
from models import Notification, AuditLog


# ─────────────────────────────────────────
# FILE UPLOAD
# ─────────────────────────────────────────

def allowed_file(filename, allowed_extensions=None):
    if allowed_extensions is None:
        allowed_extensions = current_app.config.get(
            "ALLOWED_IMAGE_EXTENSIONS", {"png", "jpg", "jpeg", "webp", "gif"}
        )
    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower() in allowed_extensions
    )


def save_upload(file_storage, subfolder):
    """
    Saves an uploaded file to uploads/<subfolder>/ with a UUID-prefixed
    filename to avoid collisions. Returns the relative URL path.
    """
    if not file_storage or not file_storage.filename:
        return None

    if not allowed_file(file_storage.filename):
        raise ValueError("File type not permitted.")

    original = secure_filename(file_storage.filename)
    extension = original.rsplit(".", 1)[1].lower()
    provider = (current_app.config.get("UPLOAD_PROVIDER", "cloudinary") or "cloudinary").lower()

    if provider == "cloudinary":
        cloud_name = current_app.config.get("CLOUDINARY_CLOUD_NAME")
        api_key = current_app.config.get("CLOUDINARY_API_KEY")
        api_secret = current_app.config.get("CLOUDINARY_API_SECRET")

        if not all([cloud_name, api_key, api_secret]):
            raise ValueError(
                "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET."
            )

        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True,
        )

        base_folder = current_app.config.get("CLOUDINARY_UPLOAD_FOLDER", "ooh_system")
        public_id = f"{base_folder}/{subfolder}/{uuid.uuid4().hex}"

        upload_result = cloudinary.uploader.upload(
            file_storage,
            public_id=public_id,
            resource_type="image",
            overwrite=False,
        )

        secure_url = upload_result.get("secure_url")
        if not secure_url:
            raise ValueError("Cloudinary upload failed.")

        return secure_url, f"{public_id}.{extension}"

    upload_root = current_app.config.get("UPLOAD_FOLDER", "uploads")
    dest_folder = os.path.join(upload_root, subfolder)
    os.makedirs(dest_folder, exist_ok=True)

    unique_name = f"{uuid.uuid4().hex}.{extension}"
    file_storage.save(os.path.join(dest_folder, unique_name))

    return f"/uploads/{subfolder}/{unique_name}", unique_name


# ─────────────────────────────────────────
# NOTIFICATIONS
# ─────────────────────────────────────────

def create_notification(user_id, title, message, notif_type,
                         reference_id=None, reference_type=None):
    """
    Inserts a notification record. Call this inside any route handler
    after the primary operation succeeds, within the same transaction.
    """
    db.session.add(
        Notification(
            user_id=user_id,
            title=title,
            message=message,
            type=notif_type,
            reference_id=reference_id,
            reference_type=reference_type,
        )
    )


# ─────────────────────────────────────────
# AUDIT LOGGING
# ─────────────────────────────────────────

def write_audit_log(actor_id, action, entity_type, entity_id=None,
                    old_values=None, new_values=None, ip_address=None):
    """
    Writes one row to audit_logs. old_values and new_values should be
    plain dicts — psycopg2 will serialise them to JSONB automatically.
    """
    db.session.add(
        AuditLog(
            actor_id=actor_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
        )
    )
