// 1. Leaflet 지도 설정 (평면 좌표계인 CRS.Simple 사용)
const map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -3, // 축소 한도 (필요에 따라 숫자를 조절하세요)
    maxZoom: 2   // 확대 한도
});

// 2. 픽셀크기.
const imgWidth = 4560;  // 가로
const imgHeight = 4560; // 세로

// 3. 지도의 경계(Bounds) 설정: [0, 0]부터 [세로 높이, 가로 너비]까지
const imageBounds = [[0, 0], [imgHeight, imgWidth]];

// 4. hanwol-map.jpg 이미지 띄우기
L.imageOverlay('hanwol-map.jpg', imageBounds).addTo(map);

// 5. 처음 화면을 열었을 때 지도가 화면에 꽉 차게(가운데로) 보이도록 설정
map.fitBounds(imageBounds);
