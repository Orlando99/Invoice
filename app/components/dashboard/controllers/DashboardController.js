'use strict';

invoicesUnlimited.controller('DashboardController',['$scope','$state','userFactory','businessFactory','$q',
	'invoiceService', 'expenseService', 'coreFactory', 'currencyFilter', 'cleanDataService','$ngConfirm',
function($scope,$state,userFactory,businessFactory,$q,invoiceService,expenseService,
	coreFactory,currencyFilter,cleanDataService,$ngConfirm){
	showLoader();
	var user = userFactory;
	var business = businessFactory;
    if(!user.entity.length){
        $state.go('login');
        hideLoader();
        return;
    }
    
	var version = "123";
	
	var Version = Parse.Object.extend("Extras");
	
	var versionQuery = new Parse.Query(Version);
	//debugger;
	/*
	versionQuery.first()
	.then(function(obj){
		var currentVersion = obj.get("version");
		if(currentVersion != version)
			window.location.reload(true);
	});
	*/
	
	versionQuery.first()
	.then(function(obj){
		var currentVersion = obj.get("version");
		if(currentVersion != version){
			$ngConfirm({
				boxWidth: '30%',
    			useBootstrap: false,
				theme: 'supervan',
				icon: 'fa fa-refresh fa-spin',
				title: 'Reload!',
				content: 'A new version of Invoices Unlimited is available. Please reload the page to strat using it.',
				scope: $scope,
				buttons: {
					relaod: {
						text: 'Reload Page',
						btnClass: 'btn-blue',
						action: function(scope, button){
							window.location.reload(true);
						}
					}
				}
			});
		}
	});
	
	$scope.role = user.entity[0].get('role');
	
    $q.when(businessFactory.load())
    .then(function(obj){
        if(!obj){
            $state.go('signup.invoiceTemplateInfo');
        }
        business = obj.entity[0]; 
        
        $scope.businessInfo = business;
        $scope.userName =  user.entity[0].get('username');

		if ($('#link-reports').offset()) {
			pos = parseInt($('#link-reports').offset().left);
			negative_pos = pos * (-1);
			$('.navigation > li .link-reports-div').css('left',negative_pos);
		}
		
		if($scope.role == 'Sales')
			$('#invoices-link').css('margin-left',"130px");
		
		if($('#link-dashboard').offset() && $scope.role == 'Sales'){
			var pos = parseInt($('#link-dashboard').offset().left);
			var negative_pos = pos * (-1) ;
			$('.navigation > li .link-sales-div').css('left',negative_pos);
			$('#invoices-link').css('margin-left',"130px");
		} else {
			if ($('#link-sales').offset()) {
				var pos = parseInt($('#link-sales').offset().left);
				var negative_pos = pos * (-1) ;
				$('.navigation > li .link-sales-div').css('left',negative_pos);
			}
		}
		
		if ($('#link-reports').offset() && $scope.role == 'Manager') {
			if(parseInt($('#link-reports').offset().left) != 0)
				pos = parseInt($('#link-reports').offset().left);
			else
				pos = parseInt($('#link-settings').offset().left);
			negative_pos = pos * (-1);
			$('.navigation > li .link-settings-div').css('left',negative_pos);
		}
		else if ($('#link-settings').offset()) {
			pos = parseInt($('#link-settings').offset().left);
			negative_pos = pos * (-1);
			$('.navigation > li .link-settings-div').css('left',negative_pos);
		}
        
    });
    
    var selectedorganization = user.entity[0].get("selectedOrganization");
    var query = new Parse.Query('Organization');
    query.get(selectedorganization.id, {
          success: function(obj) {
              var logo = obj.get('logo');
              if(logo)
                $scope.userLogo = logo._url;
              else
                  $scope.userLogo = './assets/images/user-icon.png';
            
          },
          error: function(obj, error) {
            // The object was not retrieved successfully.
            // error is a Parse.Error with an error code and message.
          }
        });

	if (!user.entity.length) {
		hideLoader();
		$state.go('login');
		return;
	}
    
    var cc = user.entity[0].currency;
    /*
    $q.when(userFactory.entity[0].fetch())
    .then(function(obj) {

          cc = obj.get('currency').attributes;

    });
    */
    //var cc = user.entity[0].currency.attributes;
    //var cc = user.entity[0].get('currency').attributes;
    
    $scope.currentCurrency = cc;
	loadColorTheme(user);
	$scope.businessInfo = businessFactory.entity.length ?
						  businessFactory.entity[0] :
						  {};
	$scope.logOut = function(errorMsg){
		return user.logout()
		.then(function(){
			resetColorTheme();
			cleanDataService.clearAllOnLogOut();
			$state.go('login', {'errorMsg' : errorMsg});
		});
	};

	$scope.pageReady = function($event) {
		var c = $state.current.name;
		$('.nav-item').removeClass('active');

		if (c.includes('customers.'))
			$('#customers').addClass('active');
        
        else if (c.includes('projects.'))
            $('#projects').addClass('active');

		else if (c.includes('sales.'))
			$('#sales').addClass('active');

		else if (c.includes('expenses.'))
			$('#expenses').addClass('active');

		else if (c.includes('reports.'))
			$('#reports').addClass('active');

		else if (c.includes('settings.payments'))
			$('#payments').addClass('active');
		
		else if (c.includes('settings.'))
			$('#settings').addClass('active');

		else if(c.includes('dashboard'))
			$('#dashboard').addClass('active');

		if ($('#link-sales').offset) {
			var pos = parseInt($('#link-sales').offset().left);
			var negative_pos = pos * (-1) ;
			$('.navigation > li .link-sales-div').css('left',negative_pos);
		}

		if ($('#link-expense').offset) {
			pos = parseInt($('#link-expense').offset().left);
			negative_pos = pos * (-1) ;
			$('.navigation > li .link-expense-div').css('left',negative_pos);
		}

		if ($('#link-settings').offset) {
			pos = parseInt($('#link-settings').offset().left);
			negative_pos = pos * (-1);
			$('.navigation > li .link-settings-div').css('left',negative_pos);
		}

		if ($('#link-reports').offset) {
			pos = parseInt($('#link-reports').offset().left);
			negative_pos = pos * (-1);
			$('.navigation > li .link-reports-div').css('left',negative_pos);
		}
		
		$.reject({  
			reject: {  
				safari: true, // Apple Safari  
				//chrome: true, // Google Chrome  
				firefox: true, // Mozilla Firefox  
				msie: true, // Microsoft Internet Explorer  
				opera: true, // Opera  
				konqueror: true, // Konqueror (Linux)  
				unknown: true // Everything else  
			},
			display: ['chrome'],
			browserInfo: { // Settings for which browsers to display  
				chrome: {  
					// Text below the icon  
					text: 'Google Chrome',  
					// URL For icon/text link  
					url: 'http://www.google.com/chrome/',   
				} 
			},
			// Pop-up Window Text
			header: '',

			paragraph1: 'Invoices Unlimited is optimized for Google Chrome. If you continue to use this browser you may run into some issues.',

			paragraph2: 'Just click on the icon to get to the download page',

			// Allow closing of window
			close: true,

			// Message displayed below closing link
			closeMessage: 'By closing this window you acknowledge that your experience '+
							'on this website may be degraded',
			closeLink: 'Close This Window',
			closeESC: true,  
			// Use cookies to remmember if window was closed previously?  
			closeCookie: true, 
			cookieSettings: {  
				// Path for the cookie to be saved on  
				// Should be root domain in most cases  
				path: '/',  
				// Expiration Date (in seconds)  
				// 0 (default) means it ends with the current session  
				expires: 0  
			}, 
			imagePath: './assets/images/'
		});
/*

		$('.nav-item').click(function(event) {
			$('.nav-item').removeClass('active');
			var a = $(this).parents('li');
			if (a.length) {
				a.addClass('active')
			} else {
				$(this).addClass('active');
			}
		});
*/
	}
	var organization = undefined;  
    /*
	var promises = [];
	promises.push(businessFactory.load());
	$q.all(promises)
	.then(function(obj){
		if (obj.length && obj[0]) {
			$scope.businessInfo = obj[0].entity[0];

			// return if we are not on Dashboard
			if (! $state.current.name.endsWith('dashboard')) return;

			organization = user.entity[0].get("organizations")[0];
            
            $q.when(cc.fetch())
            .then(function(obj) {
                cc = obj.attributes;
                $scope.currentCurrency = cc;
                hideLoader();
                drawBarChart();
                drawPieChart();
            });
		} else {
			$scope.logOut('Your account is not setup correctly.');
		}
	}, function(error){
		$scope.logOut('Your account is not setup correctly.');
	});
*/
	
	if($scope.role == 'Sales' && !($state.current.name.includes('sales') || $state.current.name == 'dashboard.settings.user-profile' || $state.current.name == 'dashboard.settings.app-preferences' || $state.current.name == 'dashboard.settings.contact')){
		$state.go('dashboard.sales.invoices.all');
		return;
	}
	
    if (! $state.current.name.endsWith('dashboard')){
        return;
    } else if($scope.role == 'Sales'){
		$state.go('dashboard.sales.invoices.all');
		return;
	}
    else{
        organization = user.entity[0].get("organizations")[0];
        
        $q.when(cc.fetch())
        .then(function(obj) {
            cc = obj.attributes;
            //if(!cc.exchangeRate) cc.set('exchangeRate', 1);
            
            if(cc.exchangeRate){
                $scope.currentCurrency = cc;
            }
            else{
                var temp = {
                    'currencySymbol': '$',
                    'exchangeRate'  : 1
                };
                $scope.currentCurrency = temp;
                
                cc = temp;
            }
            
            hideLoader();
            drawBarChart();
            drawPieChart();
        });
    }  
function drawBarChart() {
	var months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY',
		'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
	var colors = ['#0ea81c', '#2aa7f7', '#c31e1e']
	var monthlySales   = [0,0,0,0,0,0,0,0,0,0,0,0];
	var monthlyIncome  = [0,0,0,0,0,0,0,0,0,0,0,0];
	var monthlyExpense = [0,0,0,0,0,0,0,0,0,0,0,0];
    
    expenseService.getExpensesForSummary({
		organization : organization
	}).then(function(objs) {
		objs.forEach(function(expense){
            var eDate = expense.entity.expanseDate;
            var index = eDate.getMonth();
            monthlyExpense[index] += expense.entity.amount * cc.exchangeRate;
        });
	});

	$q.when(invoiceService.getInvoicesForSummary({
		organization : organization
	}))
	.then(function(objs) {
		$scope.totalSales = 0;
		$scope.totalIncome = 0;
		$scope.totalReceivables = 0;
		$scope.totalCurrentReceivables = 0;
		$scope.totalOverdueReceivables = 0;
		$scope.overDueInLast15 = 0;
		$scope.overDueInLast30 = 0;
		$scope.overDueInLast45 = 0;
		$scope.overDueFromOver45 = 0;

		objs.forEach(function(invoice) {
			var total = invoice.entity.total * cc.exchangeRate;
			var due = invoice.entity.balanceDue * cc.exchangeRate;
			var date = invoice.entity.invoiceDate;
			var expireDate = invoice.entity.dueDate;
			var index = date.getMonth();

			switch(invoice.entity.status) {
			case 'Unpaid':
			case 'Sent':
				$scope.totalSales += total;
				$scope.totalReceivables += total;
				$scope.totalCurrentReceivables += total;
				break;

			case 'Overdue':
				$scope.totalSales += total;
				$scope.totalReceivables += total;
				$scope.totalOverdueReceivables += total;
				addToRelevantRange(date, expireDate, total);
				break;

			case 'Paid':
				$scope.totalSales += total;
				$scope.totalIncome += total;
				monthlyIncome[index] += total;
				break;

			case 'Partial Paid':
				$scope.totalSales += total;
				$scope.totalIncome += total - due;
				$scope.totalReceivables += due;
				$scope.totalCurrentReceivables += due;
				monthlyIncome[index] += total - due;
				break;

			case 'Refunded':
				$scope.totalSales += total;
				break;

			case 'Partial Refunded':
				$scope.totalSales += total;
				$scope.totalIncome += total - due;
				monthlyIncome[index] += total - due;
				break;
			}

			monthlySales[index] += total;
		});

		return organization.fetch();
	})
	.then(function(org) {
		// rotate arrays according to selected fiscal month
		var fiscalMonth = org.get('fiscalYearStart');
		var count = getrotateCount(fiscalMonth);
		months.rotate(count);
		monthlySales.rotate(count);
		monthlyIncome.rotate(count);
		monthlyExpense.rotate(count);
        
        for(var i = 0; i < monthlySales.length; i++){
               monthlySales[i] =   monthlySales[i].toFixed(2);
        } 
        for(var i = 0; i < monthlyIncome.length; i++){
           
               monthlyIncome[i] = monthlyIncome[i].toFixed(2);
        } 
        for(var i = 0; i < monthlyExpense.length; i++){
               monthlyExpense[i] =monthlyExpense[i].toFixed(2);
        } 
 
		var ctx = $("#barchart");
		var myChart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: months,
				datasets: [{
                    label:"Sale",
					backgroundColor: colors[0],
					data: monthlySales
				}, {
                     label:"Income",
					backgroundColor: colors[1],
					data: monthlyIncome
				}, {
                     label:"Expense",
					backgroundColor: colors[2],
					data: monthlyExpense
				}]
			},
			options: {
				responsive: false,
                tooltipTemplate: "<%if (labels){%><%=labels%>:: <%}%><%= value %>",
                tooltips: {
                    mode: 'single',
                        custom: function(tooltip) {
                            // tooltip will be false if tooltip is not visible or should be hidden
                            if (!tooltip) {
                                return;
                            }
                            
                            tooltip.title = [];
                        },
                    callbacks: {
                        label:
                        function(item,data) {
							var value = data.datasets[item.datasetIndex].data[item.index];
							var label = data.labels[item.index];
							
							return [item.xLabel + ': ' + $scope.currentCurrency.currencySymbol + numberWithCommas(parseFloat(value).toFixed(2))];
						}
                    }
                },
				legend: {
					display: false
				},
				scales: {
					yAxes:
                    [{
						ticks: {
							beginAtZero:true,
                            userCallback: function(value, index, values) {
                                return numberWithCommas(value.toFixed(2));
                            }
						}
					}]

				}
			}
		});
	});

}
function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
    
    
function drawPieChart() 
{
	var promiseList = [];
	var promise = undefined;

	promise = $q.when(coreFactory.getExpenseCategories({
		organization : organization
	})).then(function(objs) {
		$scope.categories = objs;
	});
	promiseList.push(promise);

	promise = $q.when(coreFactory.getDefaultExpenseCategories())
	.then(function(objs) {
		$scope.defaultCategories = objs;
	});
	promiseList.push(promise);

	expenseService.getExpensesForSummary({
		organization : organization
	}).then(function(objs) {
		return $q.all(promiseList)
		.then(function() {
			return objs;
		});
	})
	.then(function(objs) 
    {
        var uniqueExpenses = [];
        var total = 0;
        
        objs.forEach(function(exp){
            var index = uniqueExpenses.findIndex(function(uObj){
                return uObj.name == exp.entity.category;
            });
            
            if(index > -1){
                uniqueExpenses[index].amount += exp.entity.amount;
            }
            else{
                uniqueExpenses.push({
                    name: exp.entity.category,
                    amount: exp.entity.amount
                });
            }
            total += exp.entity.amount;
        });
        
        uniqueExpenses.forEach(function(exp){
            exp.percentage = (exp.amount / total * 100).toFixed(2);
        });
        
        var expenseNameList = [];
		var expenseValueList = [];
		var expenseColorList = [];
        
        uniqueExpenses.sort(function(a, b){
            return b.amount - a.amount;
        });
        
		if(uniqueExpenses.length > 5){
			uniqueExpenses.splice(5, uniqueExpenses.length - 5);
		}
		
		var topTotal = 0;
		
        uniqueExpenses.forEach(function(exp){
            exp.value = currencyFilter(exp.amount*cc.exchangeRate, cc.currencySymbol, 2)
            expenseNameList.push(exp.name + ' (' + exp.percentage + '%)');
            expenseValueList.push(exp.amount);
            expenseColorList.push(getColor(exp.name));
			topTotal += exp.amount;
        });
        
        $scope.expenseList = uniqueExpenses;
        
        $scope.totalExpenseAmount = currencyFilter(total*cc.exchangeRate, cc.currencySymbol, 2);
        $scope.totalTopExpenseAmount = currencyFilter(topTotal*cc.exchangeRate, cc.currencySymbol, 2);
        
		var ctx = document.getElementById("piechart");
        //console.log(Chart.defaults );
        var helpers = Chart.helpers;
        
		var myChart = new Chart(ctx, {
			type: 'pie',
			data: {
				labels: expenseNameList,
				datasets: [{
					data: expenseValueList,
					backgroundColor: expenseColorList
				}],
			},
			options: {
                elements: {
                    arc: {
                        borderColor: "#fff",
                        borderWidth: 0
                    }
                },
                segmentShowStroke: true,
                segmentStrokeColor: "#000",
                segmentStrokeWidth: 50,
                legend: {
                    display  : true,
                    position : 'bottom',
                    fullWidth: false,
                    labels: {
                           boxWidth:	20,	 
                           fontSize: 12
                           //fontColor: 'rgb(255, 99, 132)'
                        //padding:5
                    },
                    onHover : function(event, legendItem) {
                        alert("hi");
                    },
                    onClick: function (e, legendItem) {
                        e.stopPropagation();
                    }
                }, 
				showTooltips: true,
                showAllTooltips: false,
				responsive: false,
				rotation: 0,
                hover: {
                    intersect: true,
                    animationDuration: 400,
                    enabled: true
            },
            tooltips:
            {
                enabled: true,
                custom: function(tooltip) {
                            // tooltip will be false if tooltip is not visible or should be hidden
                            if (!tooltip) {
                                return;
                            }
                            //tooltip.afterBody = ["hello"];
                            if(tooltip.body){
                                tooltip.title = [tooltip.body[0].lines[0]];
                                tooltip.body[0].lines = [tooltip.body[0].lines[1]];
                                tooltip.titleFontSize = 20;
                                tooltip.bodyFontSize = 14;
                                tooltip.y -= 10;
                            }
                            //tooltip.title = [];
                        },
					callbacks: {
						label:
                        function(item,data) {
							var value = data.datasets[item.datasetIndex].data[item.index];
							var label = data.labels[item.index];
							//var percentage = ((value / totalExpense) * 100).toFixed(1);
							return [ "$ "+numberWithCommas(value.toFixed(2)), label];
						}

					}
				}
			}
		});
     });  
} 
    
/*
function drawPieChart() 
{
	var promiseList = [];
	var promise = undefined;

	promise = $q.when(coreFactory.getExpenseCategories({
		organization : organization
	})).then(function(objs) {
		$scope.categories = objs;
	});
	promiseList.push(promise);

	promise = $q.when(coreFactory.getDefaultExpenseCategories())
	.then(function(objs) {
		$scope.defaultCategories = objs;
	});
	promiseList.push(promise);

	expenseService.getExpensesForSummary({
		organization : organization
	}).then(function(objs) {
		return $q.all(promiseList)
		.then(function() {
			return objs;
		});
	})
	.then(function(objs) 
    {
		var totalExpense = 0;
		var expenseList = [];
        
		var expenseNameList = [];
		var expenseValueList = [];
		var expenseColorList = [];
        var expensePercentageList = [];

		var uniqueExpenses = {};
        var size = objs.length;
        var texp =0;
        var listNew = [];
        for(var i=0;i< objs.length;i++)
        {
           listNew[i] = objs[i].entity;    
        }
        listNew.sort(function(a,b) {        
			return b.amount- a.amount;
		});
        for(var i = 0 ; i < size ; i++)
        {
            var expense = objs[i];
            var value = expense.entity.amount; 
            texp = value + texp;
        }
        var pr= [];
        for(var i = 0 ; i < size ; i++)
        {
            var expense = objs[i];
            var value = expense.entity.amount; 
            var percentage = ((value/ texp) * 100).toFixed(1);
            pr.push(percentage);
        }
        var originalname= [];
		for(var i=0; i < objs.length; i++) 
        {
               var expense = objs[i];
             //var name = expense.entity.category + "  " + pr[i] + "%" ;
               var name = expense.entity.category;// + "  " + pr[i] + "%" ;
               var value = expense.entity.amount;
               var flag = false;
               if(uniqueExpenses[name]) 
               {
                  uniqueExpenses[name] += value;
                  flag = true;
               } 
               else 
               {
                    originalname.push(expense.entity.category);
                    uniqueExpenses[name] = value;
                    expenseNameList.push(name);
                    flag = false;
               }
               var expObj = {
                    name: name+ "  " + pr[i] + "%" ,
                    value : value,
                    oName : name
                };
               if(!flag)
                {
                  expenseList.push(expObj);
                }
                else
                {
                   var index = expenseList.findIndex(function(ex){
                       return expObj.oName == ex.oName;
                   });
                    expenseList[index] = {
                       name: name+ "  " + pr[i] + "%",
                       value : uniqueExpenses[name],
                       oName : name
                  }
                }
        }//end of for
		expenseList.sort(function(a,b) {
			return b.value - a.value;
		});
		expenseList.forEach(function(exp) {
			exp.value = currencyFilter(exp.value*cc.exchangeRate, cc.currencySymbol, 2);
		});
		$scope.expenseList = expenseList;
		for(var i=0; i < expenseNameList.length; i++) {
			var name = expenseNameList[i];
			var value = uniqueExpenses[name];
			totalExpense += value;
			expenseValueList.push(value);
			expenseColorList.push(getColor(originalname[i]));
		}
        for( var i = 0; i <expenseValueList.length; i++)
        {
            for(var j = i ; j < expenseValueList.length ; j++ )
            {
                if(expenseValueList[i] < expenseValueList[j]){
                    var temp = expenseValueList[i];
                    expenseValueList[i] = expenseValueList[j];
                    expenseValueList[j] = temp;
                    
                    temp = expenseNameList[i];
                    expenseNameList[i] = expenseNameList[j];
                    expenseNameList[j] = temp;
                    
                    temp = expenseColorList[i];
                    expenseColorList[i] = expenseColorList[j];
                    expenseColorList[j] = temp;
                }
            }
        }
		$scope.totalExpenseAmount = currencyFilter(totalExpense*cc.exchangeRate, cc.currencySymbol, 2);  
        
		var ctx = document.getElementById("piechart");
        //console.log(Chart.defaults );
        var helpers = Chart.helpers;
        
		var myChart = new Chart(ctx, {
			type: 'pie',
			data: {
				labels: expenseNameList,
				datasets: [{
					data: expenseValueList,
					backgroundColor: expenseColorList
				}],
			},
			options: {
                elements: {
                    arc: {
                        borderColor: "#fff",
                        borderWidth: 0
                    }
                },
                segmentShowStroke: true,
                segmentStrokeColor: "#000",
                segmentStrokeWidth: 50,
                legend: {
                    display  : true,
                    position : 'bottom',
                    fullWidth: false,
                    labels: {
                           boxWidth:	20,	 
                           fontSize: 12
                           //fontColor: 'rgb(255, 99, 132)'
                        //padding:5
                    },
                    onHover : function(event, legendItem) {
                        alert("hi");
                    },
                    onClick: function (e, legendItem) {
                        e.stopPropagation();
                    }
                }, 
				showTooltips: true,
                showAllTooltips: false,
				responsive: false,
				rotation: 0,
                hover: {
                    intersect: true,
                    animationDuration: 400,
                    enabled: true
            },
            tooltips:
            {
                enabled: true,
                custom: function(tooltip) {
                            // tooltip will be false if tooltip is not visible or should be hidden
                            if (!tooltip) {
                                return;
                            }
                            //tooltip.afterBody = ["hello"];
                            if(tooltip.body){
                                tooltip.title = [tooltip.body[0].lines[0]];
                                tooltip.body[0].lines = [tooltip.body[0].lines[1]];
                                tooltip.titleFontSize = 20;
                                tooltip.bodyFontSize = 14;
                            }
                            //tooltip.title = [];
                        },
					callbacks: {
						label:
                        function(item,data) {
							var value = data.datasets[item.datasetIndex].data[item.index];
							var label = data.labels[item.index];
							var percentage =
								((value / totalExpense) * 100).toFixed(1);
							return [ "$ "+numberWithCommas(value.toFixed(2)), label];
						}

					}
				}
			}
		});
     });  
}
*/
function addToRelevantRange(creatDate, expireDate, amount) {
	// if there is no expire date, then invoice can not be in Overdue state.
	if (! expireDate) {
		console.log('expire date not available');
		return;
	//	expireDate = new Date(creatDate.getTime());
	//	expireDate.setHours(expireDate.getHours() + 1);
	}

	var today = new Date();
	var diff = Math.abs(today.getTime() - expireDate.getTime());
	var days = diff / (1000 * 3600 * 24);

	if (days >= 1 && days <= 15)
		$scope.overDueInLast15 += amount;

	else if (days >= 16 && days <= 30)
		$scope.overDueInLast30 += amount;

	else if (days >= 31 && days <= 45)
		$scope.overDueInLast45 += amount;

	else if (days > 45)
		$scope.overDueFromOver45 += amount;

}
function getColor(name) {
	var category =
	$scope.categories.find(function(obj) {
		return obj.entity.name == name;
	});
	if(! category) {
		category =
		$scope.defaultCategories.find(function(obj) {
			return obj.entity.name == name;
		});
		if(! category) category = {entity:{color:-1}};
	}

	return colorCodeToValue(category.entity.color);
}

}]);
