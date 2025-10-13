/**
 * Rectangle 클래스
 * QuadTree의 경계를 나타내는 사각형
 */
class Rectangle {
  /**
   * 생성자
   * @param {number} centerX - 중심 X 좌표
   * @param {number} centerY - 중심 Y 좌표
   * @param {number} halfWidth - 반너비 (중심에서 가장자리까지의 거리)
   * @param {number} halfHeight - 반높이 (중심에서 가장자리까지의 거리)
   */
  constructor(centerX, centerY, halfWidth, halfHeight) {
    this.x = centerX;         // 중심 X 좌표
    this.y = centerY;         // 중심 Y 좌표
    this.w = halfWidth;       // 반너비
    this.h = halfHeight;      // 반높이
  }

  /**
   * 점(포인트)이 이 사각형 안에 있는지 확인
   * @param {Object} point - position 속성을 가진 객체 (Boid 등)
   * @returns {boolean} 사각형 안에 있으면 true
   */
  contains(point) {
    return (
      point.position.x >= this.x - this.w &&
      point.position.x <= this.x + this.w &&
      point.position.y >= this.y - this.h &&
      point.position.y <= this.y + this.h
    );
  }

  /**
   * 다른 사각형과 겹치는지 확인
   * @param {Rectangle} range - 비교할 사각형
   * @returns {boolean} 겹치면 true
   */
  intersects(range) {
    return !(
      range.x - range.w > this.x + this.w ||
      range.x + range.w < this.x - this.w ||
      range.y - range.h > this.y + this.h ||
      range.y + range.h < this.y - this.h
    );
  }
}

/**
 * QuadTree 클래스
 * 2D 공간 분할 자료구조로 효율적인 이웃 탐색에 사용
 * 
 * 동작 원리:
 * 1. 영역에 포인트가 capacity를 초과하면 4개의 사분면으로 분할
 * 2. 각 사분면은 독립적인 QuadTree가 됨 (재귀 구조)
 * 3. 검색 시 관련 영역만 탐색하여 O(log n) 시간 복잡도 달성
 */
class QuadTree {
  /**
   * 생성자
   * @param {Rectangle} boundary - 이 QuadTree의 경계
   * @param {number} capacity - 분할 전 최대 포인트 수
   */
  constructor(boundary, capacity) {
    this.boundary = boundary;    // QuadTree의 경계 영역
    this.capacity = capacity;    // 분할 전 최대 수용 가능한 포인트 수
    this.points = [];            // 이 노드에 저장된 포인트들
    this.divided = false;        // 분할 여부
    
    // 4개의 자식 QuadTree (분할 후 생성됨)
    this.northeast = null;       // 북동(우상단)
    this.northwest = null;       // 북서(좌상단)
    this.southeast = null;       // 남동(우하단)
    this.southwest = null;       // 남서(좌하단)
  }

  /**
   * QuadTree를 4개의 사분면으로 분할
   * 북서, 북동, 남서, 남동 순으로 생성
   */
  subdivide() {
    const centerX = this.boundary.x;
    const centerY = this.boundary.y;
    const halfWidth = this.boundary.w / 2;    // 반너비를 다시 반으로
    const halfHeight = this.boundary.h / 2;   // 반높이를 다시 반으로

    // 북동(우상단) 사분면
    const northeastBoundary = new Rectangle(centerX + halfWidth, centerY - halfHeight, halfWidth, halfHeight);
    this.northeast = new QuadTree(northeastBoundary, this.capacity);

    // 북서(좌상단) 사분면
    const northwestBoundary = new Rectangle(centerX - halfWidth, centerY - halfHeight, halfWidth, halfHeight);
    this.northwest = new QuadTree(northwestBoundary, this.capacity);

    // 남동(우하단) 사분면
    const southeastBoundary = new Rectangle(centerX + halfWidth, centerY + halfHeight, halfWidth, halfHeight);
    this.southeast = new QuadTree(southeastBoundary, this.capacity);

    // 남서(좌하단) 사분면
    const southwestBoundary = new Rectangle(centerX - halfWidth, centerY + halfHeight, halfWidth, halfHeight);
    this.southwest = new QuadTree(southwestBoundary, this.capacity);

    this.divided = true;
  }

  /**
   * 포인트를 QuadTree에 삽입
   * @param {Object} point - position 속성을 가진 객체 (Boid 등)
   * @returns {boolean} 성공적으로 삽입되면 true
   */
  insert(point) {
    // 경계 밖이면 삽입 실패
    if (!this.boundary.contains(point)) {
      return false;
    }

    // 용량이 남아있으면 바로 삽입
    if (this.points.length < this.capacity) {
      this.points.push(point);
      return true;
    }

    // 용량 초과 시 분할
    if (!this.divided) {
      this.subdivide();
    }

    // 4개의 자식 중 하나에 삽입 시도
    if (this.northeast.insert(point)) return true;
    if (this.northwest.insert(point)) return true;
    if (this.southeast.insert(point)) return true;
    if (this.southwest.insert(point)) return true;

    return false;
  }

  /**
   * 주어진 범위 내의 모든 포인트 검색
   * @param {Rectangle} range - 검색할 영역
   * @param {Array} foundPoints - 찾은 포인트들을 저장할 배열 (재귀 호출용)
   * @returns {Array} 찾은 포인트들의 배열
   */
  query(range, foundPoints) {
    if (!foundPoints) {
      foundPoints = [];
    }

    // 검색 영역과 겹치지 않으면 탐색 중단
    if (!this.boundary.intersects(range)) {
      return foundPoints;
    }

    // 현재 노드의 포인트들 중 범위 내에 있는 것들 추가
    for (let point of this.points) {
      if (range.contains(point)) {
        foundPoints.push(point);
      }
    }

    // 분할되어 있으면 자식들도 재귀적으로 검색
    if (this.divided) {
      this.northeast.query(range, foundPoints);
      this.northwest.query(range, foundPoints);
      this.southeast.query(range, foundPoints);
      this.southwest.query(range, foundPoints);
    }

    return foundPoints;
  }

  /**
   * 원형 반경 내의 모든 포인트 검색 (Flocking에 최적화)
   * @param {Object} centerPoint - 중심점 (position 속성 필요)
   * @param {number} searchRadius - 검색 반경
   * @param {Array} foundPoints - 찾은 포인트들을 저장할 배열 (재귀 호출용)
   * @returns {Array} 찾은 포인트들의 배열
   */
  queryRadius(centerPoint, searchRadius, foundPoints) {
    if (!foundPoints) {
      foundPoints = [];
    }

    // 빠른 필터링을 위한 사각형 범위 생성
    const range = new Rectangle(
      centerPoint.position.x,
      centerPoint.position.y,
      searchRadius,
      searchRadius
    );

    // 사각형 범위와 겹치지 않으면 탐색 중단
    if (!this.boundary.intersects(range)) {
      return foundPoints;
    }

    const radiusSquared = searchRadius * searchRadius;  // 성능 최적화: 제곱 거리 사용
    
    // 현재 노드의 포인트들 중 원형 반경 내에 있는 것들만 추가
    for (let point of this.points) {
      const deltaX = point.position.x - centerPoint.position.x;
      const deltaY = point.position.y - centerPoint.position.y;
      const distanceSquared = deltaX * deltaX + deltaY * deltaY;
      
      // 원형 반경 내에 있고, 자기 자신이 아닌 경우만 추가
      if (distanceSquared <= radiusSquared && distanceSquared > 0) {
        foundPoints.push(point);
      }
    }

    // 분할되어 있으면 자식들도 재귀적으로 검색
    if (this.divided) {
      this.northeast.queryRadius(centerPoint, searchRadius, foundPoints);
      this.northwest.queryRadius(centerPoint, searchRadius, foundPoints);
      this.southeast.queryRadius(centerPoint, searchRadius, foundPoints);
      this.southwest.queryRadius(centerPoint, searchRadius, foundPoints);
    }

    return foundPoints;
  }

  /**
   * QuadTree 초기화 (모든 데이터 제거)
   * 매 프레임마다 재구성할 때 사용
   */
  clear() {
    this.points = [];
    this.divided = false;
    this.northeast = null;
    this.northwest = null;
    this.southeast = null;
    this.southwest = null;
  }
}
