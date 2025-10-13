/**
 * Boid 클래스
 * Craig Reynolds의 Boid 알고리즘을 구현한 개별 입자(에이전트)
 * 
 * Boid란?
 * - "bird-oid object"의 약자
 * - 새 떼의 집단 행동을 시뮬레이션하는 알고리즘
 * - 세 가지 간단한 규칙으로 복잡한 집단 행동 구현
 * 
 * 세 가지 규칙:
 * 1. Separation (분리): 너무 가까운 이웃을 피함
 * 2. Alignment (정렬): 이웃의 평균 속도에 맞춤
 * 3. Cohesion (결속): 이웃의 중심을 향함
 */
class Boid {
  /**
   * 생성자
   * @param {number} x - 초기 X 위치
   * @param {number} y - 초기 Y 위치
   * @param {number} m - 스케일 팩터 (화면 크기에 따라 조정)
   * @param {Array} palette - 색상 팔레트 배열
   */
  constructor(x, y, m, palette) {
    // ===== 물리 속성 =====
    this.acceleration = new Vector(0, 0);                           // 가속도
    this.velocity = new Vector(Math.random() * 2 - 1, Math.random() * 2 - 1); // 초기 속도 (랜덤)
    this.position = new Vector(x, y);                               // 현재 위치
    
    // ===== 트레일(꼬리) 효과를 위한 포인트 =====
    this.points = [];
    for(let i = 0; i < 5; i++) {
      this.points.push(this.position.copy()); // 5개의 포인트로 부드러운 트레일 생성
    }
    
    // ===== 이동 관련 파라미터 =====
    this.r = 3.0;                    // 반경 (현재 미사용)
    this.maxspeed = 3 * 1.5;         // 최대 속도
    this.baseMaxspeed = 3 * 1.5;     // 기본 최대 속도 (터치 회피 시 증가)
    this.maxforce = 0.05 * 1.5;      // 최대 조향력
    this.maxDistance = 2 * m;        // 트레일 포인트 간 최대 거리
    
    // ===== 색상 관리 =====
    // 초기에는 회색으로 시작 (고정 상태)
    const grayValue = Math.random() < 0.5 ? 180/2 : 220/2;
    this.currentColor = { 
      r: grayValue / 255, 
      g: grayValue / 255, 
      b: grayValue / 255 
    };
    // 자유 상태가 되면 팔레트의 랜덤 색상으로 변경
    this.targetColor = this.hexToNormalized(palette[Math.floor(Math.random() * palette.length)]);
    
    // ===== 고정/자유 상태 =====
    this.isFixed = true;              // 초기에는 텍스트 형태를 유지 (고정 상태)
    this.fixedPoint = this.position.copy(); // 고정점 (원래 위치)
    this.m = m;                       // 스케일 팩터 저장
    this.palette = palette;           // 팔레트 저장
    
    // ===== PixiJS 그래픽 객체 =====
    this.graphics = new PIXI.Graphics();       // 메인 그래픽 (트레일)
    this.anchorGraphics = new PIXI.Graphics(); // 앵커 그래픽 (육각형)
    
    // ===== Z-order (렌더링 순서) 관리 =====
    this.graphics.zIndex = 100;       // 고정 Boid는 뒤쪽(100)
    this.anchorGraphics.zIndex = 99;
    this.needsZOrderUpdate = false;   // Z-order 업데이트 필요 플래그
    
    // ===== 성능 최적화: 재사용 가능한 벡터 =====
    // 매번 새 Vector 객체를 만들지 않고 재사용하여 GC(Garbage Collection) 압력 감소
    this.tempVector1 = new Vector(0, 0);
    this.tempVector2 = new Vector(0, 0);
    this.tempVector3 = new Vector(0, 0);
    
    // ===== Noise 오프셋 (고정 Boid의 미세한 움직임용) =====
    this.noiseOffsetX = Math.random() * 1000;
    this.noiseOffsetY = Math.random() * 1000;
  }

  /**
   * HEX 색상을 정규화된 RGB로 변환
   * @param {string} hex - HEX 색상 코드 (예: "#f94144")
   * @returns {Object} {r, g, b} 객체 (각 값은 0~1 범위)
   */
  hexToNormalized(hex) {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = (num >> 16) / 255;           // 빨강 추출 및 정규화
    const g = ((num >> 8) & 0xff) / 255;   // 초록 추출 및 정규화
    const b = (num & 0xff) / 255;          // 파랑 추출 및 정규화
    return { r, g, b };
  }

  /**
   * Z-order (렌더링 순서) 업데이트
   * 고정 Boid는 뒤쪽(100), 자유 Boid는 앞쪽(200)
   */
  updateZOrder() {
    if (this.isFixed) {
      this.graphics.zIndex = 100;
      this.anchorGraphics.zIndex = 99;
    } else {
      this.graphics.zIndex = 200; // 자유 Boid를 위로
      this.anchorGraphics.zIndex = 199;
    }
  }

  /**
   * 메인 업데이트 메서드
   * 매 프레임마다 호출되어 Boid의 행동을 업데이트
   * 
   * @param {Array} neighbors - 주변 이웃 Boid들
   * @param {number} width - 화면 너비
   * @param {number} height - 화면 높이
   * @param {number} frameCount - 현재 프레임 번호
   * @param {SimplexNoise} simplex - Noise 생성기
   * @param {Object} touchPos - 터치 위치 또는 null
   */
  run(neighbors, width, height, frameCount, simplex, touchPos) {
    // ===== 터치 회피 =====
    if (touchPos) {
      const avoidForce = this.avoidTouch(touchPos, simplex, frameCount);
      this.applyForce(avoidForce);
    } else {
      // 터치가 없을 때는 속도 리셋
      this.maxspeed = this.baseMaxspeed;
    }
    
    // ===== 고정/자유 상태에 따른 행동 =====
    if(!this.isFixed) {
      // 자유 상태: Flocking 알고리즘 적용
      this.flock(neighbors);
    } else {
      // 고정 상태: Noise 기반의 미세한 움직임
      let n;
      if (simplex && typeof simplex.noise3D === 'function') {
        // Simplex Noise 사용 (더 자연스러운 움직임)
        const diff = 0.01;
        n = simplex.noise3D(
          this.position.x * diff, 
          this.position.y * diff, 
          frameCount * 0.01
        );
      } else {
        // Fallback: 단순 sine/cosine 기반 노이즈
        n = Math.sin(this.position.x * 0.01 + frameCount * 0.01) * 
            Math.cos(this.position.y * 0.01 + frameCount * 0.01);
      }
      
      // Noise 값을 각도로 변환하여 힘 생성
      const angle = n * Math.PI;
      const force = new Vector(Math.cos(angle), Math.sin(angle));
      force.mult(0.1);
      this.applyForce(force);
    }
    
    this.update();                    // 물리 업데이트
    this.borders(width, height);      // 화면 경계 처리
  }
  
  /**
   * 렌더링 메서드 (Flock에서 호출)
   */
  render() {
    this.draw();
  }

  /**
   * 힘 적용
   * @param {Vector} force - 적용할 힘
   */
  applyForce(force) {
    this.acceleration.add(force);
  }

  /**
   * Flocking 알고리즘 (자유 Boid용)
   * 세 가지 규칙을 하나의 루프에서 계산하여 성능 최적화
   * 
   * @param {Array} boids - 주변 이웃 Boid 배열
   */
  flock(boids) {
    // ===== 파라미터 설정 =====
    const desiredSeparation = 25.0;                          // 분리 거리
    const desiredSeparationSq = desiredSeparation * desiredSeparation;
    const neighborDist = 50;                                 // 이웃 인식 거리
    const neighborDistSq = neighborDist * neighborDist;
    
    // ===== 재사용 벡터 초기화 =====
    const sepSteer = this.tempVector1;  // 분리 조향
    const aliSum = this.tempVector2;    // 정렬 합계
    const cohSum = this.tempVector3;    // 결속 합계
    sepSteer.set(0, 0);
    aliSum.set(0, 0);
    cohSum.set(0, 0);
    
    let sepCount = 0;  // 분리에 참여한 이웃 수
    let aliCount = 0;  // 정렬에 참여한 이웃 수
    let cohCount = 0;  // 결속에 참여한 이웃 수
    
    // ===== 단일 루프로 세 가지 행동 계산 =====
    for (let i = 0; i < boids.length; i++) {
      const other = boids[i];
      const dx = this.position.x - other.position.x;
      const dy = this.position.y - other.position.y;
      const distSq = dx * dx + dy * dy;  // 거리 제곱 (sqrt 생략으로 성능 향상)
      
      if (distSq > 0) { // 자기 자신 제외
        // --- 1. Separation (분리) ---
        // 너무 가까운 이웃으로부터 멀어지는 힘
        if (distSq < desiredSeparationSq) {
          const d = Math.sqrt(distSq);
          const diffX = dx / d;  // 정규화된 방향
          const diffY = dy / d;
          sepSteer.x += diffX / d;  // 거리에 반비례하는 힘
          sepSteer.y += diffY / d;
          sepCount++;
        }
        
        // --- 2. Alignment (정렬) & 3. Cohesion (결속) ---
        // 이웃의 속도와 위치 누적
        if (distSq < neighborDistSq) {
          aliSum.x += other.velocity.x;  // 속도 누적 (정렬용)
          aliSum.y += other.velocity.y;
          cohSum.x += other.position.x;  // 위치 누적 (결속용)
          cohSum.y += other.position.y;
          aliCount++;
          cohCount++;
        }
      }
    }
    
    // ===== Separation 처리 =====
    if (sepCount > 0) {
      sepSteer.div(sepCount);           // 평균 계산
      const sepMag = sepSteer.mag();
      if (sepMag > 0) {
        sepSteer.normalize();           // 방향 벡터화
        sepSteer.mult(this.maxspeed);   // 원하는 속도로 스케일
        sepSteer.sub(this.velocity);    // 조향력 = 원하는 속도 - 현재 속도
        sepSteer.limit(this.maxforce);  // 최대 힘 제한
        sepSteer.mult(1.5);             // 분리 강도 증폭 (충돌 방지 우선)
        this.applyForce(sepSteer);
      }
    }
    
    // ===== Alignment 처리 =====
    if (aliCount > 0) {
      aliSum.div(aliCount);             // 평균 속도 계산
      aliSum.normalize();
      aliSum.mult(this.maxspeed);
      aliSum.sub(this.velocity);
      aliSum.limit(this.maxforce);
      this.applyForce(aliSum);
    }
    
    // ===== Cohesion 처리 =====
    if (cohCount > 0) {
      cohSum.div(cohCount);             // 평균 위치 (중심점) 계산
      this.seekInPlace(cohSum);         // 중심점을 향하는 조향력
      this.applyForce(cohSum);
    }
  }

  /**
   * 목표 지점을 향하는 조향력 계산 (벡터 재사용)
   * @param {Vector} target - 목표 벡터 (이 벡터가 직접 수정됨)
   */
  seekInPlace(target) {
    target.x -= this.position.x;        // 목표까지의 방향 벡터
    target.y -= this.position.y;
    target.normalize();                 // 정규화
    target.mult(this.maxspeed);         // 원하는 속도
    target.sub(this.velocity);          // 조향력
    target.limit(this.maxforce);        // 최대 힘 제한
  }

  /**
   * 목표 지점을 향하는 조향력 계산 (새 벡터 생성)
   * @param {Vector} target - 목표 위치
   * @returns {Vector} 조향력 벡터
   */
  seek(target) {
    const desired = Vector.sub(target, this.position);
    desired.normalize();
    desired.mult(this.maxspeed);
    const steer = Vector.sub(desired, this.velocity);
    steer.limit(this.maxforce);
    return steer;
  }

  /**
   * 터치 위치를 회피하는 힘 계산
   * Curl Noise를 사용하여 소용돌이치듯 흩어지는 효과
   * 
   * @param {Object} touchPos - 터치 위치 {x, y}
   * @param {SimplexNoise} simplex - Noise 생성기
   * @param {number} frameCount - 현재 프레임 번호
   * @returns {Vector} 회피 힘
   */
  avoidTouch(touchPos, simplex, frameCount) {
    const avoidRadius = 150;  // 회피 시작 거리
    const dx = this.position.x - touchPos.x;
    const dy = this.position.y - touchPos.y;
    const distSq = dx * dx + dy * dy;
    
    if (distSq < avoidRadius * avoidRadius && distSq > 0) {
      const dist = Math.sqrt(distSq);
      
      // 거리에 따른 회피 강도 (가까울수록 강함)
      const strength = (avoidRadius - dist) / avoidRadius;
      
      // 터치 근처에서 속도 증가 (최대 4배)
      this.maxspeed = this.baseMaxspeed * (1 + strength * 3);
      
      // ===== 기본 회피 힘 (50%) =====
      const avoidForce = new Vector(dx / dist, dy / dist);
      avoidForce.mult(strength * 0.8 * 0.5);
      
      // ===== Curl Noise 힘 (50%) =====
      // Curl Noise: 소용돌이치는 흐름 생성
      if (simplex && typeof simplex.noise3D === 'function') {
        const noiseScale = 0.005;
        const timeScale = 0.02;
        const eps = 5.0; // Gradient 계산용 epsilon
        
        // 주변 4개 지점의 noise 값으로 gradient 계산
        const n1 = simplex.noise3D(
          (this.position.x + eps) * noiseScale,
          this.position.y * noiseScale,
          frameCount * timeScale
        );
        const n2 = simplex.noise3D(
          (this.position.x - eps) * noiseScale,
          this.position.y * noiseScale,
          frameCount * timeScale
        );
        const n3 = simplex.noise3D(
          this.position.x * noiseScale,
          (this.position.y + eps) * noiseScale,
          frameCount * timeScale
        );
        const n4 = simplex.noise3D(
          this.position.x * noiseScale,
          (this.position.y - eps) * noiseScale,
          frameCount * timeScale
        );
        
        // Gradient 계산
        const dx_noise = (n1 - n2) / (2 * eps);
        const dy_noise = (n3 - n4) / (2 * eps);
        
        // Curl은 gradient에 수직: (-dy, dx)
        const curlForce = new Vector(-dy_noise, dx_noise);
        curlForce.mult(strength * 0.8 * 0.5);
        
        avoidForce.add(curlForce);
      }
      
      return avoidForce;
    }
    
    // 반경 밖이면 속도 리셋
    this.maxspeed = this.baseMaxspeed;
    return new Vector(0, 0);
  }

  /**
   * 물리 업데이트 (위치, 속도, 트레일)
   */
  update() {
    // ===== 기본 물리 =====
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxspeed);
    this.position.add(this.velocity);
    this.acceleration.mult(0);  // 가속도 리셋

    const maxDistSq = this.maxDistance * this.maxDistance;
    
    // ===== 트레일 포인트 업데이트 =====
    // 맨 뒤부터 앞으로 업데이트 (꼬리가 머리를 따라감)
    for(let i = this.points.length - 1; i > 0; i--) {
      if(i === this.points.length - 1) {
        this.points[i].set(this.position);  // 마지막 포인트는 현재 위치
      }
      const p1 = this.points[i];
      const p2 = this.points[i - 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const distSq = dx * dx + dy * dy;
      
      // 포인트 간 거리가 최대 거리를 초과하면 조정
      if(distSq > maxDistSq) {
        const dist = Math.sqrt(distSq);
        const factor = this.maxDistance / dist;
        p2.x = p1.x + dx * factor;
        p2.y = p1.y + dy * factor;
      }
    }

    // ===== 고정 Boid의 추가 제약 =====
    if(this.isFixed) {
      // 고정점으로부터의 거리 제한
      for(let i = 0; i < this.points.length; i++) {
        const p1 = i === 0 ? this.fixedPoint : this.points[i - 1];
        const p2 = this.points[i];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distSq = dx * dx + dy * dy;
        
        if(distSq > maxDistSq) {
          const dist = Math.sqrt(distSq);
          const factor = this.maxDistance / dist;
          p2.x = p1.x + dx * factor;
          p2.y = p1.y + dy * factor;
          
          // 마지막 포인트가 조정되면 실제 위치도 업데이트
          if(i === this.points.length - 1) {
            this.position.set(p2.x, p2.y);
          }
        }
      }
    } else {
      // ===== 자유 Boid의 색상 전환 =====
      // 부드러운 색상 전환 (Lerp)
      const lerpAmount = 0.1;
      this.currentColor.r = this.currentColor.r * (1 - lerpAmount) + this.targetColor.r * lerpAmount;
      this.currentColor.g = this.currentColor.g * (1 - lerpAmount) + this.targetColor.g * lerpAmount;
      this.currentColor.b = this.currentColor.b * (1 - lerpAmount) + this.targetColor.b * lerpAmount;
    }
  }

  /**
   * Boid 그리기 (PixiJS Graphics 사용)
   */
  draw() {
    // ===== 색상 변환 (0~1 → 0~255) =====
    const r = Math.floor(this.currentColor.r * 255);
    const g = Math.floor(this.currentColor.g * 255);
    const b = Math.floor(this.currentColor.b * 255);
    const color = r << 16 | g << 8 | b;  // RGB를 HEX로 결합
    
    // ===== 그래픽 재생성 (매 프레임) =====
    this.graphics.clear();
    
    // 둥근 선 연결 (부드러운 트레일)
    this.graphics.lineStyle({
      width: 10 * this.m,
      color: color,
      alpha: 1,
      join: PIXI.LINE_JOIN.ROUND
    });
    
    // 트레일 포인트들을 연결하는 선 그리기
    if (this.points.length > 0) {
      this.graphics.moveTo(this.points[0].x, this.points[0].y);
      for(let i = 1; i < this.points.length; i++) {
        this.graphics.lineTo(this.points[i].x, this.points[i].y);
      }
    }
  }

  /**
   * 앵커(육각형) 그리기
   * 자유 Boid의 원래 위치를 표시
   */
  drawAnchor() {
    this.anchorGraphics.clear();
    
    // 자유 상태일 때만 앵커 표시
    if (!this.isFixed) {
      this.anchorGraphics.beginFill(0x333333);  // 어두운 회색
      
      // 정육각형 그리기
      const radius = 5 * this.m;
      const points = [];
      for(let i = 0; i < 6; i++) {
        const angle = Math.PI / 3 * i - Math.PI / 2;
        points.push(
          this.fixedPoint.x + Math.cos(angle) * radius,
          this.fixedPoint.y + Math.sin(angle) * radius
        );
      }
      this.anchorGraphics.drawPolygon(points);
      this.anchorGraphics.endFill();
    }
  }

  /**
   * 화면 경계 처리 (랩어라운드)
   * 화면 밖으로 나가면 반대편에서 나옴
   */
  borders(width, height) {
    const d = this.points.length * this.maxDistance;
    if (this.position.x < -d) this.position.x = width + d;
    if (this.position.y < -d) this.position.y = height + d;
    if (this.position.x > width + d) this.position.x = -d;
    if (this.position.y > height + d) this.position.y = -d;
  }

  /**
   * 터치 체크 (고정 Boid 해제용)
   * @param {number} mouseX - 마우스 X 좌표
   * @param {number} mouseY - 마우스 Y 좌표
   * @returns {boolean} 해제되었으면 true
   */
  checkTouch(mouseX, mouseY) {
    // 고정 상태이고 터치 위치가 가까우면
    if (this.isFixed && this.position.dist(new Vector(mouseX, mouseY)) < 50) {
      this.maxDistance += 0.7 * this.m;  // 트레일 거리 증가
      
      // 일정 거리 이상 늘어나면 해제
      if (this.maxDistance > 6 * this.m) {
        this.isFixed = false;
        this.needsZOrderUpdate = true;  // Z-order 업데이트 요청
        return true;
      }
    }
    return false;
  }
}
