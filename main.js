/**
 * Text to Boids - 메인 애플리케이션
 * 
 * 텍스트를 Boid(입자) 집단으로 변환하여
 * 창발적 집단 행동을 시각화하는 인터랙티브 아트워크
 * 
 * 주요 기능:
 * - 동적 텍스트 입력 및 Boid 생성
 * - URL 파라미터를 통한 텍스트 공유
 * - Flocking 알고리즘 기반 집단 행동
 * - 터치 인터랙션
 * - 실시간 FPS 모니터링
 */

// IIFE (즉시 실행 함수)로 전역 스코프 오염 방지
(async function() {
  try {
    console.log('애플리케이션 시작...');
    
    // ==================== 설정 ====================
    const resolution = 40;  // 미사용 (추후 확장용)
    
    // 색상 팔레트 (자유 Boid의 색상)
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
    
    // ==================== PixiJS 애플리케이션 생성 ====================
    console.log('PixiJS 앱 생성 중...');
    const app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x1e1e1e,  // 어두운 회색 배경
      antialias: true,             // 안티앨리어싱 활성화 (부드러운 선)
      resolution: window.devicePixelRatio || 1,  // 레티나 디스플레이 대응
      autoDensity: true            // 자동 밀도 조정
    });

    // Canvas를 DOM에 추가
    document.getElementById('canvas-container').appendChild(app.view);
    console.log('Canvas가 DOM에 추가됨');

    // ==================== 화면 방향 및 크기 계산 ====================
    const isVertical = window.innerWidth < window.innerHeight;  // 세로 모드 여부
    const shortSide = isVertical ? window.innerWidth : window.innerHeight;
    const longSide = isVertical ? window.innerHeight : window.innerWidth;
    let scaleFactor;


    // ==================== PixiJS 컨테이너 설정 ====================
    // 모든 Boid를 담을 단일 컨테이너 (Z-index 정렬 사용)
    const boidContainer = new PIXI.Container();
    boidContainer.sortableChildren = true;  // Z-index 정렬 활성화
    app.stage.addChild(boidContainer);

    // ==================== Flock 초기화 ====================
    let flock = new Flock(boidContainer);

    // ==================== UI 요소 ====================
    const infoText = document.getElementById('info-text');          // FPS 정보 표시
    const inputContainer = document.getElementById('text-input-container');  // UI 컨테이너

    // FPS 계산용 변수
    let lastTime = performance.now();
    let frames = 0;
    let fps = 0;

    // 마우스 위치 추적 (UI 표시용)
    let currentMouseX = -1000;
    let currentMouseY = -1000;

    // ==================== Simplex Noise 초기화 ====================
    console.log('Noise 초기화 중...');
    const simplex = typeof SimplexNoise !== 'undefined' ? new SimplexNoise() : null;
    if (!simplex) {
      console.warn('SimplexNoise를 사용할 수 없습니다. Math.random() 사용');
    }

    // ==================== 폰트 로딩 ====================
    console.log('폰트 로딩 중...');
    
    try {
      await document.fonts.ready;
      // Hahmlet 폰트 강제 로드
      await document.fonts.load('900 1em Hahmlet');
      console.log('폰트 로딩 완료');
    } catch(e) {
      console.warn('폰트 로딩 오류:', e);
    }
    
    // 폰트 렌더링 안정화를 위한 대기
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // ==================== 오프스크린 Canvas (텍스트 렌더링용) ====================
    const textCanvas = document.createElement('canvas');
    textCanvas.width = app.screen.width;
    textCanvas.height = app.screen.height;
    const canvasContext = textCanvas.getContext('2d');

    /**
     * 텍스트를 Canvas에 렌더링하고 이미지 데이터 반환
     * @param {string} inputText - 렌더링할 텍스트
     * @returns {ImageData} 렌더링된 이미지 데이터
     */
    function renderTextToCanvas(inputText) {
      // Canvas 초기화 (검은 배경)
      canvasContext.fillStyle = 'black';
      canvasContext.fillRect(0, 0, textCanvas.width, textCanvas.height);
      
      // ===== 동적 폰트 크기 계산 =====
      // 화면 방향과 텍스트 길이에 따라 폰트 크기 조정
      let fontSize = isVertical ? shortSide * 0.6 : shortSide / inputText.length;
      
      // 세로 모드에서 텍스트가 화면을 벗어나면 크기 축소
      if(isVertical && shortSide * 0.6 * inputText.length > longSide) {
        fontSize = longSide / inputText.length;
      }

      fontSize *= 0.9;

      // 스케일 팩터 계산
      scaleFactor = 700 / fontSize / window.devicePixelRatio;

      
      canvasContext.font = `700 ${fontSize}px 'Hahmlet', serif`;
      canvasContext.fillStyle = 'white';
      canvasContext.textAlign = 'center';
      canvasContext.textBaseline = 'middle';
      
      // ===== 텍스트를 세로로 배치 =====
      // 각 문자 사이에 줄바꿈 추가 (세로 배치)
      const text = inputText.split('').join('\n');
      const lines = text.split('\n');
      const lineHeight = fontSize * 1;
      const startY = app.screen.height / 2 - (lines.length - 1) * lineHeight / 2;
      
      // 각 줄(문자) 렌더링
      lines.forEach((line, lineIndex) => {
        canvasContext.fillText(line, textCanvas.width / 2, startY + lineIndex * lineHeight);
      });
      
      return canvasContext.getImageData(0, 0, textCanvas.width, textCanvas.height);
    }

    /**
     * 특정 픽셀이 밝은지 확인 (텍스트 영역 판별)
     * @param {ImageData} imageData - 이미지 데이터
     * @param {number} x - X 좌표
     * @param {number} y - Y 좌표
     * @returns {boolean} 밝으면 true
     */
    function isBright(imageData, x, y) {
      const pixelIndex = (Math.floor(y) * textCanvas.width + Math.floor(x)) * 4;
      const red = imageData.data[pixelIndex];
      const green = imageData.data[pixelIndex + 1];
      const blue = imageData.data[pixelIndex + 2];
      const brightness = (red + green + blue) / 3;
      return brightness > 0;  // 검은색(0)이 아니면 true
    }

    /**
     * 삼각형 그리드 생성
     * 일반 격자보다 균일한 분포를 위해 사용
     * 
     * @param {Function} callback - 각 그리드 포인트마다 호출될 함수
     * @param {number} gap - 그리드 간격
     */
    function gridTriangle(callback, gap) {
      // 삼각형 그리드의 세로 간격 (정삼각형 높이)
      const verticalGap = Math.sqrt(3) / 2 * gap;
      
      for (let y = 0; y <= app.screen.height; y += verticalGap) {
        for (let x = 0; x <= app.screen.width; x += gap) {
          const rowIndex = Math.floor(y / verticalGap);
          // 홀수 행은 반칸 오프셋 (벽돌 쌓기 패턴)
          const offsetX = (rowIndex % 2 === 0) ? 0 : gap / 2;
          callback(x + offsetX, y);
        }
      }
    }

    /**
     * 텍스트로부터 Boid 생성
     * @param {string} inputText - 입력 텍스트
     */
    function createBoidsFromText(inputText) {
      console.log(`텍스트로부터 Boid 생성: "${inputText}"`);
      
      // 기존 Boid 제거
      flock.clear();
      
      // 텍스트 렌더링 및 이미지 데이터 추출
      const imageData = renderTextToCanvas(inputText);
      
      // ===== Boid 생성 =====
      const gridGap = 10 * scaleFactor;  // 그리드 간격
      gridTriangle((x, y) => {
        // 화면 범위 내이고, 밝은 픽셀(텍스트 영역)에만 Boid 생성
        if (x >= 0 && x < textCanvas.width && y >= 0 && y < textCanvas.height) {
          if (isBright(imageData, x, y)) {
            const boid = new Boid(x, y, scaleFactor, palette);
            flock.addBoid(boid);
          }
        }
      }, gridGap);
      
      console.log(`${flock.boids.length}개의 Boid 생성 완료`);
    }

    /**
     * URL에서 단어 파라미터 읽기
     * @returns {string} URL의 word 파라미터 또는 기본값 '창발'
     */
    function getWordFromURL() {
      const urlParams = new URLSearchParams(window.location.search);
      const word = urlParams.get('word');
      return word && word.trim() ? word.trim() : '창발';
    }

    /**
     * URL에 단어 파라미터 업데이트 (페이지 새로고침 없이)
     * @param {string} word - 업데이트할 단어
     */
    function updateURL(word) {
      const url = new URL(window.location);
      url.searchParams.set('word', word);
      window.history.replaceState({}, '', url);
    }

    // ==================== 초기화 ====================
    // URL 파라미터 또는 기본값으로 Boid 생성
    const initialWord = getWordFromURL();
    createBoidsFromText(initialWord);

    // ===== 환영 메시지 제거 =====
    const welcomeMessage = document.getElementById('welcome-message');
    if (welcomeMessage) {
      setTimeout(() => {
        welcomeMessage.remove();
      }, 5000); // 5초 후 제거 (CSS 애니메이션 시간과 동일)
    }

    // ==================== 인터랙션 변수 ====================
    let isMousePressed = false;  // 마우스/터치 다운 상태
    let touchPosition = null;     // 현재 터치 위치

    // ==================== 입력 컨트롤 ====================
    const textInput = document.getElementById('text-input');
    const applyButton = document.getElementById('apply-button');
    
    // 입력창 초기값 설정
    textInput.value = initialWord;
    
    /**
     * 새 텍스트 적용 (Boid 재생성 및 URL 업데이트)
     */
    function applyNewText() {
      const inputText = textInput.value.trim();
      if (inputText) {
        createBoidsFromText(inputText);
        updateURL(inputText);
      }
    }
    
    // 적용 버튼 클릭 이벤트
    applyButton.addEventListener('click', (e) => {
      e.stopPropagation();  // 이벤트 전파 중단
      applyNewText();
    });
    
    // Enter 키로 적용
    textInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        applyNewText();
      }
    });

    // ===== UI 컨테이너 인터랙션 =====
    // UI 위에서는 Boid 인터랙션 비활성화
    inputContainer.addEventListener('mouseenter', () => {
      isMousePressed = false;
      touchPosition = null;
    });

    // UI 위에서도 마우스 위치 추적 (UI 표시용)
    inputContainer.addEventListener('mousemove', (e) => {
      const rect = app.view.getBoundingClientRect();
      currentMouseX = e.clientX - rect.left;
      currentMouseY = e.clientY - rect.top;
    });
    
    // ==================== Canvas 마우스 이벤트 ====================
    
    // 마우스 다운
    app.view.addEventListener('mousedown', (e) => {
      isMousePressed = true;
      const rect = app.view.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (app.screen.width / rect.width);
      const mouseY = (e.clientY - rect.top) * (app.screen.height / rect.height);
      touchPosition = { x: mouseX, y: mouseY };
    });
    
    // 마우스 업
    app.view.addEventListener('mouseup', () => {
      isMousePressed = false;
      touchPosition = null;
    });
    
    // 마우스 이동
    app.view.addEventListener('mousemove', (e) => {
      const rect = app.view.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (app.screen.width / rect.width);
      const mouseY = (e.clientY - rect.top) * (app.screen.height / rect.height);
      
      // UI 표시를 위한 마우스 위치 업데이트
      currentMouseX = mouseX;
      currentMouseY = mouseY;
      
      // 마우스 다운 상태이면 터치 위치 업데이트
      if (isMousePressed) {
        touchPosition = { x: mouseX, y: mouseY };
      }
    });

    // 마우스가 화면을 벗어남
    app.view.addEventListener('mouseleave', () => {
      currentMouseX = -1000;  // UI 숨김
      currentMouseY = -1000;
    });

    // ==================== 터치 이벤트 (모바일) ====================
    
    app.view.addEventListener('touchstart', (e) => {
      isMousePressed = true;
      if (e.touches.length > 0) {
        const rect = app.view.getBoundingClientRect();
        const touch = e.touches[0];
        const touchX = (touch.clientX - rect.left) * (app.screen.width / rect.width);
        const touchY = (touch.clientY - rect.top) * (app.screen.height / rect.height);
        currentMouseX = touchX;
        currentMouseY = touchY;
        touchPosition = { x: touchX, y: touchY };
      }
      e.preventDefault();  // 기본 터치 동작 방지
    });
    
    app.view.addEventListener('touchend', () => {
      isMousePressed = false;
      touchPosition = null;
      currentMouseX = -1000;
      currentMouseY = -1000;
    });
    
    app.view.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const rect = app.view.getBoundingClientRect();
        const touch = e.touches[0];
        const touchX = (touch.clientX - rect.left) * (app.screen.width / rect.width);
        const touchY = (touch.clientY - rect.top) * (app.screen.height / rect.height);
        currentMouseX = touchX;
        currentMouseY = touchY;
        
        if (isMousePressed) {
          touchPosition = { x: touchX, y: touchY };
        }
        e.preventDefault();
      }
    });

    // ==================== 애니메이션 루프 ====================
    console.log('애니메이션 루프 시작...');
    let frameCount = 0;
    let lastUpdateTime = performance.now();
    const targetFrameTime = 1000 / 60; // 60 FPS 목표
    let accumulator = 0;  // 고정 타임스텝용 어큐뮬레이터
    
    // PixiJS Ticker에 업데이트 함수 등록
    app.ticker.add(() => {
      // ===== FPS 계산 및 표시 =====
      frames++;
      const currentTime = performance.now();
      if (currentTime >= lastTime + 1000) {  // 1초마다 업데이트
        fps = Math.round((frames * 1000) / (currentTime - lastTime));
        infoText.textContent = `FPS: ${fps} | Boids: ${flock.boids.length}`;
        frames = 0;
        lastTime = currentTime;
      }
      
      // ===== UI 표시 영역 체크 =====
      // 좌측 상단 300x150 픽셀 영역에 마우스가 있으면 UI 표시
      const showUIArea = 300;
      const showUIHeight = 150;
      if (currentMouseX >= 0 && currentMouseX <= showUIArea && 
          currentMouseY >= 0 && currentMouseY <= showUIHeight) {
        inputContainer.classList.add('visible');
      } else {
        inputContainer.classList.remove('visible');
      }
      
      // ===== 고정 타임스텝 업데이트 =====
      // 프레임레이트에 관계없이 일정한 물리 시뮬레이션
      const now = performance.now();
      const deltaTime = now - lastUpdateTime;
      lastUpdateTime = now;
      accumulator += deltaTime;
      
      // 60 FPS 고정 레이트로 물리 업데이트
      while (accumulator >= targetFrameTime) {
        frameCount++;
        
        // 마우스 다운 상태이면 터치 처리
        if (isMousePressed && touchPosition) {
          flock.handleTouch(touchPosition.x, touchPosition.y);
        }
        
        // Flock 업데이트 (모든 Boid 업데이트 및 렌더링)
        flock.run(app.screen.width, app.screen.height, frameCount, simplex, touchPosition);
        accumulator -= targetFrameTime;
      }
    });

    // ==================== 윈도우 리사이즈 처리 ====================
    window.addEventListener('resize', () => {
      app.renderer.resize(window.innerWidth, window.innerHeight);
    });

    // ==================== 브라우저 히스토리 처리 ====================
    // 뒤로가기/앞으로가기 버튼으로 단어 변경
    window.addEventListener('popstate', () => {
      const word = getWordFromURL();
      textInput.value = word;
      createBoidsFromText(word);
    });

    console.log('애플리케이션이 성공적으로 시작되었습니다!');

  } catch (error) {
    // 에러 발생 시 콘솔에 상세 정보 출력
    console.error('애플리케이션 초기화 오류:', error);
    console.error('스택 추적:', error.stack);
  }
})();
