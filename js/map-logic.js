// 1. 지도 초기 설정 및 커스텀 저작권 추가
const map = L.map('map', {
    crs: L.CRS.Simple,
    zoomSnap: 0,
    maxZoom: 3,
    attributionControl: false // 기본 로고 끄기
    zoomControl: false
});

L.control.zoom({
    position: 'topleft' // 원래 위치 그대로지만
}).addTo(map);

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



const imageBounds = [[0, 0], [webImgSize, webImgSize]];

L.imageOverlay('images/map.jpg', imageBounds).addTo(map);



function fitMapToScreen() {

    map.setMinZoom(-10);

    map.fitBounds(imageBounds);

    map.setMinZoom(map.getZoom());

}

fitMapToScreen();

map.setMaxBounds(imageBounds);

window.addEventListener('resize', () => fitMapToScreen());





// --- [좌표 동기화 (영점 조절) 로직] ---



// X축(동서) 배율, Z축(남북) 배율

const scaleX = 0.445733; 

const scaleZ = 0.445873; 



// 정밀 영점(Offset)

const offsetX = 3652.23;

const offsetZ = 3708.21;



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

