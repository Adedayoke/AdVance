import os
from flask import Flask, jsonify
from flask_cors import CORS
from flasgger import Swagger

from config import Config
from extensions import db, migrate, bcrypt, jwt
from swagger import SWAGGER_CONFIG, SWAGGER_TEMPLATE
from routes.auth import auth_bp
from routes.campaigns import campaigns_bp
from routes.companies import companies_bp, superadmin_bp
from routes.other import (
    locations_bp,
    tasks_bp,
    deployments_bp,
    notifications_bp,
    analytics_bp,
    users_bp,
)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    app.config["JWT_TOKEN_LOCATION"]    = ["cookies"]
    app.config["JWT_COOKIE_SECURE"]     = False  # True in production
    app.config["JWT_COOKIE_CSRF_PROTECT"] = True

    if not app.config.get("SQLALCHEMY_DATABASE_URI"):
        raise RuntimeError(
            "DATABASE_URL is not set. Copy .env.example to .env and add your PostgreSQL connection string."
        )

    CORS(
        app,
        resources={r"/api/*": {"origins": app.config.get("CORS_ORIGINS", [])}},
        supports_credentials=True,
    )
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)
    Swagger(app, config=SWAGGER_CONFIG, template=SWAGGER_TEMPLATE)

    import models  # noqa: F401

    upload_root = app.config.get("UPLOAD_FOLDER", "uploads")
    for subfolder in ("creatives", "deployments", "profiles", "locations"):
        os.makedirs(os.path.join(upload_root, subfolder), exist_ok=True)

    app.register_blueprint(auth_bp)
    app.register_blueprint(campaigns_bp)
    app.register_blueprint(companies_bp)
    app.register_blueprint(superadmin_bp)
    app.register_blueprint(locations_bp)
    app.register_blueprint(tasks_bp)
    app.register_blueprint(deployments_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(users_bp)

    @app.route("/api/health")
    def health():
        return jsonify({"status": "ok", "service": "OOH Campaign Management API"}), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Endpoint not found"}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed"}), 405

    @app.errorhandler(413)
    def file_too_large(e):
        return jsonify({"error": "File exceeds the maximum allowed size of 16MB"}), 413

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
