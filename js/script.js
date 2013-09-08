$(document).ready(function(e) {
	
	//Bind the submit event for the form to perform a text search, default behaviour will be prevented so page will not refresh
	$('#searchForm').on('submit', function(event) {
		event.preventDefault();
		clearOverlays();
		textSearch();
	});
	
	var key = 'AIzaSyCJUA2Dz22E-FkVnjZQXo46pm2DywlU9NM'; //API key
	google.maps.visualRefresh = true;	//new map visual style
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
	
	/*
	* Initialize the map and try to center onto current location, if it fails, then default to Sydney
	* written by: Team
	* modified:
	* 06-09-2013	Freddy: Changed default marker to Jack's green arrow
	*/
	function initialize() {
		geocoder = new google.maps.Geocoder();
		var mapOptions = {
			zoom: 12,
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
	* Perform Nearby Search
	* written by: Freddy
	* modified:
	* 06-09-2013	Freddy: I think Jack needs to use this differently, possibly using his request object
	*/
	function nearbySearch() {
		searchType = 'nearby';
		clearOverlays();
		var keyword = document.getElementById('keyword').value;
		var request = {
			location: pos,
			keyword: keyword,			
			radius: '500',
			types: ['food']
		};		
		infowindow = new google.maps.InfoWindow();
		service = new google.maps.places.PlacesService(map);
		service.nearbySearch(request, callback);
	}
	
	/*
	* Perform Text Search
	* written by: Freddy
	* modified:
	* 06-09-2013	Freddy: I think Jack needs to use this differently, possibly using his request object
	*/
	function textSearch() {
		searchType = 'text';
		clearOverlays();
		var query = document.getElementById('keyword').value;
		var request = {
			location: pos,
			query: query,
			radius: '500',
			types: ['food']
		};
		infowindow = new google.maps.InfoWindow();
		service = new google.maps.places.PlacesService(map);
		service.textSearch(request, callback);
	}
	
	/*
	* Draw markers on the map
	* written by: Daisy
	* modified:
	* 06-09-2013	Freddy: Single for-loop, I think this function is entirely different from Daisy's original
	*/
	function callback(results, status) {
		if (status == google.maps.places.PlacesServiceStatus.OK) {
			clearResults();
			renderElement = 0;			
			for (var i = 0; i < results.length; i++) {				
				createMarker(results[i]);
				var ref = { reference:results[i].reference };
				getDetailsAndRender(ref, i);		
			}
		}
	}
	
	/*
	* Get the details for each place, then build the HTML to insert onto results DIV 
	* This function is called by the callback for every place it finds (above)
	* written by: Karine - originally called renderPage()
	* modified:
	* 06-09-2013	Freddy: Original function called "renderPage" copied from Karine
	* 07-09-2013	Freddy: Created new function to receive the index (element number) from the callback to build links
	*/
	function getDetailsAndRender(reference, index) {
		service.getDetails(reference, function (place, status) {		
			$('#results').append('<div class="accordion" id="resultsList"></div>');
			var html = '';
			html += '<div class="accordion-group">';
			html += '<div class="accordion-heading">';
			html += '<a class="accordion-toggle" data-toggle="collapse" data-parent="#resultsList" href="#collapse-'+index+'">';
			html += index+1 + '. ' + place.name;
			html += '</a>';
			html += '</div>';
			html += '<div id="collapse-'+index+'" class="accordion-body collapse">';
			html += '<div class="accordion-inner">';
			
			
			html += '<a href="#" id="result-link-'+index+'">';
			html += '<img class="placeIcon" src="'+place.icon+'" style="float:right;vertical-align: top">';
			html += '<h4>' + place.name + '</h4>';
			html += '</a>';
			
			if (searchType == 'nearby') {
				html += '<p>' + place.vicinity + "<br>";
			} else {
				html += '<p>' + place.formatted_address + "<br>";
			}
			html += '<strong>Phone: </strong>' + place.formatted_phone_number + '<br>'; 
			switch (place.price_level) {
				case 0:
					html += "<strong>Price:</strong> FREE<br>";
					break;
				case 1:
					html += "<strong>Price:</strong> $<br>";
					break;
				case 2:
					html += "<strong>Price:</strong> $$<br>";
					break;
				case 3:
					html += "<strong>Price:</strong> $$$<br>";
					break;
				case 4:
					html += "<strong>Price:</strong> $$$$<br>";
					break;
				default:
					html += "<strong>Price:</strong> No Data<br>";
					break;
			}
			if (place.rating != null) {
				html += "<strong>Rating:</strong> " + place.rating + '<br>';
			}    
			if (place.opening_hours != null) {   
				var i=0;
				while (place.opening_hours.periods[i]!=null) {
					if (place.opening_hours.periods[i]["open"]["day"] == today.getDay()) {
						html += "<strong>Opening Hours:</strong> ";
						html += place.opening_hours.periods[i]["open"]["time"] + "-" + place.opening_hours.periods[i]["close"]["time"]+'<br>';
					}
					i++;
				}
			}
		
			if (place.reviews != null && place.reviews.text != null) {   
				html += "<strong>Reviews:</strong>"+place.reviews.text+'<br>';
			}
			
			html += '</p>';
			html += '</div>';
			html += '</div>';
			html += '</div>';
			
			$('#resultsList').append(html);
			// add it to the DOM tree
			var results = document.getElementById('results');
			//results.innerHTML += html;
			
			google.maps.event.addDomListener(document.getElementById('result-link-'+index), 'click', function() {
				map.setCenter(markersArray[index].getPosition());				
				google.maps.event.trigger(markersArray[index], 'click');
			});
		});	
	}
	
	/*
	* Create an individual marker on the map, then 
	* store the marker in an array for referencing purpose
	* written by: Daisy
	* modified:
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
			var string = place.name;
			if (place.icon) {
				string = '<img src="' + place.icon + '" style="float:left;vertical-align:top">' + string;
			}
			if (place.rating) {
				string += '<br>Rating: ' + place.rating;
			}			
			if (searchType == 'nearby') {
				string += '<br>' + place.vicinity;
			} else {
				string += '<br>' + place.formatted_address;
			}
			if (place.international_phone_number) {
				string += '<br>Phone: ' + place.formatted_phone_number;
			}
			infowindow.setContent(string);
			infowindow.open(map, this);
			map.setCenter(this.getPosition());	//Re-centralize the map
		});		
	}
	
	/*
	* Error handler for browser/service error.
	* As error occurs, error message will be generated accordingly, and then
	* re-center the map to Sydney
	* written by: Freddy
	* modified:
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
	}
	
	
	
	//==================End Freddy==================
	
	//==================Karine==================
	function clearResults() {
		$("#results").html("");
	}
	
	
	//==================End Karine==================



	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	google.maps.event.addDomListener(window, 'load', initialize);
	
	
	
});