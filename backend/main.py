import os
import json
import base64
import requests
from fastapi import FastAPI, Request, Response, Depends, HTTPException, status
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from starlette.middleware.sessions import SessionMiddleware
from dotenv import load_dotenv
from db.db import init_models
from db.user_ops import User, get_user_by_id, get_or_create_user, get_user_completed_tasks, update_user_topics, update_user_languages
from db.tasks_ops import get_task, get_open_tasks, complete_task, get_random_open_task
from pydantic import BaseModel
from sqlalchemy import select, func
from db.db import AsyncSessionLocal
from typing import List, Optional

load_dotenv()

app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SESSION_SECRET"))

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        os.getenv("FRONTEND_URL", "http://localhost:3000")
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)


# JWT Authentication
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get the current user from the JWT token."""
    token = credentials.credentials
    payload = User.verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = await get_user_by_id(payload["sub"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user

@app.on_event("startup")
async def on_startup():
    await init_models() 

config = Config('.env')
oauth = OAuth(config)
oauth.register(
    name='google',
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'},
    userinfo_endpoint='https://openidconnect.googleapis.com/v1/userinfo',
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

@app.get("/")
def read_root():
    return {"message": "Welcome to the backend API!"} 

# Add this simple test endpoint to your main.py
@app.get("/test/debug")
async def test_debug():
    print("=== TEST DEBUG ENDPOINT CALLED ===")
    return {"message": "Debug endpoint working"}

@app.get("/auth/google/login")
async def login(request: Request, referral_code: Optional[str] = None):
    """Login with Google OAuth, optionally with a referral code."""
    redirect_uri = request.url_for('auth')
    print("Redirect URI:", redirect_uri)
    
    # Store referral code in session if provided
    if referral_code:
        request.session['referral_code'] = referral_code
    
    return await oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/auth/google/callback")
async def auth(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
        print("[SERVER] Google token:", token)
        userinfo = token["userinfo"]
        print("[SERVER] Google userinfo:", userinfo)
        
        # Get referral code from session if it exists
        referral_code = request.session.get('referral_code')
        if referral_code:
            del request.session['referral_code']
        
        # Fetch and encode image
        picture_url = userinfo.get("picture")
        picture_data = None
        if picture_url:
            try:
                response = requests.get(picture_url, timeout=10)
                if response.status_code == 200:
                    picture_data = f"data:image/jpeg;base64,{base64.b64encode(response.content).decode('utf-8')}"
            except Exception as e:
                print(f"Failed to fetch profile picture: {e}")
                picture_data = picture_url
        
        # Get or create user in DB
        db_user = await get_or_create_user(
            email=userinfo["email"],
            name=userinfo.get("name"),
            picture=picture_data or picture_url,
            referral_code=referral_code
        )
        
        # Generate JWT token
        jwt_token = db_user.generate_token()
        
        # Check if user needs onboarding (has no topics or languages set)
        needs_onboarding = not db_user.get_topics() and not db_user.get_languages()
        
        # Send user data to frontend
        user_to_frontend = {
            "id": db_user.id,
            "email": db_user.email,
            "name": db_user.name,
            "picture": db_user.picture,
            "token": jwt_token,
            "referral_code": db_user.referral_code,
            "needs_onboarding": needs_onboarding
        }
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Login Success</title>
        </head>
        <body>
            <script>
            try {{
                console.log('Sending user data to parent window');
                window.opener.postMessage({json.dumps(user_to_frontend)}, "{FRONTEND_URL}");
                window.close();
            }} catch (error) {{
                console.error('Failed to send message to parent:', error);
                document.body.innerHTML = '<p>Login successful! You can close this window.</p>';
            }}
            </script>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content)
        
    except Exception as e:
        print(f"OAuth error: {e}")
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Login Error</title>
        </head>
        <body>
            <script>
            try {{
                window.opener.postMessage({{error: "Authentication failed: {str(e)}"}}, "{FRONTEND_URL}");
                window.close();
            }} catch (error) {{
                document.body.innerHTML = '<p>Login failed. Please close this window and try again.</p>';
            }}
            </script>
        </body>
        </html>
        """
        return HTMLResponse(content=html_content)


@app.post("/auth/logout")
def logout(response: Response):
    response.delete_cookie("session")  # Remove session cookie if set
    return {"message": "Logged out successfully"}

@app.get("/api/tasks")
async def get_tasks(current_user: User = Depends(get_current_user)):
    """Get all tasks."""
    tasks = await get_open_tasks()
    return [
        {
            "id": task.id,
            "claim": task.claim,
            "topic": "Wikipedia Fact Check",
            "difficulty": "Medium",
            "status": task.status.value,
        }
        for task in tasks
    ]

    
@app.get("/api/tasks/rand")
async def get_random_task():
    """Get a random open task - simplified for debugging."""
    print("=== SIMPLIFIED RANDOM TASK ENDPOINT CALLED ===")
    task = await get_random_open_task()
    return {
        "id": task.id,
        "claim": task.claim,
        "topic": "Wikipedia Fact Check",
        "difficulty": "Medium",
        "status": task.status.value,
        "context": task.context,
        "claim_text_span": task.claim_text_span,
        "claim_url": task.claim_url,
        "report": task.report,
        "report_urls": task.report_urls,
        "xp": 25
    }

import asyncio

@app.get("/api/tasks/{task_id}")
async def get_task_by_id(task_id: str, current_user: User = Depends(get_current_user)):
    """Get a single task by ID."""
    await asyncio.sleep(1)  # Artificial 1 second delay 
    task = await get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return {
        "id": task.id,
        "claim": task.claim,
        "topic": "Wikipedia Fact Check",
        "difficulty": "Medium",
        "status": task.status.value,
        "context": task.context,
        "claim_text_span": task.claim_text_span,
        "claim_url": task.claim_url,
        "report": task.report,
        "report_urls": task.report_urls,
        "xp": 25
    }

class TaskSubmission(BaseModel):
    agrees_with_claim: bool
    user_analysis: str
    
@app.post("/api/tasks/{task_id}/submit")
async def submit_task(
    task_id: str,
    submission: TaskSubmission,
    current_user: User = Depends(get_current_user)
):
    """Submit a solution for a task."""
    print(f"=== Task submission started ===")
    print(f"Task ID: {task_id}")
    print(f"User ID: {current_user.id}")
    print(f"Agrees with claim: {submission.agrees_with_claim}")
    print(f"User analysis length: {len(submission.user_analysis)} characters")

    success = await complete_task(
        task_id=task_id,
        user_id=current_user.id,
        agrees_with_claim=submission.agrees_with_claim,
        user_analysis=submission.user_analysis
    )
    
    if not success:
        print(f"=== Task submission failed ===")
        print(f"Task ID: {task_id}")
        print(f"User ID: {current_user.id}")
        raise HTTPException(
            status_code=400,
            detail="Could not submit task. Task might not exist, be already completed, or you might not have permission."
        )
    
    print(f"=== Task submission successful ===")
    print(f"Task ID: {task_id}")
    print(f"User ID: {current_user.id}")
    return {"success": True}

@app.get("/api/users/{user_id}/completed-tasks")
async def get_user_completed_tasks_count(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get the number of tasks completed by a user."""
    # Only allow users to get their own completed tasks count
    if current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view other users' completed tasks"
        )
    
    return {
        "total_completed": current_user.completed_tasks
    }

@app.get("/api/users/{user_id}/stats")
async def get_user_stats(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get user statistics including points, completed tasks, badges, and rank."""
    # Only allow users to get their own stats
    if current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view other users' stats"
        )
    
    # For now, we'll return mock data since badges and rank are not implemented yet
    return {
        "points": current_user.points,
        "completed_tasks": current_user.completed_tasks,
        "badges": 0,  # TODO: Implement badges
        "rank": 1,    # TODO: Implement ranking system
    }

@app.get("/api/users/{user_id}/completed-tasks/list")
async def get_user_completed_tasks_list(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all tasks completed by a user, sorted by most recent."""
    # Only allow users to get their own completed tasks
    if current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view other users' completed tasks"
        )
        
    await asyncio.sleep(1)
    
    tasks = await get_user_completed_tasks(user_id)
    return [
        {
            "id": task.id,
            "claim": task.claim,
            "claim_text_span": task.claim_text_span,
            "claim_url": task.claim_url,
            "context": task.context,
            "report": task.report,
            "report_urls": task.report_urls,
            "agrees_with_claim": task.user_agrees,
            "analysis": task.user_analysis,
            "completed_at": task.updated_at.isoformat(),
            "points_earned": 25 if not task.user_agrees else 10  # More points for disagreeing
        }
        for task in tasks
    ]

@app.get("/api/leaderboard")
async def get_leaderboard(
    current_user: User = Depends(get_current_user),
    limit: int = 10,
    offset: int = 0
):
    """Get the top users by points."""
    async with AsyncSessionLocal() as session:
        # Get total users count
        total_count = await session.execute(select(func.count(User.id)))
        total_users = total_count.scalar_one()

        # Get top users
        result = await session.execute(
            select(User)
            .order_by(User.points.desc())
            .offset(offset)
            .limit(limit)
        )
        users = result.scalars().all()

        # Get current user's rank
        user_rank_result = await session.execute(
            select(func.count(User.id))
            .where(User.points > current_user.points)
        )
        user_rank = user_rank_result.scalar_one() + 1

        return {
            "total_users": total_users,
            "user_rank": user_rank,
            "users": [
                {
                    "id": user.id,
                    "name": user.name or user.email,
                    "points": user.points,
                    "completed_tasks": user.completed_tasks,
                    "rank": offset + i + 1
                }
                for i, user in enumerate(users)
            ]
        }

@app.get("/api/stats/platform")
async def get_platform_stats():
    """Get overall platform statistics."""
    async with AsyncSessionLocal() as session:
        # Get total users
        total_users = await session.execute(select(func.count(User.id)))
        total_users_count = total_users.scalar_one()

        # Get total completed tasks
        total_tasks = await session.execute(select(func.sum(User.completed_tasks)))
        total_completed_tasks = total_tasks.scalar_one() or 0

        # Get total points awarded
        total_points = await session.execute(select(func.sum(User.points)))
        total_points_awarded = total_points.scalar_one() or 0

        # Get average points per user
        avg_points = total_points_awarded / total_users_count if total_users_count > 0 else 0

        return {
            "total_users": total_users_count,
            "total_completed_tasks": total_completed_tasks,
            "total_points_awarded": total_points_awarded,
            "average_points_per_user": round(avg_points, 2)
        }

class UserInterests(BaseModel):
    topics: List[str]
    languages: List[str]

@app.post("/api/users/{user_id}/interests")
async def save_user_interests(
    user_id: str,
    interests: UserInterests,
    current_user: User = Depends(get_current_user)
):
    """Save user's topics and languages."""
    # Only allow users to update their own interests
    if current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to update other users' interests"
        )
    
    # Update topics and languages
    topics_success = await update_user_topics(user_id, interests.topics)
    languages_success = await update_user_languages(user_id, interests.languages)
    
    if not (topics_success and languages_success):
        raise HTTPException(
            status_code=400,
            detail="Failed to save user interests"
        )
    
    return {"success": True}


@app.get("/api/users/{user_id}/interests")
async def get_user_interests_api(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get user's topics and languages."""
    # Only allow users to get their own interests
    if current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view other users' interests"
        )
    from db.user_ops import get_user_interests
    return await get_user_interests(user_id)

@app.get("/api/users/{user_id}/referral")
async def get_user_referral_info(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get user's referral information."""
    # Only allow users to get their own referral info
    if current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view other users' referral information"
        )
    
    # Get backend URL from environment or default to localhost:8000
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
    
    return {
        "referral_code": current_user.referral_code,
        "referral_count": current_user.referral_count,
        "referral_link": f"{backend_url}/auth/google/login?referral_code={current_user.referral_code}"
    }

@app.get("/api/users/{user_id}/referrals")
async def get_user_referrals(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get list of users referred by this user."""
    # Only allow users to get their own referrals
    if current_user.id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to view other users' referrals"
        )
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(User)
            .where(User.referred_by == user_id)
            .order_by(User.updated_at.desc())
        )
        referred_users = result.scalars().all()
        
        return [
            {
                "id": user.id,
                "name": user.name or user.email,
                "email": user.email,
                "joined_at": user.updated_at.isoformat(),
                "points_earned": 50  # Points earned from this referral
            }
            for user in referred_users
        ]