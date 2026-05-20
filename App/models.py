from django.db import models
from django.contrib.auth.models import User
import uuid




class UserProfile(models.Model):
    """Extended user profile with Supabase integration"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', null=True, blank=True)
    supabase_uid = models.CharField(max_length=255, unique=True, db_index=True)
    email = models.EmailField(unique=True, db_index=True)
    full_name = models.CharField(max_length=255, blank=True)
    avatar_url = models.URLField(blank=True, null=True)
    is_email_verified = models.BooleanField(default=False)
    
    # Subscription & Usage Fields
    plan = models.CharField(max_length=20, default='Free')
    audio_generations_left = models.IntegerField(default=2)
    
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_login = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'User Profile'
        verbose_name_plural = 'User Profiles'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.email} (Supabase: {self.supabase_uid[:8]}...)"

    @property
    def is_new_user(self):
        """Check if user just signed up"""
        return (self.user is None) if self.user else False
    
    
class Waitlist(models.Model):
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.email


class AudiobookProject(models.Model):
    """Model to track PDF to Audio generation projects"""
    STATUS_CHOICES = [
        ('Pending', 'Pending'),
        ('Processing', 'Processing'),
        ('Completed', 'Completed'),
        ('Failed', 'Failed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(UserProfile, on_delete=models.CASCADE, related_name='audiobooks')
    title = models.CharField(max_length=255)
    pdf_file = models.FileField(upload_to='pdfs/', blank=True, null=True)
    audio_file = models.FileField(upload_to='audiobooks/', blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pending')
    error_message = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.user.email})"