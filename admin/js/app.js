'use strict';

//Parse.$ = jQuery;

// Initialize Parse with your Parse application javascript keys
// test app.
//Parse.initialize("R7ar2YrJEpUb7BbeZfVt9hMNrXWXTm5q4JGJgPkX",
//"XoVDCs3Zx0DUZAq1Pk2WGYOLgJfbzXp83g2QoZ10");

// actual app. Danger Zone!

/*var SVV3keys = {appID: "qYl5hDbdWGTNXvug7EcnF6S7DUaFc4dHKUb1dNq3",
				jsKey: "D7nGqgOC97j9ZM7p4rdurZ3P0pSaqTAmCN0xFK7T"};
*/
//Parse.initialize(SVV3keys.appID,SVV3keys.jsKey);

Parse.initialize(
	"2yAPqtvKgpLjfE6VmiYkqwgHgqFxmRi99KucPzPW",
	"6oxjUk90IAHMjVlv8n1838KhGurFHN9rjPijdjXT"
);
Parse.serverURL = 'https://parseapi.back4app.com/';

var clientAdminPortalApp = angular.module('clientAdminPortalApp', ['tagged.directives.infiniteScroll', 'ui.router', 'ui.bootstrap', 'alexjoffroy.angular-loaders']);

var toArray = function(obj){
	var result = [];
	for (var p in obj)
		if (typeof(obj[p]) != 'function') result.push(obj[p]);
	return result;
}
