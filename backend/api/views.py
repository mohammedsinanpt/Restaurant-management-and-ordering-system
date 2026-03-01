from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .models import MenuItem, Order, Review
from .serializers import MenuItemSerializer, OrderSerializer, ReviewSerializer
import uuid

class MenuItemViewSet(viewsets.ModelViewSet):
    queryset = MenuItem.objects.all()
    serializer_class = MenuItemSerializer
    
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [AllowAny()]
        return [IsAuthenticated()]

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [AllowAny]

class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer

    def get_permissions(self):
        if self.action == 'create': 
            return [AllowAny()]  # Guests can order, but won't have history
        return [IsAuthenticated()] # Viewing history requires login

    # 1. FILTER: Isolate User Data
    def get_queryset(self):
        user = self.request.user
        # If user is Admin/Staff, show ALL orders
        if user.is_staff:
            return Order.objects.all().order_by('-created_at')
        # If user is Customer, show ONLY their orders
        elif user.is_authenticated:
            return Order.objects.filter(user=user).order_by('-created_at')
        # If guest, show nothing (Guest orders are fire-and-forget)
        else:
            return Order.objects.none()

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        data['order_id'] = f"ORD-{uuid.uuid4().hex[:6].upper()}"
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    # 2. SAVE: Attach User to Order
    def perform_create(self, serializer):
        user = self.request.user
        if user.is_authenticated:
            serializer.save(user=user)
        else:
            serializer.save(user=None)

    @action(detail=True, methods=['patch'])
    def update_status(self, request, pk=None):
        order = self.get_object()
        new_status = request.data.get('status')
        if new_status:
            order.status = new_status
            order.save()
            return Response({'status': 'updated'})
        return Response({'error': 'invalid status'}, status=status.HTTP_400_BAD_REQUEST)