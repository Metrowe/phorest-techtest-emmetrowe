var businessId = 'eTC3QY5W3p_HmGHezKfxJw'
var branchId = 'SE-J0emUgQnya14mOGdQSw'

var authHeader = null;
var clients = null;

//Markup template for listing clients in search result
function getClientMarkup(client,index)
{
	return `
		<div class=" col-12 m-2 p-2 border border-primary rounded theme-colour-c">
			<div class="row">
				<div class="col">
					${client.firstName} ${client.lastName}
				</div>
				<div class="col">
					<input onclick="displayVoucherForm(${index});" type="button" class="btn btn-primary btn-md btn-block" value="Make Voucher">
				</div>
			</div>
		</div>
		`;
}

//Markup template voucher interface
function getVoucherMarkup(client,index)
{
	return `
		<div class=" col-12 m-2 ml-3 p-2 border border-primary rounded theme-colour-c">
			<div class="row">
				<div class="col-5">
					<div>
						Client: ${client.firstName} ${client.lastName}
					</div>
					<div>
						Email: ${client.email}
					</div>
					<div>
						Phone: ${client.mobile}
					</div>
				</div>
				<div class="col-7">
					<div class="input-group m-1">
						<div class="input-group-prepend">
							<span id="voucher-value-label" class="input-group-text">€</span>
						</div>
						<input id="voucher-value" value="" type="text" class="form-control" placeholder="eg. 10.50">
					</div>
					<input onclick="postVoucher(${index});" type="button" class="btn btn-primary btn-md btn-block" value="Create Voucher">
				</div>
			</div>

			<div class="row">
				<div id="error-message" class="col text-right text-danger" style="display:none;">
					*Invalid Input
				</div>
			</div>

			<div class="row">
				<div id="success-message" class="col text-right text-success" style="display:none;">
					*Voucher created Successfully
				</div>
			</div>
		</div>
		`;
}

// Formats username and password into base64 to create basic authentication header
function getAuthHeader()
{
	if(authHeader == null)
	{
		let pair = username + ':' + password
		let encodedPair = btoa(pair);

		let basicAuth = 'Basic ' + encodedPair;
		authHeader = { 'Authorization': basicAuth };
	}
	
	return authHeader;
}

// Fills client markup template and adds to main document
function displayClient(client,index)
{
	let clientListElement = document.getElementById('client-list');
	clientListElement.innerHTML = clientListElement.innerHTML + getClientMarkup(client,index);
}

// Fills client markup template and adds to main document
function displayVoucherForm(index)
{
	let voucherFormElement = document.getElementById('voucher-form');
	voucherFormElement.innerHTML = getVoucherMarkup(clients[index],index);
}

// Fetches list of clients with option to filter by email and/or mobile
async function fetchClients()
{
	// Initialise variables and list filters
	let endpoint = 'http://api-gateway-dev.phorest.com/third-party-api-server/api/business/' + businessId +'/client';

	let email = document.getElementById('email-filter').value;
	let mobile = document.getElementById('mobile-filter').value;

	let voucherFormElement = document.getElementById('voucher-form');
	let clientListElement = document.getElementById('client-list');
	let response = null;

	let filters = [];

	// Removes voucher form if currently displayed
	voucherFormElement.innerHTML = '';

	// Add filters to list if not blank
	if(email != '')
	{
		filters.push('email=' + email);
	}
	if(mobile != '')
	{
		filters.push('phone=' + mobile);
	}

	if(filters.length > 0)
	{
		// Add first filter
		endpoint = endpoint + '?' + filters[0];
		filters.shift();

		// Add any amount of additional filters (however current problem only requires 2)
		while(filters.length > 0)
		{
			endpoint = endpoint + '&' + filters[0];
			filters.shift();
		}
	}

	// Attach Authorisation header and attempt get from API
	response = await getJsonData(endpoint,{method: 'GET', headers: getAuthHeader()});

	// If no clients returned display message
	if(response._embedded == null)
	{
		clients = null;
		clientListElement.innerHTML = 'No Results';
	}
	else if(response._embedded.clients != null)
	{
		// Clear current items from client list and add the clients from the response message
		clients = response._embedded.clients
		clientListElement.innerHTML = '';

		clients.forEach(displayClient);
	}
}

// Create a voucher for specified client with any float value and display serial number if successful
async function postVoucher(clientIndex)
{ 
	// Gets client info from previously retrieved results
	let client = clients[clientIndex];
	let endpoint = 'http://api-gateway-dev.phorest.com/third-party-api-server/api/business/' + businessId +'/voucher';

	let voucherValueString = document.getElementById('voucher-value').value;

	let voucherValue = parseFloat(voucherValueString); 

	//Hides messages if currently displayed
	hideElement('success-message');
	hideElement('error-message');

	// If voucher value is a number and at least 1 cent continue with POST
	// Value is rounded later to deal with extra decimals
	if (!isNaN(voucherValue) && voucherValue >= 0.01) 
	{
		// Get auth header and add specification of content type
		let headers = getAuthHeader();
		headers["Content-Type"] = "application/json";

		// Get current date and set it as issue and expiry (both are the same as it makes clear the voucher is created only for demonstration purposes)
		let date = new Date();
		let data = {
			"clientId": client.clientId,
			"creatingBranchId": branchId,
			"expiryDate": date,
			"issueDate": date,
			"originalBalance": voucherValue.toFixed(2)
		};

		// Attempt POST and convert body contents to JSON
		let response = null;
		response = await getJsonData(endpoint,{method: 'POST', headers: headers, body: JSON.stringify(data)});

		//Logs the contents of response
		console.log(response);

		// Displays success message for 30 seconds if voucher is returned
		if(response.voucherId != null)
		{
			displayElement("success-message",'Voucher created, serial: ' + response.serialNumber)

			setTimeout(function() {
			    hideElement('success-message');
			}, 30000);
		}
	}
	else
	{
		//Error message displayed for 10 seconds if invalid input is given
		displayElement('error-message','*Invalid Input')

		setTimeout(function() {
		    hideElement('error-message');
		}, 10000);
	}
}