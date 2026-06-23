import uuid
from datetime import date, datetime
from decimal import Decimal
from enum import Enum as PyEnum

from sqlalchemy.dialects.postgresql import UUID as PGUUID

from extensions import db


class UserRole(str, PyEnum):
    SUPERADMIN = "superadmin"
    ADMIN = "admin"
    STAFF = "staff"
    CLIENT = "client"


class LocationFormat(str, PyEnum):
    BILLBOARD = "billboard"
    TRANSIT = "transit"
    STREET_FURNITURE = "street_furniture"
    DIGITAL = "digital"


class CampaignStatus(str, PyEnum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    APPROVED = "approved"
    REJECTED = "rejected"
    ACTIVE = "active"
    PENDING_COMPLETION = "pending_completion"
    COMPLETED = "completed"


class CampaignLocationStatus(str, PyEnum):
    PENDING = "pending"
    ASSIGNED = "assigned"
    DEPLOYED = "deployed"
    COMPLETED = "completed"


class TaskStatus(str, PyEnum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


class NotificationType(str, PyEnum):
    CAMPAIGN_SUBMITTED = "campaign_submitted"
    CAMPAIGN_APPROVED = "campaign_approved"
    CAMPAIGN_REJECTED = "campaign_rejected"
    TASK_ASSIGNED = "task_assigned"
    DEPLOYMENT_UPLOADED = "deployment_uploaded"
    CAMPAIGN_COMPLETED = "campaign_completed"


def serialize_value(value):
    if isinstance(value, PyEnum):
        return value.value
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, uuid.UUID):
        return str(value)
    return value


def enum_values(enum_cls):
    return [member.value for member in enum_cls]


class Company(db.Model):
    __tablename__ = "companies"

    id = db.Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.Text, nullable=False)
    slug = db.Column(db.Text, unique=True, nullable=False)
    email = db.Column(db.Text, nullable=False)
    phone = db.Column(db.Text)
    address = db.Column(db.Text)
    logo_url = db.Column(db.Text)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=db.func.now(), onupdate=db.func.now())

    users = db.relationship("User", back_populates="company", foreign_keys="User.company_id")
    locations = db.relationship("Location", back_populates="company")
    campaigns = db.relationship("Campaign", back_populates="company")
    settings = db.relationship("SystemSetting", back_populates="company", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": serialize_value(self.id),
            "name": self.name,
            "slug": self.slug,
            "email": self.email,
            "phone": self.phone,
            "address": self.address,
            "logo_url": self.logo_url,
            "is_active": self.is_active,
            "created_at": serialize_value(self.created_at),
            "updated_at": serialize_value(self.updated_at),
        }


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(PGUUID(as_uuid=True), db.ForeignKey("companies.id", ondelete="CASCADE"), nullable=True)
    full_name = db.Column(db.Text, nullable=False)
    email = db.Column(db.Text, unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    role = db.Column(db.Enum(UserRole, name="user_role", values_callable=enum_values), nullable=False)
    phone = db.Column(db.Text)
    company_name = db.Column(db.Text)  # client's own brand/business name (decorative label)
    profile_picture_url = db.Column(db.Text)
    is_prime_staff = db.Column(db.Boolean, nullable=False, default=False)
    address = db.Column(db.Text)
    department = db.Column(db.Text)
    skills = db.Column(db.Text)
    staff_about = db.Column(db.Text)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=db.func.now(), onupdate=db.func.now())

    company = db.relationship("Company", back_populates="users", foreign_keys=[company_id])
    campaigns = db.relationship("Campaign", back_populates="client")
    assigned_tasks = db.relationship("Task", foreign_keys="Task.assigned_to", back_populates="assignee")
    created_tasks = db.relationship("Task", foreign_keys="Task.assigned_by", back_populates="assigner")
    notifications = db.relationship("Notification", back_populates="user")
    audit_logs = db.relationship("AuditLog", foreign_keys="AuditLog.actor_id", back_populates="actor")
    deployments = db.relationship("Deployment", foreign_keys="Deployment.uploaded_by", back_populates="uploaded_by_user")

    def to_dict(self):
        payload = {
            "id": serialize_value(self.id),
            "company_id": serialize_value(self.company_id),
            "full_name": self.full_name,
            "email": self.email,
            "role": serialize_value(self.role),
            "phone": self.phone,
            "company_name": self.company_name,
            "is_prime_staff": self.is_prime_staff,
            "profile_picture_url": self.profile_picture_url,
            "is_active": self.is_active,
            "created_at": serialize_value(self.created_at),
            "updated_at": serialize_value(self.updated_at),
        }

        if self.role == UserRole.STAFF:
            payload.update({
                "address": self.address,
                "department": self.department,
                "skills": self.skills,
                "staff_about": self.staff_about,
            })

        return payload


class Location(db.Model):
    __tablename__ = "locations"

    id = db.Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(PGUUID(as_uuid=True), db.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.Text, nullable=False)
    address = db.Column(db.Text, nullable=False)
    state = db.Column(db.Text, nullable=False)
    lga = db.Column(db.Text, nullable=False)
    format_type = db.Column(db.Enum(LocationFormat, name="location_format", values_callable=enum_values), nullable=False)
    latitude = db.Column(db.Numeric(10, 7))
    longitude = db.Column(db.Numeric(10, 7))
    photo_url = db.Column(db.Text)
    is_available = db.Column(db.Boolean, nullable=False, default=True)
    daily_rate = db.Column(db.Numeric(12, 2))
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=db.func.now())

    company = db.relationship("Company", back_populates="locations")
    campaign_links = db.relationship("CampaignLocation", back_populates="location")

    def to_dict(self):
        return {
            "id": serialize_value(self.id),
            "company_id": serialize_value(self.company_id),
            "name": self.name,
            "address": self.address,
            "state": self.state,
            "lga": self.lga,
            "format_type": serialize_value(self.format_type),
            "latitude": serialize_value(self.latitude),
            "longitude": serialize_value(self.longitude),
            "photo_url": self.photo_url,
            "is_available": self.is_available,
            "daily_rate": serialize_value(self.daily_rate),
            "created_at": serialize_value(self.created_at),
        }


class Campaign(db.Model):
    __tablename__ = "campaigns"

    id = db.Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(PGUUID(as_uuid=True), db.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    client_id = db.Column(PGUUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.Enum(CampaignStatus, name="campaign_status", values_callable=enum_values), nullable=False, default=CampaignStatus.SUBMITTED)
    creative_url = db.Column(db.Text)
    creative_filename = db.Column(db.Text)
    rejection_reason = db.Column(db.Text)
    submitted_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=db.func.now())
    approved_at = db.Column(db.DateTime(timezone=True))
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=db.func.now(), onupdate=db.func.now())

    company = db.relationship("Company", back_populates="campaigns")
    client = db.relationship("User", back_populates="campaigns")
    locations = db.relationship("CampaignLocation", back_populates="campaign")

    def to_dict(self):
        return {
            "id": serialize_value(self.id),
            "company_id": serialize_value(self.company_id),
            "client_id": serialize_value(self.client_id),
            "title": self.title,
            "description": self.description,
            "start_date": serialize_value(self.start_date),
            "end_date": serialize_value(self.end_date),
            "status": serialize_value(self.status),
            "creative_url": self.creative_url,
            "creative_filename": self.creative_filename,
            "rejection_reason": self.rejection_reason,
            "submitted_at": serialize_value(self.submitted_at),
            "approved_at": serialize_value(self.approved_at),
            "created_at": serialize_value(self.created_at),
            "updated_at": serialize_value(self.updated_at),
        }


class CampaignLocation(db.Model):
    __tablename__ = "campaign_locations"

    id = db.Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_id = db.Column(PGUUID(as_uuid=True), db.ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False)
    location_id = db.Column(PGUUID(as_uuid=True), db.ForeignKey("locations.id", ondelete="RESTRICT"), nullable=False)
    status = db.Column(db.Enum(CampaignLocationStatus, name="campaign_location_status", values_callable=enum_values), nullable=False, default=CampaignLocationStatus.PENDING)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=db.func.now())

    campaign = db.relationship("Campaign", back_populates="locations")
    location = db.relationship("Location", back_populates="campaign_links")
    tasks = db.relationship("Task", back_populates="campaign_location")

    def to_dict(self):
        return {
            "id": serialize_value(self.id),
            "campaign_id": serialize_value(self.campaign_id),
            "location_id": serialize_value(self.location_id),
            "status": serialize_value(self.status),
            "created_at": serialize_value(self.created_at),
        }


class Task(db.Model):
    __tablename__ = "tasks"

    id = db.Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campaign_location_id = db.Column(PGUUID(as_uuid=True), db.ForeignKey("campaign_locations.id", ondelete="CASCADE"), nullable=False)
    assigned_to = db.Column(PGUUID(as_uuid=True), db.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    assigned_by = db.Column(PGUUID(as_uuid=True), db.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    instructions = db.Column(db.Text)
    status = db.Column(db.Enum(TaskStatus, name="task_status", values_callable=enum_values), nullable=False, default=TaskStatus.PENDING)
    assigned_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=db.func.now())
    completed_at = db.Column(db.DateTime(timezone=True))
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=db.func.now())

    campaign_location = db.relationship("CampaignLocation", back_populates="tasks")
    assignee = db.relationship("User", foreign_keys=[assigned_to], back_populates="assigned_tasks")
    assigner = db.relationship("User", foreign_keys=[assigned_by], back_populates="created_tasks")
    deployment = db.relationship("Deployment", back_populates="task", uselist=False)

    def to_dict(self):
        return {
            "id": serialize_value(self.id),
            "campaign_location_id": serialize_value(self.campaign_location_id),
            "assigned_to": serialize_value(self.assigned_to),
            "assigned_by": serialize_value(self.assigned_by),
            "instructions": self.instructions,
            "status": serialize_value(self.status),
            "assigned_at": serialize_value(self.assigned_at),
            "completed_at": serialize_value(self.completed_at),
            "created_at": serialize_value(self.created_at),
        }


class Deployment(db.Model):
    __tablename__ = "deployments"

    id = db.Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id = db.Column(PGUUID(as_uuid=True), db.ForeignKey("tasks.id", ondelete="CASCADE"), unique=True, nullable=False)
    uploaded_by = db.Column(PGUUID(as_uuid=True), db.ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    photo_url = db.Column(db.Text, nullable=False)
    photo_filename = db.Column(db.Text)
    evidence = db.Column(db.JSON)
    confirmed = db.Column(db.Boolean, nullable=False, default=False)
    confirmed_by = db.Column(PGUUID(as_uuid=True))
    confirmed_at = db.Column(db.DateTime(timezone=True))
    latitude = db.Column(db.Numeric(10, 7))
    longitude = db.Column(db.Numeric(10, 7))
    notes = db.Column(db.Text)
    deployed_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=db.func.now())
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=db.func.now())

    task = db.relationship("Task", back_populates="deployment")
    uploaded_by_user = db.relationship("User", foreign_keys=[uploaded_by], back_populates="deployments")

    def to_dict(self):
        return {
            "id": serialize_value(self.id),
            "task_id": serialize_value(self.task_id),
            "uploaded_by": serialize_value(self.uploaded_by),
            "photo_url": self.photo_url,
            "photo_filename": self.photo_filename,
            "evidence": self.evidence or [],
            "confirmed": self.confirmed,
            "confirmed_by": serialize_value(self.confirmed_by),
            "confirmed_at": serialize_value(self.confirmed_at),
            "latitude": serialize_value(self.latitude),
            "longitude": serialize_value(self.longitude),
            "notes": self.notes,
            "deployed_at": serialize_value(self.deployed_at),
            "created_at": serialize_value(self.created_at),
        }


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(PGUUID(as_uuid=True), db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = db.Column(db.Text, nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.Enum(NotificationType, name="notification_type", values_callable=enum_values), nullable=False)
    is_read = db.Column(db.Boolean, nullable=False, default=False)
    reference_id = db.Column(PGUUID(as_uuid=True))
    reference_type = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=db.func.now())

    user = db.relationship("User", back_populates="notifications")

    def to_dict(self):
        return {
            "id": serialize_value(self.id),
            "title": self.title,
            "message": self.message,
            "type": serialize_value(self.type),
            "is_read": self.is_read,
            "reference_id": serialize_value(self.reference_id),
            "reference_type": self.reference_type,
            "created_at": serialize_value(self.created_at),
        }


class AuditLog(db.Model):
    __tablename__ = "audit_logs"

    id = db.Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_id = db.Column(PGUUID(as_uuid=True), db.ForeignKey("users.id", ondelete="SET NULL"))
    action = db.Column(db.Text, nullable=False)
    entity_type = db.Column(db.Text, nullable=False)
    entity_id = db.Column(PGUUID(as_uuid=True))
    old_values = db.Column(db.JSON)
    new_values = db.Column(db.JSON)
    ip_address = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=db.func.now())

    actor = db.relationship("User", back_populates="audit_logs")

    def to_dict(self):
        return {
            "id": serialize_value(self.id),
            "actor_id": serialize_value(self.actor_id),
            "action": self.action,
            "entity_type": self.entity_type,
            "entity_id": serialize_value(self.entity_id),
            "old_values": self.old_values,
            "new_values": self.new_values,
            "ip_address": self.ip_address,
            "created_at": serialize_value(self.created_at),
        }


class SystemSetting(db.Model):
    __tablename__ = "system_settings"
    __table_args__ = (
        db.UniqueConstraint("company_id", "key", name="uq_system_settings_company_key"),
    )

    id = db.Column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(PGUUID(as_uuid=True), db.ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    key = db.Column(db.Text, nullable=False)
    value = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=db.func.now())
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, server_default=db.func.now(), onupdate=db.func.now())

    company = db.relationship("Company", back_populates="settings")

    def to_dict(self):
        return {
            "key": self.key,
            "value": self.value,
            "created_at": serialize_value(self.created_at),
            "updated_at": serialize_value(self.updated_at),
        }
