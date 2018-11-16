var g_APP = new Vue({
  el: "#app",
  data: {
    activePage: 1,
    openSidePanel: false,
    currentTime: "2018-01-01 00:00",
    currentDate: "2018-01-01",
    timebarMin: 0,
    timebarMax: 96,
    timebarValue: 0,
    selectStation: "EPA001",
    selectFactory: "L0200473",
    btrajImages: [],
    ftrajImages: []
  },
  created: function () {
    google.maps.event.addDomListener(window, 'load', this.InitMap);
    this.UpdateImage();
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
      
    },
    ToggleSidePanel: function(){
      this.openSidePanel = !this.openSidePanel;
      var mainContent = $(".main-content");
      if(mainContent.width() > 640 && this.openSidePanel){
        mainContent.css("width","calc(100% - 250px)");
      }
      else{
        mainContent.css("width","100%");
      }
    },
    ChangeStation: function(){
      this.UpdateImage();
    },
    ChangeFactory: function(){
      this.UpdateImage();
    },
    ChangeDate: function(){
      this.UpdateImage();
    },
    ChangeTime: function(){
      var selectDate = moment(this.currentDate,"YYYY-MM-DD");
      var selectTime = selectDate.add(this.timebarValue, 'hours');
      this.currentTime = selectTime.format("YYYY-MM-DD HH:mm");
    },
    CheckImageExist: function(url){
      var http = new XMLHttpRequest();
      http.open('HEAD', url, false);
      http.send();
      return http.status != 404;
    },
    UpdateImage: function(){
      var selectDate = moment(this.currentDate,"YYYY-MM-DD");
      //btraj
      this.btrajImages = [];
      var path = "forWEBsite/grads/btraj/old_20180101_20180503/hourly/"+selectDate.format("YYYYMMDD")+"/";
      for(var i=0;i<10;i++){
        var str = "";
        if(i<7){
          var targetDate = selectDate.clone().add(i-6, 'days').format("YYYYMMDD");
          str = path+"b_avg_"+this.selectStation+"_"+targetDate+"_7.png";
        }
        else{
          var targetDate = selectDate.format("YYYYMMDD");
          str = path+"b_avg_"+this.selectStation+"_"+targetDate+"_"+(i+1)+".png";
        }
        if(this.CheckImageExist(str)){
          this.btrajImages.push(str);
        }
        else{
          this.btrajImages.push("image/no-image.png");
        }
      }
      //ftraj
      this.ftrajImages = [];
      var path = "forWEBsite/grads/ftraj/"+selectDate.format("YYYYMMDD")+"/";
      for(var i=0;i<10;i++){
        var str = "";
        if(i<7){
          var targetDate = selectDate.clone().add(i-6, 'days').format("YYYYMMDD");
          str = path+"f_avg_"+this.selectFactory+"_"+targetDate+"_7.png";
        }
        else{
          var targetDate = selectDate.format("YYYYMMDD");
          str = path+"f_avg_"+this.selectFactory+"_"+targetDate+"_"+(i+1)+".png";
        }
        if(this.CheckImageExist(str)){
          this.ftrajImages.push(str);
        }
        else{
          this.ftrajImages.push("image/no-image.png");
        }
      }
    }
  }
});

window.addEventListener('load', function() {
  
});

window.addEventListener('resize', function(e) {
  g_APP.openSidePanel = false;
  var mainContent = $(".main-content");
  mainContent.css("width","100%");
});