from extensions import db


def get_db_connection():
    raise RuntimeError("Raw PostgreSQL connections have been replaced by SQLAlchemy db.session")


def dict_cursor(conn):
    raise RuntimeError("Raw PostgreSQL cursors have been replaced by SQLAlchemy models")