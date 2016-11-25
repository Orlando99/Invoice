'use strict';

invoicesUnlimited.factory('reportsCommon', [
function(){

return {
	getDateRanges : function() {
		return ['Custom', 'Today', 'This Week', 'This Month',
			'This Year', 'This Quarter', 'Yesterday', 'Previous Week',
			'Previous Month', 'Previous Year', 'Previous Quarter'
		];
	},
	openDatePicker : function(params) {
		var _scope = params._scope;
		if (_scope.selectedDateRange != 'Custom') 
        {
 
            return;
        }
		switch (params.n) {
			case 1: _scope.openPicker1 = true; break;
			case 2: _scope.openPicker2 = true; break;
		}
	},
	dateRangeChanged : function(params) {
		var _scope = params._scope;
		var d = new Date();
		var year = d.getFullYear();
		var month = d.getMonth(); // month(0-11)
		var day = d.getDate(); // day(1-31)
		var weekday = d.getDay(); // weekday(1-7)
	 
		var fromDate = new Date(year, month, day);
		var toDate = new Date();

		switch(_scope.selectedDateRange){
		case 'Today':
			toDate = new Date();
			break;

		case 'This Week':
			// works if week spans on previous month
			fromDate = new Date(year, month, day-weekday+1);
			break;

		case 'This Month':
			fromDate = new Date(year, month, 1);
			break;

		case 'This Year':
			fromDate = new Date(year, 0, 1);
			break;

		case 'This Quarter':
			var m = month > 5 ? 6 : 0;
			fromDate = new Date(year, m, 1);
			break;

		case 'Yesterday':
			// works if yesterday is in previous month
			fromDate = new Date(year, month, day-1);
			break;

		case 'Previous Week':
			fromDate = new Date(year, month, day-weekday-6);
			toDate = new Date(year, month, day-weekday);
			break;

		case 'Previous Month':
			fromDate = new Date(year, month-1, 1);
			// day = 0 gives last day of previous month
			toDate = new Date(year, month, 0);
			break;

		case 'Previous Year':
			fromDate = new Date(year-1, 0, 1);
			toDate = new Date(year-1, 11, 31);
			break;

		case 'Previous Quarter':
			if(month > 5) {
				fromDate = new Date(year, 0, 1);
				toDate = new Date(year, 5, 30);
			} else {
				fromDate = new Date(year-1, 6, 1);
				toDate = new Date(year-1, 11, 31);
			}
			break;
		}       
		_scope.fromDate = fromDate;
		_scope.toDate = toDate;

	}
};

}]);