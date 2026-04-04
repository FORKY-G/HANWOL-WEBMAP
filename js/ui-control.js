// js/ui-control.js

const compassIcon = L.icon({
    iconUrl: 'images/compass.png',
    iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -10]
});

const transparentIcon = L.icon({
    iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==', 
    iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -15]
});

// 1. 십이지신 동선 설정
const animalPathPoints = animals.map(ani => mcToPx(ani.mcX, ani.mcZ));
const polyline = L.polyline(animalPathPoints, {
    color: '#FFD700', weight: 2, opacity: 0, dashArray: '5, 8'
}).addTo(map);

// 2. 광산 전용 동선 설정 (색상별 4개)
const minePolylines = {};
const mineColors = { "녹": "#2ecc71", "청": "#3498db", "황": "#f1c40f", "적": "#e74c3c" };

Object.keys(minePaths).forEach(colorKey => {
    const pathCoords = minePaths[colorKey].map(num => {
        const mine = mines.find(m => m.n === num);
        if (mine) return mcToPx(mine.x, mine.z);
    }).filter(coord => coord !== undefined);

    minePolylines[colorKey] = L.polyline(pathCoords, {
        color: mineColors[colorKey],
        weight: 3,
        opacity: 0,
        dashArray: '7, 10'
    }).addTo(map);
});

// 3. 좌표 복사 함수
window.copyCoords = (x, y, z) => {
    const text = `${x} ${y} ${z}`; 
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById('copy-toast');
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 1500);
    });
};

// 4. 십이지신 마커 생성
animals.forEach((ani) => {
    const pos = mcToPx(ani.mcX, ani.mcZ);
    const marker = L.marker(pos, { icon: transparentIcon }).addTo(map);

    const popupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 5px 0;">
            <div style="font-size:20px; font-weight:800; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:12px;">
                ${ani.order}. ${ani.name}
            </div>
            <div style="background:#333; border-radius:4px; padding:10px 0; margin-bottom:12px; cursor:pointer;" 
                 onclick="copyCoords(${ani.mcX}, ${ani.mcY}, ${ani.mcZ})">
                <div style="color:#FFD700; font-size:15px; font-weight:700; letter-spacing:0.5px;">
                    ${ani.mcX}, ${ani.mcY}, ${ani.mcZ}
                </div>
                <div style="color:#aaa; font-size:11px; margin-top:4px;">(클릭하여 좌표 복사)</div>
            </div>
            <div style="color:#7000CA; font-weight:800; font-size:14px; margin-bottom:8px;">*[히든]십이지신</div>
            <div style="font-size:12px; color:#333; line-height:1.6; letter-spacing:-0.3px; font-weight:600;">
                쥐 > 소 > 호랑이 > <span style="color:#d00; font-weight:800;">도사</span> > 토끼 > 용<br>
                뱀 > <span style="color:#d00; font-weight:800;">도사</span> > 말 > 양 > 원숭이 > <span style="color:#d00; font-weight:800;">도사</span><br>
                닭 > 개 > 돼지 > <span style="color:#d00; font-weight:800;">도사</span>
            </div>
        </div>
    `;
    marker.bindPopup(popupContent, {
    autoPan: false, // 무한 루프 방지를 위해 자동 이동을 끕니다.
    keepInView: true,
    closeButton: false,
    offset: L.point(0, -5)
});
    marker.on('mouseover', () => polyline.setStyle({ opacity: 0.7 }));
    marker.on('mouseout', () => polyline.setStyle({ opacity: 0 }));
});

// 5. 스폰 지점 마커
L.marker(mcToPx(spawnData.mcX, spawnData.mcZ), { icon: compassIcon })
    .addTo(map)
    .bindPopup(`<div style="color:#000; font-weight:bold; font-size:14px; text-align:center;">스폰 지점</div>`);

// 6. 광산 마커 생성
mines.forEach((mine) => {
    const pos = mcToPx(mine.x, mine.z);
    const specialMineNumbers = [14, 15, 24, 63, 64, 20, 27, 19];
    let markerClass = `mine-marker mine-${mine.c}`;
    if (specialMineNumbers.includes(mine.n)) markerClass += " special-mine";

    const mineIcon = L.divIcon({
        className: markerClass,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });

    const marker = L.marker(pos, { icon: mineIcon }).addTo(map);

    const specificOres = mineResources[mine.c];
    const commonOres = mineResources["공통"];
    const pathList = minePaths[mine.c].join(' > ');

    const popupContent = `
        <div style="text-align:center; min-width:230px; color:#000; padding: 0; line-height: 1.2;">
            <div style="font-size:20px; font-weight:800; border-bottom:2px solid #000; padding: 4px 0; margin-bottom: 8px; word-break:keep-all;">
                ${mine.n}번 광산 <span style="font-size:13px; font-weight:800; color:#d00;">(${specificOres})</span>
            </div>
            <div style="background:#333; border-radius:4px; padding: 5px 0; margin-bottom: 8px; cursor:pointer;" 
                 onclick="copyCoords(${mine.x}, ${mine.y}, ${mine.z})">
                <div style="color:#FFD700; font-size:16px; font-weight:700; letter-spacing:0.5px;">
                    ${mine.x}, ${mine.y}, ${mine.z}
                </div>
                <div style="color:#aaa; font-size:10px; margin-top: 1px;">(클릭하여 좌표 복사)</div>
            </div>
            <div style="font-size:12px; color:#333; letter-spacing:-0.4px; border-top:1px solid #aaa; padding-top: 6px;">
                <div style="margin-bottom: 4px; font-weight:600; color:#666;">[공통] ${commonOres}</div>
                <div style="font-weight:700; word-break:break-all; line-height: 1.3;">
                    <span style="color:${mineColors[mine.c]};">동선:</span> ${pathList}
                </div>
            </div>
        </div>
    `;
    
    marker.bindPopup(popupContent, {
    autoPan: false,
    keepInView: true,
    closeButton: false,
    offset: L.point(0, 10) // 광산은 창이 크니 살짝 아래로 뜨게 유지
});
    marker.on('mouseover', () => minePolylines[mine.c].setStyle({ opacity: 0.8 }));
    marker.on('mouseout', () => minePolylines[mine.c].setStyle({ opacity: 0 }));
});

// 7. 적환단 마커 생성
const redIcon = L.icon({
    iconUrl: 'images/red.png',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -10]
});

redItems.forEach((item) => {
    const pos = mcToPx(item.x, item.z);
    const marker = L.marker(pos, { icon: redIcon }).addTo(map);

    const popupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 0;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">
                적환단
            </div>
            <div style="background:#333; border-radius:4px; padding: 5px 0; margin-bottom: 10px; cursor:pointer;" 
                 onclick="copyCoords(${item.x}, ${item.y}, ${item.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">
                    ${item.x}, ${item.y}, ${item.z}
                </div>
                <div style="color:#aaa; font-size:9px;">(클릭하여 좌표 복사)</div>
            </div>
            <div style="margin-top: 5px; border: 1px solid #ccc; padding: 2px; background: #fff;">
                <img src="images/${item.file}" 
                     style="width:100%; max-width:180px; height:auto; cursor:zoom-in; display:block; margin:0 auto;" 
                     onclick="window.open('images/${item.file}', '_blank')">
                <div style="font-size:10px; color:#666; margin-top:3px;">▲ 이미지 클릭 시 확대</div>
            </div>
        </div>
    `;

    marker.bindPopup(popupContent, {
    autoPan: false, // 무한 루프 방지를 위해 자동 이동을 끕니다.
    keepInView: true,
    closeButton: false,
    offset: L.point(0, -5)
});
});

// [수정] 8. 아이콘 정의 (동상과 비석 아이콘 분리)

// 비석(산) 전용 아이콘 (기존 유지)
const stoneIcon = L.icon({
    iconUrl: 'images/stone.png',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -10]
});

// [추가] 동상 전용 아이콘 (stone2.png 사용)
const stone2Icon = L.icon({
    iconUrl: 'images/stone2.png',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -10]
});


// 9. 동상 마커 생성 (한월동상 수동 고정 + 나머지 자동 생성)

// [A] 한월동상 전용
const hanwolManual = statues.find(st => st.name === "한월동상");
if (hanwolManual) {
    const hanwolPos = [(7300 - 1246), 1278]; 
    // [수정] stoneIcon -> stone2Icon 사용
    const hMarker = L.marker(hanwolPos, { icon: stone2Icon }).addTo(map);

    const hPopupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 0;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">
                ${hanwolManual.name}
            </div>
            <div style="background:#333; border-radius:4px; padding: 5px 0; margin-bottom: 10px; cursor:pointer;" 
                 onclick="copyCoords(${hanwolManual.x}, ${hanwolManual.y}, ${hanwolManual.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${hanwolManual.x}, ${hanwolManual.y}, ${hanwolManual.z}</div>
                <div style="color:#aaa; font-size:9px;">(클릭하여 좌표 복사)</div>
            </div>
            <div style="margin-top: 5px; border: 1px solid #ccc; padding: 2px; background: #fff;">
                <img src="images/${hanwolManual.file}" 
                     style="width:100%; max-width:180px; height:auto; cursor:zoom-in; display:block; margin:0 auto;" 
                     onclick="window.open('images/${hanwolManual.file}', '_blank')">
                <div style="font-size:9px; color:#666; margin-top:2px;">▲ 클릭 시 확대</div>
            </div>
        </div>
    `;
    hMarker.bindPopup(hPopupContent, { autoPan: false, keepInView: true });
}

// [B] 나머지 동상들
statues.filter(st => st.name !== "한월동상").forEach((st) => {
    const pos = mcToPx(st.x, st.z);
    // [수정] stoneIcon -> stone2Icon 사용
    const marker = L.marker(pos, { icon: stone2Icon }).addTo(map);

    const popupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 0;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">
                ${st.name}
            </div>
            <div style="background:#333; border-radius:4px; padding: 5px 0; margin-bottom: 10px; cursor:pointer;" 
                 onclick="copyCoords(${st.x}, ${st.y}, ${st.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${st.x}, ${st.y}, ${st.z}</div>
                <div style="color:#aaa; font-size:9px;">(클릭하여 좌표 복사)</div>
            </div>
            <div style="margin-top: 5px; border: 1px solid #ccc; padding: 2px; background: #fff;">
                <img src="images/${st.file}" 
                     style="width:100%; max-width:180px; height:auto; cursor:zoom-in; display:block; margin:0 auto;" 
                     onclick="window.open('images/${st.file}', '_blank')">
                <div style="font-size:9px; color:#666; margin-top:2px;">▲ 클릭 시 확대</div>
            </div>
        </div>
    `;
    marker.bindPopup(popupContent, { autoPan: false, keepInView: true });
});

// 10. 비석(산) 마커 생성 (기존 유지)
mountains.forEach((mt) => {
    const pos = mcToPx(mt.x, mt.z);
    // 비석은 기존대로 stoneIcon 사용
    const marker = L.marker(pos, { icon: stoneIcon }).addTo(map);
    
    // ... (이하 팝업 디자인 코드는 동일하므로 생략) ...
// 10. 비석(산) 마커 생성
mountains.forEach((mt) => {
    const pos = mcToPx(mt.x, mt.z);
    const marker = L.marker(pos, { icon: stoneIcon }).addTo(map);

    const popupContent = `
        <div style="text-align:center; min-width:180px; color:#000; padding: 0;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">
                ${mt.name}
            </div>
            <div style="background:#333; border-radius:4px; padding: 8px 0; cursor:pointer;" 
                 onclick="copyCoords(${mt.x}, ${mt.y}, ${mt.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${mt.x}, ${mt.y}, ${mt.z}</div>
                <div style="color:#aaa; font-size:10px; margin-top:3px;">(클릭하여 좌표 복사)</div>
            </div>
        </div>
    `;
    marker.bindPopup(popupContent, { autoPan: false, keepInView: true });
});

// 파일 맨 아래에 넣어주세요.
map.on('popupopen', function(e) {
    const popup = e.popup;
    const container = popup._container;
    
    // 팝업이 뜨자마자 화면상의 위치 체크
    const rect = container.getBoundingClientRect();
    const mapRect = document.getElementById('map').getBoundingClientRect();
    
    // 천장에 닿았을 때 (여유있게 60px 기준)
    if (rect.top < mapRect.top + 60) {
        // 팝업을 마커 아래로 내림
        container.style.transform += " translateY(" + (rect.height + 40) + "px)";
        const tip = container.querySelector('.leaflet-popup-tip-container');
        if (tip) tip.style.display = 'none';
    }

    // 왼쪽 벽에 닿았을 때
    if (rect.left < mapRect.left + 20) {
        container.style.transform += " translateX(" + (rect.width / 2 + 10) + "px)";
    }
    
    // 오른쪽 벽에 닿았을 때
    if (rect.right > mapRect.right - 20) {
        container.style.transform += " translateX(-" + (rect.width / 2 + 10) + "px)";
    }
});
