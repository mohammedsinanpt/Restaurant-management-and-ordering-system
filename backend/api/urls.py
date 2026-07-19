from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MenuItemViewSet, OrderViewSet, ReviewViewSet, CategoryViewSet,
    RegisterView, LoginView, ProfileView,
    PasswordResetRequestView, PasswordResetConfirmView,
    MenuImageUploadView, CreatePaymentIntentView, StaffViewSet,
)

router = DefaultRouter()
router.register(r'menu-items', MenuItemViewSet)
router.register(r'reviews', ReviewViewSet)
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'categories', CategoryViewSet)
router.register(r'staff', StaffViewSet, basename='staff')

urlpatterns = [
    path('', include(router.urls)),
    path('login/', LoginView.as_view(), name='api_token_auth'),
    path('register/', RegisterView.as_view(), name='api_register'),
    path('profile/', ProfileView.as_view(), name='api_profile'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='api_password_reset'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='api_password_reset_confirm'),
    path('upload-image/', MenuImageUploadView.as_view(), name='api_upload_image'),
    path('create-payment-intent/', CreatePaymentIntentView.as_view(), name='api_create_payment_intent'),
]