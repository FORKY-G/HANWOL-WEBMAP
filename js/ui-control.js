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
        const toastText = document.getElementById('toast-text');
        
        if (toast) {
            if (toastText) {
                toastText.innerText = "복사 완료!";
            } else {
                toast.innerText = "복사 완료!";
            }
            toast.style.display = 'flex';
            setTimeout(() => { 
                toast.style.display = 'none'; 
            }, 1500);
        }
    }).catch(err => {
        console.error('복사 실패:', err);
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
    const specialNumbers = [14, 15, 24, 20, 27, 19];
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
    if (typeof item.n === "string") return; 
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
    
    // item 내용에 "고급주문서뽑기"가 포함되어 있는지 확인
    const isSpecialBox = box.item && box.item.includes("고급주문서뽑기");
    
    let boxIcon;

    if (isSpecialBox) {
        // [강조용] box.png 뒤에 special-mine(빛나는 사각형) 효과를 넣은 아이콘
        boxIcon = L.divIcon({
            className: 'special-mine', // 광산과 똑같이 빛나는 하얀 사각형 효과
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            html: `<img src="images/box.png" style="width:30px; height:30px; position:absolute; top:3px; left:3px; z-index:10;">`
        });
    } else {
        // [기본] 원래 쓰던 box.png 아이콘
        boxIcon = L.icon({
            iconUrl: 'images/box.png',
            iconSize: [36, 36],
            iconAnchor: [18, 18],
            popupAnchor: [0, -15]
        });
    }

    const marker = L.marker(pos, { icon: boxIcon }).addTo(layers.box);
    
    const itemInfo = box.item ? `<div style="margin-bottom:4px;"><span style="color:#666; font-weight:700;">획득아이템:</span> ${box.item}</div>` : '';
    const entranceInfo = box.entrance ? `<div style="margin-top:4px; padding: 4px; background: #fff1f1; border-radius: 4px; border: 1px dashed #d00;"><span style="color:#d00; font-weight:800;">[상자위치]</span><br><span style="font-size:11px; font-weight:700;">${box.entrance}</span></div>` : '';
    
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
    const isSpecial = (npc.name === "탐령구" || npc.name === "정적주");
    let currentIcon;

    if (npc.file === "transparent") {
        currentIcon = transparentIcon;
    } else {
        currentIcon = L.icon({
            iconUrl: `images/${npc.file}`,
            iconSize: isSpecial ? [32, 32] : [40, 40],
            iconAnchor: isSpecial ? [16, 16] : [20, 20],
            popupAnchor: [0, -20]
        });
    }

    const marker = L.marker(pos, { icon: currentIcon }).addTo(layers.npc);

    let craftHtml = '';
    if (npc.crafting && npc.crafting.length > 0) {
        craftHtml = `
            <div style="margin-top:10px; border-top:2px solid #000; padding-top:10px;">
                <div style="font-weight:900; font-size:13px; color:#000; margin-bottom:8px; text-align:left;">[제작 아이템 목록]</div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; background:#333; padding:4px; border:1px solid #000;">
                    ${npc.crafting.map((item, index) => `
                        <div onclick="showRecipe('${npc.name}', ${index})" 
                             style="aspect-ratio: 1/1; background:#1a1a1a; border:1px solid #555; cursor:pointer; display:flex; align-items:center; justify-content:center;"
                             onmouseover="this.style.border='1px solid #ffd700'" 
                             onmouseout="this.style.border='1px solid #555'">
                            <img src="images/${item.img}" style="width:85%; height:85%; object-fit:contain;" title="${item.name}">
                        </div>
                    `).join('')}
                </div>
                <div id="recipe-display-${npc.name.replace(/\s+/g, '')}" style="margin-top:8px; padding:10px; background:#eee; border:1px solid #000; font-size:12px; font-weight:700; display:none; color:#000; text-align:left; line-height:1.4;">
                </div>
            </div>
        `;
    }
    
    let recordsHtml = '';
    if (npc.records && npc.records.length > 0) {
        recordsHtml = `
            <div style="margin-top:10px; border-top:1px solid #eee; padding-top:10px;">
                <div style="font-weight:800; font-size:13px; color:#d00; margin-bottom:5px;">[주요 위치 복사]</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                    ${npc.records.map(rec => `
                        <button onclick="copyCoords(${rec.x}, ${rec.y}, ${rec.z})" 
                                style="padding:4px; font-size:11px; background:#f8f9fa; border:1px solid #ccc; cursor:pointer; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                            ${typeof rec.n === 'number' ? '기록서 ' + rec.n : rec.n}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    let videoHtml = '';
    if (npc.name === "해무사승려") {
        videoHtml = `
            <div style="margin-top:10px; border-top:1px dashed #ccc; padding-top:10px;">
                <div style="font-weight:800; font-size:13px; color:#007bff; margin-bottom:5px;">[퀘스트 가이드 영상]</div>
                <video width="100%" height="auto" controls playsinline style="border-radius:4px; border:1px solid #ddd; display:block; background:#000;">
                    <source src="images/haemusa.mp4" type="video/mp4">
                </video>
            </div>
        `;
    }

    const popupContent = `
        <div style="text-align:center; min-width:240px; color:#000; padding: 0; line-height: 1.4;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">
                ${npc.name}${npc.lv ? `<span style="font-size:12px; color:#666; font-weight:normal;"> (lv.${npc.lv})</span>` : ''}
            </div>
            
            <div style="background:#333; border-radius:4px; padding: 6px 0; margin-bottom: 10px; cursor:pointer;" onclick="copyCoords(${npc.x}, ${npc.y}, ${npc.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${npc.x}, ${npc.y}, ${npc.z}</div>
                <div style="color:#aaa; font-size:9px;">(위치 복사)</div>
            </div>

            <div style="text-align:left; font-size:12px; color:#333;">
                ${npc.quest ? `<div><span style="color:#d00; font-weight:800;">[퀘스트]</span> ${npc.quest}</div>` : ''}
                ${npc.item ? `<div><span style="color:#007bff; font-weight:800;">[필요재료]</span> ${npc.item}</div>` : ''}
                ${npc.materials ? `<div style="margin-top:8px; padding:8px; background:#f4faff; border:1px solid #cce5ff; border-radius:4px; color:#004085;"><span style="font-weight:800;">[제작재료]</span><br>${npc.materials}</div>` : ''}
                
                ${craftHtml} ${npc.route ? `<div><span style="color:#28a745; font-weight:800;">[동선]</span> ${npc.route}</div>` : ''}
                ${npc.reward ? `<div><span style="color:#f39c12; font-weight:800;">[보상]</span> ${npc.reward}</div>` : ''}
                ${npc.memo ? `<div style="margin-top:6px; border-top:1px dashed #ccc; padding-top:6px; color:#666; font-size:11px;">※ ${npc.memo}</div>` : ''}
                ${recordsHtml}
                ${videoHtml}
            </div>
        </div>
    `;

    marker.bindPopup(popupContent, { autoPan: true, keepInView: true, closeButton: false, offset: L.point(0, -5) });
});

// [14] 사냥터 영역 및 마커 생성
const huntingImageBounds = [[0, 0], [7300, 7300]]; 
const huntingListContainer = document.getElementById('hunt-accordion-content');

huntingGrounds.forEach((area) => {
    const overlay = L.imageOverlay(`images/${area.file}`, huntingImageBounds, { opacity: 0.5, interactive: false });
    layers.hunting[area.name] = overlay;

    const targetPos = mcToPx(area.x, area.z);
    const hMarker = L.marker(targetPos, { icon: transparentIcon, zIndexOffset: -500 }).addTo(layers.huntingMarkers); 

    const label = document.createElement('label');
    label.className = 'control-item';
    label.innerHTML = `<input type="checkbox" id="hunt-${area.name}"><span style="flex:1;">${area.name}</span><span style="font-size:10px; color:#888; font-weight:normal;">Lv.${area.lv}</span>`;
    huntingListContainer.appendChild(label);

    const popupContent = `
        <div style="text-align:center; min-width:220px; color:#000; padding: 5px; line-height: 1.4;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #333; padding-bottom:5px; margin-bottom:8px;">${area.name} (Lv.${area.lv})</div>
            <div style="text-align:left; font-size:12px;">
                <div style="margin-bottom:4px;"><span style="font-weight:800; color:#007bff;">[몬스터]</span> ${area.monsters}</div>
                <div style="margin-bottom:4px;"><span style="font-weight:800; color:#444;">[좌표]</span> ${area.x}, ${area.y}, ${area.z}</div>
                ${area.memo ? `<div style="margin-top:4px; color:#d00; font-weight:700;">${area.memo}</div>` : ''}
            </div>
        </div>
    `;
    hMarker.bindPopup(popupContent, { autoPan: false, keepInView: true });

    document.getElementById(`hunt-${area.name}`).addEventListener('change', function(e) {
        if(e.target.checked) {
            layers.hunting[area.name].addTo(map);
            hMarker.addTo(map);
            map.flyTo(targetPos, -1, { animate: true, duration: 0.4 }); 
            setTimeout(() => { hMarker.openPopup(); }, 450);
        } else {
            map.removeLayer(layers.hunting[area.name]);
            map.removeLayer(hMarker);
        }
    });
});

// [15] 약초 시스템
const herbListContainer = document.getElementById('herb-accordion-content');
layers.herbs = {};
layers.herbMarkers = {};
const rareHerbs = ["홍련업화", "철목영지", "금향과", "월계엽", "빙백설화"];

const sortedHerbData = [...herbData].sort((a, b) => {
    const aRare = rareHerbs.includes(a.name);
    const bRare = rareHerbs.includes(b.name);
    if (aRare && !bRare) return -1;
    if (!aRare && bRare) return 1;
    return a.name.localeCompare(b.name, 'ko');
});

sortedHerbData.forEach((herb) => {
    const isRare = rareHerbs.includes(herb.name);
    const overlay = L.imageOverlay(`images/${herb.file}`, huntingImageBounds, { opacity: 0.6, interactive: false });
    layers.herbs[herb.name] = overlay;

    const markerGroup = L.layerGroup();
    herb.locations.forEach(loc => {
        const pos = mcToPx(loc.x, loc.z);
        const hMarker = L.marker(pos, { icon: transparentIcon });
        const yVal = loc.y !== undefined ? loc.y : 0;
        const popupContent = `
            <div style="text-align:center; min-width:180px; color:#000;">
                <div style="font-size:16px; font-weight:800; border-bottom:2px solid #000; padding-bottom:5px; margin-bottom:8px;">${herb.name}${isRare ? ' (희귀)' : ''}</div>
                <div style="background:#333; color:#FFD700; border-radius:4px; padding:6px; cursor:pointer; font-size:14px; font-weight:700;" onclick="copyCoords(${loc.x}, ${yVal}, ${loc.z})">
                    ${loc.x}, ${yVal}, ${loc.z}
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
    const listIcon = herb.file ? herb.file.replace('hub', 'hub-') : "";
    label.innerHTML = `<input type="checkbox" id="herb-${herb.name}"><img src="images/${listIcon}" style="width:20px; height:20px; margin-right:8px; object-fit:contain;" onerror="this.style.display='none'"><span style="flex:1;">${herb.name}${isRare ? ' (희귀)' : ''}</span>`;
    herbListContainer.appendChild(label);

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

// [16] 체크박스 바인딩 시스템
const bindCheckbox = (id, layer) => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('change', e => {
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

// [17] 검색 시스템
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
let currentFilteredData = [];

searchInput.addEventListener('input', function() {
    const query = this.value.trim().toLowerCase();
    searchResults.innerHTML = '';
    currentFilteredData = []; 

    if (!query) { searchResults.style.display = 'none'; return; }

    // 약초
    sortedHerbData.forEach(h => {
        if (h.name.toLowerCase().includes(query)) currentFilteredData.push({ name: h.name, category: '약초', x: h.locations[0].x, y: (h.locations[0].y || 0), z: h.locations[0].z, type: 'herb', herbName: h.name });
    });
    // 십이지신
    animals.forEach(ani => {
        if (ani.name.toLowerCase().includes(query)) currentFilteredData.push({ name: ani.name, category: '십이지신', x: ani.mcX, y: ani.mcY, z: ani.mcZ, type: 'animal' });
    });
    // 광산
    mines.forEach(mine => {
        const spec = mineResources[mine.c] || "";
        const common = mineResources["공통"] || "";
        if ((mine.n.toString() + spec + common).toLowerCase().includes(query)) currentFilteredData.push({ name: `${mine.n}번 광산 (${spec})`, category: '광산', x: mine.x, y: mine.y, z: mine.z, type: 'mine' });
    });
    // 사냥터
    huntingGrounds.forEach(area => {
        if (area.name.toLowerCase().includes(query) || area.monsters.toLowerCase().includes(query)) currentFilteredData.push({ name: area.name, category: '사냥터', x: area.x, y: area.y, z: area.z, type: 'hunting', areaName: area.name });
    });
    // 기타 (NPC, 적환단, 동상, 탐색, 상자 등)
    const extras = [
        { data: npcData, cat: 'NPC' }, { data: redItems, cat: '적환단' }, { data: statues, cat: '동상/산' }, { data: mountains, cat: '동상/산' }, { data: potItems, cat: '탐색' }, { data: mysteryBoxes, cat: '의문의 상자' }
    ];
    extras.forEach(group => {
        group.data.forEach(item => {
            const name = item.name || (item.n && typeof item.n === "string" ? item.n : "") || (item.file ? "적환단" : group.cat);
            const sName = name.toLowerCase();
            const sQuest = (item.quest || "").toLowerCase();
            const sMat = (item.materials || "").toLowerCase();
            const sItem = (item.item || "").toLowerCase();
            const sTool = (item.tool || "").toLowerCase();
            if (sName.includes(query) || sQuest.includes(query) || sMat.includes(query) || sItem.includes(query) || sTool.includes(query)) {
                let dName = name;
                if (group.cat === '탐색') {
                    if (sItem.includes(query)) dName = `${name} (${item.item})`;
                    else if (sTool.includes(query)) dName = `${name} [${item.tool}]`;
                }
                currentFilteredData.push({ name: dName, category: group.cat, x: item.x, y: (item.y || 0), z: item.z, type: 'extra' });
            }
        });
    });

    if (currentFilteredData.length > 0) {
        searchResults.style.display = 'block';
        currentFilteredData.forEach(item => {
            const div = document.createElement('div');
            div.className = 'search-result-item';
            div.innerHTML = `<span class="category">[${item.category}]</span> ${item.name}`;
            div.onclick = () => { moveToLocation(item); searchResults.style.display = 'none'; searchInput.value = item.name; };
            searchResults.appendChild(div);
        });
    } else searchResults.style.display = 'none';
});

function moveToLocation(target) {
    const targetPos = mcToPx(target.x, target.z);
    
    // 약초가 아닐 때만 부드럽게 이동
    if (target.type !== 'herb') {
        map.flyTo(targetPos, -0.5, { animate: true, duration: 0.5 });
    }

    setTimeout(() => {
        let foundMarker = null;

        // 1. 이미 지도에 있는 마커 찾기 (NPC, 탐색, 상자 등)
        const allGroups = [layers.spawn, layers.animals, layers.stones, layers.npc, layers.red, layers.pot, layers.box, layers.huntingMarkers];
        allGroups.forEach(group => {
            if (group.eachLayer) {
                group.eachLayer(layer => {
                    if (layer instanceof L.Marker && layer.getLatLng().equals(targetPos)) {
                        foundMarker = layer;
                    }
                });
            }
        });

        // 2. 마커가 있으면 그 마커를 열고, 없으면 전용 좌표 복사 팝업을 띄움
        if (foundMarker) {
            if (!map.hasLayer(foundMarker)) foundMarker.addTo(map);
            foundMarker.openPopup();
        } else {
            // 마커를 못 찾았거나 레이어가 꺼져있을 때 뜨는 좌표 복사 팝업
            L.popup()
                .setLatLng(targetPos)
                .setContent(`
                    <div style="text-align:center; min-width:180px; color:#000;">
                        <div style="font-size:16px; font-weight:800; border-bottom:2px solid #000; padding-bottom:5px; margin-bottom:8px;">[${target.category}] ${target.name}</div>
                        <div style="background:#333; color:#FFD700; border-radius:4px; padding:8px; cursor:pointer; font-size:14px; font-weight:700;" 
                             onclick="copyCoords(${target.x}, ${target.y}, ${target.z})">
                            ${target.x}, ${target.y}, ${target.z}
                            <div style="color:#aaa; font-size:10px; font-weight:normal; margin-top:2px;">(클릭하여 좌표 복사)</div>
                        </div>
                    </div>
                `)
                .openOn(map);
        }
    }, 600);
}

// [18] 비급 정보 제어 기능
window.toggleSkillWindow = function() {
    const win = document.getElementById('skill-window');
    if (!win) return;
    if (win.style.display === 'none') {
        win.style.display = 'block';
        renderSkillList();
    } else {
        win.style.display = 'none';
    }
};

window.renderSkillList = function() {
    const container = document.getElementById('skill-list-content');
    if (!container) return;

    container.innerHTML = skillData.map(skill => {
        const imageTag = skill.image 
            ? `<img src="${skill.image}" style="width:100%; border-radius:4px; margin-top:8px; border:1px solid #ddd; display:block;">` 
            : '';

        return `
            <div style="margin-bottom: 15px; border-bottom: 2px solid #eee; padding-bottom: 10px;">
                <div style="font-weight: 800; color: #d00; font-size: 15px; margin-bottom: 5px; display: flex; align-items: center;">
                    <span style="background: #d00; color: #fff; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-right: 6px;">SKILL</span>
                    ${skill.name}
                </div>
                <div style="font-size: 12px; color: #333; font-weight: 700; line-height: 1.5; word-break: keep-all; padding-left: 2px;">
                    ${skill.info}
                </div>
                ${imageTag}
            </div>
        `;
    }).join('');
};

// 버튼 클릭 이벤트 연결
const skillBtn = document.getElementById('skill-btn');
if (skillBtn) {
    skillBtn.addEventListener('click', toggleSkillWindow);
}

// [19] 초기화 기능
document.getElementById('reset-hunt').addEventListener('click', e => {
    e.stopPropagation();
    huntingGrounds.forEach(area => {
        const chk = document.getElementById(`hunt-${area.name}`);
        if (chk && chk.checked) {
            chk.checked = false;
            map.removeLayer(layers.hunting[area.name]);
        }
    });
});

document.getElementById('reset-herb').addEventListener('click', e => {
    e.stopPropagation();
    sortedHerbData.forEach(herb => {
        const chk = document.getElementById(`herb-${herb.name}`);
        if (chk && chk.checked) {
            chk.checked = false;
            map.removeLayer(layers.herbs[herb.name]);
            map.removeLayer(layers.herbMarkers[herb.name]);
        }
    });
    map.closePopup();
});

// [20] 팝업 관리 및 제작 아이템 표시
map.on('popupopen', e => {
    const container = e.popup._container;
    const rect = container.getBoundingClientRect();
    const mapRect = document.getElementById('map').getBoundingClientRect();
    if (rect.top < mapRect.top + 60) container.style.transform += " translateY(" + (rect.height + 40) + "px)";
});

window.showRecipe = function(npcName, index) {
    const npc = npcData.find(n => n.name === npcName);
    const displayId = `recipe-display-${npcName.replace(/\s+/g, '')}`;
    const displayDiv = document.getElementById(displayId);
    
    if (npc && npc.crafting && npc.crafting[index] && displayDiv) {
        const item = npc.crafting[index];
        displayDiv.style.display = 'block';
        displayDiv.innerHTML = `
            <div style="color:#d00; font-weight:900; margin-bottom:5px; border-bottom:1px solid #ccc; padding-bottom:3px;">★ ${item.name}</div>
            <div style="color:#333; font-size:11px; word-break:keep-all;">${item.materials}</div>
        `;
    }
};
