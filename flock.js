/**
 * Flock 클래스
 * 여러 Boid를 관리하는 집단 클래스
 * 
 * 주요 역할:
 * - Boid 컬렉션 관리
 * - QuadTree를 통한 효율적인 이웃 탐색
 * - 터치 이벤트 처리
 * - 렌더링 조율
 */
class Flock {
  /**
   * 생성자
   * @param {PIXI.Container} container - Boid 그래픽을 담을 PixiJS 컨테이너
   */
  constructor(container) {
    this.boids = [];           // 모든 Boid들을 저장하는 배열
    this.container = container; // PixiJS 컨테이너 (그래픽 렌더링용)
    this.quadtree = null;      // 공간 분할 트리 (매 프레임 재생성)
  }

  /**
   * 메인 업데이트 루프
   * 매 프레임마다 호출되어 모든 Boid를 업데이트하고 렌더링
   * 
   * @param {number} width - 화면 너비
   * @param {number} height - 화면 높이
   * @param {number} frameCount - 현재 프레임 번호
   * @param {SimplexNoise} simplex - Simplex Noise 생성기
   * @param {Object} touchPos - 터치 위치 {x, y} 또는 null
   */
  run(width, height, frameCount, simplex, touchPos) {
    // ===== 1단계: QuadTree 구축 =====
    // 매 프레임마다 QuadTree를 재구성하여 최신 위치 정보 반영
    const boundary = new Rectangle(width / 2, height / 2, width / 2, height / 2);
    
    if (!this.quadtree) {
      // 첫 프레임: 새 QuadTree 생성 (용량: 8)
      this.quadtree = new QuadTree(boundary, 8);
    } else {
      // 이후 프레임: 기존 QuadTree 초기화 및 재사용
      this.quadtree.clear();
      this.quadtree.boundary = boundary;
      this.quadtree.capacity = 8;
    }
    
    // 모든 Boid를 QuadTree에 삽입
    for (let boid of this.boids) {
      this.quadtree.insert(boid);
    }

    // ===== 2단계: 모든 Boid의 물리 업데이트 =====
    for (let boid of this.boids) {
      // QuadTree를 사용하여 반경 50 픽셀 내의 이웃만 검색
      // O(n²) → O(n log n)으로 성능 최적화
      const searchRadius = 50; // boid.flock()의 neighborDist와 동일
      const neighbors = this.quadtree.queryRadius(boid, searchRadius);

      // Boid 업데이트 (Flocking, 터치 회피, 물리 시뮬레이션)
      boid.run(neighbors, width, height, frameCount, simplex, touchPos);
    }
    
    // ===== 3단계: Z-order 업데이트 (필요한 경우만) =====
    // 고정 Boid → 자유 Boid로 변환 시 렌더링 순서 변경
    for (let boid of this.boids) {
      if (boid.needsZOrderUpdate) {
        boid.updateZOrder();           // Z-index 업데이트
        boid.needsZOrderUpdate = false; // 플래그 리셋
      }
    }
    
    // ===== 4단계: 모든 Boid 렌더링 =====
    for (let boid of this.boids) {
      boid.render();
    }
  }

  /**
   * Flock에 새 Boid 추가
   * @param {Boid} boid - 추가할 Boid 객체
   */
  addBoid(boid) {
    this.boids.push(boid);
    
    // PixiJS 컨테이너에 그래픽 추가
    // 앵커(육각형)와 메인 그래픽 둘 다 추가
    this.container.addChild(boid.anchorGraphics);
    this.container.addChild(boid.graphics);
  }

  /**
   * 터치 이벤트 처리
   * 터치 위치 근처의 고정된 Boid를 해제
   * 
   * @param {number} mouseX - 터치 X 좌표
   * @param {number} mouseY - 터치 Y 좌표
   */
  handleTouch(mouseX, mouseY) {
    // 역순으로 순회 (최근 추가된 Boid부터 체크)
    for (let i = this.boids.length - 1; i >= 0; i--) {
      const boid = this.boids[i];
      
      // Boid의 checkTouch 메서드로 터치 확인
      if (boid.checkTouch(mouseX, mouseY)) {
        // 터치된 Boid를 흰색으로 변경 (강조 효과)
        boid.currentColor.r = 1;
        boid.currentColor.g = 1;
        boid.currentColor.b = 1;
        
        // 주의: Z-order는 레이어 시스템이 자동 처리
        // 배열 순서를 변경할 필요 없음
      }
    }
  }

  /**
   * 모든 Boid 제거 (텍스트 변경 시 사용)
   * 메모리 누수 방지를 위해 PixiJS 컨테이너에서도 제거
   */
  clear() {
    // PixiJS 컨테이너에서 모든 그래픽 제거
    for (let boid of this.boids) {
      this.container.removeChild(boid.anchorGraphics);
      this.container.removeChild(boid.graphics);
    }
    
    // 배열 초기화
    this.boids = [];
    
    // QuadTree 초기화
    if (this.quadtree) {
      this.quadtree.clear();
    }
  }
}
