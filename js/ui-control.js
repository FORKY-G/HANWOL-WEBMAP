// [0] 레이어 그룹 정의 (체크박스 제어용)
const layers = {
    spawn: L.layerGroup().addTo(map),      // 스폰: 초기 ON
    animals: L.layerGroup().addTo(map),    // 십이지신: 초기 ON
    stones: L.layerGroup(),                // 나머지는 체크해야 나타남
    npc: L.layerGroup(),
    red: L.layerGroup(),
    pot: L.layerGroup(),
    box: L.layerGroup(),
    mines: {
        "녹": L.layerGroup(), "청": L.layerGroup(), "황": L.layerGroup(), "적": L.layerGroup()
    },
    hunting: {},
    huntingMarkers: L.layerGroup() // 사냥터 투명 마커 전용 그룹 (검색용)
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
}).addTo(layers.animals); 

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
    }).addTo(layers.mines[colorKey]); 
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

// [14] 사냥터 영역 및 투명 마커 생성 (수정본)
const huntingImageBounds = [[0, 0], [7300, 7300]]; 
const huntingListContainer = document.getElementById('hunt-accordion-content');

huntingGrounds.forEach((area) => {
    const overlay = L.imageOverlay(`images/${area.file}`, huntingImageBounds, {
        opacity: 0.5, 
        interactive: false 
    });
    layers.hunting[area.name] = overlay;

    const targetPos = mcToPx(area.x, area.z);
    const hMarker = L.marker(targetPos, { 
        icon: transparentIcon,
        zIndexOffset: -500
    }).addTo(layers.huntingMarkers); // 검색용 그룹에 추가

    const label = document.createElement('label');
    label.className = 'control-item';
    label.innerHTML = `
        <input type="checkbox" id="hunt-${area.name}"> 
        <span style="flex:1;">${area.name}</span>
        <span style="font-size:10px; color:#888; font-weight:normal;">Lv.${area.lv}</span>
    `;
    huntingListContainer.appendChild(label);

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

    document.getElementById(`hunt-${area.name}`).addEventListener('change', function(e) {
        if(e.target.checked) {
            layers.hunting[area.name].addTo(map);
            hMarker.addTo(map);
            // 사냥터 이동 시 확대 배율 조정 (1.5)
            map.flyTo(targetPos, 0.5, { animate: true, duration: 1.0 }); 
            setTimeout(() => { hMarker.openPopup(); }, 500);
        } else {
            map.removeLayer(layers.hunting[area.name]);
            map.removeLayer(hMarker);
        }
    });

    overlay.on('mouseover', function () { this.setOpacity(0.8); });
    overlay.on('mouseout', function () { this.setOpacity(0.5); });
});

// [15] 약초 시스템 (희귀 표시 및 멀티 마커 지원)
const herbListContainer = document.getElementById('herb-accordion-content');
layers.herbs = {};
layers.herbMarkers = {};

// 희귀 약초 리스트
const rareHerbs = ["홍련업화", "철목영지", "금향과", "월계엽", "빙백설화"];

herbData.sort((a, b) => {
    const aRare = rareHerbs.includes(a.name);
    const bRare = rareHerbs.includes(b.name);
    if (aRare && !bRare) return -1;
    if (!aRare && bRare) return 1;
    return a.name.localeCompare(b.name, 'ko');
});

herbData.forEach((herb) => {
    const isRare = rareHerbs.includes(herb.name);
    const rareTag = isRare ? '<span style="color: #ff0000; font-weight: bold; margin-left: 5px;">(희귀)</span>' : '';

    const overlay = L.imageOverlay(`images/${herb.file}`, huntingImageBounds, {
        opacity: 0.6, interactive: false 
    });
    layers.herbs[herb.name] = overlay;

    const markerGroup = L.layerGroup();
    herb.locations.forEach(loc => {
        const pos = mcToPx(loc.x, loc.z);
        const hMarker = L.marker(pos, { icon: transparentIcon });
        
        const popupContent = `
            <div style="text-align:center; min-width:180px; color:#000;">
                <div style="font-size:16px; font-weight:800; border-bottom:2px solid #000; padding-bottom:5px; margin-bottom:8px;">
                    ${herb.name}${rareTag}
                </div>
                <div style="background:#333; color:#FFD700; border-radius:4px; padding:6px; cursor:pointer; font-size:14px; font-weight:700;" onclick="copyCoords(${loc.x}, 0, ${loc.z})">
                    ${loc.x}, ${loc.z}
                    <div style="color:#aaa; font-size:10px; font-weight:normal; margin-top:2px;">(클릭하여 좌표 복사)</div>
                </div>
            </div>
        `;
        hMarker.bindPopup(popupContent, { closeButton: false, offset: L.point(0, -10) });
        markerGroup.addLayer(hMarker);
    });
    layers.herbMarkers[herb.name] = markerGroup;

    const label = document.createElement('label');
    label.className = 'control-item';
    label.style.display = 'flex';
    label.style.alignItems = 'center';
    label.innerHTML = `
        <input type="checkbox" id="herb-${herb.name}"> 
        <span style="flex:1; margin-left:8px;">${herb.name}${rareTag}</span>
    `;
    if(herbListContainer) herbListContainer.appendChild(label);

    // 약초 체크박스 이벤트 (이동 및 확대 제거)
    document.getElementById(`herb-${herb.name}`).addEventListener('change', function(e) {
        if(e.target.checked) {
            layers.herbs[herb.name].addTo(map);
            layers.herbMarkers[herb.name].addTo(map);
        } else {
            map.removeLayer(layers.herbs[herb.name]);
            map.removeLayer(layers.herbMarkers[herb.name]);
            map.closePopup();
        }
    });
});

// [16] 체크박스 이벤트 연결 시스템
const bindCheckbox = (id, layer) => {
    const checkbox = document.getElementById(id);
    if (checkbox) {
        checkbox.addEventListener('change', function(e) {
            if(e.target.checked) layer.addTo(map);
            else map.removeLayer(layer);
        });
    }
};

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

// [17] 통합 검색 시스템
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
let currentFilteredData = [];

searchInput.addEventListener('input', function() {
    const query = this.value.trim().toLowerCase();
    searchResults.innerHTML = '';
    currentFilteredData = []; 
    
    if (!query) {
        searchResults.style.display = 'none';
        return;
    }

    herbData.forEach(h => {
        if (h.name.toLowerCase().includes(query)) {
            const isRare = rareHerbs.includes(h.name);
            const rareLabel = isRare ? ' (희귀)' : '';
            currentFilteredData.push({ 
                name: h.name + rareLabel, 
                category: '약초', 
                x: h.locations[0].x, 
                z: h.locations[0].z, 
                type: 'herb',
                herbName: h.name 
            });
        }
    });

    animals.forEach(ani => {
        if (ani.name.toLowerCase().includes(query)) {
            currentFilteredData.push({ name: ani.name, category: '십이지신', x: ani.mcX, z: ani.mcZ, type: 'animal' });
        }
    });

    mines.forEach(mine => {
        if (mine.n.toString() === query) {
            currentFilteredData.push({ name: `${mine.n}번 광산`, category: '광산', x: mine.x, z: mine.z, type: 'mine' });
        }
    });

    huntingGrounds.forEach(area => {
        if (area.name.toLowerCase().includes(query) || area.monsters.toLowerCase().includes(query)) {
            currentFilteredData.push({ name: area.name, category: `사냥터 (${area.monsters})`, x: area.x, z: area.z, type: 'hunting', areaName: area.name });
        }
    });

    const extras = [
        { data: npcData, cat: 'NPC' },
        { data: redItems, cat: '적환단' },
        { data: statues, cat: '동상/산' },
        { data: mountains, cat: '동상/산' },
        { data: potItems, cat: '탐색' },
        { data: mysteryBoxes, cat: '의문의 상자' }
    ];

    extras.forEach(group => {
        group.data.forEach(item => {
            const name = item.name || (item.file ? "적환단" : group.cat);
            if (name.toLowerCase().includes(query)) {
                currentFilteredData.push({ name: name, category: group.cat, x: item.x, z: item.z, type: 'extra' });
            }
        });
    });

    if (currentFilteredData.length > 0) {
        searchResults.style.display = 'block';
        currentFilteredData.forEach((item) => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = `<span class="category">[${item.category}]</span> ${item.name}`;
            div.onclick = () => selectSearchResult(item);
            searchResults.appendChild(div);
        });
    } else {
        searchResults.style.display = 'none';
    }
});

searchInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && currentFilteredData.length > 0) {
        selectSearchResult(currentFilteredData[0]);
    }
});

function selectSearchResult(item) {
    moveToLocation(item);
    searchResults.style.display = 'none';
    searchInput.value = item.name.replace(' (희귀)', ''); 
    searchInput.blur();
}

function moveToLocation(target) {
    const targetPos = mcToPx(target.x, target.z);

    // [수정] 약초 타입이 아닐 때만 지도를 이동하고 확대합니다.
    if (target.type !== 'herb') {
        map.flyTo(targetPos, 0.5, { animate: true, duration: 1.0 });
    }

    setTimeout(() => {
        let foundMarker = null;

        // 1. 일반 레이어에서 찾기
        const searchGroups = [layers.spawn, layers.animals, layers.stones, layers.npc, layers.red, layers.pot, layers.box, ...Object.values(layers.mines)];
        searchGroups.forEach(group => {
            group.eachLayer(layer => {
                if (layer instanceof L.Marker && layer.getLatLng().equals(targetPos)) foundMarker = layer;
            });
        });

        // 2. 약초 레이어 특수 처리 (이동 없이 레이어만 활성화)
        if (target.type === 'herb') {
            const chk = document.getElementById(`herb-${target.herbName}`);
            if (chk && !chk.checked) {
                chk.checked = true;
                layers.herbs[target.herbName].addTo(map);
                layers.herbMarkers[target.herbName].addTo(map);
            }
            // 약초는 이동하지 않으므로 팝업을 자동으로 열지 않고 위치만 표시되게 하려면 
            // 아래 foundMarker 설정을 주석 처리하거나 그대로 두셔도 됩니다.
            foundMarker = layers.herbMarkers[target.herbName].getLayers()[0];
        }

        // 3. 사냥터 레이어에서 찾기
        if (!foundMarker) {
            layers.huntingMarkers.eachLayer(layer => {
                if (layer instanceof L.Marker && layer.getLatLng().equals(targetPos)) foundMarker = layer;
            });
        }

        // 최종: 마커가 있다면 팝업 표시
        if (foundMarker) {
            if (!map.hasLayer(foundMarker)) foundMarker.addTo(map);
            
            // 약초인 경우 팝업을 열면 지도가 해당 위치로 살짝 튈 수 있으므로 선택사항입니다.
            // 위치만 확인하고 싶다면 target.type !== 'herb' 일 때만 openPopup 하도록 할 수 있습니다.
            foundMarker.openPopup(); 
        } else {
            // 마커를 못 찾은 경우 임시 팝업 (약초는 이동 안 하므로 이 부분도 target.type에 따라 조절 가능)
            if (target.type !== 'herb') {
                L.popup().setLatLng(targetPos)
                    .setContent(`<div style="text-align:center; font-weight:800;">[${target.category}]<br>${target.name}</div>`)
                    .openOn(map);
            }
        }

        if (target.type === 'hunting') {
            const chk = document.getElementById(`hunt-${target.areaName}`);
            if (chk && !chk.checked) {
                chk.checked = true;
                layers.hunting[target.areaName].addTo(map);
                foundMarker.addTo(map);
            }
        }
    }, 1100);
}

// [18] 목록 초기화 시스템
// 1. 사냥터 초기화
document.getElementById('reset-hunt').addEventListener('click', function(e) {
    e.stopPropagation(); // 아코디언이 같이 닫히는 것 방지
    huntingGrounds.forEach(area => {
        const chk = document.getElementById(`hunt-${area.name}`);
        if (chk && chk.checked) {
            chk.checked = false; // 체크박스 해제
            map.removeLayer(layers.hunting[area.name]); // 영역 이미지 삭제
            // hMarker는 layerGroup에 있으므로 직접 찾아서 지우거나 그룹에서 관리해야 함
            // 만약 개별로 관리 중이라면 아래처럼 처리
            map.eachLayer(layer => {
                if (layer instanceof L.Marker && layer.getPopup() && layer.getPopup().getContent().includes(area.name)) {
                    map.removeLayer(layer);
                }
            });
        }
    });
});

// 2. 약초 초기화
document.getElementById('reset-herb').addEventListener('click', function(e) {
    e.stopPropagation();
    herbData.forEach(herb => {
        const chk = document.getElementById(`herb-${herb.name}`);
        if (chk && chk.checked) {
            chk.checked = false;
            map.removeLayer(layers.herbs[herb.name]); // 약초 분포 이미지 삭제
            map.removeLayer(layers.herbMarkers[herb.name]); // 약초 마커 그룹 삭제
        }
    });
    map.closePopup(); // 열려있는 팝업 닫기
});

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
