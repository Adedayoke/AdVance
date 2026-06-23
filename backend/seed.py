"""
seed.py — AdVance platform seed script
---------------------------------------
Creates the platform superadmin account.
Run once from the backend root directory:

    python seed.py

The superadmin has no company_id — it operates at the platform level and
can view/manage all registered agencies via /dashboard/superadmin.

Individual agencies register themselves via /register/company on the frontend.
"""

import sys
from app import create_app
from extensions import db, bcrypt
from models import User, UserRole


def seed_superadmin(
    full_name: str = "Platform Super Admin",
    email: str = "superadmin@advance.ng",
    password: str = "SuperAdmin@12345",
    phone: str = "+234 800 000 0001",
) -> None:
    app = create_app()

    with app.app_context():
        existing = User.query.filter_by(email=email).first()
        if existing:
            print(f"[seed] Superadmin already exists: {email}")
            print(f"[seed] Role: {existing.role.value}")
            print("[seed] No changes made.")
            return

        hashed = bcrypt.generate_password_hash(password).decode("utf-8")
        superadmin = User(
            full_name=full_name,
            email=email,
            password_hash=hashed,
            role=UserRole.SUPERADMIN,
            phone=phone,
            company_id=None,  # superadmin has no company
            is_active=True,
        )
        db.session.add(superadmin)
        db.session.commit()

        print("=" * 55)
        print("[seed] Platform superadmin created successfully.")
        print(f"       Name    : {full_name}")
        print(f"       Email   : {email}")
        print(f"       Password: {password}")
        print("=" * 55)
        print("[seed] IMPORTANT: Change the password after first login.")
        print("[seed] Agencies register themselves at /register/company.")
        print("=" * 55)


if __name__ == "__main__":
    args = sys.argv[1:]
    kwargs = {}
    if len(args) >= 1:
        kwargs["email"] = args[0]
    if len(args) >= 2:
        kwargs["password"] = args[1]
    if len(args) >= 3:
        kwargs["full_name"] = args[2]

    seed_superadmin(**kwargs)
