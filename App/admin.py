from django.contrib import admin
from .models import Waitlist, UserProfile

# Register your models here.

admin.site.register(Waitlist)
admin.site.register(UserProfile)
 
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('email', 'full_name', 'is_email_verified', 'created_at', 'last_login')
    list_filter = ('is_email_verified', 'created_at')
    search_fields = ('email', 'full_name', 'supabase_uid')
    readonly_fields = ('id', 'supabase_uid', 'created_at', 'updated_at')
    fieldsets = (
        ('Supabase Info', {
            'fields': ('id', 'supabase_uid', 'email', 'is_email_verified')
        }),
        ('User Info', {
            'fields': ('user', 'full_name', 'avatar_url')
        }),
        ('Metadata', {
            'fields': ('metadata',),
            'classes': ('collapse',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'last_login'),
            'classes': ('collapse',)
        }),
    )

 
class WaitlistAdmin(admin.ModelAdmin):
    list_display = ('email', 'is_converted', 'created_at', 'converted_at')
    list_filter = ('is_converted', 'created_at')
    search_fields = ('email',)
    readonly_fields = ('created_at',)
