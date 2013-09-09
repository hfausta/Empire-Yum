/*======================================================= global varibles =======================================================*/
	var map;		//map object
	var infowindow;		
	var myMarker;		//current position marker
	var markersArray = [];	//will be used for storing markers for referencing purpose
	var service;
	var myPos;
	var advance;
/*======================================================= !global varibles =======================================================*/


$(document).ready(function() {
	$('#searchForm').on('submit', function(event) {
		event.preventDefault();
		search();
	});
});

/*
 * Initializer.
 * Create map object and center it to current location(or Sydney if current location cannot be found) and 
 * create a marker indicates current location of user
 * Default map type: ROADMAP
 * Default zoom level: 17
 */
function initialize() {
	infowindow = new google.maps.InfoWindow();
	<!--- Construct and then draw the map --->
	if(navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(
			function(position){
				myPos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
				map = new google.maps.Map(document.getElementById('map-canvas'), {
					mapTypeId: google.maps.MapTypeId.ROADMAP,	//the default map type
					zoom: 17,	//the default zoom level
					center: myPos
				});
				drawMyMarker();
			},function() {
				handleNoGeolocation(true);
			});
	}else{
	// Browser does not support Geolocation
		handleNoGeolocation(false);
	}
}


/*======================================================= search controls =======================================================*/

/*
 * Run a text search according to user's current location & inputs
*/
function search(){
	<!--- Find current location --->
	if(navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(
			function(position){
				myPos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
				// make a new request
				var request = getRequest();
				if (service == null) {
					service = new google.maps.places.PlacesService(map);
				}
				// pass the request
				if(!advanced){
					service.textSearch(request, callback);
				}else{
					service.nearbySearch(request, callback);
				}  
			},function() {
				handleNoGeolocation(true);
			}
		);
	}else{
		// Browser does not support Geolocation
		handleNoGeolocation(false)
	}		     
}

/*
 * returns the a request object accroding to user input
 */
function getRequest(){
	var advanced = document.getElementById('advanced').checked;
	var minprice;
	if(document.getElementById('address')){
		minprice = document.getElementById('address').value;
	}
	var query = 'food';
	if(document.getElementById('keyword').value != ''){
		query = document.getElementById('keyword').value+' '+query;
	}
	if(document.getElementById('cuisine').value != ''){
		query = document.getElementById('cuisine').value+' '+query;
	}
	var types = ['bakery','food','bar','cafe','meal_delivery','meal_takeaway','night_club','restaurant'];
	
	var opennow = document.getElementById('opennow').checked;
	var request;
	if(!advanced){
		var location = myPos;
		var radius = '500';
		request = {
		location: location,
		radius: radius,
		query: query,
		types: types,
		openNow: opennow,
		minprice: minprice
		};
	}else{
		var location = minprice = document.getElementById('address').value;
		var radius = minprice = document.getElementById('radius').value;;
		request = {
		location: location,
		radius: radius,
		keyword: query,
		types: types,
		openNow: opennow,
		minprice: minprice
		};
	}
	
return request; 
}

/*
 * search request callback function
 * draw search result markers, current position maker, and display result list
*/
function callback(results, status) {
	if (status == google.maps.places.PlacesServiceStatus.OK) {
		clear();		//erase all markers & infowindow
		for (var i = 0; i < results.length; i++) {
			createMarker(results[i],i+1);
		}
		drawMyMarker();
		showResults(results);
	}
	map.setCenter(markersArray[0].getPosition());	//Re-centrer the map
}

/*
 * Error handler for browser/service error.
 * As error occurs, error message will be generated accordingly, and then
 * re-center the map to sydney
*/
function handleNoGeolocation(errorFlag) {
       if (errorFlag) {
               var content = 'Error: The Geolocation service failed.';
       } else {
               var content = 'Error: Your browser doesn\'t support geolocation.';
       }

       var options = {
               map: map,
               position: new google.maps.LatLng(-33.867387,151.207629),		//re-center the map
               content: content
       };

       infowindow = new google.maps.InfoWindow(options);
       map.setCenter(options.position);
}

/*======================================================= !search controls =======================================================*/

/*=======================================================  map display controls =======================================================*/

/*
 * draws current location marker on the map
 */
function drawMyMarker(){
	myMarker = new google.maps.Marker({
		map: map,
		title: 'My location',
		icon: 'http://jspace.com.au/gmap/img/markers/arrow.png',
		position: myPos
	});
}

/*
 * Create an individual marker on the map, then 
 * store the marker in an array for referencing purpose
*/
function createMarker(place,index) {
	<!--- Create a marker on the map--->
	image='http://jspace.com.au/gmap/img/markers/marker'+index+'.png';
	var marker = new google.maps.Marker({
		map: map,
		title: place.name,
		icon: image,
		animation: google.maps.Animation.DROP,
		position: place.geometry.location
	});
	
	markersArray.push(marker);	//store the marker in the markersArray
	
	<!--- Adding click event to the marker--->
	
	google.maps.event.addListener(marker, 'click', function() {
		var string = place.name;
		if(place.icon){
			string = '<img src="' + place.icon + '" />' + string;
		}
		if(place.rating){
			string += '<br />Rating: ' + place.rating;
		}
		if(place.formatted_address){
			string += '<br />Address: ' + place.formatted_address;
		}
		if(place.international_phone_number){
			string += '<br />Phone: '+place.international_phone_number;
		}
		infowindow.setContent(string);
		infowindow.open(map, this);
		map.setCenter(this.getPosition());	//Re-center the map
	});
}

/*
 * Removes all the marker, infowindow and result listfrom the map
*/
function clear() {
	<!--- Removing all the marker--->
	if (markersArray) {
		for (i in markersArray) {
			markersArray[i].setMap(null);
		}
	}
	markersArray.length = 0;
	
	<!--- Removing myMarker--->
	if (myMarker){
		myMarker.setMap(null);
	}
	
	<!--- Removing infowindow--->
	if (infowindow) {
		infowindow.close();
	}
	
	<!--- Removing result list--->
	$("#result_list").empty();
}

/*=======================================================  !map display controls =======================================================*/

/*======================================================= result list control =======================================================*/

/*
 * html code for constructing containers for result list in '#results' div
 * Input:  results - an array of search results
 */
function prepareResults(results){
	$("#results").html("");
	$('#results').append('<div class="accordion" id="resultsList"></div>');
	for(var i=0;i<results.length;i++){
		var html = '';
		html += '<div class="accordion-group">';
		html += '<div class="accordion-heading">';
		html += '<a class="accordion-toggle" data-toggle="collapse" data-parent="#resultsList" href="#collapse-'+i+'" onclick="hideReviews('+i+')">';
		html += (i+1)+'. '+results[i].name;
		html += '</a>';
		html += '</div>';
		html += '<div id="collapse-'+i+'" class="accordion-body collapse">';
		html += '<div class="accordion-inner">';
		html += 'loading......';	//default text
		html += '</div>';
		html += '</div>';
		html += '</div>';
		
		$('#resultsList').append(html);
	}
}

/*
 * set content for an individual list item container
 * Input:  result - one single result object; index - the array index of the result object
 */
function setContent(result,index){
	var ref = { reference:result.reference };
	
	service.getDetails(ref, function (place, status) {
		if (status === google.maps.places.PlacesServiceStatus.OK) {
			var html =  listItemContent(place,index);
			$('#collapse-'+index+'>div').html(html);
		} else if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
			setTimeout(function() {
	                setContent(result,index);
	            }, 500);
		}
	});
}

/*
 * html code for details of one result item
 * Input:  place - a place object; index - the array index of the place object (same as the search result index)
*/
function listItemContent(place,index){
	var html='';
	//name & icon
	if (place.icon && place.name) {
		var event = 'onclick="liEvent('+index+')"';
		html += '<a href="#map-canvas" class="scrollDown" id="result-link-'+index+'"'+event+'>';
		html += '<img class="placeIcon" src="'+place.icon+'" style="float:right;vertical-align: top">';
		html += '<h4>' + place.name + '</h4>';
		html += '</a>';
	}    
	//address
	if(place.formatted_address){
		html += '<p><div class=\"placeAdd\">' + place.formatted_address + '</div>';
	}
	
	if(place.vicinity){
		html += '<p><div class=\"placeAdd\">' + place.vicinity + '</div>';
	}
	//phone number
	if(place.formatted_phone_number){
		html += '<div class=\"placePhone\">Phone:' + place.formatted_phone_number + '</div>';
	}
	//price level
	switch (place.price_level) {
		case 0:
			html += "<div class=\"placePrice\">Price: FREE</div>";
			break;
		case 1:
			html += "<div class=\"placePrice\">Price: Inexpensive</div>";
			break;
		case 2:
			html += "<div class=\"placePrice\">Price: Moderate</div>";
			break;
		case 3:
			html += "<div class=\"placePrice\">Price: Expensive</div>";
			break;
		case 4:
			html += "<div class=\"placePrice\">Price: Very Expensive</div>";
			break;
		default:
			break;
	}
	//rating
	if (place.rating) {
		html += "<div class=\"placeRating\">Rating: "+place.rating+"</div>";
	}
	//opening hours
	if (place.opening_hours) {
		if (place.opening_hours.periods) {
			var today = new Date().getDay();
			for(i=0;place.opening_hours.periods[i]!=null;i++) {
				if (place.opening_hours.periods[i].open && place.opening_hours.periods[i].open.day == today &&
					place.opening_hours.periods[i].close && place.opening_hours.periods[i].close.day == today) {
					if(place.opening_hours.periods[i]["open"]["time"] && place.opening_hours.periods[i]["close"]["time"]){
						html += "<div class=\"placeOpening\">Today's business hours: "+
						place.opening_hours.periods[i]["open"]["time"].substr(0, 2)+':'+
						place.opening_hours.periods[i]["open"]["time"].substr(2)+"-"+
						place.opening_hours.periods[i]["close"]["time"].substr(0, 2)+':'+
						place.opening_hours.periods[i]["close"]["time"].substr(2)+"</div>";
					}
				}
			}
		}
	}
	//website
	if (place.website){
		html += '<div class="placeWebsite"><a class="placeWebsite" target="_blank" href="'+place.website+'">'+place.website+'</a></div>';
	}
	//photo
	if(place.photos){
		html += '<div class="placePhotos_div">';
		for(var i=0;i<place.photos.length;i++){
			html += '<img class="placePhoto" id="photo_'+index+'_'+i+'" src="'+place.photos[i].getUrl({'maxWidth':400})+'" onclick="toggleImg('+index+','+i+')">';
		}
		html += '</div>';
	}
	//review
	if (place.reviews){
		html += '<div class="review_div" id="review_div_'+index+'\">';
		for(i=0;i<place.reviews.length;i++){
			if(place.reviews[i].text){
				html += '<div class="placeReview" id="review_'+index+'_'+i+'"><hr>"'+place.reviews[i].text+'"</br><span class="review_author">-'+place.reviews[i].author_name+'</span></div>';
			}
		}
		html += '</div><hr><a href="#review_div_'+index+'" id="review_link_'+index+'" onclick="toggleReviews('+index+')">Show reviews</a>';
	}
	
	html += '</p>';
	return html;
}

/*
 * list item click event
 * base on the input index number, will trigger the corresponding markers click event
 * Input: index - index of a marker in the markersArray
 */
function liEvent(index){
	new google.maps.event.trigger( markersArray[index], 'click' );
}


/*
 * toggle image size
 */
function toggleImg(i1,i2){
	var id = '#photo_'+i1+'_'+i2;
	if($(id).width()==50){
		$('.placePhoto').width(50);
		$(id).width(400);
	}else{
		$('.placePhoto').width(50);
	}
}


/*
 * toggle reviews div hide/display
 */
function toggleReviews(index){
	$('#review_div_'+index).slideToggle();
	if($('#review_link_'+index).text() == 'Show reviews'){
		$('#review_link_'+index).html('Hide reviews');
		liEvent(index);
	}else{
		$('#review_link_'+index).html('Show reviews');
	}
}

/*
 * hide reviews div
 */
function hideReviews(index){
	$('#review_div_'+index).hide();
	$('#review_link_'+index).html('Show reviews');
}

/*
 * Construct result list
 */
function showResults(results){
	prepareResults(results);
	for (var i = 0; i < results.length; i++) {
		setContent(results[i],i);
	}
}

/*======================================================= ! result list control =======================================================*/

google.maps.event.addDomListener(window, 'load', initialize); //Calls the initializer on load