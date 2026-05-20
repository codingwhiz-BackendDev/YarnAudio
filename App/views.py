from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import login, logout
import json
import logging

from .utils import verify_supabase_token, get_or_create_user_from_supabase
from .models import UserProfile, Waitlist
from django.conf import settings

logger = logging.getLogger(__name__)


# =========================
# HELPERS
# =========================
def get_profile(user):
    """Safe profile fetch for Django user"""
    if not user.is_authenticated:
        return None
    return UserProfile.objects.filter(user=user).first()


# =========================
# AUTH PAGES
# =========================
def login_view(request):
    profile = get_profile(request.user)

    if request.user.is_authenticated and profile:
        return redirect('core:dashboard')

    return render(request, 'login.html', {
        'page_title': 'Login to YarnAudio',
        'supabase_url': getattr(settings, 'SUPABASE_URL', ''),
        'supabase_key': getattr(settings, 'SUPABASE_KEY', '')
    })


def signup_view(request):
    profile = get_profile(request.user)

    if request.user.is_authenticated and profile:
        return redirect('core:dashboard')

    return render(request, 'signup.html', {
        'page_title': 'Create Account - YarnAudio',
        'supabase_url': getattr(settings, 'SUPABASE_URL', ''),
        'supabase_key': getattr(settings, 'SUPABASE_KEY', '')
    })


# =========================
# SUPABASE CALLBACK
# =========================
@csrf_exempt
@require_http_methods(["POST"])
def auth_callback(request):
    """
    Handle Supabase OAuth callback
    """
    try:
        data = json.loads(request.body)
        token = data.get('token')

        if not token:
            return JsonResponse({'error': 'No token provided'}, status=400)

        result = verify_supabase_token(token)
        if isinstance(result, tuple):
            decoded_token, error_msg = result
        else:
            decoded_token = result
            error_msg = "Unknown error"

        if not decoded_token:
            return JsonResponse({'error': f'Invalid token: {error_msg}'}, status=401)

        profile, created = get_or_create_user_from_supabase(decoded_token)

        if not profile:
            return JsonResponse({'error': 'Failed to create user'}, status=500)

        # Login Django session if user exists
        if profile.user:
            login(request, profile.user)

        return JsonResponse({
            'success': True,
            'message': 'Authentication successful',
            'user': {
                'id': str(profile.id),
                'email': profile.email,
                'full_name': profile.full_name,
                'avatar_url': profile.avatar_url,
                'is_new': created,
            }
        })

    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)

    except Exception as e:
        logger.error(f"Auth callback error: {str(e)}")
        return JsonResponse({'error': 'Authentication failed'}, status=500)


# =========================
# LOGOUT
# =========================
@require_http_methods(["POST"])
def logout_view(request):
    logout(request)
    return JsonResponse({'success': True})


# =========================
# USER PROFILE API
# =========================
@require_http_methods(["GET"])
def user_profile(request):
    profile = get_profile(request.user)

    if not profile:
        return JsonResponse({'error': 'Not authenticated'}, status=401)

    return JsonResponse({
        'success': True,
        'user': {
            'id': str(profile.id),
            'email': profile.email,
            'full_name': profile.full_name,
            'avatar_url': profile.avatar_url,
            'is_email_verified': profile.is_email_verified,
            'created_at': profile.created_at.isoformat(),
            'last_login': profile.last_login.isoformat() if profile.last_login else None,
        }
    })


# =========================
# EMAIL VERIFICATION
# =========================
@csrf_exempt
@require_http_methods(["POST"])
def verify_email(request):
    try:
        data = json.loads(request.body)
        token = data.get('token')

        if not token:
            return JsonResponse({'error': 'No token provided'}, status=400)

        decoded_token = verify_supabase_token(token)

        if not decoded_token:
            return JsonResponse({'error': 'Invalid token'}, status=401)

        uid = decoded_token.get('sub')
        profile = UserProfile.objects.filter(supabase_uid=uid).first()

        if profile:
            profile.is_email_verified = decoded_token.get('email_confirmed_at') is not None
            profile.save()

        return JsonResponse({'success': True})

    except Exception as e:
        logger.error(f"Email verification error: {str(e)}")
        return JsonResponse({'error': 'Verification failed'}, status=500)


# =========================
# PROFILE PAGE
# =========================
def profile_view(request):
    profile = get_profile(request.user)

    if not profile:
        return redirect('auth:login')

    return render(request, 'profile.html', {
        'profile': profile,
        'page_title': f'{profile.full_name} - Profile'
    })


# =========================
# LANDING PAGE
# =========================
def index(request):
    return render(request, 'index.html')


# =========================
# WAITLIST
# =========================
@csrf_exempt
def join_waitlist(request):
    if request.method == "POST":
        data = json.loads(request.body)
        email = data.get("email")

        if not email:
            return JsonResponse({"error": "Email required"}, status=400)

        obj, created = Waitlist.objects.get_or_create(email=email)

        return JsonResponse({
            "success": True,
            "message": "Added to waitlist"
        })

    return JsonResponse({"error": "Invalid request"}, status=400)