from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework.test import APITestCase


class StaffApiTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_superuser(
            username='owner@x.com', email='owner@x.com', password='Sup3rSecret!99')
        self.chef = User.objects.create_user(
            username='chef@x.com', email='chef@x.com', password='Sup3rSecret!99', is_staff=True)
        self.customer = User.objects.create_user(
            username='cust@x.com', email='cust@x.com', password='Sup3rSecret!99')

    def auth(self, user):
        token, _ = Token.objects.get_or_create(user=user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')

    def test_customer_and_plain_staff_are_blocked(self):
        self.auth(self.customer)
        self.assertEqual(self.client.get('/api/staff/').status_code, 403)
        self.auth(self.chef)
        self.assertEqual(self.client.get('/api/staff/').status_code, 403)

    def test_owner_lists_only_staff(self):
        self.auth(self.owner)
        res = self.client.get('/api/staff/')
        self.assertEqual(res.status_code, 200)
        self.assertEqual([m['email'] for m in res.data], ['owner@x.com', 'chef@x.com'])

    def test_create_staff_and_login_works(self):
        self.auth(self.owner)
        res = self.client.post('/api/staff/', {
            'email': 'New@X.com ', 'name': 'Priya', 'password': 'Sup3rSecret!99'})
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data['email'], 'new@x.com')  # normalised

        self.client.credentials()
        login = self.client.post('/api/login/', {'username': 'new@x.com', 'password': 'Sup3rSecret!99'})
        self.assertEqual(login.status_code, 200, login.data)
        self.assertTrue(login.data['user']['is_staff'])
        self.assertFalse(login.data['user']['is_superuser'])

    def test_weak_password_and_duplicate_rejected(self):
        self.auth(self.owner)
        weak = self.client.post('/api/staff/', {'email': 'a@x.com', 'password': '123'})
        self.assertEqual(weak.status_code, 400)

        dup = self.client.post('/api/staff/', {'email': 'cust@x.com', 'password': 'Sup3rSecret!99'})
        self.assertEqual(dup.status_code, 400)
        self.assertTrue(dup.data['can_promote'])

        dup_staff = self.client.post('/api/staff/', {'email': 'chef@x.com', 'password': 'Sup3rSecret!99'})
        self.assertFalse(dup_staff.data['can_promote'])

    def test_promote_existing_customer(self):
        self.auth(self.owner)
        res = self.client.post('/api/staff/promote/', {'email': 'cust@x.com'})
        self.assertEqual(res.status_code, 200, res.data)
        self.customer.refresh_from_db()
        self.assertTrue(self.customer.is_staff)

    def test_disable_revokes_token_immediately(self):
        chef_token, _ = Token.objects.get_or_create(user=self.chef)
        self.auth(self.owner)
        res = self.client.patch(f'/api/staff/{self.chef.pk}/', {'is_active': False})
        self.assertEqual(res.status_code, 200, res.data)
        self.assertFalse(Token.objects.filter(key=chef_token.key).exists())

        # the disabled chef can no longer use the API at all
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {chef_token.key}')
        self.assertEqual(self.client.get('/api/orders/').status_code, 401)

    def test_revoke_staff_keeps_account(self):
        self.auth(self.owner)
        res = self.client.patch(f'/api/staff/{self.chef.pk}/', {'is_staff': False})
        self.assertEqual(res.status_code, 200)
        self.chef.refresh_from_db()
        self.assertFalse(self.chef.is_staff)
        self.assertTrue(self.chef.is_active)  # still a customer

    def test_lockout_guards(self):
        self.auth(self.owner)
        me = self.client.patch(f'/api/staff/{self.owner.pk}/', {'is_active': False})
        self.assertEqual(me.status_code, 400)

        other_owner = User.objects.create_superuser(
            username='o2@x.com', email='o2@x.com', password='Sup3rSecret!99')
        res = self.client.patch(f'/api/staff/{other_owner.pk}/', {'is_active': False})
        self.assertEqual(res.status_code, 403)
        other_owner.refresh_from_db()
        self.assertTrue(other_owner.is_active)

    def test_cannot_target_a_non_staff_user(self):
        self.auth(self.owner)
        res = self.client.patch(f'/api/staff/{self.customer.pk}/', {'is_active': False})
        self.assertEqual(res.status_code, 404)
