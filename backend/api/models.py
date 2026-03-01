from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.contrib.auth.models import User  # <--- Added Import

class Category(models.Model):
    name = models.CharField(max_length=100)
    
    def __str__(self):
        return self.name

class MenuItem(models.Model):
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='items')
    name = models.CharField(max_length=200)
    description = models.TextField()
    price = models.DecimalField(max_digits=7, decimal_places=2)
    is_veg = models.BooleanField(default=True)
    is_available = models.BooleanField(default=True)
    image_url = models.URLField(max_length=500)
    ingredients = models.TextField(help_text="Comma separated ingredients", blank=True)
    spiciness_level = models.CharField(max_length=20, choices=[('Mild', 'Mild'), ('Medium', 'Medium'), ('Spicy', 'Spicy')], default='Medium')
    calories = models.IntegerField(default=0)

    def __str__(self):
        return self.name

class Review(models.Model):
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE, related_name='reviews')
    customer_name = models.CharField(max_length=100)
    rating = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class Order(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('PREPARING', 'Preparing'),
        ('READY', 'Ready'),
        ('CANCELLED', 'Cancelled'),
    ]
    # <--- Added User Link (Null allowed for guests, but used for logged-in users)
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True) 
    
    order_id = models.CharField(max_length=20, unique=True)
    table_number = models.IntegerField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    menu_item = models.ForeignKey(MenuItem, on_delete=models.CASCADE)
    quantity = models.IntegerField()
    customization = models.CharField(max_length=200, blank=True, null=True)