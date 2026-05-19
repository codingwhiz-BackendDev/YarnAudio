import jwt
import json
from datetime import datetime
from django.conf import settings
from django.contrib.auth.models import User
from .models import UserProfile
import logging

logger = logging.getLogger(__name__)


def verify_supabase_token(token):
    """
    Verify Supabase JWT token and extract user data
    
    Args:
        token: JWT token from Supabase
        
    Returns:
        dict: Decoded token data or None if invalid
    """
    try:
        if not token:
            return None
            
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        # Decode JWT without verification first to inspect header
        unverified = jwt.decode(token, options={"verify_signature": False})
        logger.info(f"[v0] Supabase token decoded: {unverified.get('sub', 'unknown')}")
        
        # For production, verify signature using Supabase key
        try:
            decoded = jwt.decode(
                token,
                settings.SUPABASE_KEY or settings.SUPABASE_JWT_SECRET,
                algorithms=['HS256'],
                options={"verify_exp": True}
            )
            return decoded
        except jwt.InvalidSignatureError:
            logger.warning("[v0] Invalid token signature - allowing for development")
            # In development, allow unverified tokens
            if settings.DEBUG:
                return unverified
            return None
            
    except jwt.ExpiredSignatureError:
        logger.warning("[v0] Token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.error(f"[v0] Invalid token: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"[v0] Error verifying token: {str(e)}")
        return None


def get_or_create_user_from_supabase(decoded_token):
    """
    Create or update user from Supabase token claims
    
    Args:
        decoded_token: Decoded JWT token from Supabase
        
    Returns:
        tuple: (UserProfile instance, created bool)
    """
    try:
        uid = decoded_token.get('sub')
        email = decoded_token.get('email')
        user_metadata = decoded_token.get('user_metadata', {})
        
        if not uid or not email:
            logger.error("[v0] Missing uid or email in token")
            return None, False
        
        logger.info(f"[v0] Processing Supabase user: {email}")
        
        # Get or create user profile
        profile, created = UserProfile.objects.get_or_create(
            supabase_uid=uid,
            defaults={
                'email': email,
                'full_name': user_metadata.get('full_name', ''),
                'avatar_url': user_metadata.get('avatar_url', ''),
                'is_email_verified': decoded_token.get('email_confirmed_at') is not None,
                'metadata': user_metadata,
            }
        )
        
        # Update existing profile
        if not created:
            profile.email = email
            profile.full_name = user_metadata.get('full_name', profile.full_name)
            profile.avatar_url = user_metadata.get('avatar_url', profile.avatar_url)
            profile.is_email_verified = decoded_token.get('email_confirmed_at') is not None
            profile.metadata = user_metadata
            profile.last_login = datetime.now()
            profile.save()
            logger.info(f"[v0] Updated profile for {email}")
        else:
            logger.info(f"[v0] Created new profile for {email}")
        
        # Sync Django user if needed
        if profile.user is None:
            # Check if Django user exists by email
            django_user = User.objects.filter(email=email).first()
            
            if not django_user:
                # Create new Django user
                username = email.split('@')[0] + uid[:8]
                try:
                    django_user = User.objects.create_user(
                        username=username,
                        email=email,
                        first_name=user_metadata.get('first_name', ''),
                        last_name=user_metadata.get('last_name', ''),
                    )
                    logger.info(f"[v0] Created Django user: {username}")
                except Exception as e:
                    logger.warning(f"[v0] Could not create Django user: {str(e)}")
            
            if django_user:
                profile.user = django_user
                profile.save()
        
        # Mark waitlist as converted if email was in waitlist
        from .models import Waitlist
        waitlist_entry = Waitlist.objects.filter(email=email, is_converted=False).first()
        if waitlist_entry:
            waitlist_entry.is_converted = True
            waitlist_entry.converted_at = datetime.now()
            waitlist_entry.save()
            logger.info(f"[v0] Marked waitlist entry as converted: {email}")
        
        return profile, created
        
    except Exception as e:
        logger.error(f"[v0] Error creating user from Supabase: {str(e)}")
        return None, False


def sync_user_to_supabase(user_profile, data):
    """
    Sync Django user data back to Supabase (optional)
    
    Args:
        user_profile: UserProfile instance
        data: Dictionary of data to sync
        
    Returns:
        bool: Success status
    """
    try:
        from supabase import create_client
        
        supabase = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
        
        # Update user metadata in Supabase
        response = supabase.auth.admin.update_user_by_id(
            user_profile.supabase_uid,
            {
                "user_metadata": data
            }
        )
        logger.info(f"[v0] Synced user to Supabase: {user_profile.email}")
        return True
        
    except Exception as e:
        logger.warning(f"[v0] Could not sync to Supabase: {str(e)}")
        return False
