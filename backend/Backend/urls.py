from django.contrib import admin
from django.urls import path, re_path, include
from django.conf import settings
from django.conf.urls.static import static,serve
from myapp.views import FrontendView

urlpatterns = [
    path('panel/', admin.site.urls),
    path('api/', include('myapp.urls')),
    re_path(r'^assets/(?P<path>.*)$', serve, {
        'document_root': settings.BASE_DIR.parent / 'frontend/dist/assets'
    }),
    re_path(r'^(?!api|panel).*$', FrontendView.as_view()),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)