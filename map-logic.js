// 1. Leaflet 지도 설정 
const map = L.map('map', {
    crs: L.CRS.Simple,
    zoomSnap: 0,   // [핵심] 정수 단위가 아닌 미세한 줌 조절을 허용하여 잘림 없이 화면에 딱 맞춥니다.
    maxZoom: 3     // 확대 한도
});

// 2. 픽셀크기
const imgWidth = 4560;  // 가로
const imgHeight = 4560; // 세로

// 3. 지도의 경계 설정
const imageBounds = [[0, 0], [imgHeight, imgWidth]];

// 4. 지도 이미지 띄우기
L.imageOverlay('hanwol-map.jpg', imageBounds).addTo(map);

// 5. 화면 크기에 맞춰 맵 전체가 보이도록 자동 조절하는 함수
function fitMapToScreen() {
    // 줌 계산을 위해 일시적으로 최소 줌 제한 해제
    map.setMinZoom(-10);
    
    // 맵 전체가 화면에 완벽히 들어오도록 맞춤 (zoomSnap: 0 덕분에 여백이 생겨도 전체가 다 보임)
    map.fitBounds(imageBounds);
    
    // 딱 맞춰진 줌 레벨을 최소 줌으로 고정 (더 축소되지 않도록)
    map.setMinZoom(map.getZoom());
}

// 6. 처음 로드될 때 실행
fitMapToScreen();

// 7. 지도를 드래그할 때 이미지가 화면 밖으로 나가지 않게 영역 제한
map.setMaxBounds(imageBounds);

// 8. 사용자가 브라우저 창 크기를 조절할 때마다 다시 화면에 딱 맞게 재계산
window.addEventListener('resize', () => {
    fitMapToScreen();
});
