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
// 새로운 창이 추가될 때마다 windowIds 배열에 ID만 추가하면 됩니다.
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

// --- [NPC 커스텀 퀘스트 동선 생성 구간 - 연운객-시녀 색상(#e74c3c) 및 빨간색 Glow로 통일] ---

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
        className: 'glow-path-red' // 기존 유지
    }).addTo(layers.npc);
}

// 5) 상단주 > 부숴진마차 > 자운스님 > 상단주 동선 생성 (빨간색 Glow 통일)
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
    
    // 1. 주요 위치 복사 버튼 세팅 (승려 NPC와 완전 동일 로직)
    let recordsHtml = '';
    if (item.records && item.records.length > 0) {
        recordsHtml = `
            <div style="margin-top:10px; border-top:1px solid #eee; padding-top:10px;">
                <div style="font-weight:800; font-size:13px; color:#d00; margin-bottom:5px;">[주요 위치 복사]</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                    ${item.records.map(rec => `
                        <button onclick="copyCoords(${rec.x}, ${rec.y}, ${rec.z})" 
                                style="padding:4px; font-size:11px; background:#f8f9fa; border:1px solid #ccc; cursor:pointer; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                            ${typeof rec.n === 'number' ? '기록서 ' + rec.n : rec.n}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 2. 가이드 영상 세팅 (10번일 때 red10.mp4 출력)
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

    // 3. 최종 팝업창 바인딩 (이미지 클릭 시 index.html에 추가한 모달 띄우기)
    const popupContent = `
        <div style="text-align:center; min-width:200px; color:#000; padding: 0;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">적환단</div>
            <div style="background:#333; border-radius:4px; padding: 5px 0; margin-bottom: 10px; cursor:pointer;" onclick="copyCoords(${item.x}, ${item.y}, ${item.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${item.x}, ${item.y}, ${item.z}</div>
                <div style="color:#aaa; font-size:9px;">(클릭하여 좌표 복사)</div>
            </div>
            <div style="margin-top: 5px; border: 1px solid #ccc; padding: 2px; background: #fff;">
                <img src="images/${item.file}" 
                     style="width:100%; max-width:180px; height:auto; cursor:pointer; display:block; margin:0 auto;" 
                     onclick="openImageModal('images/${item.file}')"
                     title="클릭하여 크게 보기">
            </div>
            ${recordsHtml}
            ${videoHtml}
        </div>
    `;

    marker.bindPopup(popupContent, { 
        autoPan: item.n === 10 ? true : false, // 10번은 기니까 화면 가림 방지 켬
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
                        <button onclick="copyCoords(${rec.x}, ${rec.y}, ${rec.z})" 
                                style="padding:4px; font-size:11px; background:#f8f9fa; border:1px solid #ccc; cursor:pointer; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#000;">
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
    iconUrl: 'images/qilin.png', // 기린단 이미지 경로 맞춤
    iconSize: [36, 36],           
    iconAnchor: [18, 18],         
    popupAnchor: [0, -15]         
});

// [9-2] 기린단 마커 생성
qilinItems.forEach((item) => {
    if (typeof item.n === "string") return; 
    const pos = mcToPx(item.x, item.z);
    
    const marker = L.marker(pos, { icon: qilinIcon }).addTo(layers.qilin);
    
    // 주요 위치 복사 버튼 세팅
    let recordsHtml = '';
    if (item.records && item.records.length > 0) {
        recordsHtml = `
            <div style="margin-top:10px; border-top:1px solid #000; padding-top:10px; text-align:left;">
                <div style="font-weight:800; font-size:13px; color:#d00; margin-bottom:5px;">[위치 복사]</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                    ${item.records.map(rec => `
                        <button onclick="copyCoords(${rec.x}, ${rec.y}, ${rec.z})" 
                                style="padding:4px; font-size:11px; background:#f8f9fa; border:1px solid #ccc; cursor:pointer; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#000;">
                            ${typeof rec.n === 'number' ? '기록서 ' + rec.n : rec.n}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // 최종 팝업창 바인딩 (해태단과 동일하게 '기린단' 글자 없이 이름만 출력)
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

    // 기본값은 무조건 기존 이미지(box.png)로 설정
    let currentBoxIconUrl = 'images/box.png';

    // "x: 7139, y: 157, z: -4734" 상자가 위치한 배열 인덱스를 기준으로 
    // 해당 상자를 포함한 그 이후의 최신 상자들만 box1.png로 변경
    const targetIndex = mysteryBoxes.findIndex(b => b.x === 7139 && b.y === 157 && b.z === -4734);
    
    if (targetIndex !== -1 && index >= targetIndex) {
        currentBoxIconUrl = 'images/box1.png'; // 최신 상자용 이미지
    }

    // Leaflet 아이콘 객체 생성
    const boxIcon = L.icon({
        iconUrl: currentBoxIconUrl,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -15]
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

    // [마우스 오버 이벤트 바인딩 - 3대 신규 동선 연동 통합 포함]
    marker.on('mouseover', () => {
        if ((npc.name === "조사중인스님" || npc.name === "탐령구") && npcPolyline) {
            npcPolyline.setStyle({ opacity: 0.8 });
        }
        if ((npc.name === "기록서(사도연)" || npc.name === "풍잔객" || npc.name === "고대의제작대(정적주)") && sadoyenPolyline) {
            sadoyenPolyline.setStyle({ opacity: 0.8 });
        }
        if ((npc.name === "해진" || npc.name === "해적선" || npc.name === "백향초재배지") && haejinPolyline) {
            haejinPolyline.setStyle({ opacity: 0.8 });
        }
        if ((npc.name === "연운객" || npc.name === "시녀") && yeonunPolyline) {
            yeonunPolyline.setStyle({ opacity: 0.8 });
        }
        if ((npc.name === "상단주" || npc.name === "부숴진마차" || npc.name === "자운스님") && merchantPolyline) {
            merchantPolyline.setStyle({ opacity: 0.8 });
        }
    });

    marker.on('mouseout', () => {
        if ((npc.name === "조사중인스님" || npc.name === "탐령구") && npcPolyline) {
            npcPolyline.setStyle({ opacity: 0 });
        }
        if ((npc.name === "기록서(사도연)" || npc.name === "풍잔객" || npc.name === "고대의제작대(정적주)") && sadoyenPolyline) {
            sadoyenPolyline.setStyle({ opacity: 0 });
        }
        if ((npc.name === "해진" || npc.name === "해적선" || npc.name === "백향초재배지") && haejinPolyline) {
            haejinPolyline.setStyle({ opacity: 0 });
        }
        if ((npc.name === "연운객" || npc.name === "시녀") && yeonunPolyline) {
            yeonunPolyline.setStyle({ opacity: 0 });
        }
        if ((npc.name === "상단주" || npc.name === "부숴진마차" || npc.name === "자운스님") && merchantPolyline) {
            merchantPolyline.setStyle({ opacity: 0 });
        } 
    });

    // [제작 아이템 목록 - 첫 번째 스타일 반영]
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

    // [주요 위치 복사 버튼 - 첫 번째 스타일 반영]
    let recordsHtml = '';
    if (npc.records && npc.records.length > 0) {
        recordsHtml = `
            <div style="margin-top:10px; border-top:1px solid #eee; padding-top:10px; text-align:left;">
                <div style="font-weight:800; font-size:13px; color:#d00; margin-bottom:5px;">[주요 위치 복사]</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                    ${npc.records.map(rec => `
                        <button onclick="copyCoords(${rec.x}, ${rec.y}, ${rec.z})" 
                                style="padding:4px; font-size:11px; background:#f8f9fa; border:1px solid #ccc; cursor:pointer; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#000;">
                            ${typeof rec.n === 'number' ? '기록서 ' + rec.n : rec.n}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // [동영상 가이드 - 첫 번째 스타일 반영]
    let videoHtml = '';
    if (npc.name === "해무사승려") {
        videoHtml = `
            <div style="margin-top:10px; border-top:1px dashed #ccc; padding-top:10px; text-align:left;">
                <div style="font-weight:800; font-size:13px; color:#007bff; margin-bottom:5px;">[퀘스트 가이드 영상]</div>
                <video width="100%" height="auto" controls playsinline style="border-radius:4px; border:1px solid #ddd; display:block; background:#000;">
                    <source src="images/haemusa.mp4" type="video/mp4">
                </video>
            </div>
        `;
    }

    // ===================================================
    // ✨ 실시간 가독성 데이터 가공 레이어 (디자인 복원 버전)
    // ===================================================
    
    // 1. 다중 퀘스트 리스트 분리 처리 (텍스트 디자인 원본 복원)
    let questListHtml = '';
    if (npc.quest) {
        const cleanQuest = npc.quest.replace(/<br\s*\/?>/gi, ',');
        const quests = cleanQuest.split(',');
        questListHtml = quests
            .map(q => q.trim())
            .filter(q => q.length > 0)
            .map(q => `<div style="margin-bottom:2px;">• ${q}</div>`)
            .join('');
    }

    // 2. 필요 재료 가독성 처리 (회색 박스 빼고 줄바꿈만 원본 디자인으로 복원)
    let itemBoxHtml = '';
    if (npc.item) {
        let items = [];
        if (npc.item.includes('), (')) {
            items = npc.item.split('), (').map((it, idx, arr) => {
                let txt = it.trim();
                if (idx > 0) txt = '(' + txt;
                if (idx < arr.length - 1) txt = txt + ')';
                return txt;
            });
        } else {
            items = npc.item.split(',');
        }

        const formattedItems = items
            .map(it => it.trim())
            .filter(it => it.length > 0)
            .map(it => `<div style="margin-bottom:2px;">${it}</div>`)
            .join('');

        itemBoxHtml = `
            <div style="margin-top:4px;">
                <span style="color:#007bff; font-weight:800;">[필요재료]</span> 
                <div style="margin-top:2px; padding-left:2px;">${formattedItems}</div>
            </div>
        `;
    }

    // 3. 동선(route) 내부에 <br>이 있는 경우 깨지지 않게 보정
    let routeListHtml = '';
    if (npc.route) {
        const routes = npc.route.split('<br>');
        routeListHtml = routes
            .map(r => r.trim())
            .filter(r => r.length > 0)
            .map(r => `<div style="margin-top:2px;">${r}</div>`)
            .join('');
    }

    // [최종 첫 번째 사진 테마 복원 팝업 UI]
    const popupContent = `
        <div style="text-align:center; min-width:240px; color:#000; padding: 0; line-height: 1.4;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">
                ${npc.name}${npc.lv ? `<span style="font-size:12px; color:#666; font-weight:normal;"> (lv.${npc.lv})</span>` : ''}
            </div>
            
            <div style="background:#333; border-radius:4px; padding: 6px 0; margin-bottom: 10px; cursor:pointer;" onclick="copyCoords(${npc.x}, ${npc.y}, ${npc.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${npc.x}, ${npc.y}, ${npc.z}</div>
                <div style="color:#aaa; font-size:9px;">(클릭하여 인게임 좌표 복사)</div>
            </div>
            
            <div style="text-align:left; font-size:12px; color:#333;">
                ${questListHtml ? `
                    <div style="margin-bottom:4px;">
                        <span style="color:#d00; font-weight:800;">[수행 퀘스트]</span>
                        <div style="margin-top:2px; padding-left:2px; color:#000;">${questListHtml}</div>
                    </div>
                ` : ''}
                
                ${itemBoxHtml}
                
                ${npc.materials ? `<div style="margin-top:8px; padding:8px; background:#f4faff; border:1px solid #cce5ff; border-radius:4px; color:#004085;"><span style="font-weight:800;">[제작재료]</span><br>${npc.materials}</div>` : ''}
                
                ${craftHtml} 
                ${routeListHtml ? `<div style="margin-top:4px;"><span style="color:#28a745; font-weight:800;">[동선]</span><div style="margin-top:2px; padding-left:2px; color:#000;">${routeListHtml}</div></div>` : ''}
                ${npc.reward ? `<div style="margin-top:4px;"><span style="color:#f39c12; font-weight:800;">[보상]</span> <span style="color:#000;">${npc.reward}</span></div>` : ''}
                
                ${npc.memo ? `<div style="margin-top:6px; border-top:1px dashed #ccc; padding-top:6px; color:#666; font-size:11px;">※ ${npc.memo}</div>` : ''}
                ${recordsHtml}
                ${videoHtml}
            </div>
        </div>
    `;
    marker.bindPopup(popupContent, { autoPan: true, keepInView: true, closeButton: false, offset: L.point(0, -5) });
});


// --- [히든 퀘스트 NPC 소메뉴 개별 체크박스 -> 마커 정보창 링크 연동 (화면 이동 제거)] ---
const hiddenNpcNames = ["상단주", "도사", "해무사승려", "해진", "심마니"];
const hiddenNpcContainer = document.getElementById('hidden-npc-content');

if (hiddenNpcContainer) {
    hiddenNpcContainer.innerHTML = '';

    const hiddenNpcs = npcData.filter(npc => hiddenNpcNames.includes(npc.name));

    hiddenNpcs.forEach((npc) => {
        const targetPos = mcToPx(npc.x, npc.z);
        let targetMarker = null;
        if (layers && layers.npc) {
            layers.npc.eachLayer(layer => {
                if (layer instanceof L.Marker && layer.getLatLng().equals(targetPos)) {
                    targetMarker = layer;
                }
            });
        }

        const label = document.createElement('label');
        label.className = 'control-item npc-sub-item';
        label.style.cssText = 'padding: 4px 10px; font-size: 12px; color: #b0a59a; display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; transition: background 0.2s; cursor: pointer;';
        
        const checkboxId = `check-hidden-${npc.name.replace(/\s+/g, '')}`;
        
        label.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <input type="checkbox" id="${checkboxId}" style="cursor: pointer;">
                <span style="font-weight: 800; color: #c5a368;">${npc.name}</span>
            </div>
            <span style="font-size: 10px; color: #888;">${npc.lv ? 'Lv.' + npc.lv : '히든'}</span>
        `;

        label.onmouseover = () => { label.style.background = '#2a211a'; };
        label.onmouseout = () => { label.style.background = 'none'; };

        hiddenNpcContainer.appendChild(label);

        const cb = document.getElementById(checkboxId);
        if (cb) {
            cb.addEventListener('change', function(e) {
                if (e.target.checked) {
                    const mainNpcCb = document.getElementById('check-npc');
                    if (mainNpcCb && !mainNpcCb.checked) {
                        mainNpcCb.checked = true;
                        layers.npc.addTo(map);
                    }
                    if (targetMarker) {
                        targetMarker.openPopup();
                    }
                } else {
                    if (targetMarker) {
                        targetMarker.closePopup();
                    }
                }
            });
        }
    });

    const mainNpcCb = document.getElementById('check-npc');
    if (mainNpcCb) {
        mainNpcCb.addEventListener('change', function(e) {
            if (!e.target.checked) {
                hiddenNpcs.forEach(npc => {
                    const cid = `check-hidden-${npc.name.replace(/\s+/g, '')}`;
                    const subCb = document.getElementById(cid);
                    if (subCb) subCb.checked = false;
                });
            }
        });
    }
}

// [14] 사냥터 영역 및 마커 생성 (혈교도, 화검문, 흑운회 개별 팝업 좌표 복사 기능 구현)
const huntingImageBounds = [[0, 0], [7300, 7300]]; 
const huntingListContainer = document.getElementById('hunt-accordion-content');

huntingGrounds.forEach((area) => {
    const overlay = L.imageOverlay(`images/${area.file}`, huntingImageBounds, { opacity: 0.5, interactive: false });
    layers.hunting[area.name] = overlay;

    const targetPos = mcToPx(area.x, area.z);
    const hMarker = L.marker(targetPos, { icon: transparentIcon, zIndexOffset: -500 });

    const label = document.createElement('label');
    label.className = 'control-item';
    label.innerHTML = `<input type="checkbox" id="hunt-${area.name}"><span style="flex:1;">${area.name}</span><span style="font-size:10px; color:#888; font-weight:normal;">Lv.${area.lv}</span>`;
    huntingListContainer.appendChild(label);

    // ★ 멸문 사냥터 이미지 클릭 시 모달창이 뜨도록 수정
    let photoHtml = '';
    if (area.name === "멸문") {
        photoHtml = `
            <div style="margin-top: 10px; border: 1px solid #ccc; padding: 2px; background: #fff;">
                <img src="images/snake.jpg" 
                     style="width:100%; max-width:200px; height:auto; display:block; margin:0 auto; cursor:pointer;" 
                     onclick="openImageModal('images/snake.jpg')"
                     title="클릭하여 크게 보기">
            </div>
        `;
    }

    let recordsHtml = '';
    if (area.records && area.records.length > 0) {
        recordsHtml = `
            <div style="margin-top:10px; border-top:1px solid #eee; padding-top:10px;">
                <div style="font-weight:800; font-size:13px; color:#d00; margin-bottom:5px;">[위치 복사]</div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px;">
                    ${area.records.map(rec => `
                        <button onclick="copyCoords(${rec.x}, ${rec.y}, ${rec.z})" 
                                style="padding:4px; font-size:11px; background:#f8f9fa; border:1px solid #ccc; cursor:pointer; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                            ${rec.n}
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    // [특정 3대 사냥터 분기 처리 조립 완료]
    const targetGrounds = ["혈교도", "화검문", "흑운회", "녹림", "해적섬"];
    let coordinateLayoutHtml = '';

    if (targetGrounds.includes(area.name)) {
        coordinateLayoutHtml = `
            <div style="margin-bottom:4px; cursor:pointer;" onclick="copyCoords(${area.x}, ${area.y}, ${area.z})" title="클릭하면 인게임 좌표가 복사됩니다.">
                <span style="font-weight:800; color:#e03131;">[좌표 복사]</span> 
                <span style="text-decoration:underline; color:#000; font-weight:700;">${area.x}, ${area.y}, ${area.z} 📋</span>
            </div>
        `;
    } else {
        coordinateLayoutHtml = `<div style="margin-bottom:4px;"><span style="font-weight:800; color:#444;">[좌표]</span> ${area.x}, ${area.y}, ${area.z}</div>`;
    }

    const popupContent = `
        <div style="text-align:center; min-width:220px; color:#000; padding: 5px; line-height: 1.4;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #333; padding-bottom:5px; margin-bottom:8px;">${area.name} (Lv.${area.lv})</div>
            <div style="text-align:left; font-size:12px;">
                <div style="margin-bottom:4px;"><span style="font-weight:800; color:#007bff;">[몬스터]</span> ${area.monsters}</div>
                ${coordinateLayoutHtml}
                ${area.memo ? `<div style="margin-top:4px; color:#d00; font-weight:700; word-break:keep-all;">${area.memo}</div>` : ''}
                ${photoHtml}
                ${recordsHtml}
            </div>
        </div>
    `;

    hMarker.bindPopup(popupContent, { autoPan: false, keepInView: true });

    document.getElementById(`hunt-${area.name}`).addEventListener('change', function(e) {
        if(e.target.checked) {
            layers.hunting[area.name].addTo(map);
            hMarker.addTo(map);
            hMarker.openPopup(); 
        } else {
            map.removeLayer(layers.hunting[area.name]);
            map.removeLayer(hMarker);
        }
    });
});

// 사냥터 이름
const huntingNamesOverlay = L.imageOverlay('mapname.png', huntingImageBounds, {
    opacity: 1.0,
    zIndex: 500
});

// 2. HTML 내 사냥터이름 체크박스 Element 가져오기
const checkHuntingNames = document.getElementById('check-hunting-names');

// 3. 페이지가 처음 로드되었을 때 체크박스가 켜져 있다면 맵에 이미지 바로 표시
if (checkHuntingNames && checkHuntingNames.checked) {
    huntingNamesOverlay.addTo(map);
}

// 4. 체크박스를 켜고 끌 때 이미지가 토글되도록 이벤트 리스너 등록
if (checkHuntingNames) {
    checkHuntingNames.addEventListener('change', function() {
        if (this.checked) {
            huntingNamesOverlay.addTo(map);      // 체크하면 이미지 띄우기
        } else {
            map.removeLayer(huntingNamesOverlay); // 체크 해제하면 이미지 지우기
        }
    });
}

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
bindCheckbox('check-haetae', layers.hae);
bindCheckbox('check-qilin', layers.qilin);
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

    sortedHerbData.forEach(h => {
        if (h.name.toLowerCase().includes(query)) currentFilteredData.push({ name: h.name, category: '약초', x: h.locations[0].x, y: (h.locations[0].y || 0), z: h.locations[0].z, type: 'herb', herbName: h.name });
    });
    animals.forEach(ani => {
        if (ani.name.toLowerCase().includes(query)) currentFilteredData.push({ name: ani.name, category: '십이지신', x: ani.mcX, y: ani.mcY, z: ani.mcZ, type: 'animal' });
    });
    mines.forEach(mine => {
        const spec = mineResources[mine.c] || "";
        const common = mineResources["공통"] || "";
        if ((mine.n.toString() + spec + common).toLowerCase().includes(query)) currentFilteredData.push({ name: `${mine.n}번 광산 (${spec})`, category: '광산', x: mine.x, y: mine.y, z: mine.z, type: 'mine' });
    });
    huntingGrounds.forEach(area => {
        if (area.name.toLowerCase().includes(query) || area.monsters.toLowerCase().includes(query)) currentFilteredData.push({ name: area.name, category: '사냥터', x: area.x, y: area.y, z: area.z, type: 'hunting', areaName: area.name });
    });
    const extras = [
        { data: npcData, cat: 'NPC' }, { data: redItems, cat: '적환단' }, { data: haeItems, cat: '해태단' }, { data: qilinItems, cat: '기린단' }, { data: statues, cat: '동상/산' }, { data: mountains, cat: '동상/산' }, { data: potItems, cat: '탐색' }, { data: mysteryBoxes, cat: '의문의 상자' }
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
    if (target.type !== 'herb') {
        map.flyTo(targetPos, -0.5, { animate: true, duration: 0.5 });
    }

    setTimeout(() => {
        let foundMarker = null;
        const allGroups = [layers.spawn, layers.animals, layers.stones, layers.npc, layers.red, layers.hae, layers.qilin, layers.pot, layers.box, layers.huntingMarkers];
        allGroups.forEach(group => {
            if (group.eachLayer) {
                group.eachLayer(layer => {
                    if (layer instanceof L.Marker && layer.getLatLng().equals(targetPos)) {
                        foundMarker = layer;
                    }
                });
            }
        });

        if (foundMarker) {
            if (!map.hasLayer(foundMarker)) foundMarker.addTo(map);
            foundMarker.openPopup();
        } else {
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

// [메인 퀘스트 정보창 제어]
window.toggleMainQuestWindow = function() {
    const win = document.getElementById('main-quest-window');
    if (!win) return;

    if (win.style.display === 'none' || win.style.display === '') {
        closeAllInfoWindows();
        win.style.display = 'block';
        renderMainQuestData(); 
    } else {
        win.style.display = 'none';
    }
};

function renderMainQuestData() {
    const container = document.getElementById('main-quest-list-content');
    if (!container) return;

    container.innerHTML = `
        <div style="text-align: center; padding: 5px 0;">
            <div style="font-size: 13px; color: #c5a368; font-weight: 800; margin-bottom: 10px; text-align: left; padding-left: 5px;">
                ⚓ 배 낚시 가이드
            </div>
            <div style="border: 1px solid #4a3d33; background: #15110e; padding: 4px; border-radius: 4px; box-shadow: inset 0 0 10px rgba(0,0,0,0.8);">
                <img src="images/fishing.png" 
                     style="width: 100%; height: auto; display: block; cursor: zoom-in;" 
                     title="클릭하면 크게 보기"
                     onclick="window.open('images/fishing.png', '_blank')"
                     onerror="this.style.display='none'; this.parentElement.innerHTML='<div style=\'padding:20px; color:#6d5a4a; font-size:12px;\'>낚시 이미지를 찾을 수 없습니다. (images/fishing.png)</div>';">
            </div>
            <div style="font-size: 11px; color: #8c837a; margin-top: 8px; text-align: left; padding-left: 5px; line-height: 1.4;">
                ※ 이미지를 클릭하면 원본 크기로 새 창에서 확인할 수 있습니다.
            </div>
        </div>
    `;
}

// [18] 비급 정보 제어 기능
window.toggleSkillWindow = function() {
    const win = document.getElementById('skill-window');
    if (!win) return;

    if (win.style.display === 'none' || win.style.display === '') {
        closeAllInfoWindows();
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
        // 이미지 태그에 onclick 이벤트와 cursor 스타일 추가
        const imageTag = skill.image ? 
            `<img src="${skill.image}" 
                  onclick="openImageModal('${skill.image}')" 
                  style="width:100%; border-radius:4px; margin-top:8px; border:1px solid #5e4b3c; display:block; cursor:pointer;"
                  title="클릭하여 크게 보기">` : '';
        
        return `
            <div style="margin-bottom: 20px; border-bottom: 1px solid #3d3129; padding-bottom: 15px;">
                <div style="font-weight: 900; color: #c5a368; font-size: 15px; margin-bottom: 8px; display: flex; align-items: center;">
                    <span style="background: #a68b5b; color: #1a1512; padding: 2px 6px; border-radius: 3px; font-size: 10px; margin-right: 8px; font-weight:900;">SKILL</span>
                    ${skill.name}
                </div>
                <div style="font-size: 12px; color: #b0a59a; font-weight: 700; line-height: 1.6; word-break: keep-all; padding-left: 2px;">
                    ${skill.info}
                </div>
                ${imageTag}
            </div>
        `;
    }).join('');
};

// 모달 열기 함수
window.openImageModal = function(src) {
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-img');
    if (modal && modalImg) {
        modalImg.src = src;
        modal.style.display = 'flex'; // flex로 설정해야 중앙 정렬됨
    }
};

// 모달 닫기 이벤트 (검은 배경 클릭 시 닫힘)
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('image-modal');
    if (modal) {
        modal.onclick = function() {
            modal.style.display = 'none';
        };
    }
});

// [18-2] 영단 정보 제어 기능
window.toggleDanWindow = function() {
    const win = document.getElementById('dan-window');
    if (!win) return;

    if (win.style.display === 'none' || win.style.display === '') {
        closeAllInfoWindows();
        win.style.display = 'block';
        renderDanList();
    } else {
        win.style.display = 'none';
    }
};

window.renderDanList = function() {
    const container = document.getElementById('dan-list-content');
    if (!container || !danData) return;

    container.innerHTML = danData.map(dan => {
        return `
            <div style="margin-bottom: 20px; border-bottom: 1px solid #3d3129; padding-bottom: 15px; display: flex; align-items: center;">
                <div style="width: 50px; height: 50px; background: #1a1512; border: 2px solid #c5a368; border-radius: 4px; display: flex; align-items: center; justify-content: center; margin-right: 12px; flex-shrink: 0;">
                    <img src="images/${dan.file}" style="width: 80%; height: 80%; object-fit: contain;" onerror="this.src='images/dan9.png'">
                </div>
                <div style="flex: 1;">
                    <div style="font-weight: 900; color: #c5a368; font-size: 15px; margin-bottom: 6px;">${dan.name}</div>
                    <div style="font-size: 12px; color: #b0a59a; font-weight: 700; line-height: 1.5; word-break: keep-all;">
                        <span style="color: #8c837a;">[효과]</span> ${dan.info}<br>
                        <span style="color: #8c837a;">[획득]</span> ${dan.source}
                    </div>
                </div>
            </div>
        `;
    }).join('');
};

// [18-3] 확률 정보 정보창 제어 기능
window.toggleProbWindow = function() {
    const win = document.getElementById('prob-window');
    if (!win) return;

    if (win.style.display === 'none' || win.style.display === '') {
        closeAllInfoWindows();
        win.style.display = 'block';
        renderProbList();
    } else {
        win.style.display = 'none';
    }
};

function renderProbList() {
    const container = document.getElementById('prob-list-content');
    if (!container) return;

    const categories = Object.keys(probabilityImageData);
    container.innerHTML = categories.map(cat => `
        <div onclick="showProbImageDetail('${cat}')" 
             style="margin-bottom: 10px; background: #2a241f; border: 1px solid #4a3d33; padding: 15px; border-radius: 4px; cursor: pointer; transition: 0.2s;">
            <div style="font-weight: 900; color: #d4af37; font-size: 14px; display: flex; justify-content: space-between; align-items: center;">
                ${cat}
                <span style="font-size: 10px; color: #6d5a4a;">▶</span>
            </div>
        </div>
    `).join('');
}

window.showProbImageDetail = function(cat) {
    const container = document.getElementById('prob-list-content');
    const imageName = probabilityImageData[cat];

    container.innerHTML = `
        <div style="margin-bottom: 15px;">
            <button onclick="renderProbList()" style="background: #4a3d33; color: #eee7c5; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; font-weight: 800; font-size: 11px; margin-bottom: 12px;">
                ◀ 목록으로 돌아가기
            </button>
            <div style="font-weight: 900; color: #d4af37; font-size: 15px; margin-bottom: 10px; border-bottom: 1px solid #3d3129; padding-bottom: 5px;">
                [ ${cat} ]
            </div>
            <img src="images/${imageName}" 
                 style="width: 100%; border: 1px solid #4a3d33; box-shadow: 0 0 10px rgba(0,0,0,0.5);"
                 onerror="this.src='images/hanwol-icon.png'; this.style.opacity='0.3';">
        </div>
    `;
    document.getElementById('prob-window').scrollTop = 0;
};

// [19] 대장장이 정보창 토글
window.toggleBlacksmithWindow = function() {
    const win = document.getElementById('blacksmith-window');
    if (!win) return;

    if (win.style.display === 'none' || win.style.display === '') {
        closeAllInfoWindows();
        win.style.display = 'block';
        renderBlacksmithData();
    } else {
        win.style.display = 'none';
    }
};

// [20] 부위별 상세 정보 렌더링
function showPartDetail(itemName, itemData, parts, parentGrid, isAutoOpen) {
    const partArea = parentGrid.nextElementSibling;
    if (!partArea) return;

    partArea.innerHTML = '';
    partArea.style.cssText = 'margin-top:10px; padding:10px; position: relative;';

    const fixedSpecBox = document.createElement('div');
    fixedSpecBox.style.cssText = `
        display: none; font-size: 12px; background: #15110e; padding: 12px; 
        border: 2px solid #5e4b3c; margin-top: 10px; line-height: 1.6;
        box-shadow: 4px 4px 10px rgba(0,0,0,0.5); width: calc(100% - 20px); 
        box-sizing: border-box; border-radius: 4px;
    `;

    const partGrid = document.createElement('div');
    partGrid.style.cssText = `
        display: ${isAutoOpen ? 'none' : 'grid'}; 
        grid-template-columns: repeat(4, 1fr); gap: 8px;
    `;

    parts.forEach(part => {
        const partSpecificData = (parts[0] === "무기" || parts[0] === "스텟") ? itemData : itemData[part];
        const partContainer = document.createElement('div');
        partContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center; cursor: pointer;';

        const partIcon = document.createElement('div');
        partIcon.className = 'game-item-box'; 

        let imgName = (partSpecificData && partSpecificData.file) ? partSpecificData.file : `${part}.png`;

        partIcon.innerHTML = `
            <img src="images/${imgName}" onerror="this.style.display='none'" style="width:85%; height:85%; object-fit:contain; position:relative; z-index:2;">
            <div style="position:absolute; color:#444; font-size:9px; z-index:1;">${part}</div>
        `;

        const partName = document.createElement('div');
        partName.className = 'game-item-name';
        partName.innerText = part;

        partContainer.appendChild(partIcon);
        partContainer.appendChild(partName);

        const openSpec = () => {
            if (partSpecificData) {
                fixedSpecBox.innerHTML = `
                    <div style="margin-bottom:8px;">
                        <div style="color:#d4af37; font-weight:900; font-size:13px;">[스텟]</div>
                        <div style="color:#eee7c5; font-weight:800; padding-left:4px; margin-top:2px; white-space:pre-wrap;">${partSpecificData.스텟}</div>
                    </div>
                    ${partSpecificData.일반 ? `
                        <div style="border-top:1px solid #3d3129; padding-top:6px;">
                            <div style="color:#8c837a; font-weight:900; font-size:11px;">[일반]</div>
                            <div style="color:#b0a59a; padding-left:4px; margin-top:2px; font-size:11px;">${partSpecificData.일반}</div>
                        </div>
                    ` : ''}
                `;
                fixedSpecBox.style.display = 'block';

                if(!isAutoOpen) {
                    Array.from(partGrid.children).forEach(child => child.firstChild.style.borderColor = '#000');
                    partIcon.style.borderColor = '#b8860b';
                }
            }
        };

        partContainer.onclick = (e) => { e.stopPropagation(); openSpec(); };
        partGrid.appendChild(partContainer);
        if (isAutoOpen) openSpec();
    });

    partArea.appendChild(partGrid);
    partArea.appendChild(fixedSpecBox);
}

// [21] 대장장이 레벨 선택
function renderBlacksmithData() {
    const container = document.getElementById('blacksmith-list-content');
    if (!container) return;
    container.innerHTML = ''; 

    const gridWrapper = document.createElement('div');
    gridWrapper.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px;';

    for (const level in blacksmithData) {
        const levelBtn = document.createElement('div');
        levelBtn.className = 'level-btn-style'; 
        levelBtn.innerText = level;

        levelBtn.onclick = function() {
            Array.from(gridWrapper.children).forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.pick-container').forEach(el => el.style.background = 'none');
            this.classList.add('active');
            showLevelDetail(level);
        };
        gridWrapper.appendChild(levelBtn);
    }
    container.appendChild(gridWrapper);

    const pickHeader = document.createElement('div');
    pickHeader.style.cssText = `
        font-weight:900; background:#2a211a; color:#d4af37; padding:10px; 
        margin-top:10px; border-left:4px solid #b8860b; font-size:13px; 
        cursor:pointer; display:flex; justify-content:space-between; align-items:center;
    `;
    pickHeader.innerHTML = `<span>⛏️ 곡괭이 제작</span> <span id="pick-arrow">▼</span>`;
    container.appendChild(pickHeader);

    const pickGrid = document.createElement('div');
    pickGrid.id = 'pick-grid-content';
    pickGrid.style.cssText = 'display: none; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-top: 15px; padding: 0 5px;';

    pickHeader.onclick = function() {
        const isHidden = pickGrid.style.display === 'none';
        pickGrid.style.display = isHidden ? 'grid' : 'none';
        document.getElementById('pick-arrow').innerText = isHidden ? '▲' : '▼';
    };

    pickaxeData.forEach(pick => {
        const pickContainer = document.createElement('div');
        pickContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center; cursor: pointer; padding: 5px; border-radius: 4px; transition: background 0.2s;';
        pickContainer.className = 'pick-container';

        const pickBox = document.createElement('div');
        pickBox.className = 'game-item-box';
        pickBox.style.cssText = 'width:48px; height:48px; background: radial-gradient(circle, #5e4b3c 0%, #1a1512 100%); border:2px solid #000; display:flex; align-items:center; justify-content:center; position:relative; box-shadow:inset 0 0 8px rgba(0,0,0,0.8);';
        pickBox.innerHTML = `<img src="images/${pick.file}" style="width:85%; height:85%; object-fit:contain; position:relative; z-index:2;">`;

        const pickName = document.createElement('div');
        pickName.className = 'game-item-name';
        pickName.style.cssText = 'margin-top:6px; font-size:10px; font-weight:900; color:#ffffff; text-shadow:-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; text-align:center; word-break:keep-all; width:52px;';
        pickName.innerText = pick.name.replace('곡괭이', '');

        pickContainer.appendChild(pickBox);
        pickContainer.appendChild(pickName);

        pickContainer.onclick = function(e) {
            e.stopPropagation();
            Array.from(gridWrapper.children).forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.game-item-box').forEach(el => el.classList.remove('selected'));
            document.querySelectorAll('.pick-container').forEach(el => el.style.background = 'none');
            
            pickBox.classList.add('selected');
            pickContainer.style.background = 'rgba(184, 134, 11, 0.2)';
            showPickaxeDetail(pick);
        };
        pickGrid.appendChild(pickContainer);
    });

    container.appendChild(pickGrid);
    const detailContainer = document.createElement('div');
    detailContainer.id = 'blacksmith-detail-area';
    container.appendChild(detailContainer);
}

function showPickaxeDetail(pick) {
    const detailArea = document.getElementById('blacksmith-detail-area');
    if (!detailArea) return;
    detailArea.innerHTML = `
        <div style="margin-top:20px; padding:12px; background:#15110e; border:2px solid #5e4b3c; border-radius:4px; box-shadow:4px 4px 10px rgba(0,0,0,0.5);">
            <div style="color:#d4af37; font-weight:900; font-size:14px; margin-bottom:10px; border-bottom:1px solid #3d3129; padding-bottom:5px;">
              ${pick.name} 제작 정보
            </div>
            <div style="margin-bottom:10px;">
                <div style="color:#c5a368; font-weight:900; font-size:12px;">[필요 가공템]</div>
                <div style="color:#eee7c5; font-size:11px; padding-left:4px; margin-top:2px;">${pick.materials}</div>
            </div>
            <div style="margin-bottom:10px;">
                <div style="color:#8c837a; font-weight:900; font-size:12px;">[소요 재료]</div>
                <div style="color:#b0a59a; font-size:11px; padding-left:4px; margin-top:2px; word-break:keep-all;">${pick.rawMaterials}</div>
            </div>
            <div style="margin-top:10px; border-top:1px solid #3d3129; padding-top:10px; text-align:center;">
                <img src="images/${pick.craftFile}" style="max-width:100%; border:1px solid #4a3d33; border-radius:2px;" onerror="this.style.display='none'">
            </div>
        </div>
    `;
}

// [22] 아이템 상세 레벨별 선택
function showLevelDetail(level) {
    const detailArea = document.getElementById('blacksmith-detail-area');
    if (!detailArea) return;
    detailArea.innerHTML = '';
    const data = blacksmithData[level];

    if (level === "장신구") {
        renderAccessory(level, data, detailArea);
        return;
    }

    for (const category in data) {
        const catData = data[category];
        const catTitle = document.createElement('div');
        catTitle.style.cssText = 'font-weight:900; background:#2a211a; color:#d4af37; padding:8px; margin-top:20px; border-left:4px solid #b8860b; font-size:13px;';
        catTitle.innerText = `[${category}]`;
        detailArea.appendChild(catTitle);

        if (catData.materials) {
            const matInfo = document.createElement('div');
            matInfo.style.cssText = 'font-size:11px; color:#eee7c5; margin:8px 0; font-weight:700; background:#251e19; padding:10px; border:1px solid #4a3d33; border-radius:4px; line-height:1.4;';
            matInfo.innerHTML = `<div style="color:#d4af37; margin-bottom:2px;">필요 재료: ${catData.materials}</div><div style="color:#8c837a;">주문서 횟수: ${catData.scrollCount}회</div>`;
            detailArea.appendChild(matInfo);
        }

        const itemGrid = document.createElement('div');
        itemGrid.style.cssText = 'display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin-top: 15px; padding: 0 5px;';

        for (const itemName in catData.items) {
            const itemData = catData.items[itemName];
            const itemContainer = document.createElement('div');
            itemContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center; cursor: pointer; width: 100%;';

            if (category === "무기") {
                const itemBox = document.createElement('div');
                itemBox.className = 'game-item-box'; 
                itemBox.style.cssText = 'width:48px; height:48px; background: radial-gradient(circle, #5e4b3c 0%, #1a1512 100%); border:2px solid #000; display:flex; align-items:center; justify-content:center; position:relative; box-shadow:inset 0 0 8px rgba(0,0,0,0.8);';

                let weaponImg = itemData.file ? itemData.file : `${itemName}.png`;
                itemBox.innerHTML = `
                    <img src="images/${weaponImg}" onerror="this.style.display='none'" style="width:85%; height:85%; object-fit:contain; position:relative; z-index:2;">
                    <div style="position:absolute; color:#444; font-size:8px; z-index:1;">PNG</div>
                `;

                const nameLabel = document.createElement('div');
                nameLabel.className = 'game-item-name';
                nameLabel.style.cssText = 'margin-top:6px; font-size:10px; font-weight:900; color:#ffffff; text-shadow:-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; text-align:center; word-break:keep-all; width:52px;';
                nameLabel.innerText = itemName;

                itemContainer.appendChild(itemBox);
                itemContainer.appendChild(nameLabel);

            } else {
                const itemBtn = document.createElement('div');
                itemBtn.className = 'level-btn-style'; 
                itemBtn.style.cssText = 'padding: 10px 2px; font-size: 11px; width: 100%; min-height: 35px; display: flex; align-items: center; justify-content: center; word-break: keep-all; box-sizing: border-box;';
                itemBtn.innerText = itemName;
                itemContainer.appendChild(itemBtn);
            }

            itemContainer.onclick = function() {
                document.querySelectorAll('.game-item-box, .level-btn-style').forEach(el => {
                    el.classList.remove('selected', 'active');
                });
                const targetEl = itemContainer.firstChild;
                targetEl.classList.add(category === "무기" ? 'selected' : 'active');

                const parts = (category === "방어구") ? ["투구", "갑옷", "허리띠", "신발"] : ["무기"];
                showPartDetail(itemName, catData.items[itemName], parts, itemGrid, (parts.length === 1));
            };
            itemGrid.appendChild(itemContainer);
        }
        detailArea.appendChild(itemGrid);
        const infoArea = document.createElement('div');
        infoArea.className = 'part-detail-area-container';
        detailArea.appendChild(infoArea);
    }
}

// [23] 장신구 큰 카테고리
function renderAccessory(level, catData, detailArea) {
    const typeGrid = document.createElement('div');
    typeGrid.style.cssText = 'display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 15px;';

    for (const type in catData) {
        const typeBtn = document.createElement('div');
        typeBtn.className = 'level-btn-style'; 
        typeBtn.innerText = type;
        typeBtn.onclick = function() {
            Array.from(typeGrid.children).forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            renderAccessoryLevels(type, catData[type], accessoryMainArea);
        };
        typeGrid.appendChild(typeBtn);
    }
    detailArea.appendChild(typeGrid);
    const accessoryMainArea = document.createElement('div');
    detailArea.appendChild(accessoryMainArea);
}

// [24] 장신구 레벨 선택
function renderAccessoryLevels(typeName, levelsData, targetArea) {
    targetArea.innerHTML = ''; 
    const lvGrid = document.createElement('div');
    lvGrid.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: 15px;';

    for (const lvKey in levelsData) {
        const lvBtn = document.createElement('div');
        lvBtn.className = 'level-btn-style';
        lvBtn.style.padding = '12px 5px';
        lvBtn.innerText = lvKey;
        lvBtn.onclick = function() {
            Array.from(lvGrid.children).forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            renderAccessoryItems(lvKey, levelsData[lvKey], itemShowArea);
        };
        lvGrid.appendChild(lvBtn);
    }
    targetArea.appendChild(lvGrid);
    const itemShowArea = document.createElement('div');
    targetArea.appendChild(itemShowArea);
}

// [25] 장신구 아이템 아이콘 표시
function renderAccessoryItems(lvTitle, items, targetArea) {
    targetArea.innerHTML = '';
    const itemGrid = document.createElement('div');
    itemGrid.style.cssText = 'display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; margin-top: 15px; padding: 0 5px;';

    for (const itemName in items) {
        const itemData = items[itemName]; 
        const itemContainer = document.createElement('div');
        itemContainer.style.cssText = 'display: flex; flex-direction: column; align-items: center; cursor: pointer; width: 100%;';

        const itemBox = document.createElement('div');
        itemBox.className = 'game-item-box'; 
        itemBox.style.cssText = 'width:48px; height:48px; background: radial-gradient(circle, #5e4b3c 0%, #1a1512 100%); border:2px solid #000; display:flex; align-items:center; justify-content:center; position:relative; box-shadow:inset 0 0 8px rgba(0,0,0,0.8);';

        if (itemData.file) {
            itemBox.innerHTML = `
                <img src="images/${itemData.file}" onerror="this.style.display='none'" style="width:85%; height:85%; object-fit:contain; position:relative; z-index:2;">
                <div style="position:absolute; color:#444; font-size:8px; z-index:1;">PNG</div>
            `;
        } else {
            itemBox.innerHTML = `<div style="color:#eee7c5; font-size:10px; font-weight:900;">IMG</div>`;
        }

        const nameLabel = document.createElement('div');
        nameLabel.className = 'game-item-name';
        nameLabel.style.cssText = 'margin-top:6px; font-size:10px; font-weight:900; color:#ffffff; text-shadow:-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; text-align:center; word-break:keep-all; width:52px;';
        nameLabel.innerText = itemName;

        itemContainer.appendChild(itemBox);
        itemContainer.appendChild(nameLabel);

        itemContainer.onclick = function() {
            document.querySelectorAll('.game-item-box').forEach(el => el.classList.remove('selected'));
            itemBox.classList.add('selected');
            showPartDetail(itemName, itemData, ["스텟"], itemGrid, true);
        };
        itemGrid.appendChild(itemContainer);
    }
    targetArea.appendChild(itemGrid);
    const infoArea = document.createElement('div');
    infoArea.className = 'part-detail-area-container';
    targetArea.appendChild(infoArea);
}

// [26] 팝업 관리
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
        sortedHerbData.forEach(herb => {
            const cb = document.getElementById(`herb-${herb.name}`);
            if (cb && cb.checked) {
                cb.checked = false;
                cb.dispatchEvent(new Event('change'));
            }
        });
    });
}
