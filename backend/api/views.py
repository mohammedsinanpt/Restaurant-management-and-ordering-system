from decimal import Decimal
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
import cloudinary
import cloudinary.uploader
from .models import MenuItem, Category, Order, Review, UserProfile
from .serializers import (
    MenuItemSerializer, CategorySerializer, OrderSerializer,
    ReviewSerializer, UserSerializer,
)
from . import emails
import uuid


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]


class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAdminUser()]


class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer

    def get_permissions(self):
        if self.action in ['create', 'track']:
            return [AllowAny()]  # Guests can order and track, but won't get order history
        if self.action in ['update_status', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]

    # 1. FILTER: Isolate User Data
    def get_queryset(self):
        user = self.request.user
        # If user is Admin/Staff, show ALL orders
        if user.is_staff:
            return Order.objects.all().order_by('-created_at')
        # If user is Customer, show ONLY their orders
        elif user.is_authenticated:
            return Order.objects.filter(user=user).order_by('-created_at')
        # If guest, show nothing (Guest orders are tracked via the public 'track' action instead)
        else:
            return Order.objects.none()

    # SAVE: attach user, generate order_id, and compute the trusted total server-side.
    # order_id/total_amount are read_only on the serializer (clients can't set them via
    # input data), so they're injected here as save() kwargs, which DRF applies regardless.
    def perform_create(self, serializer):
        user = self.request.user
        order = serializer.save(
            user=user if user.is_authenticated else None,
            order_id=f"ORD-{uuid.uuid4().hex[:6].upper()}",
            total_amount=0,
        )
        subtotal = sum(
            item.menu_item.price * item.quantity for item in order.items.all()
        )
        # 5% service charge + 18% GST, matching the breakdown shown in CartPage
        order.total_amount = (subtotal * Decimal('1.23')).quantize(Decimal('0.01'))
        order.save(update_fields=['total_amount'])
        emails.send_order_confirmation_email(order)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        valid_statuses = dict(Order.STATUS_CHOICES)
        if new_status not in valid_statuses:
            return Response({'error': 'invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        order.status = new_status
        order.save()
        emails.send_order_status_email(order)
        return Response(OrderSerializer(order).data)

    @action(detail=False, methods=['get'], url_path='track/(?P<order_id>[^/.]+)')
    def track(self, request, order_id=None):
        try:
            order = Order.objects.get(order_id=order_id)
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(OrderSerializer(order).data)


def _serialized_user(user):
    UserProfile.objects.get_or_create(user=user)
    return UserSerializer(user).data


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        password = request.data.get('password') or ''
        name = (request.data.get('name') or '').strip()

        if not email or not password:
            return Response({'error': 'email and password are required'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=email).exists():
            return Response({'error': 'An account with that email already exists'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            validate_password(password)
        except DjangoValidationError as e:
            return Response({'error': list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(username=email, email=email, password=password, first_name=name)
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': _serialized_user(user)}, status=status.HTTP_201_CREATED)


class LoginView(ObtainAuthToken):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'user': _serialized_user(user)})


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(_serialized_user(request.user))

    def patch(self, request):
        UserProfile.objects.get_or_create(user=request.user)
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class MenuImageUploadView(APIView):
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser]

    def post(self, request):
        image = request.FILES.get('image')
        if not image:
            return Response({'error': 'No image file provided'}, status=status.HTTP_400_BAD_REQUEST)
        if not settings.CLOUDINARY_CLOUD_NAME:
            return Response({'error': 'Image uploads are not configured on this server'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        cloudinary.config(
            cloud_name=settings.CLOUDINARY_CLOUD_NAME,
            api_key=settings.CLOUDINARY_API_KEY,
            api_secret=settings.CLOUDINARY_API_SECRET,
            secure=True,
        )
        try:
            result = cloudinary.uploader.upload(image, folder='spiceroute/menu')
        except Exception as e:
            return Response({'error': f'Upload failed: {e}'}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({'url': result['secure_url']}, status=status.HTTP_201_CREATED)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = (request.data.get('email') or '').strip().lower()
        try:
            user = User.objects.get(username=email)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            emails.send_password_reset_email(user, uid, token)
        except User.DoesNotExist:
            pass  # Don't reveal whether an account exists for this email
        return Response({'detail': 'If that account exists, a reset link has been sent.'})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get('uid') or ''
        token = request.data.get('token') or ''
        new_password = request.data.get('password') or ''

        try:
            user = User.objects.get(pk=force_str(urlsafe_base64_decode(uid)))
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            return Response({'error': 'Invalid or expired reset link'}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({'error': 'Invalid or expired reset link'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(new_password, user=user)
        except DjangoValidationError as e:
            return Response({'error': list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({'detail': 'Password updated. You can now log in.'})
