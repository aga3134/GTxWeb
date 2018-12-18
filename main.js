var g_APP = new Vue({
  el: "#app",
  data: {
    activePage: 1,
    openSidePanel: false,
    currentTime: "",
    currentDate: "2017-12-01",
    timebarMin: 1,
    timebarMax: 96,
    timebarValue: 1,
    selectStation: "EPA035",
    selectFactory: "L0200473",
    selectPollution: "pmf",
    selectImage: "image/no-image.png",
    btrajData: [],
    btrajObs: [],
    btrajMaxValue: 0,
    btrajImages: [],
    ftrajImages: [],
    stationArr: [],
    stationHash: {},
    companyArr: [],
    companyHash: {},
    showImageBox: false,
    map: null,
    mapOverlay: "",
    mapOverlayOpacity: 0.5,
    selectOverlay: "A0",
    aiImages: {},
    timeStatus: "stop",
    playTimer: null
  },
  created: function () {
    $.get("/data/station.php",function(result){
      this.stationArr = JSON.parse(result);
      this.stationHash = d3.nest()
          .key(function(d){return d.station_id;})
          .map(this.stationArr);
      //console.log(this.stationHash);
    }.bind(this));
    

    $.get("/data/company.php",function(result){
      this.companyArr = JSON.parse(result);
      //customize data
      for(var i=0;i<this.companyArr.length;i++){
        var d = this.companyArr[i];
        switch(d.company_id){
          case "PMfstr":
            d.company_id = "obs";
            d.serial = "0";
            d.color = "#ff0000";
            d.company_name="觀測值";
            break;
          case "oversea":
            d.serial = "1";
            d.color = "#fdd400";
            break;
          case "PMfstrA":
            d.serial = "2";
            d.color = "#84b761";
            d.company_name="溢散源";
            break;
          case "PMfstrL":
            d.serial = "3";
            d.color = "#cc4748";
            d.company_name="交通源";
            break;
          case "PMfu":
            d.serial = "4";
            d.color = "#cd82ad";
            d.company_name="上風處";
            break;
          case "PMfstrS":
            d.serial = "5";
            d.color = "#2f4074";
            d.company_name="其他工廠源";
            break;
        }
        this.$set(d, "active", true);
      }
      this.companyArr = this.companyArr.filter(function(d){
        return d.color != null;
      })
      this.companyArr.sort(function(a, b) {
        return a.serial - b.serial;
      });
      this.companyHash = d3.nest()
          .key(function(d){return d.company_id;})
          .map(this.companyArr);
      //console.log(this.companyHash);

      google.maps.event.addDomListener(window, 'load', this.InitMap);
      this.currentTime = this.currentDate+" 00:00";
      this.UpdateBtrajGraph();
      this.UpdateBtrajImage();
    }.bind(this));
    
    
  },
  methods: {
    InitMap: function(){
      var loc = {lat: 23.682094, lng: 120.7764642, zoom: 7};
      var taiwan = new google.maps.LatLng(loc.lat,loc.lng);

      this.map = new google.maps.Map(document.getElementById('map'), {
        center: taiwan,
        zoom: loc.zoom,
        scaleControl: true,
        mapTypeControl: false
      });

      google.maps.event.addListener(this.map, 'click', function(event) {

      });

      this.map.addListener('dragend', function() {

      });

      this.map.addListener('zoom_changed', function() {

      });
      this.mapOverlay = new USGSOverlay(this.map);
      
    },
    MapValueToColor: function(v){
      var color = d3.scale.linear().domain([0,0.001,0.01,0.02,0.03,0.04,0.05,0.08,0.1,1000])
            .range(["#FFFFFF","#FFFFFF","#1E3CFF","#00C8C8","#00DC00","#E6DC32","#F08228","#FA3C3C","#A000C8","#A000C8"]);
      if(!v) return "#FFFFFF";
      else return color(parseFloat(v));
    },
    ClearMap: function(){
      for(var station in this.stationHash){
        if(this.stationHash[station][0].marker){
          this.stationHash[station][0].marker.setMap(null);
        }
      }
      for(var company in this.companyHash){
        if(this.companyHash[company][0].marker){
          this.companyHash[company][0].marker.setMap(null);
        }
      }
    },
    UpdateMap: function(){
      this.ClearMap();

      if(this.mapOverlay){
        var selectDate = moment(this.currentDate,"YYYY-MM-DD");
        var curDate = selectDate.format("YYYYMMDD");
        var path = "forWEBsite/bin2txt/btraj/"+curDate+"/";
        var file = path+"b_"+this.selectStation+"_"+curDate+"_PMf_"+this.selectOverlay+".png";

        this.mapOverlay.setImage(file);
        this.mapOverlay.setOpacity(this.mapOverlayOpacity);
        var bounds = new google.maps.LatLngBounds(
          new google.maps.LatLng(21.6987,119.749),
          new google.maps.LatLng(25.3707, 121.9));

        this.mapOverlay.setBound(bounds);
      }
      
      var dateOffset = 0;
      switch(this.selectOverlay){
        case "A0": dateOffset = 0; break;
        case "F1": dateOffset = 1; break;
        case "F2": dateOffset = 2; break;
        case "F3": dateOffset = 3; break;
      }
      var selectDate = moment(this.currentDate,"YYYY-MM-DD").clone().add(dateOffset, 'days').format("YYYY-MM-DD");
      
      function clickFn(d){ 
        return function() {
          var str = "<strong>"+d.name+"</strong><br>";
          str += d.date+"<br>";
          str += "PMf: "+d.value;
          var loc = new google.maps.LatLng(d.lat, d.lng);
          var win = new google.maps.InfoWindow();
          win.setOptions({content: str, position: loc});
          win.open(d.map);
        };
      };

      //add company markers
      if(!(this.currentDate in this.btrajData)) return;
      if(!(selectDate in this.btrajData[this.currentDate])) return;
      var btraj = this.btrajData[this.currentDate][selectDate];
      for(var companyKey in btraj){
        if(!(companyKey in this.companyHash)) continue;
        var company = this.companyHash[companyKey][0];
        var pmf = parseFloat(btraj[companyKey][0].PMf);
        var color = this.MapValueToColor(pmf);

        company.marker = new google.maps.Circle({
          strokeColor: '#FF0000',
          strokeOpacity: 0.8,
          strokeWeight: 1,
          fillColor: color,
          fillOpacity: 0.5,
          map: this.map,
          center: new google.maps.LatLng(company.lat,company.lon),
          radius: 5000
        });
        var d = {map: this.map, value: pmf};
        d.name = company.company_name;
        d.lat = company.lat;
        d.lng = company.lon;
        d.date = selectDate;
        company.marker.addListener('click', clickFn(d));
        
      }
      //add station marker
      var obs = this.btrajObs[selectDate][0].obs;
      var color = this.MapValueToColor(obs);
      if(this.selectStation in this.stationHash){
        var station = this.stationHash[this.selectStation][0];
        station.marker = new google.maps.Marker({
          position: new google.maps.LatLng(station.lat,station.lon),
          map: this.map,
          title: station.station_name+" "+obs
        });
        var d = {map: this.map, value: pmf};
        d.name = station.station_name+" 觀測站";
        d.lat = station.lat;
        d.lng = station.lon;
        d.date = selectDate;
        station.marker.addListener('click', clickFn(d));
      }


    },
    ChangePage: function(i){
      this.activePage = i;
      this.UpdateAll();
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
      this.UpdateBtrajGraph();
      this.UpdateBtrajImage();
      this.UpdateMap();
    },
    ChangeFactory: function(){
      this.UpdateFtrajImage();
    },
    ChangeDate: function(){
      this.UpdateAll();
    },
    ChangeTime: function(){
      var selectDate = moment(this.currentDate,"YYYY-MM-DD");
      var selectTime = selectDate.clone().add(this.timebarValue, 'hours');
      this.currentTime = selectTime.format("YYYY-MM-DD HH:mm");
      this.UpdateAIImage();
    },
    CheckImageExist: function(url){
      var http = new XMLHttpRequest();
      http.open('HEAD', url, false);
      http.send();
      return http.status != 404;
    },
    UpdateAll: function(){
      this.UpdateBtrajGraph();
      this.UpdateBtrajImage();
      this.UpdateFtrajImage();
      this.UpdateAIImage();
      this.UpdateMap();
    },
    UpdateFtrajImage: function(){
      var selectDate = moment(this.currentDate,"YYYY-MM-DD");
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
      this.UpdateAIImage();
    },
    UpdateBtrajImage: function(){
      var selectDate = moment(this.currentDate,"YYYY-MM-DD");
      //btraj
      this.btrajImages = [];
      var path = "forWEBsite/grads/btraj/RSM_PETA/daily/"+selectDate.format("YYYYMMDD")+"/";
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
    },
    UpdateAIImage: function(){
      var selectDate = moment(this.currentDate,"YYYY-MM-DD");
      var selectTime = selectDate.clone().add(this.timebarValue-1, 'hours');
      var curTime = selectTime.format("YYYY-MM-DD_HH");
      //ai
      this.aiImages = {};
      var gtxPath = "forWEBsite/grads/ai/gtx/"+selectDate.format("YYYY-MM-DD")+"/";
      var obsPath = "forWEBsite/grads/ai/obs/"+selectDate.format("YYYY-MM-DD")+"/";
      var aiPath = "forWEBsite/grads/ai/ai/"+selectDate.format("YYYY-MM-DD")+"/";
      this.aiImages["gtx"] = gtxPath+"forecast_F"+this.timebarValue+"_"+curTime+".jpg";
      this.aiImages["obs"] = obsPath+"observe_F"+this.timebarValue+"_"+curTime+".jpg";
      this.aiImages["ai"] = aiPath+"PCAAR_F"+this.timebarValue+"_"+curTime+".jpg";
      for(var key in this.aiImages){
        if(!this.CheckImageExist(this.aiImages[key])){
          this.aiImages[key] = "image/no-image.png";
        }
      }
      //this.$forceUpdate();
    },
    OpenImageBox: function(url){
      this.selectImage = url;
      this.showImageBox = true;
    },
    SwitchCompany: function(i){
      this.companyArr[i].active = !this.companyArr[i].active;
      this.DrawBtrajGraph();
    },
    SwitchCompanyAll: function(){
      for(var i=0;i<this.companyArr.length;i++){
        this.companyArr[i].active = !this.companyArr[i].active;
      }
      this.DrawBtrajGraph();
    },
    UpdateBtrajGraph: function(){
      var selectDate = moment(this.currentDate,"YYYY-MM-DD");
      var minDate = selectDate.clone().add(-6, 'days').format("YYYYMMDD");
      var curDate = selectDate.format("YYYYMMDD");
      var maxDate = selectDate.clone().add(3, 'days').format("YYYYMMDD");
      this.btrajMaxValue = 0;
      

      var url = "/data/btraj.php?expMin="+minDate;
      url += "&expMax="+curDate;
      url += "&station="+this.selectStation;
      $.get(url,function(btrajData){
        this.btrajData = JSON.parse(btrajData);
        this.btrajData = d3.nest()
          .key(function(d){return d.experiment_date;})
          .key(function(d){return d.date;})
          .key(function(d){return d.company_id;})
          .map(this.btrajData);
        //將點源減掉有列出的工廠排放得到其他工廠排放
        for(var expKey in this.btrajData){
          var expDate = this.btrajData[expKey];
          for(var dateKey in expDate){
            var date = expDate[dateKey];
            var pmf = parseFloat(date["PMfstr"][0].PMf);
            if(pmf > this.btrajMaxValue) this.btrajMaxValue = pmf;
            if(!("PMfstrS" in date)) continue;
            for(var companyKey in date){
              if(!(companyKey in this.companyHash)) continue;
              date[companyKey][0].date = dateKey;
              date[companyKey][0].company_name = this.companyHash[companyKey][0].company_name;
              if(this.companyHash[companyKey][0].serial < 6) continue;
              date["PMfstrS"][0].PMf -= date[companyKey][0].PMf;
            }
          }
        }

        url = "/data/obs.php?minDate="+minDate;
        url += "&maxDate="+maxDate;
        url += "&station="+this.selectStation;
        $.get(url,function(obsData){
          this.btrajObs = JSON.parse(obsData);
          this.btrajObs = d3.nest()
            .key(function(d){return d.d;})
            .map(this.btrajObs);

          for(var dateKey in this.btrajObs){
            var pmf = parseFloat(this.btrajObs[dateKey][0].obs);
            if(pmf > this.btrajMaxValue) this.btrajMaxValue = pmf;
          }

          this.DrawBtrajGraph();

          if(this.activePage == 3) this.UpdateMap();

        }.bind(this));
      }.bind(this));
    },
    DrawBtrajGraph: function(){
      var selectDate = moment(this.currentDate,"YYYY-MM-DD");
      var minDate = selectDate.clone().add(-6, 'days').format("YYYYMMDD");
      var curDate = selectDate.format("YYYYMMDD");
      var maxDate = selectDate.clone().add(3, 'days').format("YYYYMMDD");

      var upperBound = parseInt((this.btrajMaxValue+10)*0.1)*10;
      var graph = $("#btrajGraph");
      var w = graph.width(), h = graph.height();
      var svg = d3.select("#btrajGraph");
      svg.selectAll("*").remove();
      var padL = w>500?140:25, padR = 10, padT = 10, padB = 15;
      var scaleH = d3.scale.linear().domain([0,upperBound]).range([h-padT-padB,0]);
      var wStep = (w-padL-padR)*0.1;

      //draw axis
      var yAxis = d3.svg.axis().orient("left").scale(scaleH).ticks(10);

      var yAxisGroup = svg.append("g").call(yAxis)
        .attr({
          "font-size": "12px",
          "transform":"translate("+padL+","+padT+")",
            "fill":"black",
            "stroke":"black",
            "stroke-width": 0.5
          });
      yAxisGroup.select('path')
          .style({ 'stroke': 'black', 'fill': 'none', 'stroke-width': '2px'});

      //draw baseline
      var baselineGroup = svg.append("g");
      var lineArr = [{"name":"日均值標準 35","value":35},
        {"name":"年均值標準 15","value":15},
        {"name":"WHO 年均值標準 10","value":10}];
      for(var i=0;i<lineArr.length;i++){
        var line = lineArr[i];
        var y = scaleH(line.value)+padT;
        baselineGroup.append("line").attr({
          "fill":"none",
          "stroke":"#000000",
          "stroke-dasharray":"5",
          "x1":padL, "y1":y,
          "x2":w, "y2":y
        });

        baselineGroup.append("text").attr({
          "text-anchor":"end",
          "alignment-baseline": "central",
          "x": padL-9, "y": y-1,
        }).style({
          "font-size": "13px"
        }).text(line.name);
      }

      var rectGroup = svg.append("g");

      function DrawHistogram(company, data, offsetX){
        if(!data) return;
        var offsetY = 0;
        for(var j=1;j<company.length;j++){
          var c = company[j].company_id;
          if(! (c in data)) continue;
          if(!company[j].active) continue;
          var dataH = h-padT-padB-scaleH(data[c][0].PMf);
          var x = offsetX*wStep+padL+5;
          var y = h-offsetY-dataH-padB;

          rectGroup.append('rect').attr({
            "width": wStep-5, 
            "height": dataH,
            "x": x, 
            "y": y,
            "data-color": company[j].color,
            "data-pmf": data[c][0].PMf,
            "data-company": company[j].company_name,
            "data-date": data[c][0].date,
          }).style({
            "fill": company[j].color,
            "stroke-width": 0,
            "opacity": 0.8
          }).on("mouseover", function(){
            var color = d3.select(this).attr("data-color");
            var pmf = parseFloat(d3.select(this).attr("data-pmf"));
            var company = d3.select(this).attr("data-company");
            var date = d3.select(this).attr("data-date");
            var x = d3.select(this).attr("x");
            var y = d3.select(this).attr("y");
            $("#hoverDialog").css({
              "border-color":color,
              "opacity": 1
            }).html(company+"<br>"+date+"<br>"+pmf.toFixed(2));
          })
          .on("mouseout", function(){
            $("#hoverDialog").css({
              "opacity": 0
            });
          });
          
          offsetY += dataH;
        }
      }

      //draw 7 day analysis
      for(var i=-6;i<=0;i++){
        var date = selectDate.clone().add(i, 'days').format("YYYY-MM-DD");
        if(!(date in this.btrajData)) continue;
        if(!(date in this.btrajData[date])) continue;
        var data = this.btrajData[date][date];
        DrawHistogram(this.companyArr,data,i+6);
      }
      //draw 3 day forecast
      if(this.currentDate in this.btrajData){
        var expData = this.btrajData[this.currentDate];
        for(var i=1;i<=3;i++){
          var date = selectDate.clone().add(i, 'days').format("YYYY-MM-DD");
          if(!(date in expData)) continue;
          var data = expData[date];
          DrawHistogram(this.companyArr,data,i+6);
        }
      }

      //draw observe value
      var line = d3.svg.line()
        .x(function(d) {return d.x;})
        .y(function(d) {return d.y;});

      var obsGroup = svg.append("g");
      var lineData = [];
      var cutIndex = 0;
      if(w < 400) cutIndex = 8;
      else if(w < 800) cutIndex = 5;
      for(var i=-6;i<=3;i++){
        var date = selectDate.clone().add(i, 'days').format("YYYY-MM-DD");
        var data = this.btrajObs[date];
        lineData.push({
          x:(i+6.5)*wStep+padL,
          y:scaleH(parseFloat(data[0].obs))+padT,
          value: parseInt(data[0].obs),
          date: date.substring(cutIndex)
        });
      }
      if(this.companyArr[0].active){
        obsGroup.append("path")
          .attr("fill", "none")
          .attr("stroke", "#ff0000")
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("stroke-width", 2)
          .attr("d", line(lineData));
      }

      for(var i=0;i<lineData.length;i++){
        if(this.companyArr[0].active){
          obsGroup.append("circle").attr({
            "cx": lineData[i].x,
            "cy": lineData[i].y,
            "r": 5,
            "fill": "#ff0000",
            "stroke": "none"
          });
          obsGroup.append("text").attr({
            "x": parseInt(lineData[i].x),
            "y": parseInt(lineData[i].y-10),
            "text-anchor":"middle",
          }).style({
            "fill": "#ff0000",
            "font-size": " 12px"
          }).text(lineData[i].value);
        }

        obsGroup.append("text").attr({
          "x": parseInt(lineData[i].x),
          "y": h,
          "text-anchor":"middle",
          "alignment-baseline": "baseline"
        }).style({
          "fill": "#000000",
          "font-size": " 12px"
        }).text(lineData[i].date);
      }

    },
    PlayTimebar: function(){
      this.timeStatus = "play";
      this.playTimer = setInterval(function(){
        this.timebarValue++;
        if(this.timebarValue > this.timebarMax){
          this.timebarValue = this.timebarMax;
          clearInterval(this.playTimer);
          this.playTimer = null;
        }
        this.ChangeTime();
      }.bind(this),300);
    },
    StopTimebar: function(){
      this.timeStatus = "stop";
      clearInterval(this.playTimer);
      this.playTimer = null;
    },
    PrevTime: function(){
      this.timebarValue--;
      if(this.timebarValue < this.timebarMin) this.timebarValue = this.timebarMin;
      this.ChangeTime();
    },
    NextTime: function(){
      this.timebarValue++;
      if(this.timebarValue > this.timebarMax) this.timebarValue = this.timebarMax;
      this.ChangeTime();
    }
  }
});

window.addEventListener('load', function() {
  
});

window.addEventListener('resize', function(e) {
  g_APP.openSidePanel = false;
  var mainContent = $(".main-content");
  mainContent.css("width","100%");
  g_APP.DrawBtrajGraph();
});