make install
make frontend-install

make run
make start

# LiqPay sandbox dev flow:
# starts backend, frontend, two Cloudflare tunnels,
# and writes current tunnel URLs into backend/.env and frontend/.env
make liqpay-dev

# Optional manual tunnels:
make tunnel-backend
make tunnel-frontend

make check
make pre-commit-install
make pre-commit
