from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from core.views import index

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    re_path(r'^(?!api/).*$', index, name='index'),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0] if settings.STATICFILES_DIRS else 'static')