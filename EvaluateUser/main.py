from flask import Flask, render_template, request
from moralis import evm_api
import requests
from collections import defaultdict

app = Flask(__name__)

url = "https://api.etherscan.io/api?module=account&action=txlist&address=0x398eC7346DcD622eDc5ae82352F02bE94C62d119&startblock=0&endblock=99999999&page=1&offset=1000&sort=desc&apikey=BZ2XSINS4APIJ7UDYN91XF3MCTSY6D5KYI"

response = requests.get(url)
data = response.json()  # Parse response content as JSON

def get_wallet_age(address):
    url = f"https://api.footprint.network/api/v3/address/getWalletAge?chain=Ethereum&wallet_address={address}"
    headers = {
        "accept": "application/json",
        "api-key": "VXKMGo8G+ozLAjidmgOwNewQ3bp1pLp9nIp6UsP9n6rAVul6P9yOAVt5N295K8nx"
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        return data.get("data", {}).get("age", 0)
    else:
        return 0  # Return 0 if unable to fetch wallet age

# Function to get wallet net worth
# Function to get wallet net worth
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

	

# Function to calculate total deposit for each address
def calculate_total_deposit(data):
	deposits = {}
	transfers = data["result"]
	for transfer in transfers:
		from_address = transfer["from"]
		value = float(transfer["value"]) / (10 ** 18)  # Convert value to ether
		func = transfer["functionName"]
		if func == "deposit(address _reserve, uint256 _amount, uint16 _referralCode)":
			if from_address in deposits:
				deposits[from_address] += value
			else:
				deposits[from_address] = value
	return deposits

# Function to calculate interaction frequency for each address
def calculate_interaction_frequency(data):
	interactions = defaultdict(list)  # Store timestamps of interactions for each address

	transfers = data["result"]
	for transfer in transfers:
		from_address = transfer["from"]
		to_address = transfer["to"]
		timestamp = int(transfer["timeStamp"])  # Convert timestamp to integer

		interactions[from_address].append(timestamp)
		interactions[to_address].append(timestamp)

	return interactions

# Calculate total deposit for each address
total_deposits = calculate_total_deposit(data)

# Calculate interaction frequency for each address
interactions = calculate_interaction_frequency(data)
interaction_frequency = {}
for address, ts_list in interactions.items():
	if len(ts_list) >= 2:
		time_diffs_days = [(ts_list[i] - ts_list[i - 1]) / (3600 * 24) for i in range(1, len(ts_list))]  # Calculate time differences in days
		avg_time_diff_days = sum(time_diffs_days) / len(time_diffs_days)  # Calculate average time difference in days
		interaction_frequency[address] = abs(avg_time_diff_days)

# Sort the total deposits dictionary by value in descending order
sorted_deposits = dict(sorted(total_deposits.items(), key=lambda item: item[1], reverse=True))

def score_address(deposit, frequency, wallet_age, net_worth_data):
    if frequency == "N/A":
        frequency_score = 5  # Set frequency score to maximum if data is not available
    else:
        frequency_score = 10 - min(frequency / 10, 10)  # Score based on inverse of frequency, capped at 10
    
    deposit_score = min(deposit / 10, 10)  # Score based on deposit, capped at 10
    wallet_age_score = min(wallet_age / 10, 10)  # Score based on wallet age, capped at 10
    
    if net_worth_data is not None:
        total_net_worth = net_worth_data
        if total_net_worth is not None:
            # Assuming net worth is in millions, adjust scaling as needed
            net_worth_score = min(float(total_net_worth) / 1000000, 10)  # Score based on net worth, capped at 10
        else:
            net_worth_score = 0  # Default score if total net worth is not available
    else:
        net_worth_score = 0  # Default score if net worth data is not available
    
    # Calculate overall score as the average of individual scores
    overall_score = (deposit_score + frequency_score + wallet_age_score + net_worth_score) / 4

    return overall_score



ROWS_PER_PAGE = 8

# Prepare data for rendering
table_data = []
for address, deposit in sorted_deposits.items():
	frequency = interaction_frequency.get(address, "N/A")
	wallet_age = get_wallet_age(address)
	net_worth_data = get_wallet_net_worth(address)
	overall_score = score_address(deposit, frequency, wallet_age,net_worth_data)
	
	# Fetch net worth

	if net_worth_data:
		total_net_worth = net_worth_data
	else:
		total_net_worth = "N/A"
	
	table_data.append({
		"address": address,
		"deposit": deposit,
		"frequency": frequency,
		"wallet_age": wallet_age,
		"overall_score": overall_score,
		"total_net_worth": total_net_worth
	})
@app.route('/')
def index():
    # Get the page number from the query parameters or default to 1
    page = request.args.get('page', default=1, type=int)

    # Calculate the start and end index for the current page
    start_index = (page - 1) * ROWS_PER_PAGE
    end_index = start_index + ROWS_PER_PAGE

    # Slice the table data to get the rows for the current page
    table_data_page = table_data[start_index:end_index]

    # Calculate the total number of pages
    total_pages = len(table_data) // ROWS_PER_PAGE + (1 if len(table_data) % ROWS_PER_PAGE > 0 else 0)

    return render_template('index.html', table_data=table_data_page, page=page, total_pages=total_pages)


if __name__ == '__main__':
	app.run()
