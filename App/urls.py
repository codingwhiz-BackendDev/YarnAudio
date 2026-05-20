from django.urls import path
from . import views

urlpatterns = [
    path('',views.index,name='index'),
    path("waitlist/", views.join_waitlist, name="waitlist"),
    path('login/', views.login_view, name='login'),
    path('signup/', views.signup_view, name='signup'),
    path('logout/', views.logout_view, name='logout'),
    path('callback/', views.auth_callback, name='callback'),
    path('profile/', views.profile_view, name='profile'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('user/', views.user_profile, name='user_profile'),
    path('verify-email/', views.verify_email, name='verify_email'),
]