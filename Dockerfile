# Use official Python image
FROM python:3.11-slim

# Set work directory to backend
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y build-essential libpq-dev && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code into /app (so /app/app/ contains the FastAPI app)
COPY backend/app ./app/
COPY backend/alembic ./alembic/
COPY backend/alembic.ini ./

# Set environment variables (override in production)
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8000

# Start the FastAPI app with Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
