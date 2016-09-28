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
  "wx4doiqt8fc5jl1l81s2mi2i00ys9ef186st6exh",
  "cah1ks6eqm5x7kpe754y750yiv0le6dgs8sic9xi"
);
Parse.serverURL = 'https://pg-app-pxmounn4jijli2czy68sx59e0hsxsd.scalabl.cloud/1/';

var clientAdminPortalApp = angular.module('clientAdminPortalApp', ['tagged.directives.infiniteScroll', 'ui.router', 'ui.bootstrap']);

var toArray = function(obj){
	var result = [];
	for (var p in obj)
		if (typeof(obj[p]) != 'function') result.push(obj[p]);
	return result;
}
