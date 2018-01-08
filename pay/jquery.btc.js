/*
 *  jquery-btc - v0.0.1
 *	Bitcoin utilities.
 *
 *  Created by Alfred Gutierrez
 *  Under MIT License
 */

;(function ( $, window, document, undefined ) {
		// Working bitcoin ticker APIs
		var firebaseApi = "https://publicdata-cryptocurrency.firebaseio.com/bitcoin.json";
		var bitpayApi = "https://bitpay.com/api/rates";

		// YUI YQL can be used as a wrapper to query json APIs that don't allow
		// cross origin. Use this as a work-around.
		var yui = "http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20html%20where%20url%3D%22https://www.bitstamp.net/api/ticker/%22&format=json&callback=";

		// Use these sources with YQL as they prevent cross-origin
		var bitstampApi = "https://www.bitstamp.net/api/ticker/";
		var btceApi = "https://btc-e.com/api/2/btc_usd/ticker";
		var coinbaseApi = "https://coinbase.com/api/v1/prices/buy";
		var bitfinexApi = "https://api.bitfinex.com/v1/ticker/btcusd";

		// Create the defaults
		var pluginName = "btc",
				defaults = {
					propertyName: "value",
					btcSource: firebaseApi,
					decimals: 4
		};



		// plugin constructor
		function Plugin ( element, options ) {
				this.element = element;
				// jQuery has an extend method which merges the contents of two or
				// more objects, storing the result in the first object. The first object
				// is generally empty as we don't want to alter the default options for
				// future instances of the plugin
				this.settings = $.extend( {}, defaults, options );
				this._defaults = defaults;
				this._name = pluginName;
				this.init();
		}

		// Avoid Plugin.prototype conflicts
		$.extend(Plugin.prototype, {
				init: function () {
						// Place initialization logic here
						// You already have access to the DOM element and
						// the options via the instance, e.g. this.element
						// and this.settings
						// you can add more functions like the one below and
						// call them like so: this.yourOtherFunction(this.element, this.settings).
						this.getBTCData();
				},
				getBTCData: function() {
					// Fetch BTC rate data from source
					$.ajax({
						context: this,
						url: this.settings.btcSource,
						type: "GET",
						dataType: "json",
						success: function(data) {
								var usd = $(this.element).data("usd");
								var rate = data.ask;
								var conversion = usd / rate;
								var result = conversion.toFixed(this.settings.decimals);

								$(this.element).append(
									"&nbsp;&nbsp;<span style='border-bottom: 1px dotted #999' \
									title='Updated: " + data._updated + "'>" + result + " BTC \
									</span>");

						},
						error: function() {
							console.log("Unable to get BTC data from source.");
						}
					});
				}
		});

		// A really lightweight plugin wrapper around the constructor,
		// preventing against multiple instantiations
		$.fn[ pluginName ] = function ( options ) {
				this.each(function() {
						if ( !$.data( this, "plugin_" + pluginName ) ) {
								$.data( this, "plugin_" + pluginName, new Plugin( this, options ) );
						}
				});

				// chain jQuery functions
				return this;
		};

})( jQuery, window, document );