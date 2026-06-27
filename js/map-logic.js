// 1. 지도 초기 설정 및 커스텀 저작권 추가
const map = L.map('map', {
    preferCanvas: true,        // [최적화 추가] 렌더링 방식을 Canvas로 변경하여 렉 줄임
    crs: L.CRS.Simple,
    zoomSnap: 0,
    maxZoom: 3,
    attributionControl: false, 
    zoomControl: false         // 기본 줌 버튼은 일단 끕니다.
});

// [추가] 줌 버튼을 다시 추가하고 상단 바 아래로 밀어내기
L.control.zoom({
    position: 'topleft'
}).addTo(map);

// CSS로 줌 버튼 박스만 아래로 밀기 (상단 바 60px + 여백)
const zoomBox = document.querySelector('.leaflet-top.leaflet-left');
if (zoomBox) {
    zoomBox.style.marginTop = '75px'; 
}

L.control.attribution({
    prefix: '<img src="images/forky.png" style="width:15px; vertical-align:middle; margin-right:3px;"> FORKY_G'
}).addTo(map);

// 웹에 띄운 이미지의 실제 픽셀 크기
const webImgSize = 7300; 

// 픽셀 좌표를 측정한 원본 이미지의 크기
const originalImgWidth = 7300;  
const originalImgHeight = 7300; 

// [수정] 단순 배열을 Leaflet LatLngBounds 객체로 변환하여 pad() 함수가 작동 가능하도록 수정
const imageBounds = L.latLngBounds([[0, 0], [webImgSize, webImgSize]]);
L.imageOverlay('images/map.jpg', imageBounds).addTo(map);


// --- [좌표 동기화 (영점 조절) 로직 위치 격상] ---
// 순서 오류(Initialization Error)를 막기 위해 함수와 변수 선언을 초기화보다 위로 올렸습니다.

// X축(동서) 배율, Z축(남북) 배율
const scaleX = 0.445733; 
const scaleZ = 0.445873; 

// 정밀 영점(Offset)
const offsetX = 3650.73;
const offsetZ = 3647.71;

// 변환 함수 (모든 마커 생성 시 이 함수를 호출합니다)
function mcToPx(mcX, mcZ) {
    // 원본 픽셀 좌표 계산
    const origPxX = (mcX * scaleX) + offsetX;
    const origPxY = (mcZ * scaleZ) + offsetZ;
    
    // 웹 이미지 크기 비율 적용
    const webPxX = origPxX * (webImgSize / originalImgWidth);
    const webPxY = origPxY * (webImgSize / originalImgHeight);
    
    // Leaflet Simple CRS의 Y축 반전 대응 [Y, X]
    return [(webImgSize - webPxY), webPxX];
}


// --- [지도 화면 맞춤 및 바운드 제한 실행] ---

function fitMapToScreen() {
    map.setMinZoom(-10);
    map.fitBounds(imageBounds);
    map.setMinZoom(map.getZoom());
}

fitMapToScreen();

// [수정] 정상적으로 .pad(0.2)를 적용하여 아래쪽 팝업이 잘리지 않도록 공간 확보
map.setMaxBounds(imageBounds.pad(0.2));

window.addEventListener('resize', () => fitMapToScreen());
