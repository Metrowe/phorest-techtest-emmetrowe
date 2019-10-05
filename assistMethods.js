// Attempts fetch request with options
async function getJsonData(url, options)
{
	var returnData = null
	await fetch(url, options)
	.then((resp) => resp.json())
	.then(function(data) 
	{
		returnData = data;
		
	})
	.catch(function(error) 
	{
		console.log(error);
	}); 

	return returnData;
}

// Searches for an element and if it exists displays it
function displayElement(id,str)
{
	let element = document.getElementById(id);

	if(element != null)
	{
		element.style.display = 'block';

		if(str != null)
		{
			element.innerHTML = str;
		}
	}
	else
	{
		console.log('NO ELEMENT FOUND');
	}
}

// Searches for an element and if it exists hides it
function hideElement(id)
{
	let element = document.getElementById(id);

	if(element != null)
	{
		element.style.display = 'none';
	}
	else
	{
		console.log('NO ELEMENT FOUND');
	}
}