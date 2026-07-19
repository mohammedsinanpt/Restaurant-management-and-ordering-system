from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MenuItemViewSet, OrderViewSet, ReviewViewSet, CategoryViewSet,
    RegisterView, LoginView, ProfileView,
)

router = DefaultRouter()
router.register(r'menu-items', MenuItemViewSet)
router.register(r'reviews', ReviewViewSet)
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'categories', CategoryViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('login/', LoginView.as_view(), name='api_token_auth'),
    path('register/', RegisterView.as_view(), name='api_register'),
    path('profile/', ProfileView.as_view(), name='api_profile'),
]