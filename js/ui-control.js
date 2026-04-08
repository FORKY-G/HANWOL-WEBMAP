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

// [13] 퀘스트 NPC 및 특수 아이템(탐령구/정적주) 마커 생성
npcData.forEach((npc) => {
const pos = mcToPx(npc.x, npc.z);

// [기존유지] 아이콘 설정
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

// 1. [기존유지] 기록서 위치 복사 버튼
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

// 2. [기존유지] 동영상 가이드 (해무사승려)
let videoHtml = '';
if (npc.name === "해무사승려") {
videoHtml = `
           <div style="margin-top:10px; border-top:1px dashed #ccc; padding-top:10px;">
               <div style="font-weight:800; font-size:13px; color:#007bff; margin-bottom:5px;">[퀘스트 가이드 영상]</div>
               <video width="100%" height="auto" controls playsinline style="border-radius:4px; border:1px solid #ddd; display:block; background:#000;">
                   <source src="images/haemusa.mp4" type="video/mp4">
                   브라우저가 동영상을 지원하지 않습니다.
               </video>
           </div>
       `;
}

// 3. [신규/심화] 모든 상세 정보 항목 정의
const lvInfo = npc.lv ? `<span style="font-size:12px; color:#666; font-weight:normal;"> (lv.${npc.lv})</span>` : '';

// 데이터가 있을 때만 한 줄씩 생성
const questPart = npc.quest ? `<div style="margin-bottom:4px;"><span style="color:#d00; font-weight:800;">[퀘스트]</span> ${npc.quest}</div>` : '';
const itemPart = npc.item ? `<div style="margin-bottom:4px;"><span style="color:#007bff; font-weight:800;">[필요재료]</span> ${npc.item}</div>` : '';
const routePart = npc.route ? `<div style="margin-bottom:4px;"><span style="color:#28a745; font-weight:800;">[동선]</span> ${npc.route}</div>` : '';
const rewardPart = npc.reward ? `<div style="margin-bottom:4px;"><span style="color:#f39c12; font-weight:800;">[보상]</span> ${npc.reward}</div>` : '';

// 탐령구/정적주용 제작 재료
const materialPart = npc.materials ? `
       <div style="margin-top:8px; padding:8px; background:#f4faff; border:1px solid #cce5ff; border-radius:4px; font-size:12px; color:#004085;">
           <span style="font-weight:800;">[제작재료]</span><br>${npc.materials}
       </div>` : '';

// 메모 정보 (줄 구분선 추가)
const memoPart = npc.memo ? `<div style="margin-top:6px; border-top:1px dashed #ccc; padding-top:6px; color:#666; font-size:11px;">※ ${npc.memo}</div>` : '';

// 4. [기존유지/확장] 최종 팝업 내용 구성
const popupContent = `
       <div style="text-align:center; min-width:240px; color:#000; padding: 0; line-height: 1.4;">
           <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding: 5px 0; margin-bottom: 10px;">
               ${npc.name}${lvInfo}
           </div>
           
           <div style="background:#333; border-radius:4px; padding: 6px 0; margin-bottom: 10px; cursor:pointer;" onclick="copyCoords(${npc.x}, ${npc.y}, ${npc.z})">
               <div style="color:#FFD700; font-size:15px; font-weight:700;">${npc.x}, ${npc.y}, ${npc.z}</div>
               <div style="color:#aaa; font-size:9px;">(위치 복사)</div>
           </div>

           <div style="text-align:left; font-size:12px; color:#333;">
               ${questPart}
               ${itemPart}
               ${materialPart}
               ${routePart}
               ${rewardPart}
               ${memoPart}
               ${recordsHtml}
               ${videoHtml}
           </div>
       </div>
   `;

marker.bindPopup(popupContent, { autoPan: true, keepInView: true, closeButton: false, offset: L.point(0, -5) });
});

// [14] 사냥터 영역 및 투명 마커 생성
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
}).addTo(layers.huntingMarkers); 

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
// 버벅임 개선: 속도 상향 및 배율 최적화
map.flyTo(targetPos, -1, { animate: true, duration: 0.4 }); 
setTimeout(() => { hMarker.openPopup(); }, 450);
} else {
map.removeLayer(layers.hunting[area.name]);
map.removeLayer(hMarker);
}
});

overlay.on('mouseover', function () { this.setOpacity(0.8); });
overlay.on('mouseout', function () { this.setOpacity(0.5); });
});

// [15] 약초 시스템 (희귀 정렬 + 데이터 아이콘 매칭 + 이동 제거)
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
const rareTag = isRare ? '<span style="color: #ff0000; font-weight: bold; margin-left: 5px;">(희귀)</span>' : '';

const overlay = L.imageOverlay(`images/${herb.file}`, huntingImageBounds, {
opacity: 0.6, interactive: false 
});
layers.herbs[herb.name] = overlay;

const markerGroup = L.layerGroup();
herb.locations.forEach(loc => {
const pos = mcToPx(loc.x, loc.z);
const hMarker = L.marker(pos, { icon: transparentIcon });

// y값이 없을 경우를 대비해 기본값 0을 설정하거나, 있으면 loc.y를 출력합니다.
const yVal = loc.y !== undefined ? loc.y : 0;

const popupContent = `
       <div style="text-align:center; min-width:180px; color:#000;">
           <div style="font-size:16px; font-weight:800; border-bottom:2px solid #000; padding-bottom:5px; margin-bottom:8px;">
               ${herb.name}${rareTag}
           </div>
           <div style="background:#333; color:#FFD700; border-radius:4px; padding:6px; cursor:pointer; font-size:14px; font-weight:700;" 
                onclick="copyCoords(${loc.x}, ${yVal}, ${loc.z})">
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
label.style.display = 'flex';
label.style.alignItems = 'center';

// [수정 포인트] hub1.png 데이터를 hub-1.png 파일로 안전하게 매칭
const listIcon = herb.file ? herb.file.replace('hub', 'hub-') : "";

label.innerHTML = `
       <input type="checkbox" id="herb-${herb.name}"> 
       <img src="images/${listIcon}" style="width:20px; height:20px; margin-right:8px; object-fit:contain;" onerror="this.style.display='none'">
       <span style="flex:1;">${herb.name}${rareTag}</span>
   `;
if(herbListContainer) herbListContainer.appendChild(label);

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

// [17] 통합 검색 및 이동 시스템 (상세 정보 검색 강화)
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

// 1. 약초 검색
sortedHerbData.forEach(h => {
if (h.name.toLowerCase().includes(query)) {
currentFilteredData.push({ 
name: h.name, category: '약초', x: h.locations[0].x, z: h.locations[0].z, type: 'herb', herbName: h.name 
});
}
});

// 2. 십이지신 검색
animals.forEach(ani => {
if (ani.name.toLowerCase().includes(query)) {
currentFilteredData.push({ name: ani.name, category: '십이지신', x: ani.mcX, z: ani.mcZ, type: 'animal' });
}
});

// 3. 광산 검색 (번호 + 괄호 안의 광물 명칭 검색 추가)
mines.forEach(mine => {
const specificOres = mineResources[mine.c] || ""; // 해당 광산 색상의 전용 광물
const commonOres = mineResources["공통"] || "";   // 공통 광물
const allMineInfo = (mine.n.toString() + specificOres + commonOres).toLowerCase();

if (allMineInfo.includes(query)) {
currentFilteredData.push({ 
name: `${mine.n}번 광산 (${specificOres})`, 
category: '광산', x: mine.x, z: mine.z, type: 'mine' 
});
}
});

// 4. 사냥터 검색 (이름 + 몬스터 이름)
huntingGrounds.forEach(area => {
if (area.name.toLowerCase().includes(query) || area.monsters.toLowerCase().includes(query)) {
currentFilteredData.push({ name: area.name, category: `사냥터 (${area.monsters})`, x: area.x, z: area.z, type: 'hunting', areaName: area.name });
}
});

// 5. NPC 및 기타 (퀘스트, 재료 내용 포함 검색)
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
            const name = item.name || (item.n && typeof item.n === "string" ? item.n : "") || (item.file ? "적환단" : group.cat);
            const quest = (item.quest || "").toLowerCase();
            const materials = (item.materials || "").toLowerCase();
    group.data.forEach(item => {
        // 이름 설정 (없을 경우 카테고리명으로 대체)
        const name = item.name || (item.n && typeof item.n === "string" ? item.n : "") || (item.file ? "적환단" : group.cat);
        
        // 검색 비교용 데이터 문자열 생성 (모두 소문자로 변환하여 검색 정확도 높임)
        const sName = name.toLowerCase();
        const sQuest = (item.quest || "").toLowerCase();
        const sMaterials = (item.materials || "").toLowerCase();
        const sDropItem = (item.item || "").toLowerCase(); // 항아리 속 아이템 (예: 고목조각)
        const sTool = (item.tool || "").toLowerCase();     // 필요 도구 (예: 탐색부적)

        // 검색어가 이름, 퀘스트, 재료, 아이템, 도구 중 하나라도 포함되면 결과에 추가
        if (sName.includes(query) || sQuest.includes(query) || sMaterials.includes(query) || sDropItem.includes(query) || sTool.includes(query)) {

            if (name.toLowerCase().includes(query) || quest.includes(query) || materials.includes(query)) {
                currentFilteredData.push({ name: name, category: group.cat, x: item.x, z: item.z, type: 'extra' });
            // [편의기능] 아이템 이름으로 검색했을 때 결과 리스트에 아이템명을 같이 보여줌
            let finalDisplayName = name;
            if (sDropItem.includes(query) && group.cat === '탐색') {
                finalDisplayName = `${name} (${item.item})`; // 예: 항아리 (고목조각)
            } else if (sTool.includes(query) && group.cat === '탐색') {
                finalDisplayName = `${name} [${item.tool}]`; // 예: 항아리 [탐색부적]
}
        });

            currentFilteredData.push({ 
                name: finalDisplayName, 
                category: group.cat, 
                x: item.x, 
                z: item.z, 
                type: 'extra' 
            });
        }
});
});

// 검색 결과 리스트 생성
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

function selectSearchResult(item) {
moveToLocation(item);
searchResults.style.display = 'none';
searchInput.value = item.name; 
searchInput.blur();
}

function moveToLocation(target) {
const targetPos = mcToPx(target.x, target.z);

if (target.type !== 'herb') {
map.flyTo(targetPos, -0.5, { animate: true, duration: 0.5 });
}

setTimeout(() => {
let foundMarker = null;

if (target.type === 'herb') {
const chk = document.getElementById(`herb-${target.herbName}`);
if (chk) {
if (!chk.checked) {
chk.checked = true;
layers.herbs[target.herbName].addTo(map);
layers.herbMarkers[target.herbName].addTo(map);
}
foundMarker = layers.herbMarkers[target.herbName].getLayers()[0];
}
} 
else if (target.type === 'hunting') {
const chk = document.getElementById(`hunt-${target.areaName}`);
if (chk) {
if (!chk.checked) {
chk.checked = true;
layers.hunting[target.areaName].addTo(map);
}
layers.huntingMarkers.eachLayer(layer => {
if (layer.getLatLng().equals(targetPos)) foundMarker = layer;
});
if (foundMarker && !map.hasLayer(foundMarker)) foundMarker.addTo(map);
}
} 
else {
const searchGroups = [
layers.spawn, layers.animals, layers.stones, layers.npc, 
layers.red, layers.pot, layers.box, 
...Object.values(layers.mines["녹"]), // 광산 레이어들 포함
layers.mines["청"], layers.mines["황"], layers.mines["적"]
];

searchGroups.forEach(group => {
if(!group.eachLayer) return;
group.eachLayer(layer => {
if (layer instanceof L.Marker && layer.getLatLng().equals(targetPos)) {
foundMarker = layer;
}
});
});
}

if (foundMarker) {
if (!map.hasLayer(foundMarker)) foundMarker.addTo(map);
foundMarker.openPopup(); 
} else {
L.popup().setLatLng(targetPos)
.setContent(`<div style="text-align:center; font-weight:800;">[${target.category}]<br>${target.name}</div>`)
.openOn(map);
}
}, 600);
}

// [18] 목록 초기화 시스템
document.getElementById('reset-hunt').addEventListener('click', function(e) {
e.stopPropagation();
huntingGrounds.forEach(area => {
const chk = document.getElementById(`hunt-${area.name}`);
if (chk && chk.checked) {
chk.checked = false;
map.removeLayer(layers.hunting[area.name]);
}
});
});

// [18] 목록 초기화 시스템
document.getElementById('reset-hunt').addEventListener('click', function(e) {
e.stopPropagation();
huntingGrounds.forEach(area => {
const chk = document.getElementById(`hunt-${area.name}`);
if (chk && chk.checked) {
chk.checked = false;
map.removeLayer(layers.hunting[area.name]);
// 해당 영역의 마커도 지도에서 제거
map.eachLayer(layer => {
if (layer instanceof L.Marker && layer.getPopup() && layer.getPopup().getContent().includes(area.name)) {
map.removeLayer(layer);
}
});
}
});
});

document.getElementById('reset-herb').addEventListener('click', function(e) {
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

// 팝업 잘림 방지 (기존 유지)
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
