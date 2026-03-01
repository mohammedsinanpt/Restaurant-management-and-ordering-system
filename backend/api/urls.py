from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token # <--- Import this
from .views import MenuItemViewSet, OrderViewSet, ReviewViewSet

router = DefaultRouter()
router.register(r'menu-items', MenuItemViewSet)
router.register(r'reviews', ReviewViewSet)
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    path('', include(router.urls)),
    path('login/', obtain_auth_token, name='api_token_auth'), # <--- ADD THIS LINE
]