vanila js를 사용해 구현한 공간예약 기능을 가진 어플리케이션입니다.
공간정보와 예약정보를 규칙에 맞춰 전달하면 화면에 데이터를 렌더링하여 사용자에게 보여줄 수 있도록 템플릿 형태로 구현하였습니다.
API 서버에서 데이터를 전달받아 화면에 렌더링한다는 시나리오를 가정한 프로젝트입니다.

### 예제

![example](https://github.com/sungwoon129/space-reserve-service/assets/43958570/86fbaae4-0656-4cca-9135-0753c04590c7)

### 데이터 규칙

#### 공간 데이터

```JSON
[
    {
        spaceUseStatusCd: "01",   // 공간이용 상태(예약,사용중,사용불가등)
        startDt: "202307311310",  // 시작시간
        endDt: "202307311340",    // 종료시간
        goodsUid: "1",            // 공간 id
        spaceUseUid: "1",         // 공간사용 id
        userid: "user A",         // 사용자 id
    }
]
```

#### 예약 데이터

```javascript
[
  {
    goodsUid: "1", // 공간 id
    goodsName: "공간1", // 공간명
    spaceCode: "01", // 공간유형[공간 유형별 처리에 따른 구분값]
  },
];
```
