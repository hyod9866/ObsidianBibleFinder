import {
	App,
	Editor,
	ItemView,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	SuggestModal,
	TFile,
	WorkspaceLeaf
} from "obsidian";
import * as child_process from "child_process";
import * as path from "path";

// 성경 약칭 매핑 테이블
const BIBLE_BOOKS: { [key: string]: string } = {
	"창": "창세기", "창세": "창세기",
	"출": "출애굽기", "출애": "출애굽기",
	"레": "레위기", "레위": "레위기",
	"민": "민수기", "민수": "민수기",
	"신": "신명기", "신명": "신명기",
	"수": "여호수아", "여호": "여호수아", "여": "여호수아",
	"삿": "사사기", "사사": "사사기",
	"룻": "룻기",
	"삼상": "사무엘상", "삼하": "사무엘하", "삼일": "사무엘상", "삼이": "사무엘하",
	"왕상": "열왕기상", "왕하": "열왕기하", "왕일": "열왕기상", "왕이": "열왕기하",
	"대상": "역대기상", "대하": "역대기하", "대일": "역대기상", "대이": "역대기하",
	"스": "에스라", "에스라": "에스라",
	"느": "느헤미야", "느헤": "느헤미야",
	"에": "에스더", "에스더": "에스더",
	"욥": "욥기",
	"시": "시편", "시편": "시편",
	"잠": "잠언", "잠언": "잠언",
	"전": "전도서", "전도": "전도서",
	"아": "아가", "아가": "아가",
	"사": "이사야", "이사": "이사야",
	"렘": "예레미야", "예레": "예레미야",
	"애": "예레미야 애가", "예레미야애가": "예레미야 애가", "렘애": "예레미야 애가",
	"겔": "에스겔", "에스겔": "에스겔",
	"단": "다니엘", "다니": "다니엘",
	"호": "호세아", "호세": "호세아",
	"욜": "요엘",
	"암": "아모스",
	"옵": "오바디야", "오바": "오바디야",
	"욘": "요나",
	"미": "미가",
	"나": "나훔",
	"합": "하박국", "하박": "하박국",
	"습": "스바냐",
	"학": "학개",
	"슥": "스가랴", "스가": "스가랴",
	"말": "말라기", "말라": "말라기",
	"마": "마태복음", "마태": "마태복음",
	"막": "마가복음", "마가": "마가복음",
	"눅": "누가복음", "누가": "누가복음", "누": "누가복음",
	"요": "요한복음", "요한": "요한복음",
	"행": "사도행전", "사도": "사도행전",
	"롬": "로마서", "로마": "로마서",
	"고전": "고린도전서", "고후": "고린도후서", "고린도전": "고린도전서", "고린도후": "고린도후서",
	"갈": "갈라디아서", "갈라": "갈라디아서",
	"엡": "에베소서", "에베": "에베소서",
	"빌": "빌립보서", "빌립": "빌립보서",
	"골": "골로새서", "골로": "골로새서",
	"살전": "데살로니가전서", "살후": "데살로니가후서", "데살로니가전": "데살로니가전서", "데살로니가후": "데살로니가후서",
	"딤전": "디모데전서", "딤후": "디모데후서", "디모데전": "디모데전서", "디모데후": "디모데후서",
	"딛": "디도서", "디도": "디도서",
	"몬": "빌레몬서", "빌레": "빌레몬서",
	"히": "히브리서", "히브": "히브리서",
	"약": "야고보서", "야고": "야고보서",
	"cmd": "요한계시록",
	"벧전": "베드로전서", "벧후": "베드로후서", "베드로전": "베드로전서", "베드로후": "베드로후서",
	"요일": "요한1서", "요이": "요한2서", "요삼": "요한3서", "요한일": "요한1서", "요한이": "요한2서", "요한삼": "요한3서",
	"유": "유다서",
	"계": "요한계시록", "계시": "요한계시록"
};

// 성경 66권 정렬 순서
const BIBLE_ORDER = [
	"창", "출", "레", "민", "신", "수", "삿", "룻", "삼상", "삼하", "왕상", "왕하", "대상", "대하", "스", "느", "에", "욥", "시", "잠", "전", "아",
	"사", "렘", "애", "겔", "단", "호", "욜", "암", "옵", "욘", "미", "나", "합", "습", "학", "슥", "말",
	"마", "막", "눅", "요", "행", "롬", "고전", "고후", "갈", "엡", "빌", "골", "살전", "살후", "딤전", "딤후", "딛", "몬", "히", "약", "벧전", "벧후", "요일", "요이", "요삼", "유", "계"
];

const BIBLE_ORDER_MAP = new Map<string, number>(BIBLE_ORDER.map((b, i) => [b, i]));

// 한글 성경 정식 명칭 매핑
const BIBLE_FULL_NAMES: { [key: string]: string } = {
	"창": "창세기", "출": "출애굽기", "레": "레위기", "민": "민수기", "신": "신명기",
	"수": "여호수아", "삿": "사사기", "룻": "룻기", "삼상": "사무엘상", "삼하": "사무엘하",
	"왕상": "열왕기상", "왕하": "열왕기하", "대상": "역대기상", "대하": "역대기하",
	"스": "에스라", "느": "느헤미야", "에": "에스더", "욥": "욥기", "시": "시편",
	"잠": "잠언", "전": "전도서", "아": "아가", "사": "이사야", "렘": "예레미야",
	"애": "예레미야 애가", "겔": "에스겔", "단": "다니엘", "호": "호세아", "욜": "요엘",
	"암": "아모스", "옵": "오바디야", "욘": "요나", "미": "미가", "나": "나훔",
	"합": "하박국", "습": "스바냐", "학": "학개", "슥": "스가랴", "말": "말라기",
	"마": "마태복음", "막": "마가복음", "눅": "누가복음", "요": "요한복음", "행": "사도행전",
	"롬": "로마서", "고전": "고린도전서", "고후": "고린도후서", "갈": "갈라디아서",
	"엡": "에베소서", "빌": "빌립보서", "골": "골로새서", "살전": "데살로니가전서",
	"살후": "데살로니가후서", "딤전": "디모데전서", "딤후": "디모데후서", "딛": "디도서",
	"몬": "빌레몬서", "히": "히브리서", "약": "야고보서", "벧전": "베드로전서",
	"벧후": "베드로후서", "요일": "요한1서", "요이": "요한2서", "요삼": "요한3서",
	"유": "유다서", "계": "요한계시록"
};

// 영문 성경 정식 명칭 및 약칭 매핑 테이블
const BIBLE_ENGLISH_NAMES: { [key: string]: { full: string, short: string } } = {
	"창": { full: "Genesis", short: "Gen" },
	"출": { full: "Exodus", short: "Exo" },
	"레": { full: "Leviticus", short: "Lev" },
	"민": { full: "Numbers", short: "Num" },
	"신": { full: "Deuteronomy", short: "Deut" },
	"수": { full: "Joshua", short: "Josh" },
	"삿": { full: "Judges", short: "Judg" },
	"룻": { full: "Ruth", short: "Ruth" },
	"삼상": { full: "1 Samuel", short: "1Sam" },
	"삼하": { full: "2 Samuel", short: "2Sam" },
	"왕상": { full: "1 Kings", short: "1Ki" },
	"왕하": { full: "2 Kings", short: "2Ki" },
	"대상": { full: "1 Chronicles", short: "1Chr" },
	"대하": { full: "2 Chronicles", short: "2Chr" },
	"스": { full: "Ezra", short: "Ezr" },
	"느": { full: "Nehemiah", short: "Neh" },
	"에": { full: "Esther", short: "Esth" },
	"욥": { full: "Job", short: "Job" },
	"시": { full: "Psalms", short: "Psa" },
	"잠": { full: "Proverbs", short: "Prov" },
	"전": { full: "Ecclesiastes", short: "Eccl" },
	"아": { full: "Song of Solomon", short: "Song" },
	"사": { full: "Isaiah", short: "Isa" },
	"렘": { full: "Jeremiah", short: "Jer" },
	"애": { full: "Lamentations", short: "Lam" },
	"겔": { full: "Ezekiel", short: "Eze" },
	"단": { full: "Daniel", short: "Dan" },
	"호": { full: "Hosea", short: "Hos" },
	"욜": { full: "Joel", short: "Joel" },
	"암": { full: "Amos", short: "Amo" },
	"옵": { full: "Obadiah", short: "Obad" },
	"욘": { full: "Jonah", short: "Jonah" },
	"미": { full: "Micah", short: "Mic" },
	"나": { full: "Nahum", short: "Nah" },
	"합": { full: "Habakkuk", short: "Hab" },
	"습": { full: "Zephaniah", short: "Zeph" },
	"학": { full: "Haggai", short: "Hag" },
	"슥": { full: "Zechariah", short: "Zech" },
	"말": { full: "Malachi", short: "Mal" },
	"마": { full: "Matthew", short: "Matt" },
	"막": { full: "Mark", short: "Mark" },
	"눅": { full: "Luke", short: "Luke" },
	"요": { full: "John", short: "John" },
	"행": { full: "Acts", short: "Acts" },
	"롬": { full: "Romans", short: "Rom" },
	"고전": { full: "1 Corinthians", short: "1Cor" },
	"고후": { full: "2 Corinthians", short: "2Cor" },
	"갈": { full: "Galatians", short: "Gal" },
	"엡": { full: "Ephesians", short: "Eph" },
	"빌": { full: "Philippians", short: "Phil" },
	"골": { full: "Colossians", short: "Col" },
	"살전": { full: "1 Thessalonians", short: "1Thess" },
	"살후": { full: "2 Thessalonians", short: "2Thess" },
	"딤전": { full: "1 Timothy", short: "1Tim" },
	"딤후": { full: "2 Timothy", short: "2Tim" },
	"딛": { full: "Titus", short: "Tit" },
	"몬": { full: "Philemon", short: "Philem" },
	"히": { full: "Hebrews", short: "Heb" },
	"약": { full: "James", short: "Jas" },
	"벧전": { full: "1 Peter", short: "1Pet" },
	"벧후": { full: "2 Peter", short: "2Pet" },
	"요일": { full: "1 John", short: "1John" },
	"요이": { full: "2 John", short: "2John" },
	"요삼": { full: "3 John", short: "3John" },
	"유": { full: "Jude", short: "Jude" },
	"계": { full: "Revelation", short: "Rev" }
};

// 영문 성경 번역본 정식 명칭 매핑 테이블
const ENGLISH_VERSION_FULL_NAMES: { [key: string]: string } = {
	"NKJV": "New King James Version",
	"NIV2011": "New International Version 2011",
	"NIV1984": "New International Version 1984",
	"NASB": "New American Standard Bible",
	"MSG": "The Message",
	"ISV": "International Standard Version",
	"HCSB": "Holman Christian Standard Bible",
	"GNT": "Good News Translation",
	"ESV": "English Standard Version",
	"KJV": "King James Version",
	"NRSV": "New Revised Standard Version",
	"NLT": "New Living Translation"
};

// 약칭 정규화 함수 (영문 btx 고유 약칭도 완벽히 지원하도록 개선)
function getStandardBookCode(bookText: string, customMap: { [key: string]: string } = {}): string {
	const trimmed = bookText.trim();
	if (BIBLE_ORDER_MAP.has(trimmed)) {
		return trimmed;
	}
	if (customMap[trimmed]) {
		const target = customMap[trimmed];
		if (BIBLE_ORDER_MAP.has(target)) return target;
	}
	
	// 영문 btx 전용 약칭 -> 한글 표준 약칭 매핑 사전
	const lowerBook = trimmed.toLowerCase();
	const engBtxLowerMap: { [key: string]: string } = {
		"gn": "창", "ex": "출", "lv": "레", "nm": "민", "dt": "신",
		"js": "수", "jg": "삿", "rt": "룻", "1s": "삼상", "2s": "삼하",
		"1k": "왕상", "2k": "왕하", "1c": "대상", "2c": "대하", "ez": "스",
		"ne": "느", "es": "에", "jb": "욥", "ps": "시", "pr": "잠",
		"ec": "전", "sg": "아", "is": "사", "jr": "렘", "lm": "애",
		"ek": "겔", "dn": "단", "hs": "호", "jl": "욜", "am": "암",
		"ob": "옵", "jn": "욘", "mi": "미", "na": "na", "hb": "합",
		"zp": "습", "hg": "학", "zc": "슥", "ml": "말",
		"mt": "마", "mk": "막", "lk": "눅", "jo": "요", "john": "요",
		"ac": "행", "ro": "롬", "1co": "고전", "2co": "고후", "ga": "갈",
		"ep": "엡", "ph": "빌", "col": "골", "1th": "살전", "2th": "살후",
		"1ti": "딤전", "2ti": "딤후", "tit": "딛", "phm": "몬", "he": "히",
		"jas": "약", "1pe": "벧전", "2pe": "벧후", "1jn": "요일", "2jn": "요이",
		"3jn": "요삼", "jud": "유", "re": "계", "rev": "계", "gen": "창", "exo": "출", "lev": "레"
	};
	
	if (engBtxLowerMap[lowerBook]) {
		return engBtxLowerMap[lowerBook];
	}

	const mapped = BIBLE_BOOKS[trimmed];
	if (mapped) {
		for (const [key, val] of Object.entries(BIBLE_BOOKS)) {
			if (val === mapped && BIBLE_ORDER_MAP.has(key)) {
				return key;
			}
		}
	}
	for (const [key, val] of Object.entries(BIBLE_BOOKS)) {
		if (val === trimmed && BIBLE_ORDER_MAP.has(key)) {
			return key;
		}
	}
	return trimmed;
}

// 괄호 래핑 헬퍼 함수
function wrapBracket(text: string, bracketOption: string): string {
	if (!bracketOption || bracketOption === "none") return text;
	if (bracketOption === "()") return `(${text})`;
	if (bracketOption === "[]") return `[${text}]`;
	if (bracketOption === "{}") return `{${text}}`;
	if (bracketOption === "<>") return `<${text}>`;
	return text;
}

// 데이터 모델 정의
interface Verse {
	book: string;
	bookFullName: string;
	rawBook: string;
	chapter: number;
	verse: number;
	content: string;
}

interface BibleVersion {
	id: string;
	name: string;
	verses: Verse[];
	index: Map<string, Map<number, Map<number, Verse>>>;
}

interface BethlehemBibleSettings {
	bibleFolder: string;
	defaultVersion: string;
	defaultEnglishVersion: string;
	insertTemplate: string;
	multiVerseJoin: "newline" | "space";
	customBookMapJson: string;

	// 추가된 성경절 괄호 설정
	bracketBook: string;
	bracketVerse: string;
	bracketContent: string;

	// 추가된 찾은 낱말 하이라이트 글자색
	colorWord1: string;
	colorWord2: string;
	colorWord3: string;

	// 추가된 성경절 형식 설정
	verseFormatOption: "include-num" | "newline-num" | "no-num" | "full-ref";
	refLocation: "front" | "back";

	// 추가된 빈 줄에 번역판명 추가 설정
	addVersionNameSearch: boolean;
	addVersionNameReplace: boolean;

	// 추가된 성경 책 이름 표기 형식 설정
	englishBookFormat: "full" | "short" | "raw" | "korean";
	koreanBookFormat: "full" | "short" | "raw";

	// 추가된 성경 보기 모드 설정
	bibleDisplayMode: "korean" | "english" | "both";

	// 스트롱코드 원어 보기 설정
	bethlehemWinFolder: string;
	selectedStrongBibleKor: string;
	selectedStrongBibleEng: string;
	selectedStrongLexiconKor: string;
	selectedStrongLexiconEng: string;
	strongDisplayMode: "korean" | "english" | "both";
	strongAutoSync: boolean;
}

const DEFAULT_SETTINGS: BethlehemBibleSettings = {
	bibleFolder: "_bibles",
	defaultVersion: "",
	defaultEnglishVersion: "",
	insertTemplate: "[{version}] {book} {chapter}:{verse} {content}",
	multiVerseJoin: "newline",
	customBookMapJson: "{}",

	bracketBook: "none",
	bracketVerse: "none",
	bracketContent: "none",

	colorWord1: "red",
	colorWord2: "blue",
	colorWord3: "green",

	verseFormatOption: "include-num",
	refLocation: "front",

	addVersionNameSearch: false,
	addVersionNameReplace: false,

	englishBookFormat: "full",
	koreanBookFormat: "full",

	bibleDisplayMode: "korean",

	bethlehemWinFolder: "C:\\Users\\D-kanghyodgeun\\OneDrive\\Documents\\BethlehemWin",
	selectedStrongBibleKor: "개역한글S.sdb",
	selectedStrongBibleEng: "KJV_S.sdb",
	selectedStrongLexiconKor: "HebGrkKo.dct",
	selectedStrongLexiconEng: "HebGrkEn.dct",
	strongDisplayMode: "both",
	strongAutoSync: false
};

export default class BethlehemBiblePlugin extends Plugin {
	settings!: BethlehemBibleSettings;
	bibles: Map<string, BibleVersion> = new Map();
	customBookMap: { [key: string]: string } = {};

	async onload() {
		await this.loadSettings();

		try {
			this.customBookMap = JSON.parse(this.settings.customBookMapJson);
		} catch (e) {
			this.customBookMap = {};
		}

		await this.loadBibleData();

		// 성경 데이터 새로고침 커맨드
		this.addCommand({
			id: "reload-bible-data",
			name: "성경 데이터 새로고침 (Reload Bible Data)",
			callback: async () => {
				await this.loadBibleData();
				this.updateStatusBar();
				new Notice(`성경 데이터 새로고침 완료! (로드된 버전: ${this.bibles.size}개)`);
			}
		});

		// Bible Finder 설정 화면 바로 열기 커맨드
		this.addCommand({
			id: "open-bible-finder-settings",
			name: "설정 화면 열기 (Open Settings)",
			callback: () => {
				try {
					// @ts-ignore
					this.app.setting.open();
					// @ts-ignore
					this.app.setting.openTabById(this.manifest.id);
				} catch (e) {
					new Notice("설정 화면을 여는 도중 오류가 발생했습니다.");
				}
			}
		});

		// 대조 성경 출력 모드 순환 전환 커맨드 (한글 -> 영어 -> 대조)
		this.addCommand({
			id: "toggle-bible-display-mode",
			name: "성경 보기 모드 순환 전환 (한글 <-> 영어 <-> 대조)",
			callback: () => {
				const current = this.settings.bibleDisplayMode;
				let next: "korean" | "english" | "both" = "korean";
				let modeLabel = "한글 성경만";
				
				if (current === "korean") {
					next = "english";
					modeLabel = "영어 성경만";
				} else if (current === "english") {
					next = "both";
					modeLabel = "한글 + 영어 대조 보기";
				} else {
					next = "korean";
					modeLabel = "한글 성경만";
				}
				
				this.settings.bibleDisplayMode = next;
				this.saveSettings();

				// 현재 선택된 한글/영어 성경 버전명 추출
				const activeKor = this.bibles.get(this.settings.defaultVersion) || this.getActiveVersion();
				const activeEng = this.getActiveEnglishVersion();

				const korName = activeKor ? activeKor.name : "한글성경 없음";
				const engNameRaw = activeEng ? activeEng.name : "영어성경 없음";
				// 영어 이름에서 소문자 e 제거하여 약칭 노출 (eNKJV -> NKJV)
				const engName = engNameRaw.startsWith("e") ? engNameRaw.substring(1) : engNameRaw;

				let noticeMsg = "";
				if (next === "korean") {
					noticeMsg = `📖 성경 보기 모드 변경: 한글 성경만 (${korName})`;
				} else if (next === "english") {
					noticeMsg = `📖 성경 보기 모드 변경: 영어 성경만 (${engName})`;
				} else {
					noticeMsg = `📖 성경 보기 모드 변경: 한글 + 영어 대조 보기 (${korName} + ${engName})`;
				}
				
				new Notice(noticeMsg);
			}
		});

		// 성경 구절 인라인 단축키 치환 커맨드 (기본값: Shift+Enter)
		this.addCommand({
			id: "replace-bible-link",
			name: "성경 장절을 구절로 치환 (Replace Bible Link)",
			editorCallback: (editor: Editor) => {
				this.replaceBibleLink(editor);
			},
			hotkeys: [
				{
					modifiers: ["Shift"],
					key: "Enter"
				}
			]
		});

		// 단어 성경 다중 AND 검색 팝업 단축키 커맨드 (기본값: Ctrl+Alt+B)
		this.addCommand({
			id: "search-bible-word",
			name: "성경 구절 다중 단어 검색 (Search Bible Word AND)",
			editorCallback: (editor: Editor) => {
				let defaultQuery = "";
				const selection = editor.getSelection();
				if (selection && selection.trim().length > 0) {
					defaultQuery = selection.trim();
				} else {
					const cursor = editor.getCursor();
					const line = editor.getLine(cursor.line);
					const wordRange = this.getWordAt(line, cursor.ch);
					if (wordRange) {
						defaultQuery = line.substring(wordRange.start, wordRange.end).trim();
					}
				}

				const modal = new BibleMultiSearchModal(this.app, this, defaultQuery, (selectedVerse) => {
					// 모달에서 선택한 실시간 검색 버전 기준에 의거하여 단 한번만 최종 조립
					const formatted = this.assembleVerses([selectedVerse], false, modal.currentSearchVersion);
					editor.replaceSelection(formatted);
				});
				modal.open();
			},
			hotkeys: [
				{
					modifiers: ["Ctrl", "Alt"],
					key: "b"
				}
			]
		});

		this.addSettingTab(new BethlehemBibleSettingTab(this.app, this));
		this.updateStatusBar();

		// 스트롱코드 원어 보기 뷰 등록
		this.registerView(
			VIEW_TYPE_STRONG_BIBLE,
			(leaf) => new StrongBibleView(leaf, this)
		);

		this.addCommand({
			id: "open-strong-bible-view",
			name: "성경 스트롱코드 원어 보기 창 열기 (Open Strong's View)",
			callback: () => this.activateStrongView(),
		});

		this.addCommand({
			id: "lookup-strong-bible-ref",
			name: "선택한 장절 스트롱코드 원어 조회 (Look up reference in Strong's View)",
			editorCallback: (editor: Editor) => {
				const selection = editor.getSelection().trim();
				if (selection) {
					this.activateStrongView(selection);
				} else {
					const cursor = editor.getCursor();
					const line = editor.getLine(cursor.line);
					const regex = /(?:[\(\[\{])?([가-힣a-zA-Z0-9]{1,6})\s*(\d+)(?:[:：](\d+))?(?:[\)\]\}])?/;
					const match = line.match(regex);
					if (match) {
						this.activateStrongView(match[0]);
					} else {
						new Notice("선택된 텍스트나 커서 줄에서 성경 장절(예: 마 18:15)을 찾지 못했습니다.");
					}
				}
			}
		});

		// 에디터 커서 이동 시 자동 연동 이벤트 등록
		this.registerDomEvent(document, "click", () => {
			this.handleCursorActivity();
		});
		this.registerDomEvent(document, "keyup", (evt: KeyboardEvent) => {
			if (evt.key.startsWith("Arrow") || evt.key === "Backspace" || evt.key === "Enter" || evt.key === " " || evt.key === "Spacebar") {
				this.handleCursorActivity();
			}
		});
	}

	async runPython(args: string[]): Promise<string> {
		const fs = require("fs");
		const os = require("os");
		
		const possiblePaths: string[] = ["python", "py"];
		
		// 1. C:\ 드라이브 아래에서 Python으로 시작하는 폴더 탐색 (예: C:\Python314\python.exe)
		try {
			if (fs.existsSync("C:\\")) {
				const files = fs.readdirSync("C:\\");
				for (const file of files) {
					if (file.toLowerCase().startsWith("python")) {
						const pPath = `C:\\${file}\\python.exe`;
						if (fs.existsSync(pPath)) {
							possiblePaths.unshift(pPath);
						}
					}
				}
			}
		} catch (e) {}

		// 2. 사용자 로컬 폴더 아래의 Python 경로 추가
		try {
			const home = os.homedir();
			const localPy = path.join(home, "AppData\\Local\\Python\\bin\\python.exe");
			if (fs.existsSync(localPy)) {
				possiblePaths.unshift(localPy);
			}
		} catch (e) {}

		// 정밀한 플러그인 내 query_strong.py 경로 산출 (ASAR 환경 회피)
		const vaultPath = (this.app.vault.adapter as any).getBasePath();
		const pluginDir = path.join(vaultPath, this.app.vault.configDir, "plugins", "obsidian-bible-bible-finder");
		const scriptPath = path.join(pluginDir, "query_strong.py");
		const cmdArgs = [scriptPath, ...args];
		let lastError: Error | null = null;

		// 3. 후보 경로 순회하며 실행 시도
		for (const pyPath of possiblePaths) {
			const isAbsoluteExec = pyPath.includes("\\") || pyPath.includes("/");
			// 절대 경로 바이너리인 경우 쉘 없이 직접 실행 (공백 경로 문제 방지)
			const options = isAbsoluteExec 
				? { encoding: "utf-8" } 
				: { shell: true, encoding: "utf-8" };

			try {
				const stdout = await new Promise<string>((resolve, reject) => {
					child_process.execFile(pyPath, cmdArgs, options, (err, stdout, stderr) => {
						if (err) {
							reject(new Error(`Exec failed: ${err.message}. Stderr: ${stderr}`));
						} else {
							resolve(stdout);
						}
					});
				});
				return stdout;
			} catch (err) {
				lastError = err as Error;
			}
		}

		throw lastError || new Error("파이썬 실행파일을 찾지 못했습니다.");
	}

	handleCursorActivity() {
		const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_STRONG_BIBLE)[0];
		if (!leaf) return;
		
		const view = leaf.view as StrongBibleView;
		if (!view || !view.plugin.settings.strongAutoSync) return;

		const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!activeView) return;

		const editor = activeView.editor;
		try {
			const cursor = editor.getCursor();
			const line = editor.getLine(cursor.line);
			
			const regex = /(?:[\(\[\{])?([가-힣a-zA-Z0-9]{1,6})\s*(\d+)(?:[:：](\d+))?(?:[\)\]\}])?/;
			const match = line.match(regex);
			if (match) {
				const ref = match[0];
				const standardBook = getStandardBookCode(match[1], this.customBookMap);
				if (BIBLE_ORDER_MAP.has(standardBook)) {
					if (view.currentSearch !== ref) {
						if (view.searchEl) {
							view.searchEl.value = ref;
						}
						view.performSearch(ref);
					}
				}
			}
		} catch (e) {
			console.error("Cursor activity auto-sync error:", e);
		}
	}

	async activateStrongView(initialSearch: string = "") {
		const { workspace } = this.app;
		let leaf = workspace.getLeavesOfType(VIEW_TYPE_STRONG_BIBLE)[0];
		if (!leaf) {
			const rightLeaf = workspace.getRightLeaf(false);
			if (rightLeaf) {
				leaf = rightLeaf;
				await leaf.setViewState({ type: VIEW_TYPE_STRONG_BIBLE, active: true });
			}
		}
		if (leaf) {
			workspace.revealLeaf(leaf);

			if (initialSearch) {
				const view = leaf.view as StrongBibleView;
				if (view.searchEl) {
					view.searchEl.value = initialSearch;
					view.performSearch(initialSearch);
				}
			}
		}
	}

	onunload() {
		this.bibles.clear();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		try {
			this.customBookMap = JSON.parse(this.settings.customBookMapJson);
		} catch (e) {
			this.customBookMap = {};
		}
		this.updateStatusBar();
	}

	statusBarItem: HTMLElement | null = null;
	updateStatusBar() {
		if (!this.statusBarItem) {
			this.statusBarItem = this.addStatusBarItem();
		}
		const currentVersion = this.getActiveVersion();
		const versionName = currentVersion ? currentVersion.name : "성경 없음";
		this.statusBarItem.setText(`📖 성경: ${versionName}`);
		this.statusBarItem.title = "클릭하여 성경 버전을 전환합니다.";
		this.statusBarItem.onclick = () => {
			this.switchVersionViaMenu();
		};
	}

	getActiveVersion(): BibleVersion | null {
		if (this.bibles.size === 0) return null;
		if (this.settings.defaultVersion && this.bibles.has(this.settings.defaultVersion)) {
			return this.bibles.get(this.settings.defaultVersion)!;
		}
		// '개역한글' 명칭이 포함된 성경을 디폴트 우선 탐색
		const found = Array.from(this.bibles.values()).find(b => b.name.includes("개역한글"));
		if (found) return found;
		return this.bibles.values().next().value;
	}

	// 활성화된 영어성경 안전 획득 함수 (설정이 빈 값이더라도 첫 번째 영어 성경으로 폴백)
	getActiveEnglishVersion(): BibleVersion | null {
		const englishBibles = Array.from(this.bibles.values()).filter(b => b.name.startsWith("e"));
		if (englishBibles.length === 0) return null;
		
		if (this.settings.defaultEnglishVersion && this.bibles.has(this.settings.defaultEnglishVersion)) {
			return this.bibles.get(this.settings.defaultEnglishVersion)!;
		}
		return englishBibles[0];
	}

	switchVersionViaMenu() {
		if (this.bibles.size <= 1) {
			new Notice("전환할 수 있는 성경 버전이 추가로 없습니다. 설정에서 btx 파일을 추가해 주세요.");
			return;
		}
		const versions = Array.from(this.bibles.values());
		new BibleVersionSelectModal(this.app, versions, (selected) => {
			this.settings.defaultVersion = selected.id;
			this.saveSettings();
			new Notice(`성경 버전이 '${selected.name}'(으)로 변경되었습니다.`);
		}).open();
	}

	getWordAt(str: string, pos: number) {
		const isWordChar = (char: string) => /[가-힣a-zA-Z0-9_]/.test(char);
		let start = pos;
		let end = pos;
		while (start > 0 && isWordChar(str[start - 1])) {
			start--;
		}
		while (end < str.length && isWordChar(str[end])) {
			end++;
		}
		return start < end ? { start, end } : null;
	}

	async loadBibleData() {
		this.bibles.clear();
		const folderPath = this.settings.bibleFolder.trim();
		if (!folderPath) return;

		try {
			const adapter = this.app.vault.adapter;
			const exists = await adapter.exists(folderPath);
			if (!exists) {
				console.log("베들레헴 성경 플러그인: btx 폴더가 디스크 상에 존재하지 않습니다. 경로:", folderPath);
				return;
			}

			const listResult = await adapter.list(folderPath);
			const btxFilePaths = listResult.files.filter(p => p.toLowerCase().endsWith(".btx"));

			if (btxFilePaths.length === 0) {
				console.log("베들레헴 성경 플러그인: 폴더 내에 btx 파일이 존재하지 않습니다. 경로:", folderPath);
				return;
			}

			for (const filePath of btxFilePaths) {
				try {
					const text = await adapter.read(filePath);

					// 파일 경로에서 파일명 추출
					const parts = filePath.split(/[/\\]/);
					const fileNameWithExt = parts[parts.length - 1];
					const versionName = fileNameWithExt.substring(0, fileNameWithExt.length - 4); // .btx 제거

					const parsedVersion = this.parseBtxText(filePath, versionName, text);
					this.bibles.set(filePath, parsedVersion);
				} catch (err) {
					console.error(`성경 파일 파싱 에러 (${filePath}):`, err);
				}
			}
		} catch (err) {
			console.error("성경 데이터 로컬 디스크 로딩 중 오류 발생:", err);
		}

		console.log(`베들레헴 성경 플러그인: ${this.bibles.size}개 성경 데이터 로드 완료.`);
	}

	parseBtxText(id: string, name: string, content: string): BibleVersion {
		const verses: Verse[] = [];
		const index: Map<string, Map<number, Map<number, Verse>>> = new Map();

		const lines = content.split(/\r?\n/);
		const btxRegex = /^([가-힣a-zA-Z0-9]{1,5})\s*(\d+)[:：](\d+)\s*(.*)$/;

		for (const line of lines) {
			const cleanLine = line.trim();
			if (!cleanLine) continue;

			const match = cleanLine.match(btxRegex);
			if (match) {
				const rawBook = match[1];
				const chapter = parseInt(match[2], 10);
				const verseNum = parseInt(match[3], 10);
				const body = match[4].trim();

				let standardBook = "";
				const numMatch = rawBook.match(/^(\d{2})/);
				if (numMatch) {
					const bookIndex = parseInt(numMatch[1], 10) - 1;
					if (bookIndex >= 0 && bookIndex < BIBLE_ORDER.length) {
						standardBook = BIBLE_ORDER[bookIndex];
					}
				}

				const cleanBook = rawBook.replace(/^\d+/, "");

				if (!standardBook) {
					standardBook = getStandardBookCode(cleanBook, this.customBookMap);
				}

				const bookFullName = BIBLE_FULL_NAMES[standardBook] || rawBook;

				const verseObj: Verse = {
					book: standardBook,
					bookFullName,
					rawBook: cleanBook,
					chapter,
					verse: verseNum,
					content: body
				};

				verses.push(verseObj);

				if (!index.has(standardBook)) {
					index.set(standardBook, new Map());
				}
				const bookMap = index.get(standardBook)!;

				if (!bookMap.has(chapter)) {
					bookMap.set(chapter, new Map());
				}
				const chapterMap = bookMap.get(chapter)!;

				chapterMap.set(verseNum, verseObj);
			}
		}

		return { id, name, verses, index };
	}

	// 단일 성경 역본 조립 유틸리티
	assembleSingleVersion(verses: Verse[], isEnglish: boolean): string[] {
		const opt = this.settings.verseFormatOption;
		const refLoc = this.settings.refLocation;
		const engFormat = this.settings.englishBookFormat;
		const korFormat = this.settings.koreanBookFormat;

		const getBookDisplay = (v: Verse): string => {
			if (isEnglish) {
				const engName = BIBLE_ENGLISH_NAMES[v.book];
				if (engName) {
					if (engFormat === "full") return engName.full;
					if (engFormat === "short") return engName.short;
					if (engFormat === "raw") return v.rawBook;
				}
			} else {
				if (korFormat === "full") return BIBLE_FULL_NAMES[v.book] || v.book;
				if (korFormat === "short") return v.book;
				if (korFormat === "raw") return v.rawBook;
			}
			return BIBLE_FULL_NAMES[v.book] || v.book;
		};

		const lines: string[] = [];

		// 1. 다중 절 줄바꿈 표시 방식 (newline-num)
		if (opt === "newline-num" && verses.length > 1) {
			const firstV = verses[0];
			const lastV = verses[verses.length - 1];
			const bookDisplay = getBookDisplay(firstV);
			
			let rangeRefText = `${bookDisplay} ${firstV.chapter}:${firstV.verse}-${lastV.verse}`;
			rangeRefText = wrapBracket(rangeRefText, this.settings.bracketBook);
			lines.push(rangeRefText);

			verses.forEach((v) => {
				let refText = v.verse.toString();
				refText = wrapBracket(refText, this.settings.bracketVerse);

				let contentText = v.content;
				contentText = wrapBracket(contentText, this.settings.bracketContent);

				let formattedVerse = "";
				if (refLoc === "front") {
					formattedVerse = `${refText} ${contentText}`;
				} else {
					formattedVerse = `${contentText} ${refText}`;
				}
				lines.push(formattedVerse);
			});
		}
		// 2. 다중 절 한 줄 표시 방식 (include-num 이거나 space 조인 시 여러 구절 병합)
		else if (opt !== "full-ref" && verses.length > 1) {
			const firstV = verses[0];
			const lastV = verses[verses.length - 1];
			const bookDisplay = getBookDisplay(firstV);
			
			let rangeRefText = `${bookDisplay} ${firstV.chapter}:${firstV.verse}-${lastV.verse}`;
			rangeRefText = wrapBracket(rangeRefText, this.settings.bracketBook);

			const mergedContent = verses.map(v => {
				let refText = "";
				if (opt === "include-num") {
					refText = v.verse.toString();
					refText = wrapBracket(refText, this.settings.bracketVerse);
				}
				
				let contentText = v.content;
				contentText = wrapBracket(contentText, this.settings.bracketContent);

				if (opt === "no-num") {
					return contentText;
				} else {
					if (refLoc === "front") {
						return `${refText} ${contentText}`;
					} else {
						return `${contentText} ${refText}`;
					}
				}
			}).join(" ");

			let formattedResult = "";
			if (opt === "no-num") {
				formattedResult = mergedContent;
			} else {
				if (refLoc === "front") {
					formattedResult = `${rangeRefText} ${mergedContent}`;
				} else {
					formattedResult = `${mergedContent} ${rangeRefText}`;
				}
			}
			lines.push(formattedResult);
		} else {
			// 단일 절이거나 책장절 모두 표시(full-ref)인 경우
			verses.forEach((v, idx) => {
				let refText = "";
				
				if (opt === "full-ref" || idx === 0) {
					const bookDisplay = getBookDisplay(v);
					refText = `${bookDisplay} ${v.chapter}:${v.verse}`;
					refText = wrapBracket(refText, this.settings.bracketBook);
				} else {
					refText = v.verse.toString();
					refText = wrapBracket(refText, this.settings.bracketVerse);
				}

				let contentText = v.content;
				contentText = wrapBracket(contentText, this.settings.bracketContent);

				let formattedVerse = "";
				if (opt === "no-num") {
					formattedVerse = contentText;
				} else {
					if (refLoc === "front") {
						formattedVerse = `${refText} ${contentText}`;
					} else {
						formattedVerse = `${contentText} ${refText}`;
					}
				}

				lines.push(formattedVerse);
			});
		}

		return lines;
	}

	// 괄호, 포맷 설정 등이 반영된 최종 성경 구절 텍스트 조립기
	assembleVerses(verses: Verse[], isReplace: boolean, customTargetVersion: BibleVersion | null = null): string {
		if (verses.length === 0) return "";

		const mode = this.settings.bibleDisplayMode;

		// 1. 보기 모드가 '한글만 보기'이거나 '대조 보기'일 때, korVersion은 무조건 한글 성경(e가 없는 것)으로 강제 고정합니다.
		let korVersion = customTargetVersion || this.bibles.get(this.settings.defaultVersion) || this.getActiveVersion();
		if ((mode === "korean" || mode === "both") && korVersion && korVersion.name.startsWith("e")) {
			korVersion = this.bibles.get(this.settings.defaultVersion) || this.getActiveVersion();
		}

		// 2. 보기 모드가 '영어만 보기'이거나 '대조 보기'일 때, engVersion을 설정합니다.
		// 모달에서 영어 성경을 타겟팅하고 있었을 경우 해당 영어 성경을 최우선으로 매핑합니다.
		let engVersion = this.getActiveEnglishVersion();
		if (customTargetVersion && customTargetVersion.name.startsWith("e")) {
			engVersion = customTargetVersion;
		}

		// 입력된 verses를 기준으로 매칭되는 다른 역본의 구절을 찾는 헬퍼 함수
		const getMatchedVerses = (targetVersion: BibleVersion | null): Verse[] => {
			if (!targetVersion) return [];
			const matched: Verse[] = [];
			verses.forEach(v => {
				const bookMap = targetVersion.index.get(v.book);
				if (bookMap) {
					const chapMap = bookMap.get(v.chapter);
					if (chapMap) {
						const verseObj = chapMap.get(v.verse);
						if (verseObj) {
							matched.push(verseObj);
							return;
						}
					}
				}
				matched.push(v);
			});
			return matched;
		};

		const korVerses = getMatchedVerses(korVersion);
		const engVerses = engVersion ? getMatchedVerses(engVersion) : [];

		const shouldAddVersion = isReplace 
			? this.settings.addVersionNameReplace 
			: this.settings.addVersionNameSearch;

		const opt = this.settings.verseFormatOption;
		const joinChar = (opt === "newline-num" || opt === "full-ref" || this.settings.multiVerseJoin === "newline") 
			? "\n" 
			: " ";

		// 1. 한글 성경만 표시 모드
		if (mode === "korean" || !engVersion) {
			const bodyLines = this.assembleSingleVersion(korVerses, false);
			if (shouldAddVersion && korVersion) {
				return `[${korVersion.name}]\n` + bodyLines.join(joinChar);
			}
			return bodyLines.join(joinChar);
		}

		// 2. 영어 성경만 표시 모드
		if (mode === "english") {
			const bodyLines = this.assembleSingleVersion(engVerses, true);
			if (shouldAddVersion) {
				return `[${engVersion.name}]\n` + bodyLines.join(joinChar);
			}
			return bodyLines.join(joinChar);
		}

		// 3. 한글 + 영어 대조 모드 (both): 한글 쭉 나열 -> 빈 줄 한 칸 -> 영어 쭉 나열
		const korLines = this.assembleSingleVersion(korVerses, false);
		const engLines = this.assembleSingleVersion(engVerses, true);

		let korBlock = korLines.join(joinChar);
		let engBlock = engLines.join(joinChar);

		if (shouldAddVersion && korVersion) {
			korBlock = `[${korVersion.name}]\n` + korBlock;
			engBlock = `[${engVersion.name}]\n` + engBlock;
		}

		// 한글 성경 블록과 영어 성경 블록 사이에 한 줄의 빈 줄(\n\n)을 추가하여 결합합니다.
		return `${korBlock}\n\n${engBlock}`;
	}

	replaceBibleLink(editor: Editor) {
		const cursor = editor.getCursor();
		const lineText = editor.getLine(cursor.line);
		const textBeforeCursor = lineText.substring(0, cursor.ch);

		// 책 약칭(알파벳 포함), 장 번호, 그리고 선택적으로 장절 또는 범위 매칭
		const regex = /(?:[\(\[\{])?([가-힣a-zA-Z0-9]{1,6})\s*(\d+)(?:[:：](\d+)(?:-(\d+))?)?(?:[\)\]\}])?/g;
		let match;
		let lastMatch = null;
		while ((match = regex.exec(textBeforeCursor)) !== null) {
			lastMatch = match;
		}

		if (!lastMatch) {
			new Notice("커서 앞쪽에서 성경 장절 패턴(예: 창 1:1 또는 창 1)을 찾지 못했습니다.");
			return;
		}

		const fullMatchText = lastMatch[0];
		const rawBook = lastMatch[1];
		const chapter = parseInt(lastMatch[2], 10);

		const standardBook = getStandardBookCode(rawBook, this.customBookMap);
		// 일반 텍스트 오진 방지: 성경 66권 약어 목록에 없는 텍스트면 그냥 리턴!
		if (!BIBLE_ORDER_MAP.has(standardBook)) {
			return;
		}

		const activeVersion = this.getActiveVersion();
		if (!activeVersion) {
			new Notice("활성화된 성경 데이터가 없습니다. 설정에서 btx 파일 폴더를 확인해 주세요.");
			return;
		}

		const bookMap = activeVersion.index.get(standardBook);
		if (!bookMap) {
			new Notice(`성경책명 '${rawBook}'에 해당하는 데이터를 찾을 수 없습니다.`);
			return;
		}

		const chapterMap = bookMap.get(chapter);
		if (!chapterMap) {
			new Notice(`해당 성경에 ${chapter}장이 없습니다.`);
			return;
		}

		const startVerse = lastMatch[3] ? parseInt(lastMatch[3], 10) : 1;
		const hasVerse = lastMatch[3] !== undefined;
		let endVerse = startVerse;

		if (hasVerse) {
			endVerse = lastMatch[4] ? parseInt(lastMatch[4], 10) : startVerse;
		} else {
			// 장만 적은 경우: 해당 장의 마지막 절 번호를 스캔
			let maxVerse = 1;
			for (const vKey of chapterMap.keys()) {
				if (vKey > maxVerse) maxVerse = vKey;
			}
			endVerse = maxVerse;
		}

		const matchedVerses: Verse[] = [];
		for (let v = startVerse; v <= endVerse; v++) {
			const verseObj = chapterMap.get(v);
			if (verseObj) {
				matchedVerses.push(verseObj);
			}
		}

		if (matchedVerses.length === 0) {
			new Notice(`${chapter}장 ${startVerse}절 ~ ${endVerse}절 범위에 해당하는 구절이 없습니다.`);
			return;
		}

		const replacementText = this.assembleVerses(matchedVerses, true);

		const startCh = lastMatch.index;
		const endCh = lastMatch.index + fullMatchText.length;
		editor.replaceRange(replacementText, { line: cursor.line, ch: startCh }, { line: cursor.line, ch: endCh });
	}

	formatVerse(verse: Verse): string {
		return this.assembleVerses([verse], false);
	}
}

class BibleVersionSelectModal extends SuggestModal<BibleVersion> {
	versions: BibleVersion[];
	onSelect: (selected: BibleVersion) => void;

	constructor(app: App, versions: BibleVersion[], onSelect: (selected: BibleVersion) => void) {
		super(app);
		this.versions = versions;
		this.onSelect = onSelect;
		this.setPlaceholder("변경할 성경 역본을 선택해 주세요.");
	}

	getSuggestions(query: string): BibleVersion[] {
		return this.versions.filter(v => v.name.toLowerCase().includes(query.toLowerCase()));
	}

	renderSuggestion(value: BibleVersion, el: HTMLElement): void {
		el.createEl("div", { text: value.name });
	}

	onChooseSuggestion(item: BibleVersion, evt: MouseEvent | KeyboardEvent): void {
		this.onSelect(item);
	}
}

class BibleMultiSearchModal extends Modal {
	plugin: BethlehemBiblePlugin;
	initialQuery: string;
	onSelect: (verse: Verse) => void;
	
	inputs: HTMLInputElement[] = [];
	resultsContainer!: HTMLDivElement;
	verses: Verse[] = [];
	selectedIndex: number = -1;
	// 검색은 성경 전체를 훑되, 화면에는 이만큼씩 나눠 그린다 (많이 나오는 낱말에서도 안 느리게)
	renderLimit: number = 100;
	itemEls: HTMLElement[] = [];
	chosen: boolean = false;      // 구절을 이미 골랐는지 (중복 삽입 방지)
	composing: boolean = false;   // 한글 입력기(IME) 조합 중인지
	
	// 다중 검색 내에서 실시간 버전 선택을 위한 속성 추가
	currentSearchVersion!: BibleVersion;

	constructor(app: App, plugin: BethlehemBiblePlugin, initialQuery: string, onSelect: (verse: Verse) => void) {
		super(app);
		this.plugin = plugin;
		this.initialQuery = initialQuery;
		this.onSelect = onSelect;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("bible-multi-search-modal");
		// [수정] 창이 좁아 단어 1/2/3 칸이 잘리고 가로 스크롤이 생기던 것을 고침.
		// 창 자체를 넓히고, 안쪽 내용은 가로로 넘치지 않게 한다.
		try {
			const w = "min(1040px, 94vw)";
			this.modalEl.style.setProperty("width", w, "important");
			this.modalEl.style.setProperty("max-width", w, "important");
			contentEl.style.setProperty("width", "100%", "important");
			contentEl.style.setProperty("max-width", "100%", "important");
			contentEl.style.setProperty("box-sizing", "border-box", "important");
			contentEl.style.setProperty("overflow-x", "hidden", "important");
		} catch (e) { /* 무시 */ }

		contentEl.createEl("h2", { 
			text: "📖 성경 다중 단어 검색 (AND)", 
			cls: "bible-multi-search-title" 
		});

		// 1. 실시간 검색 성경 버전 선택 드롭다운 영역 구축
		const versionSelectContainer = contentEl.createDiv({ cls: "bible-multi-search-version-container" });
		versionSelectContainer.createEl("span", { 
			text: "📖 검색 대상 성경: ", 
			cls: "bible-multi-search-version-label" 
		});
		
		const selectEl = versionSelectContainer.createEl("select", { 
			cls: "bible-multi-search-version-select" 
		});
		
		const activeVersion = this.plugin.getActiveVersion();
		this.currentSearchVersion = activeVersion || this.plugin.bibles.values().next().value;

		const bibles = Array.from(this.plugin.bibles.values());
		bibles.forEach(b => {
			const option = selectEl.createEl("option", {
				value: b.id,
				text: b.name
			});
			if (this.currentSearchVersion && b.id === this.currentSearchVersion.id) {
				option.selected = true;
			}
		});

		selectEl.addEventListener("change", () => {
			const selectedId = selectEl.value;
			const target = this.plugin.bibles.get(selectedId);
			if (target) {
				this.currentSearchVersion = target;
				this.selectedIndex = -1;
				this.search();
			}
		});

		// 2. 가로 3개 단어 입력창 배치 영역 구축 (가로 1:1:1 고정 인라인 스타일 주입으로 가로 스크롤 완벽 해결!)
		const inputsContainer = contentEl.createDiv({ cls: "bible-multi-search-inputs-container" });
		inputsContainer.style.cssText = "display: flex !important; flex-direction: row !important; flex-wrap: nowrap !important; justify-content: space-between !important; align-items: center !important; gap: 10px !important; margin-bottom: 20px !important; width: 100% !important; box-sizing: border-box !important;";
		
		for (let i = 0; i < 3; i++) {
			const inputWrapper = inputsContainer.createDiv({ cls: "bible-multi-search-input-wrapper" });
			inputWrapper.style.cssText = "flex: 1 1 0% !important; min-width: 0 !important; box-sizing: border-box !important;";
			
			const input = inputWrapper.createEl("input", {
				type: "text",
				placeholder: `단어 ${i + 1}${i === 0 ? " (필수)" : " (선택)"}`,
				cls: "bible-multi-search-input"
			});
			input.style.cssText = "width: 100% !important; box-sizing: border-box !important; padding: 8px 10px !important; font-size: 0.95em;";
			
			this.inputs.push(input);

			input.addEventListener("input", () => {
				this.selectedIndex = -1;
				this.search();
			});

			// [수정] 여기 있던 Enter / ArrowUp / ArrowDown 처리를 제거함.
			// 아래 this.scope.register(...) 가 같은 키를 이미 처리하고 있어서, 입력칸에
			// 포커스가 있는 상태(= 실제 사용 상황)에서는 두 곳이 모두 실행되었다.
			//  · Enter  → selectVerse 가 두 번 → 구절이 두 번 삽입됨 (실제 증상)
			//  · 화살표 → navigateResults 가 두 번 → 결과가 한 칸씩이 아니라 두 칸씩 건너뜀
			// e.preventDefault() 는 브라우저 기본 동작만 막을 뿐, 옵시디언 Scope 의
			// 단축키 처리는 막지 못하기 때문에 중복을 피할 수 없었다.

			// 한글 입력(IME) 조합 중인지 추적 — 조합을 끝내려고 누른 Enter 가
			// 구절 선택으로 새어 들어가는 것을 막기 위함
			input.addEventListener("compositionstart", () => { this.composing = true; });
			input.addEventListener("compositionend", () => { this.composing = false; });
		}

		if (this.initialQuery) {
			this.inputs[0].value = this.initialQuery;
		}

		this.resultsContainer = contentEl.createDiv({ cls: "bible-multi-search-results-container" });
		// 결과는 세로로만 스크롤하고, 긴 구절은 줄바꿈해서 가로 스크롤이 안 생기게 한다
		this.resultsContainer.style.cssText = "width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; overflow-x: hidden !important; overflow-y: auto !important; max-height: 60vh !important; overflow-wrap: anywhere;";

		this.scope.register([], "ArrowDown", (e) => {
			e.preventDefault();
			this.navigateResults(1);
		});
		this.scope.register([], "ArrowUp", (e) => {
			e.preventDefault();
			this.navigateResults(-1);
		});
		this.scope.register([], "Enter", (e) => {
			e.preventDefault();
			// 한글 조합을 확정하려고 누른 Enter 는 무시 (조합 중에 선택되어 버리는 것 방지)
			if (this.composing || (e as KeyboardEvent).isComposing || (e as KeyboardEvent).keyCode === 229) return;
			if (this.selectedIndex >= 0 && this.selectedIndex < this.verses.length) {
				this.selectVerse(this.verses[this.selectedIndex]);
			} else if (this.verses.length > 0) {
				this.selectVerse(this.verses[0]);
			}
		});

		setTimeout(() => this.inputs[0].focus(), 50);
		this.search();
	}

	search() {
		if (!this.currentSearchVersion) {
			this.renderMessage("활성화된 검색 성경 데이터가 존재하지 않습니다.");
			return;
		}

		const queries = this.inputs.map(input => input.value.trim().toLowerCase()).filter(q => q);
		// 검색어가 바뀌면 화면에 그리는 개수도 처음부터 다시 센다
		this.renderLimit = 100;
		if (queries.length === 0) {
			this.renderMessage("검색어를 1개 이상 입력해 주세요.");
			this.verses = [];
			return;
		}

		// [수정] 장절로 찾을 때는 띄어쓰기를 무시한다.
		// 예전에는 "히2" 만 찾아지고 "히 2" 처럼 한 칸 띄우면 못 찾았다.
		// 본문 검색어는 그대로 두어야 "참 빛" 같은 두 낱말 검색이 계속 되므로,
		// 장절 비교용 검색어만 따로 공백을 없앤 것을 쓴다.
		const refQueries = queries.map(q => q.replace(/\s+/g, ""));

		const results: Verse[] = [];
		for (const verse of this.currentSearchVersion.verses) {
			const contentLower = verse.content.toLowerCase();
			const bookLower = verse.bookFullName.toLowerCase();
			// 장절 표기를 여러 형태로 만들어 두고 그중 하나라도 맞으면 통과
			//   히2:1 / 히2장1절 / 히브리서2:1 / 히브리서2장1절
			const refs = [
				`${verse.book}${verse.chapter}:${verse.verse}`,
				`${verse.book}${verse.chapter}장${verse.verse}절`,
				`${verse.bookFullName}${verse.chapter}:${verse.verse}`,
				`${verse.bookFullName}${verse.chapter}장${verse.verse}절`,
			].map(s => s.toLowerCase());
			const matchAll = queries.every((term, qi) => {
				if (contentLower.includes(term) || bookLower.includes(term)) return true;
				const rq = refQueries[qi];
				return !!rq && refs.some(r => r.includes(rq));
			});

			if (matchAll) {
				results.push(verse);
			}

			// [수정] 예전에는 결과 100개를 모으면 검색을 멈췄다.
			// 성경을 창세기부터 훑기 때문에, "성령"처럼 많이 나오는 낱말은 앞부분(로마서 언저리)
			// 에서 100개가 다 차 버려서 살전 1:5, 요일 5:8, 계 22:17 같은 뒷부분 구절은
			// 아예 검사조차 못 했다. 이제는 성경 전체를 끝까지 훑는다.
			// (화면에는 한 번에 다 그리지 않고 나눠 그리므로 느려지지 않는다.)
		}

		this.verses = results.sort((a, b) => {
			const orderA = BIBLE_ORDER_MAP.get(a.book) ?? 999;
			const orderB = BIBLE_ORDER_MAP.get(b.book) ?? 999;
			if (orderA !== orderB) return orderA - orderB;
			if (a.chapter !== b.chapter) return a.chapter - b.chapter;
			return a.verse - b.verse;
		});

		this.renderResults();
	}

	renderMessage(msg: string) {
		this.resultsContainer.empty();
		this.resultsContainer.createDiv({ cls: "bible-multi-search-message", text: msg });
	}

	highlightKeywords(content: string, queries: string[]): string {
		let html = content;
		const colors = [
			this.plugin.settings.colorWord1,
			this.plugin.settings.colorWord2,
			this.plugin.settings.colorWord3
		];

		const placeholders: { token: string, html: string }[] = [];

		queries.forEach((q, idx) => {
			if (!q) return;
			const color = colors[idx] || "none";
			if (color === "none") return;

			const escaped = q.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
			const regex = new RegExp(escaped, "gi");

			html = html.replace(regex, (match) => {
				const token = `__BIBLE_PLACEHOLDER_${placeholders.length}__`;
				placeholders.push({
					token,
					html: `<span style="color: ${color}; font-weight: bold;">${match}</span>`
				});
				return token;
			});
		});

		placeholders.forEach(p => {
			html = html.replace(p.token, p.html);
		});

		return html;
	}

	renderResults() {
		this.resultsContainer.empty();
		this.itemEls = [];
		if (this.verses.length === 0) {
			this.renderMessage("결과를 찾지 못했습니다.");
			return;
		}

		const queries = this.inputs.map(input => input.value.trim().toLowerCase()).filter(q => q);
		const isEnglish = this.currentSearchVersion.name.startsWith("e");

		const total = this.verses.length;
		const shown = Math.min(this.renderLimit, total);
		// 몇 구절이 찾아졌는지 항상 보여 준다 (예전에는 100개에서 잘려도 알 길이 없었다)
		const countEl = this.resultsContainer.createDiv({ cls: "bible-multi-search-count" });
		countEl.textContent = (shown < total ? `총 ${total}개 구절 중 ${shown}개 표시` : `총 ${total}개 구절`);
		countEl.style.cssText = "font-size: 0.85em; opacity: 0.7; margin: 2px 0 8px 2px;";

		this.verses.slice(0, shown).forEach((verse, idx) => {
			const itemEl = this.resultsContainer.createDiv({
				cls: `bible-multi-search-result-item ${idx === this.selectedIndex ? "is-selected" : ""}`
			});
			this.itemEls.push(itemEl);

			let bookDisplay = BIBLE_FULL_NAMES[verse.book] || verse.book;
			if (isEnglish) {
				const engName = BIBLE_ENGLISH_NAMES[verse.book];
				if (engName) {
					const fmt = this.plugin.settings.englishBookFormat;
					if (fmt === "full") bookDisplay = engName.full;
					else if (fmt === "short") bookDisplay = engName.short;
					else if (fmt === "raw") bookDisplay = verse.rawBook;
				}
			} else {
				const fmt = this.plugin.settings.koreanBookFormat;
				if (fmt === "full") bookDisplay = BIBLE_FULL_NAMES[verse.book] || verse.book;
				else if (fmt === "short") bookDisplay = verse.book;
				else if (fmt === "raw") bookDisplay = verse.rawBook;
			}

			itemEl.createDiv({ 
				cls: "bible-search-suggestion-title", 
				text: `${bookDisplay} ${verse.chapter}장 ${verse.verse}절` 
			});
			
			const contentEl = itemEl.createDiv({ cls: "bible-search-suggestion-content" });
			contentEl.innerHTML = this.highlightKeywords(verse.content, queries);

			itemEl.addEventListener("click", () => {
				this.selectVerse(verse);
			});
		});

		if (shown < total) {
			const moreEl = this.resultsContainer.createDiv({ cls: "bible-multi-search-more" });
			moreEl.textContent = (`▼ 더 보기 (남은 ${total - shown}개)`);
			moreEl.style.cssText = "text-align: center; padding: 10px; cursor: pointer; opacity: 0.85;";
			moreEl.addEventListener("click", () => {
				this.renderLimit += 100;
				this.renderResults();
			});
		}
	}

	navigateResults(direction: number) {
		if (this.verses.length === 0) return;

		this.selectedIndex += direction;
		if (this.selectedIndex < 0) {
			this.selectedIndex = 0;
		} else if (this.selectedIndex >= this.verses.length) {
			this.selectedIndex = this.verses.length - 1;
		}

		// 아직 화면에 안 그린 구절로 내려가면 그만큼 더 그린다
		if (this.selectedIndex >= this.renderLimit) {
			this.renderLimit = Math.ceil((this.selectedIndex + 1) / 100) * 100;
		}

		this.renderResults();

		const selectedEl = this.itemEls[this.selectedIndex];
		if (selectedEl) {
			selectedEl.scrollIntoView({ block: "nearest" });
		}
	}

	selectVerse(verse: Verse) {
		// [수정] 어떤 경로로든 두 번 불려도 한 번만 삽입되도록 잠금.
		// (Enter 중복 처리, 클릭과 키 입력이 겹치는 경우, 한글 입력기 동작 등
		//  중복 호출 경로가 여러 개라 근본적인 안전장치를 여기에 둔다)
		if (this.chosen) return;
		this.chosen = true;
		// 원본 객체 참조 오염을 완벽히 차단하기 위해 복사본을 생성해 전달합니다.
		const safeVerse = { ...verse };
		this.onSelect(safeVerse);
		this.close();
	}
}

class BethlehemBibleSettingTab extends PluginSettingTab {
	plugin: BethlehemBiblePlugin;

	constructor(app: App, plugin: BethlehemBiblePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "📖 Bible Finder 설정" });

		// 설정을 접었다 펼 수 있는 구역으로 감싸서, 평소엔 필요한 것만 펼쳐 보고
		// 나머지는 접어 둘 수 있게 함.
		const section = (title: string, opened: boolean): HTMLElement => {
			const det = containerEl.createEl("details");
			if (opened) det.setAttribute("open", "true");
			det.style.cssText = "margin: 6px 0 14px 0; border: 1px solid var(--background-modifier-border); border-radius: 6px; padding: 2px 12px 12px 12px;";
			const sum = det.createEl("summary", { text: title });
			sum.style.cssText = "cursor: pointer; font-weight: 600; padding: 8px 0; user-select: none; font-size: 1.05em;";
			return det.createDiv();
		};

		// --- 기본 파일 및 경로 설정 ---
		const secBase = section("📁 기본 경로 및 버전 설정", true);

		new Setting(secBase)
			.setName("성경 데이터 폴더 (.btx)")
			.setDesc("성경 btx 파일들이 위치한 폴더 경로를 입력하세요. (예: _bibles)")
			.addText(text => text
				.setPlaceholder("_bibles")
				.setValue(this.plugin.settings.bibleFolder)
				.onChange(async (value) => {
					this.plugin.settings.bibleFolder = value;
					await this.plugin.saveSettings();
					await this.plugin.loadBibleData();
				})
			);

		const bibles = Array.from(this.plugin.bibles.values());
		const dropdownOptions: { [key: string]: string } = {};
		const englishDropdownOptions: { [key: string]: string } = {};

		bibles.forEach(b => {
			if (b.name.startsWith("e")) {
				// 앞에 소문자 e를 뺀 순수 약칭
				const cleanName = b.name.substring(1);
				const fullName = ENGLISH_VERSION_FULL_NAMES[cleanName] || cleanName;
				englishDropdownOptions[b.id] = `${cleanName} (${fullName})`;
			} else {
				dropdownOptions[b.id] = b.name;
			}
		});

		if (Object.keys(dropdownOptions).length === 0) {
			bibles.forEach(b => { dropdownOptions[b.id] = b.name; });
		}
		if (Object.keys(englishDropdownOptions).length === 0) {
			bibles.forEach(b => { englishDropdownOptions[b.id] = b.name; });
		}

		if (bibles.length > 0) {
			new Setting(secBase)
				.setName("기본 한글 성경 버전")
				.setDesc("자동 치환 또는 대조 시 기본으로 사용할 한글 성경 역본을 선택하세요 (파일명에 'e'가 없는 한글 성경 목록).")
				.addDropdown(dropdown => {
					dropdown
						.addOptions(dropdownOptions)
						.setValue(this.plugin.settings.defaultVersion || Object.keys(dropdownOptions)[0])
						.onChange(async (value) => {
							this.plugin.settings.defaultVersion = value;
							await this.plugin.saveSettings();
						});
				});

			new Setting(secBase)
				.setName("기본 영어 성경 버전")
				.setDesc("대조 보기 모드 활성화 시 기본으로 매칭하여 노출할 영어 성경 역본을 선택하세요 (파일명이 'e'로 시작하는 영어 성경 목록).")
				.addDropdown(dropdown => {
					dropdown
						.addOptions(englishDropdownOptions)
						.setValue(this.plugin.settings.defaultEnglishVersion || Object.keys(englishDropdownOptions)[0])
						.onChange(async (value) => {
							this.plugin.settings.defaultEnglishVersion = value;
							await this.plugin.saveSettings();
						});
				});

			new Setting(secBase)
				.setName("성경 기본 출력 모드")
				.setDesc("구절을 가져올 때의 출력 방식입니다 (한글만 / 영어만 / 한글+영어 대조).")
				.addDropdown(dropdown => {
					dropdown
						.addOption("korean", "한글 성경만 보기")
						.addOption("english", "영어 성경만 보기")
						.addOption("both", "한글 + 영어 대조해서 같이 보기")
						.setValue(this.plugin.settings.bibleDisplayMode)
						.onChange(async (value: string) => {
							this.plugin.settings.bibleDisplayMode = value as "korean" | "english" | "both";
							await this.plugin.saveSettings();
						});
				});
		} else {
			secBase.createEl("p", { 
				text: "⚠️ 설정된 폴더에 성경 btx 파일이 없습니다. btx 파일을 폴더에 넣어주세요.", 
				cls: "bible-warning-text" 
			});
		}

		// --- 한글 성경 책 이름 표기 설정 ---
		const secKor = section("한글 성경 설정", false);

		new Setting(secKor)
			.setName("한글 성경 책 이름 표시 형식")
			.setDesc("개역한글 같은 한글 성경 사용 시 성경책 이름을 보여줄 양식입니다. (예: 창세기 / 창)")
			.addDropdown(dropdown => dropdown
				.addOption("full", "한글 정명 (예: 창세기)")
				.addOption("short", "한글 약칭 (예: 창)")
				.addOption("raw", "btx 원본 표기 (예: 창)")
				.setValue(this.plugin.settings.koreanBookFormat)
				.onChange(async (value: string) => {
					this.plugin.settings.koreanBookFormat = value as "full" | "short" | "raw";
					await this.plugin.saveSettings();
				})
			);

		// --- 영문 성경 책 이름 표기 설정 ---
		const secEng = section("영문 성경 설정", false);

		new Setting(secEng)
			.setName("영문 성경 책 이름 표시 형식")
			.setDesc("eESV, eNIV 같은 영문 성경 사용 시 성경책 이름을 보여줄 양식입니다. (예: Genesis / Gen / Gn / 창세기)")
			.addDropdown(dropdown => dropdown
				.addOption("full", "영문 정명 (예: Genesis)")
				.addOption("short", "영문 약칭 (예: Gen)")
				.addOption("raw", "btx 원본 표기 (예: Gn)")
				.addOption("korean", "한글 표기 (예: 창세기)")
				.setValue(this.plugin.settings.englishBookFormat)
				.onChange(async (value: string) => {
					this.plugin.settings.englishBookFormat = value as "full" | "short" | "raw" | "korean";
					await this.plugin.saveSettings();
				})
			);

		// --- 성경절 괄호 설정 ---
		const secBracket = section("괄호 설정", false);

		new Setting(secBracket)
			.setName("책장절 괄호")
			.setDesc("성경 장절 정보 전후에 감싸줄 괄호 모양을 선택하세요. (예: (창세기 1:1))")
			.addDropdown(dropdown => dropdown
				.addOption("none", "없음")
				.addOption("()", "( )")
				.addOption("[]", "[ ]")
				.addOption("{}", "{ }")
				.addOption("<>", "< >")
				.setValue(this.plugin.settings.bracketBook)
				.onChange(async (value) => {
					this.plugin.settings.bracketBook = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(secBracket)
			.setName("절 괄호")
			.setDesc("개별 절 번호 전후에 감싸줄 괄호 모양을 선택하세요. (예: (1) 태초에...)")
			.addDropdown(dropdown => dropdown
				.addOption("none", "없음")
				.addOption("()", "( )")
				.addOption("[]", "[ ]")
				.setValue(this.plugin.settings.bracketVerse)
				.onChange(async (value) => {
					this.plugin.settings.bracketVerse = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(secBracket)
			.setName("본문 괄호")
			.setDesc("구절 본문 전체에 감싸줄 괄호 모양을 선택하세요. (예: [태초에 하나님이...])")
			.addDropdown(dropdown => dropdown
				.addOption("none", "없음")
				.addOption("()", "( )")
				.addOption("[]", "[ ]")
				.setValue(this.plugin.settings.bracketContent)
				.onChange(async (value) => {
					this.plugin.settings.bracketContent = value;
					await this.plugin.saveSettings();
				})
			);

		// --- 성경절 형식 설정 ---
		const secFormat = section("성경절 형식 설정", false);

		new Setting(secFormat)
			.setName("성경절 출력 형식")
			.setDesc("본문에 삽입될 성경 구절의 기본 형태를 정합니다.")
			.addDropdown(dropdown => dropdown
				.addOption("include-num", "절 번호 포함 (예: 창 1:1 태초에...)")
				.addOption("newline-num", "절 줄 바꾸어 (여러 절 출력 시 각각 개행)")
				.addOption("no-num", "절 번호 없이 본문만")
				.addOption("full-ref", "책장절 모두 표시 (예: 창 1:1 태초에... 창 1:2 땅이...)")
				.setValue(this.plugin.settings.verseFormatOption)
				.onChange(async (value: string) => {
					this.plugin.settings.verseFormatOption = value as "include-num" | "newline-num" | "no-num" | "full-ref";
					await this.plugin.saveSettings();
				})
			);

		new Setting(secFormat)
			.setName("장절 표기 위치")
			.setDesc("장절 표기를 본문 앞에 둘지, 뒤에 둘지 결정합니다.")
			.addDropdown(dropdown => dropdown
				.addOption("front", "장절을 앞에 (예: [창 1:1] 태초에...)")
				.addOption("back", "장절을 뒤에 (예: 태초에... [창 1:1])")
				.setValue(this.plugin.settings.refLocation)
				.onChange(async (value: string) => {
					this.plugin.settings.refLocation = value as "front" | "back";
					await this.plugin.saveSettings();
				})
			);

		new Setting(secFormat)
			.setName("다중 구절 삽입 시 병합 구분 방식 (레거시)")
			.setDesc("구절 출력 형식이 기본일 때 여러 절을 가져오는 기본 병합 구분입니다.")
			.addDropdown(dropdown => dropdown
				.addOption("newline", "줄바꿈으로 개별 구절 나열")
				.addOption("space", "한 줄에 공백으로 본문 병합")
				.setValue(this.plugin.settings.multiVerseJoin)
				.onChange(async (value: string) => {
					this.plugin.settings.multiVerseJoin = value as "newline" | "space";
					await this.plugin.saveSettings();
				})
			);

		// --- 번역판명 추가 설정 ---
		const secVerName = section("빈 줄에 번역판명 추가", false);

		new Setting(secVerName)
			.setName("성구 찾기 시 번역판명 추가")
			.setDesc("다중 검색 팝업창에서 성구를 가져올 때 맨 윗줄에 번역판명(성경 버전명)을 추가합니다.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.addVersionNameSearch)
				.onChange(async (value) => {
					this.plugin.settings.addVersionNameSearch = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(secVerName)
			.setName("성경절 찾기 시 번역판명 추가")
			.setDesc("인라인 단축키 치환(Shift+Enter)으로 가져올 때 맨 윗줄에 번역판명을 추가합니다.")
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.addVersionNameReplace)
				.onChange(async (value) => {
					this.plugin.settings.addVersionNameReplace = value;
					await this.plugin.saveSettings();
				})
			);

		// --- 레거시 커스텀 매핑 ---
		const secEtc = section("기타 설정", false);

		new Setting(secEtc)
			.setName("사용자 정의 책 약칭 매핑 (JSON)")
			.setDesc("기본 약칭 외에 나만의 약어를 지정할 때 사용합니다. 예: { \"창세\": \"창\", \"마태\": \"마\" }")
			.addTextArea(text => text
				.setPlaceholder("{}")
				.setValue(this.plugin.settings.customBookMapJson)
				.onChange(async (value) => {
					this.plugin.settings.customBookMapJson = value;
					await this.plugin.saveSettings();
				})
			);

		// --- 스트롱코드 원어 설정 ---
		const secStrong = section("⚡ 스트롱코드 원어 보기 설정 (Bethlehem Win)", false);

		const pathSetting = new Setting(secStrong)
			.setName("베들레헴 윈도우용 폴더 경로")
			.setDesc("베들레헴 SQLite 파일 (.sdb, .dct)이 위치한 폴더 경로입니다.");

		let pathTextComponent: any;
		pathSetting.addText(text => {
			text.setPlaceholder("C:\\Users\\...\\BethlehemWin")
				.setValue(this.plugin.settings.bethlehemWinFolder)
				.onChange(async (value) => {
					this.plugin.settings.bethlehemWinFolder = value;
					await this.plugin.saveSettings();
				});
			pathTextComponent = text;
		});

		pathSetting.addButton(btn => {
			btn.setButtonText("폴더 선택")
				.setTooltip("베들레헴 윈도우 폴더 찾기")
				.onClick(() => {
					const fileInput = document.createElement("input");
					fileInput.type = "file";
					fileInput.setAttribute("webkitdirectory", "true");
					fileInput.setAttribute("directory", "true");
					fileInput.addEventListener("change", async (e: any) => {
						const files = e.target.files;
						if (files && files.length > 0) {
							const firstFilePath = files[0].path;
							if (firstFilePath) {
								const folderPath = path.dirname(firstFilePath);
								this.plugin.settings.bethlehemWinFolder = folderPath;
								await this.plugin.saveSettings();
								pathTextComponent.setValue(folderPath);
								new Notice(`폴더가 설정되었습니다: ${folderPath}`);
							}
						}
					});
					fileInput.click();
				});
		});

		new Setting(secStrong)
			.setName("기본 한글 스트롱 성경 (.sdb)")
			.setDesc("원어 보기에서 사용할 기본 한글 스트롱 성경 파일명입니다.")
			.addText(text => text
				.setValue(this.plugin.settings.selectedStrongBibleKor)
				.onChange(async (value) => {
					this.plugin.settings.selectedStrongBibleKor = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(secStrong)
			.setName("기본 영어 스트롱 성경 (.sdb)")
			.setDesc("원어 보기에서 사용할 기본 영어 스트롱 성경 파일명입니다.")
			.addText(text => text
				.setValue(this.plugin.settings.selectedStrongBibleEng)
				.onChange(async (value) => {
					this.plugin.settings.selectedStrongBibleEng = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(secStrong)
			.setName("기본 한글 원어 사전 (.dct)")
			.setDesc("원어 보기에서 사용할 기본 한글 사전 파일명입니다.")
			.addText(text => text
				.setValue(this.plugin.settings.selectedStrongLexiconKor)
				.onChange(async (value) => {
					this.plugin.settings.selectedStrongLexiconKor = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(secStrong)
			.setName("기본 영문 원어 사전 (.dct)")
			.setDesc("원어 보기에서 사용할 기본 영문 사전 파일명입니다.")
			.addText(text => text
				.setValue(this.plugin.settings.selectedStrongLexiconEng)
				.onChange(async (value) => {
					this.plugin.settings.selectedStrongLexiconEng = value;
					await this.plugin.saveSettings();
				})
			);
	}
}

export const VIEW_TYPE_STRONG_BIBLE = "strong-bible-view";

interface StrongVerseData {
	book: number;
	chapter: number;
	verse: number;
	btext: string;
	raw_text: string;
}

interface StrongQueryResponse {
	verses: StrongVerseData[];
	lexicon: { [key: string]: string };
	error?: string;
}

export class StrongBibleView extends ItemView {
	plugin: BethlehemBiblePlugin;
	
	searchEl!: HTMLInputElement;
	bibleSelectKorEl!: HTMLSelectElement;
	bibleSelectEngEl!: HTMLSelectElement;
	lexiconSelectKorEl!: HTMLSelectElement;
	lexiconSelectEngEl!: HTMLSelectElement;
	displayModeSelectEl!: HTMLSelectElement;
	
	versesContainerEl!: HTMLDivElement;
	lexiconContainerEl!: HTMLDivElement;
	
	currentSearch: string = "";
	selectedStrongCode: string = "";
	lexiconData: { [key: string]: string } = {};

	constructor(leaf: WorkspaceLeaf, plugin: BethlehemBiblePlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return VIEW_TYPE_STRONG_BIBLE;
	}

	getDisplayText(): string {
		return "스트롱 원어 성경";
	}

	getIcon(): string {
		return "book-open";
	}

	async onOpen() {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();
		container.addClass("strong-bible-view-container");
		container.style.cssText = "display: flex; flex-direction: column; height: 100%; overflow: hidden; padding: 0;";

		// --- Header Control Panel ---
		const headerEl = container.createDiv({ cls: "strong-bible-header" });
		headerEl.style.cssText = "padding: 10px; border-bottom: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 8px; background-color: var(--background-secondary); flex-shrink: 0;";

		// Line 1: Search, Display Mode, and Auto-Sync
		const row1El = headerEl.createDiv();
		row1El.style.cssText = "display: flex; gap: 6px; align-items: center;";

		this.searchEl = row1El.createEl("input", {
			type: "text",
			placeholder: "장절 입력 (예: 마 18:15)",
			cls: "strong-bible-search-input"
		});
		this.searchEl.style.cssText = "flex: 1; padding: 6px; border-radius: 4px; border: 1px solid var(--border-color); background-color: var(--background-primary); color: var(--text-normal);";

		this.displayModeSelectEl = row1El.createEl("select");
		this.displayModeSelectEl.style.cssText = "padding: 6px; border-radius: 4px; border: 1px solid var(--border-color); background-color: var(--background-primary); color: var(--text-normal);";
		this.displayModeSelectEl.createEl("option", { value: "both", text: "대조 보기" });
		this.displayModeSelectEl.createEl("option", { value: "korean", text: "한글 성경" });
		this.displayModeSelectEl.createEl("option", { value: "english", text: "영어 성경" });
		this.displayModeSelectEl.value = this.plugin.settings.strongDisplayMode;

		// 에디터 자동 연동 체크박스 추가
		const syncLabel = row1El.createEl("label");
		syncLabel.style.cssText = "display: flex; align-items: center; gap: 4px; font-size: 0.85em; cursor: pointer; white-space: nowrap; margin-left: 4px; user-select: none;";
		const syncCheckbox = syncLabel.createEl("input", { type: "checkbox" });
		syncCheckbox.checked = this.plugin.settings.strongAutoSync;
		syncLabel.createSpan({ text: "에디터 연동" });
		
		syncCheckbox.addEventListener("change", async () => {
			this.plugin.settings.strongAutoSync = syncCheckbox.checked;
			await this.plugin.saveSettings();
			if (syncCheckbox.checked) {
				this.plugin.handleCursorActivity();
			}
		});

		// Line 2: Database selectors
		const row2El = headerEl.createDiv();
		row2El.style.cssText = "display: flex; gap: 6px; font-size: 0.85em; flex-wrap: wrap;";

		const createSelect = (parent: HTMLElement, label: string, defaultValue: string) => {
			const wrapper = parent.createDiv();
			wrapper.style.cssText = "display: flex; align-items: center; gap: 3px; margin-right: 4px;";
			wrapper.createSpan({ text: label }).style.cssText = "color: var(--text-muted);";
			const sel = wrapper.createEl("select");
			sel.style.cssText = "padding: 2px 4px; border-radius: 3px; border: 1px solid var(--border-color); background-color: var(--background-primary); color: var(--text-normal); max-width: 120px;";
			return sel;
		};

		this.bibleSelectKorEl = createSelect(row2El, "한글S:", this.plugin.settings.selectedStrongBibleKor);
		this.bibleSelectEngEl = createSelect(row2El, "영어S:", this.plugin.settings.selectedStrongBibleEng);
		this.lexiconSelectKorEl = createSelect(row2El, "한한:", this.plugin.settings.selectedStrongLexiconKor);
		this.lexiconSelectEngEl = createSelect(row2El, "영영:", this.plugin.settings.selectedStrongLexiconEng);

		await this.scanAndPopulateDbs();

		this.bibleSelectKorEl.value = this.plugin.settings.selectedStrongBibleKor;
		this.bibleSelectEngEl.value = this.plugin.settings.selectedStrongBibleEng;
		this.lexiconSelectKorEl.value = this.plugin.settings.selectedStrongLexiconKor;
		this.lexiconSelectEngEl.value = this.plugin.settings.selectedStrongLexiconEng;

		// --- Main Content (Split Layout: Top Bible, Bottom Lexicon) ---
		const mainSplitEl = container.createDiv({ cls: "strong-bible-main-split" });
		mainSplitEl.style.cssText = "display: flex; flex-direction: column; flex: 1; overflow: hidden;";

		// Top: Bible Verses Scroll Pane
		this.versesContainerEl = mainSplitEl.createDiv({ cls: "strong-bible-verses-pane" });
		this.versesContainerEl.style.cssText = "flex: 3; overflow-y: auto; padding: 10px; border-bottom: 3px double var(--border-color);";

		// Bottom: Lexicon Definitions Pane
		this.lexiconContainerEl = mainSplitEl.createDiv({ cls: "strong-bible-lexicon-pane" });
		this.lexiconContainerEl.style.cssText = "flex: 2; overflow-y: auto; padding: 10px; background-color: var(--background-primary);";

		this.clearLexiconView();

		// --- Event Listeners ---
		this.searchEl.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				this.performSearch(this.searchEl.value.trim());
			}
		});

		const updateSetting = async () => {
			this.plugin.settings.selectedStrongBibleKor = this.bibleSelectKorEl.value;
			this.plugin.settings.selectedStrongBibleEng = this.bibleSelectEngEl.value;
			this.plugin.settings.selectedStrongLexiconKor = this.lexiconSelectKorEl.value;
			this.plugin.settings.selectedStrongLexiconEng = this.lexiconSelectEngEl.value;
			this.plugin.settings.strongDisplayMode = this.displayModeSelectEl.value as "korean" | "english" | "both";
			await this.plugin.saveSettings();
			
			if (this.currentSearch) {
				this.performSearch(this.currentSearch);
			}
		};

		this.bibleSelectKorEl.addEventListener("change", updateSetting);
		this.bibleSelectEngEl.addEventListener("change", updateSetting);
		this.lexiconSelectKorEl.addEventListener("change", updateSetting);
		this.lexiconSelectEngEl.addEventListener("change", updateSetting);
		this.displayModeSelectEl.addEventListener("change", updateSetting);

		const winFolder = this.plugin.settings.bethlehemWinFolder;
		
		const runDictQuery = async (dctName: string, scode: string): Promise<string | null> => {
			if (!dctName) return null;
			try {
				const dbDct = await this.plugin.getDbConnection(winFolder, dctName, true);
				return dbDct.prepare("SELECT content FROM dict WHERE code = ?").get(scode)?.content || null;
			} catch (e) {
				console.error("Dictionary lookup failed:", e);
				return null;
			}
		};
	}

	async scanAndPopulateDbs() {
		let winFolder = this.plugin.settings.bethlehemWinFolder;
		if (!path.isAbsolute(winFolder)) {
			const vaultPath = (this.app.vault.adapter as any).getBasePath();
			winFolder = path.join(vaultPath, winFolder);
		}
		try {
			const stdout = await this.plugin.runPython(["scan", winFolder]);
			const data = JSON.parse(stdout.trim());
			if (data.error) {
				new Notice(`베들레헴 폴더 분석 실패: ${data.error}`);
				return;
			}

			const populate = (select: HTMLSelectElement, list: string[], fallback: string) => {
				select.empty();
				list.forEach(f => {
					select.createEl("option", { value: f, text: f });
				});
				if (list.includes(fallback)) {
					select.value = fallback;
				}
			};

			populate(this.bibleSelectKorEl, data.sdbs, this.plugin.settings.selectedStrongBibleKor);
			populate(this.bibleSelectEngEl, data.sdbs, this.plugin.settings.selectedStrongBibleEng);
			populate(this.lexiconSelectKorEl, data.dcts, this.plugin.settings.selectedStrongLexiconKor);
			populate(this.lexiconSelectEngEl, data.dcts, this.plugin.settings.selectedStrongLexiconEng);
		} catch (e) {
			console.error("Failed to scan Bethlehem Win folder:", e);
			new Notice(`베들레헴 폴더 스캔 중 오류가 발생했습니다. 파이썬 및 경로 설정을 확인하세요.\n오류: ${(e as any).message}`);
		}
	}

	clearLexiconView() {
		this.lexiconContainerEl.empty();
		const emptyMsg = this.lexiconContainerEl.createDiv();
		emptyMsg.style.cssText = "color: var(--text-muted); text-align: center; margin-top: 20px; font-style: italic;";
		emptyMsg.setText("성경 본문의 스트롱코드를 클릭하면 여기에 상세 사전 뜻이 표시됩니다.");
	}

	async performSearch(queryText: string) {
		if (!queryText) return;
		this.currentSearch = queryText;
		
		const regex = /([가-힣a-zA-Z0-9]{1,6})\s*(\d+)(?:[:：](\d+))?/;
		const match = queryText.match(regex);
		if (!match) {
			new Notice("장절 규격이 올바르지 않습니다. (예: 마 18:15 또는 창 1)");
			return;
		}

		const rawBook = match[1];
		const chapter = parseInt(match[2], 10);
		const verse = match[3] ? parseInt(match[3], 10) : null;

		const standardBook = getStandardBookCode(rawBook, this.plugin.customBookMap);
		if (!BIBLE_ORDER_MAP.has(standardBook)) {
			new Notice(`성경책명 '${rawBook}'을 매핑할 수 없습니다.`);
			return;
		}

		const bookNum = (BIBLE_ORDER_MAP.get(standardBook) || 0) + 1;

		this.versesContainerEl.empty();
		this.versesContainerEl.createEl("div", { text: "로딩 중...", cls: "loading-text" });

		const mode = this.displayModeSelectEl.value as "korean" | "english" | "both";
		let winFolder = this.plugin.settings.bethlehemWinFolder;
		if (!path.isAbsolute(winFolder)) {
			const vaultPath = (this.app.vault.adapter as any).getBasePath();
			winFolder = path.join(vaultPath, winFolder);
		}
		
		const runQuery = async (sdbName: string, dctName: string, isEnglish: boolean) => {
			if (!sdbName) return null;
			const sdbPath = path.join(winFolder, sdbName);
			const dctPath = path.join(winFolder, dctName);
			const args = ["query", sdbPath, dctPath, bookNum.toString(), chapter.toString()];
			try {
				const stdout = await this.plugin.runPython(args);
				return JSON.parse(stdout.trim()) as StrongQueryResponse;
			} catch (e) {
				console.error(`Failed query for ${sdbName}:`, e);
				return null;
			}
		};

		let korData: StrongQueryResponse | null = null;
		let engData: StrongQueryResponse | null = null;

		if (mode === "korean" || mode === "both") {
			korData = await runQuery(this.bibleSelectKorEl.value, this.lexiconSelectKorEl.value, false);
		}
		if (mode === "english" || mode === "both") {
			engData = await runQuery(this.bibleSelectEngEl.value, this.lexiconSelectEngEl.value, true);
		}

		this.versesContainerEl.empty();
		
		if (!korData && !engData) {
			this.versesContainerEl.createDiv({ text: "성경 데이터를 불러오는 데 실패했습니다.", cls: "error-text" });
			return;
		}

		this.lexiconData = {};
		if (korData && korData.lexicon) {
			Object.assign(this.lexiconData, korData.lexicon);
		}
		if (engData && engData.lexicon) {
			Object.assign(this.lexiconData, engData.lexicon);
		}

		const korVerses = korData ? korData.verses : [];
		const engVerses = engData ? engData.verses : [];
		
		const maxVerseCount = Math.max(korVerses.length, engVerses.length);
		if (maxVerseCount === 0) {
			this.versesContainerEl.createDiv({ text: "구절을 찾을 수 없습니다.", cls: "error-text" });
			return;
		}

		const korMap = new Map<number, StrongVerseData>(korVerses.map(v => [v.verse, v]));
		const engMap = new Map<number, StrongVerseData>(engVerses.map(v => [v.verse, v]));

		const allVersesSet = new Set<number>();
		korVerses.forEach(v => allVersesSet.add(v.verse));
		engVerses.forEach(v => allVersesSet.add(v.verse));
		const sortedVerseNums = Array.from(allVersesSet).sort((a, b) => a - b);

		sortedVerseNums.forEach(vNum => {
			const vBlock = this.versesContainerEl.createDiv({ cls: "strong-verse-block" });
			vBlock.style.cssText = "margin-bottom: 12px; padding: 6px; border-radius: 4px;";
			
			if (verse !== null && vNum === verse) {
				vBlock.style.backgroundColor = "var(--background-modifier-accent-alpha)";
				vBlock.addClass("target-verse");
			}

			const bookName = BIBLE_FULL_NAMES[standardBook] || standardBook;

			if (mode === "korean" || mode === "both") {
				const kv = korMap.get(vNum);
				if (kv) {
					const lineEl = vBlock.createDiv({ cls: "strong-verse-line strong-verse-kor" });
					lineEl.style.cssText = "line-height: 1.6; margin-bottom: 4px;";
					
					const refSpan = lineEl.createSpan({ text: `(${bookName} ${kv.chapter}:${kv.verse}) `, cls: "strong-verse-ref" });
					refSpan.style.cssText = "color: var(--text-accent); font-weight: bold;";
					
					this.renderTextWithStrongLinks(lineEl, kv.btext, "H");
				}
			}

			if (mode === "english" || mode === "both") {
				const ev = engMap.get(vNum);
				if (ev) {
					const lineEl = vBlock.createDiv({ cls: "strong-verse-line strong-verse-eng" });
					lineEl.style.cssText = "line-height: 1.6; color: var(--text-normal); font-style: italic;";
					
					const refSpan = lineEl.createSpan({ text: `(KJV ${ev.chapter}:${ev.verse}) `, cls: "strong-verse-ref" });
					refSpan.style.cssText = "color: var(--text-muted); font-weight: bold; font-style: normal;";
					
					this.renderTextWithStrongLinks(lineEl, ev.btext, "G");
				}
			}
		});

		setTimeout(() => {
			const targetEl = this.versesContainerEl.querySelector(".target-verse");
			if (targetEl) {
				targetEl.scrollIntoView({ block: "center", behavior: "smooth" });
			}
		}, 100);
	}

	renderTextWithStrongLinks(parentEl: HTMLElement, btext: string, defaultStrongPrefix: string) {
		const pattern = /<W([HG]\d+)>/g;
		let lastIndex = 0;
		let match;

		while ((match = pattern.exec(btext)) !== null) {
			const textPart = btext.substring(lastIndex, match.index);
			if (textPart) {
				parentEl.createSpan({ text: textPart });
			}

			const code = match[1];
			const linkEl = parentEl.createEl("a", {
				text: " " + code,
				cls: "strong-code-link"
			});
			linkEl.setAttribute("data-code", code);
			
			if (code.startsWith("G")) {
				linkEl.style.cssText = "color: #328AE1; text-decoration: underline; cursor: pointer; font-weight: bold; font-size: 0.9em; margin-right: 4px;";
			} else {
				linkEl.style.cssText = "color: #DB25B4; text-decoration: underline; cursor: pointer; font-weight: bold; font-size: 0.9em; margin-right: 4px;";
			}

			linkEl.addEventListener("click", (e) => {
				e.preventDefault();
				this.lookupStrongCode(code);
			});

			lastIndex = pattern.lastIndex;
		}

		const remainingText = btext.substring(lastIndex);
		if (remainingText) {
			parentEl.createSpan({ text: remainingText });
		}
	}

	async lookupStrongCode(code: string) {
		this.selectedStrongCode = code;
		
		this.versesContainerEl.querySelectorAll(".strong-code-link").forEach(link => {
			const c = link.getAttribute("data-code");
			if (c === code) {
				(link as HTMLElement).style.backgroundColor = "var(--text-highlight-bg)";
			} else {
				(link as HTMLElement).style.backgroundColor = "";
			}
		});

		this.lexiconContainerEl.empty();
		
		let winFolder = this.plugin.settings.bethlehemWinFolder;
		if (!path.isAbsolute(winFolder)) {
			const vaultPath = (this.app.vault.adapter as any).getBasePath();
			winFolder = path.join(vaultPath, winFolder);
		}
		
		const runDictQuery = async (dctName: string, scode: string): Promise<string | null> => {
			if (!dctName) return null;
			const dctPath = path.join(winFolder, dctName);
			const args = ["dict", dctPath, scode];
			try {
				const stdout = await this.plugin.runPython(args);
				const data = JSON.parse(stdout.trim());
				return data.definition || null;
			} catch (e) {
				return null;
			}
		};

		const korDef = await runDictQuery(this.lexiconSelectKorEl.value, code);
		const engDef = await runDictQuery(this.lexiconSelectEngEl.value, code);

		this.lexiconContainerEl.empty();
		
		const cardEl = this.lexiconContainerEl.createDiv({ cls: "strong-lexicon-card" });
		cardEl.style.cssText = "display: flex; flex-direction: column; gap: 15px;";

		const korSection = cardEl.createDiv({ cls: "lexicon-section lexicon-kor" });
		korSection.style.cssText = "border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; background-color: var(--background-secondary);";
		korSection.createEl("h4", { text: "한글원어사전", cls: "lexicon-section-title" }).style.cssText = "margin-top: 0; margin-bottom: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; color: var(--text-accent);";
		
		if (korDef) {
			const contentEl = korSection.createDiv({ cls: "lexicon-content" });
			contentEl.innerHTML = korDef.replace(/\^/g, " ");
			contentEl.style.cssText = "font-size: 0.95em; line-height: 1.5; color: var(--text-normal);";
		} else {
			korSection.createDiv({ text: "한글 사전 정보를 찾을 수 없습니다.", cls: "lexicon-empty" }).style.cssText = "color: var(--text-muted); font-style: italic;";
		}

		const engSection = cardEl.createDiv({ cls: "lexicon-section lexicon-eng" });
		engSection.style.cssText = "border: 1px solid var(--border-color); border-radius: 6px; padding: 12px; background-color: var(--background-secondary);";
		engSection.createEl("h4", { text: "영문원어사전", cls: "lexicon-section-title" }).style.cssText = "margin-top: 0; margin-bottom: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 4px; color: var(--text-muted);";
		
		if (engDef) {
			const contentEl = engSection.createDiv({ cls: "lexicon-content" });
			contentEl.innerHTML = engDef.replace(/\^/g, " ");
			contentEl.style.cssText = "font-size: 0.95em; line-height: 1.5; color: var(--text-normal);";
		} else {
			engSection.createDiv({ text: "영문 사전 정보를 찾을 수 없습니다.", cls: "lexicon-empty" }).style.cssText = "color: var(--text-muted); font-style: italic;";
		}
	}
}
