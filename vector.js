/**
 * Vector 클래스
 * 2D 벡터 연산을 위한 유틸리티 클래스
 * p5.js의 Vector 클래스를 대체하여 사용
 */
class Vector {
  /**
   * 생성자
   * @param {number} x - X 좌표 (기본값: 0)
   * @param {number} y - Y 좌표 (기본값: 0)
   */
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * 랜덤한 방향의 단위 벡터 생성 (정적 메서드)
   * @returns {Vector} 랜덤 방향의 단위 벡터
   */
  static random2D() {
    const angle = Math.random() * Math.PI * 2;
    return new Vector(Math.cos(angle), Math.sin(angle));
  }

  /**
   * 두 벡터의 차를 계산 (v1 - v2)
   * @param {Vector} v1 - 첫 번째 벡터
   * @param {Vector} v2 - 두 번째 벡터
   * @returns {Vector} 두 벡터의 차
   */
  static sub(v1, v2) {
    return new Vector(v1.x - v2.x, v1.y - v2.y);
  }

  /**
   * 두 벡터의 합을 계산 (v1 + v2)
   * @param {Vector} v1 - 첫 번째 벡터
   * @param {Vector} v2 - 두 번째 벡터
   * @returns {Vector} 두 벡터의 합
   */
  static add(v1, v2) {
    return new Vector(v1.x + v2.x, v1.y + v2.y);
  }

  /**
   * 두 벡터 사이의 거리 계산
   * @param {Vector} v1 - 첫 번째 벡터
   * @param {Vector} v2 - 두 번째 벡터
   * @returns {number} 두 벡터 사이의 거리
   */
  static dist(v1, v2) {
    const dx = v1.x - v2.x;
    const dy = v1.y - v2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 두 벡터 사이의 거리 제곱 계산 (성능 최적화용)
   * Math.sqrt() 연산을 생략하여 빠른 거리 비교 가능
   * @param {Vector} v1 - 첫 번째 벡터
   * @param {Vector} v2 - 두 번째 벡터
   * @returns {number} 두 벡터 사이의 거리 제곱
   */
  static distSq(v1, v2) {
    const dx = v1.x - v2.x;
    const dy = v1.y - v2.y;
    return dx * dx + dy * dy;
  }

  /**
   * 벡터 복사
   * @returns {Vector} 복사된 새 벡터
   */
  copy() {
    return new Vector(this.x, this.y);
  }

  /**
   * 벡터 값 설정
   * @param {Vector|number} x - Vector 객체 또는 X 좌표
   * @param {number} y - Y 좌표 (첫 번째 인자가 숫자일 때만 사용)
   * @returns {Vector} 메서드 체이닝을 위해 자기 자신 반환
   */
  set(x, y) {
    if (x instanceof Vector) {
      this.x = x.x;
      this.y = x.y;
    } else {
      this.x = x;
      this.y = y;
    }
    return this;
  }

  /**
   * 벡터 덧셈 (자기 자신을 수정)
   * @param {Vector} v - 더할 벡터
   * @returns {Vector} 메서드 체이닝을 위해 자기 자신 반환
   */
  add(v) {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  /**
   * 벡터 뺄셈 (자기 자신을 수정)
   * @param {Vector} v - 뺄 벡터
   * @returns {Vector} 메서드 체이닝을 위해 자기 자신 반환
   */
  sub(v) {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  /**
   * 스칼라 곱셈 (자기 자신을 수정)
   * @param {number} n - 곱할 스칼라 값
   * @returns {Vector} 메서드 체이닝을 위해 자기 자신 반환
   */
  mult(n) {
    this.x *= n;
    this.y *= n;
    return this;
  }

  /**
   * 스칼라 나눗셈 (자기 자신을 수정)
   * @param {number} n - 나눌 스칼라 값
   * @returns {Vector} 메서드 체이닝을 위해 자기 자신 반환
   */
  div(n) {
    if (n !== 0) {
      this.x /= n;
      this.y /= n;
    }
    return this;
  }

  /**
   * 벡터의 크기(길이) 계산
   * @returns {number} 벡터의 크기
   */
  mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  /**
   * 벡터의 크기 제곱 계산 (성능 최적화용)
   * @returns {number} 벡터의 크기 제곱
   */
  magSq() {
    return this.x * this.x + this.y * this.y;
  }

  /**
   * 벡터 정규화 (크기를 1로 만듦)
   * @returns {Vector} 메서드 체이닝을 위해 자기 자신 반환
   */
  normalize() {
    const m = this.mag();
    if (m !== 0) {
      this.div(m);
    }
    return this;
  }

  /**
   * 벡터의 크기를 특정 값으로 설정
   * @param {number} n - 설정할 크기
   * @returns {Vector} 메서드 체이닝을 위해 자기 자신 반환
   */
  setMag(n) {
    this.normalize();
    this.mult(n);
    return this;
  }

  /**
   * 벡터의 크기를 최대값으로 제한
   * @param {number} max - 최대 크기
   * @returns {Vector} 메서드 체이닝을 위해 자기 자신 반환
   */
  limit(max) {
    const mSq = this.magSq();
    if (mSq > max * max) {
      this.div(Math.sqrt(mSq));
      this.mult(max);
    }
    return this;
  }

  /**
   * 벡터의 각도 계산 (라디안)
   * @returns {number} 벡터의 각도 (라디안)
   */
  heading() {
    return Math.atan2(this.y, this.x);
  }

  /**
   * 벡터를 특정 각도만큼 회전
   * @param {number} angle - 회전할 각도 (라디안)
   * @returns {Vector} 메서드 체이닝을 위해 자기 자신 반환
   */
  rotate(angle) {
    const newHeading = this.heading() + angle;
    const mag = this.mag();
    this.x = Math.cos(newHeading) * mag;
    this.y = Math.sin(newHeading) * mag;
    return this;
  }

  /**
   * 다른 벡터와의 거리 계산
   * @param {Vector} v - 대상 벡터
   * @returns {number} 거리
   */
  dist(v) {
    return Vector.dist(this, v);
  }
}
