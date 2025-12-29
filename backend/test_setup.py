from backend.app.database import Base, engine, check_db_connection
from backend.app.models import User, Trainer, Trainee, Workout, Measurement

if __name__ == "__main__":
    print("🔍 Checking database connection...")
    if check_db_connection():
        print("✅ Database connection successful!\n")
        
        print("🏗️ Creating all tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ All tables created successfully!\n")
        
        print("📋 Created tables:")
        for table in Base.metadata.sorted_tables:
            print(f"  - {table.name}")
    else:
        print("❌ Database connection failed!")