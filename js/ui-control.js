// 1. 스폰 아이콘 설정
const spawnIcon = L.icon({
    iconUrl: 'images/compass.png', // images 폴더 안에 있는 나침반 이미지 부르기
    iconSize: [48, 48],     // 아이콘의 크기 (가로 48px, 세로 48px) - 적당히 키웠습니다.
    iconAnchor: [24, 24],   // 아이콘의 중앙(24,24)을 실제 지도 좌표에 맞춥니다.
    popupAnchor: [0, -20]   // 말풍선이 아이콘 바로 위 중앙에 뜨도록 위치 조정
});

// 2. data.js의 스폰 좌표를 화면 픽셀로 변환 (기존 코드와 동일)
const spawnCoords = mcToPx(spawnData.mcX, spawnData.mcZ);

// 3. 지도에 나침반 마커를 올리고 클릭 시 마크 UI 말풍선 띄우기
L.marker(spawnCoords, { icon: spawnIcon })
    .addTo(map)
    // index.html에서 디자인한 스타일대로 텍스트 표시
    .bindPopup(`스폰 지점<br>[ ${spawnData.mcX}, ${spawnData.mcZ} ]`);
