// js/ui-control.js

// [1] 공용 아이콘 정의 모음 (파일 상단에 모아두어야 에러가 나지 않습니다)
const compassIcon = L.icon({
    iconUrl: 'images/compass.png',
    iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -10]
});

const transparentIcon = L.icon({
    iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==', 
    iconSize: [40, 40], // 크기 확대
    iconAnchor: [20, 20], // 중심점 조정
    popupAnchor: [0, -20] // 팝업 위치 조정
});

const redIcon = L.icon({
    iconUrl: 'images/red.png',
    iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -10]
});

const stoneIcon = L.icon({ 
    iconUrl: 'images/stone.png', 
    iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -10] 
});

const stone2Icon = L.icon({ 
    iconUrl: 'images/stone2.png', 
    iconSize: [36, 36], // 크기 확대
    iconAnchor: [18, 18], // 중심점 조정
    popupAnchor: [0, -15] // 팝업 위치 조정
});

const potIcon = L.icon({
    iconUrl: 'images/pot.png',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -15]
});

const boxIcon = L.icon({
    iconUrl: 'images/box.png',
    iconSize: [25, 25],
    iconAnchor: [18, 18],
    popupAnchor: [0, -15]
});

const npcIcon = L.icon({
    iconUrl: 'forky.png', // 
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20]
});

// [2] 십이지신 동선 설정
const animalPathPoints = animals.map(ani => mcToPx(ani.mcX, ani.mcZ));
const polyline = L.polyline(animalPathPoints, {
    color: '#FFD700', weight: 2, opacity: 0, dashArray: '5, 8'
}).addTo(map);

// [3] 광산 전용 동선 설정
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

// [4] 좌표 복사 함수
window.copyCoords = (x, y, z) => {
    const text = `${x} ${y} ${z}`; 
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById('copy-toast');
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 1500);
    });
};

// [5] 십이지신 마커 생성
animals.forEach((ani) => {
    const pos = mcToPx(ani.mcX, ani.mcZ);
    const marker = L.marker(pos, { icon: transparentIcon }).addTo(map);
    const popupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 5px 0;">
            <div style="font-size:20px; font-weight:800; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:12px;">${ani.order}. ${ani.name}</div>
            <div style="background:#333; border-radius:4px; padding:10px 0; margin-bottom:12px; cursor:pointer;" onclick="copyCoords(${ani.mcX}, ${ani.mcY}, ${ani.mcZ})">
                <div style="color:#FFD700; font-size:15px; font-weight:700; letter-spacing:0.5px;">${ani.mcX}, ${ani.mcY}, ${ani.mcZ}</div>
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
    marker.bindPopup(popupContent, { autoPan: false, keepInView: true, closeButton: false, offset: L.point(0, -5) });
    marker.on('mouseover', () => polyline.setStyle({ opacity: 0.7 }));
    marker.on('mouseout', () => polyline.setStyle({ opacity: 0 }));
});

// [6] 스폰 지점 마커
L.marker(mcToPx(spawnData.mcX, spawnData.mcZ), { icon: compassIcon })
    .addTo(map)
    .bindPopup(`<div style="color:#000; font-weight:bold; font-size:14px; text-align:center;">스폰 지점</div>`);

// [7] 광산 마커 생성
mines.forEach((mine) => {
    const pos = mcToPx(mine.x, mine.z);
    const specialNumbers = [14, 15, 24, 63, 64, 20, 27, 19];
    let markerClass = `mine-marker mine-${mine.c}`;
    if (specialNumbers.includes(mine.n)) markerClass += " special-mine";

    const mineIcon = L.divIcon({ className: markerClass, iconSize: [12, 12], iconAnchor: [6, 6] });
    const marker = L.marker(pos, { icon: mineIcon }).addTo(map);
    const specificOres = mineResources[mine.c];
    const commonOres = mineResources["공통"];
    const pathList = minePaths[mine.c].join(' > ');

    const popupContent = `
        <div style="text-align:center; min-width:230px; color:#000; padding: 0; line-height: 1.2;">
            <div style="font-size:20px; font-weight:800; border-bottom:2px solid #000; padding: 4px 0; margin-bottom: 8px; word-break:keep-all;">
                ${mine.n}번 광산 <span style="font-size:13px; font-weight:800; color:#d00;">(${specificOres})</span>
            </div>
            <div style="background:#333; border-radius:4px; padding: 5px 0; margin-bottom: 8px; cursor:pointer;" onclick="copyCoords(${mine.x}, ${mine.y}, ${mine.z})">
                <div style="color:#FFD700; font-size:16px; font-weight:700; letter-spacing:0.5px;">${mine.x}, ${mine.y}, ${mine.z}</div>
                <div style="color:#aaa; font-size:10px; margin-top: 1px;">(클릭하여 좌표 복사)</div>
            </div>
            <div style="font-size:12px; color:#333; letter-spacing:-0.4px; border-top:1px solid #aaa; padding-top: 6px;">
                <div style="margin-bottom: 4px; font-weight:600; color:#666;">[공통] ${commonOres}</div>
                <div style="font-weight:700; word-break:break-all; line-height: 1.3;"><span style="color:${mineColors[mine.c]};">동선:</span> ${pathList}</div>
            </div>
        </div>
    `;
    marker.bindPopup(popupContent, { autoPan: false, keepInView: true, closeButton: false, offset: L.point(0, 10) });
    marker.on('mouseover', () => minePolylines[mine.c].setStyle({ opacity: 0.8 }));
    marker.on('mouseout', () => minePolylines[mine.c].setStyle({ opacity: 0 }));
});

// [8] 적환단 마커 생성
redItems.forEach((item) => {
    const pos = mcToPx(item.x, item.z);
    const marker = L.marker(pos, { icon: redIcon }).addTo(map);
    const popupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 0;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">적환단</div>
            <div style="background:#333; border-radius:4px; padding: 5px 0; margin-bottom: 10px; cursor:pointer;" onclick="copyCoords(${item.x}, ${item.y}, ${item.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${item.x}, ${item.y}, ${item.z}</div>
                <div style="color:#aaa; font-size:9px;">(클릭하여 좌표 복사)</div>
            </div>
            <div style="margin-top: 5px; border: 1px solid #ccc; padding: 2px; background: #fff;">
                <img src="images/${item.file}" style="width:100%; max-width:180px; height:auto; cursor:zoom-in; display:block; margin:0 auto;" onclick="window.open('images/${item.file}', '_blank')">
                <div style="font-size:10px; color:#666; margin-top:3px;">▲ 이미지 클릭 시 확대</div>
            </div>
        </div>
    `;
    marker.bindPopup(popupContent, { autoPan: false, keepInView: true, closeButton: false, offset: L.point(0, -5) });
});

// [9] 동상 마커 생성
const hanwolManual = statues.find(st => st.name === "한월동상");
if (hanwolManual) {
    const hanwolPos = [(7300 - 1246), 1278]; 
    const hMarker = L.marker(hanwolPos, { icon: stone2Icon }).addTo(map);
    const hPopupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 0;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">${hanwolManual.name}</div>
            <div style="background:#333; border-radius:4px; padding: 5px 0; margin-bottom: 10px; cursor:pointer;" onclick="copyCoords(${hanwolManual.x}, ${hanwolManual.y}, ${hanwolManual.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${hanwolManual.x}, ${hanwolManual.y}, ${hanwolManual.z}</div>
                <div style="color:#aaa; font-size:9px;">(클릭하여 좌표 복사)</div>
            </div>
            <div style="margin-top: 5px; border: 1px solid #ccc; padding: 2px; background: #fff;">
                <img src="images/${hanwolManual.file}" style="width:100%; max-width:180px; height:auto; cursor:zoom-in; display:block; margin:0 auto;" onclick="window.open('images/${hanwolManual.file}', '_blank')">
                <div style="font-size:9px; color:#666; margin-top:2px;">▲ 클릭 시 확대</div>
            </div>
        </div>
    `;
    hMarker.bindPopup(hPopupContent, { autoPan: false, keepInView: true });
}

statues.filter(st => st.name !== "한월동상").forEach((st) => {
    const pos = mcToPx(st.x, st.z);
    const marker = L.marker(pos, { icon: stone2Icon }).addTo(map);
    const popupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 0;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">${st.name}</div>
            <div style="background:#333; border-radius:4px; padding: 5px 0; margin-bottom: 10px; cursor:pointer;" onclick="copyCoords(${st.x}, ${st.y}, ${st.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${st.x}, ${st.y}, ${st.z}</div>
                <div style="color:#aaa; font-size:9px;">(클릭하여 좌표 복사)</div>
            </div>
            <div style="margin-top: 5px; border: 1px solid #ccc; padding: 2px; background: #fff;">
                <img src="images/${st.file}" style="width:100%; max-width:180px; height:auto; cursor:zoom-in; display:block; margin:0 auto;" onclick="window.open('images/${st.file}', '_blank')">
                <div style="font-size:9px; color:#666; margin-top:2px;">▲ 클릭 시 확대</div>
            </div>
        </div>
    `;
    marker.bindPopup(popupContent, { autoPan: false, keepInView: true });
});

// [10] 비석(산) 마커 생성
mountains.forEach((mt) => {
    const pos = mcToPx(mt.x, mt.z);
    const marker = L.marker(pos, { icon: stoneIcon }).addTo(map);
    const popupContent = `
        <div style="text-align:center; min-width:180px; color:#000; padding: 0;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">${mt.name}</div>
            <div style="background:#333; border-radius:4px; padding: 8px 0; cursor:pointer;" onclick="copyCoords(${mt.x}, ${mt.y}, ${mt.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${mt.x}, ${mt.y}, ${mt.z}</div>
                <div style="color:#aaa; font-size:10px; margin-top:3px;">(클릭하여 좌표 복사)</div>
            </div>
        </div>
    `;
    marker.bindPopup(popupContent, { autoPan: false, keepInView: true });
});

// [11] 항아리 마커 생성
potItems.forEach((pot) => {
    const pos = mcToPx(pot.x, pot.z);
    const marker = L.marker(pos, { icon: potIcon }).addTo(map);

    const popupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 0; line-height: 1.3;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">
                ${pot.name}
            </div>
            
            <div style="background:#333; border-radius:4px; padding: 6px 0; margin-bottom: 10px; cursor:pointer;" 
                 onclick="copyCoords(${pot.x}, ${pot.y}, ${pot.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">
                    ${pot.x}, ${pot.y}, ${pot.z}
                </div>
                <div style="color:#aaa; font-size:9px; margin-top: 2px;">(클릭하여 좌표 복사)</div>
            </div>

            <div style="font-size:13px; color:#333; letter-spacing:-0.4px; border-top:1px solid #aaa; padding-top: 8px;">
                <div style="margin-bottom: 4px;">
                    <span style="font-weight:800; color:#d00;">필요도구:</span> ${pot.tool}
                </div>
                <div style="font-weight:700;">
                    <span style="color:#666;">획득아이템:</span> ${pot.item}
                </div>
            </div>
        </div>
    `;

    marker.bindPopup(popupContent, {
        autoPan: false,
        keepInView: true,
        closeButton: false,
        offset: L.point(0, -5)
    });
});

// [11] 잘림 방지 보정 스크립트
map.on('popupopen', function(e) {
    const popup = e.popup;
    const container = popup._container;
    const rect = container.getBoundingClientRect();
    const mapRect = document.getElementById('map').getBoundingClientRect();
    
    if (rect.top < mapRect.top + 60) {
        container.style.transform += " translateY(" + (rect.height + 40) + "px)";
        const tip = container.querySelector('.leaflet-popup-tip-container');
        if (tip) tip.style.display = 'none';
    }
    if (rect.left < mapRect.left + 20) {
        container.style.transform += " translateX(" + (rect.width / 2 + 10) + "px)";
    }
    if (rect.right > mapRect.right - 20) {
        container.style.transform += " translateX(-" + (rect.width / 2 + 10) + "px)";
    }
});

// [12] 의문의 상자 마커 생성 (입구 좌표 표시 로직 추가)
mysteryBoxes.forEach((box) => {
    const pos = mcToPx(box.x, box.z);
    const marker = L.marker(pos, { icon: boxIcon }).addTo(map);

    // 1. 아이템 정보 (있을 때만)
    const itemInfo = box.item ? 
        `<div style="margin-bottom:4px;"><span style="color:#666; font-weight:700;">획득아이템:</span> ${box.item}</div>` : '';

    // 2. 입구 정보 (entrance 데이터가 있을 때만 특별 노출)
    const entranceInfo = box.entrance ? 
        `<div style="margin-top:4px; padding: 4px; background: #fff1f1; border-radius: 4px; border: 1px dashed #d00;">
            <span style="color:#d00; font-weight:800;">[진입입구]</span><br>
            <span style="font-size:11px; font-weight:700;">${box.entrance}</span>
         </div>` : '';

    const popupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 0; line-height: 1.3;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">
                ${box.name}
            </div>
            
            <div style="background:#333; border-radius:4px; padding: 6px 0; margin-bottom: 10px; cursor:pointer;" 
                 onclick="copyCoords(${box.x}, ${box.y}, ${box.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">
                    ${box.x}, ${box.y}, ${box.z}
                </div>
                <div style="color:#aaa; font-size:9px; margin-top: 2px;">(클릭하여 좌표 복사)</div>
            </div>

            ${(box.item || box.entrance) ? `
            <div style="font-size:12px; color:#333; letter-spacing:-0.4px; border-top:1px solid #aaa; padding-top: 8px;">
                ${itemInfo}
                ${entranceInfo}
            </div>` : ''}
        </div>
    `;

    marker.bindPopup(popupContent, {
        autoPan: false,
        keepInView: true,
        closeButton: false,
        offset: L.point(0, -5)
    });
});

// [13] 퀘스트 NPC 마커 생성
npcData.forEach((npc) => {
    const pos = mcToPx(npc.x, npc.z);
    
    // 해적선처럼 파일 없이 투명 처리가 필요한 경우 체크
    let currentIcon;
    if (npc.file === "transparent") {
        currentIcon = transparentIcon; // 기존에 정의된 투명 아이콘 사용
    } else {
        // NPC별 고유 아이콘 생성
        currentIcon = L.icon({
            iconUrl: `images/${npc.file}`,
            iconSize: [40, 40],
            iconAnchor: [20, 20],
            popupAnchor: [0, -20]
        });
    }

    const marker = L.marker(pos, { icon: currentIcon }).addTo(map);

    // 상세 정보 HTML 조립 (데이터가 있는 것만 노출)
    const lvInfo = npc.lv ? `<span style="font-size:12px; color:#666; font-weight:normal;"> (lv.${npc.lv})</span>` : '';
    const questInfo = npc.quest ? `<div style="margin-bottom:4px;"><span style="color:#d00; font-weight:800;">[퀘스트]</span> ${npc.quest}</div>` : '';
    const itemInfo = npc.item ? `<div style="margin-bottom:4px;"><span style="color:#007bff; font-weight:800;">[필요아이템]</span> ${npc.item}</div>` : '';
    const routeInfo = npc.route ? `<div style="margin-bottom:4px;"><span style="color:#28a745; font-weight:800;">[동선]</span> ${npc.route}</div>` : '';
    const rewardInfo = npc.reward ? `<div style="margin-bottom:4px;"><span style="color:#f39c12; font-weight:800;">[보상]</span> ${npc.reward}</div>` : '';
    const memoInfo = npc.memo ? `<div style="margin-top:4px; border-top:1px dashed #ccc; padding-top:4px; color:#666;">※ ${npc.memo}</div>` : '';

    const popupContent = `
        <div style="text-align:center; min-width:240px; color:#000; padding: 0; line-height: 1.4;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">
                ${npc.name}${lvInfo}
            </div>
            
            <div style="background:#333; border-radius:4px; padding: 6px 0; margin-bottom: 10px; cursor:pointer;" 
                 onclick="copyCoords(${npc.x}, ${npc.y}, ${npc.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${npc.x}, ${npc.y}, ${npc.z}</div>
                <div style="color:#aaa; font-size:9px;">(클릭하여 좌표 복사)</div>
            </div>

            <div style="text-align:left; font-size:12px; color:#333; letter-spacing:-0.4px; border-top:1px solid #aaa; padding-top: 8px;">
                ${questInfo}
                ${itemInfo}
                ${routeInfo}
                ${rewardInfo}
                ${memoInfo}
            </div>
        </div>
    `;

    marker.bindPopup(popupContent, {
        autoPan: false,
        keepInView: true,
        closeButton: false,
        offset: L.point(0, -5)
    });
});
