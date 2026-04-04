// 1. 나침반(스폰) 아이콘
const spawnIcon = L.icon({
    iconUrl: 'images/compass.png',
    iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -10]
});

// 2. 동물용 기본 아이콘 (나중에 동물별 이미지가 생기면 수정 가능)
const animalIcon = L.icon({
    iconUrl: 'images/compass.png', // 임시로 나침반 사용
    iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -10]
});

// 3. 동선(Polyline) 설정
const animalPathPoints = animals.map(a => mcToPx(a.mcX, a.mcZ));
const polyline = L.polyline(animalPathPoints, {
    color: '#ffcc00', // 황금색 동선
    weight: 3,
    opacity: 0, // 처음엔 안보임
    dashArray: '5, 10' // 점선 효과
}).addTo(map);

// 4. 좌표 복사 함수
window.copyCoords = (x, y, z) => {
    const text = `${x}, ${y}, ${z}`;
    navigator.clipboard.writeText(text).then(() => alert("좌표가 복사되었습니다: " + text));
};

// 5. 동물 마커 생성 및 이벤트
animals.forEach((ani) => {
    const pos = mcToPx(ani.mcX, ani.mcZ);
    const marker = L.marker(pos, { icon: animalIcon }).addTo(map);

    // 정보창(Popup) 내용 구성
    const popupContent = `
        <div style="line-height:1.6;">
            <strong>${ani.order}. ${ani.name}</strong><br>
            <span style="cursor:pointer; color:#FFD700;" onclick="copyCoords(${ani.mcX}, ${ani.mcY}, ${ani.mcZ})">
                X: ${ani.mcX}, Y: ${ani.mcY}, Z: ${ani.mcZ} (클릭시 복사)
            </span><br>
            <span style="color:#A335EE; font-weight:bold;">*[히든]십이지신</span><br>
            <span style="font-size:11px;">동선: 쥐>소>호랑이><span style="color:red;">도사</span>>토끼>용>뱀><span style="color:red;">도사</span>>말>양>원숭이><span style="color:red;">도사</span>>닭>개>돼지><span style="color:red;">도사</span></span>
        </div>
    `;

    marker.bindPopup(popupContent);

    // 마우스 오버 시 동선 보이기
    marker.on('mouseover', () => polyline.setStyle({ opacity: 0.8 }));
    marker.on('mouseout', () => polyline.setStyle({ opacity: 0 }));
});

// 스폰 마커는 별도 유지
L.marker(mcToPx(spawnData.mcX, spawnData.mcZ), { icon: spawnIcon })
    .addTo(map).bindPopup("스폰 지점");
