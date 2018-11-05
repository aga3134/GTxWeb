var g_APP = new Vue({
  el: "#app",
  data: {
    activePage: 0,
    openSidePanel: false
  },
  created: function () {
    google.maps.event.addDomListener(window, 'load', this.InitMap);
  },
  methods: {
    InitMap: function(){
      var loc = {lat: 23.682094, lng: 120.7764642, zoom: 7};
      var taiwan = new google.maps.LatLng(loc.lat,loc.lng);

      map = new google.maps.Map(document.getElementById('map'), {
        center: taiwan,
        zoom: loc.zoom,
        scaleControl: true,
        mapTypeControl: false
      });

      google.maps.event.addListener(map, 'click', function(event) {

      });

      map.addListener('dragend', function() {

      });

      map.addListener('zoom_changed', function() {

      });
      
    }
  }
});

window.addEventListener('load', function() {
  
});

window.addEventListener('resize', function(e) {
  
});