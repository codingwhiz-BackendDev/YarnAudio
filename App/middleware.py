from django.utils.deprecation import MiddlewareMixin
from django.contrib.auth.models import AnonymousUser
from .utils import verify_supabase_token, get_or_create_user_from_supabase
from .models import UserProfile
import logging

logger = logging.getLogger(__name__)


class SupabaseAuthMiddleware(MiddlewareMixin):
    """
    Middleware to extract and verify Supabase JWT token from Authorization header
    Attaches Supabase user info to request object
    """

    def process_request(self, request):
        """Process incoming request and attach Supabase user"""
        request.supabase_user = None
        request.user_profile = None
        
        # Extract token from Authorization header
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
            
            # Verify token
            decoded_token = verify_supabase_token(token)
            
            if decoded_token:
                # Get or create user profile
                profile, created = get_or_create_user_from_supabase(decoded_token)
                
                if profile:
                    request.supabase_user = decoded_token
                    request.user_profile = profile
                    
                    # Link to Django user if available
                    if profile.user:
                        request.user = profile.user
                    
                    logger.info(f"[v0] Authenticated user: {profile.email}")
                    return None
        
        # Check for sessionid cookie (Django session auth)
        return None
