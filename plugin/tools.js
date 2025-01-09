// converts cookies array to Netscape cookie file format
function cookiesToNetscapeText(cookies)
{
	let r = "# Netscape HTTP Cookie File\n";
    
	for (let i = 0; i < cookies.length; ++i)
	{
		let c = cookies[i];
		
		r += c.domain + '\t' + 
			 "FALSE" + '\t' +
			 "/" + '\t' +
			 (c.isSecure ? "TRUE" : "FALSE") + '\t' +
			 (c.expirationDate.getTime() ? c.expirationDate.getTime() / 1000 : 0) + '\t' +
			 c.name + '\t' + 
			 c.value;
			 
		r += '\n';	
	}
	
	return r;
}