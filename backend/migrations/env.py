import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool, text
from alembic import context

# Add src to sys.path to allow imports
sys.path.append(os.path.join(os.getcwd(), "src"))
from src.db.database import Base, DATABASE_URL
from src import models  # Ensure models are registered

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = DATABASE_URL
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    from sqlalchemy import create_engine
    connectable = create_engine(DATABASE_URL, poolclass=pool.NullPool)

    def include_object(object, name, type_, reflected, compare_to):
        if type_ == "table" and name == "alembic_version":
            return False
        return True

    with connectable.connect() as connection:
        # 1. Run migrations for 'public' schema
        print("Running migrations for schema: public")
        connection.execute(text("SET search_path TO public"))
        # Commit the search path change if necessary
        connection.commit()

        context.configure(
            connection=connection, 
            target_metadata=target_metadata,
            include_object=include_object,
        )
        with context.begin_transaction():
            context.run_migrations()

        # 2. Run migrations for each tenant schema
        schemas = []
        try:
            # Re-read connection for tenants
            result = connection.execute(text("SELECT schema_name FROM public.tenants WHERE is_active = True"))
            schemas = [row[0] for row in result]
        except Exception as e:
            print(f"Note: Public tenants table not ready ({e}). Skipping tenant migrations.")

        for schema in schemas:
            print(f"Running migrations for schema: {schema}")
            connection.execute(text(f"SET search_path TO {schema}, public"))
            connection.commit()
            
            context.configure(
                connection=connection,
                target_metadata=target_metadata,
                include_object=include_object,
            )
            with context.begin_transaction():
                context.run_migrations()

if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
