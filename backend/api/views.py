import logging
from decimal import Decimal
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from django.utils.encoding import force_bytes, force_str
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
import cloudinary
import cloudinary.uploader
import stripe
from .models import MenuItem, Category, Order, Review, UserProfile
from .serializers import (
    MenuItemSerializer, CategorySerializer, OrderSerializer,
    ReviewSerializer, UserSerializer,
)
from . import emails
import uuid

logger = logging.getLogger(__name__)


# 5% service charge + 18% GST, applied everywhere an order total is computed
# (here, and again once items are saved in OrderViewSet.perform_create) so the
# PaymentIntent amount and the stored order total can never drift apart.
def _apply_charges(subtotal):
    return (subtotal * Decimal('1.23')).quantize(Decimal('0.01'))


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
        if self.action == 'track':
            return [AllowAny()]  # Anyone with an order_id can check its status
        if self.action in ['update_status', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]  # Placing an order requires an account

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

    # SAVE: an order only ever gets created once payment is verified. We never trust the
    # client's word that a payment "succeeded" - the PaymentIntent is re-fetched from
    # Stripe's API and checked for status + amount before anything is written to the DB.
    # order_id/total_amount are read_only on the serializer (clients can't set them via
    # input data), so they're injected here as save() kwargs, which DRF applies regardless.
    def perform_create(self, serializer):
        payment_intent_id = self.request.data.get('payment_intent_id')
        if not payment_intent_id:
            raise ValidationError({'error': 'Payment is required to place an order.'})
        if Order.objects.filter(stripe_payment_intent_id=payment_intent_id).exists():
            raise ValidationError({'error': 'This payment has already been used for another order.'})

        subtotal = sum(
            item['menu_item'].price * item['quantity']
            for item in serializer.validated_data['items']
        )
        total = _apply_charges(subtotal)

        stripe.api_key = settings.STRIPE_SECRET_KEY
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        except stripe.error.StripeError as e:
            raise ValidationError({'error': f'Could not verify payment: {e}'})

        if intent.status != 'succeeded':
            raise ValidationError({'error': 'Payment has not been completed.'})
        if intent.amount != int(total * 100):
            # The customer has already been charged the amount that was quoted when they
            # started checkout. If it no longer matches (e.g. an admin edited a menu price
            # while they were paying), we must not silently keep their money with nothing
            # to show for it - refund the payment before rejecting the order.
            try:
                stripe.Refund.create(payment_intent=payment_intent_id)
                refund_note = ' Your payment has been automatically refunded.'
            except stripe.error.StripeError:
                logger.exception('Failed to auto-refund mismatched payment %s', payment_intent_id)
                refund_note = (
                    f' Please contact us with this reference so we can refund you: {payment_intent_id}'
                )
            raise ValidationError({
                'error': 'The order total changed before payment was confirmed.' + refund_note
            })

        try:
            order = serializer.save(
                user=self.request.user,
                order_id=f"ORD-{uuid.uuid4().hex[:6].upper()}",
                total_amount=total,
                stripe_payment_intent_id=payment_intent_id,
            )
        except IntegrityError:
            # Two concurrent requests for the same payment_intent_id both passed the
            # exists() check above before either committed; the unique constraint on
            # stripe_payment_intent_id is the real guard against a duplicate order, this
            # just turns the loser's raw IntegrityError into a clean, expected message.
            raise ValidationError({'error': 'This payment has already been used for another order.'})
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


class CreatePaymentIntentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        items_data = request.data.get('items') or []
        if not items_data:
            return Response({'error': 'No items provided'}, status=status.HTTP_400_BAD_REQUEST)

        subtotal = Decimal('0')
        for item in items_data:
            try:
                menu_item = MenuItem.objects.get(pk=item.get('menu_item'))
            except (MenuItem.DoesNotExist, ValueError, TypeError):
                return Response({'error': 'One or more menu items were not found'}, status=status.HTTP_400_BAD_REQUEST)
            subtotal += menu_item.price * int(item.get('quantity', 1))

        total = _apply_charges(subtotal)

        stripe.api_key = settings.STRIPE_SECRET_KEY
        if not stripe.api_key:
            return Response({'error': 'Payments are not configured on this server'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        try:
            intent = stripe.PaymentIntent.create(
                amount=int(total * 100),
                currency='inr',
                automatic_payment_methods={'enabled': True},
            )
        except stripe.error.StripeError as e:
            return Response({'error': str(e)}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({'client_secret': intent.client_secret, 'amount': str(total)})


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


class IsSuperUser(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)


def _as_bool(value):
    # Form-encoded clients send "false" as a string, and bool("false") is True - which
    # would silently turn a revoke into a no-op. Parse the text form explicitly.
    if isinstance(value, str):
        return value.strip().lower() not in ('false', '0', '', 'none')
    return bool(value)


def _serialized_staff(user):
    return {
        'id': user.id,
        'email': user.username,
        'name': user.first_name,
        'is_active': user.is_active,
        'is_superuser': user.is_superuser,
        'date_joined': user.date_joined,
        'last_login': user.last_login,
    }


class StaffViewSet(viewsets.ViewSet):
    # Owners only, not all staff: a kitchen account must not be able to mint new admins
    # or lock the owner out of their own restaurant.
    permission_classes = [IsSuperUser]

    def list(self, request):
        staff = User.objects.filter(is_staff=True).order_by('-is_superuser', 'username')
        return Response([_serialized_staff(u) for u in staff])

    def create(self, request):
        # username is the login identifier everywhere in this app (see RegisterView),
        # so a staff account is just a user whose username happens to be their email.
        email = (request.data.get('email') or '').strip().lower()
        password = request.data.get('password') or ''
        name = (request.data.get('name') or '').strip()

        if not email or not password:
            return Response({'error': 'email and password are required'}, status=status.HTTP_400_BAD_REQUEST)

        existing = User.objects.filter(username=email).first()
        if existing:
            # Tell the client this is recoverable by promoting rather than a dead end.
            return Response({
                'error': 'An account with that email already exists.',
                'can_promote': not existing.is_staff,
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(password)
        except DjangoValidationError as e:
            return Response({'error': list(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=email, email=email, password=password, first_name=name, is_staff=True,
        )
        return Response(_serialized_staff(user), status=status.HTTP_201_CREATED)

    def partial_update(self, request, pk=None):
        try:
            user = User.objects.get(pk=pk, is_staff=True)
        except User.DoesNotExist:
            return Response({'error': 'Staff member not found'}, status=status.HTTP_404_NOT_FOUND)

        # Two lockout guards: you can't strip your own access, and owner accounts are
        # only editable from the Django admin. Together these make it impossible to end
        # up with zero usable owners through this API.
        if user.pk == request.user.pk:
            return Response({'error': 'You cannot change your own access.'}, status=status.HTTP_400_BAD_REQUEST)
        if user.is_superuser:
            return Response({'error': 'Owner accounts can only be changed from the Django admin.'}, status=status.HTTP_403_FORBIDDEN)

        if 'is_active' in request.data:
            user.is_active = _as_bool(request.data['is_active'])
        if 'is_staff' in request.data:
            user.is_staff = _as_bool(request.data['is_staff'])
        user.save()

        # DRF tokens never expire on their own, so revoking access has to delete the
        # token too - otherwise a disabled account keeps working until they log out.
        if not user.is_active or not user.is_staff:
            Token.objects.filter(user=user).delete()

        return Response(_serialized_staff(user))

    @action(detail=False, methods=['post'])
    def promote(self, request):
        email = (request.data.get('email') or '').strip().lower()
        try:
            user = User.objects.get(username=email)
        except User.DoesNotExist:
            return Response({'error': 'No account exists with that email'}, status=status.HTTP_404_NOT_FOUND)
        user.is_staff = True
        user.save()
        return Response(_serialized_staff(user))
