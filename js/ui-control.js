// js/ui-control.js - 다겸님 최종 검토 버전

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
        const m = mines.find(mine => mine.n === num);
        return mcToPx(m.x, m.z);
    });

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
    marker.bindPopup(popupContent);
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
    const mineIcon = L.divIcon({
        className: `mine-marker mine-${mine.c}`,
        iconSize: [12, 12],
        iconAnchor: [6, 6]
    });

    const marker = L.marker(pos, { icon: mineIcon }).addTo(map);

    const specificOres = mineResources[mine.c];
    const commonOres = mineResources["공통"];
    const pathList = minePaths[mine.c].join(' > ');

    const popupContent = `
        <div style="text-align:center; min-width:220px; color:#000; padding: 5px 0;">
            <div style="font-size:20px; font-weight:800; border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:12px;">
                ${mine.n}번 광산
            </div>
            <div style="margin-bottom:12px; line-height:1.5;">
                <div style="font-size:13px; font-weight:800; color:${mineColors[mine.c]};">[고유 광석]</div>
                <div style="font-size:13px; font-weight:700; margin-bottom:5px;">${specificOres}</div>
                <div style="font-size:11px; color:#666; font-weight:600;">[공통] ${commonOres}</div>
            </div>
            <div style="background:#333; border-radius:4px; padding:10px 0; margin-bottom:12px; cursor:pointer;" 
                 onclick="copyCoords(${mine.x}, ${mine.y}, ${mine.z})">
                <div style="color:#FFD700; font-size:15px; font-weight:700;">${mine.x}, ${mine.y}, ${mine.z}</div>
                <div style="color:#aaa; font-size:10px; margin-top:4px;">(클릭하여 좌표 복사)</div>
            </div>
            <div style="font-size:11px; color:#444; word-break:break-all; line-height:1.4; border-top:1px solid #aaa; padding-top:8px;">
                <span style="font-weight:bold; color:${mineColors[mine.c]};">동선:</span> ${pathList}
            </div>
        </div>
    `;
    marker.bindPopup(popupContent);
    marker.on('mouseover', () => minePolylines[mine.c].setStyle({ opacity: 0.8 }));
    marker.on('mouseout', () => minePolylines[mine.c].setStyle({ opacity: 0 }));
});
