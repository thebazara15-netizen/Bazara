import os

import psycopg


database_url = os.environ.get("REMOTE_DATABASE_URL") or os.environ.get("DATABASE_URL")
if not database_url:
    raise RuntimeError("REMOTE_DATABASE_URL or DATABASE_URL must be set")

with psycopg.connect(database_url) as connection:
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
        print("Database connection succeeded")
