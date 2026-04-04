// js/ui-control.js

const compassIcon = L.icon({
    iconUrl: 'images/compass.png',
    iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -10]
});

const transparentIcon = L.icon({
    iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==', 
    iconSize: [30, 30], iconAnchor: [15, 15], popupAnchor: [0, -15]
});

const animalPathPoints = animals.map(ani => mcToPx(ani.mcX, ani.mcZ));
const polyline = L.polyline(animalPathPoints, {
    color: '#FFD700', weight: 2, opacity: 0, dashArray: '5, 8'
}).addTo(map);

window.copyCoords = (x, y, z) => {
    const text = `${x} ${y} ${z}`; 
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById('copy-toast');
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 1500);
    });
};

// --- 이 부분(정보창 디자인) 위주로 수정되었습니다 ---
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

            <div style="color:#7000CA; font-weight:800; font-size:14px; margin-bottom:8px;">
                *[히든]십이지신
            </div>
            
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

// 스폰 지점 마커 (통일감을 위해 검은색 굵은 글씨 적용)
L.marker(mcToPx(spawnData.mcX, spawnData.mcZ), { icon: compassIcon })
    .addTo(map)
    .bindPopup(`<div style="color:#000; font-weight:bold; font-size:14px; text-align:center;">스폰 지점</div>`);

mines.forEach((mine) => {
    const pos = mcToPx(mine.x, mine.z);
    
    // 색상별로 클래스를 다르게 적용한 정사각형 마커 생성
    const mineIcon = L.divIcon({
        className: `mine-marker mine-${mine.c}`,
        iconSize: [10, 10], // 아주 작고 깔끔한 정사각형
        iconAnchor: [5, 5]
    });

    const marker = L.marker(pos, { icon: mineIcon }).addTo(map);

    // 다겸님이 만족하신 가독성 스타일 정보창 적용
    const popupContent = `
        <div style="text-align:center; min-width:180px; color:#000; padding: 5px 0;">
            <div style="font-size:18px; font-weight:800; border-bottom:2px solid #000; padding-bottom:5px; margin-bottom:10px;">
                ${mine.n}번 광산 (${mine.c}색)
            </div>
            
            <div style="background:#333; border-radius:4px; padding:8px 0; cursor:pointer;" 
                 onclick="copyCoords(${mine.x}, ${mine.y}, ${mine.z})">
                <div style="color:#FFD700; font-size:14px; font-weight:700;">
                    ${mine.x}, ${mine.y}, ${mine.z}
                </div>
                <div style="color:#aaa; font-size:10px; margin-top:3px;">(클릭하여 좌표 복사)</div>
            </div>
        </div>
    `;

    marker.bindPopup(popupContent);
});
