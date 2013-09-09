var key = 'AIzaSyCJUA2Dz22E-FkVnjZQXo46pm2DywlU9NM'; //API key
google.maps.visualRefresh = false;	//new map visual style
var map;				//map object
var lat;				//current latitude (number obtained from current location)
var long;				//current longitude (number obtained from current location)
var pos;				//current position object
var geocoder;			//geocode user input address
var infowindow;			//center infowindow
var searchType			//current search type, either nearbySearch or textSearch
var renderElement;		//current i-th element being rendered to html
var markersArray = [];	//array of map markers
var today = new Date();	//today's date
var advancedSearch = false;
var loadingImg = './img/loading.gif';
	
$(document).ready(function(event) {
	
	//Bind the submit event for the form to perform a text search, default behaviour will be prevented so page will not refresh
	$('#searchForm').on('submit', function(event) {
		event.preventDefault();
		textSearch();
	});
	
	//When the my location button is clicked, insert the string "My Location" into the text input
	$('#myLocationBtn').on('click', function() {
		$('#location').val('My Location');	
	});
	
	//Toggle search options, this sets a variable
	$('#more').on('click', function() {
		if ($(this).html() == 'Less <i class="icon-arrow-up icon-small"></i>') { //If the button says Less
			$(this).html('More <i class="icon-arrow-down icon-small"></i>'); //Make it say More
			advancedSearch = false;
		} else {
			$(this).html('Less <i class="icon-arrow-up icon-small"></i>');
			advancedSearch = true;
		}
		console.log(advancedSearch);
	});
		
	/*
	* Initialize the map and try to center onto current location, if it fails, then default to Sydney
	* Written by: Team
	* Modifications:
	* 06-09-2013	Freddy: Changed default marker to Jack's green arrow
	*/
	function initialize() {
		geocoder = new google.maps.Geocoder();
		var mapOptions = {
			zoom: 15,
			mapTypeId: google.maps.MapTypeId.ROADMAP
		};
		map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
		//Try HTML5 geolocation
		if (navigator.geolocation) {
			navigator.geolocation.getCurrentPosition(function(position) {
				pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
				lat = position.coords.latitude;
				long = position.coords.longitude;
				map.setCenter(pos);
				var image = './img/arrow.png';
				var marker = new google.maps.Marker({
					position: pos,
					map: map,
					title: 'Current Location',
					icon: image
				});
				markersArray.push(marker);
			}, function() {
				handleNoGeolocation(true);
			});
		} else {
			// Browser doesn't support Geolocation, so it will default to Sydney
			handleNoGeolocation(false);
		}
	}
	
	/*
	* Returns the request object according to user input
	* Written by: Jack
	* Modifications:
	* 07-09-2013	Freddy: Request object now dependent on the advancedSearch variable (bool)
	*/
	function getRequest(){
		var keyword = document.getElementById('keyword').value;
		var location = document.getElementById('location').value;
		var cuisine = document.getElementById('cuisine').value;
		var price = document.getElementById('price').value;
		var radius = document.getElementById('radius').value;
		var rating = document.getElementById('rating').value;
		var openToday = document.getElementById('openToday').checked;
		var matchAny = document.getElementById('matchAny').checked;
		var matchAll = document.getElementById('matchAll').checked;
		
		
		
		
		
		var radius = '500';
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
		var types = 'food';
	
		var opennow = document.getElementById('opennow').checked;
	
		var request = {
			location: myPos,
			radius: radius,
			query: query,
			types: [types],
			openNow: opennow,
			minprice: minprice
		};
	
		return request; 
	}
	
	
	/*
	* Perform Nearby Search
	* Written by: Freddy
	* Modifications:
	* 06-09-2013	Freddy: I think Jack needs to use this differently, possibly using his request object
	*/
	function nearbySearch() {
		searchType = 'nearby';
		clearOverlays();
		var keyword = document.getElementById('keyword').value;
		if (keyword == '') {
			keyword = 'food';	
		}
		var request = {
			location: pos,
			keyword: keyword,			
			radius: '1000',
			types: ['food']
		};		
		infowindow = new google.maps.InfoWindow();
		service = new google.maps.places.PlacesService(map);
		service.nearbySearch(request, callback);
	}
	
	/*
	* Perform Text Search
	* Written by: Freddy
	* Modifications:
	* 06-09-2013	Freddy: I think Jack needs to use this differently, possibly using his request object
	*/
	function textSearch() {
		searchType = 'text';
		clearOverlays();
		var query = document.getElementById('keyword').value;
		if (query == '') {
			query = 'food';	
		}
		var request = {
			location: pos,
			query: query,
			radius: '1000',
			types: ['food']
		};
		infowindow = new google.maps.InfoWindow();
		service = new google.maps.places.PlacesService(map);
		service.textSearch(request, callback);
	}
	
	/*
	* Draw markers on the map
	* Written by: Daisy
	* Modifications:
	* 06-09-2013	Freddy: Single for-loop, I think this function is entirely different from Daisy's original
	*/
	function callback(results, status) {
		if (status == google.maps.places.PlacesServiceStatus.OK) {
			for (var i = 0; i < results.length; i++) {				
				createMarker(results[i]);
				//var ref = { reference:results[i].reference };
				//getDetailsAndRender(ref, i);				
			}
			showResults(results);
		}		
	}
	
	$(".scrollDown").click(function(event){
		event.preventDefault();
		//calculate destination place
		var dest=0;
		if ($(this.hash).offset().top > $(document).height()-$(window).height()){
			dest=$(document).height()-$(window).height();
		} else {
			dest=$(this.hash).offset().top;
		}
		//go to destination
		$('html,body').animate({scrollTop:dest}, 500,'swing');
	});
	
	/*
	* Create an individual marker on the map, then 
	* store the marker in an array for referencing purpose
	* Written by: Daisy
	* Modifications:
	* 07-09-2013	Freddy: Changed styling
	*/
	function createMarker(place) {
		var placeLoc = place.geometry.location;
		var marker = new google.maps.Marker({
			map: map,
			position: place.geometry.location,
			animation: google.maps.Animation.DROP
		});
		markersArray.push(marker);
		//Adding click event to the marker
		google.maps.event.addListener(marker, 'click', function() {
			var string = '';
			
			if (place.name) {
				string += '<strong>' + place.name + '</strong>';
			}			
			if (place.icon) {
				string += '<img src="' + place.icon + '" style="float:right;vertical-align:top">';
			}
			if (place.rating) {
				string += '<br>Rating: ' + place.rating;
			}			
			if (searchType == 'nearby') {
				string += '<br>' + place.vicinity;
			} else {
				string += '<br>' + place.formatted_address;
			}
			if (place.formatted_phone_number) {
				string += '<br>Phone: ' + place.formatted_phone_number;
			}
			string += '<br>';
			infowindow.setContent(string);
			infowindow.open(map, this);
			map.setCenter(this.getPosition());	//Re-centralize the map
		});		
	}
	
	/*
	* Error handler for browser/service error.
	* As error occurs, error message will be generated accordingly, and then
	* re-center the map to Sydney
	* Written by: Freddy
	* Modifications:
	* (none)
	*/
	function handleNoGeolocation(errorFlag) {
		if (errorFlag) {
			var content = 'Error: The Geolocation service failed.';
		} else {
			var content = 'Error: Your browser doesn\'t support geolocation.';
		}	
		var options = {
			map: map,
			position: new google.maps.LatLng(-33.867487, 151.20699),
			content: content
		};	
		infowindow = new google.maps.InfoWindow(options);
		map.setCenter(options.position);
	}
	
	function clearOverlays() {
		for (var i = 1; i < markersArray.length; i++ ) {
			markersArray[i].setMap(null);
		}
		markersArray = [];
		$("#results").html("");
	}
	
	google.maps.event.addDomListener(window, 'load', initialize);
});