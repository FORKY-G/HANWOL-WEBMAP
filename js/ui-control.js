// [0] 레이어 그룹 정의 (체크박스 제어용)
const layers = {
    spawn: L.layerGroup().addTo(map),      // 스폰: 초기 ON
    animals: L.layerGroup(), 
    stones: L.layerGroup(),     
    npc: L.layerGroup(),
    red: L.layerGroup(),
    hae: L.layerGroup(),
    qilin: L.layerGroup(),
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

const animalIcon = L.icon({
    iconUrl: 'images/jodiac.png',
    iconSize: [36, 36], 
    iconAnchor: [18, 18],
    popupAnchor: [0, -15]
});

const transparentIcon = L.icon({
    iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==', 
    iconSize: [40, 40], iconAnchor: [20, 20], popupAnchor: [0, -20]
});

const redIcon = L.icon({
    iconUrl: 'images/red.png',
    iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -15]
});

const haetaeIcon = L.icon({
    iconUrl: 'images/haetae.png',
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

// [공통 유틸리티] 모든 정보창을 한 번에 닫는 함수
function closeAllInfoWindows() {
    const windowIds = [
        'skill-window', 
        'dan-window', 
        'blacksmith-window', 
        'prob-window', 
        'main-quest-window'
    ];
    windowIds.forEach(id => {
        const win = document.getElementById(id);
        if (win) win.style.display = 'none';
    });
}

// [2] 십이지신 동선 설정 [최적화 & Glow 적용]
const animalPathPoints = animals.map(ani => mcToPx(ani.mcX, ani.mcZ));
const polyline = L.polyline(animalPathPoints, {
    smoothFactor: 1.5,      // [최적화] 선 단순화
    color: '#FFD700',       // 원래 색상 (골드)
    weight: 3,              // 선 굵기 약간 키움
    opacity: 0,             // 초기 숨김
    dashArray: '5, 8',      // 점선 스타일
    className: 'glow-path-gold' // [Glow 추가] CSS 클래스 바인딩 (gold)
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

// --- [NPC 커스텀 퀘스트 동선 생성 구간] ---

// 1) 조사중인 스님 > 탐령구 동선 생성
const monkData = npcData.find(n => n.name === "조사중인스님");
const guData = npcData.find(n => n.name === "탐령구");
let npcPolyline = null;
if (monkData && guData) {
    const monkPos = mcToPx(monkData.x, monkData.z);
    const guPos = mcToPx(guData.x, guData.z);
    npcPolyline = L.polyline([monkPos, guPos], {
        color: '#e74c3c', weight: 4, opacity: 0, dashArray: '6, 8',
        className: 'glow-path-red' // 빨간색 Glow로 변경
    }).addTo(layers.npc);
}

// 2) 기록서(사도연) > 풍잔객 > 고대의제작대(정적주) > 기록서(사도연) 동선 생성
const recordSadoyen = npcData.find(n => n.name === "기록서(사도연)");
const pungJanGek = npcData.find(n => n.name === "풍잔객");
const jeongJeokJu = npcData.find(n => n.name === "고대의제작대(정적주)");
let sadoyenPolyline = null;
if (recordSadoyen && pungJanGek && jeongJeokJu) {
    const rPos = mcToPx(recordSadoyen.x, recordSadoyen.z);
    const pPos = mcToPx(pungJanGek.x, pungJanGek.z);
    const jPos = mcToPx(jeongJeokJu.x, jeongJeokJu.z);
    sadoyenPolyline = L.polyline([rPos, pPos, jPos, rPos], {
        color: '#e74c3c', weight: 4, opacity: 0, dashArray: '6, 8',
        className: 'glow-path-red' // 빨간색 Glow로 변경
    }).addTo(layers.npc);
}

// 3) 해진 > 해적선 > 백향초재배지 > 해진 동선 생성
const haejinData = npcData.find(n => n.name === "해진");
const pirateShip = npcData.find(n => n.name === "해적선");
const herbFarm = npcData.find(n => n.name === "백향초재배지");
let haejinPolyline = null;
if (haejinData && pirateShip && herbFarm) {
    const hjPos = mcToPx(haejinData.x, haejinData.z);
    const psPos = mcToPx(pirateShip.x, pirateShip.z);
    const hfPos = mcToPx(herbFarm.x, herbFarm.z);
    haejinPolyline = L.polyline([hjPos, psPos, hfPos, hjPos], {
        color: '#e74c3c', weight: 4, opacity: 0, dashArray: '6, 8',
        className: 'glow-path-red' // 빨간색 Glow로 변경
    }).addTo(layers.npc);
}

// 4) 연운객 > 시녀 동선 생성
const yeonunData = npcData.find(n => n.name === "연운객");
const maidData = npcData.find(n => n.name === "시녀");
let yeonunPolyline = null;
if (yeonunData && maidData) {
    const yPos = mcToPx(yeonunData.x, yeonunData.z);
    const mPos = mcToPx(maidData.x, maidData.z);
    yeonunPolyline = L.polyline([yPos, mPos], {
        color: '#e74c3c', weight: 4, opacity: 0, dashArray: '6, 8',
        className: 'glow-path-red'
    }).addTo(layers.npc);
}

// 5) 상단주 > 부숴진마차 > 자운스님 > 상단주 동선 생성
const merchantData = npcData.find(n => n.name === "상단주");
const carriageData = npcData.find(n => n.name === "부숴진마차");
const jawnData = npcData.find(n => n.name === "자운스님");
let merchantPolyline = null;
if (merchantData && carriageData && jawnData) {
    const mPos = mcToPx(merchantData.x, merchantData.z);
    const cPos = mcToPx(carriageData.x, carriageData.z);
    const jPos = mcToPx(jawnData.x, jawnData.z);
    merchantPolyline = L.polyline([mPos, cPos, jPos, mPos], {
        smoothFactor: 1.0,
        color: '#e74c3c', weight: 4, opacity: 0, dashArray: '6, 8',
        className: 'glow-path-red'
    }).addTo(layers.npc);
}

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
    
    const animalIcon = L.icon({
        iconUrl: `images/zodiac${ani.order}.png`, 
        iconSize: [36, 36],       
        iconAnchor: [18, 18],     
        popupAnchor: [0, -15]     
    });

    const marker = L.marker(pos, { icon: animalIcon }).addTo(layers.animals);
    
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
    const specialNumbers = [14, 15, 24, 20, 27, 19, 42];
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
    
    let recordsHtml = '';
    if (item.records && item.records.length > 0) {
        recordsHtml = `
            <div style="margin-top:10px; border-top:1px solid #eee; padding-top:10px;">
                <div style="font-weight:800; font-size:13px; color:#d00; margin-bottom:5px;">[주요 위치 복사]</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                    ${item.records.map(rec => `
                        <button onclick="copyCoords(${rec.x}, ${rec.y}, ${rec.z})" style="padding:4px; font-size:11px; background:#f8f9fa; border:1px solid #ccc; cursor:pointer; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                            ${typeof rec.n === 'number' ? '기록서 ' + rec.n : rec.n}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    let videoHtml = '';
    if (item.n === 10) {
        videoHtml = `
            <div style="margin-top:10px; border-top:1px dashed #ccc; padding-top:10px;">
                <div style="font-weight:800; font-size:13px; color:#007bff; margin-bottom:5px;">[퀘스트 가이드 영상]</div>
                <video width="100%" height="auto" controls playsinline style="border-radius:4px; border:1px solid #ddd; display:block; background:#000;">
                    <source src="images/red10.mp4" type="video/mp4">
                </video>
            </div>
        `;
    }

    const popupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 0;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">적환단</div>
            <div style="background:#333; border-radius:4px; padding: 5px 0; margin-bottom: 10px; cursor:pointer;" onclick="copyCoords(${item.x}, ${item.y}, ${item.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${item.x}, ${item.y}, ${item.z}</div>
                <div style="color:#aaa; font-size:9px;">(클릭하여 좌표 복사)</div>
            </div>
            <div style="margin-top: 5px; border: 1px solid #ccc; padding: 2px; background: #fff;">
                <img src="images/${item.file}" style="width:100%; max-width:180px; height:auto; cursor:pointer; display:block; margin:0 auto;" onclick="openImageModal('images/${item.file}')" title="클릭하여 크게 보기">
            </div>
            ${recordsHtml}
            ${videoHtml}
        </div>
    `;
    marker.bindPopup(popupContent, { 
        autoPan: item.n === 10 ? true : false, 
        keepInView: true, 
        closeButton: false, 
        offset: L.point(0, -5) 
    });
});

// 8-1. [해태단 아이콘 정의] 
const haeIcon = L.icon({
    iconUrl: 'images/haetae.png', 
    iconSize: [36, 36],           
    iconAnchor: [18, 18],         
    popupAnchor: [0, -15]         
});

// 8-2. [해태단 마커 생성]
haeItems.forEach((item) => {
    if (typeof item.n === "string") return; 
    const pos = mcToPx(item.x, item.z);
    const marker = L.marker(pos, { icon: haeIcon }).addTo(layers.hae);
    
    let recordsHtml = '';
    if (item.records && item.records.length > 0) {
        recordsHtml = `
            <div style="margin-top:10px; border-top:1px solid #000; padding-top:10px; text-align:left;">
                <div style="font-weight:800; font-size:13px; color:#d00; margin-bottom:5px;">[위치 복사]</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                    ${item.records.map(rec => `
                        <button onclick="copyCoords(${rec.x}, ${rec.y}, ${rec.z})" style="padding:4px; font-size:11px; background:#f8f9fa; border:1px solid #ccc; cursor:pointer; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#000;">
                            ${typeof rec.n === 'number' ? '기록서 ' + rec.n : rec.n}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    const popupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 0; line-height: 1.4;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px; color:#000;">
                ${item.name}
            </div>
            <div style="background:#333; border-radius:4px; padding: 5px 0; margin-bottom: 5px; cursor:pointer;" onclick="copyCoords(${item.x}, ${item.y}, ${item.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${item.x}, ${item.y}, ${item.z}</div>
                <div style="color:#aaa; font-size:9px;">(클릭하여 좌표 복사)</div>
            </div>
            ${recordsHtml}
        </div>
    `;
    marker.bindPopup(popupContent, { 
        autoPan: (item.records && item.records.length > 0) ? true : false, 
        keepInView: true, 
        closeButton: false, 
        offset: L.point(0, -5) 
    });
});

// [8-3] 기린단 전용 아이콘 정의
const qilinIcon = L.icon({
    iconUrl: 'images/qilin.png',
    iconSize: [36, 36],           
    iconAnchor: [18, 18],         
    popupAnchor: [0, -15]         
});

// [9-2] 기린단 마커 생성
qilinItems.forEach((item) => {
    if (typeof item.n === "string") return; 
    const pos = mcToPx(item.x, item.z);
    const marker = L.marker(pos, { icon: qilinIcon }).addTo(layers.qilin);
    
    let recordsHtml = '';
    if (item.records && item.records.length > 0) {
        recordsHtml = `
            <div style="margin-top:10px; border-top:1px solid #000; padding-top:10px; text-align:left;">
                 <div style="font-weight:800; font-size:13px; color:#d00; margin-bottom:5px;">[위치 복사]</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                    ${item.records.map(rec => `
                        <button onclick="copyCoords(${rec.x}, ${rec.y}, ${rec.z})" style="padding:4px; font-size:11px; background:#f8f9fa; border:1px solid #ccc; cursor:pointer; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#000;">
                            ${typeof rec.n === 'number' ? '기록서 ' + rec.n : rec.n}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    const popupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 0; line-height: 1.4;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px; color:#000;">
                ${item.name}
            </div>
            <div style="background:#333; border-radius:4px; padding: 5px 0; margin-bottom: 5px; cursor:pointer;" onclick="copyCoords(${item.x}, ${item.y}, ${item.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${item.x}, ${item.y}, ${item.z}</div>
                <div style="color:#aaa; font-size:9px;">(클릭하여 좌표 복사)</div>
            </div>
            ${recordsHtml}
        </div>
    `;
    marker.bindPopup(popupContent, { 
        autoPan: (item.records && item.records.length > 0) ? true : false, 
        keepInView: true, 
        closeButton: false, 
        offset: L.point(0, -5) 
    });
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
mysteryBoxes.forEach((box, index) => {
    const pos = mcToPx(box.x, box.z);
    let currentBoxIconUrl = 'images/box.png';
    const targetIndex = mysteryBoxes.findIndex(b => b.x === 7139 && b.y === 157 && b.z === -4734);
    if (targetIndex !== -1 && index >= targetIndex) {
        currentBoxIconUrl = 'images/box1.png';
    }

    const boxIcon = L.icon({
        iconUrl: currentBoxIconUrl, iconSize: [36, 36], iconAnchor: [18, 18], popupAnchor: [0, -15] 
    });
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

    marker.on('mouseover', () => {
        if ((npc.name === "조사중인스님" || npc.name === "탐령구") && npcPolyline) { npcPolyline.setStyle({ opacity: 0.8 }); }
        if ((npc.name === "기록서(사도연)" || npc.name === "풍잔객" || npc.name === "고대의제작대(정적주)") && sadoyenPolyline) { sadoyenPolyline.setStyle({ opacity: 0.8 }); }
        if ((npc.name === "해진" || npc.name === "해적선" || npc.name === "백향초재배지") && haejinPolyline) { haejinPolyline.setStyle({ opacity: 0.8 }); }
        if ((npc.name === "연운객" || npc.name === "시녀") && yeonunPolyline) { yeonunPolyline.setStyle({ opacity: 0.8 }); }
        if ((npc.name === "상단주" || npc.name === "부숴진마차" || npc.name === "자운스님") && merchantPolyline) { merchantPolyline.setStyle({ opacity: 0.8 }); }
    });
    marker.on('mouseout', () => {
        if (npcPolyline) npcPolyline.setStyle({ opacity: 0 });
        if (sadoyenPolyline) sadoyenPolyline.setStyle({ opacity: 0 });
        if (haejinPolyline) haejinPolyline.setStyle({ opacity: 0 });
        if (yeonunPolyline) yeonunPolyline.setStyle({ opacity: 0 });
        if (merchantPolyline) merchantPolyline.setStyle({ opacity: 0 });
    });

    let craftHtml = '';
    if (npc.crafting && npc.crafting.length > 0) {
        craftHtml = `
            <div style="margin-top:10px; border-top:1px solid #ccc; padding-top:8px; text-align:left;">
                <div style="font-weight:800; font-size:12px; color:#333; margin-bottom:5px;">[제작 리스트]</div>
                <div style="display:flex; flex-direction:column; gap:4px;">
                    ${npc.crafting.map((item, idx) => `
                        <div style="display:flex; align-items:center; justify-content:between; background:#f9f9f9; padding:4px; border:1px solid #ddd; border-radius:3px;">
                            <span style="font-size:11px; font-weight:700; color:#444;">${item.name}</span>
                            <button onclick="toggleRecipeDisplay('${npc.name}', ${idx})" style="margin-left:auto; font-size:10px; padding:2px 6px; cursor:pointer; background:#222; color:#fff; border:none; border-radius:2px; font-weight:bold;">재료보기</button>
                        </div>
                        <div id="recipe-display-${npc.name.replace(/\s+/g, '')}" style="display:none; background:#fffbf0; border:1px dashed #e67e22; padding:6px; margin-top:2px; border-radius:3px;"></div>
                    `).join('')}
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
                        <button onclick="copyCoords(${rec.x}, ${rec.y}, ${rec.z})" style="padding:4px; font-size:11px; background:#f8f9fa; border:1px solid #ccc; cursor:pointer; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                            ${typeof rec.n === 'number' ? '기록서 ' + rec.n : rec.n}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    const popupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 0;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">${npc.name}</div>
            <div style="background:#333; border-radius:4px; padding: 5px 0; margin-bottom: 10px; cursor:pointer;" onclick="copyCoords(${npc.x}, ${npc.y}, ${npc.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${npc.x}, ${npc.y}, ${npc.z}</div>
                <div style="color:#aaa; font-size:9px;">(클릭하여 좌표 복사)</div>
            </div>
            ${recordsHtml}
            ${craftHtml}
        </div>
    `;
    marker.bindPopup(popupContent, { autoPan: npc.crafting ? true : false, keepInView: true, closeButton: false, offset: L.point(0, -5) });
});

// [14] 제작 재료 가이드 창 토글 스크립트
window.toggleRecipeDisplay = function(npcName, index) {
    const npc = npcData.find(n => n.name === npcName);
    const displayId = `recipe-display-${npcName.replace(/\s+/g, '')}`;
    const displayDiv = document.getElementById(displayId);

    if (npc && npc.crafting && npc.crafting[index] && displayDiv) {
        const item = npc.crafting[index];
        if (displayDiv.style.display === 'block') {
            displayDiv.style.display = 'none';
        } else {
            displayDiv.style.display = 'block';
            displayDiv.innerHTML = `
               <div style="color:#d00; font-weight:900; margin-bottom:5px; border-bottom:1px solid #ccc; padding-bottom:3px;">★ ${item.name}</div>
               <div style="color:#333; font-size:11px; word-break:keep-all;">${item.materials}</div>
            `;
        }
    }
};

// 🌟 [핵심] 사냥터 마커 생성 루프 시, 검색 전용 마커 추가 처리 구간 🌟
// 만약 다른 js 파일에서 사냥터를 만들고 있다면 이 부분을 복사해 넣으시고, ui-control.js에 사냥터 생성단이 통합되어 있다면 아래 코드가 동작하게 됩니다.
if (typeof huntingGrounds !== 'undefined') {
    huntingGrounds.forEach(area => {
        const targetPos = mcToPx(area.x, area.z);
        // 검색 모듈이 강제로 주소값을 타겟팅하여 팝업을 열 수 있도록 투명 마커를 생성 후 전용 검색 레이어에 밀어 넣습니다.
        const hMarker = L.marker(targetPos, { icon: transparentIcon, zIndexOffset: -500 });
        
        // 사냥터 본래의 커스텀 팝업창 바인딩
        const hPopupContent = `
            <div style="text-align:center; min-width:180px; color:#000;">
                <div style="font-size:16px; font-weight:800; border-bottom:2px solid #000; padding-bottom:5px; margin-bottom:8px;">[사냥터] ${area.name}</div>
                <div style="background:#333; color:#FFD700; border-radius:4px; padding:8px; cursor:pointer; font-size:14px; font-weight:700;" onclick="copyCoords(${area.x}, ${area.y}, ${area.z})">
                    ${area.x}, ${area.y}, ${area.z}
                    <div style="color:#aaa; font-size:10px; font-weight:normal; margin-top:2px;">(클릭하여 좌표 복사)</div>
                </div>
            </div>
        `;
        hMarker.bindPopup(hPopupContent, { autoPan: false, keepInView: true, closeButton: false, offset: L.point(0, -5) });
        
        // 검색용 전용 마커 그룹에 등록하여 moveToLocation이 가로챌 수 있게 만듭니다.
        layers.huntingMarkers.addLayer(hMarker);
    });
}

// [15] 모든 마커 통합 검색 및 이동 제어 시스템 (사냥터 포함 모든 원본 팝업 강제 연동)
function moveToLocation(target) {
    const targetPos = mcToPx(target.x, target.z);
    
    // 약초가 아닐 때만 화면을 해당 좌표로 이동시킵니다.
    if (target.type !== 'herb') {
        map.flyTo(targetPos, -0.5, { animate: true, duration: 0.5 });
    }

    setTimeout(() => {
        let foundMarker = null;

        // 1. 지도에 등록된 모든 레이어 그룹을 통합 배열로 선언 (광산, 사냥터 검색 레이어 포함)
        const allGroups = [
            layers.spawn, 
            layers.animals, 
            layers.stones, 
            layers.npc, 
            layers.red, 
            layers.hae, 
            layers.qilin, 
            layers.pot, 
            layers.box, 
            layers.huntingMarkers,
            layers.mines["녹"], 
            layers.mines["청"], 
            layers.mines["황"], 
            layers.mines["적"]
        ];

        // 2. 모든 레이어 그룹을 순회하며 검색 좌표와 완벽하게 일치하는 원본 마커 찾기
        allGroups.forEach(group => {
            if (group && typeof group.eachLayer === 'function') {
                group.eachLayer(layer => {
                    if (layer instanceof L.Marker && layer.getLatLng().equals(targetPos)) {
                        foundMarker = layer;
                    }
                });
            }
        });

        // 3. 만약 레이어 그룹에서 찾지 못했다면 개별 레이어인 전용 사냥터 이미지 오버레이/마커 재검증
        if (!foundMarker && layers.hunting && target.areaName) {
            const huntGroup = layers.huntingMarkers;
            if (huntGroup && typeof huntGroup.eachLayer === 'function') {
                huntGroup.eachLayer(layer => {
                    if (layer instanceof L.Marker && layer.getLatLng().equals(targetPos)) {
                        foundMarker = layer;
                    }
                });
            }
        }

        // 4. 원본 커스텀 마커를 찾은 경우의 처리
        if (foundMarker) {
            // 사이드바에서 체크박스를 켜지 않아 지도에 없는 상태라면, 강제로 레이어에 추가하여 보이게 만듭니다.
            if (!map.hasLayer(foundMarker)) {
                foundMarker.addTo(map);
            }
            // 원래 지정되어 있던 이쁜 커스텀 팝업창을 그대로 오픈합니다.
            foundMarker.openPopup();
        } else {
            // 5. 예외 상황 발생 시 (데이터 불일치 등으로 마커를 못 찾았을 때만 백업용 기본 팝업 작동)
            L.popup()
            .setLatLng(targetPos)
            .setContent(`
                   <div style="text-align:center; min-width:180px; color:#000;">
                       <div style="font-size:16px; font-weight:800; border-bottom:2px solid #000; padding-bottom:5px; margin-bottom:8px;">[${target.category || target.type}] ${target.name}</div>
                       <div style="background:#333; color:#FFD700; border-radius:4px; padding:8px; cursor:pointer; font-size:14px; font-weight:700;" 
                            onclick="copyCoords(${target.x}, ${target.y}, ${target.z})">
                           ${target.x}, ${target.y}, ${target.z}
                           <div style="color:#aaa; font-size:10px; font-weight:normal; margin-top:2px;">(클릭하여 좌표 복사)</div>
                       </div>
                   </div>
                `)
            .openOn(map);
        }
    }, 600); // flyTo 애니메이션 시간을 고려한 0.6초 대기 후 팝업 출력
}

// [초기화 버튼]
const resetHuntBtn = document.getElementById('reset-hunt');
if (resetHuntBtn) {
    resetHuntBtn.addEventListener('click', () => {
        huntingGrounds.forEach(area => {
            const cb = document.getElementById(`hunt-${area.name}`);
            if (cb && cb.checked) {
                cb.checked = false;
                cb.dispatchEvent(new Event('change'));
            }
        });
    });
}

const resetHerbBtn = document.getElementById('reset-herb');
if (resetHerbBtn) {
    resetHerbBtn.addEventListener('click', () => {
        // Herb 관련 리셋 로직이 필요하다면 여기에 추가
    });
}
