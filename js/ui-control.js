// js/ui-control.js

// [0] 레이어 그룹 정의 (체크박스 제어용)
const layers = {
    spawn: L.layerGroup().addTo(map),      // 스폰: 초기 ON
    animals: L.layerGroup().addTo(map),    // 십이지신: 초기 ON
    stones: L.layerGroup(),                // 나머지는 초기 OFF (addTo(map) 없음)
    npc: L.layerGroup(),
    red: L.layerGroup(),
    pot: L.layerGroup(),
    box: L.layerGroup(),
    mines: {
        "녹": L.layerGroup(),
        "청": L.layerGroup(),
        "황": L.layerGroup(),
        "적": L.layerGroup()
    },
    hunting: {}
};

// [1] 공용 아이콘 정의 모음
const compassIcon = L.icon({
    iconUrl: 'images/compass.png',
    iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -15]
});

const transparentIcon = L.icon({
    iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==', 
    iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -20]
});

const redIcon = L.icon({
    iconUrl: 'images/red.png',
    iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -15]
});

const stoneIcon = L.icon({ 
    iconUrl: 'images/stone.png', 
    iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -12] 
});

const stone2Icon = L.icon({ 
    iconUrl: 'images/stone2.png', 
    iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -15] 
});

const potIcon = L.icon({
    iconUrl: 'images/pot.png',
    iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -15]
});

const boxIcon = L.icon({
    iconUrl: 'images/box.png',
    iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -15]
});

const npcIcon = L.icon({
    iconUrl: 'images/npc_default.png', 
    iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -20]
});

// [2] 십이지신 동선 설정
const animalPathPoints = animals.map(ani => mcToPx(ani.mcX, ani.mcZ));
const polyline = L.polyline(animalPathPoints, {
    color: '#FFD700', weight: 2, opacity: 0, dashArray: '5, 8'
}).addTo(layers.animals); // 그룹에 추가

// [3] 광산 전용 동선 설정
const minePolylines = {};
const mineColors = { "녹": "#2ecc71", "청": "#3498db", "황": "#f1c40f", "적": "#e74c3c" };

Object.keys(minePaths).forEach(colorKey => {
    const pathCoords = minePaths[colorKey].map(num => {
        const mine = mines.find(m => m.n === num);
        if (mine) return mcToPx(mine.x, mine.z);
    }).filter(coord => coord !== undefined);

    minePolylines[colorKey] = L.polyline(pathCoords, {
        color: mineColors[colorKey], weight: 3, opacity: 0, dashArray: '7, 10'
    }).addTo(layers.mines[colorKey]); // 각 광산 그룹에 추가
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
    const marker = L.marker(pos, { icon: transparentIcon }).addTo(layers.animals);
    const popupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 5px 0;">
            <div style="font-size:20px; font-weight:800; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:12px;">${ani.order}. ${ani.name}</div>
            <div style="background:#333; border-radius:4px; padding:10px 0; margin-bottom:12px; cursor:pointer;" onclick="copyCoords(${ani.mcX}, ${ani.mcY}, ${ani.mcZ})">
                <div style="color:#FFD700; font-size:15px; font-weight:700; letter-spacing:0.5px;">${ani.mcX}, ${ani.mcY}, ${ani.mcZ}</div>
                <div style="color:#aaa; font-size:11px; margin-top:4px;">(클릭하여 좌표 복사)</div>
            </div>
            <div style="color:#7000CA; font-weight:800; font-size:14px; margin-bottom:8px;">*[히든]십이지신</div>
            <div style="font-size:12px; color:#333; line-height:1.6; letter-spacing:-0.3px; font-weight:600;">
                쥐 > 소 > 호랑이 > 도사 > 토끼 > 용 / 뱀 > 도사 > 말 > 양 > 원숭이 > 도사 / 닭 > 개 > 돼지 > 도사
            </div>
        </div>
    `;
    marker.bindPopup(popupContent, { autoPan: false, keepInView: true, closeButton: false, offset: L.point(0, -5) });
    marker.on('mouseover', () => polyline.setStyle({ opacity: 0.7 }));
    marker.on('mouseout', () => polyline.setStyle({ opacity: 0 }));
});

// [6] 스폰 지점 마커
L.marker(mcToPx(spawnData.mcX, spawnData.mcZ), { icon: compassIcon })
    .addTo(layers.spawn)
    .bindPopup(`<div style="color:#000; font-weight:bold; font-size:14px; text-align:center;">스폰 지점</div>`);

// [7] 광산 마커 생성
mines.forEach((mine) => {
    const pos = mcToPx(mine.x, mine.z);
    const specialNumbers = [14, 15, 24, 63, 64, 20, 27, 19];
    let markerClass = `mine-marker mine-${mine.c}`;
    if (specialNumbers.includes(mine.n)) markerClass += " special-mine";
    const mineIcon = L.divIcon({ className: markerClass, iconSize: [18, 18], iconAnchor: [9, 9] });
    const marker = L.marker(pos, { icon: mineIcon }).addTo(layers.mines[mine.c]);
    const specificOres = mineResources[mine.c];
    const commonOres = mineResources["공통"];
    const pathList = minePaths[mine.c].join(' > ');
    const popupContent = `
        <div style="text-align:center; min-width:230px; color:#000; padding: 0; line-height: 1.2;">
            <div style="font-size:20px; font-weight:800; border-bottom:2px solid #000; padding: 4px 0; margin-bottom: 8px;">${mine.n}번 광산 <span style="font-size:13px; font-weight:800; color:#d00;">(${specificOres})</span></div>
            <div style="background:#333; border-radius:4px; padding: 5px 0; margin-bottom: 8px; cursor:pointer;" onclick="copyCoords(${mine.x}, ${mine.y}, ${mine.z})">
                <div style="color:#FFD700; font-size:16px; font-weight:700;">${mine.x}, ${mine.y}, ${mine.z}</div>
                <div style="color:#aaa; font-size:10px;">(클릭하여 좌표 복사)</div>
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
    const marker = L.marker(pos, { icon: redIcon }).addTo(layers.red);
    const popupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 0;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">적환단</div>
            <div style="background:#333; border-radius:4px; padding: 5px 0; margin-bottom: 10px; cursor:pointer;" onclick="copyCoords(${item.x}, ${item.y}, ${item.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${item.x}, ${item.y}, ${item.z}</div>
                <div style="color:#aaa; font-size:9px;">(클릭하여 좌표 복사)</div>
            </div>
            <div style="margin-top: 5px; border: 1px solid #ccc; padding: 2px; background: #fff;">
                <img src="images/${item.file}" style="width:100%; max-width:180px; height:auto; cursor:zoom-in; display:block; margin:0 auto;" onclick="window.open('images/${item.file}', '_blank')">
            </div>
        </div>
    `;
    marker.bindPopup(popupContent, { autoPan: false, keepInView: true, closeButton: false, offset: L.point(0, -5) });
});

// [9] 동상 마커 생성
const hanwolManual = statues.find(st => st.name === "한월동상");
if (hanwolManual) {
    const hanwolPos = [(7300 - 1246), 1278]; 
    const hMarker = L.marker(hanwolPos, { icon: stone2Icon }).addTo(layers.stones);
    const hPopupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 0;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">${hanwolManual.name}</div>
            <div style="background:#333; border-radius:4px; padding: 5px 0; margin-bottom: 10px; cursor:pointer;" onclick="copyCoords(${hanwolManual.x}, ${hanwolManual.y}, ${hanwolManual.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${hanwolManual.x}, ${hanwolManual.y}, ${hanwolManual.z}</div>
                <div style="color:#aaa; font-size:9px;">(클릭하여 좌표 복사)</div>
            </div>
            <div style="margin-top: 5px; border: 1px solid #ccc; padding: 2px; background: #fff;">
                <img src="images/${hanwolManual.file}" style="width:100%; max-width:180px; height:auto; cursor:zoom-in; display:block; margin:0 auto;" onclick="window.open('images/${hanwolManual.file}', '_blank')">
            </div>
        </div>
    `;
    hMarker.bindPopup(hPopupContent, { autoPan: false, keepInView: true });
}

statues.filter(st => st.name !== "한월동상").forEach((st) => {
    const pos = mcToPx(st.x, st.z);
    const marker = L.marker(pos, { icon: stone2Icon }).addTo(layers.stones);
    const popupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 0;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">${st.name}</div>
            <div style="background:#333; border-radius:4px; padding: 5px 0; margin-bottom: 10px; cursor:pointer;" onclick="copyCoords(${st.x}, ${st.y}, ${st.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${st.x}, ${st.y}, ${st.z}</div>
                <div style="color:#aaa; font-size:9px;">(클릭하여 좌표 복사)</div>
            </div>
            <div style="margin-top: 5px; border: 1px solid #ccc; padding: 2px; background: #fff;">
                <img src="images/${st.file}" style="width:100%; max-width:180px; height:auto; cursor:zoom-in; display:block; margin:0 auto;" onclick="window.open('images/${st.file}', '_blank')">
            </div>
        </div>
    `;
    marker.bindPopup(popupContent, { autoPan: false, keepInView: true });
});

// [10] 비석(산) 마커 생성
mountains.forEach((mt) => {
    const pos = mcToPx(mt.x, mt.z);
    const marker = L.marker(pos, { icon: stoneIcon }).addTo(layers.stones);
    const popupContent = `
        <div style="text-align:center; min-width:180px; color:#000; padding: 0;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">${mt.name}</div>
            <div style="background:#333; border-radius:4px; padding: 8px 0; cursor:pointer;" onclick="copyCoords(${mt.x}, ${mt.y}, ${mt.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${mt.x}, ${mt.y}, ${mt.z}</div>
                <div style="color:#aaa; font-size:10px;">(클릭하여 좌표 복사)</div>
            </div>
        </div>
    `;
    marker.bindPopup(popupContent, { autoPan: false, keepInView: true });
});

// [11] 항아리 마커 생성
potItems.forEach((pot) => {
    const pos = mcToPx(pot.x, pot.z);
    const marker = L.marker(pos, { icon: potIcon }).addTo(layers.pot);
    const popupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 0; line-height: 1.3;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">${pot.name}</div>
            <div style="background:#333; border-radius:4px; padding: 6px 0; margin-bottom: 10px; cursor:pointer;" onclick="copyCoords(${pot.x}, ${pot.y}, ${pot.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${pot.x}, ${pot.y}, ${pot.z}</div>
                <div style="color:#aaa; font-size:9px;">(클릭하여 좌표 복사)</div>
            </div>
            <div style="font-size:13px; color:#333; letter-spacing:-0.4px; border-top:1px solid #aaa; padding-top: 8px;">
                <div><span style="font-weight:800; color:#d00;">필요도구:</span> ${pot.tool}</div>
                <div><span style="color:#666; font-weight:700;">획득아이템:</span> ${pot.item}</div>
            </div>
        </div>
    `;
    marker.bindPopup(popupContent, { autoPan: false, keepInView: true, closeButton: false, offset: L.point(0, -5) });
});

// [12] 의문의 상자 마커 생성
mysteryBoxes.forEach((box) => {
    const pos = mcToPx(box.x, box.z);
    const marker = L.marker(pos, { icon: boxIcon }).addTo(layers.box);
    const itemInfo = box.item ? `<div style="margin-bottom:4px;"><span style="color:#666; font-weight:700;">획득아이템:</span> ${box.item}</div>` : '';
    const entranceInfo = box.entrance ? `<div style="margin-top:4px; padding: 4px; background: #fff1f1; border-radius: 4px; border: 1px dashed #d00;"><span style="color:#d00; font-weight:800;">[진입입구]</span><br><span style="font-size:11px; font-weight:700;">${box.entrance}</span></div>` : '';
    const popupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 0; line-height: 1.3;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">${box.name}</div>
            <div style="background:#333; border-radius:4px; padding: 6px 0; margin-bottom: 10px; cursor:pointer;" onclick="copyCoords(${box.x}, ${box.y}, ${box.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${box.x}, ${box.y}, ${box.z}</div>
                <div style="color:#aaa; font-size:9px;">(클릭하여 좌표 복사)</div>
            </div>
            ${(box.item || box.entrance) ? `<div style="font-size:12px; color:#333; letter-spacing:-0.4px; border-top:1px solid #aaa; padding-top: 8px;">${itemInfo}${entranceInfo}</div>` : ''}
        </div>
    `;
    marker.bindPopup(popupContent, { autoPan: false, keepInView: true, closeButton: false, offset: L.point(0, -5) });
});

// [13] 퀘스트 NPC 마커 생성
npcData.forEach((npc) => {
    const pos = mcToPx(npc.x, npc.z);
    let currentIcon = npc.file === "transparent" ? transparentIcon : L.icon({ iconUrl: `images/${npc.file}`, iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -20] });
    const marker = L.marker(pos, { icon: currentIcon }).addTo(layers.npc);
    const lvInfo = npc.lv ? `<span style="font-size:12px; color:#666; font-weight:normal;"> (lv.${npc.lv})</span>` : '';
    const questInfo = npc.quest ? `<div style="margin-bottom:4px;"><span style="color:#d00; font-weight:800;">[퀘스트]</span> ${npc.quest}</div>` : '';
    const itemInfo = npc.item ? `<div style="margin-bottom:4px;"><span style="color:#007bff; font-weight:800;">[필요아이템]</span> ${npc.item}</div>` : '';
    const routeInfo = npc.route ? `<div style="margin-bottom:4px;"><span style="color:#28a745; font-weight:800;">[동선]</span> ${npc.route}</div>` : '';
    const rewardInfo = npc.reward ? `<div style="margin-bottom:4px;"><span style="color:#f39c12; font-weight:800;">[보상]</span> ${npc.reward}</div>` : '';
    const memoInfo = npc.memo ? `<div style="margin-top:4px; border-top:1px dashed #ccc; padding-top:4px; color:#666;">※ ${npc.memo}</div>` : '';
    const popupContent = `
        <div style="text-align:center; min-width:240px; color:#000; padding: 0; line-height: 1.4;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">${npc.name}${lvInfo}</div>
            <div style="background:#333; border-radius:4px; padding: 6px 0; margin-bottom: 10px; cursor:pointer;" onclick="copyCoords(${npc.x}, ${npc.y}, ${npc.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${npc.x}, ${npc.y}, ${npc.z}</div>
                <div style="color:#aaa; font-size:9px;">(클릭하여 좌표 복사)</div>
            </div>
            <div style="text-align:left; font-size:12px; color:#333; border-top:1px solid #aaa; padding-top: 8px;">${questInfo}${itemInfo}${routeInfo}${rewardInfo}${memoInfo}</div>
        </div>
    `;
    marker.bindPopup(popupContent, { autoPan: false, keepInView: true, closeButton: false, offset: L.point(0, -5) });
});

// [14] 사냥터 영역 및 투명 마커 생성 (자동 이동/확대/팝업 통합)
const huntingImageBounds = [[0, 0], [7300, 7300]]; 
const huntingListContainer = document.getElementById('hunt-accordion-content');

// 사냥터 전용 투명 마커들을 담을 객체 추가
layers.huntingMarkers = {}; 

huntingGrounds.forEach((area) => {
    // 1. 이미지 오버레이 생성 (interactive: false로 설정하여 다른 마커 클릭 방해 금지)
    const overlay = L.imageOverlay(`images/${area.file}`, huntingImageBounds, {
        opacity: 0.5, 
        interactive: false 
    });
    layers.hunting[area.name] = overlay;

    // 2. 투명 마커 생성 (대표 좌표 x, z 기반)
    const targetPos = mcToPx(area.x, area.z);
    const hMarker = L.marker(targetPos, { 
        icon: transparentIcon,
        zIndexOffset: -500 // 다른 중요한 마커보다 뒤에 배치
    });
    layers.huntingMarkers[area.name] = hMarker;

    // 3. 목록(아코디언) 아이템 생성
    const label = document.createElement('label');
    label.className = 'control-item';
    label.innerHTML = `
        <input type="checkbox" id="hunt-${area.name}"> 
        <span style="flex:1;">${area.name}</span>
        <span style="font-size:10px; color:#888; font-weight:normal;">Lv.${area.lv}</span>
    `;
    huntingListContainer.appendChild(label);

    // 4. 팝업 내용 정의 (마커에 연결)
    const memoInfo = area.memo ? `<div style="margin-top:4px; color:#d00; font-weight:700;">${area.memo}</div>` : '';
    const popupContent = `
        <div style="text-align:center; min-width:220px; color:#000; padding: 5px; line-height: 1.4;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #333; padding-bottom:5px; margin-bottom:8px;">
                ${area.name} (Lv.${area.lv})
            </div>
            <div style="text-align:left; font-size:12px;">
                <div style="margin-bottom:4px;"><span style="font-weight:800; color:#007bff;">[몬스터]</span> ${area.monsters}</div>
                <div style="margin-bottom:4px;"><span style="font-weight:800; color:#444;">[좌표]</span> ${area.x}, ${area.y}, ${area.z}</div>
                ${memoInfo}
            </div>
        </div>
    `;
    hMarker.bindPopup(popupContent, { autoPan: false, keepInView: true });

    // 5. 체크박스 이벤트 연결 (이동 + 확대 + 팝업)
    document.getElementById(`hunt-${area.name}`).addEventListener('change', function(e) {
        if(e.target.checked) {
            // 레이어 및 마커 표시
            layers.hunting[area.name].addTo(map);
            layers.huntingMarkers[area.name].addTo(map);

            // [심화] 부드러운 이동 및 확대 (확대 레벨 4)
            map.flyTo(targetPos, 2, {
                animate: true,
                duration: 1.0
            });

            // 이동 후 팝업 자동 열기 (0.6초 뒤)
            setTimeout(() => {
                layers.huntingMarkers[area.name].openPopup();
            }, 600);
        } else {
            // 체크 해제 시 제거
            map.removeLayer(layers.hunting[area.name]);
            map.removeLayer(layers.huntingMarkers[area.name]);
        }
    });

    // 이미지 효과 (그림 확인용)
    overlay.on('mouseover', function () { this.setOpacity(0.8); });
    overlay.on('mouseout', function () { this.setOpacity(0.5); });
});

// [15] 체크박스 이벤트 연결 시스템
const bindCheckbox = (id, layer) => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
        checkbox.addEventListener('change', function(e) {
            if(e.target.checked) layer.addTo(map);
            else map.removeLayer(layer);
        });
    }
};

// 모든 체크박스 연결
bindCheckbox('check-spawn', layers.spawn);
bindCheckbox('check-animals', layers.animals);
bindCheckbox('check-stones', layers.stones);
bindCheckbox('check-npc', layers.npc);
bindCheckbox('check-red', layers.red);
bindCheckbox('check-pot', layers.pot);
bindCheckbox('check-box', layers.box);
bindCheckbox('mine-녹', layers.mines["녹"]);
bindCheckbox('mine-청', layers.mines["청"]);
bindCheckbox('mine-황', layers.mines["황"]);
bindCheckbox('mine-적', layers.mines["적"]);

// [최종] 잘림 방지 보정 스크립트
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
