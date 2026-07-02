# LiqPay Payments

Integration lives in `backend/shop/services/liqpay.py` (provider `LiqPayProvider`, key `liqpay`).

## Signature algorithm — DO NOT CHANGE

```
signature = base64(sha1(private_key + data + private_key))
```

- **SHA-1 is the only algorithm LiqPay accepts.** This is fixed by the LiqPay API contract, not our choice.
- With any other digest (e.g. `sha3_256`) LiqPay treats `data` as untrusted and **silently degrades**: the checkout page opens as a bare "pay by requisites" card form — no QR code, no amount, no `paytypes` (Apple Pay / Google Pay), no `result_url` redirect. Callbacks also fail signature verification.
- This already broke production behavior twice (commits `e5b8cb2` and `04e53c1` switched to `sha3_256`; `d0db032` and the follow-up fix restored `sha1`).
- Guarded by a regression test with a pinned reference value: `shop.tests.test_checkout_payments` (`test_create_signature_uses_liqpay_sha1_contract`). If you "fix" the algorithm, that test fails — that is intentional.
- SHA-1 weakness is irrelevant here: the secret key wraps the payload on both sides, and the scheme is dictated by the provider. Do not let linters/security scanners talk you into "upgrading" it.

## Checkout payload notes

- `paytypes` is set from `Order.payment_method` via `PAYTYPE_BY_PAYMENT_METHOD` (`apple_pay → apay`, `google_pay → gpay`, `card → card`).
- Sandbox keys (`sandbox_...` public key) set `"sandbox": 1`. **Apple Pay / Google Pay buttons never render in sandbox** — LiqPay falls back to the card form. This is a sandbox limitation, not a bug.
- Apple Pay additionally requires: production merchant with Apple Pay enabled in the LiqPay dashboard, plus Safari on an Apple device with a configured Wallet. Otherwise LiqPay shows the card fallback.

## Verifying changes

```bash
cd backend && uv run python manage.py test shop.tests.test_checkout_payments
```
