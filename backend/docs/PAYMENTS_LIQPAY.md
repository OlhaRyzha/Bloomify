# LiqPay Payments

Integration lives in `backend/shop/services/liqpay.py` (provider `LiqPayProvider`, key `liqpay`).

## Signature algorithm — DO NOT CHANGE

```text
signature = base64(sha3_256(private_key + data + private_key))
```

- **SHA3-256 is what LiqPay API v7 accepts.** Verified empirically against the LiqPay sandbox (2026-07-02): the legacy v3 algorithm `sha1` is rejected with a redirect to `checkout/throw_error/?err_code=invalid_signature`.
- With an invalid signature the checkout never opens — LiqPay shows its error page instead.
- This already flip-flopped several times in git history (`e5b8cb2`, `d0db032`, `04e53c1`). Before "fixing" the algorithm in either direction, re-verify against the sandbox: build a payload, POST both signature variants to `LIQPAY_CHECKOUT_URL`, and check which one redirects to a real `checkout_...` page vs `throw_error`.
- Guarded by a regression test with a pinned reference value: `shop.tests.test_checkout_payments` (`test_create_signature_uses_liqpay_sha3_256_contract`).

## paytypes — wallets must include `qr`

`paytypes` is set from `Order.payment_method` via `PAYTYPE_BY_PAYMENT_METHOD`:

| payment_method | paytypes  |
| -------------- | --------- |
| `apple_pay`    | `apay,qr` |
| `google_pay`   | `gpay,qr` |
| `card`         | `card`    |

Verified by rendering the sandbox checkout page headless (2026-07-02):

- `paytypes=apay` alone → on a browser without Apple Pay, LiqPay renders **nothing** above the card form: no wallet button, no QR — the page degrades to a bare card/requisites form. This was a real regression users hit.
- `paytypes=apay,qr` → the wallet button renders even on unsupported browsers, with the QR "continue on phone" flow behind it.
- No `paytypes` at all → LiqPay shows its full method list (Privat24 Pay, Google Pay, card, …).

Guarded by `test_checkout_wallet_paytypes_include_qr_fallback`.

## Sandbox limitations

- Sandbox keys (`sandbox_...` public key) set `"sandbox": 1`; the page shows the purple "Тестовий режим" banner.
- Completing a real Apple Pay / Google Pay payment still requires a supported browser/device (Safari + Wallet for Apple Pay) and, in production, the wallet enabled for the merchant in the LiqPay dashboard.

## Verifying changes

```bash
cd backend && uv run python manage.py test shop.tests.test_checkout_payments
```
