from django.contrib import admin
from django.urls import path, re_path, include
from django.views.generic import TemplateView
from django.views.static import serve
from django.conf import settings
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

FRONTEND_DIR = settings.BASE_DIR.parent / 'frontend'

urlpatterns = [
    # Frontend Pages Routing
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    path('index.html', TemplateView.as_view(template_name='index.html'), name='index'),
    path('parent-page.html', TemplateView.as_view(template_name='parent-page.html'), name='parent-page'),
    path('admin-page.html', TemplateView.as_view(template_name='admin-page.html'), name='admin-page'),
    path('super-admin-page.html', TemplateView.as_view(template_name='super-admin-page.html'), name='super-admin-page'),
    path('prediagnosis-page.html', TemplateView.as_view(template_name='prediagnosis-page.html'), name='prediagnosis-page'),
    path('report-preview.html', TemplateView.as_view(template_name='report-preview.html'), name='report-preview'),
    path('report-preview-parent.html', TemplateView.as_view(template_name='report-preview-parent.html'), name='report-preview-parent'),

    # Django Admin
    path('admin/', admin.site.urls),

    # Authentication & API Endpoints
    path(
        'api/auth/login/',
        TokenObtainPairView.as_view(),
        name='token_obtain_pair'
    ),
    path(
        'api/auth/refresh/',
        TokenRefreshView.as_view(),
        name='token_refresh'
    ),
    path('api/', include('accounts.urls')),

    # Frontend Assets Serving for Relative JS / CSS / Assets paths
    re_path(r'^(?P<path>(js|css|assets)/.*)$', serve, {'document_root': FRONTEND_DIR}),
]