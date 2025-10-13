# 창발 (Emergence)

**창발**은 PixiJS를 기반으로 한 인터랙티브 Boid 시뮬레이션 프로젝트입니다. 수천 개의 개체들이 간단한 규칙을 따라 집단적으로 복잡한 패턴을 만들어내는 창발 현상을 시각화합니다.

## 🎨 데모

프로젝트를 실행하면 "창발"이라는 한글 텍스트가 수천 개의 작은 Boid(입자)로 형성되어 있습니다. 마우스나 터치로 상호작용할 수 있으며, Boid들은 서로 영향을 주고받으며 유기적으로 움직입니다.

### 주요 특징

- 🎯 **Boid 알고리즘**: 분리(Separation), 정렬(Alignment), 결속(Cohesion)의 세 가지 규칙으로 집단 행동 구현
- ✏️ **동적 텍스트**: UI를 통해 실시간으로 단어를 변경하여 Boid 재생성
- 🔗 **URL 파라미터**: URL을 통해 단어 공유 가능 (`?word=창발`)
- 🚀 **고성능 렌더링**: PixiJS WebGL 렌더러를 사용한 부드러운 애니메이션
- 🌳 **QuadTree 최적화**: 공간 분할 자료구조로 효율적인 이웃 탐색
- 🌀 **Simplex Noise**: 자연스러운 움직임을 위한 노이즈 기반 힘
- 👆 **인터랙티브**: 마우스/터치로 Boid들과 상호작용
- 🎨 **깔끔한 UI**: 필요할 때만 나타나는 미니멀 인터페이스
- 📱 **반응형**: 다양한 화면 크기에 대응

## 📁 프로젝트 구조

```
changbal/
├── index.html          # 메인 HTML 파일
├── style.css           # 스타일시트
├── main.js             # 애플리케이션 초기화 및 메인 루프
├── boid.js             # Boid 클래스 (개별 입자)
├── flock.js            # Flock 클래스 (입자 집단 관리)
├── vector.js           # 2D 벡터 유틸리티
├── quadtree.js         # QuadTree 공간 분할 자료구조
└── README.md           # 프로젝트 문서
```

## 🛠️ 기술 스택

- **PixiJS 7.3.2**: 2D WebGL 렌더링 엔진
- **SimplexNoise 4.0.1**: 자연스러운 노이즈 생성
- **Google Fonts (Hahmlet)**: 한글 서체
- **Vanilla JavaScript**: 프레임워크 없이 순수 자바스크립트로 구현

## 🚀 실행 방법

### 1. 로컬 웹 서버 실행

이 프로젝트는 로컬 파일로 직접 열 수 없습니다. 간단한 웹 서버가 필요합니다.

**Python을 사용하는 경우:**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Node.js를 사용하는 경우:**
```bash
# http-server 설치 (전역)
npm install -g http-server

# 서버 실행
http-server -p 8000
```

**VS Code를 사용하는 경우:**
- Live Server 확장 프로그램 설치
- `index.html`에서 우클릭 → "Open with Live Server"

### 2. 브라우저에서 접속

```
http://localhost:8000
```

## 🎮 사용 방법

### 시작하기

처음 페이지에 진입하면 좌측 상단에 안내 메시지가 표시됩니다:
> "좌측상단에 마우스를 올려 단어를 바꿀수 있습니다."

이 메시지는 약 5초 후 자동으로 사라집니다.

### UI 표시

- **좌측 상단 마우스 오버**: 마우스를 화면 좌측 상단에 가져가면 UI 컨트롤이 부드럽게 나타납니다
  - 텍스트 입력 박스
  - 적용 버튼
  - FPS 및 Boid 수 정보

### 텍스트 변경

#### 1. **URL 파라미터로 설정** (추천)
URL에 `word` 파라미터를 추가하여 초기 단어를 설정할 수 있습니다:

```
http://localhost:8000/?word=창발
http://localhost:8000/?word=Hello
http://localhost:8000/?word=❤️
```

- URL을 공유하여 다른 사람과 같은 단어를 볼 수 있습니다
- 입력 박스에서 단어를 변경하면 URL도 자동으로 업데이트됩니다
- 브라우저의 뒤로가기/앞으로가기 버튼도 정상 작동합니다

#### 2. **UI로 변경**
   - 좌측 상단에 마우스를 올려 입력 박스를 표시합니다
   - 원하는 단어를 입력합니다 (최대 10자)
   - "적용" 버튼을 클릭하거나 Enter 키를 누르면 입력한 단어로 Boid가 재생성됩니다
   - 한글, 영문, 숫자, 이모지 등 다양한 문자를 사용할 수 있습니다

### 인터랙션

1. **마우스 클릭 & 드래그**: 
   - Boid 위를 클릭하고 드래그하면 고정된 Boid가 풀려나며 자유롭게 움직입니다
   - 움직이는 커서 근처의 Boid들은 회피하며 소용돌이치듯 흩어집니다

2. **터치 (모바일)**:
   - 화면을 터치하고 드래그하면 마우스와 동일하게 작동합니다

### 시각적 피드백

- **회색 Boid**: 초기 고정 상태의 Boid (텍스트 형태 유지)
- **색상 Boid**: 자유롭게 움직이는 Boid (팔레트 색상으로 변화)
- **육각형 앵커**: 자유로운 Boid의 원래 위치 표시

## 🧩 주요 컴포넌트 설명

### 1. **main.js**
애플리케이션의 진입점입니다.
- PixiJS 앱 초기화 및 설정
- 동적 텍스트 렌더링 시스템 (사용자 입력에 따라 재생성)
- URL 파라미터 처리 (`?word=...`)
- 텍스트의 픽셀을 샘플링하여 Boid 배치
- UI 컨트롤 (입력 박스, 적용 버튼, FPS 표시)
- URL과 입력창 동기화 시스템
- 마우스/터치 이벤트 처리
- 브라우저 히스토리 관리 (뒤로가기/앞으로가기)
- 고정 프레임레이트(60 FPS) 애니메이션 루프

### 2. **boid.js**
개별 Boid의 행동과 렌더링을 담당합니다.

**주요 기능:**
- **Flocking 알고리즘**: 
  - 분리(Separation): 너무 가까운 이웃을 피함
  - 정렬(Alignment): 이웃의 평균 속도에 맞춤
  - 결속(Cohesion): 이웃의 중심을 향함
- **터치 회피**: 마우스/터치 위치로부터 멀어지며 Curl Noise로 소용돌이 효과
- **트레일 효과**: 5개의 포인트로 꼬리 효과 생성
- **색상 전환**: 고정 상태에서 자유 상태로 전환 시 부드러운 색상 변화
- **Z-order 관리**: 자유로운 Boid를 고정된 Boid 위에 렌더링

### 3. **flock.js**
Boid 집단을 관리하는 컨테이너 클래스입니다.
- 모든 Boid의 업데이트 및 렌더링 조율
- QuadTree를 사용한 효율적인 이웃 탐색
- 터치 이벤트 처리 및 Boid 해제
- `clear()` 메서드로 Boid 초기화 지원

### 4. **quadtree.js**
공간 분할 자료구조로 성능 최적화를 담당합니다.
- 2D 공간을 재귀적으로 4분할
- O(log n) 시간 복잡도로 이웃 검색
- `queryRadius()`: 원형 범위 내 포인트 검색에 최적화

### 5. **vector.js**
2D 벡터 연산을 위한 유틸리티 클래스입니다.
- 벡터 덧셈, 뺄셈, 곱셈, 나눗셈
- 크기(magnitude) 및 정규화(normalize)
- 거리 계산 및 제한(limit)
- p5.js의 Vector 클래스를 대체

## ⚙️ 성능 최적화

이 프로젝트는 수천 개의 Boid를 60 FPS로 부드럽게 렌더링하기 위해 여러 최적화 기법을 사용합니다:

1. **QuadTree 공간 분할**: 
   - 브루트포스 O(n²) → O(n log n)으로 복잡도 감소
   - 이웃 탐색 반경을 50 픽셀로 제한

2. **벡터 재사용**: 
   - 임시 벡터 객체를 재사용하여 GC(Garbage Collection) 압력 감소
   - `tempVector1`, `tempVector2`, `tempVector3` 활용

3. **단일 Flocking 루프**: 
   - Separation, Alignment, Cohesion을 하나의 루프에서 처리
   - 불필요한 이웃 순회 제거

4. **제곱 거리 비교**: 
   - 가능한 경우 `Math.sqrt()` 호출 최소화
   - 거리 제곱(`distSq`)으로 비교

5. **고정 타임스텝**: 
   - 프레임레이트 변동에도 일관된 물리 시뮬레이션
   - 60 FPS 목표로 어큐뮬레이터 패턴 사용

6. **Z-order 업데이트 최소화**: 
   - 상태 변경 시에만 z-index 업데이트
   - `needsZOrderUpdate` 플래그 활용

## 🎨 커스터마이징

### 색상 팔레트 변경

`main-pixi.js`에서 팔레트를 수정할 수 있습니다:

```javascript
const palette = [
  "#f94144",  // 빨강
  "#f3722c",  // 주황
  "#f8961e",  // 노랑-주황
  "#f9844a",  // 살구색
  "#f9c74f",  // 노랑
  "#90be6d",  // 연두
  "#43aa8b",  // 청록
  "#4d908e",  // 청회색
  "#577590",  // 남색
  "#277da1"   // 파랑
];
```

### 텍스트 변경

이제 세 가지 방법으로 텍스트를 변경할 수 있습니다:

#### 방법 1: URL 파라미터 (추천)
```
http://localhost:8000/?word=원하는단어
```

#### 방법 2: UI 입력 박스
- 좌측 상단에 마우스를 올려 입력 박스를 표시
- 원하는 텍스트를 입력하고 "적용" 버튼 클릭 또는 Enter 키

#### 방법 3: 코드 수정 (기본값 변경)
`main.js`의 `getWordFromURL()` 함수에서 기본값을 수정하세요:

```javascript
function getWordFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const word = urlParams.get('word');
  return word && word.trim() ? word.trim() : '창발';  // 기본값 변경
}
```

### Boid 행동 파라미터 조정

`boid.js`에서 다양한 파라미터를 조정할 수 있습니다:

```javascript
// Boid 생성자
this.maxSpeed = 3 * 1.5;                      // 최대 속도
this.maxForce = 0.05 * 1.5;                   // 최대 힘 (조향력)
this.maxTrailDistance = 2 * scaleFactor;      // 트레일 포인트 간 최대 거리

// flock() 메서드
const desiredSeparation = 25.0;  // 분리 거리
const neighborDist = 50;         // 이웃 인식 거리

// avoidTouch() 메서드
const avoidRadius = 150;         // 터치 회피 반경
```

### Boid 밀도 조정

`main.js`의 `createBoidsFromText()` 함수에서 그리드 간격을 변경할 수 있습니다:

```javascript
const gridGap = 10 * scaleFactor;  // 작을수록 Boid가 많아짐
```

## 🧪 알고리즘 설명

### Boid 알고리즘 (Craig Reynolds, 1986)

Boid는 "bird-oid object"의 약자로, 새 떼의 집단 행동을 시뮬레이션하는 알고리즘입니다.

#### 세 가지 기본 규칙:

1. **분리 (Separation)**
   - 목적: 다른 Boid와 충돌 방지
   - 동작: 너무 가까운 이웃으로부터 멀어지는 힘
   - 우선순위: 가장 높음 (충돌 방지가 최우선)

2. **정렬 (Alignment)**
   - 목적: 집단이 같은 방향으로 이동
   - 동작: 이웃의 평균 속도와 일치하도록 조정
   - 범위: 50 픽셀 반경 내 이웃

3. **결속 (Cohesion)**
   - 목적: 집단을 유지
   - 동작: 이웃의 평균 위치(중심)를 향함
   - 효과: 흩어지지 않고 함께 움직임

### QuadTree 알고리즘

QuadTree는 2D 공간을 재귀적으로 4개의 사분면으로 나누는 트리 자료구조입니다.

**작동 원리:**
1. 각 노드는 최대 용량(capacity) 만큼의 포인트를 저장
2. 용량 초과 시 4개의 자식 노드로 세분화
3. 검색 시 관련 영역만 탐색하여 성능 향상

**시간 복잡도:**
- 삽입: O(log n)
- 검색: O(log n) (평균), O(n) (최악)
- 공간: O(n)

### Simplex Noise

Ken Perlin이 개발한 Perlin Noise의 개선된 버전으로, 자연스러운 랜덤 값을 생성합니다.

**사용 용도:**
- 고정된 Boid의 미세한 움직임
- 터치 회피 시 Curl Noise 기반 소용돌이 효과

## 🐛 알려진 이슈

- **모바일 성능**: 저사양 모바일 기기에서는 Boid 수가 많을 경우 프레임 드랍이 발생할 수 있습니다.
- **폰트 로딩**: 네트워크 상태에 따라 폰트 로딩이 지연될 수 있습니다.

## 📚 참고 자료

- [Craig Reynolds - Boids](https://www.red3d.com/cwr/boids/)
- [PixiJS Documentation](https://pixijs.com/)
- [The Nature of Code by Daniel Shiffman](https://natureofcode.com/)
- [QuadTree - Wikipedia](https://en.wikipedia.org/wiki/Quadtree)
- [Simplex Noise - Wikipedia](https://en.wikipedia.org/wiki/Simplex_noise)

## 📄 라이센스

이 프로젝트는 개인 프로젝트로 자유롭게 사용 및 수정할 수 있습니다.

## 👤 작성자

doodlefingers

---

**창발(Emergence)**: 하위 계층에는 없는 특성이나 행동이 상위 계층에서 돌연히 출현하는 현상. 간단한 규칙을 따르는 개체들이 모여 복잡하고 예측하기 어려운 집단 행동을 만들어냅니다.

