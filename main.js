var g_APP = new Vue({
  el: "#app",
  data: {
    activePage: 1,
    openSidePanel: false,
    currentTime: "2017-01-07 00:00",
    currentDate: "2017-01-07",
    timebarMin: 0,
    timebarMax: 96,
    timebarValue: 0,
    selectStation: "EPA001",
    selectFactory: "L0200473",
    selectPollution: "pmf",
    selectImage: "image/no-image.png",
    btrajData: [],
    btrajObs: [],
    btrajImages: [],
    ftrajImages: [],
    stationArr: [],
    companyArr: [],
    showImageBox: false
  },
  created: function () {
    $.get("/data/station.php",function(result){
      this.stationArr = JSON.parse(result);
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
      }
      this.companyArr = this.companyArr.filter(function(d){
        return d.color != null;
      })
      this.companyArr.sort(function(a, b) {
        return a.serial - b.serial;
      });
      console.log(this.companyArr);
    }.bind(this));

    google.maps.event.addDomListener(window, 'load', this.InitMap);
    this.UpdateImage();
    this.UpdateBtrajGraph();
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
      this.UpdateBtrajGraph();
    },
    ChangeFactory: function(){
      this.UpdateImage();
    },
    ChangeDate: function(){
      this.UpdateImage();
      this.UpdateBtrajGraph();
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
      var path = "forWEBsite/grads/btraj/RSM_PETA/hourly/"+selectDate.format("YYYYMMDD")+"/";
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
    },
    OpenImageBox: function(url){
      this.selectImage = url;
      this.showImageBox = true;
    },
    UpdateBtrajGraph: function(){
      var selectDate = moment(this.currentDate,"YYYY-MM-DD");
      var minDate = selectDate.clone().add(-6, 'days').format("YYYYMMDD");
      var curDate = selectDate.format("YYYYMMDD");
      var maxDate = selectDate.clone().add(3, 'days').format("YYYYMMDD");

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
            if(!("PMfstrS" in date)) continue;
            for(var companyKey in date){
              if(date[companyKey].serial < 6) continue;
              date["PMfstrS"].PMf -= date[companyKey].PMf;
            }
          }
        }

        console.log(this.btrajData);

        url = "/data/obs.php?minDate="+minDate;
        url += "&maxDate="+maxDate;
        url += "&station="+this.selectStation;
        $.get(url,function(obsData){
          this.btrajObs = JSON.parse(obsData);
          this.btrajObs = d3.nest()
            .key(function(d){return d.d;})
            .map(this.btrajObs);
          console.log(this.btrajObs);

          this.DrawBtrajGraph();
        }.bind(this));
      }.bind(this));
    },
    DrawBtrajGraph: function(){
      var selectDate = moment(this.currentDate,"YYYY-MM-DD");
      var minDate = selectDate.clone().add(-6, 'days').format("YYYYMMDD");
      var curDate = selectDate.format("YYYYMMDD");
      var maxDate = selectDate.clone().add(3, 'days').format("YYYYMMDD");

      var graph = $("#btrajGraph");
      var w = graph.width(), h = graph.height();
      var svg = d3.select("#btrajGraph");
      svg.selectAll("*").remove();
      var padL = 140, padR = 10, padT = 10, padB = 15;
      var scaleH = d3.scale.linear().domain([0,100]).range([h-padT-padB,0]);
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
        var offsetY = 0;
        for(var j=1;j<company.length;j++){
          var c = company[j].company_id;
          if(! (c in data)) continue;
          var dataH = h-padT-padB-scaleH(data[c][0].PMf);
          rectGroup.append('rect').attr({
            "width": wStep-5, 
            "height": dataH,
            "x": offsetX*wStep+padL+5, 
            "y": h-offsetY-dataH-padB
          }).style({
            "fill": company[j].color,
            "stroke-width": 0,
            "opacity": 0.8
          });
          offsetY += dataH;
        }
      }

      //draw 7 day analysis
      for(var i=-6;i<=0;i++){
        var date = selectDate.clone().add(i, 'days').format("YYYY-MM-DD");
        var data = this.btrajData[date][date];
        DrawHistogram(this.companyArr,data,i+6);
      }
      //draw 3 day forecast
      var expData = this.btrajData[this.currentDate];
      for(var i=1;i<=3;i++){
        var date = selectDate.clone().add(i, 'days').format("YYYY-MM-DD");
        var data = expData[date];
        DrawHistogram(this.companyArr,expData[date],i+6);
      }

      //draw observe value
      var line = d3.svg.line()
        .x(function(d) {return d.x;})
        .y(function(d) {return d.y;});

      var obsGroup = svg.append("g");
      var lineData = [];
      for(var i=-6;i<=3;i++){
        var date = selectDate.clone().add(i, 'days').format("YYYY-MM-DD");
        var data = this.btrajObs[date];
        lineData.push({
          x:(i+6.5)*wStep+padL,
          y:scaleH(parseFloat(data[0].obs))+padT,
          value: parseInt(data[0].obs),
          date: date
        });
      }
      obsGroup.append("path")
        .attr("fill", "none")
        .attr("stroke", "#ff0000")
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("stroke-width", 2)
        .attr("d", line(lineData));

      for(var i=0;i<lineData.length;i++){
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