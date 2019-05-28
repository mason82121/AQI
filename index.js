(function(Vue) {
 
  let AqiApi = "https://json2jsonp.com/?url=http://opendata2.epa.gov.tw/AQI.json&callback=cbfunc";

  let aqiRange = {
    Good: 51,
    Moderate: 101,
    UnhealthyForSensitiveGroups: 151,
    Unhealthy: 201,
    VeryUnhealthy: 300,
    Hazardous: 500
  }

  let timer

  const vm = new Vue({
    el: '#AQI',
    data: {
      OpenData: [],
      County: [],
      CountyRadio: [],
      position: [],
      filter: "全臺灣",
      pageMaxData: 6,
      pageNum: 1,
      aqiMax: {
        "PM2.5": 350.4,
        PM10: 504,
        SO2: 804,
        CO: 40.4,
        O3: 504,
        NO2: 1649
      },
      today:'',
      time:''
    },
    computed: {
      FilterData () {
        let filterData
        filterData = this.OpenData
        if (this.filter != '全臺灣') {
          filterData = this.OpenData.filter((obj) => {
            return obj.County == this.filter
          })
        }
        return filterData
      },
      totalPage(){
        return Math.ceil(this.FilterData.length / this.pageMaxData)
      }
    },
    methods: {
      successHandler(res) {
        // 陣列順序調整
        this.OpenData = res
        this.OpenData.map((obj) => {

          let x, y, distance
          x = this.position[0] - obj.Longitude
          y = this.position[1] - obj.Latitude
          distance = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
          obj.nearest = distance

          // AQIBox 上的 Class
          if (obj.AQI < aqiRange.Good) { obj.aqiClass = "Good" }
          else if (obj.AQI < aqiRange.Moderate) { obj.aqiClass = "Moderate" }
          else if (obj.AQI < aqiRange.Unhealthy) { obj.aqiClass = "Unhealthy" }
          else if (obj.AQI < aqiRange.UnhealthyForSensitiveGroups) { obj.aqiClass = "UnhealthyForSensitiveGroups" }
          else if (obj.AQI < aqiRange.VeryUnhealthy) { obj.aqiClass = "VeryUnhealthy" }
          else { obj.aqiClass = "Hazardous" }

        })

        this.OpenData.sort(function (a, b) { return a.nearest - b.nearest; })

        // 抓取所有縣市，存到城市陣列
        this.OpenData.forEach((obj) => {
          if (this.County.indexOf(obj.County) == -1) {
            this.County.push(obj.County)
          }
        })

        // 把資料丟進 vue 裡面
        this.CountyRadio = res;
      },
      ClickCountyRadio(res) {
        this.filter = res
        this.pageNum = 1
        this.goTop()
      },
      pageSelect(res) {
        this.pageNum = res
        this.goTop()
      },
      goTop() {
        // velocity 取代
        $("html,body").animate({
          scrollTop: $(".AQIBox").offset().top - 20
        }, 600);
      },
      getLocation() {
        return new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition((position) => {
            let latitude = position.coords.latitude;
            let longitude = position.coords.longitude;
            resolve([longitude, latitude])
          }, ()=>{
            resolve([0,0])
          });
        })
      },
      getToday(){
        let yer = new Date().getFullYear();
        let mom = new Date().getMonth() + 1; // 0-11
        let date = new Date().getDate();
        let day = new Date().getDay();
        let dayArray = ["日", "一", "二", "三", "四", "五", "六"];
        this.today = "載入時間：" + yer + " 年 " + mom + " 月 " + date + " 日 星期" + dayArray[day]
      },
      updateTime(){
        let hrs = new Date().getHours();
        let min = new Date().getMinutes();
        let sec = new Date().getSeconds();
      
        if (hrs == 0) {hrs += 12;}
        if (hrs < 10) {hrs = "0" + hrs;}
        if (min < 10) {min = "0" + min;}
        if (sec < 10) {sec = "0" + sec;}
        this.time = hrs + ":" + min + ":" + sec
        console.log('!!!!')
      }
    },
    async mounted() {
      timer = setInterval(this.updateTime,1000)
      this.getToday()
      this.position = await this.getLocation()

      // axios 取代
      $.ajax({
        url: AqiApi,
        method: "get",
        dataType: "jsonp",
        success: this.successHandler
      })
    },
    beforeDestory(){
      // 有 this
      clearInterval(timer)
    }

  })
})(Vue);