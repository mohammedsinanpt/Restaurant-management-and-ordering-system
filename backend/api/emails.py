import logging

import resend
from django.conf import settings

FROM_ADDRESS = "SpiceRoute <onboarding@resend.dev>"

logger = logging.getLogger(__name__)


def _send(to, subject, html):
    if not settings.RESEND_API_KEY:
        return
    resend.api_key = settings.RESEND_API_KEY
    try:
        resend.Emails.send({
            "from": FROM_ADDRESS,
            "to": [to],
            "subject": subject,
            "html": html,
        })
    except Exception:
        # Email is a side effect of a successful operation (an order was placed, a
        # password reset was requested), never the reason it should fail. Resend
        # raises on any API error (bad key, rate limit, rejected recipient), and
        # letting that bubble up would 500 a request that otherwise succeeded - and
        # for password reset specifically, would leak whether an account exists
        # (existing users get a 500 from a failed send, non-existent users always
        # get a clean 200), which defeats the whole point of that endpoint.
        logger.exception("Failed to send email %r to %s", subject, to)


def send_password_reset_email(user, uid, token):
    reset_url = f"{settings.FRONTEND_URL}/reset-password/{uid}/{token}"
    _send(
        user.email,
        "Reset your SpiceRoute password",
        f"""
        <p>Hi {user.first_name or ''},</p>
        <p>Click the link below to reset your password. This link works once and expires soon.</p>
        <p><a href="{reset_url}">{reset_url}</a></p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        """,
    )


def send_order_confirmation_email(order):
    if not order.user or not order.user.email:
        return
    items_html = "".join(
        f"<li>{item.quantity}x {item.menu_item.name}</li>" for item in order.items.all()
    )
    _send(
        order.user.email,
        f"Order confirmed — {order.order_id}",
        f"""
        <p>Hi {order.user.first_name or ''},</p>
        <p>Your order <strong>{order.order_id}</strong> for table {order.table_number} is confirmed.</p>
        <ul>{items_html}</ul>
        <p><strong>Total: ₹{order.total_amount}</strong></p>
        <p>Track it live: <a href="{settings.FRONTEND_URL}/status/{order.order_id}">{settings.FRONTEND_URL}/status/{order.order_id}</a></p>
        """,
    )


def send_order_status_email(order):
    if not order.user or not order.user.email:
        return
    status_copy = {
        "PREPARING": "The kitchen has started preparing your order.",
        "READY": "Your order is ready!",
        "CANCELLED": "Your order was cancelled.",
    }.get(order.status)
    if not status_copy:
        return
    _send(
        order.user.email,
        f"Order {order.order_id} — {order.status.title()}",
        f"""
        <p>Hi {order.user.first_name or ''},</p>
        <p>{status_copy}</p>
        <p>Track it live: <a href="{settings.FRONTEND_URL}/status/{order.order_id}">{settings.FRONTEND_URL}/status/{order.order_id}</a></p>
        """,
    )
