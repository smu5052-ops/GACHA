# 에그 뽑기

에그를 뽑으면 **에그 → 등급 → 레어도 → 에그 인첸트 → 축복** 순서로 하나씩 정해지고, 마지막에 점수가 계산되는 웹 게임이에요. 설치나 빌드 없이 `index.html`만 열면 돌아가요.

## 폴더 구조

| 파일 | 내용 |
| --- | --- |
| `index.html` | 화면 뼈대 |
| `style.css` | 디자인과 이펙트 |
| `script.js` | 뽑기, 점수 계산, 에그 보관함 |
| `characters.js` | **캐릭터 목록** (캐릭터를 추가할 때 여기만 고치면 돼요) |
| `config.js` | **확률과 점수 설정** |
| `assets/characters/` | 캐릭터 이미지 |

## 로컬에서 열기

`index.html`을 더블클릭하면 브라우저에서 열려요.

## GitHub에 올리기

1. GitHub에서 새 저장소(repository)를 만들어요. 이름은 `egg-gacha` 같은 걸로 하면 돼요.
2. 이 폴더에서 아래 명령을 실행해요. 주소는 본인 저장소 주소로 바꿔 주세요.

```bash
git init
git add .
git commit -m "에그 뽑기 첫 올리기"
git branch -M main
git remote add origin https://github.com/내아이디/egg-gacha.git
git push -u origin main
```

명령어가 어렵다면 저장소 페이지에서 **Add file → Upload files**를 눌러 이 폴더 안의 파일과 `assets` 폴더를 통째로 끌어다 놓아도 돼요.

## 웹에서 바로 플레이하게 하기 (GitHub Pages)

1. 저장소의 **Settings → Pages**로 가요.
2. **Source**를 `Deploy from a branch`로 두고, Branch를 `main`, 폴더를 `/ (root)`로 골라 **Save**를 눌러요.
3. 1~2분 뒤 `https://내아이디.github.io/egg-gacha/` 주소로 열려요.

## 캐릭터 추가하기

1. 이미지를 `assets/characters/`에 넣어요. 정사각형이고 얼굴이 가운데에 오면 가장 예뻐요. 용량은 가로세로 300px 안팎이면 충분해요.
2. `characters.js`에 한 줄을 추가해요.

```js
{ id: 'newchar', name: '새캐릭터', hue: 200, img: 'assets/characters/newchar.jpg' },
```

`id`는 에그 보관함 저장에 쓰이니 한 번 정하면 바꾸지 마세요.

## 확률과 점수 바꾸기

`config.js`를 열어서 숫자를 고쳐요.

- `w`는 뽑힐 비율이에요. 합이 100이면 그대로 %로 보여요.
- 점수는 `(등급 점수 + 레어도 점수) × 에그 인첸트 배수 × 축복 배수`로 계산돼요.

## 저장 방식

에그 보관함은 브라우저의 localStorage에 저장돼요. 같은 브라우저에서는 새로고침해도 남지만, 다른 기기나 브라우저와는 공유되지 않아요.
