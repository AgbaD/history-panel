from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import v1
from app.core.database import init_db
from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # init db
    await init_db()
    print("===============================")
    print("Server listening on port 8000")
    print("===============================")
    yield
    print("===============================")
    print("Shutting down...")
    print("===============================")


app = FastAPI(
    title="History Panel Backend",
    description="",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(v1.visitRouter, prefix="/api/visit")

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
