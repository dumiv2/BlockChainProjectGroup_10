import requests
from moralis import evm_api

def get_wallet_net_worth(address):
    api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjYzOGVjYjYzLWZkMmYtNGQwYi04MmM3LWIwMTY5MzhjMzc4NCIsIm9yZ0lkIjoiMzk0Njg4IiwidXNlcklkIjoiNDA1NTY4IiwidHlwZUlkIjoiZjY0M2Q0NmYtN2FmNS00YjkyLTg1NGItMjdiYmFiMWY5NDZlIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3MTczMzk2NzQsImV4cCI6NDg3MzA5OTY3NH0.nJGW4mrObwRYKf86zu0lawxKlg3ZYnJQOH4IjvXGtR8"

    params = {
        "exclude_spam": True,
        "exclude_unverified_contracts": True,
        "address": address
    }

    try:
        result = evm_api.wallets.get_wallet_net_worth(
            api_key=api_key,
            params=params,
        )
        return result.get("total_networth_usd")
    except Exception as e:
        print(f"An error occurred: {e}")
        return None  # Return None if unable to fetch net worth

# Example usage
address = "0x69dcb0a3ab51c7adaf110e6f119d886989b53ec8"
ans = get_wallet_net_worth(address)
print(ans)
