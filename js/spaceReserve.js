var bookStatus = {
  //테이블 전체에서 사용될 변수들을 관리하는 공간
  data: {
    spaceList: [],
    bookList: [],
    search: {
      //YYYYMMDD format
      date: moment().format("YYYYMMDD"),
      center: "",
    },
    today: moment().format("YYYY-MM-DD"),
    selected: {
      start: "",
      end: "",
      goodsUid: "",
    },
  },
  // bookStatus Init!!!
  load: function ({
    options,
    data: { bookData, spaceData, search },
    style,
    scrollPosition,
    selected,
  }) {
    var _this = this;
    if (typeof options !== "object") {
      console.error("bookStatus error : options type must be object type.");
      return false;
    }
    if (typeof bookData !== "object" || typeof spaceData !== "object") {
      console.error(
        "bookStatus error : data type must be object type. but type is " +
          typeof spaceData
      );
      return false;
    }
    if (
      typeof search !== "object" ||
      !search.date ||
      !moment.isMoment(moment(search.date, "YYYYMMDD"))
    ) {
      console.error(
        "bookStatus error : option 'search' is required and must contains key 'date'. 'date' must be Moment.js Object"
      );
      return false;
    }
    if (
      moment(search.date, "YYYYMMDDHHmmss").hours() != 0 ||
      moment(search.date, "YYYYMMDDHHmmss").minutes() != 0 ||
      moment(search.date, "YYYYMMDDHHmmss").seconds() != 0
    ) {
      console.error(
        "bookStatus error : key date's value format is 'YYYYMMDD000000'"
      );
    }
    this.setData(bookData, spaceData, search, selected);
    _this.table.draw();

    _this.table.dataRenderer();
    var s = moment().seconds();
    _this.table.curTimeRender();
    setTimeout(this.table.curTimeUpdate.bind(null, true), (60 - s) * 1000);

    //options 로 넘어오는 배열안에 evnets 옵션이 있는 경우 테이블 이벤트 기능 로드
    options.some(function (option) {
      if (option === "events") {
        _this.events.load();
      }
    });
    if (style) {
      _this.style(style);
    }
    if (scrollPosition) {
      _this.moveScroll(scrollPosition);
    }
    if (selected && selected.start && selected.end && selected.goodsUid) {
      if (!moment.isMoment(selected.start) || !moment.isMoment(selected.end)) {
        console.error(
          "bookStatus error: bookStatus load failed. start or end must be moment.js object"
        );
        return false;
      }
      if (!selected.start.isValid() || !selected.end.isValid()) {
        console.error(
          "bookStatus error : bookStatus load failed. selected option's start and end value must be valid moment date'"
        );
        return false;
      }
      _this.events.renderSelected(
        selected.start,
        selected.end,
        selected.goodsUid
      );
    }
  },
  //load에서 호출하는 함수. 공간 데이터와 공간 이용데이터를 bookStatus 지역변수에 set.
  setData: function (bookData, spaceData, search, selected) {
    this.data.bookList = bookData.filter(function (item) {
      var todayFilter =
        moment(item.startDt, "YYYYMMDDHHmmss").format("YYYYMMDD") ==
        moment(search.date, "YYYYMMDD").format("YYYYMMDD");
      var yesterdayFilter =
        moment(item.endDt, "YYYYMMDDHHmmss").format("YYYYMMDD") ==
        moment(search.date, "YYYYMMDD").format("YYYYMMDD");

      // 예약의 시작시간이 설정한 날짜와 같거나 예약의 끝시간이 설정한 날짜와 같은 경우만 반환
      return todayFilter || yesterdayFilter;
    });

    if (spaceData) {
      this.data.spaceList = spaceData.sort(function (a, b) {
        if (a.sortNum > b.sortNum) {
          return 1;
        }
        if (a.sortNum < b.sortNum) {
          return -1;
        } else return 0;
      });
    }
    this.data.search = search;
    if (selected) {
      this.data.selected = selected;
    }
  },
  // 검색 조건만 변경하여, 테이블을 전체 re-render 하지 않고 데이터만 re-render
  setSearch: function (data) {
    var _this = this;
    var date = data.date;
    var centerUid = data.centerUid;
    if (!date || !centerUid) {
      console.error("param must contains key 'date' and key 'centerUid'.");
      return false;
    }
    _this.data.search = {
      date: moment(date).format("YYYYMMDDHHmmss"),
      center: centerUid,
    };
    _this.fetchData(null, true);

    _this.events.renderSelected(
      _this.data.selected.start,
      _this.data.selected.end,
      _this.data.selected.goodsUid
    );
  },
  setSpace: function (data) {
    var _this = this;
    _this.data.bookList = data.filter(function (item) {
      return (
        moment(item.startDt, "YYYYMMDDHHmmss").format("YYYYMMDD") ==
        _this.data.search.date
      );
    });
  },
  //update data. And Re-render data.
  fetchData: function (callBackFunction, forceRenderBool) {
    var _this = this;
    var isChanged = false;
    document.getElementById("process-box").classList.add("show-loader");

    var newUseData = {
      list: [],
    };
    var newGoodsData = {
      list: [],
    };

    var bookInfos = newUseData.list;
    var spaceInfos = newGoodsData.list;

    //새로 요청한 데이터가 기존데이터에서 변화가 생겼는지 체크
    isChanged = !_.isEqual(bookStatus.data.bookList, bookInfos);
    if (isChanged) {
      _this.setData(bookInfos, spaceInfos, {
        date: bookStatus.data.search.date,
        center: bookStatus.data.search.center,
      });
      _this.table.dataRenderer();
    } else if (forceRenderBool === true) {
      _this.setData(bookInfos, spaceInfos, {
        date: bookStatus.data.search.date,
        center: bookStatus.data.search.center,
      });
      _this.table.dataRenderer();
      _this.table.curTimeUpdate(false);
    }
    document.getElementById("process-box").classList.remove("show-loader");

    // 데이터를 업데이트하고 비교한 후 영역설정이나 플래그변경등의 이후 작업 처리.
    if (callBackFunction) {
      callBackFunction();
    }

    return isChanged;
  },
  //테이블 크기 조절. 반응형 크기는 css max-size로 조절.
  style: function ({ height, width }) {
    var resourceTable = document.getElementById("schedule_body");

    if (height) {
      resourceTable.style.height = height;
    }
    if (width) {
      resourceTable.style.width = width;
    }
  },
  //테이블을 그리거나 테이블안에 데이터가 렌더링되는 부분을 관리
  table: {
    //테이블 그리기
    draw: function () {
      var initTime = moment().startOf("day");
      var rowLength = 144;

      var tr = "";
      tr += "<tr>";
      tr += "<td class='td-head'>시간</td>";
      bookStatus.data.spaceList.forEach(function (space, idx, arr) {
        tr +=
          "<td class ='td-head' data-id='" +
          space.goodsUid +
          "'>" +
          space.goodsName +
          "</td>";
      });
      tr += "</tr>";

      var tbody = "<tbody>";
      tbody += tr;
      for (var i = 0; i < rowLength; i++) {
        var rowTime = i == 0 ? initTime : initTime.add(10, "m");
        tbody += "<tr>";
        tbody +=
          "<td class='td-timeline'><div class='line-through'>" +
          rowTime.format("HH:mm") +
          "</div></td>";
        bookStatus.data.spaceList.forEach(function (space, idx, arr) {
          var nonClickableArea = "";
          tbody += "<td class='" + nonClickableArea + "'></td>";
        });
        tbody += "</tr>";
      }
      tbody += "</tbody>";

      var html = "";

      html +=
        '<table class="mb-0 table table-bordered scrollable" id="status_table">';
      html += "<thead></thaed>";
      html += tbody;
      html += "</table>";

      var scheduleBody = document.getElementById("schedule_body");
      scheduleBody.innerHTML = html;

      var isMobile = bookStatus.detectMobileDevice(window.navigator.userAgent);

      var vh = window.innerHeight * 0.01;
      var rem =
        12.75 * parseFloat(getComputedStyle(document.documentElement).fontSize);
      var tableBody = document.getElementById("schedule_body");

      if (isMobile) {
        tableBody.style.height = window.innerHeight - rem - 240 + "px";
        document.documentElement.style.setProperty("--vh", `${vh}px`);
        document.body.classList.add("mobile-view");
      } else {
        tableBody.style.height = window.innerHeight - rem - 180 + "px";
      }
    },
    // 최초 테이블 로드시 타임라인 렌더러
    curTimeRender: function () {
      if (
        moment(bookStatus.data.today, "YYYYMMDD").isSame(
          moment(bookStatus.data.search.date, "YYYYMMDD"),
          "day"
        ) === false
      ) {
        return false;
      }

      var curTime = moment();
      var cellHeight = document
        .querySelector("#status_table td")
        .getBoundingClientRect().height;
      var minUnit = cellHeight / 10;
      var table = document.getElementById("status_table");
      var arrow = document.createElement("div");
      var horizonLine = document.createElement("div");
      var insertRow = bookStatus.table.getCellRowIndex(curTime);
      var arrowTop =
        cellHeight * (insertRow + 1) + (moment().minutes() % 10) * minUnit - 7;

      arrow.id = "arrow-right";
      arrow.className = "arrow-right";
      horizonLine.className = "time-line";
      arrow.appendChild(horizonLine);

      arrow.style.top = arrowTop + "px";

      table.insertBefore(arrow, table.firstChild);
    },
    // 타임라인 위치 업데이트
    curTimeUpdate: function (isRepeat) {
      var arrow = document.getElementById("arrow-right");
      if (
        arrow &&
        moment().isSame(
          moment(bookStatus.data.search.date, "YYYYMMDD"),
          "day"
        ) === false
      ) {
        arrow.style.display = "none";
        return false;
      } else if (arrow) {
        arrow.style.display = "block";
        var top = bookStatus.table.getTimeLinePosition();
        arrow.style.top = top + "px";

        if (isRepeat) {
          setTimeout(bookStatus.table.curTimeUpdate.bind(null, true), 60000);
        }
        //bookStatus.fetchData(false,false);
      }
    },
    // 타임라인이 그려져야할 위치 찾기
    getTimeLinePosition: function () {
      var cells = document.querySelector("#status_table td");
      if (!cells) return false;

      var curTime = moment();
      var cellHeight = cells.getBoundingClientRect().height;
      // 현재 10분단위로 row를 구분하고 있고, 1분단위로 높이를 계산하므로 타임라인이 매분마다 움직여야할 최소단위는 cellHeight / 10 이 되어야함
      var minUnit = cellHeight / 10;
      var insertRow = bookStatus.table.getCellRowIndex(curTime);
      // 마지막에 -7px 해주는 이유는 화살표 높이가 14px이고, 화살표의 오른쪽 중간 꼭지점이 타임라인을 가리켜야 하므로 높이의 절반만큼 빼줘야하기 때문
      var arrowTop =
        cellHeight * (insertRow + 1) + (moment().minutes() % 10) * minUnit - 7;

      return arrowTop;
    },
    // api로부터 받은 응답 데이터를 기반으로 렌더링될 셀정보 취득 및 데이터 변환
    dataCellsInfo: function () {
      var renderCells = [];
      var cellRowIndexer = this.getCellRowIndex;

      bookStatus.data.bookList
        .filter(function (book) {
          return book.spaceUseStatusCd != "05";
        })
        .forEach(function (book, idx, arr) {
          var insertStartColIdx = "";
          var insertStartRowIdx = "";
          var insertEndColIdx = "";

          var bookTime = moment(book.startDt, "YYYYMMDDHHmmss");
          var startTime = bookTime.clone();
          insertStartRowIdx = cellRowIndexer(bookTime);

          var bookEndTime = moment(book.endDt, "YYYYMMDDHHmmss");
          insertEndRowIdx = cellRowIndexer(bookEndTime);

          var endTime = bookEndTime.clone();

          if (
            !bookTime.isSame(
              moment(bookStatus.data.search.date, "YYYYMMDD"),
              "day"
            )
          ) {
            startTime = moment(bookStatus.data.search.date, "YYYYMMDD");
            startTime.startOf("day");
            insertStartRowIdx = cellRowIndexer(startTime);
          }
          // 예약이 끝나는 날이 오늘이 아닐경우, 렌더링을 위해 오늘로 시간을 맞춰주고 오늘의 끝(11:59:59) 까지로 가공
          if (
            !bookEndTime.isSame(
              moment(bookStatus.data.search.date, "YYYYMMDD"),
              "day"
            )
          ) {
            endTime = moment(bookStatus.data.search.date, "YYYYMMDD");
            endTime.endOf("day");
          }

          var renderServiceTime = endTime.diff(startTime, "seconds");
          var realServiceTime = bookEndTime.diff(bookTime, "seconds");

          bookStatus.data.spaceList.forEach(function (el, idx) {
            if (el.goodsUid == book.goodsUid) {
              insertStartColIdx = idx;
              insertEndColIdx = idx;
              return false;
            }
          });

          var dataCell = {
            startTime,
            endTime,
            insertStartRowIdx: insertStartRowIdx,
            insertStartColIdx: insertStartColIdx,
            insertEndRowIdx,
            insertEndColIdx,
            status: book.spaceUseStatusCd,
            statusName: book.spaceUseStatusCdName,
            userid: book.userid,
            uid: book.spaceUseUid,
            renderServiceTime: renderServiceTime,
            realServiceTime: realServiceTime,
          };

          // 렌더링할 col과 row를 찾지 못할경우 renderCells에 포함되지 않음.
          if (
            dataCell.insertStartColIdx !== "" &&
            dataCell.insertStartRowIdx !== ""
          ) {
            renderCells.push(dataCell);
          }
        });
      return renderCells;
    },
    // 테이블에 데이터를 렌더링하는 함수
    dataRenderer: function () {
      var table = document.getElementById("status_table");
      var data = this.dataCellsInfo();
      var colCount = bookStatus.data.spaceList.length + 1;
      var rowCount = 144;
      var initData = function () {
        var old = document.querySelectorAll(".data");
        old.forEach(function (item) {
          item.parentNode.removeChild(item);
        });
      };

      initData();

      //같은 분 안에 존재하는 공간 이용 정보가 있는지 찾음
      var dataSpanInfo = data.reduce(function (acc, outer, idx, arr) {
        var outerCol = outer.insertStartColIdx + 1;
        var outerRow = outer.insertStartRowIdx + 1;
        var item = data.reduce(function (obj, inner, idx2, arr2) {
          // 같은 칸(td)에 존재하는 데이터에 대해서만 적용
          var one =
            outer.insertStartColIdx == inner.insertStartColIdx &&
            outer.insertStartRowIdx == inner.insertStartRowIdx; // 같은 공간이면서 같은 시간대(10분사이)인지
          var two = outer.startTime.minute() == inner.endTime.minute(); // 현재처리하고 있는 요소(el1)가 더 아래라는 뜻 -
          var three = outer.endTime.minute() == inner.startTime.minute(); // 현재처리하고 있는 요소(el1)가 더 위
          var four = outer.uid != inner.uid; // 자기 자신 제외
          var five = outer.startTime.isSame(inner.startTime);

          var innerCol = inner.insertStartColIdx + 1;
          var innerRow = inner.insertStartRowIdx + 1;

          if (!five && one && four && (two || three)) {
            obj.col = innerCol;
            obj.row = innerRow;
            if (!obj.member) {
              obj.member = [];
            }
            obj.member.push(inner);
          }
          return obj;
        }, {});

        // 묶여야할 데이터들이 렌더링되어야할 row와 col값을 기준(key)으로 다시 묶음
        if (!_.isEmpty(item)) {
          if (outerCol === item.col && outerRow === item.row) {
            if (!acc[outerCol + "," + outerRow]) {
              acc[outerCol + "," + outerRow] = { member: [] };
            }
            if (acc[outerCol + "," + outerRow].member.length == 0) {
              item.member.forEach(function (obj) {
                acc[outerCol + "," + outerRow].member.push(obj);
              });
            }

            item.member.forEach(function (obj2) {
              acc[outerCol + "," + outerRow].member.forEach(function (obj1) {
                if (obj2.uid != obj1.uid) {
                  acc[outerCol + "," + outerRow].member.push(obj2);
                }
              });
            });
          }
        }
        return acc;
      }, {});

      //렌더링되어야할 row와 col값으로 묶은 데이터들의 중복을 제거하고 시간순으로 정렬한다음 묶인 데이터의 시작시간과 끝시간 정의
      Object.keys(dataSpanInfo).forEach(function (key) {
        var unique = dataSpanInfo[key].member
          .filter(function (el, idx) {
            return dataSpanInfo[key].member.indexOf(el) === idx;
          })
          .sort(function (a, b) {
            if (a.startTime.isBefore(b.startTime)) return -1;
            else if (a.startTime.isAfter(b.startTime)) return 1;
            else return 0;
          });

        var overall = unique.reduce(function (acc, item, idx) {
          if (idx === 0) {
            acc.start = item;
            acc.end = item;
          }
          if (item.startTime.isBefore(acc.start.startTime)) {
            acc.start = item;
          }
          if (item.endTime.isAfter(acc.end.endTime)) {
            acc.end = item;
          }
          return acc;
        }, {});
        dataSpanInfo[key].member = unique;
        dataSpanInfo[key].start = overall.start;
        dataSpanInfo[key].end = overall.end;
      });

      data.forEach(function (el, idx) {
        // +1을 해주는 이유는 첫행과 첫열이 렌더링될 공간이 아니라 시간값과 공간값을 표현하는 기준 행과열이기때문
        var col = el.insertStartColIdx + 1;
        var row = el.insertStartRowIdx + 1;
        var renderCell = table.rows[row].cells[col]; // 렌더링 되어야할 셀 특정

        var body = el.userid + "(" + parseInt(el.realServiceTime / 60) + "분)";
        var divClass = "";

        //예약의 상태에 따라 배경색을 주는 부분
        switch (el.status) {
          case "01":
            divClass = "data book"; // 사용 전
            break;
          case "04":
            divClass = "data done"; // 사용 후(퇴실)
            break;
          case "02":
            divClass = "data occupied"; // 사용 중
            break;
          case "05":
            divClass = "data cancel"; // 취소
            break;
          case "complex":
            divClass = "data complex-book"; // 2건 이상의 데이터
          default:
            break;
        }

        // 테이블안의 데이터를 다시 렌더링할 때, 이미 렌더링된 데이터가 존재할 경우 새로 만들지 않고 해당 div의 속성을 재정의함
        var div = document.getElementById("data_" + el.uid)
          ? document.getElementById("data_" + el.uid)
          : document.createElement("div");
        var cellHeight = renderCell.getBoundingClientRect().height;

        // 툴팁이 묶이는 데이터가 존재하는 셀이면서 묶이는 데이터인 경우
        var one =
          dataSpanInfo[col + "," + row] &&
          dataSpanInfo[col + "," + row].member
            .map(function (obj) {
              return obj.uid;
            })
            .indexOf(el.uid) != -1;

        if (one) {
          var complexStart = dataSpanInfo[col + "," + row].start.startTime;
          var complexEnd = dataSpanInfo[col + "," + row].end.endTime;
          var complexServiceTime = complexEnd.diff(complexStart, "seconds");
          var complexDataId = dataSpanInfo[col + "," + row].member.reduce(
            function (str, cur, idx) {
              if (idx == 0) {
                str = cur.uid;
              } else str += "," + cur.uid;
              return str;
            },
            ""
          );

          div.id = "mutilple-data";
          div.dataset.id = complexDataId;
          div.className = "data complex-book" + " " + "absolute";
          div.innerHTML = dataSpanInfo[col + "," + row].member.length + " 건";
          div.style.top =
            (complexStart.minute() % 10) * 10 +
            (complexStart.seconds() / 60) * 10 +
            "%"; // 초단위로 데이터 위치 렌더링
          div.style.height =
            cellHeight *
              (parseInt(complexServiceTime / 60) / 10 +
                (complexServiceTime % 60) / 60 / 10) +
            "px"; // 초단위로 데이터 높이 렌더링
        } else {
          div.id = "data_" + el.uid;
          div.dataset.id = el.uid;
          div.className = divClass + " " + "absolute";
          div.innerHTML = body;

          // 초단위로 데이터 위치 렌더링
          div.style.top =
            (el.startTime.minute() % 10) * 10 +
            (el.startTime.seconds() / 60) * 10 +
            "%";
          // 초단위로 데이터 높이 렌더링
          div.style.height =
            cellHeight *
              (parseInt(el.renderServiceTime / 60) / 10 +
                (el.renderServiceTime % 60) / 60 / 10) +
            "px";
        }
        renderCell.appendChild(div);
      });
    },
    // 스크롤이 가능한지 확인하고 가능하다면 스크롤이 가능하다는 div를 표시
    isScrollable: function () {
      var scheduleBody = document.getElementById("schedule_body");
      var scrollableTooltip = document.createElement("div");

      scrollableTooltip.className = "scrollable_tooltip tooltip_invisible";
      scrollableTooltip.innerHTML = "스크롤가능";
      //scrollableTooltip.style.left = (scheduleBody.getBoundingClientRect().width - 45) + "px";
      //scrollableTooltip.style.top = scheduleBody.getBoundingClientRect().y + "px";
      scrollableTooltip.style.right = "40px";
      scheduleBody.insertBefore(scrollableTooltip, scheduleBody.firstChild);

      if (scheduleBody.clientWidth < scheduleBody.scrollWidth) {
        // 스크롤 가능하면 보이고 안보이면 안보이게!
        scrollableTooltip.classList.remove("tooltip_invisible");
      }

      scheduleBody.addEventListener("scroll", function (e) {
        var scrollEndPoint =
          scheduleBody.scrollWidth - scheduleBody.clientWidth;
        if (scheduleBody.scrollLeft == scrollEndPoint) {
          scrollableTooltip.classList.add("tooltip_invisible");
        } else {
          scrollableTooltip.classList.remove("tooltip_invisible");
        }
      });
    },
    // moment 타입의 시간값을 가지고 데이터가 렌더링될 행을 찾는 함수
    getCellRowIndex: function (momentTime) {
      if (moment.isMoment(momentTime) === false) {
        console.error(
          "bookStatus error : getCellRowIndex. parameter 'momentTime' is not moment object."
        );

        return false;
      }
      var convertHour = momentTime.hour();
      var convertMin = momentTime.minutes();
      /*
            테이블은 10분단위로 나눠져 있으므로 1시간은 6개의 행을 의미하고, 분의 경우는 10으로 나눈 정수값의 행을 의미.
            이 함수는 셀이 그려질 row의 인덱스만을 반환.
            */
      var h = convertHour * 6;
      var m = parseInt(convertMin / 10);
      return h + m;
    },
  },
  // 테이블에서 사용자가 선택한 영역을 저장하는 공간
  selectedArea: {
    start: null,
    end: null,
    duration: null,
    spaceId: null,
    goodsName: "",
  },
  // 툴팁,호버,영역설정등 사용자가 현황페이지에서 테이블과 상호작용하는 각종 이벤트들
  events: {
    load: function () {
      this.showTooltip();
      this.hover();
      this.setArea();
    },
    //범위설정 flag
    areaMode: false,
    showTooltip: function () {
      var _this = this;
      var table = document.getElementById("status_table");
      var eventTargets = document.querySelectorAll("#status_table .data");

      var tooltipDiv = document.createElement("div");
      var tooltipHeader = document.createElement("h3");
      var tooltipBody = document.createElement("div");
      var tempDiv = document.createElement("div");
      var arrow = document.createElement("div");

      var close = document.createElement("div");
      var closeBtn = document.createElement("i");

      tooltipDiv.id = "info-tooltip-box";
      tooltipDiv.className =
        "popover fade bs-popover-bottom popover-none popover-position";
      arrow.className = "arrow";
      tooltipBody.id = "info-tooltip-body";
      tooltipBody.className = "popover-body";
      tooltipHeader.className = "popover-header no-border";

      close.className = "popover-close";
      closeBtn.className = "pe-7s-close";
      close.id = "close_tooltip_btn";

      close.appendChild(closeBtn);
      tooltipDiv.appendChild(arrow);
      tooltipDiv.appendChild(tooltipHeader);
      tooltipDiv.appendChild(tooltipBody);

      eventTargets.forEach(function (target) {
        target.addEventListener(
          "click",
          function (e) {
            //이벤트 델리게이션 막기
            e.stopPropagation();
            if (e.target.classList.contains("data") === false) {
              return false;
            }

            tempDiv.innerHTML = "";
            var targetId = e.target.dataset.id;

            //영역선택 도중이었다면 영역설정을 종료시키고 선택영역 초기화
            if (bookStatus.events.areaMode == true) {
              bookStatus.events.areaMode = false;
              _this.initArea();
            }

            if (!targetId) return false;

            var bodyData = [];
            // 여러개로 묶인 데이터가 존재할 경우 uid를 ,로 구분하고 있으므로 분리시킴
            var uidArr = targetId.split(",");

            // 데이터 uid를 가지고 해당데이터 정보를 찾음
            uidArr.forEach(function (uid) {
              var bodyObj = bookStatus.data.bookList.filter(function (book) {
                return book.spaceUseUid == uid;
              })[0];
              bodyData.push(bodyObj);
            });
            //툴팁 안에 들어갈 내용물 생성
            bodyData.forEach(function (obj) {
              var startTime = moment(obj.startDt, "YYYYMMDDHHmmss");
              var endTime = moment(obj.endDt, "YYYYMMDDHHmmss");
              var formattedServiceTime = parseInt(
                endTime.diff(startTime, "seconds") / 60
              );
              var cellCode = "";
              var popoverContentsBox = document.createElement("div");
              var popoverTitle = document.createElement("div");
              var popoverBody = document.createElement("div");
              var btnContainer = document.createElement("div");
              var editBtn = document.createElement("button");
              var removeBtn = document.createElement("button");

              popoverTitle.className = "popover-title";
              popoverContentsBox.className = "popover-contents-box";
              btnContainer.className = "popover-btn-container";
              btnContainer.id = "popover-btn-container";
              editBtn.id = "edit_btn";
              editBtn.className = "mt-2 btn btn-primary";
              editBtn.innerHTML = "변경";
              removeBtn.id = "remove_btn";
              removeBtn.className = "mt-2 btn btn-primary";
              removeBtn.innerHTML = "삭제";

              btnContainer.appendChild(removeBtn);

              //해당 이용정보가 예약인지,사용을끝낸 매출인지 검사하여 삭제이벤트에 전달
              msg =
                moment(obj.startDt, "YYYYMMDDHHmmss").isAfter(moment()) === true
                  ? "future"
                  : "past";

              // 예약이 가능한 공간인지(게러지인지), 불가능한 공간인지 spaceCode로 구분하여 클릭이벤트 비활성화하기 위한 플래그 set
              bookStatus.data.spaceList.forEach(function (space) {
                if (space.goodsUid == obj.goodsUid) {
                  //api 완성이후 베이와 게러지를 구분할 수 있으면 수정.
                  cellCode = space.spaceCode;
                }
              });

              popoverContentsBox.dataset.id = obj.spaceUseUid;
              popoverTitle.innerHTML =
                /* obj.spaceUseUid.substr(obj.spaceUseUid.length-4,4) +*/ "(" +
                formattedServiceTime +
                "분)" +
                " " +
                startTime.format("HH:mm:ss") +
                "~" +
                endTime.format("HH:mm:ss");
              popoverBody.innerHTML = obj.userid;
              popoverContentsBox.appendChild(popoverTitle);
              popoverContentsBox.appendChild(popoverBody);

              //예약시작시간이 현재시간 이후일 경우에만 수정,삭제 가능힌 버튼 삽입.
              if (startTime.isAfter(moment())) {
                btnContainer.insertBefore(editBtn, removeBtn);
              } else if (editBtn.parentElement === btnContainer) {
                btnContainer.removeChild(editBtn);
              }
              popoverContentsBox.appendChild(btnContainer);
              tempDiv.appendChild(popoverContentsBox);

              // 예약 변경,삭제 이벤트 바인딩
              editBtn.addEventListener("click", bookStatus.events.editBook);
              removeBtn.addEventListener("click", bookStatus.events.removeBook);
            });

            tempDiv.className = "popover-container";
            tooltipHeader.appendChild(close);
            tooltipBody.appendChild(tempDiv);

            tooltipDiv.classList.add("show");
            tooltipDiv.classList.remove("popover-none");

            //타겟이 오른쪽 끝쪽의 데이터인 경우 툴팁이 나오는 방향 왼쪽으로
            if (
              target.parentElement.cellIndex >=
              bookStatus.data.spaceList.length - 2
            ) {
              tooltipDiv.style.left = "unset";
              tooltipDiv.style.right = "0";
              arrow.style.right = ".5rem";
            }
            //타겟이 왼쪽 끝쪽의 데이터인 경우 툴팁이 나오는 방향 오른쪽으로
            else {
              tooltipDiv.style.left = "0";
              tooltipDiv.style.right = "unset";
              arrow.style.right = "unset";
            }

            target.parentElement.appendChild(tooltipDiv);
          },
          false
        );
      });

      // 툴팁 바깥영역 클릭
      document.addEventListener("click", function (e) {
        if (!tooltipDiv.contains(e.target)) {
          tooltipBody.innerHTML = "";
          tooltipDiv.classList.remove("show");
          tooltipDiv.classList.add("popover-none");
        }
      });
      // 툴팁 닫기 아이콘(X) 클릭
      close.addEventListener("click", function (target) {
        tooltipBody.innerHTML = "";
        tooltipDiv.classList.remove("show");
        tooltipDiv.classList.add("popover-none");
      });
    },
    // 예약을 하기위해 시간을 설정하는 함수
    setArea: function () {
      var table = document.getElementById("status_table");
      var cells = document.querySelectorAll("#status_table td");

      var tooltipDiv = document.createElement("div");
      var arrow = document.createElement("div");
      var tooltipHeader = document.createElement("h3");
      var tooltipBody = document.createElement("div");
      var tempDiv = document.createElement("div");

      var close = document.createElement("div");
      var closeBtn = document.createElement("i");

      var btnBox = document.createElement("div");
      var bookBtn = document.createElement("button");
      var cancelBtn = document.createElement("button");

      tempDiv.className = "popover-container";
      btnBox.className = "popover-btn-container";
      bookBtn.className = "book_btn mt-2 btn btn-primary";
      bookBtn.innerHTML = "예약";
      cancelBtn.className = "cancel_btn mt-2 btn btn-primary";
      cancelBtn.innerHTML = "취소";

      tooltipDiv.className =
        "popover fade bs-popover-bottom popover-none popover-position";
      arrow.className = "arrow";
      tooltipBody.className = "popover-body";
      tooltipHeader.className = "popover-header no-border";
      close.id = "close_confirm_btn";
      close.className = "popover-close";
      closeBtn.className = "pe-7s-close";
      close.appendChild(closeBtn);
      btnBox.appendChild(bookBtn, cancelBtn);
      tooltipHeader.appendChild(close);
      tooltipDiv.appendChild(arrow);
      tooltipDiv.appendChild(tooltipHeader);
      tooltipDiv.appendChild(tooltipBody);

      var startRowIndex = null;
      var startColIndex = null;

      cells.forEach(function (cell) {
        //범위설정 시작
        cell.addEventListener("click", function (e) {
          var target = e.target;
          target =
            target.matches("td") == false ? e.target.closest("td") : target;

          var isNonClickableCell =
            target.classList.contains("non-clickable-area");
          // 선택한 셀이 선택이 금지된 셀이면 선택 금지.
          if (isNonClickableCell) {
            return false;
          }
          // 예약시간 설정 시 특정한 공간을 선택하고나면, 예약종료시간 또한 같은 공간(열) 안에서 선택하도록 하는 조건
          var condition =
            bookStatus.selectedArea.spaceId !=
            table.rows[0].cells[this.cellIndex].dataset.id;
          // 시작 시간 설정 이후 다른 공간을 클릭하려고 할 때!
          if (
            bookStatus.selectedArea.spaceId &&
            condition &&
            bookStatus.events.areaMode == true
          ) {
            return false;
          }

          var rowIndex = this.parentElement.rowIndex;
          var colIndex = this.cellIndex;
          var clickTimeStart = moment(
            bookStatus.data.search.date +
              " " +
              table.rows[rowIndex].cells[0].innerHTML,
            "YYYYMMDDHHmm HH:mm"
          );
          var clickTimeEnd = moment(
            bookStatus.data.search.date +
              " " +
              table.rows[rowIndex].cells[0].innerHTML,
            "YYYYMMDDHHmm HH:mm"
          ).add(600, "s");
          var isFutureCell = clickTimeEnd.isAfter(moment());
          var isBelowCell = startRowIndex <= rowIndex;

          // 셀을 클릭했을 때 다음 행위를 위해 필요한 정보
          var clickData = {
            target,
            startRowIndex,
          };

          /*
                    아래 4가지 조건을 통해 클릭한 셀이 예약시작시간 설정이 가능한 셀인지 확인
                    console.log("데이터가 있나?", !isDataCell);
                    console.log("이미 선택된 셀이있나?", !status.events.areaMode);  <- 예약시작시간 선택 조건에만 해당
                    console.log("현재시간 보다 이후 시간의 셀인가?",isFutureCell);
                    console.log("처음 클릭한 셀보다 아래의 셀인가?",isBelowCell);   <- 예약종료시간 선택 조건에만 해당
                    */

          var isDataCell = bookStatus.events.isDataCell(clickData);

          //비어 있는 셀 최초 클릭
          if (
            !isDataCell &&
            bookStatus.events.areaMode == false &&
            isFutureCell
          ) {
            //툴팁 끄기
            closeAreaToolTip();
            //  클릭할 때, 변경된 데이터가 있는지 확인하기 위한 ajax fetch 함수,동기적인 처리를 위해 콜백함수로 데이터 비교이후 실행할 함수를 넘김.
            var asyncFunction = function (callbackFunction) {
              bookStatus.fetchData(callbackFunction, false);
            };
            var afterFunction = function () {
              var isData = bookStatus.events.isDataCell({
                target,
                startRowIndex,
              });
              if (isData) {
                return false;
              }
              bookStatus.events.areaMode = true;

              //선택시간 초기화
              bookStatus.events.initArea();

              table.rows[rowIndex].classList.remove("table-hover");

              // 클릭한 셀에 timeline이 걸쳐져 있을 경우, 타임 라인 아래에 해당하는 영역만 색칠(선택).
              var diffMin = moment().diff(clickTimeStart, "minutes");
              var customHeight =
                diffMin < 0 ? "100%" : (10 - diffMin) * 10 + "%";

              var startPercent = customHeight;
              var fillDiv = document.createElement("div");

              fillDiv.className = "fiil-area";
              fillDiv.style.height = startPercent;
              fillDiv.classList.add("table-activate");
              target.appendChild(fillDiv);
              target.style.verticalAlign = "bottom";

              // 예약 시작 시간 인덱스값(행과열) 저장
              startRowIndex = rowIndex;
              startColIndex = colIndex;

              bookStatus.selectedArea.start =
                diffMin < 0 ? clickTimeStart : moment();
              bookStatus.selectedArea.spaceId =
                table.rows[0].cells[colIndex].dataset.id;
              bookStatus.selectedArea.goodsName =
                bookStatus.data.spaceList.filter(function (space) {
                  return space.goodsUid == bookStatus.selectedArea.spaceId;
                })[0].goodsName;

              /*
                fecthData가 실행될 때마다 기존 셀을 삭제 후 재생성하므로, 바인딩 되어있던 이벤트 또한 소멸하기 때문에
                툴팁 이벤트를 다시 바인딩
                */
              bookStatus.events.showTooltip();
            };
            asyncFunction(afterFunction);
          }
          // 이미 클릭된 셀이 있는 상태에서 비어있는 셀클릭(=예약 종료시간 선택)
          else if (
            !isDataCell &&
            bookStatus.events.areaMode == true &&
            isBelowCell
          ) {
            //table.rows[rowIndex].cells[colIndex].classList.add("table-activate");

            bookStatus.selectedArea.end = clickTimeEnd;

            var startAreaTime = bookStatus.selectedArea.start;
            var endAreaTime = bookStatus.selectedArea.end;

            // 종료 시간 선택 시 시작시간부터 종료시간 사이의 셀들 영역설정
            for (
              var i = startRowIndex + 1;
              i < target.parentElement.rowIndex + 1;
              i++
            ) {
              var diffMin = moment().diff(clickTimeStart, "minutes");
              //console.log("diffMin",diffMin);
              var customHeight =
                diffMin < 0 ? "100%" : (10 - diffMin) * 10 + "%";
              var fillDiv = document.createElement("div");

              fillDiv.className = "fiil-area table-activate";
              fillDiv.style.height = customHeight;

              table.rows[i].cells[startColIndex].appendChild(fillDiv);

              //table.rows[i].cells[startColIndex].classList.add("table-activate");
            }

            //영역 선택 완료
            if (
              (bookStatus.selectedArea.start != null) &
              (bookStatus.selectedArea.end != null)
            ) {
              bookStatus.events.areaMode = false;

              // 선택한 두 시간대 사이에 데이터가 존재하는지 확인
              var isDataInDur = bookStatus.data.bookList.some(function (item) {
                var isInStartDt = moment(
                  item.startDt,
                  "YYYYMMDDHHmmss"
                ).isBetween(startAreaTime, endAreaTime);
                var isInEndDt = moment(item.endDt, "YYYYMMDDHHmmss").isBetween(
                  startAreaTime,
                  endAreaTime
                );
                var isSameGoods =
                  item.goodsUid ==
                  table.rows[0].cells[target.cellIndex].dataset.id;
                return isSameGoods && (isInStartDt || isInEndDt);
              });
              if (isDataInDur) {
                bookStatus.events.initArea();
                alert("설정한 두 시간 사이에 다른 예약이 존재합니다.");
                return false;
              }

              tooltipBody.innerHTML = "";
              //var registBtn = document.querySelector('button[name="regist"]');

              //영역 설정 후 생성될 툴팁에 표시될 내용
              var html =
                "<div class='popover-contents-box'><div class='popover-title'>" +
                "공간 : " +
                bookStatus.selectedArea.goodsName +
                "</div>" +
                "<div>" +
                "시간 : " +
                bookStatus.selectedArea.start.format("HH : mm") +
                " ~ " +
                bookStatus.selectedArea.end.format("HH : mm") +
                "</div>" +
                "</div>";

              tempDiv.innerHTML = html;
              tempDiv.appendChild(btnBox);
              tooltipBody.appendChild(tempDiv);

              tooltipDiv.classList.add("show");
              tooltipDiv.classList.remove("popover-none");
              e.target.appendChild(tooltipDiv);
            }
          }
        });
      });

      var closeAreaToolTip = function () {
        tooltipDiv.classList.remove("show");
        tooltipDiv.classList.add("popover-none");
      };

      // 테이블 바깥영역 클릭
      document.addEventListener("click", function (e) {
        if (!table.contains(e.target) && bookStatus.events.areaMode == true) {
          bookStatus.events.areaMode = false;
          cells.forEach(function (cell) {
            cell.classList.remove("table-activate");
          });
        }
      });
      // 이벤트 델리게이션 막음
      tooltipDiv.addEventListener("click", function (e) {
        e.stopPropagation();
      });
      // 예약시간 선택 완료 시 나타나는 툴팁 닫기(설정한 영역 취소)
      close.addEventListener("click", function (e) {
        bookStatus.events.initArea();
        closeAreaToolTip();
      });

      // 예약페이지로 이동
      bookBtn.addEventListener("click", function (e) {
        if (bookStatus.selectedArea.start.isBefore(moment(), "minutes")) {
          alert(
            "예약 시작 시간이 현재 시간 설정과 맞지 않아 시작시간을 자동으로 조정합니다."
          );
          bookStatus.selectedArea.start = moment();
        }

        window.location.href =
          "/admin/usage/book?spaceId=" +
          bookStatus.selectedArea.spaceId +
          "&start=" +
          bookStatus.selectedArea.start.format("YYYYMMDDhhmmA") +
          "&end=" +
          bookStatus.selectedArea.end.format("YYYYMMDDhhmmA") +
          "&centerUid=" +
          bookStatus.data.search.center +
          "&goodsUid=" +
          bookStatus.selectedArea.spaceId;
      });
      // 영역설정 취소
      cancelBtn.addEventListener("click", function (e) {
        bookStatus.events.initArea();

        tooltipDiv.classList.remove("show");
        tooltipDiv.classList.add("popover-none");
      });
    },
    // 공간이용 삭제
    removeBook: function (e) {
      e.stopPropagation();
      var msg;
      var apiUrl = "";

      var removeId = this.closest(".popover-contents-box").dataset.id;
      var removeObj = bookStatus.data.bookList.filter(function (obj) {
        return obj.spaceUseUid === removeId;
      })[0];
      var flag =
        moment(removeObj.startDt, "YYYYMMDDHHmmss").isAfter(moment()) == true
          ? "book"
          : "sale";

      if (flag === "book") {
        msg =
          "정말로 예약을 삭제하시겠습니까? \n 삭제된 내역은 사용로그에서 확인할 수 있습니다.";
        apiUrl = "/admin/usage/book/" + removeObj.spaceUseUid;
      } else {
        msg =
          "정말 공간이용내역을 삭제하시겠습니까? \n 삭제된 내역은 사용로그에서 확인할 수 있습니다.";
        apiUrl = "/admin/usage/book/" + removeObj.spaceUseUid;
      }

      var confirmDelete = confirm(msg);
      if (confirmDelete == false) {
        return false;
      }

      var tooltipBox = document.getElementById("info-tooltip-box");
      var tooltipBody = document.getElementById("info-tooltip-body");

      var xhr = new XMLHttpRequest();
      xhr.open("DELETE", apiUrl);
      xhr.send(null);
      xhr.onreadystatechange = function () {
        if (xhr.readyState === xhr.DONE) {
          if (
            this.responseText.resultYne &&
            this.responseText.resultYne === "Y"
          ) {
            var useType = flag === "book" ? "예약" : "매출";
            alert(useType + "이 취소되었습니다.");
          }

          tooltipBody.innerHTML = "";
          tooltipBox.classList.remove("show");
          tooltipBox.classList.add("popover-none");

          //데이터 reload
          console.log("fetch data!");
          bookStatus.fetchData();
        }
      };
    },
    //공간이용 수정
    editBook: function (e) {
      e.stopPropagation();
      var updateId = this.closest(".popover-contents-box").dataset.id;
      window.location.href = "/admin/usage/book/modify/" + updateId;
    },
    hover: function () {
      var isMobile = bookStatus.detectMobileDevice(window.navigator.userAgent);
      if (isMobile) return false;

      var table = document.getElementById("status_table");
      var cells = document.querySelectorAll("#status_table td");

      cells.forEach(function (cell) {
        cell.addEventListener("mouseover", function (e) {
          var rowIndex = this.parentElement.rowIndex;
          //if(status.events.areaMode != true)
          table.rows[rowIndex].classList.add("table-hover");
        });
        cell.addEventListener("mouseleave", function (e) {
          var rowIndex = this.parentElement.rowIndex;
          //if(status.events.areaMode != true)
          table.rows[rowIndex].classList.remove("table-hover");
        });
      });
    },
    //예약 등록, 수정페이지에서 이미 선택된 예약시간이 있는 경우, 테이블에 선택한 시간 표시.
    renderSelected: function (start, end, goodsUid) {
      var getTimeRow = bookStatus.table.getCellRowIndex;
      var table = document.getElementById("status_table");
      var startRowIndex = getTimeRow(start);
      var endRowIndex = getTimeRow(end);
      var compareCellMin = parseInt(start.minutes() / 10) * 10;
      var comapareTime = start.clone().set("minute", compareCellMin);
      var colIdx = "";

      if (
        !moment(bookStatus.data.search.date, "YYYYMMDD").isSame(start, "day")
      ) {
        bookStatus.events.initArea();
        return false;
      }

      if (!end.isAfter(start)) {
        alert("시작시간은 종료시간 이후일 수 없습니다.");
        return false;
      }

      bookStatus.data.spaceList.forEach(function (el, idx) {
        if (el.goodsUid == goodsUid) {
          colIdx = idx;
        }
      });
      if (colIdx == "" || !colIdx) {
        console.error(
          "bookStatus selected area rendering failed. cannot find rendering column.'"
        );
        return false;
      }

      for (var i = startRowIndex + 1; i <= endRowIndex; i++) {
        var diffMin = start.diff(comapareTime, "minutes");
        var customHeight = diffMin < 0 ? "100%" : (10 - diffMin) * 10 + "%";
        var fillDiv = document.createElement("div");
        fillDiv.className = "fiil-area table-activate";
        fillDiv.style.height = customHeight;
        table.rows[i].cells[colIdx + 1].appendChild(fillDiv);
      }
    },
    // 예약 등록페이지에서 사용자가 예약 시작시간과 종료시간을 변경하면 변경한 시간에 따라 선택한 시간이 10분단위로 테이블 셀에 표시됨.
    changeTime: function (start, end, goodsUid) {
      if (
        !moment(bookStatus.data.search.date, "YYYYMMDD").isSame(start, "day")
      ) {
        bookStatus.events.initArea();
        return false;
      } else {
        bookStatus.events.initArea();
      }

      var getTimeRow = bookStatus.table.getCellRowIndex;
      var table = document.getElementById("status_table");
      var startRowIndex = getTimeRow(start);
      var endRowIndex = getTimeRow(end);
      var compareCellMin = parseInt(start.minutes() / 10) * 10;
      var comapareTime = start.clone().set("minute", compareCellMin);
      var colIdx = "";

      if (!end.isAfter(start)) {
        alert("시작시간은 종료시간 이후일 수 없습니다.");
        return false;
      }

      bookStatus.data.spaceList.forEach(function (el, idx) {
        if (el.goodsUid == goodsUid) {
          colIdx = idx;
        }
      });
      if (colIdx == "" || !colIdx) {
        console.error(
          "bookStatus selected area rendering failed. cannot find rendering column.'"
        );
        return false;
      }

      for (var i = startRowIndex; i <= endRowIndex; i++) {
        var customHeight = "";
        if (i == startRowIndex) {
          var diffMin = start.diff(comapareTime, "minutes");
          customHeight = diffMin < 0 ? "100%" : (10 - diffMin) * 10 + "%";
        } else if (i == endRowIndex) {
          var diffMin = end.diff(comapareTime, "minutes");
          customHeight = diffMin < 0 ? "100%" : (10 - diffMin) * 10 + "%";
        } else customHeight = "100%";

        var fillDiv = document.createElement("div");
        fillDiv.className = "fiil-area table-activate";
        fillDiv.style.height = customHeight;
        table.rows[i + 1].cells[colIdx + 1].appendChild(fillDiv);
        table.rows[i + 1].cells[colIdx + 1].style.verticalAlign = "bottom";
      }
    },
    //해당 셀이 예약가능한 셀인지 검사하는 함수
    isDataCell: function ({ target, startRowIndex }) {
      var table = document.getElementById("status_table");
      var rowIndex = target.parentElement.rowIndex;
      var rowIndex = target.closest("tr").rowIndex;
      var clickTimeStart = moment(
        bookStatus.data.search.date +
          " " +
          table.rows[rowIndex].cells[0].innerHTML,
        "YYYYMMDDHHmm HH:mm"
      );
      var clickTimeEnd = moment(
        bookStatus.data.search.date +
          " " +
          table.rows[rowIndex].cells[0].innerHTML,
        "YYYYMMDDHHmm HH:mm"
      ).add(600, "s");

      // 클릭한 셀에 이미 예약이 있는지 확인
      var checkData =
        bookStatus.data.bookList.filter(function (book, idx) {
          var start = moment(book.startDt, "YYYYMMDDHHmmss");

          var end = moment(book.endDt, "YYYYMMDDHHmm");
          //예약 시작 시간과 종료시간이 둘다 선택 시간 이전인 경우
          var one =
            start.isSameOrBefore(clickTimeStart) &&
            end.isSameOrBefore(clickTimeStart);

          //예약 시작 시간과 종료시간이 둘다 선택 시간 이후인 경우
          var two =
            start.isSameOrAfter(clickTimeEnd) &&
            end.isSameOrAfter(clickTimeEnd);

          // column이 같은지
          var three =
            book.goodsUid == table.rows[0].cells[target.cellIndex].dataset.id;

          var flag = !one && !two && three;
          return flag;
        }).length > 0;

      return checkData;
    },
    // 시간설정하는 도중 모종의 이유로 취소된 경우 설정한 시간값 초기화
    initArea: function () {
      //var registBtn = document.querySelector('button[name="regist"]');
      var filledDivs = document.querySelectorAll(".table-activate");

      filledDivs.forEach(function (filledDiv) {
        filledDiv.parentNode.removeChild(filledDiv);
      });

      bookStatus.selectedArea.start = null;
      bookStatus.selectedArea.end = null;
      bookStatus.selectedArea.duration = null;
      bookStatus.selectedArea.spaceId = null;
      bookStatus.selectedArea.goodsName = null;
      //현재 registBtn 주석처리함. 같은 역할을 하는 버튼이 2개여서 주석처리
      //registBtn.disabled = true;
    },
  },

  //테이블 최초로드시, 스크롤이 위치할 기준과 시간에 따라 스크롤 위치를이동시켜주는 함수
  moveScroll: function ({ standard, time }) {
    var resourceTable = document.getElementById("schedule_body");
    var _this = this;
    var cellHeight = document
      .querySelector("#status_table td")
      .getBoundingClientRect().height;
    var scrollTop = 0;
    var offset = 0;
    if (!standard || !time) {
      console.error(
        "bookStatus error : moveScroll. option 'standard or 'time' is not defined.'"
      );
      return false;
    }

    var row = _this.table.getCellRowIndex(time);
    var isMobile = _this.detectMobileDevice(window.navigator.userAgent);

    if (standard == "book") {
      offset = isMobile ? 2 : 4;
    } else if (standard == "timeline") {
      offset = isMobile ? 3 : 8;
    }
    scrollTop = cellHeight * (row - offset);
    resourceTable.scrollTo({ top: scrollTop });
  },
  //접속한 기기가 모바일 디바이스인지 감지
  detectMobileDevice: function (agent) {
    mobileRegex = [
      /Android/i,
      /iPhone/i,
      /iPad/i,
      /iPod/i,
      /BlackBerry/i,
      /Windows Phone/i,
    ];
    return mobileRegex.some(function (mobile) {
      return agent.match(mobile);
    });
  },
};
